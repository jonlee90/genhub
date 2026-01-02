// Debug: Camera preset views for construction 3D models
// P2.3 - Camera presets for Top, Front, Side, Isometric views

import type { CameraFlightParams } from '@xeokit/xeokit-sdk';

// Debug: Camera preset type
export type CameraPreset = 'top' | 'front' | 'side' | 'isometric' | 'reset';

/**
 * Get camera flight parameters for preset views
 * All presets use Z-up coordinate system (construction standard)
 */
export function getCameraPreset(
  preset: CameraPreset,
  modelBounds: number[] // [minX, minY, minZ, maxX, maxY, maxZ]
): CameraFlightParams {
  console.log('[camera-presets] Getting preset', { preset, modelBounds });

  // Debug: Calculate model center
  const centerX = (modelBounds[0] + modelBounds[3]) / 2;
  const centerY = (modelBounds[1] + modelBounds[4]) / 2;
  const centerZ = (modelBounds[2] + modelBounds[5]) / 2;

  // Debug: Calculate model size for camera distance
  const sizeX = modelBounds[3] - modelBounds[0];
  const sizeY = modelBounds[4] - modelBounds[1];
  const sizeZ = modelBounds[5] - modelBounds[2];
  const maxSize = Math.max(sizeX, sizeY, sizeZ);
  const distance = maxSize * 2; // Camera distance from center

  console.log('[camera-presets] Model info', {
    center: [centerX, centerY, centerZ],
    size: [sizeX, sizeY, sizeZ],
    maxSize,
    distance,
  });

  switch (preset) {
    case 'top':
      // Debug: Top view (looking down Z-axis)
      return {
        eye: [centerX, centerY, centerZ + distance],
        look: [centerX, centerY, centerZ],
        up: [0, 1, 0], // Y-axis is "north"
        projection: 'ortho',
        duration: 1.0,
      };

    case 'front':
      // Debug: Front view (looking along negative Y-axis)
      return {
        eye: [centerX, centerY - distance, centerZ],
        look: [centerX, centerY, centerZ],
        up: [0, 0, 1], // Z-axis is up
        projection: 'ortho',
        duration: 1.0,
      };

    case 'side':
      // Debug: Side view (looking along positive X-axis)
      return {
        eye: [centerX + distance, centerY, centerZ],
        look: [centerX, centerY, centerZ],
        up: [0, 0, 1], // Z-axis is up
        projection: 'ortho',
        duration: 1.0,
      };

    case 'isometric':
      // Debug: Isometric view (45-45-90 angles)
      const isoDistance = distance * 1.2; // Slightly farther for iso view
      return {
        eye: [
          centerX + isoDistance * 0.707, // cos(45°)
          centerY - isoDistance * 0.707, // sin(45°)
          centerZ + isoDistance * 0.5, // Elevated
        ],
        look: [centerX, centerY, centerZ],
        up: [0, 0, 1], // Z-axis is up
        projection: 'perspective',
        duration: 1.0,
      };

    case 'reset':
    default:
      // Debug: Default oblique view (good overview)
      return {
        eye: [
          centerX + distance * 0.8,
          centerY - distance * 0.8,
          centerZ + distance * 0.6,
        ],
        look: [centerX, centerY, centerZ],
        up: [0, 0, 1], // Z-axis is up
        projection: 'perspective',
        duration: 1.0,
      };
  }
}

/**
 * Get camera state from URL query params
 * Format: ?camera=eyeX,eyeY,eyeZ,lookX,lookY,lookZ
 */
export function getCameraFromURL(): {
  eye: [number, number, number];
  look: [number, number, number];
  up: [number, number, number];
} | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const cameraParam = params.get('camera');

  if (!cameraParam) {
    console.log('[camera-presets] No camera in URL');
    return null;
  }

  try {
    const values = cameraParam.split(',').map(Number);
    if (values.length !== 6 || values.some(isNaN)) {
      console.warn('[camera-presets] Invalid camera URL format');
      return null;
    }

    console.log('[camera-presets] Camera loaded from URL', values);
    return {
      eye: [values[0], values[1], values[2]],
      look: [values[3], values[4], values[5]],
      up: [0, 0, 1], // Always Z-up
    };
  } catch (error) {
    console.error('[camera-presets] Error parsing camera URL', error);
    return null;
  }
}

/**
 * Update URL with current camera state (for sharing views)
 */
export function updateCameraURL(
  eye: number[],
  look: number[],
  replace: boolean = true
): void {
  if (typeof window === 'undefined') return;

  const cameraParam = `${eye[0].toFixed(2)},${eye[1].toFixed(2)},${eye[2].toFixed(2)},${look[0].toFixed(2)},${look[1].toFixed(2)},${look[2].toFixed(2)}`;

  const url = new URL(window.location.href);
  url.searchParams.set('camera', cameraParam);

  console.log('[camera-presets] Updating camera in URL', cameraParam);

  if (replace) {
    window.history.replaceState({}, '', url.toString());
  } else {
    window.history.pushState({}, '', url.toString());
  }
}
