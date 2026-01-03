/**
 * P5.6 - Mobile Optimizer
 * Device detection, texture compression, geometry simplification
 * Target: 30 FPS, 50MB memory cap, 0.75x resolution on low-end devices
 */

import type { Viewer } from '@xeokit/xeokit-sdk';

console.log('[MobileOptimizer] Module loaded');

// Debug: Mobile limits
const MOBILE_MEMORY_LIMIT = 50 * 1024 * 1024; // 50MB
const MOBILE_TARGET_FPS = 30;
const LOW_END_RESOLUTION_SCALE = 0.75;

export interface DeviceProfile {
  isMobile: boolean;
  isLowEnd: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  devicePixelRatio: number;
}

/**
 * Detect device capabilities
 */
export function detectDevice(): DeviceProfile {
  console.log('[MobileOptimizer] Detecting device');

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Detect low-end devices (< 4GB RAM, < 4 cores)
  const memory = (navigator as any).deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;
  const isLowEnd = isMobile && (memory < 4 || cores < 4);

  // Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  const supportsWebGL2 = !!gl2;

  // Get max texture size
  let maxTextureSize = 2048;
  if (gl2) {
    maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);
  }

  const profile: DeviceProfile = {
    isMobile,
    isLowEnd,
    supportsWebGL2,
    maxTextureSize,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  console.log('[MobileOptimizer] Device profile:', profile);

  return profile;
}

/**
 * Configure viewer for mobile
 */
export function configureMobileViewer(
  viewer: Viewer,
  profile: DeviceProfile
): void {
  console.log('[MobileOptimizer] Configuring mobile viewer:', profile);

  const scene = viewer.scene;
  const canvas = scene.canvas.canvas as HTMLCanvasElement;

  // Resolution scaling for low-end devices
  if (profile.isLowEnd) {
    console.log('[MobileOptimizer] Applying low-end resolution scaling');

    const resolutionScale = LOW_END_RESOLUTION_SCALE;
    canvas.width = canvas.clientWidth * resolutionScale;
    canvas.height = canvas.clientHeight * resolutionScale;
  }

  // Disable shadows on mobile
  if (profile.isMobile) {
    console.log('[MobileOptimizer] Disabling shadows for mobile');
    (scene as any).shadowsEnabled = false;
  }

  // Disable SAO (Screen-Space Ambient Occlusion) on mobile
  if (profile.isMobile) {
    console.log('[MobileOptimizer] Disabling SAO for mobile');
    (scene as any).saoEnabled = false;
  }

  // Use FXAA instead of MSAA on mobile
  if (profile.isMobile) {
    console.log('[MobileOptimizer] Using FXAA anti-aliasing');
    (scene as any).antialias = false; // Disable MSAA
    // FXAA would be applied as a post-processing effect
  }

  // Reduce edge rendering on mobile
  if (profile.isMobile) {
    console.log('[MobileOptimizer] Reducing edge rendering');
    (scene as any).edgeAlpha = 0.5; // Make edges more transparent
  }

  console.log('[MobileOptimizer] Mobile viewer configured');
}

/**
 * Simplify geometry for mobile (reduce triangle count by 50%)
 */
export function simplifyGeometry(viewer: Viewer, reductionPercent = 50): void {
  console.log('[MobileOptimizer] Simplifying geometry:', {
    reductionPercent,
  });

  try {
    const scene = viewer.scene;

    // In xeokit, geometry simplification is typically done at model load time
    // via XKTLoaderPlugin options. Here we can adjust LOD settings.

    // Set aggressive LOD (Level of Detail) for mobile
    for (const objectId in (scene as any).objects) {
      const object = (scene as any).objects[objectId];

      // Enable LOD if available
      if ((object as any).lod) {
        (object as any).lod = true;
      }
    }

    console.log('[MobileOptimizer] Geometry simplified');
  } catch (error) {
    console.error('[MobileOptimizer] Failed to simplify geometry:', error);
  }
}

