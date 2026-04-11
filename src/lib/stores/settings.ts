import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SettingsObject } from '$lib/types';

const DEFAULT_SETTINGS: SettingsObject = {
	level: 'All',
	subject: null,
	difficultyMin: 1,
	difficultyMax: 10,
	textColor: 'black',
	bgColor1: '#63b7dd',
	bgColor2: '#63ddc7',
	logoColor: 'blue',
	zenMode: 'Off',
	imgWiggle: 'On',
	fontFamily: 'Poppins',
	timer: 'Off',
	timerSeconds: 180,
	reviewMode: 'Off'
};

function createSettingsStore() {
	let initial = DEFAULT_SETTINGS;

	if (browser) {
		try {
			const stored = localStorage.getItem('settingsObject');
			if (stored) {
				initial = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
			}
		} catch {
			// Use defaults if localStorage is corrupt
		}
	}

	const { subscribe, set, update } = writable<SettingsObject>(initial);

	if (browser) {
		subscribe((value) => {
			localStorage.setItem('settingsObject', JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update,
		reset: () => set(DEFAULT_SETTINGS)
	};
}

export const settings = createSettingsStore();
