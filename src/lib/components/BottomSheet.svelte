<!--
  BottomSheet Component
  Slide-up modal for mobile device details with swipe-to-dismiss gesture
  Uses div-based approach for iOS 14 compatibility + Hammer.js for gestures
-->
<script lang="ts">
	import Hammer from '@egjs/hammerjs';
	import { debug } from '$lib/utils/debug';

	interface Props {
		open: boolean;
		onclose?: () => void;
		children?: import('svelte').Snippet;
	}

	let { open = $bindable(false), onclose, children }: Props = $props();

	let sheetElement: HTMLDivElement | null = $state(null);
	let dragOffset = $state(0);
	let isDragging = $state(false);

	// Close threshold: if dragged down more than 100px, close on release
	const CLOSE_THRESHOLD = 100;

	// Set up Hammer.js for swipe-to-dismiss gesture
	$effect(() => {
		if (!sheetElement || !open) return;

		debug.log('BottomSheet: setting up Hammer.js pan gesture');
		const hammer = new Hammer(sheetElement, {
			recognizers: [
				[Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }]
			]
		});

		hammer.on('panstart', () => {
			isDragging = true;
		});

		hammer.on('panmove', (e: HammerInput) => {
			// Only allow dragging down (positive deltaY)
			dragOffset = Math.max(0, e.deltaY);
		});

		hammer.on('panend', (e: HammerInput) => {
			isDragging = false;

			// Close if dragged down past threshold
			if (e.deltaY > CLOSE_THRESHOLD && e.direction === Hammer.DIRECTION_DOWN) {
				debug.log('BottomSheet: swipe-to-dismiss triggered');
				closeSheet();
			}

			// Reset offset
			dragOffset = 0;
		});

		hammer.on('pancancel', () => {
			isDragging = false;
			dragOffset = 0;
		});

		return () => {
			debug.log('BottomSheet: cleaning up Hammer.js');
			hammer.destroy();
		};
	});

	// Prevent body scroll when sheet is open (simplified - no position:fixed trick)
	$effect(() => {
		if (open) {
			debug.log('BottomSheet: preventing body scroll');
			const originalOverflow = document.body.style.overflow;

			// Simple overflow hidden - avoids layout disruption
			document.body.style.overflow = 'hidden';

			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});

	// Handle Escape key
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			closeSheet();
		}
	}


	function closeSheet() {
		open = false;
		onclose?.();
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<!-- Div-based modal for iOS 14 compatibility - no backdrop overlay -->
	<div
		class="bottom-sheet-container"
		role="dialog"
		aria-modal="true"
	>
		<!-- Sheet content wrapper - Hammer.js handles gestures -->
		<div
			bind:this={sheetElement}
			class="bottom-sheet"
			class:dragging={isDragging}
			style:transform={dragOffset > 0 ? `translateY(${dragOffset}px)` : ''}
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
	/* Container anchored to bottom - no full-viewport coverage */
	.bottom-sheet-container {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: var(--z-modal, 200);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		pointer-events: none;
	}

	/* Sheet content wrapper */
	.bottom-sheet {
		position: relative;
		width: 100%;
		max-height: calc(100vh - 60px);
		max-height: calc(100dvh - 60px);
		background: var(--colour-bg, #282a36);
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
		/* Start visible (no animation needed since conditionally rendered) */
		transform: translateY(0);
		transition: transform 0.15s ease-out;
		touch-action: pan-y;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		/* Ensure sheet receives pointer events */
		pointer-events: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.bottom-sheet {
			transition: none;
		}
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
