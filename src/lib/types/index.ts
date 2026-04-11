export type ExamLevel = 'All' | 'AMC_8' | 'AMC_10' | 'AMC_12' | 'AIME';
export type ProblemStatus = 'loading' | 'answering' | 'correct' | 'gave_up' | 'error';
export type ValidationResult = 'correct' | 'incorrect' | 'invalid_format';
export type Subject = 'algebra' | 'geometry' | 'combinatorics' | 'number_theory';

export type LogoColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'white' | 'black';
export type TextColor = 'black' | 'white';
export type ToggleOption = 'On' | 'Off';

export interface ProblemFilter {
	level: ExamLevel;
	subject?: Subject;
	difficultyMin?: number;
	difficultyMax?: number;
}

export interface ProblemResponse {
	id: number;
	year: number;
	examName: string;
	problemNum: number;
	subject: Subject | null;
	difficulty: number;
	problemHtml: string;
	solutionHtml: string;
	answer: string;
}

export interface ProblemState {
	id: number;
	problemId: string;
	problemHtml: string;
	solutionHtml: string;
	correctAnswer: string;
	examType: string;
	subject: string | null;
	difficulty: number;
	status: ProblemStatus;
}

export interface SettingsObject {
	level: ExamLevel;
	subject: Subject | null;
	difficultyMin: number;
	difficultyMax: number;
	textColor: TextColor;
	bgColor1: string;
	bgColor2: string;
	logoColor: LogoColor;
	zenMode: ToggleOption;
	imgWiggle: ToggleOption;
	fontFamily: string;
	timer: ToggleOption;
	timerSeconds: number;
}
