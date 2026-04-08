<script lang="ts">
	interface Props {
		problemId: string;
		problemHtml: string;
		zenMode: boolean;
		textInvertFilter: string;
	}

	let { problemId, problemHtml, zenMode, textInvertFilter }: Props = $props();
</script>

<strong>
	<p class="text" style:opacity={zenMode ? 0 : 1} style="font-size: 24px;">
		{problemId}
	</p>
</strong>
<div class="text" style:--img-filter={textInvertFilter}>
	{@html problemHtml}
</div>

<style>
	.text :global(img),
	.text :global(latex) {
		filter: var(--img-filter, invert(0));
	}
</style>
