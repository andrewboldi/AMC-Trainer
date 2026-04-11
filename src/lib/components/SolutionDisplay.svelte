<script lang="ts">
	import { renderLatexInContainer } from '$lib/utils/katex';

	interface Props {
		solutionHtml: string;
		textInvertFilter: string;
	}

	let { solutionHtml, textInvertFilter }: Props = $props();
	let container: HTMLElement;

	$effect(() => {
		if (container && solutionHtml) {
			requestAnimationFrame(() => renderLatexInContainer(container));
		}
	});
</script>

<div class="text" bind:this={container} style:--img-filter={textInvertFilter}>
	{@html solutionHtml}
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
