<script lang="ts">
	import { settings } from '$lib/stores/settings';

	interface Props {
		running: boolean;
		onTimeout?: () => void;
	}

	let { running, onTimeout }: Props = $props();
	let elapsed = $state(0);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const limit = $derived($settings.timerSeconds);
	const isCountdown = $derived(limit > 0);
	const remaining = $derived(Math.max(0, limit - elapsed));
	const display = $derived(isCountdown ? remaining : elapsed);
	const expired = $derived(isCountdown && remaining === 0 && elapsed > 0);

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		if (running) {
			elapsed = 0;
			intervalId = setInterval(() => {
				elapsed += 1;
				if (isCountdown && limit - elapsed <= 0) {
					if (intervalId) clearInterval(intervalId);
					intervalId = null;
					onTimeout?.();
				}
			}, 1000);
		} else {
			if (intervalId) clearInterval(intervalId);
			intervalId = null;
		}
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});

	export function reset() {
		elapsed = 0;
	}

	export function getElapsed() {
		return elapsed;
	}
</script>

<div class="timer" class:expired>
	{formatTime(display)}
</div>

<style>
	.timer {
		text-align: center;
		font-size: 1.4em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--text-color);
		padding: 0.25rem 0;
		opacity: 0.85;
	}
	.expired {
		color: #ff4136;
		opacity: 1;
		animation: pulse 1s infinite;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
