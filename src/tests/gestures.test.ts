/**
 * Touch Gesture Utility Tests
 * Tests for Hammer.js-based gesture detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLongPress, useSwipeDown, useGestures } from '$lib/utils/gestures';

// Mock Hammer.js
vi.mock('@egjs/hammerjs', () => {
	const mockHandlers: Map<string, Function[]> = new Map();
	const mockRecognizers: Map<string, { set: ReturnType<typeof vi.fn> }> = new Map();

	// Create mock recognizers
	mockRecognizers.set('press', { set: vi.fn() });
	mockRecognizers.set('pan', { set: vi.fn() });

	const MockHammer = vi.fn().mockImplementation(() => ({
		on: vi.fn((event: string, handler: Function) => {
			const handlers = mockHandlers.get(event) || [];
			handlers.push(handler);
			mockHandlers.set(event, handlers);
		}),
		off: vi.fn(),
		get: vi.fn((recognizer: string) => mockRecognizers.get(recognizer)),
		destroy: vi.fn(),
		// Expose for testing
		_handlers: mockHandlers,
		_recognizers: mockRecognizers,
		_trigger: (event: string, data?: unknown) => {
			const handlers = mockHandlers.get(event) || [];
			handlers.forEach((h) => h(data));
		}
	}));

	// Static constants
	MockHammer.DIRECTION_VERTICAL = 24;
	MockHammer.DIRECTION_DOWN = 16;
	MockHammer.Pan = 'pan';

	return { default: MockHammer };
});

describe('useLongPress', () => {
	let element: HTMLElement;
	let callback: ReturnType<typeof vi.fn>;
	let cleanup: (() => void) | undefined;

	beforeEach(async () => {
		element = document.createElement('div');
		callback = vi.fn();
		cleanup = undefined;

		// Mock navigator.vibrate
		Object.defineProperty(navigator, 'vibrate', {
			value: vi.fn(),
			writable: true,
			configurable: true
		});

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup?.();
	});

	it('creates Hammer instance with element', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		expect(Hammer).toHaveBeenCalledWith(element);
	});

	it('configures press recognizer with default duration', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.get).toHaveBeenCalledWith('press');
		expect(instance.get('press')?.set).toHaveBeenCalledWith({
			time: 500,
			threshold: 10
		});
	});

	it('configures press recognizer with custom duration', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback, 300);

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.get('press')?.set).toHaveBeenCalledWith({
			time: 300,
			threshold: 10
		});
	});

	it('registers press event handler', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.on).toHaveBeenCalledWith('press', expect.any(Function));
	});

	it('calls callback on press event', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		instance._trigger('press');

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('triggers haptic feedback on press', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		instance._trigger('press');

		expect(navigator.vibrate).toHaveBeenCalledWith(50);
	});

	it('handles missing vibrate API gracefully', async () => {
		Object.defineProperty(navigator, 'vibrate', {
			value: undefined,
			writable: true,
			configurable: true
		});

		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;

		// Should not throw
		expect(() => instance._trigger('press')).not.toThrow();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('destroys Hammer instance on cleanup', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useLongPress(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		cleanup();
		cleanup = undefined; // Prevent double cleanup

		expect(instance.destroy).toHaveBeenCalled();
	});
});

describe('useSwipeDown', () => {
	let element: HTMLElement;
	let callback: ReturnType<typeof vi.fn>;
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		element = document.createElement('div');
		callback = vi.fn();
		cleanup = undefined;
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup?.();
	});

	it('configures pan recognizer for vertical direction', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useSwipeDown(element, callback);

		expect(Hammer).toHaveBeenCalledWith(element, {
			recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }]]
		});
	});

	it('registers panend event handler', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useSwipeDown(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.on).toHaveBeenCalledWith('panend', expect.any(Function));
	});

	it('calls callback when swiped down past threshold', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useSwipeDown(element, callback, 100);

		const instance = Hammer.mock.results[0]?.value;
		instance._trigger('panend', {
			deltaY: 150,
			direction: Hammer.DIRECTION_DOWN
		});

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does not call callback when swipe is below threshold', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useSwipeDown(element, callback, 100);

		const instance = Hammer.mock.results[0]?.value;
		instance._trigger('panend', {
			deltaY: 50,
			direction: Hammer.DIRECTION_DOWN
		});

		expect(callback).not.toHaveBeenCalled();
	});

	it('does not call callback when swiping up', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		cleanup = useSwipeDown(element, callback);

		const instance = Hammer.mock.results[0]?.value;
		instance._trigger('panend', {
			deltaY: -150,
			direction: 8 // DIRECTION_UP
		});

		expect(callback).not.toHaveBeenCalled();
	});
});

describe('useGestures', () => {
	let element: HTMLElement;
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		element = document.createElement('div');
		cleanup = undefined;

		Object.defineProperty(navigator, 'vibrate', {
			value: vi.fn(),
			writable: true,
			configurable: true
		});

		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup?.();
	});

	it('configures press recognizer when onLongPress provided', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		const onLongPress = vi.fn();

		cleanup = useGestures(element, { onLongPress });

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.get).toHaveBeenCalledWith('press');
		expect(instance.on).toHaveBeenCalledWith('press', expect.any(Function));
	});

	it('configures pan recognizer when onSwipeDown provided', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		const onSwipeDown = vi.fn();

		cleanup = useGestures(element, { onSwipeDown });

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.get).toHaveBeenCalledWith('pan');
		expect(instance.on).toHaveBeenCalledWith('panend', expect.any(Function));
	});

	it('configures tap recognizer when onTap provided', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		const onTap = vi.fn();

		cleanup = useGestures(element, { onTap });

		const instance = Hammer.mock.results[0]?.value;
		expect(instance.on).toHaveBeenCalledWith('tap', expect.any(Function));
	});

	it('handles multiple gestures', async () => {
		const Hammer = (await import('@egjs/hammerjs')).default;
		const onLongPress = vi.fn();
		const onSwipeDown = vi.fn();
		const onTap = vi.fn();

		cleanup = useGestures(element, { onLongPress, onSwipeDown, onTap });

		const instance = Hammer.mock.results[0]?.value;

		// Trigger all events
		instance._trigger('press');
		instance._trigger('panend', { deltaY: 150, direction: 16 });
		instance._trigger('tap');

		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(onSwipeDown).toHaveBeenCalledTimes(1);
		expect(onTap).toHaveBeenCalledTimes(1);
	});
});
