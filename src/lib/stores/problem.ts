import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ProblemState, ProblemFilter } from '$lib/types';
import { fetchRandomProblem, fetchProblemById } from '$lib/services/aopsClient';
import { validateAnswer } from '$lib/services/answerValidator';
import { streak } from './streak';
import { stats } from './stats';

const RECENT_KEY = 'recentProblemIds';
const RECENT_MAX = 50;

function getRecentIds(): number[] {
	if (!browser) return [];
	try {
		return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
	} catch { return []; }
}

function addRecentId(id: number): void {
	if (!browser) return;
	const recent = getRecentIds();
	if (!recent.includes(id)) {
		recent.push(id);
		if (recent.length > RECENT_MAX) recent.shift();
	}
	localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

const EMPTY_STATE: ProblemState = {
	id: 0,
	problemId: '',
	problemHtml: '',
	solutionHtml: '',
	correctAnswer: '',
	examType: '',
	subject: null,
	difficulty: 0,
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
		const recent = getRecentIds();
		let data = await fetchRandomProblem(filter);
		for (let i = 0; i < 3 && recent.includes(data.id); i++) {
			data = await fetchRandomProblem(filter);
		}
		addRecentId(data.id);

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
			subject: data.subject,
			difficulty: data.difficulty,
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
			subject: data.subject,
			difficulty: data.difficulty,
			status: 'answering'
		});
	} catch {
		problem.update((s) => ({ ...s, status: 'error' }));
	}
}

export async function loadProblemById(id: number): Promise<void> {
	problem.set({ ...EMPTY_STATE, status: 'loading' });
	try {
		const data = await fetchProblemById(id);
		problem.set({
			id: data.id,
			problemId: formatProblemId(data.examName, data.year, data.problemNum),
			problemHtml: data.problemHtml,
			solutionHtml: data.solutionHtml,
			correctAnswer: data.answer,
			examType: data.examName.includes('AIME') ? 'AIME' : 'AMC',
			subject: data.subject,
			difficulty: data.difficulty,
			status: 'answering'
		});
		if (browser) localStorage.setItem('savedProblemId', data.id.toString());
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
		stats.record(state.id, state.subject, state.difficulty, true);
		problem.update((s) => ({ ...s, status: 'correct' }));
		if (browser) localStorage.removeItem('savedProblemId');
	} else if (result === 'incorrect') {
		streak.reset();
		stats.record(state.id, state.subject, state.difficulty, false);
	}

	return result;
}

export function giveUp(): void {
	streak.reset();
	problem.update((s) => ({ ...s, status: 'gave_up' }));
	if (browser) localStorage.removeItem('savedProblemId');
}
