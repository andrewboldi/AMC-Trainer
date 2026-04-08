<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import type { TextColor, LogoColor } from '$lib/types';
</script>

<div class="container tab" style="flex-direction: column;">
	<br /><br />
	<h2>Text Color</h2>
	<select
		class="ddl button"
		value={$settings.textColor}
		onchange={(e) => settings.update(s => ({ ...s, textColor: (e.target as HTMLSelectElement).value as TextColor }))}
	>
		<option value="black">Black</option>
		<option value="white">White</option>
	</select>

	<br /><br />
	<h2>Background/Button Color</h2>
	<input
		class="button ddl"
		type="color"
		value={$settings.bgColor1}
		oninput={(e) => settings.update(s => ({ ...s, bgColor1: (e.target as HTMLInputElement).value }))}
		aria-label="Set the first color of the background gradient."
	/>
	<input
		class="button ddl"
		type="color"
		value={$settings.bgColor2}
		oninput={(e) => settings.update(s => ({ ...s, bgColor2: (e.target as HTMLInputElement).value }))}
		aria-label="Set the second color of the background gradient."
	/>

	<br /><br />
	<h2 style="background-color: #91fe9e">Logo Color</h2>
	<select
		class="ddl button"
		value={$settings.logoColor}
		onchange={(e) => settings.update(s => ({ ...s, logoColor: (e.target as HTMLSelectElement).value as LogoColor }))}
	>
		<option value="red">Red</option>
		<option value="orange">Orange</option>
		<option value="yellow">Yellow</option>
		<option value="green">Green</option>
		<option value="blue">Blue</option>
		<option value="purple">Purple</option>
		<option value="white">White</option>
		<option value="black">Black</option>
	</select>
	<br /><br />
</div>
