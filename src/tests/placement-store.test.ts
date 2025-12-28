/**
 * Placement Store Tests
 * Tests for mobile tap-to-place flow state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getPlacementStore, resetPlacementStore } from '$lib/stores/placement.svelte';
import { createTestDeviceType } from './factories';

describe('Placement Store', () => {
	beforeEach(() => {
		resetPlacementStore();
	});

	describe('initial state', () => {
		it('is not active', () => {
			const store = getPlacementStore();
			expect(store.isActive).toBe(false);
		});

		it('has no device', () => {
			const store = getPlacementStore();
			expect(store.device).toBeNull();
		});

		it('has front as default face', () => {
			const store = getPlacementStore();
			expect(store.targetFace).toBe('front');
		});

		it('has no preview position', () => {
			const store = getPlacementStore();
			expect(store.previewPosition).toBeNull();
		});

		it('is not valid', () => {
			const store = getPlacementStore();
			expect(store.isValid).toBe(false);
		});

		it('is not blocked', () => {
			const store = getPlacementStore();
			expect(store.isBlocked).toBe(false);
		});

		it('is not in move mode', () => {
			const store = getPlacementStore();
			expect(store.isMoving).toBe(false);
		});
	});

	describe('enterPlacementMode', () => {
		it('activates placement mode', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'test-server', u_height: 2 });

			store.enterPlacementMode(device);

			expect(store.isActive).toBe(true);
			expect(store.device).toStrictEqual(device);
		});

		it('defaults to front face for half-depth devices', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'half-depth', is_full_depth: false });

			store.enterPlacementMode(device);

			expect(store.targetFace).toBe('front');
		});

		it('defaults to both face for full-depth devices', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'full-depth', is_full_depth: true });

			store.enterPlacementMode(device);

			expect(store.targetFace).toBe('both');
		});

		it('accepts custom initial face', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'test', is_full_depth: false });

			store.enterPlacementMode(device, 'rear');

			expect(store.targetFace).toBe('rear');
		});

		it('resets preview state', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();

			// Set some state first
			store.enterPlacementMode(device);
			store.updatePreview(5, true, false);

			// Enter again should reset
			const newDevice = createTestDeviceType({ slug: 'new-device' });
			store.enterPlacementMode(newDevice);

			expect(store.previewPosition).toBeNull();
			expect(store.isValid).toBe(false);
			expect(store.isBlocked).toBe(false);
		});

		it('is not in move mode', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();

			store.enterPlacementMode(device);

			expect(store.isMoving).toBe(false);
			expect(store.originalPosition).toBeNull();
			expect(store.originalFace).toBeNull();
		});
	});

	describe('enterMoveMode', () => {
		it('activates placement mode for moving', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'moving-device' });

			store.enterMoveMode(device, 10, 'front');

			expect(store.isActive).toBe(true);
			expect(store.device).toStrictEqual(device);
			expect(store.isMoving).toBe(true);
		});

		it('stores original position and face', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();

			store.enterMoveMode(device, 15, 'rear');

			expect(store.originalPosition).toBe(15);
			expect(store.originalFace).toBe('rear');
		});

		it('preserves the current face', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();

			store.enterMoveMode(device, 10, 'rear');

			expect(store.targetFace).toBe('rear');
		});
	});

	describe('updatePreview', () => {
		it('updates preview position', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			store.updatePreview(5, true, false);

			expect(store.previewPosition).toBe(5);
		});

		it('updates validity state', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			store.updatePreview(5, true, false);
			expect(store.isValid).toBe(true);

			store.updatePreview(5, false, false);
			expect(store.isValid).toBe(false);
		});

		it('updates blocked state', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			store.updatePreview(5, false, true);

			expect(store.isBlocked).toBe(true);
		});

		it('can set position to null', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			store.updatePreview(5, true, false);
			store.updatePreview(null, false, false);

			expect(store.previewPosition).toBeNull();
		});
	});

	describe('toggleFace', () => {
		it('toggles from front to rear', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: false });
			store.enterPlacementMode(device, 'front');

			store.toggleFace();

			expect(store.targetFace).toBe('rear');
		});

		it('toggles from rear to front', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: false });
			store.enterPlacementMode(device, 'rear');

			store.toggleFace();

			expect(store.targetFace).toBe('front');
		});

		it('does nothing for full-depth devices', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: true });
			store.enterPlacementMode(device);

			expect(store.targetFace).toBe('both');
			store.toggleFace();
			expect(store.targetFace).toBe('both');
		});
	});

	describe('setFace', () => {
		it('sets the face directly', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: false });
			store.enterPlacementMode(device, 'front');

			store.setFace('rear');

			expect(store.targetFace).toBe('rear');
		});

		it('does nothing for full-depth devices', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: true });
			store.enterPlacementMode(device);

			store.setFace('front');

			expect(store.targetFace).toBe('both');
		});
	});

	describe('cancelPlacement', () => {
		it('resets to initial state', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);
			store.updatePreview(10, true, false);

			store.cancelPlacement();

			expect(store.isActive).toBe(false);
			expect(store.device).toBeNull();
			expect(store.previewPosition).toBeNull();
		});

		it('returns null for new device placement', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			const result = store.cancelPlacement();

			expect(result).toBeNull();
		});

		it('returns original position for move operations', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterMoveMode(device, 15, 'rear');

			const result = store.cancelPlacement();

			expect(result).toEqual({ position: 15, face: 'rear' });
		});
	});

	describe('confirmPlacement', () => {
		it('returns null if not active', () => {
			const store = getPlacementStore();

			const result = store.confirmPlacement();

			expect(result).toBeNull();
		});

		it('returns null if no preview position', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);

			const result = store.confirmPlacement();

			expect(result).toBeNull();
		});

		it('returns null if position is invalid', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);
			store.updatePreview(5, false, true); // invalid, blocked

			const result = store.confirmPlacement();

			expect(result).toBeNull();
		});

		it('returns placement info when valid', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'my-server' });
			store.enterPlacementMode(device, 'rear');
			store.updatePreview(10, true, false);

			const result = store.confirmPlacement();

			expect(result).toEqual({
				device,
				position: 10,
				face: 'rear'
			});
		});

		it('resets store after confirmation', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType();
			store.enterPlacementMode(device);
			store.updatePreview(10, true, false);

			store.confirmPlacement();

			expect(store.isActive).toBe(false);
			expect(store.device).toBeNull();
		});
	});

	describe('full placement flow', () => {
		it('completes new device placement', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'new-server', u_height: 2 });

			// 1. Enter placement mode
			store.enterPlacementMode(device);
			expect(store.isActive).toBe(true);

			// 2. User drags over invalid position
			store.updatePreview(50, false, false); // out of bounds
			expect(store.isValid).toBe(false);

			// 3. User drags to valid position
			store.updatePreview(10, true, false);
			expect(store.isValid).toBe(true);

			// 4. User confirms placement
			const result = store.confirmPlacement();
			expect(result).toEqual({
				device,
				position: 10,
				face: 'both' // full depth by default
			});

			// 5. Store is reset
			expect(store.isActive).toBe(false);
		});

		it('completes move operation with face change', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ slug: 'moving-device', is_full_depth: false });

			// 1. Enter move mode from position 5, front face
			store.enterMoveMode(device, 5, 'front');
			expect(store.isMoving).toBe(true);

			// 2. User changes to rear face
			store.toggleFace();
			expect(store.targetFace).toBe('rear');

			// 3. User selects new position
			store.updatePreview(15, true, false);

			// 4. User confirms
			const result = store.confirmPlacement();
			expect(result).toEqual({
				device,
				position: 15,
				face: 'rear'
			});
		});

		it('cancels move and returns original position', () => {
			const store = getPlacementStore();
			const device = createTestDeviceType({ is_full_depth: false });

			// 1. Enter move mode
			store.enterMoveMode(device, 20, 'rear');

			// 2. User previews new position
			store.updatePreview(5, true, false);

			// 3. User cancels
			const result = store.cancelPlacement();

			// Should return original position for restoration
			expect(result).toEqual({ position: 20, face: 'rear' });
			expect(store.isActive).toBe(false);
		});
	});
});
