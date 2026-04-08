<script lang="ts">
	import SettingsTabOptions from './SettingsTabOptions.svelte';
	import SettingsTabColors from './SettingsTabColors.svelte';
	import SettingsTabCustomization from './SettingsTabCustomization.svelte';
	import { settings } from '$lib/stores/settings';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	type Tab = 'Options' | 'Colors' | 'Customization';
	let activeTab = $state<Tab>('Options');

	const tabs: Tab[] = ['Options', 'Colors', 'Customization'];

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal" style="display: block; position: fixed; z-index: 15;" onclick={handleBackdrop}>
	<main class="modalContent animateZoom">
		<span
			onclick={onClose}
			style="position: absolute; right: 0; top: 0; border-top-right-radius: 12px; border-bottom-left-radius: 12px; font-size: 36px; z-index: 1;"
			class="modalButton"
			id="closeModal"
		>
			&times;
		</span>

		<div class="settings-navigation">
			<div class="logo">
				<img class="logoIcon" src="/img/icon.png" alt="AMC Trainer" style="width: 80px; height: 80px; margin-left: 2.5rem; margin-top: 1rem;" />
				<h5>AMC Trainer Settings</h5>
			</div>

			<div class="links">
				{#each tabs as tab}
					<div class="link">
						<h1
							class="tabButton modalButton"
							style={activeTab === tab
								? 'background-image: linear-gradient(to right top, #63b7dd, #63ddc7); color: white;'
								: 'background: transparent; color: #426696;'}
							onclick={() => activeTab = tab}
						>
							{tab}
						</h1>
					</div>
				{/each}
			</div>

			<br /><br />
			<div>
				<input class="button saveButton" style="position: relative; background: #ff6b6b; font-size: 0.7em;" type="button" value="reset defaults" onclick={() => settings.reset()} aria-label="Reset settings to defaults." />
			</div>
		</div>

		<div class="settings-content">
			{#if activeTab === 'Options'}
				<SettingsTabOptions />
			{:else if activeTab === 'Colors'}
				<SettingsTabColors />
			{:else}
				<SettingsTabCustomization />
			{/if}
		</div>
	</main>
</div>
