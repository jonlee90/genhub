'use client';

// Debug: Complete spatial 3D viewer integration example
// Combines all Phase 2 components: Canvas, Loader, Camera, LOD, Interaction

import { useState, useCallback } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { ThreeDViewerCanvas } from './3DViewerCanvas';
import { ModelLoader } from './ModelLoader';
import { CameraControls } from './CameraControls';
import { LODManager } from './LODManager';
import { InteractionLayer } from './InteractionLayer';
import type { IntersectionResult } from '@/lib/hooks/use-3d-interaction';
import { cn } from '@/lib/utils';

// Debug: Component props
export interface SpatialViewerProps {
  projectId: string;
  modelHighURL: string;
  modelMediumURL?: string;
  modelLowURL?: string;
  thumbnailURL?: string;
  onMarkerPlacement?: (position: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }) => void;
  className?: string;
}

/**
 * SpatialViewer - Complete 3D BIM/IFC viewer
 * Integrates all Phase 2 components:
 * - 3DViewerCanvas (P2.2)
 * - ModelLoader (P2.5)
 * - CameraControls (P2.3)
 * - LODManager (P2.6)
 * - InteractionLayer (P2.7)
 */
export function SpatialViewer({
  projectId,
  modelHighURL,
  modelMediumURL,
  modelLowURL,
  thumbnailURL,
  onMarkerPlacement,
  className,
}: SpatialViewerProps) {
  console.log('[SpatialViewer] Rendering', {
    projectId,
    modelHighURL,
    modelMediumURL,
    modelLowURL,
  });

  // Debug: Viewer state
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debug: Handle viewer ready
  const handleViewerReady = useCallback((viewerInstance: Viewer) => {
    console.log('[SpatialViewer] Viewer ready', viewerInstance);
    setViewer(viewerInstance);
  }, []);

  // Debug: Handle model load error
  const handleModelError = useCallback((err: Error) => {
    console.error('[SpatialViewer] Model load error', err);
    setError(err);
  }, []);

  // Debug: Handle model load success
  const handleModelSuccess = useCallback(() => {
    console.log('[SpatialViewer] Model loaded successfully');
    setIsModelReady(true);
  }, []);

  // Debug: Handle element click (for marker placement)
  const handleElementClick = useCallback(
    (result: IntersectionResult) => {
      console.log('[SpatialViewer] Element clicked', result);

      // Debug: Could open marker creation modal here
      if (onMarkerPlacement) {
        onMarkerPlacement(result.position, result.normal);
      }
    },
    [onMarkerPlacement]
  );

  // Debug: Handle surface click (for marker placement on empty space)
  const handleSurfaceClick = useCallback(
    (position: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }) => {
      console.log('[SpatialViewer] Surface clicked', { position, normal });

      if (onMarkerPlacement) {
        onMarkerPlacement(position, normal);
      }
    },
    [onMarkerPlacement]
  );

  return (
    <div className={cn('relative w-full h-full bg-gray-100', className)}>
      {/* Debug: 3D Viewer Canvas (base layer) */}
      <ThreeDViewerCanvas
        projectId={projectId}
        modelUrl={modelHighURL}
        onReady={handleViewerReady}
        onError={handleModelError}
        className="absolute inset-0"
      />

      {/* Debug: Model Loader (overlay during loading) */}
      {!isModelReady && (
        <div className="absolute inset-0 z-30">
          <ModelLoader
            modelUrl={modelHighURL}
            thumbnailUrl={thumbnailURL}
            onLoadSuccess={handleModelSuccess}
            onLoadError={handleModelError}
          />
        </div>
      )}

      {/* Debug: Camera Controls (top-right) */}
      {viewer && isModelReady && <CameraControls viewer={viewer} />}

      {/* Debug: LOD Manager (bottom-left) */}
      {viewer && isModelReady && modelMediumURL && modelLowURL && (
        <LODManager
          viewer={viewer}
          highURL={modelHighURL}
          mediumURL={modelMediumURL}
          lowURL={modelLowURL}
        />
      )}

      {/* Debug: Interaction Layer (click detection) */}
      {viewer && isModelReady && (
        <InteractionLayer
          viewer={viewer}
          onElementClick={handleElementClick}
          onSurfaceClick={handleSurfaceClick}
        />
      )}

      {/* Debug: Error overlay */}
      {error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-50/90">
          <div className="bg-white border-2 border-red-500 rounded-lg p-6 shadow-construction max-w-md">
            <p className="font-bold text-red-600 mb-2">Viewer Error</p>
            <p className="text-sm text-gray-600">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
