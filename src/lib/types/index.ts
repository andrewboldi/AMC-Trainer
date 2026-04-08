export type ExamLevel = 'All' | '8' | '10' | '12' | 'AIME';
export type ExamType = '8' | '10' | '12' | 'AIME';
export type ProblemStatus = 'loading' | 'answering' | 'correct' | 'gave_up' | 'error';
export type ValidationResult = 'correct' | 'incorrect' | 'invalid_format';

export interface ProblemUrls {
	problemUrl: string;
	solutionUrl: string;
	answerUrl: string;
	problemId: string;
	examType: ExamType;
}

export interface ProblemState {
	problemId: string;
	problemHtml: string;
	solutionHtml: string;
	correctAnswer: string;
	examType: ExamType;
	status: ProblemStatus;
}

export type LogoColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'white' | 'black';
export type TextColor = 'black' | 'white';
export type ToggleOption = 'On' | 'Off';

export interface SettingsObject {
	level: ExamLevel;
	textColor: TextColor;
	bgColor1: string;
	bgColor2: string;
	logoColor: LogoColor;
	zenMode: ToggleOption;
	imgWiggle: ToggleOption;
	fontFamily: string;
}
