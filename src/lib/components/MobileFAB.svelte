<!--
  MobileFAB Component
  Floating Action Button for opening the device library on mobile
  Hidden during placement mode
-->
<script lang="ts">
	import { IconPlus } from './icons';
	import { getPlacementStore } from '$lib/stores/placement.svelte';

	interface Props {
		onclick?: () => void;
	}

	let { onclick }: Props = $props();

	const placementStore = getPlacementStore();

	// Hide FAB when placement mode is active
	const isHidden = $derived(placementStore.isActive);
</script>

{#if !isHidden}
	<button
		class="mobile-fab"
		onclick={onclick}
		aria-label="Add device to rack"
		aria-haspopup="dialog"
	>
		<IconPlus size={24} />
	</button>
{/if}

<style>
	.mobile-fab {
		position: fixed;
		bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
		right: var(--space-6);
		z-index: var(--z-fab);

		display: flex;
		align-items: center;
		justify-content: center;

		width: 56px;
		height: 56px;
		border: none;
		border-radius: 50%;

		background: var(--dracula-purple);
		color: white;
		box-shadow:
			var(--glow-purple-sm),
			0 4px 12px rgba(0, 0, 0, 0.25),
			0 2px 4px rgba(0, 0, 0, 0.15);

		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		touch-action: manipulation;
	}

	.mobile-fab:hover {
		transform: scale(1.05);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.3),
			0 3px 6px rgba(0, 0, 0, 0.2);
	}

	.mobile-fab:active {
		transform: scale(0.95);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.mobile-fab:focus {
		outline: none;
		box-shadow:
			var(--glow-purple-md),
			0 4px 12px rgba(0, 0, 0, 0.25),
			0 2px 4px rgba(0, 0, 0, 0.15),
			0 0 0 3px rgba(189, 147, 249, 0.4);
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.mobile-fab {
			transition: none;
		}
	}
</style>
