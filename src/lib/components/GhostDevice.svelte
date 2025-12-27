<!--
  GhostDevice SVG Component
  Shows a semi-transparent preview during tap-to-place device placement
-->
<script lang="ts">
	import type { DeviceType, DeviceFace } from '$lib/types';
	import { RAIL_WIDTH, U_HEIGHT_PX } from '$lib/constants/layout';

	interface Props {
		/** Device being placed */
		device: DeviceType;
		/** U position for preview (1-indexed, bottom of rack is U1) */
		position: number;
		/** Total rack height in U */
		rackHeight: number;
		/** Rack width in pixels */
		rackWidth: number;
		/** Face being targeted */
		face: DeviceFace;
		/** Whether placement would be valid */
		isValid: boolean;
		/** Whether position is blocked by another device */
		isBlocked: boolean;
	}

	let { device, position, rackHeight, rackWidth, face, isValid, isBlocked }: Props = $props();

	// Position calculation (SVG y-coordinate, origin at top)
	const yPosition = $derived((rackHeight - position - device.u_height + 1) * U_HEIGHT_PX);
	const deviceHeight = $derived(device.u_height * U_HEIGHT_PX);
	const deviceWidth = $derived(rackWidth - RAIL_WIDTH * 2);

	// Color based on validity state
	const fillColor = $derived.by(() => {
		if (isBlocked) return 'var(--colour-warning, #f1fa8c)'; // Orange/yellow for collision
		if (!isValid) return 'var(--colour-error, #ff5555)'; // Red for invalid
		return 'var(--colour-success, #50fa7b)'; // Green for valid
	});

	const strokeColor = $derived.by(() => {
		if (isBlocked) return 'var(--colour-warning-dark, #e6db74)';
		if (!isValid) return 'var(--colour-error-dark, #ff6e6e)';
		return 'var(--colour-success-dark, #69ff94)';
	});

	// Device display name
	const displayName = $derived(device.model ?? device.slug);

	// Aria label for accessibility
	const ariaLabel = $derived(
		`Placing ${displayName} at U${position}, ${isValid ? 'valid position' : isBlocked ? 'blocked by another device' : 'invalid position'}`
	);
</script>

<g
	class="ghost-device"
	class:valid={isValid && !isBlocked}
	class:invalid={!isValid}
	class:blocked={isBlocked}
	transform="translate({RAIL_WIDTH}, {yPosition})"
	role="img"
	aria-label={ariaLabel}
>
	<!-- Ghost device rectangle -->
	<rect
		class="ghost-rect"
		x="0"
		y="0"
		width={deviceWidth}
		height={deviceHeight}
		fill={fillColor}
		stroke={strokeColor}
		rx="2"
		ry="2"
	/>

	<!-- Device name centered -->
	<text
		class="ghost-name"
		x={deviceWidth / 2}
		y={deviceHeight / 2}
		dominant-baseline="middle"
		text-anchor="middle"
	>
		{displayName}
	</text>

	<!-- Face indicator for half-depth devices -->
	{#if device.is_full_depth === false && face !== 'both'}
		<text
			class="ghost-face"
			x={deviceWidth / 2}
			y={deviceHeight - 4}
			dominant-baseline="auto"
			text-anchor="middle"
		>
			{face === 'front' ? 'Front' : 'Rear'}
		</text>
	{/if}
</g>

<style>
	.ghost-device {
		pointer-events: none;
		opacity: 0.8;
	}

	.ghost-rect {
		stroke-width: 2;
		stroke-dasharray: 6 3;
	}

	/* Pulsing animation for valid placement */
	.ghost-device.valid .ghost-rect {
		animation: pulse-valid 1.5s ease-in-out infinite;
	}

	/* Shake animation for blocked placement */
	.ghost-device.blocked {
		animation: shake 0.5s ease-in-out;
	}

	@keyframes pulse-valid {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 0.9;
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-2px);
		}
		75% {
			transform: translateX(2px);
		}
	}

	.ghost-name {
		fill: var(--neutral-900, #282a36);
		font-size: var(--font-size-device, 13px);
		font-family: var(--font-family, system-ui, sans-serif);
		font-weight: 600;
		user-select: none;
	}

	.ghost-face {
		fill: var(--neutral-700, #44475a);
		font-size: 9px;
		font-family: var(--font-family, system-ui, sans-serif);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		user-select: none;
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.ghost-device.valid .ghost-rect {
			animation: none;
		}

		.ghost-device.blocked {
			animation: none;
		}
	}
</style>
