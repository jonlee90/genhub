// Debug: xeokit initialization and cleanup utilities
// P2.1 - xeokit SDK integration for Next.js

import type { Viewer, ViewerConfig } from '@xeokit/xeokit-sdk';

/**
 * Initialize xeokit viewer with WebGL2 context
 * Browser-only - must be called from client components
 */
export function initXeokit(
  canvasElement: HTMLCanvasElement,
  options?: Partial<ViewerConfig>
): Viewer | null {
  console.log('[xeokit] Initializing viewer', { canvasElement, options });

  // Debug: Check browser environment
  if (typeof window === 'undefined') {
    console.error('[xeokit] Cannot initialize in SSR environment');
    return null;
  }

  // Debug: Check WebGL2 support
  const gl = canvasElement.getContext('webgl2');
  if (!gl) {
    console.error('[xeokit] WebGL2 not supported');
    return null;
  }

  try {
    // Debug: Dynamic import xeokit (browser-only)
    // Note: This is synchronous in the browser, but we need to handle it carefully
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Viewer } = require('@xeokit/xeokit-sdk');

    // Debug: Create viewer with default config + user options
    const config: ViewerConfig = {
      canvasElement,
      transparent: false,
      backgroundColor: [0.95, 0.95, 0.97], // Light gray background
      antialias: true,
      gammaInput: true,
      gammaOutput: true,
      units: 'meters',
      scale: 1.0,
      origin: [0, 0, 0],
      saoEnabled: true, // Scalable Ambient Obscurance for better depth
      pbrEnabled: false, // Physical-based rendering (disable for performance)
      ...options,
    };

    console.log('[xeokit] Creating viewer instance', config);
    const viewer = new Viewer(config);

    // Debug: Configure camera control for construction-friendly navigation
    if (viewer.cameraControl) {
      viewer.cameraControl.navMode = 'orbit'; // Default to orbit mode
      viewer.cameraControl.followPointer = true;
      viewer.cameraControl.doublePickFlyTo = true; // Double-click to fly to object
      viewer.cameraControl.panRightClick = true; // Right-click to pan
      viewer.cameraControl.active = true;

      console.log('[xeokit] Camera control configured');
    }

    // Debug: Add WebGL context lost handler
    const canvas = viewer.scene.canvas.canvas;
    canvas.addEventListener('webglcontextlost', (event: Event) => {
      console.error('[xeokit] WebGL context lost', event);
      event.preventDefault();
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('[xeokit] WebGL context restored');
    });

    console.log('[xeokit] Viewer initialized successfully');
    return viewer;
  } catch (error) {
    console.error('[xeokit] Failed to initialize viewer', error);
    return null;
  }
}

/**
 * Cleanup xeokit viewer and release WebGL resources
 * CRITICAL: Always call this on unmount to prevent memory leaks
 * Fixed: Proper null/undefined checks for scene.models
 */
export function destroyXeokit(viewer: Viewer | null): void {
  if (!viewer) {
    console.log('[xeokit] No viewer to destroy');
    return;
  }

  console.log('[xeokit] Destroying viewer and releasing WebGL resources');

  try {
    // Debug: Safely check if scene exists and has models
    if (viewer && viewer.scene) {
      try {
        // Get models object safely - may be undefined if scene is partially destroyed
        const models = viewer.scene.models;
        
        if (models && typeof models === 'object') {
          // Use Object.keys to safely get model IDs
          const modelIds = Object.keys(models);
          console.log('[xeokit] Found models to destroy:', modelIds.length);
          
          modelIds.forEach((modelId) => {
            try {
              const model = models[modelId];
              if (model && typeof model.destroy === 'function') {
                console.log('[xeokit] Destroying model', modelId);
                model.destroy();
              }
            } catch (modelError) {
              console.warn('[xeokit] Error destroying individual model', modelId, modelError);
            }
          });
        } else {
          console.log('[xeokit] No models object or already destroyed');
        }
      } catch (sceneError) {
        console.warn('[xeokit] Error accessing scene models during cleanup', sceneError);
      }
    }

    // Debug: Destroy viewer (releases WebGL context)
    if (typeof viewer.destroy === 'function') {
      viewer.destroy();
      console.log('[xeokit] Viewer destroyed successfully');
    }
  } catch (error) {
    console.error('[xeokit] Error during cleanup', error);
  }
}

/**
 * Check if xeokit is supported in current browser
 */
export function isXeokitSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Debug: Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    console.warn('[xeokit] WebGL2 not supported');
    return false;
  }

  console.log('[xeokit] Browser supports WebGL2');
  return true;
}

/**
 * Get WebGL capabilities for debugging
 */
export function getWebGLCapabilities(): {
  supported: boolean;
  version: string;
  vendor: string;
  renderer: string;
  maxTextureSize: number;
} | null {
  if (typeof window === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (!gl) return null;

  return {
    supported: true,
    version: gl.getParameter(gl.VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
  };
}
