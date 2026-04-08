<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		visible: boolean;
	}

	let { visible }: Props = $props();

	let canvas = $state<HTMLCanvasElement>(undefined!);
	let ctx: CanvasRenderingContext2D;
	let isDrawing = false;
	let prevX = 0;
	let prevY = 0;
	let currX = 0;
	let currY = 0;
	let currentColor = $state('black');
	let tool = $state<'pen' | 'eraser'>('pen');
	let undoStack: ImageData[] = [];
	let undoIndex = 0;
	let width = 0;
	let height = 0;

	const COLORS = [
		{ id: 'red', hex: '#FF4136' },
		{ id: 'orange', hex: '#FF851B' },
		{ id: 'yellow', hex: '#FFDC00' },
		{ id: 'green', hex: '#2ECC40' },
		{ id: 'blue', hex: '#0074D9' },
		{ id: 'purple', hex: '#800080' },
		{ id: 'black', hex: '#000000' },
		{ id: 'white', hex: '#FFFFFF' }
	];

	function resizeCanvas() {
		if (!canvas || !visible) return;
		const body = document.body;
		const html = document.documentElement;
		height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
		width = window.innerWidth - 20;
		canvas.height = height;
		canvas.width = width;

		if (undoStack.length > 0) {
			ctx.putImageData(undoStack[undoIndex], 0, 0);
		}
	}

	$effect(() => {
		if (visible && canvas) {
			ctx = canvas.getContext('2d')!;
			resizeCanvas();
			if (undoStack.length === 0) {
				undoStack.push(ctx.getImageData(0, 0, width, height));
			}
		}
	});

	function draw() {
		ctx.beginPath();
		ctx.moveTo(prevX, prevY);
		if (tool === 'eraser') {
			ctx.globalCompositeOperation = 'destination-out';
			ctx.arc(currX, currY, 20, 0, 2 * Math.PI, false);
		} else {
			ctx.globalCompositeOperation = 'source-over';
			ctx.lineWidth = 2;
			ctx.lineTo(currX, currY);
		}
		ctx.fill();
		ctx.strokeStyle = currentColor;
		ctx.stroke();
		ctx.closePath();
	}

	function getScrollTop(): number {
		return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
	}

	function handleMouseDown(e: MouseEvent) {
		prevX = currX;
		prevY = currY;
		currX = e.clientX - canvas.offsetLeft;
		currY = e.clientY - canvas.offsetTop + getScrollTop();
		isDrawing = true;

		ctx.beginPath();
		ctx.fillStyle = currentColor;
		ctx.fillRect(currX, currY, 2, 2);
		ctx.closePath();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDrawing) return;
		prevX = currX;
		prevY = currY;
		currX = e.clientX - canvas.offsetLeft;
		currY = e.clientY - canvas.offsetTop + getScrollTop();
		draw();
	}

	function handleMouseUp() {
		if (!isDrawing) return;
		isDrawing = false;
		saveUndoState();
	}

	function handleMouseOut() {
		isDrawing = false;
	}

	function handleTouchStart(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length !== 1) return;
		const touch = e.touches[0];
		currX = touch.pageX - (touch.target as HTMLElement).offsetLeft;
		currY = touch.pageY - (touch.target as HTMLElement).offsetTop;
		prevX = currX;
		prevY = currY;
		isDrawing = true;
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length !== 1) return;
		const touch = e.touches[0];
		prevX = currX;
		prevY = currY;
		currX = touch.pageX - (touch.target as HTMLElement).offsetLeft;
		currY = touch.pageY - (touch.target as HTMLElement).offsetTop;
		draw();
	}

	function handleTouchEnd() {
		isDrawing = false;
		saveUndoState();
	}

	function saveUndoState() {
		const state = ctx.getImageData(0, 0, width, height);
		if (undoIndex > 0) {
			undoStack.splice(0, undoIndex);
		}
		undoIndex = 0;
		undoStack.unshift(state);
	}

	function selectColor(color: string) {
		currentColor = color;
		tool = 'pen';
	}

	function selectEraser() {
		tool = 'eraser';
	}

	export function undo() {
		if (undoIndex + 1 < undoStack.length) {
			undoIndex += 1;
		}
		ctx.putImageData(undoStack[undoIndex], 0, 0);
	}

	export function redo() {
		if (undoIndex > 0) {
			undoIndex -= 1;
		}
		ctx.putImageData(undoStack[undoIndex], 0, 0);
	}

	export function clearScreen() {
		try {
			undoStack = [];
			undoIndex = 0;
			if (ctx) {
				ctx.clearRect(0, 0, width, height);
				undoStack.push(ctx.getImageData(0, 0, width, height));
			}
		} catch {
			// Canvas not yet initialized
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!visible) return;
		if (e.ctrlKey && e.key === 'z') {
			e.preventDefault();
			undo();
		}
		if (e.ctrlKey && e.key === 'y') {
			e.preventDefault();
			redo();
		}
	}
</script>

<svelte:window onresize={resizeCanvas} onkeydown={handleKeydown} />

{#if visible}
	<div id="draw" style="width: 100%; height: 100%;">
		<canvas
			bind:this={canvas}
			style="position: absolute; top: 0; left: 0; z-index: 5; cursor: {tool === 'eraser' ? "url('/img/circle_cursor.ico') 20 20, auto" : 'crosshair'};"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseout={handleMouseOut}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		></canvas>

		{#each COLORS as color, i}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="chooseColor"
				style="top: {170 + i * 60}px; background: {color.hex}; {color.id === 'white' ? 'color: black; border: 2px solid black;' : ''}"
				onclick={() => selectColor(color.hex)}
			>
				{#if (tool === 'pen' && currentColor === color.hex)}&#10004;{/if}
			</div>
		{/each}

		<img
			src="/img/eraser.svg"
			class="text chooseColor"
			style="top: {170 + COLORS.length * 60}px; border-radius: 0%; border: none; width: 40px; height: 50px; transform: rotate(45deg);"
			alt="Eraser"
			onclick={selectEraser}
		/>
		<img
			src="/img/trash.svg"
			class="text"
			id="clr"
			onclick={() => clearScreen()}
			style="z-index: 10; position: absolute; top: {170 + (COLORS.length + 1) * 60}px; right: 10px; font-size: 40px; width: 50px; cursor: pointer;"
			alt="Clear"
		/>
		<img
			src="/img/corner-down-left.svg"
			class="text"
			onclick={() => undo()}
			style="z-index: 10; position: absolute; top: {170 + (COLORS.length + 2) * 60}px; right: 15px; font-size: 40px; width: 50px; cursor: pointer;"
			alt="Undo"
		/>
		<img
			src="/img/corner-down-right.svg"
			class="text"
			onclick={() => redo()}
			style="z-index: 10; position: absolute; top: {170 + (COLORS.length + 2) * 60 + 50}px; right: 15px; font-size: 40px; width: 50px; cursor: pointer;"
			alt="Redo"
		/>
	</div>
{/if}
