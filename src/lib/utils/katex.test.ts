/**
 * Tests for LaTeX delimiter/environment handling.
 *
 * The AoPS wiki stores align blocks bare -- alt="\begin{align*} ... \end{align*}"
 * with no $$ or \[ wrapper -- so they used to fall through every delimiter branch
 * and reach KaTeX in inline mode, which refuses: "{align*} can be used only in
 * display mode". 1,663 occurrences across the scraped corpus rendered as red
 * error text instead of math.
 *
 * The LaTeX strings below are real alt values taken from the scraped corpus.
 */
import { describe, it, expect } from 'bun:test';
import katex from 'katex';
import { stripDelimiters } from './katex';

/** Does this actually render, or does KaTeX emit its error markup? */
function rendersCleanly(alt: string): boolean {
	const { latex, displayMode } = stripDelimiters(alt);
	const html = katex.renderToString(latex, { throwOnError: false, displayMode, output: 'html' });
	return !html.includes('katex-error');
}

function rendersCleanly2(alt: string, centered: boolean): boolean {
	const { latex, displayMode } = stripDelimiters(alt, centered);
	const html = katex.renderToString(latex, { throwOnError: false, displayMode, output: 'html' });
	return !html.includes('katex-error');
}

const REAL = {
	alignStar: String.raw`\begin{align*} a \, \blacklozenge \, b &= a^2 - b^2\\ a \, \bigstar \, b &= (a - b)^2 \end{align*}`,
	align: String.raw`\begin{align} x^2 &= 9+10z \\ x^2 &= 100+3y \\ xz &= 42+10x \end{align}`,
	alignat: String.raw`\begin{alignat*}{8} a+b+c &= -\frac{B}{A} &&= \frac{39}{10}, \\ ab+ac+bc &= \hspace{2mm}\frac{C}{A} &&= \frac{29}{10}, \\ abc &= -\frac{D}{A} &&= \frac{6}{10}. \end{alignat*}`,
	eqnarray: String.raw`\begin{eqnarray*}X &=& 10+12+14+\cdots+100,\\ Y &=& 12+14+16+\cdots+102.\end{eqnarray*}`,
};

describe('bare display-only environments', () => {
	it('puts \\begin{align*} into display mode', () => {
		expect(stripDelimiters(REAL.alignStar).displayMode).toBe(true);
	});

	it('puts \\begin{align} into display mode', () => {
		expect(stripDelimiters(REAL.align).displayMode).toBe(true);
	});

	it('puts \\begin{alignat*} into display mode', () => {
		expect(stripDelimiters(REAL.alignat).displayMode).toBe(true);
	});

	it('covers the other display-only environments KaTeX supports', () => {
		for (const env of ['align', 'align*', 'alignat', 'alignat*', 'gather', 'gather*', 'equation', 'equation*', 'CD']) {
			const alt = `\\begin{${env}} a = b \\end{${env}}`;
			expect(stripDelimiters(alt).displayMode).toBe(true);
		}
	});

	it('tolerates leading whitespace before the environment', () => {
		expect(stripDelimiters(`   ${REAL.alignStar}`).displayMode).toBe(true);
	});

	it('renders all of them without KaTeX error markup', () => {
		expect(rendersCleanly(REAL.alignStar)).toBe(true);
		expect(rendersCleanly(REAL.align)).toBe(true);
		expect(rendersCleanly(REAL.alignat)).toBe(true);
	});
});

describe('eqnarray has no KaTeX equivalent, so it is rewritten', () => {
	it('rewrites eqnarray* to align* and uses display mode', () => {
		const { latex, displayMode } = stripDelimiters(REAL.eqnarray);
		expect(latex).toContain('\\begin{align*}');
		expect(latex).toContain('\\end{align*}');
		expect(latex).not.toContain('eqnarray');
		expect(displayMode).toBe(true);
	});

	it('rewrites the unstarred eqnarray too', () => {
		const { latex } = stripDelimiters(String.raw`\begin{eqnarray} a &=& b \end{eqnarray}`);
		expect(latex).not.toContain('eqnarray');
		expect(latex).toContain('\\begin{align*}');
	});

	it('rewrites eqnarray even when it is already wrapped in $$', () => {
		const { latex, displayMode } = stripDelimiters(String.raw`$$\begin{eqnarray*} a &=& b \end{eqnarray*}$$`);
		expect(latex).not.toContain('eqnarray');
		expect(displayMode).toBe(true);
	});

	it('renders after the rewrite', () => {
		expect(rendersCleanly(REAL.eqnarray)).toBe(true);
	});
});

