import type { ExamLevel, ExamType, ProblemUrls } from '$lib/types';
import { randomElement, range } from '$lib/utils/shuffle';

const PROXY_BASE = 'https://wandering-sky-a896.cbracketdash.workers.dev/?';

function buildUrls(filename: string): { problemUrl: string; solutionUrl: string; answerUrl: string } {
	return {
		problemUrl: `${PROXY_BASE}!${filename}`,
		solutionUrl: `${PROXY_BASE}$${filename}`,
		answerUrl: `${PROXY_BASE}|${filename}`
	};
}

function resolveExamType(level: ExamLevel): ExamType {
	if (level === 'All') {
		return randomElement<ExamType>(['8', '10', '12', 'AIME']);
	}
	return level;
}

function generateAmc8(): ProblemUrls {
	const useAjhsme = Math.random() < 0.5;
	const prob = randomElement(range(1, 26));

	if (useAjhsme) {
		const year = randomElement(range(1985, 1999));
		const filename = `${year}_AJHSME_Problems_Problem_${prob}.html`;
		return {
			...buildUrls(filename),
			problemId: `${year} AJHSME #${prob}`,
			examType: '8'
		};
	}

	const year = randomElement(range(2000, 2021));
	const filename = `${year}_AMC_8_Problems_Problem_${prob}.html`;
	return {
		...buildUrls(filename),
		problemId: `${year} AMC 8 #${prob}`,
		examType: '8'
	};
}

function generateAmc(type: '10' | '12'): ProblemUrls {
	const year = randomElement(range(2000, 2021));
	const prob = randomElement(range(1, 26));
	const hasVariant = year >= 2002;

	if (hasVariant) {
		const variant = randomElement(['A', 'B']);
		const filename = `${year}_AMC_${type}${variant}_Problems_Problem_${prob}.html`;
		return {
			...buildUrls(filename),
			problemId: `${year} AMC ${type}${variant} #${prob}`,
			examType: type
		};
	}

	const filename = `${year}_AMC_${type}_Problems_Problem_${prob}.html`;
	return {
		...buildUrls(filename),
		problemId: `${year} AMC ${type} #${prob}`,
		examType: type
	};
}

function generateAime(): ProblemUrls {
	const year = randomElement(range(1983, 2021));
	const prob = randomElement(range(1, 16));
	const hasVariant = year >= 2000;

	if (hasVariant) {
		const variant = randomElement(['I', 'II']);
		const filename = `${year}_AIME_${variant}_Problems_Problem_${prob}.html`;
		return {
			...buildUrls(filename),
			problemId: `${year} AIME ${variant} #${prob}`,
			examType: 'AIME'
		};
	}

	const filename = `${year}_AIME_Problems_Problem_${prob}.html`;
	return {
		...buildUrls(filename),
		problemId: `${year} AIME #${prob}`,
		examType: 'AIME'
	};
}

export function generateProblemUrls(level: ExamLevel): ProblemUrls {
	const examType = resolveExamType(level);

	switch (examType) {
		case '8':
			return generateAmc8();
		case '10':
			return generateAmc('10');
		case '12':
			return generateAmc('12');
		case 'AIME':
			return generateAime();
	}
}
