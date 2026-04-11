import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { onAuthChange } from '$lib/services/auth';
import { loadFromCloud, saveToCloud } from '$lib/services/sync';

export interface UserState {
	signedIn: boolean;
	uid: string | null;
	displayName: string | null;
	photoURL: string | null;
}

const EMPTY: UserState = {
	signedIn: false,
	uid: null,
	displayName: null,
	photoURL: null
};

function createUserStore() {
	const { subscribe, set } = writable<UserState>(EMPTY);

	if (browser) {
		onAuthChange((firebaseUser) => {
			if (firebaseUser) {
				set({
					signedIn: true,
					uid: firebaseUser.uid,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL
				});
				loadFromCloud();
			} else {
				set(EMPTY);
			}
		});

		// Save to cloud before leaving page
		window.addEventListener('beforeunload', () => {
			const state = { signedIn: false } as UserState;
			subscribe((s) => { Object.assign(state, s); })();
			if (state.signedIn) saveToCloud();
		});
	}

	return { subscribe };
}

export const user = createUserStore();
