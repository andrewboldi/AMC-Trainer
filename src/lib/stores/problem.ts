import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ExamLevel, ExamType, ProblemState } from '$lib/types';
import { generateProblemUrls } from '$lib/services/problemGenerator';
import { fetchProblem, fetchSolution, fetchAnswer } from '$lib/services/aopsClient';
import { validateAnswer } from '$lib/services/answerValidator';
import { streak } from './streak';

const EMPTY_STATE: ProblemState = {
	problemId: '',
	problemHtml: '',
	solutionHtml: '',
	correctAnswer: '',
	examType: '8',
	status: 'loading'
};

export const problem = writable<ProblemState>(EMPTY_STATE);

export async function loadNewProblem(level: ExamLevel): Promise<void> {
	const urls = generateProblemUrls(level);

	problem.set({
		problemId: urls.problemId,
		problemHtml: '',
		solutionHtml: '',
		correctAnswer: '',
		examType: urls.examType,
		status: 'loading'
	});

	if (browser) {
		localStorage.setItem('problem', urls.problemUrl);
		localStorage.setItem('answer', urls.answerUrl);
		localStorage.setItem('problemID', urls.problemId);
		localStorage.setItem('problemType', urls.examType);
	}

	try {
		const [problemHtml, solutionHtml, correctAnswer] = await Promise.all([
			fetchProblem(urls.problemUrl),
			fetchSolution(urls.solutionUrl),
			fetchAnswer(urls.answerUrl)
		]);

		problem.set({
			problemId: urls.problemId,
			problemHtml,
			solutionHtml,
			correctAnswer,
			examType: urls.examType,
			status: 'answering'
		});
	} catch {
		problem.update((s) => ({ ...s, status: 'error' }));
	}
}

export async function loadSavedProblem(): Promise<void> {
	if (!browser) return;

	const problemUrl = localStorage.getItem('problem') || '';
	const answerUrl = localStorage.getItem('answer') || '';
	const problemId = localStorage.getItem('problemID') || '';
	const examType = (localStorage.getItem('problemType') || '8') as ExamType;

	if (!problemUrl) {
		return;
	}

	problem.set({
		problemId,
		problemHtml: '',
		solutionHtml: '',
		correctAnswer: '',
		examType,
		status: 'loading'
	});

	const solutionUrl = problemUrl.replaceAll('!', '$');

	try {
		const [problemHtml, solutionHtml, correctAnswer] = await Promise.all([
			fetchProblem(problemUrl),
			fetchSolution(solutionUrl),
			fetchAnswer(answerUrl)
		]);

		problem.set({
			problemId,
			problemHtml,
			solutionHtml,
			correctAnswer,
			examType,
			status: 'answering'
		});
	} catch {
		problem.update((s) => ({ ...s, status: 'error' }));
	}
}

export function submitAnswer(userAnswer: string): 'correct' | 'incorrect' | 'invalid_format' {
	const state = get(problem);
	const result = validateAnswer(userAnswer, state.correctAnswer, state.examType);

	if (result === 'correct') {
		streak.increment();
		problem.update((s) => ({ ...s, status: 'correct' }));
		if (browser) localStorage.removeItem('problem');
	} else if (result === 'incorrect') {
		streak.reset();
		// Don't change status — user keeps trying. Shake handled by UI.
	}

	return result;
}

export function giveUp(): void {
	streak.reset();
	problem.update((s) => ({ ...s, status: 'gave_up' }));
	if (browser) localStorage.removeItem('problem');
}
