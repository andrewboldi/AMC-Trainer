<script lang="ts">
	interface Props {
		onPrev: () => void;
		disabled: boolean;
	}

	let { onPrev, disabled }: Props = $props();
</script>

<button
	type="button"
	onclick={onPrev}
	{disabled}
	style="position: fixed; left: 10%; bottom: 10%; width: 12%; height: 7%; border-radius: 1rem; font-size: 1.6em; opacity: {disabled ? 0.3 : 1};"
	class="button"
	id="prev_problem"
>
	<img src="/img/arrow-left.svg" alt="Previous problem" />
</button>
