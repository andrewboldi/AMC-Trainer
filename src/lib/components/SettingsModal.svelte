<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import type { ExamLevel, Subject, TextColor, LogoColor, ToggleOption } from '$lib/types';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const FONTS = [
		'Poppins', 'Arial', 'Arial Black', 'Verdana', 'Tahoma', 'Trebuchet MS',
		'Impact', 'Times New Roman', 'Didot', 'Georgia', 'American Typewriter',
		'Andale Mono', 'Courier', 'Lucida Console', 'Monaco', 'Bradley Hand',
		'Brush Script MT', 'Luminari', 'Comic Sans MS', 'Roboto'
	];

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal" style="display: block; position: fixed; z-index: 15;" onclick={handleBackdrop}>
	<div class="modalContent animateZoom settings-single">
		<span
			onclick={onClose}
			style="position: absolute; right: 0; top: 0; border-top-right-radius: 12px; border-bottom-left-radius: 12px; font-size: 36px; z-index: 1;"
			class="modalButton"
			id="closeModal"
		>
			&times;
		</span>

		<div class="settings-header">
			<img class="logoIcon" src="/img/icon.png" alt="AMC Trainer" style="width: 50px; height: 50px;" />
			<h3 style="margin: 0;">AMC Trainer Settings</h3>
		</div>

		<div class="settings-grid">
			<!-- Options -->
			<div class="settings-section">
				<h2>Level</h2>
				<div class="checkbox-group">
					{#each [['AMC_8', 'AMC 8'], ['AMC_10', 'AMC 10'], ['AMC_12', 'AMC 12'], ['AIME', 'AIME']] as [value, label]}
						<label class="checkbox-label">
							<input type="checkbox" checked={$settings.levels.includes(value as ExamLevel)}
								onchange={() => settings.update(s => {
									const has = s.levels.includes(value as ExamLevel);
									let next = has ? s.levels.filter(l => l !== value) : [...s.levels, value as ExamLevel];
									if (next.length === 0) next = [value as ExamLevel];
									return { ...s, levels: next, level: next.length === 4 ? 'All' : next[0] };
								})} />
							{label}
						</label>
					{/each}
				</div>
			</div>

			<div class="settings-section">
				<h2>Subject</h2>
				<select class="ddl button" value={$settings.subject ?? ''}
					onchange={(e) => { const val = (e.target as HTMLSelectElement).value; settings.update(s => ({ ...s, subject: val === '' ? null : val as Subject })); }}>
					<option value="">All Subjects</option>
					<option value="algebra">Algebra</option>
					<option value="geometry">Geometry</option>
					<option value="combinatorics">Combinatorics</option>
					<option value="number_theory">Number Theory</option>
				</select>
			</div>

			<div class="settings-section">
				<h2>Year Range</h2>
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<input class="button ddl" type="number" min="1983" max="2025" style="width: 70px;" value={$settings.yearMin}
						oninput={(e) => { const val = parseInt((e.target as HTMLInputElement).value, 10); if (!isNaN(val)) settings.update(s => ({ ...s, yearMin: val })); }} />
					<span style="font-weight: 600;">to</span>
					<input class="button ddl" type="number" min="1983" max="2025" style="width: 70px;" value={$settings.yearMax}
						oninput={(e) => { const val = parseInt((e.target as HTMLInputElement).value, 10); if (!isNaN(val)) settings.update(s => ({ ...s, yearMax: val })); }} />
				</div>
			</div>

			<div class="settings-section">
				<h2>Difficulty</h2>
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<select class="ddl button" style="width: 70px;" value={$settings.difficultyMin}
						onchange={(e) => { const val = parseInt((e.target as HTMLSelectElement).value, 10); settings.update(s => ({ ...s, difficultyMin: val, difficultyMax: Math.max(val, s.difficultyMax) })); }}>
						{#each Array.from({length: 10}, (_, i) => i + 1) as n}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<span style="font-weight: 600;">to</span>
					<select class="ddl button" style="width: 70px;" value={$settings.difficultyMax}
						onchange={(e) => { const val = parseInt((e.target as HTMLSelectElement).value, 10); settings.update(s => ({ ...s, difficultyMax: val, difficultyMin: Math.min(val, s.difficultyMin) })); }}>
						{#each Array.from({length: 10}, (_, i) => i + 1) as n}
							<option value={n}>{n}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Colors -->
			<div class="settings-section">
				<h2>Text Color</h2>
				<select class="ddl button" value={$settings.textColor}
					onchange={(e) => settings.update(s => ({ ...s, textColor: (e.target as HTMLSelectElement).value as TextColor }))}>
					<option value="black">Black</option>
					<option value="white">White</option>
				</select>
			</div>

			<div class="settings-section">
				<h2>Background</h2>
				<div style="display: flex; gap: 0.5rem;">
					<input class="button ddl" type="color" value={$settings.bgColor1}
						oninput={(e) => settings.update(s => ({ ...s, bgColor1: (e.target as HTMLInputElement).value }))} />
					<input class="button ddl" type="color" value={$settings.bgColor2}
						oninput={(e) => settings.update(s => ({ ...s, bgColor2: (e.target as HTMLInputElement).value }))} />
				</div>
			</div>

			<div class="settings-section">
				<h2>Logo Color</h2>
				<select class="ddl button" value={$settings.logoColor}
					onchange={(e) => settings.update(s => ({ ...s, logoColor: (e.target as HTMLSelectElement).value as LogoColor }))}>
					<option value="red">Red</option>
					<option value="orange">Orange</option>
					<option value="yellow">Yellow</option>
					<option value="green">Green</option>
					<option value="blue">Blue</option>
					<option value="purple">Purple</option>
					<option value="white">White</option>
					<option value="black">Black</option>
				</select>
			</div>

			<!-- Customization -->
			<div class="settings-section">
				<h2>Zen Mode</h2>
				<select class="ddl button" value={$settings.zenMode}
					onchange={(e) => settings.update(s => ({ ...s, zenMode: (e.target as HTMLSelectElement).value as ToggleOption }))}>
					<option value="Off">Off</option>
					<option value="On">On</option>
				</select>
			</div>

			<div class="settings-section">
				<h2>Image Wiggle</h2>
				<select class="ddl button" value={$settings.imgWiggle}
					onchange={(e) => settings.update(s => ({ ...s, imgWiggle: (e.target as HTMLSelectElement).value as ToggleOption }))}>
					<option value="On">On</option>
					<option value="Off">Off</option>
				</select>
			</div>

			<div class="settings-section">
				<h2>Timer</h2>
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<select class="ddl button" style="width: 70px;" value={$settings.timer}
						onchange={(e) => settings.update(s => ({ ...s, timer: (e.target as HTMLSelectElement).value as ToggleOption }))}>
						<option value="Off">Off</option>
						<option value="On">On</option>
					</select>
					{#if $settings.timer === 'On'}
						<select class="ddl button" style="width: 90px;" value={$settings.timerSeconds}
							onchange={(e) => settings.update(s => ({ ...s, timerSeconds: parseInt((e.target as HTMLSelectElement).value, 10) }))}>
							<option value={60}>1 min</option>
							<option value={120}>2 min</option>
							<option value={180}>3 min</option>
							<option value={300}>5 min</option>
							<option value={600}>10 min</option>
						</select>
					{/if}
				</div>
			</div>

			<div class="settings-section">
				<h2>Review Mode</h2>
				<select class="ddl button" value={$settings.reviewMode}
					onchange={(e) => settings.update(s => ({ ...s, reviewMode: (e.target as HTMLSelectElement).value as ToggleOption }))}>
					<option value="Off">Off</option>
					<option value="On">On</option>
				</select>
			</div>

			<div class="settings-section">
				<h2>Font Family</h2>
				<select class="ddl button" value={$settings.fontFamily}
					onchange={(e) => settings.update(s => ({ ...s, fontFamily: (e.target as HTMLSelectElement).value }))}>
					{#each FONTS as font}
						<option value={font} style:font-family={font}>{font}</option>
					{/each}
				</select>
			</div>
		</div>

		<div style="text-align: center; padding: 1rem;">
			<input class="button" style="background: #ff6b6b; color: white; font-size: 0.8em;" type="button" value="Reset Defaults" onclick={() => settings.reset()} />
		</div>
	</div>
</div>

<style>
	.settings-single {
		width: 70%;
		max-width: 800px;
		height: auto;
		max-height: 85vh;
		padding: 1.5rem;
	}

	.settings-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.2rem;
	}

	.settings-section :global(h2) {
		font-size: 0.9em;
		margin-bottom: 0.4rem;
	}

	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.6rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8em;
		font-weight: 600;
		cursor: pointer;
	}

	.settings-section :global(.button) {
		margin: 0;
		width: 100%;
	}

	@media (max-width: 700px) {
		.settings-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.settings-single {
			width: 90%;
		}
	}

	@media (max-width: 450px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
