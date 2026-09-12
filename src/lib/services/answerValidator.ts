import type { ValidationResult } from '$lib/types';

const AMC_ANSWER_REGEX = /^[A-E]$/i;
const AIME_ANSWER_REGEX = /^\d{3}$/;

export function validateAnswer(
	userAnswer: string,
	correctAnswer: string,
	examType: string
): ValidationResult {
	const normalized = userAnswer.trim().toUpperCase();
	const isValidFormat =
		examType === 'AIME'
			? AIME_ANSWER_REGEX.test(normalized)
			: AMC_ANSWER_REGEX.test(normalized);

	if (!isValidFormat) return 'invalid_format';

	// AIME answers are integers 0-999 that the wiki may store padded ("007") or
	// bare ("7"). Compare numerically so grading is correct either way.
	if (examType === 'AIME') {
		return Number(normalized) === Number(correctAnswer.trim()) ? 'correct' : 'incorrect';
	}

	return normalized === correctAnswer.toUpperCase() ? 'correct' : 'incorrect';
}
