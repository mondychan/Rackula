/**
 * Placement Store
 * Manages tap-to-place state for mobile device placement using Svelte 5 runes
 *
 * Flow:
 * 1. User taps device in library → enterPlacementMode(device)
 * 2. Ghost preview follows touch → updatePreview(uPosition, isValid, isBlocked)
 * 3. User taps rack position → placeDevice() commits to layout
 * 4. Long-press or cancel button → cancelPlacement()
 */

import type { DeviceType, DeviceFace } from '$lib/types';

// Module-level state (using $state rune)
let isActive = $state(false);
let device = $state<DeviceType | null>(null);
let targetFace = $state<DeviceFace>('front');
let previewPosition = $state<number | null>(null);
let isValid = $state(false);
let isBlocked = $state(false);

// For move operations - store original position to restore on cancel
let originalPosition = $state<number | null>(null);
let originalFace = $state<DeviceFace | null>(null);
let isMoving = $state(false);

/**
 * Reset the store to initial state (primarily for testing)
 */
export function resetPlacementStore(): void {
	isActive = false;
	device = null;
	targetFace = 'front';
	previewPosition = null;
	isValid = false;
	isBlocked = false;
	originalPosition = null;
	originalFace = null;
	isMoving = false;
}

/**
 * Get access to the placement store
 * @returns Store object with state and actions
 */
export function getPlacementStore() {
	return {
		// State getters
		get isActive() {
			return isActive;
		},
		get device() {
			return device;
		},
		get targetFace() {
			return targetFace;
		},
		get previewPosition() {
			return previewPosition;
		},
		get isValid() {
			return isValid;
		},
		get isBlocked() {
			return isBlocked;
		},
		get isMoving() {
			return isMoving;
		},
		get originalPosition() {
			return originalPosition;
		},
		get originalFace() {
			return originalFace;
		},

		// Actions
		enterPlacementMode,
		enterMoveMode,
		updatePreview,
		toggleFace,
		setFace,
		cancelPlacement,
		confirmPlacement
	};
}

/**
 * Enter placement mode for a new device from the library
 * @param deviceType - The device type to place
 * @param face - Initial face (default: front, or 'both' for full-depth)
 */
function enterPlacementMode(deviceType: DeviceType, face?: DeviceFace): void {
	device = deviceType;
	// Full-depth devices default to 'both', others to 'front'
	targetFace = face ?? (deviceType.is_full_depth !== false ? 'both' : 'front');
	previewPosition = null;
	isValid = false;
	isBlocked = false;
	originalPosition = null;
	originalFace = null;
	isMoving = false;
	isActive = true;
}

/**
 * Enter move mode for an existing device
 * Stores original position to restore on cancel
 * @param deviceType - The device type being moved
 * @param currentPosition - Current U position
 * @param currentFace - Current face
 */
function enterMoveMode(
	deviceType: DeviceType,
	currentPosition: number,
	currentFace: DeviceFace
): void {
	device = deviceType;
	targetFace = currentFace;
	previewPosition = null;
	isValid = false;
	isBlocked = false;
	originalPosition = currentPosition;
	originalFace = currentFace;
	isMoving = true;
	isActive = true;
}

/**
 * Update the ghost preview position and validity
 * Called on touchmove over the rack
 * @param uPosition - The U position being previewed (1-indexed)
 * @param valid - Whether placement would be valid
 * @param blocked - Whether position is blocked by another device
 */
function updatePreview(uPosition: number | null, valid: boolean, blocked: boolean): void {
	previewPosition = uPosition;
	isValid = valid;
	isBlocked = blocked;
}

/**
 * Toggle between front and rear face
 * Does nothing for full-depth devices
 */
function toggleFace(): void {
	if (device?.is_full_depth !== false) return;

	if (targetFace === 'front') {
		targetFace = 'rear';
	} else if (targetFace === 'rear') {
		targetFace = 'front';
	}
	// 'both' stays as 'both'
}

/**
 * Set a specific face
 * @param face - The face to set
 */
function setFace(face: DeviceFace): void {
	if (device?.is_full_depth !== false) return;
	targetFace = face;
}

/**
 * Cancel placement mode without placing
 * Returns original position info for move operations (caller should restore)
 */
function cancelPlacement(): { position: number; face: DeviceFace } | null {
	const result =
		isMoving && originalPosition !== null && originalFace !== null
			? { position: originalPosition, face: originalFace }
			: null;

	resetPlacementStore();
	return result;
}

/**
 * Confirm placement at current preview position
 * Returns placement info for the caller to commit to layout
 * @returns Placement details or null if invalid
 */
function confirmPlacement(): {
	device: DeviceType;
	position: number;
	face: DeviceFace;
} | null {
	if (!isActive || !device || previewPosition === null || !isValid) {
		return null;
	}

	const result = {
		device,
		position: previewPosition,
		face: targetFace
	};

	resetPlacementStore();
	return result;
}
