<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { renderLatexInContainer } from '$lib/utils/katex';

	interface Props {
		problemId: string;
		problemHtml: string;
		zenMode: boolean;
		textInvertFilter: string;
	}

	let { problemId, problemHtml, zenMode, textInvertFilter }: Props = $props();
	let container: HTMLElement;

	afterUpdate(() => {
		if (container) {
			renderLatexInContainer(container);
		}
	});
</script>

<strong>
	<p class="text" style:opacity={zenMode ? 0 : 1} style="font-size: 24px;">
		{problemId}
	</p>
</strong>
<div class="text" bind:this={container} style:--img-filter={textInvertFilter}>
	{@html problemHtml}
</div>

<style>
	.text :global(img:not(.latex)) {
		filter: var(--img-filter, invert(0));
	}
	.text :global(h1),
	.text :global(h2),
	.text :global(h3) {
		text-align: center;
	}
</style>
