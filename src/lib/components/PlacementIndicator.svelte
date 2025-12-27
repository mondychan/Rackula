<!--
  PlacementIndicator Component
  Shows current placement mode state with device name, face toggle, and cancel button
  Displayed in toolbar area on mobile during placement mode
-->
<script lang="ts">
	import { getPlacementStore } from '$lib/stores/placement.svelte';
	import CategoryIcon from './CategoryIcon.svelte';

	const placementStore = getPlacementStore();

	// Device display name
	const deviceName = $derived(placementStore.device?.model ?? placementStore.device?.slug ?? '');

	// Face toggle is only available for half-depth devices
	const canToggleFace = $derived(placementStore.device?.is_full_depth === false);

	// Face display text
	const faceText = $derived.by(() => {
		const face = placementStore.targetFace;
		if (face === 'both') return 'Full';
		return face === 'front' ? 'Front' : 'Rear';
	});

	function handleCancel() {
		placementStore.cancelPlacement();
		// Haptic feedback
		if (navigator.vibrate) {
			navigator.vibrate(30);
		}
	}

	function handleToggleFace() {
		placementStore.toggleFace();
		// Haptic feedback
		if (navigator.vibrate) {
			navigator.vibrate(20);
		}
	}
</script>

{#if placementStore.isActive && placementStore.device}
	<div
		class="placement-indicator"
		role="alert"
		aria-live="polite"
		aria-label="Placement mode: placing {deviceName}"
	>
		<!-- Device info -->
		<div class="device-info">
			<div class="device-icon">
				<CategoryIcon category={placementStore.device.category} size={16} />
			</div>
			<span class="device-name">{deviceName}</span>
			<span class="device-height">{placementStore.device.u_height}U</span>
		</div>

		<!-- Face toggle (only for half-depth devices) -->
		{#if canToggleFace}
			<button
				class="face-toggle"
				onclick={handleToggleFace}
				aria-label="Toggle placement face, currently {faceText}"
			>
				{faceText}
			</button>
		{/if}

		<!-- Cancel button -->
		<button class="cancel-button" onclick={handleCancel} aria-label="Cancel placement">
			<span class="cancel-x" aria-hidden="true">×</span>
		</button>
	</div>
{/if}

<style>
	.placement-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--colour-success-alpha, rgba(80, 250, 123, 0.15));
		border: 1px solid var(--colour-success, #50fa7b);
		border-radius: var(--radius-md);
		color: var(--colour-text);
		animation: pulse-border 1.5s ease-in-out infinite;
	}

	@keyframes pulse-border {
		0%,
		100% {
			border-color: var(--colour-success, #50fa7b);
		}
		50% {
			border-color: var(--colour-success-dark, #69ff94);
		}
	}

	.device-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
	}

	.device-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--colour-text-muted);
		flex-shrink: 0;
	}

	.device-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.device-height {
		font-size: var(--font-size-xs);
		color: var(--colour-text-muted);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.face-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--colour-border);
		border-radius: var(--radius-sm);
		background: var(--colour-bg-secondary);
		color: var(--colour-text);
		font-size: var(--font-size-xs);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		min-width: 44px;
		height: 28px;
	}

	.face-toggle:hover {
		background: var(--colour-bg-tertiary);
		border-color: var(--colour-primary);
	}

	.face-toggle:active {
		transform: scale(0.95);
	}

	.cancel-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-sm);
		background: var(--colour-error-alpha, rgba(255, 85, 85, 0.15));
		color: var(--colour-error, #ff5555);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.cancel-button:hover {
		background: var(--colour-error, #ff5555);
		color: white;
	}

	.cancel-button:active {
		transform: scale(0.95);
	}

	.cancel-x {
		font-size: 18px;
		font-weight: 300;
		line-height: 1;
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.placement-indicator {
			animation: none;
		}

		.face-toggle,
		.cancel-button {
			transition: none;
		}
	}
</style>
