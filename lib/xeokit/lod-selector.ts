// Debug: Level of Detail (LOD) selection logic
// P2.6 - Dynamic LOD based on camera distance, device, and FPS

// Debug: LOD levels
export type LODLevel = 'high' | 'medium' | 'low';

// Debug: LOD thresholds (in meters)
export const LOD_THRESHOLDS = {
  high: 20, // < 20m from model
  medium: 100, // 20-100m from model
  low: Infinity, // > 100m from model
};

// Debug: Device capabilities
export interface DeviceCapabilities {
  isMobile: boolean;
  memory: number; // GB
  cores: number;
  gpu: string;
}

/**
 * Get device capabilities
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      memory: 4,
      cores: 4,
      gpu: 'unknown',
    };
  }

  // Debug: Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Debug: Get memory (if available)
  // @ts-ignore - navigator.deviceMemory is experimental
  const memory = navigator.deviceMemory || 4;

  // Debug: Get CPU cores
  const cores = navigator.hardwareConcurrency || 4;

  // Debug: Get GPU (basic detection via WebGL)
  let gpu = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (error) {
    console.warn('[lod-selector] Error detecting GPU', error);
  }

  const capabilities = { isMobile, memory, cores, gpu };
  console.log('[lod-selector] Device capabilities', capabilities);

  return capabilities;
}

/**
 * Calculate camera distance from model center
 */
export function calculateCameraDistance(
  cameraPos: number[],
  modelBounds: number[]
): number {
  // Debug: Calculate model center
  const centerX = (modelBounds[0] + modelBounds[3]) / 2;
  const centerY = (modelBounds[1] + modelBounds[4]) / 2;
  const centerZ = (modelBounds[2] + modelBounds[5]) / 2;

  // Debug: Calculate Euclidean distance
  const dx = cameraPos[0] - centerX;
  const dy = cameraPos[1] - centerY;
  const dz = cameraPos[2] - centerZ;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  console.log('[lod-selector] Camera distance', {
    cameraPos,
    modelCenter: [centerX, centerY, centerZ],
    distance,
  });

  return distance;
}

/**
 * Select appropriate LOD level based on distance
 */
export function selectLODByDistance(distance: number): LODLevel {
  if (distance < LOD_THRESHOLDS.high) {
    console.log('[lod-selector] Selected HIGH LOD (distance < 20m)');
    return 'high';
  } else if (distance < LOD_THRESHOLDS.medium) {
    console.log('[lod-selector] Selected MEDIUM LOD (distance 20-100m)');
    return 'medium';
  } else {
    console.log('[lod-selector] Selected LOW LOD (distance > 100m)');
    return 'low';
  }
}

/**
 * Select appropriate LOD level based on device capabilities
 */
export function selectLODByDevice(capabilities: DeviceCapabilities): LODLevel {
  // Debug: Mobile devices cap at medium LOD
  if (capabilities.isMobile) {
    console.log('[lod-selector] Mobile device → capping at MEDIUM LOD');
    return 'medium';
  }

  // Debug: Low memory devices cap at medium LOD
  if (capabilities.memory < 4) {
    console.log('[lod-selector] Low memory (<4GB) → capping at MEDIUM LOD');
    return 'medium';
  }

  // Debug: Desktop with good specs → high LOD
  console.log('[lod-selector] Desktop with good specs → HIGH LOD');
  return 'high';
}

/**
 * Select LOD level with adaptive logic
 * Considers distance, device capabilities, and manual override
 */
export function selectLOD(params: {
  distance: number;
  capabilities: DeviceCapabilities;
  manualOverride?: LODLevel | null;
  currentFPS?: number;
}): LODLevel {
  console.log('[lod-selector] Selecting LOD', params);

  // Debug: Manual override takes priority
  if (params.manualOverride) {
    console.log('[lod-selector] Using manual override', params.manualOverride);
    return params.manualOverride;
  }

  // Debug: FPS-based adaptive downgrade
  if (params.currentFPS !== undefined && params.currentFPS < 30) {
    console.log('[lod-selector] Low FPS (<30) → downgrading to LOW LOD');
    return 'low';
  }

  // Debug: Get device-based max LOD
  const deviceMaxLOD = selectLODByDevice(params.capabilities);

  // Debug: Get distance-based LOD
  const distanceLOD = selectLODByDistance(params.distance);

  // Debug: Use the lower (more conservative) of the two
  const lodPriority: { [key in LODLevel]: number } = {
    low: 0,
    medium: 1,
    high: 2,
  };

  const selectedLOD =
    lodPriority[deviceMaxLOD] < lodPriority[distanceLOD] ? deviceMaxLOD : distanceLOD;

  console.log('[lod-selector] Final LOD selection', {
    deviceMaxLOD,
    distanceLOD,
    selectedLOD,
  });

  return selectedLOD;
}

/**
 * Get model URL for specific LOD level
 */
export function getLODModelURL(
  baseURL: string,
  mediumURL: string | null,
  lowURL: string | null,
  level: LODLevel
): string {
  switch (level) {
    case 'high':
      return baseURL;
    case 'medium':
      return mediumURL || baseURL; // Fallback to high if medium unavailable
    case 'low':
      return lowURL || mediumURL || baseURL; // Fallback chain
    default:
      return baseURL;
  }
}

/**
 * FPS monitor for adaptive LOD
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime: number = 0;
  private rafId: number | null = null;

  start() {
    console.log('[FPSMonitor] Starting FPS monitoring');
    this.lastTime = performance.now();
    this.tick();
  }

  stop() {
    console.log('[FPSMonitor] Stopping FPS monitoring');
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = () => {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Debug: Calculate FPS from delta
    const fps = 1000 / delta;
    this.frames.push(fps);

    // Debug: Keep only last 60 frames (1 second at 60fps)
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;

    const sum = this.frames.reduce((a, b) => a + b, 0);
    const avg = sum / this.frames.length;

    console.log('[FPSMonitor] Average FPS', avg.toFixed(1));
    return avg;
  }

  reset() {
    console.log('[FPSMonitor] Resetting frames');
    this.frames = [];
  }
}
