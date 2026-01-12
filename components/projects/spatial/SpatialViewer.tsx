'use client';

// Debug: Phase 3 - Complete spatial 3D viewer with marker integration
// Integrates Phase 2 components + context menu, marker pins, filters, and task linking

import { useState, useCallback, useEffect } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { ThreeDViewerCanvas } from './3DViewerCanvas';
import { ModelLoader } from './ModelLoader';
import { CameraControls } from './CameraControls';
import { LODManager } from './LODManager';
import { InteractionLayer } from './InteractionLayer';
import { SpatialMarkerContextMenu } from './SpatialMarkerContextMenu';
import { SpatialMarkerPin } from './SpatialMarkerPin';
import { MarkerFilterPanel, MarkerFilters } from './MarkerFilterPanel';
import { TaskLinker } from './TaskLinker';
import { MarkerCreationModal } from './MarkerCreationModal';
import { TaskDetailPanel } from '@/components/tasks/detail/TaskDetailPanel';
// Mobile components for spatial viewer redesign
import { MarkerFilterSheet } from './MarkerFilterSheet';
import { MarkerListSheet } from './MarkerListSheet';
import { MarkerFAB } from './MarkerFAB';
import { WebGLFallback } from './WebGLFallback';
import type { IntersectionResult } from '@/lib/hooks/use-3d-interaction';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { createDefaultModel } from '@/lib/xeokit/default-models';
import { getMarkersByProject, updateMarker } from '@/app/actions/spatial';
import type { SpatialMarker } from '@/types/spatial';
import { toast } from 'sonner';

// Debug: Component props (enhanced for Phase 3)
export interface SpatialViewerProps {
  projectId: string;
  modelHighURL?: string | null;
  modelMediumURL?: string;
  modelLowURL?: string;
  thumbnailURL?: string;
  projectType?: string; // For loading default models when no user model exists
  userRole: string; // NEW: Permission control (admin, project_manager, etc.)
  teamMembers?: Array<{ id: string; name: string }>; // NEW: For task assignment
  phases?: Array<{ id: string; name: string }>; // NEW: For task creation
  projectTasks?: Array<any>; // NEW: For task linking
  onMarkerPlacement?: (marker: SpatialMarker) => void; // NEW: Signature updated
  className?: string;
}

/**
 * SpatialViewer - Complete 3D BIM/IFC viewer with Phase 3 marker integration
 * Integrates all Phase 2 components + Phase 3 features:
 * - 3DViewerCanvas (P2.2)
 * - ModelLoader (P2.5)
 * - CameraControls (P2.3)
 * - LODManager (P2.6)
 * - InteractionLayer (P2.7)
 * - SpatialMarkerContextMenu (P2.1) - Context menu for 3D clicks
 * - SpatialMarkerPin (P2.4) - 3D marker visualization
 * - MarkerFilterPanel (P2.3) - Marker filtering
 * - TaskLinker (Enhanced) - Task creation/linking
 * - MarkerCreationModal (P2.2) - Marker creation
 */
