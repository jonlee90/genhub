'use client';

// P3.8 & P3.9 Integration Example
// Complete spatial viewer with clustering and advanced filtering

import { useState, useCallback, useMemo } from 'react';
import { m as motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MarkerClusterer } from './MarkerClusterer';
import { MarkerSearch } from './MarkerSearch';
import { MarkerFilters } from './MarkerFilters';
import { MarkerPanel } from './MarkerPanel';
import { useMarkerClustering } from '@/hooks/use-marker-clustering';
import { useMarkerFiltering } from '@/hooks/use-marker-filtering';
import type { SpatialMarker } from '@/types/db/spatial';
import type { MarkerCluster } from '@/lib/clustering/cluster-algorithm';
import type { MarkerFiltersState } from './MarkerFilters';

export interface SpatialViewerWithFiltersProps {
  projectId: string;
  markers: SpatialMarker[];
  cameraDistance: number; // Distance from camera to scene (for auto-clustering)
  onMarkerClick?: (marker: SpatialMarker) => void;
  onClusterClick?: (cluster: MarkerCluster) => void;
  onCreateMarker?: () => void;
  className?: string;
}

/**
 * SpatialViewerWithFilters - Complete 3D viewer with clustering and filtering
 *
 * This is an integration example showing how to use:
 * - MarkerClusterer (P3.8) - Clustering with auto/manual toggle
 * - MarkerSearch (P3.9) - Full-text search with Fuse.js
 * - MarkerFilters (P3.9) - Multi-select filters with URL persistence
 * - MarkerPanel - Virtualized marker list
 *
 * Features:
 * - Auto-clustering based on camera distance
 * - Search across title, description, content
 * - Multi-select type/status filters
 * - Floor/creator filters
 * - Date range filtering
 * - Dim non-matching markers in 3D (opacity 0.3)
 * - URL persistence for filters
 * - Responsive layout (mobile/desktop)
 */
export function SpatialViewerWithFilters({
  projectId,
  markers,
  cameraDistance,
  onMarkerClick,
  onClusterClick,
  onCreateMarker,
  className,
}: SpatialViewerWithFiltersProps) {
  console.log('[SpatialViewerWithFilters] Rendering', {
    projectId,
    markerCount: markers.length,
    cameraDistance,
  });

  // Debug: Selected marker state
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Debug: Use filtering hook
  const {
    filteredMarkers,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    stats: filterStats,
  } = useMarkerFiltering(markers, {
    searchThreshold: 0.3,
    maxSearchResults: 100,
    debounceMs: 300,
  });

  // Debug: Use clustering hook (on filtered markers)
  const {
    clusters,
    isClusteringEnabled,
    toggleClustering,
    resetAutoMode,
    stats: clusterStats,
  } = useMarkerClustering(filteredMarkers, cameraDistance, {
    gridSize: 1.0, // 1 meter grid cells
    minZoom: 30, // Auto-cluster when camera > 30m
    maxZoom: 10, // Auto-uncluster when camera < 10m
    minClusterSize: 2,
    autoCluster: true,
  });

  // Debug: Marker IDs that should be dimmed (not in filtered results)
  const dimmedMarkerIds = useMemo(() => {
    const filteredIds = new Set(filteredMarkers.map((m) => m.id));
    return markers.filter((m) => !filteredIds.has(m.id)).map((m) => m.id);
  }, [markers, filteredMarkers]);

  // Debug: Handle marker click
  const handleMarkerClick = useCallback(
    (marker: SpatialMarker) => {
      console.log('[SpatialViewerWithFilters] Marker clicked', { markerId: marker.id });
      setSelectedMarkerId(marker.id);
      onMarkerClick?.(marker);
    },
    [onMarkerClick]
  );

  // Debug: Handle cluster click (zoom to expand)
  const handleClusterClick = useCallback(
    (cluster: MarkerCluster) => {
      console.log('[SpatialViewerWithFilters] Cluster clicked', {
        clusterId: cluster.id,
        markerCount: cluster.count,
      });
      onClusterClick?.(cluster);
    },
    [onClusterClick]
  );

  // Debug: Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: MarkerFiltersState) => {
      console.log('[SpatialViewerWithFilters] Filters changed', newFilters);
      setFilters(newFilters);
    },
    [setFilters]
  );

  return (
    <div className={cn('flex h-full w-full', className)}>
      {/* Debug: Sidebar - Marker panel with search and filters */}
      <div className="w-full md:w-80 lg:w-96 border-r-2 border-gray-200 flex flex-col bg-white">
        {/* Debug: Search */}
        <div className="shrink-0 p-4 border-b-2 border-gray-200">
          <MarkerSearch
            markers={markers}
            onSearchQueryChange={setSearchQuery}
            placeholder="Search markers..."
          />
        </div>

        {/* Debug: Filters */}
        <div className="shrink-0 p-4 border-b-2 border-gray-200">
          <MarkerFilters
            markers={markers}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Debug: Stats summary */}
        <div className="shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Total:</span>{' '}
              <span className="font-bold text-construction-blue">{markers.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Filtered:</span>{' '}
              <span className="font-bold text-[#059669]">{filteredMarkers.length}</span>
            </div>
            {isClusteringEnabled && (
              <>
                <div>
                  <span className="text-gray-600">Clusters:</span>{' '}
                  <span className="font-bold text-[#FFB627]">{clusterStats.multiMarkerClusters}</span>
                </div>
                <div>
                  <span className="text-gray-600">Grouped:</span>{' '}
                  <span className="font-bold text-[#FFB627]">{clusterStats.totalClustered}</span>
                </div>
              </>
            )}
          </div>

          {activeFilterCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={clearFilters}
              className="mt-2 w-full px-3 py-1 text-xs font-bold text-[#DC2626] hover:bg-red-50 rounded border border-[#DC2626]"
            >
              Clear {activeFilterCount} Filter{activeFilterCount !== 1 ? 's' : ''}
            </motion.button>
          )}
        </div>

        {/* Debug: Marker list (filtered) */}
        <div className="flex-1 overflow-hidden">
          <MarkerPanel
            markers={filteredMarkers}
            selectedMarkerId={selectedMarkerId}
            onMarkerClick={handleMarkerClick}
            onCreateMarker={onCreateMarker}
          />
        </div>
      </div>

      {/* Debug: 3D Viewer - Integrate with your 3D rendering component */}
      <div className="flex-1 relative bg-gray-100">
        {/* Debug: MarkerClusterer overlay */}
        <MarkerClusterer
          markers={filteredMarkers}
          cameraDistance={cameraDistance}
          onClusterClick={handleClusterClick}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedMarkerId}
          className="absolute inset-0 z-10 pointer-events-none"
        />

        {/* TODO: Your 3D viewer component here */}
        {/* Example integration:
        <ThreeJSViewer
          modelUrl={modelUrl}
          markers={filteredMarkers}
          clusters={clusters}
          dimmedMarkerIds={dimmedMarkerIds}
          selectedMarkerId={selectedMarkerId}
          onMarkerClick={handleMarkerClick}
        />
        */}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-sm font-medium mb-2">3D Viewer Integration</p>
            <p className="text-xs">Replace this with your ThreeJS/XeoKit viewer</p>
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md text-left text-xs space-y-2">
              <div>
                <span className="font-bold">Dimmed Markers:</span> {dimmedMarkerIds.length}
              </div>
              <div>
                <span className="font-bold">Clustering:</span>{' '}
                {isClusteringEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div>
                <span className="font-bold">Camera Distance:</span> {cameraDistance.toFixed(1)}m
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
