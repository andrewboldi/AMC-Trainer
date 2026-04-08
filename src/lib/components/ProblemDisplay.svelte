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
<p class="text">
	{@html problemHtml}
</p>

<style>
	:global(.text img) {
		filter: var(--img-filter, invert(0));
	}
</style>