export function SpatialViewer({
  projectId,
  modelHighURL,
  modelMediumURL,
  modelLowURL,
  thumbnailURL,
  projectType,
  userRole,
  teamMembers = [],
  phases = [],
  projectTasks = [],
  onMarkerPlacement,
  className,
}: SpatialViewerProps) {
  console.log('[SpatialViewer] Rendering Phase 3', {
    projectId,
    modelHighURL,
    projectType,
    userRole,
    teamMembersCount: teamMembers.length,
    phasesCount: phases.length,
  });

  // Debug: Viewer state
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasDefaultModel, setHasDefaultModel] = useState(false);

  // Debug: Phase 6 - WebGL support detection
  const [webglSupported, setWebglSupported] = useState(true);

  // Debug: Marker state
  const [markers, setMarkers] = useState<SpatialMarker[]>([]);
  const [activeFilters, setActiveFilters] = useState<MarkerFilters>({
    markerTypes: [],
    statuses: [],
    hasTask: undefined,
    hasMaterials: undefined,
  });

  // Debug: Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [clickedPosition, setClickedPosition] = useState<{
    x: number;
    y: number;
    z: number;
    normal?: { x: number; y: number; z: number };
    elementId?: string;
  } | null>(null);

  // Debug: Modal state
  const [taskLinkerOpen, setTaskLinkerOpen] = useState(false);
  const [taskLinkerMode, setTaskLinkerMode] = useState<'create' | 'link'>('create');
  const [markerModalOpen, setMarkerModalOpen] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<'issue' | 'note' | 'safety' | 'progress'>('issue');

  // Debug: Task detail panel state (Phase 4)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Debug: Phase 6 - Marker selection menu for overlapping markers (mobile)
  const [markerSelectionMenu, setMarkerSelectionMenu] = useState<{
    open: boolean;
    position: { x: number; y: number };
    markers: SpatialMarker[];
  }>({
    open: false,
    position: { x: 0, y: 0 },
    markers: [],
  });

  // Mobile redesign: Sheet and FAB state
  const [activeSheet, setActiveSheet] = useState<'filter' | 'markers' | null>(null);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<Set<string>>(new Set());

  // Mobile redesign: Use hook for mobile detection
  const isMobile = useIsMobile();

  // Determine if we should use default model
  // Check if the modelHighURL is a placeholder (starts with 'defaults/')
  const isPlaceholderURL = modelHighURL?.startsWith('defaults/') || modelHighURL?.startsWith('/defaults/');
  const hasValidProjectType = ['residential', 'restaurant', 'cafe', 'commercial_office', 'industrial'].includes(projectType || '');
  const shouldUseDefaultModel = (!modelHighURL || isPlaceholderURL) && hasValidProjectType;

  // Debug: Permission checks
  const canEditMarkers = userRole === 'admin' || userRole === 'project_manager';

  // Mobile redesign: Sheet handlers
  const openFilterSheet = useCallback(() => {
    setActiveSheet('filter');
  }, []);

  const openMarkersSheet = useCallback(() => {
    setActiveSheet('markers');
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  // Mobile redesign: FAB click handler - open context menu at center for marker creation
  const handleFABClick = useCallback(() => {
    if (!canEditMarkers) return;
    // On mobile, open context menu in center of screen for marker type selection
    setContextMenuPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setClickedPosition({ x: 0, y: 0, z: 0 }); // Default position, will be updated on actual placement
    setContextMenuOpen(true);
  }, [canEditMarkers]);

  // Mobile redesign: Handle filter category changes from MarkerFilterSheet
  const handleFilterCategoriesChange = useCallback((categories: Set<string>) => {
    setSelectedFilterCategories(categories);
    // Convert category selections to MarkerFilters format
    const markerTypes = Array.from(categories);
    setActiveFilters((prev) => ({
      ...prev,
      markerTypes: markerTypes.length > 0 ? markerTypes : [],
    }));
  }, []);

  // Debug: Phase 6 - Detect WebGL support on mount
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    if (!gl) {
      console.error('[SpatialViewer] WebGL not supported');
      setWebglSupported(false);
    } else {
      console.log('[SpatialViewer] WebGL supported');
    }
  }, []);

  // Debug: Fetch markers on mount and when filters change
  useEffect(() => {
    const fetchMarkers = async () => {
      console.log('[SpatialViewer] Fetching markers with filters:', activeFilters);
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.success && result.data) {
        console.log('[SpatialViewer] Loaded markers:', result.data.length);
        setMarkers(result.data);
      } else if (result.error) {
        console.error('[SpatialViewer] Failed to load markers:', result.error);
      }
    };

    fetchMarkers();
  }, [projectId, activeFilters]);

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

  // Debug: Handle 3D canvas click (opens context menu for GC/PM)
  const handleCanvasClick = useCallback(
    (event: { screenX: number; screenY: number; worldPosition: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number }; elementId?: string }) => {
      console.log('[SpatialViewer] Canvas clicked', event);

      // Only GC/PM can place markers
      if (!canEditMarkers) {
        console.log('[SpatialViewer] User role does not have edit permission');
        return;
      }

      const { screenX, screenY, worldPosition, normal, elementId } = event;

      setContextMenuPosition({ x: screenX, y: screenY });
      setClickedPosition({ ...worldPosition, normal, elementId });
      setContextMenuOpen(true);
    },
    [canEditMarkers]
  );

  // Debug: Context menu action handlers
  const handleCreateTask = useCallback(() => {
    console.log('[SpatialViewer] Opening task creation modal');
    setTaskLinkerMode('create');
    setTaskLinkerOpen(true);
    setContextMenuOpen(false);
  }, []);

  const handleLinkTask = useCallback(() => {
    console.log('[SpatialViewer] Opening task linking modal');
    setTaskLinkerMode('link');
    setTaskLinkerOpen(true);
    setContextMenuOpen(false);
  }, []);

  const handleCreateMarker = useCallback((markerType: 'issue' | 'note' | 'safety' | 'progress') => {
    console.log('[SpatialViewer] Opening marker creation modal for type:', markerType);
    setSelectedMarkerType(markerType);
    setMarkerModalOpen(true);
    setContextMenuOpen(false);
  }, []);

  // Debug: Marker/Task creation callbacks
  const handleTaskCreated = useCallback(
    async (task: any, marker: SpatialMarker) => {
      console.log('[SpatialViewer] Task created:', task.id, 'with marker:', marker.id);

      // Refresh markers
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.success && result.data) {
        setMarkers(result.data);
      }

      // Show success toast
      toast.success(`Task "${task.title}" created at 3D location`);

      // Trigger parent callback
      if (onMarkerPlacement) {
        onMarkerPlacement(marker);
      }

      // Close modal
      setTaskLinkerOpen(false);
    },
    [projectId, activeFilters, onMarkerPlacement]
  );

  const handleTaskLinked = useCallback(
    async (taskId: string) => {
      console.log('[SpatialViewer] Task linked:', taskId);

      // Refresh markers
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.success && result.data) {
        setMarkers(result.data);
      }

      // Show success toast
      toast.success('Task linked to 3D location');

      // Close modal
      setTaskLinkerOpen(false);
    },
    [projectId, activeFilters]
  );

  const handleMarkerCreated = useCallback(
    async (marker: SpatialMarker) => {
      console.log('[SpatialViewer] Marker created:', marker.id);

      // Refresh markers
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.success && result.data) {
        setMarkers(result.data);
      }

      // Show success toast
      toast.success(`${marker.type} marker created`);

      // Trigger parent callback
      if (onMarkerPlacement) {
        onMarkerPlacement(marker);
      }

      // Close modal
      setMarkerModalOpen(false);
    },
    [projectId, activeFilters, onMarkerPlacement]
  );

  /**
   * Handle marker click - opens TaskDetailPanel if marker has linked task,
   * otherwise shows marker info toast.
   *
   * @param marker - The spatial marker that was clicked
   * @note marker.task_id is null for standalone markers (issues, notes, safety, etc.)
   */
  const handleMarkerClick = useCallback((marker: SpatialMarker) => {
    console.log('[SpatialViewer] Marker clicked:', marker.id, 'task_id:', marker.task_id);

    // Phase 4: Open TaskDetailPanel ONLY if marker has a linked task
    if (marker.task_id) {
      console.log('[SpatialViewer] Opening task detail panel for task:', marker.task_id);
      setSelectedTaskId(marker.task_id);
      setDetailPanelOpen(true);
    } else {
      // Debug: Non-task marker (issue, note, safety, photo, inspection, rfi, material, progress)
      // These markers are standalone and don't have associated tasks
      console.log('[SpatialViewer] Non-task marker clicked - showing marker info');

      // Show detailed toast with marker info
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

  // Mobile redesign: Handle marker selection from MarkerListSheet
  const handleMarkerListSelect = useCallback((markerId: string) => {
    const marker = markers.find((m) => m.id === markerId);
    if (marker) {
      handleMarkerClick(marker);
    }
    closeSheet();
  }, [markers, handleMarkerClick, closeSheet]);

  const handleMarkerDragEnd = useCallback(
    async (marker: SpatialMarker, newPosition: { x: number; y: number; z: number }) => {
      console.log('[SpatialViewer] Marker dragged to new position:', marker.id, newPosition);

      const result = await updateMarker(marker.id, {
        position_x: newPosition.x,
        position_y: newPosition.y,
        position_z: newPosition.z,
      });

      if (result.success) {
        toast.success('Marker position updated');

        // Refresh markers
        const markersResult = await getMarkersByProject(projectId, activeFilters);
        if (markersResult.success && markersResult.data) {
          setMarkers(markersResult.data);
        }
      } else {
        toast.error('Failed to update marker position');
      }
    },
    [projectId, activeFilters]
  );

  // Debug: Phase 6 - Throttle render loop to 30 FPS on mobile
  useEffect(() => {
    if (!viewer) return;

    // Type assertion for xeokit fps property not in type definitions
    const scene = viewer.scene as unknown as { fps: number };
    if (isMobile) {
      console.log('[SpatialViewer] Mobile detected - throttling render to 30 FPS');
      scene.fps = 30;
    } else {
      console.log('[SpatialViewer] Desktop - using 60 FPS');
      scene.fps = 60;
    }
  }, [viewer, isMobile]);

  // Debug: Phase 6 - Handle device orientation changes
  useEffect(() => {
    if (!viewer) return;

    // Debounce utility function
    function debounce<T extends (...args: any[]) => void>(
      func: T,
      wait: number
    ): (...args: Parameters<T>) => void {
      let timeout: NodeJS.Timeout;
      return function executedFunction(...args: Parameters<T>) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    const handleResize = () => {
      const canvas = document.getElementById('xeokit-canvas') as HTMLCanvasElement;
      if (!canvas) return;

      console.log('[SpatialViewer] Orientation/resize event - updating canvas dimensions');

      // Update canvas dimensions
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Update Xeokit viewer viewport - type assertions for xeokit methods not in type defs
        const xeokitCanvas = viewer.scene.canvas as unknown as {
          boundary: number[];
          render: () => void;
        };
        xeokitCanvas.boundary = [0, 0, canvas.width, canvas.height];
        xeokitCanvas.render();
      }
    };

    // Debounced resize handler (300ms)
    const debouncedResize = debounce(handleResize, 300);

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    console.log('[SpatialViewer] Orientation change handlers registered');

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      console.log('[SpatialViewer] Orientation change handlers removed');
    };
  }, [viewer]);

  // Debug: Phase 6 - Mobile performance: reduce marker count on mobile (show only active)
  const visibleMarkers = isMobile
    ? markers.filter((m) => m.status === 'open' || m.status === 'in_progress')
    : markers;

  console.log('[SpatialViewer] Visible markers:', visibleMarkers.length, '/', markers.length, '(mobile:', isMobile, ')');

  // Debug: Calculate marker counts for filter panel
  const markerCounts = {
    issue: markers.filter((m) => m.type === 'issue').length,
    note: markers.filter((m) => m.type === 'note').length,
    safety: markers.filter((m) => m.type === 'safety').length,
    milestone: markers.filter((m) => m.type === 'progress').length,
  };

  // Mobile redesign: Convert markers to MarkerListItem format for MarkerListSheet
  const markerListItems = visibleMarkers.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.type,
    position: { x: m.position_x, y: m.position_y, z: m.position_z },
  }));

  // Debug: Phase 6 - WebGL fallback message
  if (!webglSupported) {
    return (
      <WebGLFallback
        onRetry={() => window.location.reload()}
        className={className}
      />
    );
  }

  return (
    <div className={cn(
      'relative w-full bg-gray-100',
      // Mobile: use dvh for proper mobile viewport handling
      'min-h-[calc(100dvh-200px)] md:h-full',
      className
    )}>
      {/* Debug: 3D Viewer Canvas (base layer) */}
      <ThreeDViewerCanvas
        projectId={projectId}
        modelUrl={shouldUseDefaultModel ? undefined : (modelHighURL ?? undefined)}
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
      {viewer && isModelReady && modelHighURL && modelMediumURL && modelLowURL && (
        <LODManager
          viewer={viewer}
          highURL={modelHighURL}
          mediumURL={modelMediumURL}
          lowURL={modelLowURL}
        />
      )}

      {/* Debug: Interaction Layer (click detection) - Updated for context menu */}
      {viewer && isModelReady && (
        <InteractionLayer
          viewer={viewer}
          userRole={userRole}
          onCanvasClick={handleCanvasClick}
        />
      )}

      {/* Debug: Marker Pins (rendered on 3D canvas) - Phase 6: uses visibleMarkers for mobile optimization */}
      {isModelReady &&
        visibleMarkers.map((marker) => (
          <SpatialMarkerPin
            key={marker.id}
            marker={marker}
            materialCount={0}
            attachmentCount={marker.content_count || 0}
            onClick={() => handleMarkerClick(marker)}
            isDraggable={canEditMarkers}
          />
        ))}

      {/* Debug: Filter Panel (bottom-left) - Desktop only */}
      {isModelReady && !isMobile && (
        <MarkerFilterPanel
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          markerCounts={markerCounts}
          className="absolute bottom-4 left-4 z-30"
        />
      )}

      {/* Mobile redesign: Mobile action buttons for opening sheets */}
      {isModelReady && isMobile && (
        <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
          {/* Filter button */}
          <button
            onClick={openFilterSheet}
            className={cn(
              'w-12 h-12 rounded-xl',
              'bg-white/90 backdrop-blur-sm',
              'border-2 border-gray-200',
              'shadow-lg',
              'flex items-center justify-center',
              'active:scale-[0.98] active:bg-gray-100',
              'transition-all duration-150'
            )}
            aria-label="Open filter options"
          >
            <svg className="w-5 h-5 text-[#001B51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          {/* Markers list button */}
          <button
            onClick={openMarkersSheet}
            className={cn(
              'w-12 h-12 rounded-xl',
              'bg-white/90 backdrop-blur-sm',
              'border-2 border-gray-200',
              'shadow-lg',
              'flex items-center justify-center',
              'active:scale-[0.98] active:bg-gray-100',
              'transition-all duration-150',
              'relative'
            )}
            aria-label="Open markers list"
          >
            <svg className="w-5 h-5 text-[#001B51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {/* Marker count badge */}
            {visibleMarkers.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#001B51] text-white text-xs font-bold flex items-center justify-center">
                {visibleMarkers.length > 99 ? '99+' : visibleMarkers.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Debug: Context Menu (right-click on 3D surface) */}
      <SpatialMarkerContextMenu
        isOpen={contextMenuOpen}
        position={contextMenuPosition}
        worldPosition={clickedPosition || { x: 0, y: 0, z: 0 }}
        normal={clickedPosition?.normal}
        elementId={clickedPosition?.elementId}
        userRole={userRole}
        onClose={() => setContextMenuOpen(false)}
        onCreateTask={handleCreateTask}
        onLinkTask={handleLinkTask}
        onAddIssue={() => handleCreateMarker('issue')}
        onAddNote={() => handleCreateMarker('note')}
        onAddSafety={() => handleCreateMarker('safety')}
        onAddMilestone={() => handleCreateMarker('progress')}
      />

      {/* Debug: Task Linker Modal (create or link mode) */}
      <TaskLinker
        isOpen={taskLinkerOpen}
        onClose={() => setTaskLinkerOpen(false)}
        mode={taskLinkerMode}
        position={clickedPosition || { x: 0, y: 0, z: 0 }}
        normal={clickedPosition?.normal || { x: 0, y: 0, z: 0 }}
        elementId={clickedPosition?.elementId}
        projectId={projectId}
        phaseId={phases[0]?.id}
        phases={phases}
        teamMembers={teamMembers}
        projectTasks={projectTasks}
        onTaskCreated={handleTaskCreated}
        onTaskLinked={handleTaskLinked}
      />

      {/* Debug: Marker Creation Modal */}
      <MarkerCreationModal
        isOpen={markerModalOpen}
        onClose={() => setMarkerModalOpen(false)}
        markerType={selectedMarkerType}
        position={clickedPosition || { x: 0, y: 0, z: 0 }}
        normal={clickedPosition?.normal || { x: 0, y: 0, z: 0 }}
        elementId={clickedPosition?.elementId}
        projectId={projectId}
        phaseId={phases[0]?.id}
        onSubmit={handleMarkerCreated}
        teamMembers={teamMembers}
      />

      {/* Debug: Task Detail Panel (Phase 4) */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        isOpen={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        userRole={userRole}
      />

      {/* Debug: Phase 6 - Marker Selection Menu (overlapping markers on mobile) */}
      {markerSelectionMenu.open && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl p-2 border-2 border-gray-200"
          style={{
            top: markerSelectionMenu.position.y,
            left: markerSelectionMenu.position.x,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-xs uppercase font-semibold text-gray-500 mb-1 px-2">
            Select Marker
          </div>
          {markerSelectionMenu.markers.map((marker) => {
            const config = {
              issue: { color: '#DC2626', label: 'Issue' },
              note: { color: '#FBBF24', label: 'Note' },
              photo: { color: '#3B82F6', label: 'Photo' },
              inspection: { color: '#8B5CF6', label: 'Inspection' },
              rfi: { color: '#EC4899', label: 'RFI' },
              safety: { color: '#F97316', label: 'Safety' },
              material: { color: '#059669', label: 'Material' },
              progress: { color: '#10B981', label: 'Progress' },
            }[marker.type] || { color: '#6B7280', label: 'Marker' };

            return (
              <button
                key={marker.id}
                onClick={() => {
                  handleMarkerClick(marker);
                  setMarkerSelectionMenu({ open: false, position: { x: 0, y: 0 }, markers: [] });
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{marker.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile redesign: MarkerFAB - Mobile only */}
      {isModelReady && isMobile && (
        <MarkerFAB
          onClick={handleFABClick}
          disabled={!canEditMarkers}
        />
      )}

      {/* Mobile redesign: MarkerFilterSheet - Mobile only */}
      {isMobile && (
        <MarkerFilterSheet
          isOpen={activeSheet === 'filter'}
          onClose={closeSheet}
          selectedCategories={selectedFilterCategories}
          onApplyFilters={handleFilterCategoriesChange}
        />
      )}

      {/* Mobile redesign: MarkerListSheet - Mobile only */}
      {isMobile && (
        <MarkerListSheet
          isOpen={activeSheet === 'markers'}
          onClose={closeSheet}
          markers={markerListItems}
          onMarkerSelect={handleMarkerListSelect}
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
