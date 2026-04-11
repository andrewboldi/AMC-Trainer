import katex from 'katex';

/**
 * Process a DOM container to replace <img class="latex"> elements
 * with KaTeX-rendered math. Leaves non-latex images (diagrams, figures) untouched.
 *
 * The AoPS-scraped HTML stores LaTeX source in the `alt` attribute
 * of images with class="latex", e.g.:
 *   <img class="latex" alt="$x^2 + 1$" src="...latex.artofproblemsolving.com/..." />
 */
export function renderLatexInContainer(container: HTMLElement): void {
	const images = container.querySelectorAll<HTMLImageElement>('img.latex');

	for (const img of images) {
		const alt = img.getAttribute('alt');
		if (!alt) continue;

		// Strip surrounding $ or $$ delimiters
		let latex = alt;
		let displayMode = false;

		if (latex.startsWith('$$') && latex.endsWith('$$')) {
			latex = latex.slice(2, -2);
			displayMode = true;
		} else if (latex.startsWith('$') && latex.endsWith('$')) {
			latex = latex.slice(1, -1);
		}

		try {
			const rendered = katex.renderToString(latex, {
				throwOnError: false,
				displayMode,
				output: 'html',
			});
			const span = document.createElement('span');
			span.innerHTML = rendered;
			span.className = 'katex-rendered';
			img.replaceWith(span);
		} catch {
			// If KaTeX fails, leave the original image in place
		}
	}
}
