<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { streak } from '$lib/stores/streak';
	import { problem, loadNewProblem, loadSavedProblem, submitAnswer, giveUp } from '$lib/stores/problem';
	import Header from '$lib/components/Header.svelte';
	import ProblemDisplay from '$lib/components/ProblemDisplay.svelte';
	import AnswerInput from '$lib/components/AnswerInput.svelte';
	import SolutionDisplay from '$lib/components/SolutionDisplay.svelte';
	import NextProblemButton from '$lib/components/NextProblemButton.svelte';
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import InfoModal from '$lib/components/InfoModal.svelte';
	import StreakModal from '$lib/components/StreakModal.svelte';
	import { fireConfetti } from '$lib/components/Confetti.svelte';

	let showSettings = $state(false);
	let showInfo = $state(false);
	let showStreak = $state(false);
	let drawingVisible = $state(false);
	let drawingCanvas: DrawingCanvas;
	let answerInput: AnswerInput;

	onMount(() => {
		const hasSaved = localStorage.getItem('problem');
		if (hasSaved) {
			loadSavedProblem();
		} else {
			loadNewProblem($settings.level);
		}
	});

	function handleSubmit(answer: string) {
		const result = submitAnswer(answer);
		if (result === 'correct') {
			fireConfetti();
		} else if (result === 'incorrect') {
			answerInput?.triggerShake();
		}
	}

	function handleNext() {
		loadNewProblem($settings.level);
		drawingCanvas?.clearScreen();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.ctrlKey && e.key === 'Enter') {
			handleNext();
		}
	}

	const textInvertFilter = $derived(
		$settings.textColor === 'white' ? 'invert(1)' : 'invert(0)'
	);
</script>

<svelte:head>
	<title>AMC Trainer!</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<Header
	streak={$streak}
	logoColor={$settings.logoColor}
	onSettingsClick={() => showSettings = true}
	onInfoClick={() => showInfo = true}
	onStreakClick={() => showStreak = true}
/>

<img
	src="/img/logo_{$settings.logoColor}.png"
	alt="The logo for the AMC Trainer website."
	class="logoIcon"
	id="logo"
/>

<ProblemDisplay
	problemId={$problem.problemId}
	problemHtml={$problem.problemHtml}
	zenMode={$settings.zenMode === 'On'}
	{textInvertFilter}
/>

{#if $problem.status === 'answering' || $problem.status === 'loading'}
	<AnswerInput
		bind:this={answerInput}
		examType={$problem.examType}
		onSubmit={handleSubmit}
		onGiveUp={() => { if (confirm('Are you sure you want to give up?')) giveUp(); }}
	/>
{/if}

{#if $problem.status === 'error'}
	<p class="text" style="text-align: center;">
		Failed to load problem. <button class="button" style="width: auto; padding: 0 20px; margin: 0;" onclick={handleNext}>Try another</button>
	</p>
{/if}

{#if $problem.status === 'correct' || $problem.status === 'gave_up'}
	<SolutionDisplay solutionHtml={$problem.solutionHtml} {textInvertFilter} />
{/if}

<NextProblemButton onNext={handleNext} />

<img
	src="/img/draw.svg"
	alt="Drawing tool"
	class="text headerButton"
	style="right: 9px; top: 80px;"
	onclick={() => drawingVisible = !drawingVisible}
/>

<DrawingCanvas bind:this={drawingCanvas} visible={drawingVisible} />

{#if showSettings}
	<SettingsModal onClose={() => showSettings = false} />
{/if}

{#if showInfo}
	<InfoModal onClose={() => showInfo = false} />
{/if}

{#if showStreak}
	<StreakModal streak={$streak} onClose={() => showStreak = false} />
{/if}
