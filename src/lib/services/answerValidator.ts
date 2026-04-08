import type { ExamType, ValidationResult } from '$lib/types';

const AMC_ANSWER_REGEX = /^[A-E]$/i;
const AIME_ANSWER_REGEX = /^\d{3}$/;

export function validateAnswer(
	userAnswer: string,
	correctAnswer: string,
	examType: ExamType
): ValidationResult {
	const normalized = userAnswer.trim().toUpperCase();
	const isValidFormat =
		examType === 'AIME'
			? AIME_ANSWER_REGEX.test(normalized)
			: AMC_ANSWER_REGEX.test(normalized);

	if (!isValidFormat) return 'invalid_format';
	return normalized === correctAnswer.toUpperCase() ? 'correct' : 'incorrect';
}
