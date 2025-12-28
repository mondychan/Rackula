/**
 * Touch Gesture Utilities
 * Uses Hammer.js for robust cross-browser gesture detection
 */

import Hammer from '@egjs/hammerjs';
import { debug } from './debug';

const DEFAULT_LONG_PRESS_DURATION = 500; // ms
const DEFAULT_SWIPE_THRESHOLD = 100; // px

/**
 * Add long-press gesture detection to an element using Hammer.js
 * @param element - Target element
 * @param callback - Function to call on long-press
 * @param duration - Long-press duration in ms (default: 500)
 * @returns Cleanup function to remove event listeners
 */
export function useLongPress(
	element: HTMLElement,
	callback: () => void,
	duration: number = DEFAULT_LONG_PRESS_DURATION
): () => void {
	const hammer = new Hammer(element);

	// Configure press recognizer for long-press
	hammer.get('press').set({
		time: duration,
		threshold: 10 // Allow 10px movement during press
	});

	hammer.on('press', () => {
		debug.log('Hammer.js: long-press detected');
		// Trigger haptic feedback if available
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}
		callback();
	});

	// Return cleanup function
	return () => {
		debug.log('Hammer.js: cleaning up long-press handler');
		hammer.destroy();
	};
}

/**
 * Add swipe-down gesture detection for dismiss actions
 * @param element - Target element
 * @param onSwipeDown - Callback when swiped down past threshold
 * @param threshold - Distance threshold for swipe (default: 100px)
 * @returns Cleanup function
 */
export function useSwipeDown(
	element: HTMLElement,
	onSwipeDown: () => void,
	threshold: number = DEFAULT_SWIPE_THRESHOLD
): () => void {
	const hammer = new Hammer(element, {
		recognizers: [
			[Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }]
		]
	});

	hammer.on('panend', (e: HammerInput) => {
		// Check if swiped down past threshold
		if (e.deltaY > threshold && e.direction === Hammer.DIRECTION_DOWN) {
			debug.log('Hammer.js: swipe-down detected', { deltaY: e.deltaY });
			onSwipeDown();
		}
	});

	return () => {
		debug.log('Hammer.js: cleaning up swipe handler');
		hammer.destroy();
	};
}

/**
 * Combined gesture manager for elements that need multiple gestures
 */
export interface GestureOptions {
	onLongPress?: () => void;
	onSwipeDown?: () => void;
	onTap?: () => void;
	longPressDuration?: number;
	swipeThreshold?: number;
}

export function useGestures(element: HTMLElement, options: GestureOptions): () => void {
	const hammer = new Hammer(element);

	// Configure recognizers
	if (options.onLongPress) {
		hammer.get('press').set({
			time: options.longPressDuration ?? DEFAULT_LONG_PRESS_DURATION,
			threshold: 10
		});
		hammer.on('press', () => {
			debug.log('Hammer.js: press gesture');
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
			options.onLongPress?.();
		});
	}

	if (options.onSwipeDown) {
		hammer.get('pan').set({
			direction: Hammer.DIRECTION_VERTICAL
		});
		hammer.on('panend', (e: HammerInput) => {
			const threshold = options.swipeThreshold ?? DEFAULT_SWIPE_THRESHOLD;
			if (e.deltaY > threshold && e.direction === Hammer.DIRECTION_DOWN) {
				debug.log('Hammer.js: swipe-down gesture');
				options.onSwipeDown?.();
			}
		});
	}

	if (options.onTap) {
		hammer.on('tap', () => {
			debug.log('Hammer.js: tap gesture');
			options.onTap?.();
		});
	}

	return () => {
		hammer.destroy();
	};
}
