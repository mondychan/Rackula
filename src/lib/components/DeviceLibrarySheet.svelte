<!--
  DeviceLibrarySheet Component
  Mobile-optimized bottom sheet for device selection
  Tap a device to enter placement mode
-->
<script lang="ts">
	import BottomSheet from './BottomSheet.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import { getLayoutStore } from '$lib/stores/layout.svelte';
	import { getPlacementStore } from '$lib/stores/placement.svelte';
	import { searchDevices } from '$lib/utils/deviceFilters';
	import { getBrandPacks } from '$lib/data/brandPacks';
	import { getStarterLibrary, getStarterSlugs } from '$lib/data/starterLibrary';
	import { getBrandSlugs } from '$lib/data/brandPacks';
	import type { DeviceType, DeviceCategory } from '$lib/types';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	const layoutStore = getLayoutStore();
	const placementStore = getPlacementStore();

	// Search state
	let searchQuery = $state('');
	const isSearchActive = $derived(searchQuery.trim().length > 0);

	// Category filter
	let selectedCategory = $state<DeviceCategory | 'all'>('all');

	// Category definitions with icons
	const categories: { id: DeviceCategory | 'all'; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'server', label: 'Servers' },
		{ id: 'network', label: 'Network' },
		{ id: 'storage', label: 'Storage' },
		{ id: 'power', label: 'Power' },
		{ id: 'patch-panel', label: 'Patch' },
		{ id: 'kvm', label: 'KVM' },
		{ id: 'shelf', label: 'Shelf' },
		{ id: 'blank', label: 'Blank' },
		{ id: 'other', label: 'Other' }
	];

	// Get brand packs
	const brandPacks = getBrandPacks();

	// Merge all devices (starter + brand packs + custom)
	const allDevices = $derived.by(() => {
		const starter = getStarterLibrary();
		const placed = layoutStore.device_types;
		const placedSlugs = new Set(placed.map((d) => d.slug));
		const starterSlugs = getStarterSlugs();
		const brandSlugs = getBrandSlugs();
		const brandDevices = brandPacks.flatMap((p) => p.devices);

		// Combine: starter (not shadowed) + placed versions + custom + brand devices
		return [
			...starter.filter((d) => !placedSlugs.has(d.slug)),
			...placed.filter((d) => starterSlugs.has(d.slug)),
			...placed.filter((d) => !starterSlugs.has(d.slug) && !brandSlugs.has(d.slug)),
			...brandDevices
		];
	});

	// Filter by search and category
	const filteredDevices = $derived.by(() => {
		let devices = allDevices;

		// Apply search filter
		if (isSearchActive) {
			devices = searchDevices(devices, searchQuery);
		}

		// Apply category filter
		if (selectedCategory !== 'all') {
			devices = devices.filter((d) => d.category === selectedCategory);
		}

		// Sort alphabetically by model/slug
		return [...devices].sort((a, b) => {
			const nameA = (a.model ?? a.slug).toLowerCase();
			const nameB = (b.model ?? b.slug).toLowerCase();
			return nameA.localeCompare(nameB);
		});
	});

	// Handle device tap - enter placement mode
	function handleDeviceTap(device: DeviceType) {
		placementStore.enterPlacementMode(device);
		// Close the sheet
		open = false;
		onclose?.();

		// Haptic feedback
		if (navigator.vibrate) {
			navigator.vibrate(30);
		}
	}

	// Clear search when sheet closes
	$effect(() => {
		if (!open) {
			searchQuery = '';
			selectedCategory = 'all';
		}
	});
</script>

<BottomSheet bind:open {onclose}>
	<div class="device-library-sheet">
		<!-- Sticky header area (doesn't scroll) -->
		<div class="sticky-header">
			<!-- Header with search -->
			<div class="sheet-header">
				<h2 class="sheet-title">Add Device</h2>
				<input
					type="search"
					class="search-input"
					placeholder="Search devices..."
					bind:value={searchQuery}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
				/>
			</div>

			<!-- Category filter pills -->
			<div class="category-pills">
				{#each categories as category (category.id)}
					<button
						class="category-pill"
						class:active={selectedCategory === category.id}
						onclick={() => (selectedCategory = category.id)}
					>
						{category.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Device list (scrolls independently) -->
		<div class="device-list">
			{#if filteredDevices.length === 0}
				<div class="empty-state">
					{#if isSearchActive}
						<p>No devices match "{searchQuery}"</p>
					{:else}
						<p>No devices in this category</p>
					{/if}
				</div>
			{:else}
				{#each filteredDevices as device (device.slug)}
					<button class="device-item" onclick={() => handleDeviceTap(device)}>
						<div class="device-icon">
							<CategoryIcon category={device.category} size={20} />
						</div>
						<div class="device-info">
							<span class="device-name">{device.model ?? device.slug}</span>
							{#if device.manufacturer}
								<span class="device-manufacturer">{device.manufacturer}</span>
							{/if}
						</div>
						<div class="device-height">
							<span class="height-badge">{device.u_height}U</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</BottomSheet>

<style>
	.device-library-sheet {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Sticky header area - sticks to top of scroll container */
	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		background: var(--colour-bg);
		padding-bottom: var(--space-2);
		/* Negative margin to extend bg to edges, compensate with padding */
		margin: 0 -1.5rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.sheet-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.sheet-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--colour-text);
		margin: 0;
	}

	.search-input {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--colour-border);
		border-radius: var(--radius-md);
		background: var(--colour-bg-secondary);
		color: var(--colour-text);
		font-size: var(--font-size-base);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--colour-primary);
		box-shadow: 0 0 0 2px var(--colour-primary-alpha);
	}

	.search-input::placeholder {
		color: var(--colour-text-muted);
	}

	/* Category filter pills */
	.category-pills {
		display: flex;
		gap: var(--space-2);
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.category-pills::-webkit-scrollbar {
		display: none;
	}

	.category-pill {
		flex-shrink: 0;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--colour-border);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--colour-text-muted);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.category-pill:hover {
		border-color: var(--colour-primary);
		color: var(--colour-text);
	}

	.category-pill.active {
		background: transparent;
		border-color: var(--colour-primary);
		color: var(--colour-primary);
	}

	/* Device list */
	.device-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.device-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border: none;
		border-radius: var(--radius-md);
		background: var(--colour-bg-secondary);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
		min-height: 56px; /* 48px minimum touch target + padding */
	}

	.device-item:hover,
	.device-item:focus {
		background: var(--colour-bg-tertiary);
		outline: none;
	}

	.device-item:active {
		background: var(--colour-bg-active);
	}

	.device-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		background: var(--colour-bg-tertiary);
		color: var(--colour-text-muted);
		flex-shrink: 0;
	}

	.device-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.device-name {
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--colour-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.device-manufacturer {
		font-size: var(--font-size-sm);
		color: var(--colour-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.device-height {
		flex-shrink: 0;
	}

	.height-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--colour-bg-tertiary);
		color: var(--colour-text-muted);
		font-size: var(--font-size-sm);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
		color: var(--colour-text-muted);
		text-align: center;
	}

	.empty-state p {
		margin: 0;
	}
</style>
