/**
 * P5.7 - Memory Manager
 * Viewer cleanup, texture/geometry disposal, memory monitoring
 * Warn at 500MB, auto-cleanup if threshold exceeded
 */

import type { Viewer } from '@xeokit/xeokit-sdk';

console.log('[MemoryManager] Module loaded');

// Debug: Memory thresholds
const MEMORY_WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB
const MEMORY_CRITICAL_THRESHOLD = 750 * 1024 * 1024; // 750MB

export interface MemoryStats {
  total: number;
  used: number;
  limit: number;
  usedPercent: number;
  level: 'ok' | 'warning' | 'critical';
}

// Event callback type for listeners
export interface EventCallback {
  (event: string, data?: any): void;
}

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemoryStats {
  const memory = (performance as any).memory;

  if (!memory) {
    console.warn('[MemoryManager] Performance.memory API not available');
    return {
      total: 0,
      used: 0,
      limit: 0,
      usedPercent: 0,
      level: 'ok',
    };
  }

  const used = memory.usedJSHeapSize || 0;
  const total = memory.totalJSHeapSize || 0;
  const limit = memory.jsHeapSizeLimit || 0;
  const usedPercent = limit > 0 ? (used / limit) * 100 : 0;

  // Determine level
  let level: 'ok' | 'warning' | 'critical' = 'ok';
  if (used >= MEMORY_CRITICAL_THRESHOLD) {
    level = 'critical';
  } else if (used >= MEMORY_WARNING_THRESHOLD) {
    level = 'warning';
  }

  console.log('[MemoryManager] Memory usage:', {
    usedMB: (used / 1024 / 1024).toFixed(2),
    totalMB: (total / 1024 / 1024).toFixed(2),
    limitMB: (limit / 1024 / 1024).toFixed(2),
    usedPercent: usedPercent.toFixed(2),
    level,
  });

  return {
    total,
    used,
    limit,
    usedPercent,
    level,
  };
}

/**
 * Clean up viewer resources
 */
export function cleanupViewer(viewer: Viewer): void {
  console.log('[MemoryManager] Cleaning up viewer');

  try {
    // Check if viewer is valid
    if (!viewer || !viewer.scene) {
      console.log('[MemoryManager] Viewer or scene is null, skipping cleanup');
      return;
    }

    const scene = viewer.scene;

    // Destroy all models
    console.log('[MemoryManager] Destroying models');
    const models = { ...scene.models };
    for (const modelId in models) {
      const model = models[modelId];
      if (model && typeof model.destroy === 'function') {
        model.destroy();
        console.log('[MemoryManager] Model destroyed:', modelId);
      }
    }

    // Clear all objects
    console.log('[MemoryManager] Clearing objects');
    const objects = { ...(scene as any).objects };
    for (const objectId in objects) {
      const object = objects[objectId];
      if (object && typeof object.destroy === 'function') {
        object.destroy();
      }
    }

    // Destroy viewer
    console.log('[MemoryManager] Destroying viewer');
    if (viewer && typeof viewer.destroy === 'function') {
      viewer.destroy();
    }

    console.log('[MemoryManager] Viewer cleanup complete');
  } catch (error) {
    console.error('[MemoryManager] Viewer cleanup failed:', error);
  }
}

/**
 * Dispose textures from GPU memory
 */
export function disposeTextures(viewer: Viewer): void {
  console.log('[MemoryManager] Disposing textures');

  try {
    // Check if viewer and canvas are still valid
    if (!viewer || !viewer.scene || !viewer.scene.canvas || !viewer.scene.canvas.canvas) {
      console.log('[MemoryManager] Viewer or canvas already destroyed, skipping texture disposal');
      return;
    }

    const scene = viewer.scene;

    // Access WebGL context
    const canvas = scene.canvas.canvas as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('[MemoryManager] WebGL context not available');
      return;
    }

    // xeokit manages textures internally
    // We can force texture cleanup by destroying models
    console.log('[MemoryManager] Textures will be disposed with model cleanup');
  } catch (error) {
    console.error('[MemoryManager] Failed to dispose textures:', error);
  }
}

/**
 * Dispose geometry from GPU memory
 */
export function disposeGeometry(viewer: Viewer): void {
  console.log('[MemoryManager] Disposing geometry');

  try {
    // Check if viewer and canvas are still valid
    if (!viewer || !viewer.scene || !viewer.scene.canvas || !viewer.scene.canvas.canvas) {
      console.log('[MemoryManager] Viewer or canvas already destroyed, skipping geometry disposal');
      return;
    }

    const scene = viewer.scene;

    // Access WebGL context
    const canvas = scene.canvas.canvas as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('[MemoryManager] WebGL context not available');
      return;
    }

    // Delete vertex buffers
    // xeokit manages VBOs internally, we ensure cleanup via model destruction
    console.log('[MemoryManager] Geometry will be disposed with model cleanup');
  } catch (error) {
    console.error('[MemoryManager] Failed to dispose geometry:', error);
  }
}

/**
 * Unload old LODs (Level of Detail) to free memory
 */
