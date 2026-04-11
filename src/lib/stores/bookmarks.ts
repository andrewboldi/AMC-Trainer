import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'bookmarkedProblemIds';

function load(): number[] {
	if (!browser) return [];
	try {
		return JSON.parse(localStorage.getItem(KEY) || '[]');
	} catch { return []; }
}

function createBookmarkStore() {
	const store = writable<number[]>(load());

	store.subscribe((v) => {
		if (browser) localStorage.setItem(KEY, JSON.stringify(v));
	});

	return {
		subscribe: store.subscribe,

		toggle(id: number) {
			store.update((ids) =>
				ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
			);
		},

		has(id: number): boolean {
			return get(store).includes(id);
		},

		getAll(): number[] {
			return get(store);
		},

		clear() {
			store.set([]);
		}
	};
}

export const bookmarks = createBookmarkStore();
