<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import type { ToggleOption } from '$lib/types';

	const FONTS = [
		'Poppins', 'Arial', 'Arial Black', 'Verdana', 'Tahoma', 'Trebuchet MS',
		'Impact', 'Times New Roman', 'Didot', 'Georgia', 'American Typewriter',
		'Andale Mono', 'Courier', 'Lucida Console', 'Monaco', 'Bradley Hand',
		'Brush Script MT', 'Luminari', 'Comic Sans MS', 'Roboto'
	];
</script>

<div class="container tab" style="flex-direction: column;">
	<br /><br />
	<h2>Zen Mode</h2>
	<select
		class="ddl button"
		value={$settings.zenMode}
		onchange={(e) => settings.update(s => ({ ...s, zenMode: (e.target as HTMLSelectElement).value as ToggleOption }))}
	>
		<option value="Off">Off</option>
		<option value="On">On</option>
	</select>

	<br /><br />
	<h2>Image Wiggle</h2>
	<select
		class="ddl button"
		value={$settings.imgWiggle}
		onchange={(e) => settings.update(s => ({ ...s, imgWiggle: (e.target as HTMLSelectElement).value as ToggleOption }))}
	>
		<option value="On">On</option>
		<option value="Off">Off</option>
	</select>

	<br /><br />
	<h2><button class="newFeature">NEW</button> Font Family</h2>
	<select
		class="ddl button"
		value={$settings.fontFamily}
		onchange={(e) => settings.update(s => ({ ...s, fontFamily: (e.target as HTMLSelectElement).value }))}
	>
		{#each FONTS as font}
			<option value={font} style:font-family={font}>{font}</option>
		{/each}
	</select>
	<br /><br />
</div>
