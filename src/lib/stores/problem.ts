import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ProblemState, ProblemFilter } from '$lib/types';
import { fetchRandomProblem, fetchProblemById } from '$lib/services/aopsClient';
import { validateAnswer } from '$lib/services/answerValidator';
import { streak } from './streak';

const EMPTY_STATE: ProblemState = {
	id: 0,
	problemId: '',
	problemHtml: '',
	solutionHtml: '',
	correctAnswer: '',
	examType: '',
	status: 'loading'
};

export const problem = writable<ProblemState>(EMPTY_STATE);

function formatProblemId(examName: string, year: number, num: number): string {
	const display = examName.replace(/_/g, ' ');
	return `${year} ${display} #${num}`;
}

export async function loadNewProblem(filter: ProblemFilter): Promise<void> {
	problem.set({ ...EMPTY_STATE, status: 'loading' });

	try {
		const data = await fetchRandomProblem(filter);

		if (browser) {
			localStorage.setItem('savedProblemId', data.id.toString());
		}

		problem.set({
			id: data.id,
			problemId: formatProblemId(data.examName, data.year, data.problemNum),
			problemHtml: data.problemHtml,
			solutionHtml: data.solutionHtml,
			correctAnswer: data.answer,
			examType: data.examName.includes('AIME') ? 'AIME' : 'AMC',
			status: 'answering'
		});
	} catch {
		problem.update((s) => ({ ...s, status: 'error' }));
	}
}

export async function loadSavedProblem(): Promise<void> {
	if (!browser) return;

	const savedId = localStorage.getItem('savedProblemId');
	if (!savedId) return;

	problem.set({ ...EMPTY_STATE, status: 'loading' });

	try {
		const data = await fetchProblemById(parseInt(savedId, 10));

		problem.set({
			id: data.id,
			problemId: formatProblemId(data.examName, data.year, data.problemNum),
			problemHtml: data.problemHtml,
			solutionHtml: data.solutionHtml,
			correctAnswer: data.answer,
			examType: data.examName.includes('AIME') ? 'AIME' : 'AMC',
			status: 'answering'
		});
	} catch {
		problem.update((s) => ({ ...s, status: 'error' }));
	}
}

export function submitAnswer(userAnswer: string): 'correct' | 'incorrect' | 'invalid_format' {
	const state = get(problem);
	const examType = state.examType === 'AIME' ? 'AIME' : '8';
	const result = validateAnswer(userAnswer, state.correctAnswer, examType as '8' | '10' | '12' | 'AIME');

	if (result === 'correct') {
		streak.increment();
		problem.update((s) => ({ ...s, status: 'correct' }));
		if (browser) localStorage.removeItem('savedProblemId');
	} else if (result === 'incorrect') {
		streak.reset();
	}

	return result;
}

export function giveUp(): void {
	streak.reset();
	problem.update((s) => ({ ...s, status: 'gave_up' }));
	if (browser) localStorage.removeItem('savedProblemId');
}
