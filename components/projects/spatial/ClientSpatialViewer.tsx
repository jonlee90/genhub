'use client';

// Debug: Phase 5 - Client Portal Read-Only 3D Spatial Viewer
// Reuses core 3D rendering from SpatialViewer but removes all edit capabilities
// Clients can view models, markers, and task details but cannot create/edit/delete

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { ThreeDViewerCanvas } from './3DViewerCanvas';
import { ModelLoader } from './ModelLoader';
import { CameraControls } from './CameraControls';
import { LODManager } from './LODManager';
import { InteractionLayer } from './InteractionLayer';
import { SpatialMarkerPin } from './SpatialMarkerPin';
import { MarkerFilterPanel, MarkerFilters } from './MarkerFilterPanel';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { cn } from '@/lib/utils';
import { createDefaultModel } from '@/lib/xeokit/default-models';
import { getMarkersByProject } from '@/app/actions/spatial';
import type { SpatialMarker } from '@/types/db/spatial';
import { toast } from 'sonner';

// Debug: Component props (client-specific, aligned with Phase 5 spec)
export interface ClientSpatialViewerProps {
  projectId: string;
  projectType: string; // For loading default models
  modelHighURL?: string | null;
  modelMediumURL?: string;
  modelLowURL?: string;
  hasBudgetVisibility: boolean; // Controls cost visibility in TaskDetailPanel
  className?: string;
}

/**
 * ClientSpatialViewer - Read-only 3D BIM/IFC viewer for client portal
 *
 * **Key Differences from SpatialViewer:**
 * - NO context menu on canvas clicks
 * - NO marker creation/editing/deletion
 * - NO drag-and-drop for markers
 * - Opens TaskDetailPanel in read-only mode on marker click
 * - Budget visibility controlled by hasBudgetVisibility prop
 *
 * **Reused Components:**
 * - 3DViewerCanvas (P2.2) - Core 3D rendering
 * - ModelLoader (P2.5) - IFC/model loading
 * - CameraControls (P2.3) - Camera navigation
 * - LODManager (P2.6) - Level of detail
 * - InteractionLayer (P2.7) - Click/hover detection
 * - SpatialMarkerPin (P2.4) - Marker visualization (read-only)
 * - MarkerFilterPanel (P2.3) - Filtering
 * - TaskDetailPanel (P4) - Task details (read-only mode)
 */
