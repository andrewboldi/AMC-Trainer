<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import type { ExamLevel } from '$lib/types';
</script>

<div class="container tab" style="flex-direction: column;">
	<br /><br />
	<h2>Level</h2>
	<select
		class="ddl button"
		value={$settings.level}
		onchange={(e) => settings.update(s => ({ ...s, level: (e.target as HTMLSelectElement).value as ExamLevel }))}
	>
		<option value="8">AMC 8</option>
		<option value="10">AMC 10</option>
		<option value="12">AMC 12</option>
		<option value="AIME">AIME</option>
		<option value="All">All</option>
	</select>

	<br /><br />
	<h2>Subject</h2>
	<div class="text" style="text-align: left;">Coming soon!</div>

	<br /><br />
	<h2>Difficulty</h2>
	<div class="text" style="text-align: left;">Coming soon!</div>
	<br /><br />
</div>