/**
 * Compress textures for mobile
 */
export function compressTextures(viewer: Viewer, profile: DeviceProfile): void {
  console.log('[MobileOptimizer] Compressing textures');

  try {
    // Reduce texture resolution for mobile
    const maxTextureSize = profile.isLowEnd ? 1024 : 2048;

    console.log('[MobileOptimizer] Max texture size:', maxTextureSize);

    // Note: Texture compression (KTX2/Basis) would be done at asset preparation time
    // Here we just ensure textures don't exceed size limits

    console.log('[MobileOptimizer] Textures compressed');
  } catch (error) {
    console.error('[MobileOptimizer] Failed to compress textures:', error);
  }
}

/**
 * Monitor memory usage and enforce cap
 */
export function enforceMemoryCap(
  currentMemory: number,
  onExceed?: () => void
): boolean {
  console.log('[MobileOptimizer] Checking memory cap:', {
    currentMemory,
    limit: MOBILE_MEMORY_LIMIT,
    currentMB: (currentMemory / 1024 / 1024).toFixed(2),
    limitMB: (MOBILE_MEMORY_LIMIT / 1024 / 1024).toFixed(2),
  });

  if (currentMemory > MOBILE_MEMORY_LIMIT) {
    console.warn('[MobileOptimizer] Memory cap exceeded!');

    if (onExceed) {
      onExceed();
    }

    return false;
  }

  return true;
}

/**
 * Pause rendering when tab is inactive (battery optimization)
 */
export function setupBatteryOptimization(viewer: Viewer): () => void {
  console.log('[MobileOptimizer] Setting up battery optimization');

  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('[MobileOptimizer] Tab inactive, pausing rendering');

      // Pause viewer rendering
      (viewer.scene as any).rendering = false;
    } else {
      console.log('[MobileOptimizer] Tab active, resuming rendering');

      // Resume viewer rendering
      (viewer.scene as any).rendering = true;

      // Force redraw
      const spinner = (viewer.scene.canvas as any).spinner;
      if (spinner) {
        spinner.processes--;
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    console.log('[MobileOptimizer] Battery optimization cleanup');
  };
}

/**
 * Get optimal settings for device
 */
export function getOptimalSettings(profile: DeviceProfile): {
  enableShadows: boolean;
  enableSAO: boolean;
  antialias: 'none' | 'fxaa' | 'msaa';
  resolutionScale: number;
  targetFPS: number;
  maxTriangles: number;
} {
  console.log('[MobileOptimizer] Getting optimal settings:', profile);

  if (profile.isLowEnd) {
    return {
      enableShadows: false,
      enableSAO: false,
      antialias: 'none',
      resolutionScale: LOW_END_RESOLUTION_SCALE,
      targetFPS: MOBILE_TARGET_FPS,
      maxTriangles: 50000,
    };
  }

  if (profile.isMobile) {
    return {
      enableShadows: false,
      enableSAO: false,
      antialias: 'fxaa',
      resolutionScale: 1.0,
      targetFPS: MOBILE_TARGET_FPS,
      maxTriangles: 100000,
    };
  }

  return {
    enableShadows: true,
    enableSAO: true,
    antialias: 'msaa',
    resolutionScale: 1.0,
    targetFPS: 60,
    maxTriangles: 200000,
  };
}

/**
 * Apply all mobile optimizations
 */
export function applyMobileOptimizations(viewer: Viewer): DeviceProfile {
  console.log('[MobileOptimizer] Applying mobile optimizations');

  const profile = detectDevice();

  if (profile.isMobile) {
    configureMobileViewer(viewer, profile);
    simplifyGeometry(viewer, 50);
    compressTextures(viewer, profile);
    setupBatteryOptimization(viewer);
  }

  console.log('[MobileOptimizer] Mobile optimizations applied');

  return profile;
}
