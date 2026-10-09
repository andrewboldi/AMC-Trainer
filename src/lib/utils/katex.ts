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

export function renderLatexInContainer(container: HTMLElement): void {
	const images = container.querySelectorAll<HTMLImageElement>('img.latex, img.latexcenter');

	for (const img of images) {
		const alt = img.getAttribute('alt');
		if (!alt) continue;

		const { latex, displayMode } = stripDelimiters(alt, img.classList.contains('latexcenter'));

		try {
			// throwOnError, so anything KaTeX cannot typeset lands in the catch below
			// and keeps the wiki's own image. With it off KaTeX returns error markup
			// rather than throwing, and roughly 1.4k blocks that are prose, tabular,
			// tikzpicture or [asy] source would render as red error text.
			const rendered = katex.renderToString(latex, {
				throwOnError: true,
				displayMode,
				output: 'html',
			});

			if (displayMode) {
				const div = document.createElement('div');
				div.innerHTML = rendered;
				div.className = 'katex-rendered katex-display-block';
				img.replaceWith(div);
			} else {
				const span = document.createElement('span');
				span.innerHTML = rendered;
				span.className = 'katex-rendered';
				img.replaceWith(span);
			}
		} catch {
			// Not typesettable (prose, tabular, tikzpicture, [asy] source...) --
			// leave the wiki's pre-rendered image exactly as it is.
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