export function ClientSpatialViewer({
  projectId,
  projectType,
  modelHighURL,
  modelMediumURL,
  modelLowURL,
  hasBudgetVisibility,
  className,
}: ClientSpatialViewerProps) {
  console.log('[ClientSpatialViewer] Rendering', {
    projectId,
    projectType,
    modelHighURL,
    hasBudgetVisibility,
  });

  // Debug: Viewer state
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasDefaultModel, setHasDefaultModel] = useState(false);

  // Debug: Marker state
  const [markers, setMarkers] = useState<SpatialMarker[]>([]);
  const [activeFilters, setActiveFilters] = useState<MarkerFilters>({
    markerTypes: [],
    statuses: [],
  });

  // Debug: Task detail panel state (read-only mode)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Determine if we should use default model
  const isPlaceholderURL = modelHighURL?.startsWith('defaults/') || modelHighURL?.startsWith('/defaults/');
  const hasValidProjectType = ['residential', 'restaurant', 'cafe', 'commercial_office', 'industrial'].includes(projectType || '');
  const shouldUseDefaultModel = (!modelHighURL || isPlaceholderURL) && hasValidProjectType;

  // Debug: Fetch markers on mount and when filters change
  useEffect(() => {
    const fetchMarkers = async () => {
      console.log('[ClientSpatialViewer] Fetching markers with filters:', activeFilters);
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.success && result.data) {
        console.log('[ClientSpatialViewer] Loaded markers:', result.data.length);
        setMarkers(result.data);
      } else if (result.error) {
        console.error('[ClientSpatialViewer] Failed to load markers:', result.error);
        toast.error('Failed to load markers');
      }
    };

    fetchMarkers();
  }, [projectId, activeFilters]);

  // Debug: Handle viewer ready
  const handleViewerReady = useCallback((viewerInstance: Viewer) => {
    console.log('[ClientSpatialViewer] Viewer ready', viewerInstance);
    setViewer(viewerInstance);
  }, []);

  // Debug: Load default model when viewer is ready and no user model exists
  useEffect(() => {
    if (viewer && shouldUseDefaultModel && !hasDefaultModel) {
      console.log(`[ClientSpatialViewer] Loading default ${projectType} model`);

      (async () => {
        try {
          await createDefaultModel(viewer, projectType!);
          setIsModelReady(true);
          setHasDefaultModel(true);
        } catch (err) {
          console.error('[ClientSpatialViewer] Failed to load default model:', err);
          setError(err as Error);
        }
      })();
    }
  }, [viewer, shouldUseDefaultModel, projectType, hasDefaultModel]);

  // Debug: Handle model load error
  const handleModelError = useCallback((err: Error) => {
    console.error('[ClientSpatialViewer] Model load error', err);
    setError(err);
    toast.error('Failed to load 3D model');
  }, []);

  // Debug: Handle model load success
  const handleModelSuccess = useCallback(() => {
    console.log('[ClientSpatialViewer] Model loaded successfully');
    setIsModelReady(true);
  }, []);

  /**
   * Handle marker click - opens TaskDetailPanel if marker has linked task,
   * otherwise shows marker info toast.
   *
   * @param marker - The spatial marker that was clicked
   * @note marker.task_id is null for standalone markers (issues, notes, safety, etc.)
   */
  const handleMarkerClick = useCallback((marker: SpatialMarker) => {
    console.log('[ClientSpatialViewer] Marker clicked:', marker.id, 'task_id:', marker.task_id);

    // Open TaskDetailPanel ONLY if marker has a linked task
    if (marker.task_id) {
      console.log('[ClientSpatialViewer] Opening task detail panel for task:', marker.task_id);
      setSelectedTaskId(marker.task_id);
      setDetailPanelOpen(true);
    } else {
      // Debug: Non-task marker - show marker info to client
      console.log('[ClientSpatialViewer] Non-task marker clicked - showing marker info');

      const markerTypeLabel = marker.type.charAt(0).toUpperCase() + marker.type.slice(1);
      toast.info(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{markerTypeLabel}: {marker.title}</span>
          {marker.description && (
            <span className="text-sm text-gray-500">{marker.description}</span>
          )}
          <span className="text-xs text-gray-400 mt-1">
            This marker is not linked to a task
          </span>
        </div>,
        {
          duration: 4000,
        }
      );
    }
  }, []);

  // Performance optimization: Memoize marker counts with multiple filter operations
  const markerCounts = useMemo(() => ({
    issue: markers.filter(m => m.type === 'issue').length,
    note: markers.filter(m => m.type === 'note').length,
    safety: markers.filter(m => m.type === 'safety').length,
    milestone: markers.filter(m => (m.type as string) === 'milestone').length, // milestone may not be in DB enum yet
  }), [markers]);

  return (
    <div className={cn('relative h-full w-full bg-gray-50', className)}>
      {/* Debug: 3D Viewer Canvas */}
      <ThreeDViewerCanvas projectId={projectId} onReady={handleViewerReady} />

      {/* Debug: Model Loader (loads IFC/model if provided, skips if using default) */}
      {!shouldUseDefaultModel && modelHighURL && (
        <ModelLoader
          modelUrl={modelHighURL}
          onLoadSuccess={handleModelSuccess}
          onLoadError={handleModelError}
        />
      )}

      {/* Debug: Camera Controls (orbit, pan, zoom) */}
      {viewer && <CameraControls viewer={viewer} />}

      {/* Debug: LOD Manager (optimizes rendering based on camera distance) */}
      {viewer && isModelReady && modelHighURL && (
        <LODManager
          viewer={viewer}
          highURL={modelHighURL}
          mediumURL={modelMediumURL || null}
          lowURL={modelLowURL || null}
        />
      )}

      {/* Debug: Interaction Layer (detects clicks/hovers - read-only mode, NO context menu) */}
      {viewer && isModelReady && (
        <InteractionLayer
          viewer={viewer}
          // NO onClick handler (clients cannot open context menu)
        />
      )}

      {/* Debug: Spatial Marker Pins (read-only, no drag-and-drop) */}
      {isModelReady && markers.map((marker) => (
        <SpatialMarkerPin
          key={marker.id}
          marker={marker}
          materialCount={0} // TODO: Fetch material count from server
          attachmentCount={0} // TODO: Fetch attachment count from server
          onClick={() => handleMarkerClick(marker)}
          // NO drag handlers (read-only mode)
        />
      ))}

      {/* Debug: Marker Filter Panel (same as SpatialViewer) */}
      <div className="absolute top-4 left-4 w-72 z-20">
        <MarkerFilterPanel
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          markerCounts={markerCounts}
        />
      </div>

      {/* Debug: Task Detail Panel (read-only mode, budget visibility controlled) */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        isOpen={detailPanelOpen}
        onClose={() => {
          setDetailPanelOpen(false);
          setSelectedTaskId(null);
        }}
        userRole="client" // Forces read-only mode (no edit buttons)
        hasBudgetVisibility={hasBudgetVisibility} // Controls cost visibility
      />

      {/* Debug: Error State */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-white border-2 border-red-500 rounded-lg p-6 shadow-construction max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-2">Failed to Load 3D Model</h3>
            <p className="text-sm text-gray-600">{error.message}</p>
          </div>
        </div>
      )}

      {/* Debug: Loading State */}
      {!isModelReady && !error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-sm border-2 border-[#001B51] rounded-lg p-8 shadow-construction">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#001B51] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#001B51] uppercase tracking-wide">
                Loading 3D Model...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
