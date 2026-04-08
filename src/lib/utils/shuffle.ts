/**
 * Fisher-Yates shuffle — mutates and returns the array.
 */
export function shuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

/**
 * Pick a random element from an array without shuffling the whole thing.
 */
export function randomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate an array of integers from start (inclusive) to end (exclusive).
 */
export function range(start: number, end: number): number[] {
	return Array.from({ length: end - start }, (_, i) => start + i);
}
