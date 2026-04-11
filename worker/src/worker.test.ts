import { describe, it, expect } from 'bun:test';
import { computeDifficulty } from './worker';

describe('computeDifficulty', () => {
	describe('AMC 8 / AJHSME', () => {
		it('maps problems 1-8 to difficulty 1', () => {
			expect(computeDifficulty('AMC_8', 1)).toBe(1);
			expect(computeDifficulty('AMC_8', 8)).toBe(1);
			expect(computeDifficulty('AJHSME', 5)).toBe(1);
		});

		it('maps problems 9-16 to difficulty 2', () => {
			expect(computeDifficulty('AMC_8', 9)).toBe(2);
			expect(computeDifficulty('AMC_8', 16)).toBe(2);
		});

		it('maps problems 17-21 to difficulty 3', () => {
			expect(computeDifficulty('AMC_8', 17)).toBe(3);
			expect(computeDifficulty('AMC_8', 21)).toBe(3);
		});

		it('maps problems 22-25 to difficulty 4', () => {
			expect(computeDifficulty('AMC_8', 22)).toBe(4);
			expect(computeDifficulty('AMC_8', 25)).toBe(4);
		});
	});

	describe('AMC 10', () => {
		it('maps problems 1-5 to difficulty 2', () => {
			expect(computeDifficulty('AMC_10', 1)).toBe(2);
			expect(computeDifficulty('AMC_10', 5)).toBe(2);
		});

		it('maps problems 6-10 to difficulty 3', () => {
			expect(computeDifficulty('AMC_10', 6)).toBe(3);
			expect(computeDifficulty('AMC_10', 10)).toBe(3);
		});

		it('maps problems 11-15 to difficulty 4', () => {
			expect(computeDifficulty('AMC_10', 11)).toBe(4);
			expect(computeDifficulty('AMC_10', 15)).toBe(4);
		});

		it('maps problems 16-20 to difficulty 5', () => {
			expect(computeDifficulty('AMC_10', 16)).toBe(5);
			expect(computeDifficulty('AMC_10', 20)).toBe(5);
		});

		it('maps problems 21-25 to difficulty 6', () => {
			expect(computeDifficulty('AMC_10', 21)).toBe(6);
			expect(computeDifficulty('AMC_10', 25)).toBe(6);
		});
	});

	describe('AMC 12', () => {
		it('maps problems 1-5 to difficulty 3', () => {
			expect(computeDifficulty('AMC_12', 1)).toBe(3);
			expect(computeDifficulty('AMC_12', 5)).toBe(3);
		});

		it('maps problems 6-10 to difficulty 4', () => {
			expect(computeDifficulty('AMC_12', 6)).toBe(4);
			expect(computeDifficulty('AMC_12', 10)).toBe(4);
		});

		it('maps problems 11-15 to difficulty 5', () => {
			expect(computeDifficulty('AMC_12', 11)).toBe(5);
			expect(computeDifficulty('AMC_12', 15)).toBe(5);
		});

		it('maps problems 16-20 to difficulty 6', () => {
			expect(computeDifficulty('AMC_12', 16)).toBe(6);
			expect(computeDifficulty('AMC_12', 20)).toBe(6);
		});

		it('maps problems 21-25 to difficulty 7', () => {
			expect(computeDifficulty('AMC_12', 21)).toBe(7);
			expect(computeDifficulty('AMC_12', 25)).toBe(7);
		});
	});

	describe('AIME', () => {
		it('maps problems 1-3 to difficulty 6', () => {
			expect(computeDifficulty('AIME', 1)).toBe(6);
			expect(computeDifficulty('AIME', 3)).toBe(6);
		});

		it('maps problems 4-6 to difficulty 7', () => {
			expect(computeDifficulty('AIME', 4)).toBe(7);
			expect(computeDifficulty('AIME', 6)).toBe(7);
		});

		it('maps problems 7-9 to difficulty 8', () => {
			expect(computeDifficulty('AIME', 7)).toBe(8);
			expect(computeDifficulty('AIME', 9)).toBe(8);
		});

		it('maps problems 10-12 to difficulty 9', () => {
			expect(computeDifficulty('AIME', 10)).toBe(9);
			expect(computeDifficulty('AIME', 12)).toBe(9);
		});

		it('maps problems 13-15 to difficulty 10', () => {
			expect(computeDifficulty('AIME', 13)).toBe(10);
			expect(computeDifficulty('AIME', 15)).toBe(10);
		});
	});

	describe('cross-exam overlaps', () => {
		it('AMC 10 hard = AMC 12 med-hard = AIME easy (all difficulty 6)', () => {
			expect(computeDifficulty('AMC_10', 25)).toBe(6);
			expect(computeDifficulty('AMC_12', 18)).toBe(6);
			expect(computeDifficulty('AIME', 2)).toBe(6);
		});

		it('AMC 12 hard = AIME easy-med (all difficulty 7)', () => {
			expect(computeDifficulty('AMC_12', 23)).toBe(7);
			expect(computeDifficulty('AIME', 5)).toBe(7);
		});

		it('AMC 8 hard = AMC 10 medium (all difficulty 4)', () => {
			expect(computeDifficulty('AMC_8', 24)).toBe(4);
			expect(computeDifficulty('AMC_10', 13)).toBe(4);
			expect(computeDifficulty('AMC_12', 8)).toBe(4);
		});
	});

	it('returns 5 for unknown exam types', () => {
		expect(computeDifficulty('UNKNOWN', 10)).toBe(5);
	});
});
