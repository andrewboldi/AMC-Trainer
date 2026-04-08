<script lang="ts" module>
	import confetti from 'canvas-confetti';

	export function fireConfetti() {
		confetti.reset();
		const duration = 1000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 50, spread: 1000, ticks: 1000, zIndex: 0 };

		const interval = setInterval(() => {
			const timeLeft = animationEnd - Date.now();
			if (timeLeft <= 0) return clearInterval(interval);

			const particleCount = 200 * (timeLeft / duration);
			confetti({
				...defaults,
				particleCount,
				origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 }
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 }
			});
		}, 250);
	}
</script>
