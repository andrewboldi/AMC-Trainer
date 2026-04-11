<script lang="ts">
	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal" style="display: block; position: fixed; z-index: 15;" onclick={handleBackdrop}>
	<div class="modalContent animateZoom">
		<header class="container">
			<span
				onclick={onClose}
				style="position: absolute; right: 0; top: 0; border-top-right-radius: 12px; border-bottom-left-radius: 12px; font-size: 36px;"
				class="modalButton"
			>
				&times;
			</span>
			<h2>Credits</h2>
		</header>
		<div class="container">
			<p>
				<i>The problems on this page are copyrighted by the Mathematical Association of America's American Mathematics Competitions and the solutions on this page are directly taken from the Art of Problem Solving AoPS Wiki.</i>
			</p>
		</div>
	</div>
</div>
