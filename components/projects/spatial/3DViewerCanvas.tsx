'use client';

// Debug: Core 3D viewer canvas component with xeokit integration
// P2.2 - 3DViewerCanvas with model loading, camera state, and responsive resize

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { viewerManager } from '@/lib/xeokit/viewer-manager';
import { cn } from '@/lib/utils';

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

  // Debug: Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

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

      // Debug: Set initial camera if provided
      if (initialCamera) {
        viewer.camera.eye = initialCamera.eye;
        viewer.camera.look = initialCamera.look;
        viewer.camera.up = initialCamera.up;
        console.log('[3DViewerCanvas] Initial camera set', initialCamera);
      }

      // Debug: Setup resize observer for responsive canvas
      setupResizeObserver(canvasRef.current);

      // Debug: Notify ready
      if (onReady) {
        onReady(viewer);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[3DViewerCanvas] Initialization error', error);
      setError(error);
      if (onError) {
        onError(error);
      }
    }

    // Debug: Cleanup on unmount
    return () => {
      console.log('[3DViewerCanvas] Cleanup on unmount');
      cleanup();
    };
  }, [projectId]); // Only re-initialize if projectId changes

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
  }, [modelUrl]);

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

  // Debug: Load XKT model
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
      // Debug: Dynamic import XKTLoaderPlugin
      const { XKTLoaderPlugin } = await import('@xeokit/xeokit-sdk');

      // Debug: Create loader
      const xktLoader = new XKTLoaderPlugin(viewerRef.current, {
        objectDefaults: {
          IfcSpace: {
            visible: false, // Hide spaces by default
            pickable: false,
          },
        },
      });

      console.log('[3DViewerCanvas] XKT loader created');

      // Debug: Load model with progress tracking
      const model = xktLoader.load({
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
        if (onError) {
          onError(error);
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[3DViewerCanvas] Model loading error', error);
      setError(error);
      setIsLoading(false);
      if (onError) {
        onError(error);
      }
    }
  }, [onProgress, onError]);

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

    // Debug: Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      console.log('[3DViewerCanvas] Resize observer disconnected');
    }

    // Debug: Unload model
    unloadModel();

    // Debug: Destroy viewer
    viewerManager.destroyViewer(projectId);
    viewerRef.current = null;

    console.log('[3DViewerCanvas] Cleanup complete');
  }, [projectId, unloadModel]);

  return (
    <div className={cn('relative w-full h-full bg-gray-100', className)}>
      {/* Debug: Canvas element for xeokit */}
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{
          display: 'block',
          cursor: isLoading ? 'wait' : 'default',
        }}
      />

      {/* Debug: Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-construction-blue/5 backdrop-blur-sm">
          <div className="bg-white border-2 border-construction-blue rounded-lg p-6 shadow-construction max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-4 border-construction-blue border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-bold text-construction-blue">Loading Model</p>
                <p className="text-sm text-gray-600">
                  {loadProgress < 50 ? 'Downloading' : 'Processing'}... {loadProgress}%
                </p>
              </div>
            </div>

            {/* Debug: Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-construction-blue transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Debug: Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/90">
          <div className="bg-white border-2 border-red-500 rounded-lg p-6 shadow-construction max-w-sm w-full mx-4">
            <p className="font-bold text-red-600 mb-2">Failed to Load Model</p>
            <p className="text-sm text-gray-600">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
