import katex from 'katex';

/**
 * Process a DOM container to replace <img class="latex"> elements
 * with KaTeX-rendered math. Leaves non-latex images (diagrams, figures) untouched.
 * Also hides [asy] Asymptote source blocks that can't be rendered client-side.
 *
 * The AoPS-scraped HTML stores LaTeX source in the `alt` attribute
 * of images with class="latex". Supported delimiters:
 *   $...$       inline math
 *   $$...$$     display math
 *   \[...\]     display math
 *   \(...\)     inline math
 *   bare text   treated as inline math
 */

function stripDelimiters(alt: string): { latex: string; displayMode: boolean } {
	let latex = alt.trim();
	let displayMode = false;

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

	return { latex, displayMode };
}

export function renderLatexInContainer(container: HTMLElement): void {
	// Replace <img class="latex"> with KaTeX
	const images = container.querySelectorAll<HTMLImageElement>('img.latex');

	for (const img of images) {
		const alt = img.getAttribute('alt');
		if (!alt) continue;

		const { latex, displayMode } = stripDelimiters(alt);

		try {
			const rendered = katex.renderToString(latex, {
				throwOnError: false,
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
			// If KaTeX fails, leave the original image in place
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
