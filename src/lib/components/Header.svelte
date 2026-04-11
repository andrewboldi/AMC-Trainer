<script lang="ts">
	interface Props {
		streak: number;
		logoColor: string;
		onSettingsClick: () => void;
		onInfoClick: () => void;
		onStreakClick: () => void;
	}

	let { streak, logoColor, onSettingsClick, onInfoClick, onStreakClick }: Props = $props();
</script>

<div class="header-bar">
	<img
		src="/img/report.svg"
		alt="Report an error"
		class="headerButton"
		style="position: absolute; left: 90px; top: 5px;"
		onclick={() => window.open('https://artofproblemsolving.com/community/c1967976h2362114p19241124')}
	/>
	<img
		src="/img/help.svg"
		alt="Information"
		class="headerButton"
		style="position: absolute; left: 5px; top: 5px;"
		onclick={onInfoClick}
	/>

	<div
		class="streak-display text"
		style="position: absolute; right: 100px; width: 50px; height: 50px; top: 1rem; margin: 0 1rem; font-weight: bold; font-size: 1.1rem;"
	>
		{streak}
	</div>

	<!-- Fire icon (inline SVG replaces Font Awesome) -->
	<svg
		id="fire-icon"
		style="cursor: pointer; position: absolute; width: 30px; top: 5px; right: 90px; color: orange; font-size: 40px;"
		onclick={onStreakClick}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 384 512"
		fill="orange"
		width="30"
		height="40"
	>
		<path d="M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z"/>
	</svg>

	<img
		src="/img/settings.svg"
		alt="Settings"
		id="settingsButtonImg"
		class="headerButton"
		style="position: absolute; top: 5px; right: 5px;"
		onclick={onSettingsClick}
	/>
</div>
