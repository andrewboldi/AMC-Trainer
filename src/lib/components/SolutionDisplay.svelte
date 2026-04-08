<script lang="ts">
	interface Props {
		solutionHtml: string;
		textInvertFilter: string;
	}

	let { solutionHtml, textInvertFilter }: Props = $props();
</script>

<p class="text">
	{@html solutionHtml}
</p>
