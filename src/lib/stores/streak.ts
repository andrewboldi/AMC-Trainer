import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createStreakStore() {
	let initial = 0;

	if (browser) {
		const stored = localStorage.getItem('streak');
		if (stored) {
			initial = parseInt(stored, 10) || 0;
		}
	}

	const { subscribe, set, update } = writable<number>(initial);

	if (browser) {
		subscribe((value) => {
			localStorage.setItem('streak', value.toString());
		});
	}

	return {
		subscribe,
		increment: () => update((n) => n + 1),
		reset: () => set(0)
	};
}

export const streak = createStreakStore();
