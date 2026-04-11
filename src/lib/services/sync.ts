import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { getIdToken } from './auth';
import { settings } from '$lib/stores/settings';
import { stats } from '$lib/stores/stats';
import { bookmarks } from '$lib/stores/bookmarks';
import { user } from '$lib/stores/user';

const API_BASE = 'https://wandering-sky-a896.cbracketdash.workers.dev';

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
	const token = await getIdToken();
	if (!token) throw new Error('Not signed in');
	return fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});
}

export async function loadFromCloud(): Promise<void> {
	if (!browser) return;
	const u = get(user);
	if (!u.signedIn) return;

	try {
		const res = await authFetch('/api/user/data');
		if (!res.ok) return;
		const data = await res.json() as {
			settings: Record<string, unknown> | null;
			stats: unknown[] | null;
			missedIds: number[] | null;
			bookmarks: number[] | null;
		};

		if (data.settings) {
			settings.update((s) => ({ ...s, ...data.settings }));
		}
		if (data.stats && Array.isArray(data.stats)) {
			stats.history.set(data.stats as never[]);
		}
		if (data.missedIds && Array.isArray(data.missedIds)) {
			stats.missed.set(data.missedIds);
		}
		if (data.bookmarks && Array.isArray(data.bookmarks)) {
			bookmarks.subscribe(() => {})(); // ensure initialized
			localStorage.setItem('bookmarkedProblemIds', JSON.stringify(data.bookmarks));
		}
	} catch (e) {
		console.error('Cloud load failed:', e);
	}
}

export async function saveToCloud(): Promise<void> {
	if (!browser) return;
	const u = get(user);
	if (!u.signedIn) return;

	try {
		const currentSettings = get(settings);
		let currentStats: unknown[] = [];
		stats.history.subscribe((h) => { currentStats = h; })();
		let currentMissed: number[] = [];
		stats.missed.subscribe((m) => { currentMissed = m; })();

		await authFetch('/api/user/data', {
			method: 'PUT',
			body: JSON.stringify({
				displayName: u.displayName,
				settings: currentSettings,
				stats: currentStats,
				missedIds: currentMissed,
				bookmarks: bookmarks.getAll(),
			}),
		});
	} catch (e) {
		console.error('Cloud save failed:', e);
	}
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounced save - waits 5 seconds after last change before syncing */
export function scheduleSave(): void {
	if (saveTimeout) clearTimeout(saveTimeout);
	saveTimeout = setTimeout(saveToCloud, 5000);
}
