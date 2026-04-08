<script lang="ts">
	interface Props {
		onNext: () => void;
	}

	let { onNext }: Props = $props();
</script>

<button
	type="button"
	onclick={onNext}
	style="position: fixed; right: 10%; bottom: 10%; width: 12%; height: 7%; border-radius: 1rem; font-size: 1.6em;"
	id="new_problem"
	class="button"
>
	<img src="/img/arrow-right.svg" alt="Next problem" />
</button>
