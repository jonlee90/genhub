// Phase 3 Complete: Usage Examples for Clustering & Filtering
// This file shows how to integrate P3.8 and P3.9 components

'use client';

import { useState } from 'react';
import { SpatialViewerWithFilters } from '@/components/projects/spatial/SpatialViewerWithFilters';
import { MarkerClusterer } from '@/components/projects/spatial/MarkerClusterer';
import { MarkerSearch } from '@/components/projects/spatial/MarkerSearch';
import { MarkerFilters } from '@/components/projects/spatial/MarkerFilters';
import { useMarkerClustering } from '@/hooks/use-marker-clustering';
import { useMarkerFiltering } from '@/hooks/use-marker-filtering';
import type { SpatialMarker } from '@/types/db/spatial';
import type { MarkerCluster } from '@/lib/clustering/cluster-algorithm';

// ============================================================================
// EXAMPLE 1: Complete Integration (Recommended)
// ============================================================================

export function Example1_CompleteIntegration() {
  const [cameraDistance, setCameraDistance] = useState(50);
  const [markers, setMarkers] = useState<SpatialMarker[]>([]);

  return (
    <div className="h-screen">
      <SpatialViewerWithFilters
        projectId="project-123"
        markers={markers}
        cameraDistance={cameraDistance}
        onMarkerClick={(marker) => {
          console.log('Marker clicked:', marker);
        }}
        onClusterClick={(cluster) => {
          console.log('Cluster clicked:', cluster);
          // Zoom camera to cluster bounds
          // setCameraTarget(cluster.position);
          // setCameraDistance(5); // Zoom in to uncluster
        }}
        onCreateMarker={() => {
          console.log('Create new marker');
        }}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Clustering Only
// ============================================================================

export function Example2_ClusteringOnly() {
  const [markers] = useState<SpatialMarker[]>([]);
  const [cameraDistance] = useState(50);

  const {
    clusters,
    isClusteringEnabled,
    toggleClustering,
    resetAutoMode,
    stats,
  } = useMarkerClustering(markers, cameraDistance, {
    gridSize: 1.0, // 1 meter grid cells
    minZoom: 30, // Auto-cluster when camera > 30m
    maxZoom: 10, // Auto-uncluster when camera < 10m
    minClusterSize: 2,
    autoCluster: true,
  });

  return (
    <div>
      <div className="p-4 bg-gray-100">
        <button onClick={toggleClustering} className="px-4 py-2 bg-blue-500 text-white rounded">
          {isClusteringEnabled ? 'Disable' : 'Enable'} Clustering
        </button>
        <button onClick={resetAutoMode} className="ml-2 px-4 py-2 bg-gray-500 text-white rounded">
          Reset to Auto
        </button>

        <div className="mt-4 text-sm">
          <p>Total Markers: {stats.totalMarkers}</p>
          <p>Total Clusters: {stats.totalClusters}</p>
          <p>Multi-Marker Clusters: {stats.multiMarkerClusters}</p>
          <p>Clustered Markers: {stats.totalClustered}</p>
          <p>Single Markers: {stats.singleMarkers}</p>
        </div>
      </div>

      <MarkerClusterer
        markers={markers}
        cameraDistance={cameraDistance}
        onClusterClick={(cluster) => console.log('Cluster:', cluster)}
        onMarkerClick={(marker) => console.log('Marker:', marker)}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Filtering Only
// ============================================================================

export function Example3_FilteringOnly() {
  const [markers] = useState<SpatialMarker[]>([]);

  const {
    filteredMarkers,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    stats,
  } = useMarkerFiltering(markers, {
    searchThreshold: 0.3,
    maxSearchResults: 100,
    debounceMs: 300,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <MarkerSearch
        markers={markers}
        onSearchQueryChange={setSearchQuery}
        placeholder="Search markers..."
      />

      {/* Filters */}
      <MarkerFilters
        markers={markers}
        onFiltersChange={setFilters}
      />

      {/* Stats */}
      <div className="p-4 bg-gray-100 rounded">
        <p>Total: {stats.totalMarkers}</p>
        <p>Filtered: {stats.filteredCount}</p>
        <p>Search Results: {stats.searchResultCount}</p>
        <p>Active Filters: {activeFilterCount}</p>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
            Clear All Filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {filteredMarkers.map((marker) => (
          <div key={marker.id} className="p-3 bg-white border rounded">
            <h3 className="font-bold">{marker.title}</h3>
            <p className="text-sm text-gray-600">{marker.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Clustering + Filtering Combined (Manual)
// ============================================================================

export function Example4_CombinedManual() {
  const [markers] = useState<SpatialMarker[]>([]);
  const [cameraDistance] = useState(50);

  // Step 1: Filter markers
  const { filteredMarkers, setSearchQuery, setFilters } = useMarkerFiltering(markers);

  // Step 2: Cluster filtered markers
  const { clusters, isClusteringEnabled, toggleClustering } = useMarkerClustering(
    filteredMarkers,
    cameraDistance
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r p-4 space-y-4">
        <MarkerSearch markers={markers} onSearchQueryChange={setSearchQuery} />
        <MarkerFilters markers={markers} onFiltersChange={setFilters} />

        <button onClick={toggleClustering} className="w-full px-4 py-2 bg-blue-500 text-white rounded">
          {isClusteringEnabled ? 'Disable' : 'Enable'} Clustering
        </button>

        <div className="text-sm">
          <p>Filtered: {filteredMarkers.length}</p>
          <p>Clusters: {clusters.length}</p>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <MarkerClusterer
          markers={filteredMarkers}
          cameraDistance={cameraDistance}
          onClusterClick={(cluster) => console.log('Cluster:', cluster)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Custom Clustering Options
// ============================================================================

export function Example5_CustomClustering() {
  const [markers] = useState<SpatialMarker[]>([]);
  const [cameraDistance] = useState(50);

  // Custom clustering with larger grid size and different thresholds
  const { clusters } = useMarkerClustering(markers, cameraDistance, {
    gridSize: 2.0, // 2 meter grid cells (more aggressive clustering)
    minZoom: 50, // Auto-cluster when camera > 50m (further away)
    maxZoom: 15, // Auto-uncluster when camera < 15m (closer)
    minClusterSize: 3, // Require at least 3 markers to form cluster
    autoCluster: false, // Disable auto-clustering, manual only
  });

  return (
    <div>
      <p>Clusters with custom settings: {clusters.length}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Custom Search/Filter Options
// ============================================================================

export function Example6_CustomFiltering() {
  const [markers] = useState<SpatialMarker[]>([]);

  // Custom filtering with stricter search and slower debounce
  const { filteredMarkers } = useMarkerFiltering(markers, {
    searchThreshold: 0.2, // Stricter fuzzy matching (0 = exact, 1 = match anything)
    maxSearchResults: 50, // Show fewer results for performance
    debounceMs: 500, // Wait longer before searching (less reactive)
  });

  return (
    <div>
      <p>Filtered (strict): {filteredMarkers.length}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Programmatic Filter Control
// ============================================================================

export function Example7_ProgrammaticFilters() {
  const [markers] = useState<SpatialMarker[]>([]);
  const { filteredMarkers, setFilters } = useMarkerFiltering(markers);

  const showOnlyIssues = () => {
    setFilters({
      types: ['issue'],
      statuses: ['open'],
    });
  };

  const showRecentPhotos = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    setFilters({
      types: ['photo'],
      statuses: ['open'],
      dateRange: {
        start: lastWeek.toISOString().split('T')[0],
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <button onClick={showOnlyIssues} className="px-4 py-2 bg-red-500 text-white rounded">
          Show Active Issues
        </button>
        <button onClick={showRecentPhotos} className="px-4 py-2 bg-green-500 text-white rounded">
          Show Recent Photos
        </button>
      </div>

      <div>
        <p>Filtered Markers: {filteredMarkers.length}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: 3D Viewer Integration (Conceptual)
// ============================================================================

export function Example8_ThreeJSIntegration() {
  const [markers] = useState<SpatialMarker[]>([]);
  const [cameraDistance] = useState(50);

  const { filteredMarkers } = useMarkerFiltering(markers);
  const { clusters } = useMarkerClustering(filteredMarkers, cameraDistance);

  // Calculate dimmed markers (not in filtered results)
  const dimmedMarkerIds = markers
    .filter((m) => !filteredMarkers.find((fm) => fm.id === m.id))
    .map((m) => m.id);

  return (
    <div className="h-screen">
      {/* Conceptual ThreeJS integration */}
      {/*
      <ThreeJSViewer
        markers={filteredMarkers}
        clusters={clusters}
        dimmedMarkerIds={dimmedMarkerIds}
        onMarkerClick={(marker) => console.log('Clicked:', marker)}
        renderMarker={(marker, isDimmed) => (
          <MarkerBadge
            position={marker.position}
            opacity={isDimmed ? 0.3 : 1.0}
            onClick={() => console.log(marker)}
          />
        )}
        renderCluster={(cluster) => (
          <ClusterBadge
            position={cluster.position}
            count={cluster.count}
            onClick={() => zoomToCluster(cluster)}
          />
        )}
      />
      */}
    </div>
  );
}
