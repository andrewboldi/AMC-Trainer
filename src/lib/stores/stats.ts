import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AnswerRecord {
	problemId: number;
	subject: string | null;
	difficulty: number;
	correct: boolean;
	timestamp: number;
}

const STATS_KEY = 'answerHistory';
const MISSED_KEY = 'missedProblemIds';

function load<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch { return fallback; }
}

function save(key: string, value: unknown): void {
	if (browser) localStorage.setItem(key, JSON.stringify(value));
}

function createStatsStore() {
	const history = writable<AnswerRecord[]>(load(STATS_KEY, []));
	const missed = writable<number[]>(load(MISSED_KEY, []));

	history.subscribe((v) => save(STATS_KEY, v));
	missed.subscribe((v) => save(MISSED_KEY, v));

	return {
		history,
		missed,

		record(problemId: number, subject: string | null, difficulty: number, correct: boolean) {
			history.update((h) => {
				h.push({ problemId, subject, difficulty, correct, timestamp: Date.now() });
				if (h.length > 500) h.shift();
				return h;
			});
			if (!correct) {
				missed.update((m) => {
					if (!m.includes(problemId)) m.push(problemId);
					return m;
				});
			} else {
				missed.update((m) => m.filter((id) => id !== problemId));
			}
		},

		getMissedIds(): number[] {
			return load(MISSED_KEY, []);
		},

		clear() {
			history.set([]);
			missed.set([]);
		}
	};
}

export const stats = createStatsStore();
