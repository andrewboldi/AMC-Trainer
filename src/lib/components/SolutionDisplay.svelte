<script lang="ts">
	interface Props {
		solutionHtml: string;
		textInvertFilter: string;
	}

	let { solutionHtml, textInvertFilter }: Props = $props();
</script>

<div class="text" style:--img-filter={textInvertFilter}>
	{@html solutionHtml}
</div>

<style>
	.text :global(img),
	.text :global(latex) {
		filter: var(--img-filter, invert(0));
	}
</style>