describe('existing delimiter handling is unchanged', () => {
	it('strips $$ as display math', () => {
		expect(stripDelimiters('$$x^2$$')).toEqual({ latex: 'x^2', displayMode: true });
	});

	it('strips \\[ \\] as display math', () => {
		expect(stripDelimiters(String.raw`\[x^2\]`)).toEqual({ latex: 'x^2', displayMode: true });
	});

	it('strips \\( \\) as inline math', () => {
		expect(stripDelimiters(String.raw`\(x^2\)`)).toEqual({ latex: 'x^2', displayMode: false });
	});

	it('strips single $ as inline math', () => {
		expect(stripDelimiters('$x^2$')).toEqual({ latex: 'x^2', displayMode: false });
	});

	it('leaves bare text as inline math', () => {
		expect(stripDelimiters('x^2')).toEqual({ latex: 'x^2', displayMode: false });
	});

	it('leaves environments that work inline in inline mode', () => {
		// aligned/cases/array/matrices render fine inline; do not promote them.
		for (const env of ['aligned', 'cases', 'array', 'bmatrix', 'pmatrix', 'vmatrix', 'matrix', 'split']) {
			const alt = `$\\begin{${env}}a\\end{${env}}$`;
			expect(stripDelimiters(alt).displayMode).toBe(false);
		}
	});

	it('keeps display mode for a delimited environment that already had it', () => {
		const { displayMode } = stripDelimiters(String.raw`\[\begin{split} a &= b \end{split}\]`);
		expect(displayMode).toBe(true);
	});
});

describe('latexcenter images are display blocks', () => {
	it('starts centered images in display mode even with no delimiters', () => {
		expect(stripDelimiters('x^2 + y^2 = z^2', true).displayMode).toBe(true);
	});

	it('keeps display mode for a centered \\[ ... \\] block', () => {
		expect(stripDelimiters(String.raw`\[x^2\]`, true)).toEqual({ latex: 'x^2', displayMode: true });
	});

	it('still strips delimiters normally when centered', () => {
		expect(stripDelimiters(String.raw`\[\frac{1}{2}\]`, true).latex).toBe(String.raw`\frac{1}{2}`);
	});

	it('leaves uncentered math inline by default', () => {
		expect(stripDelimiters('x^2').displayMode).toBe(false);
		expect(stripDelimiters('x^2', false).displayMode).toBe(false);
	});

	it('renders the real bare display blocks the wiki centers', () => {
		expect(rendersCleanly2('x^2 + y^2 = z^2', true)).toBe(true);
		expect(rendersCleanly2(REAL.alignStar, true)).toBe(true);
		expect(rendersCleanly2(REAL.eqnarray, true)).toBe(true);
	});

	it('throws rather than emitting error markup for untypesettable content', () => {
		// This is what keeps the wiki's PNG in place instead of showing red errors.
		const prose = String.raw`Manually, we can find \( D_1 = 10 \), and so \[ x = 1 \] follows.`;
		const { latex, displayMode } = stripDelimiters(prose, true);
		expect(() => katex.renderToString(latex, { throwOnError: true, displayMode, output: 'html' })).toThrow();
	});
});

describe('promotion is one-way', () => {
	it('promotes an inline-wrapped align, since it cannot render inline', () => {
		const { displayMode } = stripDelimiters(String.raw`$\begin{align*} a &= b \end{align*}$`);
		expect(displayMode).toBe(true);
	});
});
