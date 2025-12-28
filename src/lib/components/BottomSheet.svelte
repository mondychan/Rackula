<!--
  BottomSheet Component
  Slide-up modal for mobile device details with swipe-to-dismiss gesture
-->
<script lang="ts">
	import { debug } from '$lib/utils/debug';

	interface Props {
		open: boolean;
		onclose?: () => void;
		children?: import('svelte').Snippet;
	}

	let { open = $bindable(false), onclose, children }: Props = $props();

	let sheetElement: HTMLDivElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);
	let startY = $state(0);
	let currentY = $state(0);
	let isDragging = $state(false);

	// Debug: log when sheet opens/closes
	$effect(() => {
		debug.log('BottomSheet state:', { open, hasContainer: !!containerElement, hasSheet: !!sheetElement });
		if (open && containerElement) {
			// Log computed styles for debugging
			const containerStyles = window.getComputedStyle(containerElement);
			debug.log('BottomSheet container computed styles:', {
				position: containerStyles.position,
				background: containerStyles.background,
				backgroundColor: containerStyles.backgroundColor,
				zIndex: containerStyles.zIndex
			});
		}
	});

	// Transform value for dragging (positive = dragging down)
	const translateY = $derived(isDragging ? Math.max(0, currentY - startY) : 0);

	// Close threshold: if dragged down more than 100px, close on release
	const CLOSE_THRESHOLD = 100;

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeSheet();
		}
	}

	function closeSheet() {
		open = false;
		onclose?.();
	}

	// Swipe-to-dismiss gesture handlers
	function handlePointerDown(event: PointerEvent) {
		// Only handle touch/pen events on the sheet itself
		if (event.pointerType === 'mouse') return;

		startY = event.clientY;
		currentY = event.clientY;
		isDragging = true;

		// Capture pointer for smooth tracking
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;
		currentY = event.clientY;
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging) return;

		const dragDistance = currentY - startY;

		// Close if dragged down past threshold
		if (dragDistance > CLOSE_THRESHOLD) {
			closeSheet();
		}

		isDragging = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	function handlePointerCancel(event: PointerEvent) {
		isDragging = false;
		if (event.currentTarget) {
			(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		}
	}

	// Handle Escape key to close
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			closeSheet();
		}
	}

	// Prevent body scroll when sheet is open
	$effect(() => {
		if (open) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<div
		bind:this={containerElement}
		class="bottom-sheet-container"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
		role="button"
		tabindex="-1"
	>
		<!-- Backdrop: using ::before pseudo-element instead for better Safari compatibility -->
		<!-- Sheet -->
		<div
			bind:this={sheetElement}
			class="bottom-sheet"
			class:open
			class:dragging={isDragging}
			style:transform={isDragging ? `translateY(${translateY}px)` : ''}
			role="dialog"
			aria-modal="true"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerCancel}
		>
			<!-- Drag handle -->
			<div class="drag-handle">
				<div class="drag-handle-bar"></div>
			</div>

			<!-- Content -->
			<div class="sheet-content">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-container {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		pointer-events: all;
		/* Safari fix: explicit transparent background and isolation */
		background: none;
		background-color: transparent;
		isolation: isolate;
	}

	/* Backdrop as pseudo-element for better Safari compatibility */
	.bottom-sheet-container::before {
		content: '';
		position: absolute;
		inset: 0;
		/* Safari bug: avoid exact 0.5 - use .50 or 0.49 instead */
		background-color: rgba(0, 0, 0, .50);
		/* Ensure backdrop is behind sheet content */
		z-index: -1;
		/* iOS Safari: force GPU layer for proper compositing */
		-webkit-transform: translateZ(0);
		transform: translateZ(0);
	}

	.bottom-sheet {
		position: relative;
		/* Ensure sheet is above the ::before backdrop */
		z-index: 1;
		width: 100%;
		/* Extend almost to top, leaving space for toolbar (~60px) */
		max-height: calc(100vh - 60px);
		max-height: calc(100dvh - 60px);
		background: var(--colour-bg);
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		transform: translateY(100%) translateZ(0);
		-webkit-transform: translateY(100%) translateZ(0);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		touch-action: pan-y;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	@media (prefers-reduced-motion: reduce) {
		.bottom-sheet {
			transition: none;
		}
	}

	.bottom-sheet.open {
		transform: translateY(0) translateZ(0);
		-webkit-transform: translateY(0) translateZ(0);
	}

	.bottom-sheet.dragging {
		transition: none;
	}

	.drag-handle {
		display: flex;
		justify-content: center;
		padding: 0.75rem 0;
		cursor: grab;
		user-select: none;
		flex-shrink: 0;
	}

	.drag-handle-bar {
		width: 2.5rem;
		height: 0.25rem;
		background: var(--colour-text-muted);
		opacity: 0.4;
		border-radius: 0.125rem;
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 1.5rem 1.5rem;
	}

	/* Scrollbar styling */
	.sheet-content::-webkit-scrollbar {
		width: 0.5rem;
	}

	.sheet-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.sheet-content::-webkit-scrollbar-thumb {
		background: var(--colour-text-muted);
		opacity: 0.3;
		border-radius: 0.25rem;
	}
</style>
