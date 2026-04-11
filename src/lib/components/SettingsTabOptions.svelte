<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import type { ExamLevel, Subject } from '$lib/types';
</script>

<div class="container tab" style="flex-direction: column;">
	<br /><br />
	<h2>Level</h2>
	<select
		class="ddl button"
		value={$settings.level}
		onchange={(e) => settings.update(s => ({ ...s, level: (e.target as HTMLSelectElement).value as ExamLevel }))}
	>
		<option value="AMC_8">AMC 8</option>
		<option value="AMC_10">AMC 10</option>
		<option value="AMC_12">AMC 12</option>
		<option value="AIME">AIME</option>
		<option value="All">All</option>
	</select>

	<br /><br />
	<h2>Subject</h2>
	<select
		class="ddl button"
		value={$settings.subject ?? ''}
		onchange={(e) => {
			const val = (e.target as HTMLSelectElement).value;
			settings.update(s => ({ ...s, subject: val === '' ? null : val as Subject }));
		}}
	>
		<option value="">All Subjects</option>
		<option value="algebra">Algebra</option>
		<option value="geometry">Geometry</option>
		<option value="combinatorics">Combinatorics</option>
		<option value="number_theory">Number Theory</option>
	</select>

	<br /><br />
	<h2>Difficulty Range</h2>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		<select
			class="ddl button"
			style="width: 80px;"
			value={$settings.difficultyMin}
			onchange={(e) => {
				const val = parseInt((e.target as HTMLSelectElement).value, 10);
				settings.update(s => ({ ...s, difficultyMin: val, difficultyMax: Math.max(val, s.difficultyMax) }));
			}}
		>
			{#each Array.from({length: 10}, (_, i) => i + 1) as n}
				<option value={n}>{n}</option>
			{/each}
		</select>
		<span style="color: #426696; font-weight: 600;">to</span>
		<select
			class="ddl button"
			style="width: 80px;"
			value={$settings.difficultyMax}
			onchange={(e) => {
				const val = parseInt((e.target as HTMLSelectElement).value, 10);
				settings.update(s => ({ ...s, difficultyMax: val, difficultyMin: Math.min(val, s.difficultyMin) }));
			}}
		>
			{#each Array.from({length: 10}, (_, i) => i + 1) as n}
				<option value={n}>{n}</option>
			{/each}
		</select>
	</div>
	<div class="text" style="font-size: 0.75em; margin-top: 0.3rem; opacity: 0.7;">
		1 = AMC 8 easy, 6 = AMC 10 hard / AIME easy, 10 = AIME hard
	</div>
	<br /><br />
</div>
