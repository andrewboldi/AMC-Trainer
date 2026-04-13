<script lang="ts">
	import '@fontsource/poppins/100.css';
	import '@fontsource/poppins/200.css';
	import 'katex/dist/katex.min.css';
	import '../app.css';
	import { settings } from '$lib/stores/settings';
	import { page } from '$app/state';

	let { children } = $props();

	// Track SPA navigations in Google Analytics
	$effect(() => {
		const path = page.url.pathname;
		if (typeof gtag === 'function') {
			gtag('config', 'G-P98FJ92R7Z', { page_path: path });
		}
	});

	function hexToRgb(hex: string): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgb(${r}, ${g}, ${b})`;
	}
</script>

<div
	class="app"
	class:no-wiggle={$settings.imgWiggle === 'Off'}
	style:--bg-color-1={hexToRgb($settings.bgColor1)}
	style:--bg-color-2={hexToRgb($settings.bgColor2)}
	style:--text-color={$settings.textColor}
	style:--text-invert={$settings.textColor === 'white' ? 'invert(1)' : 'invert(0)'}
	style:font-family={$settings.fontFamily}
>
	{@render children()}
</div>

<style>
	.app {
		min-height: 100vh;
		overflow: auto;
		color: var(--text-color);
		background-attachment: fixed;
		background-image: linear-gradient(to right, var(--bg-color-1) 20%, var(--bg-color-2) 80%);
		background-position: top center;
		background-repeat: repeat-y;
		background-size: 100%;
	}
</style>
