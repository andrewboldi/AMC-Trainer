<script lang="ts">
	import Timer from './Timer.svelte';

	interface Props {
		examType: string;
		onSubmit: (answer: string) => void;
		onGiveUp: () => void;
		timerEnabled?: boolean;
		timerRunning?: boolean;
		timerSeconds?: number;
		bookmarked?: boolean;
		onBookmarkToggle?: () => void;
	}

	let { examType, onSubmit, onGiveUp, timerEnabled = false, timerRunning = false, timerSeconds = 180, bookmarked = false, onBookmarkToggle }: Props = $props();
	let answer = $state('');
	let shaking = $state(false);

	function handleSubmit() {
		if (!answer.trim()) {
			alert('Enter a valid response!');
			return;
		}
		onSubmit(answer);
		// Trigger shake if the problem store will show incorrect
		// The parent handles the result; we just clear the input
		answer = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	export function triggerShake() {
		shaking = true;
		setTimeout(() => { shaking = false; }, 300);
	}
</script>

<div class="answer-row">
	<input
		class="input button"
		class:error={shaking}
		autocomplete="off"
		type="text"
		bind:value={answer}
		onkeydown={handleKeydown}
		aria-label={examType === 'AIME'
			? 'Enter your 3-digit AIME answer'
			: 'Enter your answer letter (A-E)'}
	/>
	<button class="button submit-btn" type="button" onclick={handleSubmit}>
		Submit
	</button>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span class="give-up" onclick={onGiveUp} title="Give up">&#127937;</span>
	{#if timerEnabled}
		<Timer running={timerRunning} />
	{/if}
	{#if onBookmarkToggle}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class="bookmark-icon" onclick={onBookmarkToggle} title={bookmarked ? 'Remove bookmark' : 'Bookmark problem'}
			style="opacity: {bookmarked ? 1 : 0.3};">&#x1F516;</span>
	{/if}
</div>

<style>
	.answer-row {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		padding: 0.5rem 0;
	}
	.answer-row :global(.button) {
		margin: 0;
		width: auto;
		max-width: none;
	}
	.answer-row input {
		width: 180px !important;
		max-width: 180px !important;
		cursor: text;
		margin-right: 8px !important;
	}
	.submit-btn {
		padding: 0 20px;
		color: var(--text-color) !important;
	}
	.give-up {
		cursor: pointer;
		font-size: 1.4em;
		margin-left: 12px;
	}
	.bookmark-icon {
		cursor: pointer;
		font-size: 1.4em;
		margin-left: 8px;
		transition: opacity 0.2s;
	}
</style>
