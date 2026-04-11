<script lang="ts">
	import { stats, type AnswerRecord } from '$lib/stores/stats';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let history: AnswerRecord[] = $state([]);
	stats.history.subscribe((h) => { history = h; });

	const total = $derived(history.length);
	const correct = $derived(history.filter((r) => r.correct).length);
	const accuracy = $derived(total > 0 ? Math.round((correct / total) * 100) : 0);

	const subjects = ['algebra', 'geometry', 'combinatorics', 'number_theory'] as const;

	function subjectStats(subject: string) {
		const items = history.filter((r) => r.subject === subject);
		const c = items.filter((r) => r.correct).length;
		return { total: items.length, correct: c, pct: items.length > 0 ? Math.round((c / items.length) * 100) : 0 };
	}

	function difficultyStats(min: number, max: number) {
		const items = history.filter((r) => r.difficulty >= min && r.difficulty <= max);
		const c = items.filter((r) => r.correct).length;
		return { total: items.length, correct: c, pct: items.length > 0 ? Math.round((c / items.length) * 100) : 0 };
	}

	function formatSubject(s: string): string {
		return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal" style="display: block; position: fixed; z-index: 15;" onclick={handleBackdrop}>
	<div class="modalContent animateZoom stats-modal">
		<span
			onclick={onClose}
			style="position: absolute; right: 0; top: 0; border-top-right-radius: 12px; border-bottom-left-radius: 12px; font-size: 36px; z-index: 1;"
			class="modalButton"
		>
			&times;
		</span>

		<h3 style="margin: 0 0 0.75rem 0; text-align: center;">Your Stats</h3>

		{#if total === 0}
			<p style="text-align: center; padding: 0; margin: 1rem 0;">No problems answered yet. Start practicing!</p>
		{:else}
			<div class="stat-row overall">
				<span class="stat-label">Overall</span>
				<span class="stat-value">{correct}/{total} ({accuracy}%)</span>
			</div>

			<h4>By Subject</h4>
			{#each subjects as subject}
				{@const s = subjectStats(subject)}
				{#if s.total > 0}
					<div class="stat-row">
						<span class="stat-label">{formatSubject(subject)}</span>
						<div class="stat-bar-wrap">
							<div class="stat-bar" style="width: {s.pct}%"></div>
						</div>
						<span class="stat-value">{s.pct}% ({s.correct}/{s.total})</span>
					</div>
				{/if}
			{/each}

			<h4>By Difficulty</h4>
			{#each [{ label: 'Easy (1-3)', min: 1, max: 3 }, { label: 'Medium (4-6)', min: 4, max: 6 }, { label: 'Hard (7-10)', min: 7, max: 10 }] as range}
				{@const s = difficultyStats(range.min, range.max)}
				{#if s.total > 0}
					<div class="stat-row">
						<span class="stat-label">{range.label}</span>
						<div class="stat-bar-wrap">
							<div class="stat-bar" style="width: {s.pct}%"></div>
						</div>
						<span class="stat-value">{s.pct}% ({s.correct}/{s.total})</span>
					</div>
				{/if}
			{/each}

			<div style="text-align: center; margin-top: 1rem;">
				<button class="button" style="background: #ff6b6b; color: white; font-size: 0.7em; width: auto; padding: 0 16px;" onclick={() => { stats.clear(); }}>
					Reset Stats
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.stats-modal {
		width: 50%;
		max-width: 500px;
		max-height: 80vh;
		padding: 1.5rem;
		overflow-y: auto;
	}
	h4 {
		margin: 0.75rem 0 0.4rem 0;
		font-size: 0.85em;
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.stat-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0.3rem 0;
		font-size: 0.85em;
	}
	.stat-row.overall {
		font-size: 1.1em;
		font-weight: 700;
		margin-bottom: 0.5rem;
		justify-content: space-between;
	}
	.stat-label {
		min-width: 100px;
		font-weight: 600;
	}
	.stat-bar-wrap {
		flex: 1;
		height: 10px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 5px;
		overflow: hidden;
	}
	.stat-bar {
		height: 100%;
		background: #63ddc7;
		border-radius: 5px;
		transition: width 0.3s;
	}
	.stat-value {
		min-width: 90px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	@media (max-width: 600px) {
		.stats-modal { width: 90%; }
		.stat-label { min-width: 70px; font-size: 0.8em; }
	}
</style>
