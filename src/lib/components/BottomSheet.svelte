<!--
  BottomSheet Component
  Slide-up modal for mobile device details with swipe-to-dismiss gesture
  Uses native <dialog> element for better iOS Safari compatibility
-->
<script lang="ts">
	import { debug } from '$lib/utils/debug';

	interface Props {
		open: boolean;
		onclose?: () => void;
		children?: import('svelte').Snippet;
	}

	let { open = $bindable(false), onclose, children }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let sheetElement: HTMLDivElement | null = $state(null);
	let startY = $state(0);
	let currentY = $state(0);
	let isDragging = $state(false);

	// Sync dialog open/close with native dialog API
	$effect(() => {
		if (!dialogElement) return;

		if (open && !dialogElement.open) {
			debug.log('BottomSheet: opening dialog via showModal()');
			dialogElement.showModal();
		} else if (!open && dialogElement.open) {
			debug.log('BottomSheet: closing dialog');
			dialogElement.close();
		}
	});

	// Debug: log computed styles when open
	$effect(() => {
		debug.log('BottomSheet state:', { open, hasDialog: !!dialogElement, hasSheet: !!sheetElement });
		if (open && dialogElement) {
			// Log computed styles for debugging
			const dialogStyles = window.getComputedStyle(dialogElement);
			const backdropStyles = window.getComputedStyle(dialogElement, '::backdrop');
			debug.log('BottomSheet dialog computed styles:', {
				display: dialogStyles.display,
				position: dialogStyles.position,
				background: dialogStyles.background,
				backgroundColor: dialogStyles.backgroundColor
			});
			debug.log('BottomSheet ::backdrop computed styles:', {
				backgroundColor: backdropStyles.backgroundColor,
				opacity: backdropStyles.opacity
			});
		}
	});

	// Transform value for dragging (positive = dragging down)
	const translateY = $derived(isDragging ? Math.max(0, currentY - startY) : 0);

	// Close threshold: if dragged down more than 100px, close on release
	const CLOSE_THRESHOLD = 100;

	// Handle clicks on the dialog backdrop (outside the sheet content)
	function handleDialogClick(event: MouseEvent) {
		// Close if clicking directly on dialog (the backdrop area)
		if (event.target === dialogElement) {
			closeSheet();
		}
	}

	function closeSheet() {
		open = false;
		onclose?.();
	}

	// Handle native dialog close event (e.g., Escape key)
	function handleDialogClose() {
		if (open) {
			open = false;
			onclose?.();
		}
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

	// Note: Escape key and body scroll prevention are handled natively by <dialog>
</script>

<!-- Native dialog element - always rendered but controlled via showModal()/close() -->
<dialog
	bind:this={dialogElement}
	class="bottom-sheet-dialog"
	onclick={handleDialogClick}
	onclose={handleDialogClose}
>
	<!-- Sheet content wrapper -->
	<div
		bind:this={sheetElement}
		class="bottom-sheet"
		class:open
		class:dragging={isDragging}
		style:transform={isDragging ? `translateY(${translateY}px)` : ''}
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
</dialog>

<style>
	/* Native dialog element styling */
	.bottom-sheet-dialog {
		/* Reset default dialog styles */
		padding: 0;
		border: none;
		/* Position at bottom of viewport */
		position: fixed;
		inset: auto 0 0 0;
		margin: 0;
		/* Full width, max height from bottom */
		width: 100%;
		max-width: 100%;
		max-height: calc(100vh - 60px);
		max-height: calc(100dvh - 60px);
		/* Transparent background - the sheet provides the visual */
		background: transparent;
		/* High z-index for modal layer */
		z-index: 1000;
		/* Allow overscroll containment for iOS */
		overscroll-behavior: contain;
	}

	/* Native ::backdrop pseudo-element */
	.bottom-sheet-dialog::backdrop {
		/* Use hardcoded value, not CSS variable (iOS Safari bug) */
		background-color: rgba(0, 0, 0, 0.50);
		/* Ensure it's visible */
		opacity: 1;
	}

	/* Sheet content wrapper */
	.bottom-sheet {
		position: relative;
		width: 100%;
		height: auto;
		max-height: calc(100vh - 60px);
		max-height: calc(100dvh - 60px);
		background: var(--colour-bg);
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		/* Animation: slide up from bottom */
		transform: translateY(100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		touch-action: pan-y;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* Dialog is open - slide sheet into view */
	.bottom-sheet-dialog[open] .bottom-sheet {
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.bottom-sheet {
			transition: none;
		}
	}

	/* Legacy classes for animation state (if needed) */
	.bottom-sheet.open {
		transform: translateY(0);
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
