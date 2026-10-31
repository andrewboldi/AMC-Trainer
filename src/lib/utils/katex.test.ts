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
import { stripDelimiters, typesetAlt } from './katex';

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

/**
 * Asymptote diagrams are `latexcenter` images: the wiki renders each one to a PNG and keeps the
 * [asy] source as its alt. That source is not LaTeX, but a lot of it is still valid KaTeX input,
 * so "KaTeX threw" does not reliably keep the PNG. In the scraped corpus 671 of 2,094 diagrams
 * (265 problem statements) typeset without error and replaced the picture with a run of italic
 * code -- 2022 AMC 8 #23, 2023 AMC 8 #9 and 2022 AMC 12B #18 among them. The other 1,423 kept
 * their PNG only because a label("$A$", ...) put a `$` in the source, which KaTeX rejects.
 *
 * Real alt values from the corpus, HTML-decoded the way getAttribute returns them.
 */
const REAL_ASY = {
	'2022 AMC 8 #23': '[asy] //diagram size(5cm); defaultpen(linewidth(1.5)); real r = 0.37; path equi = r * dir(-30) -- (r+0.03) * dir(90) -- r * dir(210) -- cycle; draw((0,0)--(0,3)--(3,3)--(3,0)--cycle); draw((0,1)--(3,1)--(3,2)--(0,2)--cycle); draw((1,0)--(1,3)--(2,3)--(2,0)--cycle); draw(circle((3/2,5/2),1/3)); draw(circle((5/2,1/2),1/3)); draw(circle((3/2,3/2),1/3)); draw(shift(0.5,0.38) * equi); draw(shift(1.5,0.38) * equi); draw(shift(0.5,1.38) * equi); draw(shift(2.5,1.38) * equi); draw(shift(0.5,2.38) * equi); draw(shift(2.5,2.38) * equi); [/asy]',
	'2023 AMC 8 #9': '[asy] // Diagram by TheMathGuyd. Found cubic, so graph is perfect. import graph; size(8cm); int i; for(i=1; i<9; i=i+1) { draw((-0.2,2i-1)--(16.2,2i-1), mediumgrey); draw((2i-1,-0.2)--(2i-1,16.2), mediumgrey); draw((-0.2,2i)--(16.2,2i), grey); draw((2i,-0.2)--(2i,16.2), grey); } Label f;  f.p=fontsize(6);  xaxis(-0.5,17.8,Ticks(f, 2.0),Arrow());  yaxis(-0.5,17.8,Ticks(f, 2.0),Arrow());  real f(real x)  {  return -0.03125 x^(3) + 0.75x^(2) - 5.125 x + 14.5;  }  draw(graph(f,0,15.225),currentpen+1); real dpt=2; real ts=0.75; transform st=scale(ts); label(rotate(90)*st*"Elevation (meters)",(-dpt,8)); label(st*"Time (seconds)",(8,-dpt)); [/asy]',
	'2022 AMC 12B #18': '[asy]         import geometry;         unitsize(0.6cm);          void ds(pair x) {             filldraw(x -- (1,0) + x -- (1,1) + x -- (0,1)+x -- cycle,mediumgray,invisible);         }          ds((1,1));         ds((2,1));         ds((3,1));         ds((1,3));          for (int i = 0; i <= 5; ++i) {             draw((0,i)--(5,i));             draw((i,0)--(i,5));         }          label("Initial", (2.5,-1));         draw((6,2.5)--(8,2.5),Arrow);          ds((10,2));         ds((11,1));         ds((11,0));          for (int i = 0; i <= 5; ++i) {             draw((9,i)--(14,i));             draw((i+9,0)--(i+9,5));         }          label("Transformed", (11.5,-1)); [/asy]',
};
// KaTeX rejects this one because of the `$` in its label, so it always kept its PNG.
const REAL_ASY_DOLLAR_LABEL = '[asy] draw(Arc((0,0), 4, 0, 270)); draw((0,-4)--(0,0)--(4,0)); label("$4$", (2,0), S); [/asy]';

/** Would renderLatexInContainer replace this image? A boolean keeps a failure from dumping KaTeX markup. */
const isTypeset = (alt: string, centered = false) => typesetAlt(alt, centered) !== null;

describe('Asymptote diagrams keep the wiki image', () => {
	it('KaTeX accepts the source as math, so a thrown error cannot be what keeps the PNG', () => {
		for (const alt of Object.values(REAL_ASY)) {
			const { latex, displayMode } = stripDelimiters(alt, true);
			expect(() => katex.renderToString(latex, { throwOnError: true, displayMode, output: 'html' })).not.toThrow();
		}
	});

	for (const [problem, alt] of Object.entries(REAL_ASY)) {
		it(`is not typeset for ${problem}`, () => {
			expect(isTypeset(alt, true)).toBe(false);
		});
	}

	it('is not typeset when KaTeX would have rejected the source anyway', () => {
		expect(isTypeset(REAL_ASY_DOLLAR_LABEL, true)).toBe(false);
	});

	it('ignores leading whitespace, as stripDelimiters does', () => {
		expect(isTypeset(`\n  ${REAL_ASY['2022 AMC 8 #23']}`, true)).toBe(false);
	});

	it('only applies to alts that start with [asy]', () => {
		expect(isTypeset(String.raw`$\text{see [asy]}$`)).toBe(true);
	});
});

describe('typesetAlt', () => {
	it('typesets inline math as inline KaTeX', () => {
		const typeset = typesetAlt(String.raw`$5 \times 5$`);
		expect(typeset?.displayMode).toBe(false);
		expect(typeset?.html).toContain('class="katex"');
	});

	it('typesets a centered image as display math even without delimiters', () => {
		expect(typesetAlt('x^2 + y^2 = z^2', true)?.displayMode).toBe(true);
	});

	it('typesets a bare align block as display math', () => {
		expect(typesetAlt(REAL.alignStar, true)?.displayMode).toBe(true);
	});

	it('leaves prose the wiki rendered as an image alone', () => {
		const prose = String.raw`Manually, we can find \( D_1 = 10 \), and so \[ x = 1 \] follows.`;
		expect(isTypeset(prose, true)).toBe(false);
	});
});
