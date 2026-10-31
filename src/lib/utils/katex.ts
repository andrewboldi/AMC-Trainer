import katex from 'katex';

/**
 * Process a DOM container to replace the wiki's pre-rendered math images with
 * KaTeX. Leaves non-math images (diagrams, figures) untouched.
 *
 * The wiki uses two classes: `latex` for inline math and `latexcenter` for
 * centered display blocks. Only `latex` used to be selected, so every display
 * block -- around 18.7k of them, including all the align environments -- stayed
 * a proxied PNG instead of being typeset.
 * Also hides [asy] Asymptote source blocks that can't be rendered client-side.
 *
 * The AoPS-scraped HTML stores LaTeX source in the `alt` attribute
 * of images with class="latex". Supported delimiters:
 *   $...$       inline math
 *   $$...$$     display math
 *   \[...\]     display math
 *   \(...\)     inline math
 *   bare text   treated as inline math
 *
 * A `latexcenter` image is a centered block, so it starts in display mode
 * regardless of which delimiters (if any) the wiki wrapped it in.
 *
 * Display-only environments (\begin{align*} and friends) are stored bare by the
 * wiki, with no delimiter at all, so they are detected separately below.
 */

/**
 * Environments KaTeX will only parse in display mode -- used inline it refuses
 * outright with "{align*} can be used only in display mode", which surfaces as
 * red error text rather than math. The AoPS wiki emits these with no $$ or \[
 * wrapper, so no delimiter branch would ever set display mode for them.
 *
 * Deliberately excludes environments that render fine inline (aligned, cases,
 * array, the matrix family, split) and `multline`, which KaTeX does not implement.
 */
const DISPLAY_ONLY_ENV = /^\\begin\{(?:align|alignat|gather|equation|CD)\*?\}/;

export function stripDelimiters(alt: string, centered = false): { latex: string; displayMode: boolean } {
	let latex = alt.trim();
	let displayMode = centered;

	if (latex.startsWith('$$') && latex.endsWith('$$')) {
		latex = latex.slice(2, -2);
		displayMode = true;
	} else if (latex.startsWith('\\[') && latex.endsWith('\\]')) {
		latex = latex.slice(2, -2);
		displayMode = true;
	} else if (latex.startsWith('\\(') && latex.endsWith('\\)')) {
		latex = latex.slice(2, -2);
	} else if (latex.startsWith('$') && latex.endsWith('$')) {
		latex = latex.slice(1, -1);
	}

	// KaTeX has no eqnarray environment at all, so these render as "No such
	// environment" in either mode. align* is the closest equivalent and accepts
	// the same &=& row separators.
	latex = latex.replace(/\\(begin|end)\{eqnarray\*?\}/g, '\\$1{align*}');

	// Promotion is one-way: an environment that cannot render inline forces
	// display mode, but nothing here demotes math that was already display.
	if (DISPLAY_ONLY_ENV.test(latex.trimStart())) {
		displayMode = true;
	}

	return { latex, displayMode };
}

/**
 * What to do with one image's alt text: the typeset KaTeX markup, or `null` to leave
 * the wiki's pre-rendered image exactly as it is.
 */
export function typesetAlt(alt: string, centered = false): { html: string; displayMode: boolean } | null {
	// Asymptote diagrams are `latexcenter` images too, with the [asy] source as their alt.
	// That source is not LaTeX, but KaTeX parses a lot of it anyway and would typeset it as
	// a run of italic code in place of the diagram, so it cannot be left to the catch below.
	// Trimmed first so this sees the same text stripDelimiters does.
	if (alt.trimStart().startsWith('[asy]')) return null;

	const { latex, displayMode } = stripDelimiters(alt, centered);

	try {
		// throwOnError, so anything KaTeX cannot typeset lands in the catch below
		// and keeps the wiki's own image. With it off KaTeX returns error markup
		// rather than throwing, and prose, tabular or tikzpicture blocks would
		// render as red error text.
		const html = katex.renderToString(latex, {
			throwOnError: true,
			displayMode,
			output: 'html',
		});
		return { html, displayMode };
	} catch {
		// Not typesettable (prose, tabular, tikzpicture...) -- leave the wiki's
		// pre-rendered image exactly as it is.
		return null;
	}
}

export function renderLatexInContainer(container: HTMLElement): void {
	const images = container.querySelectorAll<HTMLImageElement>('img.latex, img.latexcenter');

	for (const img of images) {
		const alt = img.getAttribute('alt');
		if (!alt) continue;

		const typeset = typesetAlt(alt, img.classList.contains('latexcenter'));
		if (!typeset) continue;

		if (typeset.displayMode) {
			const div = document.createElement('div');
			div.innerHTML = typeset.html;
			div.className = 'katex-rendered katex-display-block';
			img.replaceWith(div);
		} else {
			const span = document.createElement('span');
			span.innerHTML = typeset.html;
			span.className = 'katex-rendered';
			img.replaceWith(span);
		}
	}

	// Remove Table of Contents blocks injected by the AoPS wiki
	const tocElements = container.querySelectorAll('.toc, #toc, [id*="toctitle"]');
	for (const toc of tocElements) {
		toc.remove();
	}
	// Remove any element whose only text content is "Contents"
	// (may be a heading, div, span, or other wrapper)
	const allElements = container.querySelectorAll('*');
	for (const el of allElements) {
		const text = el.textContent?.trim();
		if (text === 'Contents' && el.children.length === 0) {
			el.remove();
		}
	}

	// Hide [asy] Asymptote source code blocks (can't render client-side)
	// These appear as raw text in <p> elements
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
	const asyNodes: Text[] = [];
	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		if (node.textContent?.includes('[asy]')) {
			asyNodes.push(node);
		}
	}

	for (const textNode of asyNodes) {
		const parent = textNode.parentElement;
		if (!parent) continue;
		const html = parent.innerHTML;
		// Remove everything between [asy] and [/asy]
		const cleaned = html.replace(/\[asy\][\s\S]*?\[\/asy\]/g, '<em style="color: #999;">[Diagram]</em>');
		if (cleaned !== html) {
			parent.innerHTML = cleaned;
		}
	}
}
