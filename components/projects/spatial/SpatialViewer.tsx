'use client';

// Debug: Complete spatial 3D viewer integration example
// Combines all Phase 2 components: Canvas, Loader, Camera, LOD, Interaction

import { useState, useCallback, useEffect } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { ThreeDViewerCanvas } from './3DViewerCanvas';
import { ModelLoader } from './ModelLoader';
import { CameraControls } from './CameraControls';
import { LODManager } from './LODManager';
import { InteractionLayer } from './InteractionLayer';
import type { IntersectionResult } from '@/lib/hooks/use-3d-interaction';
import { cn } from '@/lib/utils';
import { createDefaultModel } from '@/lib/xeokit/default-models';

// Debug: Component props
export interface SpatialViewerProps {
  projectId: string;
  modelHighURL?: string | null;
  modelMediumURL?: string;
  modelLowURL?: string;
  thumbnailURL?: string;
  projectType?: string; // For loading default models when no user model exists
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
  projectType,
  onMarkerPlacement,
  className,
}: SpatialViewerProps) {
  console.log('[SpatialViewer] Rendering', {
    projectId,
    modelHighURL,
    modelMediumURL,
    modelLowURL,
    projectType,
  });

  // Debug: Viewer state
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasDefaultModel, setHasDefaultModel] = useState(false);

  // Determine if we should use default model
  // Check if the modelHighURL is a placeholder (starts with 'defaults/')
  const isPlaceholderURL = modelHighURL?.startsWith('defaults/') || modelHighURL?.startsWith('/defaults/');
  const hasValidProjectType = ['residential', 'restaurant', 'cafe', 'commercial_office', 'industrial'].includes(projectType || '');
  const shouldUseDefaultModel = (!modelHighURL || isPlaceholderURL) && hasValidProjectType;

  // Debug: Handle viewer ready
  const handleViewerReady = useCallback((viewerInstance: Viewer) => {
    console.log('[SpatialViewer] Viewer ready', viewerInstance);
    setViewer(viewerInstance);
  }, []);

  // Debug: Load default model when viewer is ready and no user model exists
  useEffect(() => {
    if (viewer && shouldUseDefaultModel && !hasDefaultModel) {
      console.log(`[SpatialViewer] Loading default ${projectType} model`);

      // Use async IIFE to handle async createDefaultModel
      (async () => {
        try {
          await createDefaultModel(viewer, projectType!);
          setIsModelReady(true);
          setHasDefaultModel(true);
        } catch (err) {
          console.error('[SpatialViewer] Failed to load default model:', err);
          setError(err as Error);
        }
      })();
    }
  }, [viewer, shouldUseDefaultModel, projectType, hasDefaultModel]);

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
        modelUrl={shouldUseDefaultModel ? undefined : modelHighURL}
        onReady={handleViewerReady}
        onError={handleModelError}
        className="absolute inset-0"
      />

      {/* Debug: Model Loader (overlay during loading) - only for user models */}
      {!isModelReady && !shouldUseDefaultModel && modelHighURL && (
        <div className="absolute inset-0 z-30">
          <ModelLoader
            modelUrl={modelHighURL}
            thumbnailUrl={thumbnailURL}
            onLoadSuccess={handleModelSuccess}
            onLoadError={handleModelError}
          />
        </div>
      )}

      {/* Debug: Default model indicator */}
      {shouldUseDefaultModel && isModelReady && (
        <div className="absolute top-4 left-4 z-20 bg-blue-500/90 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Default Residential Model</span>
          </div>
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
