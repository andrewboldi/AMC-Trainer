/**
 * AMC Trainer API client.
 *
 * Communicates with the Cloudflare Worker REST API backed by D1.
 * Single request per problem — no more 3-fetch pattern or response cleaning.
 */

import type { ProblemFilter, ProblemResponse } from '$lib/types';

const API_BASE = 'https://wandering-sky-a896.cbracketdash.workers.dev';

export async function fetchRandomProblem(params: ProblemFilter): Promise<ProblemResponse> {
	const query = new URLSearchParams();
	query.set('level', params.level);
	if (params.subject) query.set('subject', params.subject);
	if (params.difficultyMin !== undefined) query.set('difficulty_min', params.difficultyMin.toString());
	if (params.difficultyMax !== undefined) query.set('difficulty_max', params.difficultyMax.toString());

	const res = await fetch(`${API_BASE}/api/problem/random?${query}`);
	if (!res.ok) {
		const body = await res.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error((body as { error: string }).error ?? `HTTP ${res.status}`);
	}
	return res.json();
}

export async function fetchProblemById(id: number): Promise<ProblemResponse> {
	const res = await fetch(`${API_BASE}/api/problem/${id}`);
	if (!res.ok) {
		throw new Error(`Problem ${id} not found`);
	}
	return res.json();
}