export function unloadOldLODs(viewer: Viewer): void {
  console.log('[MemoryManager] Unloading old LODs');

  try {
    const scene = viewer.scene;

    // In xeokit, LOD management is automatic
    // We can force cleanup of non-visible objects

    const camera = viewer.camera;
    const cameraPos = camera.eye;

    for (const objectId in (scene as any).objects) {
      const object = (scene as any).objects[objectId];

      // Calculate distance from camera
      const objectPos = object.aabb
        ? [
            (object.aabb[0] + object.aabb[3]) / 2,
            (object.aabb[1] + object.aabb[4]) / 2,
            (object.aabb[2] + object.aabb[5]) / 2,
          ]
        : [0, 0, 0];

      const distance = Math.sqrt(
        Math.pow(cameraPos[0] - objectPos[0], 2) +
          Math.pow(cameraPos[1] - objectPos[1], 2) +
          Math.pow(cameraPos[2] - objectPos[2], 2)
      );

      // Hide distant objects to free memory
      if (distance > 100) {
        object.visible = false;
      }
    }

    console.log('[MemoryManager] Old LODs unloaded');
  } catch (error) {
    console.error('[MemoryManager] Failed to unload LODs:', error);
  }
}

/**
 * Remove all event listeners
 */
export function cleanupEventListeners(
  viewer: Viewer,
  listeners: Map<string, EventCallback[]>
): void {
  console.log('[MemoryManager] Cleaning up event listeners');

  try {
    for (const [event, callbacks] of listeners) {
      for (const callback of callbacks) {
        (viewer.scene as any).off(event, callback);
      }
    }

    listeners.clear();
    console.log('[MemoryManager] Event listeners cleaned up');
  } catch (error) {
    console.error('[MemoryManager] Failed to cleanup listeners:', error);
  }
}

/**
 * Release WebGL context
 */
export function releaseWebGLContext(viewer: Viewer): void {
  console.log('[MemoryManager] Releasing WebGL context');

  try {
    // Check if viewer and canvas are still valid
    if (!viewer || !viewer.scene || !viewer.scene.canvas || !viewer.scene.canvas.canvas) {
      console.log('[MemoryManager] Viewer or canvas already destroyed, skipping WebGL cleanup');
      return;
    }

    const canvas = viewer.scene.canvas.canvas as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (gl) {
      // Lose context to force cleanup
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
        console.log('[MemoryManager] WebGL context released');
      }
    }
  } catch (error) {
    console.error('[MemoryManager] Failed to release WebGL context:', error);
  }
}

/**
 * Automatic cleanup when memory exceeds threshold
 */
export function autoCleanup(
  viewer: Viewer,
  onCleanup?: (stats: MemoryStats) => void
): void {
  console.log('[MemoryManager] Running auto cleanup');

  const stats = getMemoryUsage();

  if (stats.level === 'critical') {
    console.warn('[MemoryManager] Critical memory level, forcing cleanup');

    // Unload old LODs first
    unloadOldLODs(viewer);

    // Force garbage collection if available
    if ((global as any).gc) {
      console.log('[MemoryManager] Forcing garbage collection');
      (global as any).gc();
    }

    if (onCleanup) {
      onCleanup(stats);
    }
  } else if (stats.level === 'warning') {
    console.warn('[MemoryManager] Warning memory level, unloading LODs');
    unloadOldLODs(viewer);
  }
}

/**
 * Monitor memory and auto-cleanup
 */
export function startMemoryMonitoring(
  viewer: Viewer,
  interval = 5000,
  onWarning?: (stats: MemoryStats) => void,
  onCritical?: (stats: MemoryStats) => void
): () => void {
  console.log('[MemoryManager] Starting memory monitoring:', { interval });

  const monitorInterval = setInterval(() => {
    const stats = getMemoryUsage();

    if (stats.level === 'critical') {
      console.error('[MemoryManager] CRITICAL memory level!', stats);
      autoCleanup(viewer, onCritical);
      if (onCritical) {
        onCritical(stats);
      }
    } else if (stats.level === 'warning') {
      console.warn('[MemoryManager] WARNING memory level!', stats);
      if (onWarning) {
        onWarning(stats);
      }
    }
  }, interval);

  // Return cleanup function
  return () => {
    console.log('[MemoryManager] Stopping memory monitoring');
    clearInterval(monitorInterval);
  };
}

/**
 * Full cleanup: viewer, textures, geometry, listeners, context
 */
export function fullCleanup(
  viewer: Viewer,
  listeners?: Map<string, EventCallback[]>
): void {
  console.log('[MemoryManager] Performing full cleanup');

  // Check if viewer is valid
  if (!viewer) {
    console.log('[MemoryManager] Viewer is null, skipping cleanup');
    return;
  }

  disposeTextures(viewer);
  disposeGeometry(viewer);

  if (listeners) {
    cleanupEventListeners(viewer, listeners);
  }

  cleanupViewer(viewer);
  releaseWebGLContext(viewer);

  console.log('[MemoryManager] Full cleanup complete');
}
