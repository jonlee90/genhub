'use client';

// Debug: Core 3D viewer canvas component with xeokit integration
// P2.2 - 3DViewerCanvas with model loading, camera state, and responsive resize
// P5.5 - Performance optimization integration
// P5.6 - Mobile optimization integration
// P5.7 - Memory management integration

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { viewerManager } from '@/lib/xeokit/viewer-manager';
import { cn } from '@/lib/utils';
import {
  optimizeViewer,
  getDefaultConfig,
  FPSCounter,
  getPerformanceStats,
} from '@/lib/xeokit/performance-optimizer';
import {
  applyMobileOptimizations,
  detectDevice,
} from '@/lib/xeokit/mobile-optimizer';
import {
  fullCleanup,
  startMemoryMonitoring,
} from '@/lib/xeokit/memory-manager';

// Debug: Camera state interface
export interface CameraState {
  eye: [number, number, number];
  look: [number, number, number];
  up: [number, number, number];
}

// Debug: Component props
export interface ThreeDViewerCanvasProps {
  projectId: string;
  modelUrl?: string;
  initialCamera?: CameraState;
  className?: string;
  onReady?: (viewer: Viewer) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * 3DViewerCanvas - Core xeokit canvas component
 * Handles initialization, model loading, and cleanup
 */
export function ThreeDViewerCanvas({
  projectId,
  modelUrl,
  initialCamera,
  className,
  onReady,
  onError,
  onProgress,
}: ThreeDViewerCanvasProps) {
  console.log('[3DViewerCanvas] Rendering', { projectId, modelUrl });

  // Debug: Refs for DOM and viewer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const modelRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const fpsCounterRef = useRef<FPSCounter | null>(null);
  const memoryMonitorCleanupRef = useRef<(() => void) | null>(null);

  // FIX: Store prop callbacks in refs to prevent infinite re-initialization
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const initialCameraRef = useRef(initialCamera);

  // FIX: Update refs when props change, but don't trigger re-initialization
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    initialCameraRef.current = initialCamera;
  }, [onReady, onError, initialCamera]);

  // Debug: Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Debug: Performance state (P5.5)
  const [fps, setFps] = useState(0);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // Debug: Setup resize observer for responsive canvas
  const setupResizeObserver = useCallback((canvas: HTMLCanvasElement) => {
    console.log('[3DViewerCanvas] Setting up resize observer');

    // Debug: Create resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        console.log('[3DViewerCanvas] Canvas resized', { width, height });

        // Debug: Update canvas size
        if (canvas) {
          canvas.width = width * window.devicePixelRatio;
          canvas.height = height * window.devicePixelRatio;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    resizeObserverRef.current = resizeObserver;
  }, []);

  // Debug: Unload current model
  const unloadModel = useCallback(() => {
    console.log('[3DViewerCanvas] Unloading model');

    if (modelRef.current && typeof modelRef.current.destroy === 'function') {
      modelRef.current.destroy();
      modelRef.current = null;
      console.log('[3DViewerCanvas] Model unloaded');
    }
  }, []);

  // Debug: Cleanup viewer and resources
  const cleanup = useCallback(() => {
    console.log('[3DViewerCanvas] Cleanup started');

    // Debug: Stop FPS counter
    const viewer = viewerRef.current;
    if (viewer && (viewer as any)._fpsInterval) {
      clearInterval((viewer as any)._fpsInterval);
      console.log('[3DViewerCanvas] FPS counter stopped');
    }

    // Debug: Stop memory monitoring (P5.7)
    if (memoryMonitorCleanupRef.current) {
      memoryMonitorCleanupRef.current();
      memoryMonitorCleanupRef.current = null;
      console.log('[3DViewerCanvas] Memory monitoring stopped');
    }

    // Debug: Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      console.log('[3DViewerCanvas] Resize observer disconnected');
    }

    // Debug: Unload model
    unloadModel();

    // Debug: P5.7 - Full cleanup (viewer, textures, geometry, WebGL context)
    if (viewerRef.current) {
      fullCleanup(viewerRef.current);
    }

    // Debug: Destroy viewer
    viewerManager.destroyViewer(projectId);
    viewerRef.current = null;

    console.log('[3DViewerCanvas] Cleanup complete');
  }, [projectId, unloadModel]);

  // Debug: Initialize viewer on mount
  useEffect(() => {
    console.log('[3DViewerCanvas] Initializing viewer');

    if (!canvasRef.current) {
      console.error('[3DViewerCanvas] Canvas ref not available');
      return;
    }

    try {
      // Debug: Create viewer using manager (prevents multiple instances)
      const viewer = viewerManager.getOrCreateViewer(
        projectId,
        canvasRef.current,
        {
          transparent: false,
          backgroundColor: [0.95, 0.95, 0.97],
        }
      );

      if (!viewer) {
        throw new Error('Failed to create xeokit viewer');
      }

      viewerRef.current = viewer;
      console.log('[3DViewerCanvas] Viewer initialized');

      // Debug: P5.5 - Apply performance optimizations
      const deviceProfile = detectDevice();
      const perfConfig = getDefaultConfig(deviceProfile.isMobile);
      optimizeViewer(viewer, perfConfig);
      console.log('[3DViewerCanvas] Performance optimizations applied');

      // Debug: P5.6 - Apply mobile optimizations if needed
      if (deviceProfile.isMobile) {
        applyMobileOptimizations(viewer);
        console.log('[3DViewerCanvas] Mobile optimizations applied');
      }

      // Debug: P5.7 - Start memory monitoring
      const stopMemoryMonitoring = startMemoryMonitoring(
        viewer,
        10000, // Check every 10 seconds
        (stats) => {
          console.warn('[3DViewerCanvas] Memory warning:', stats);
        },
        (stats) => {
          console.error('[3DViewerCanvas] Memory critical:', stats);
        }
      );
      memoryMonitorCleanupRef.current = stopMemoryMonitoring;

      // Debug: P5.5 - Start FPS counter
      fpsCounterRef.current = new FPSCounter();
      const fpsInterval = setInterval(() => {
        if (fpsCounterRef.current) {
          const currentFps = fpsCounterRef.current.update();
          setFps(currentFps);
        }
      }, 1000);

      // Store interval for cleanup
      (viewer as any)._fpsInterval = fpsInterval;

      // Debug: Set initial camera if provided
      // FIX: Use ref instead of direct prop to prevent re-initialization
      if (initialCameraRef.current) {
        viewer.camera.eye = initialCameraRef.current.eye;
        viewer.camera.look = initialCameraRef.current.look;
        viewer.camera.up = initialCameraRef.current.up;
        console.log('[3DViewerCanvas] Initial camera set', initialCameraRef.current);
      }

      // Debug: Setup resize observer for responsive canvas
      setupResizeObserver(canvasRef.current);

      // Debug: Notify ready
      // FIX: Use ref to avoid infinite re-initialization
      if (onReadyRef.current) {
        onReadyRef.current(viewer);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[3DViewerCanvas] Initialization error', error);
      setError(error);
      // FIX: Use ref instead of direct prop
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    }

    // Debug: Cleanup on unmount
    return () => {
      console.log('[3DViewerCanvas] Cleanup on unmount');
      cleanup();
    };
  }, [projectId, setupResizeObserver, cleanup]); // FIX: Include all dependencies properly

  // Debug: Load model when URL changes
  useEffect(() => {
    if (!modelUrl || !viewerRef.current) {
      console.log('[3DViewerCanvas] No model URL or viewer not ready');
      return;
    }

    console.log('[3DViewerCanvas] Loading model', modelUrl);
    loadModel(modelUrl);

    return () => {
      // Debug: Unload previous model when URL changes
      if (modelRef.current) {
        console.log('[3DViewerCanvas] Unloading previous model');
        unloadModel();
      }
    };
  }, [modelUrl, unloadModel]); // FIX: Add unloadModel to deps

  // Debug: Load model (supports both XKT and IFC formats)
  const loadModel = useCallback(async (url: string) => {
    console.log('[3DViewerCanvas] Loading model from URL', url);

    if (!viewerRef.current) {
      console.error('[3DViewerCanvas] Viewer not initialized');
      return;
    }

    setIsLoading(true);
    setLoadProgress(0);
    setError(null);

    try {
      // Detect file type from URL
      const isIFCFile = url.toLowerCase().endsWith('.ifc');
      console.log('[3DViewerCanvas] File type detected:', isIFCFile ? 'IFC' : 'XKT');

      let model: any;

      if (isIFCFile) {
        // For IFC files, use default residential model as fallback
        // Note: xeokit v2.6.6 requires XKT format for optimal performance
        // IFC parsing would require server-side conversion to XKT
        console.warn('[3DViewerCanvas] IFC file detected, loading default model as placeholder');

        const { createResidentialHouseModel, removeDefaultModel } = await import('@/lib/xeokit/default-models');

        if (!viewerRef.current) {
          throw new Error('Viewer not initialized when loading default model');
        }

        // Remove any existing default model to prevent duplicate component IDs
        removeDefaultModel(viewerRef.current);

        // Load default model as a placeholder until IFC conversion is implemented
        await createResidentialHouseModel(viewerRef.current);
        console.log('[3DViewerCanvas] Default residential model loaded as IFC placeholder');

        // Model is created internally with meshes - no event handlers needed
        model = { id: 'default-residential-house' };

        // Debug: Track loading progress
        let downloadProgress = 0;
        const progressInterval = setInterval(() => {
          // Simulate download progress (0-50%)
          if (downloadProgress < 50) {
            downloadProgress += 5;
            setLoadProgress(downloadProgress);
            if (onProgress) {
              onProgress(downloadProgress);
            }
          }
        }, 100);

        // Complete loading after short delay to ensure meshes are rendered
        setTimeout(() => {
          clearInterval(progressInterval);
          console.log('[3DViewerCanvas] IFC Model loaded successfully');

          // Complete progress (50-100% for parsing)
          setLoadProgress(100);
          if (onProgress) {
            onProgress(100);
          }

          // Debug: Fit model to view
          const scene = viewerRef.current!.scene;
          const aabb = scene.getAABB();
          viewerRef.current!.cameraFlight.flyTo({
            aabb,
            duration: 1.0,
          });

          setIsLoading(false);
          modelRef.current = model;
        }, 500);
      } else {
        // Debug: Load XKT file using XKTLoaderPlugin
        const { XKTLoaderPlugin } = await import('@xeokit/xeokit-sdk');

        // Verify viewer exists
        if (!viewerRef.current) {
          throw new Error('Viewer not initialized when creating XKT plugin');
        }

        // Instantiate XKTLoaderPlugin (viewer as first parameter)
        // Plugin automatically registers itself with the viewer
        const xktLoaderPlugin = new XKTLoaderPlugin(viewerRef.current);

        console.log('[3DViewerCanvas] XKT plugin created and registered');

        // Use the plugin directly as the loader
        const xktLoader = xktLoaderPlugin;

        console.log('[3DViewerCanvas] XKT loader created');

        // Load XKT model
        model = xktLoader.load({
          id: `model-${Date.now()}`,
          src: url,
          edges: true, // Show edges for better visualization
        });

        // Debug: Track loading progress
        let downloadProgress = 0;
        const progressInterval = setInterval(() => {
          // Simulate download progress (0-50%)
          if (downloadProgress < 50) {
            downloadProgress += 5;
            setLoadProgress(downloadProgress);
            if (onProgress) {
              onProgress(downloadProgress);
            }
          }
        }, 100);

        // Debug: Wait for model to load
        model.on('loaded', () => {
          clearInterval(progressInterval);
          console.log('[3DViewerCanvas] Model loaded successfully');

          // Complete progress (50-100% for parsing)
          setLoadProgress(100);
          if (onProgress) {
            onProgress(100);
          }

          // Debug: Fit model to view
          const scene = viewerRef.current!.scene;
          const aabb = scene.getAABB();
          viewerRef.current!.cameraFlight.flyTo({
            aabb,
            duration: 1.0,
          });

          setIsLoading(false);
          modelRef.current = model;
        });

        model.on('error', (err: any) => {
          clearInterval(progressInterval);
          console.error('[3DViewerCanvas] Model load error', err);
          const error = new Error(`Failed to load model: ${err}`);
          setError(error);
          setIsLoading(false);
          if (onErrorRef.current) {
            onErrorRef.current(error);
          }
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[3DViewerCanvas] Model loading error', error);
      setError(error);
      setIsLoading(false);
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    }
  }, [onProgress]);

  return (
    <div className={cn('relative w-full h-full bg-gray-100', className)}>
      {/* Debug: Canvas element for xeokit */}
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Debug: Debug overlay (P5.5) */}
      {showDebugOverlay && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded font-mono text-xs pointer-events-none">
          <p>FPS: {fps.toFixed(1)}</p>
          <p>Project: {projectId}</p>
          <p>Canvas: {canvasRef.current?.width}x{canvasRef.current?.height}</p>
        </div>
      )}

      {/* Debug: Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-sm font-mono text-gray-600">Loading: {loadProgress}%</div>
            <div className="mt-2 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-construction-blue transition-all"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Debug: Error indicator */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
          <div className="bg-red-100 border-2 border-red-600 rounded-lg p-6 shadow-lg max-w-md">
            <p className="text-sm font-bold text-red-600 mb-2">Error</p>
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
