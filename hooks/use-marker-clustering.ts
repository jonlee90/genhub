// P3.8 - React hook for marker clustering state management

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  clusterMarkers,
  shouldEnableClustering,
  type MarkerCluster,
  type ClusteringOptions,
} from '@/lib/clustering/cluster-algorithm';
import type { SpatialMarker } from '@/types/spatial';

export interface UseMarkerClusteringOptions extends ClusteringOptions {
  autoCluster?: boolean; // Auto-enable clustering based on camera distance (default: true)
}

export interface UseMarkerClusteringReturn {
  clusters: MarkerCluster[];
  isClusteringEnabled: boolean;
  enableClustering: () => void;
  disableClustering: () => void;
  toggleClustering: () => void;
  resetAutoMode: () => void;
  stats: {
    totalMarkers: number;
    totalClusters: number;
    multiMarkerClusters: number;
    totalClustered: number;
    singleMarkers: number;
  };
}

/**
 * useMarkerClustering - Hook for managing marker clustering state
 *
 * Features:
 * - Auto-clustering based on camera distance
 * - Manual override for user control
 * - Cluster statistics
 * - Performance-optimized memoization
 *
 * @param markers - Array of spatial markers to cluster
 * @param cameraDistance - Distance from camera to scene center (for auto-clustering)
 * @param options - Clustering configuration options
 * @returns Clustering state and control functions
 */
export function useMarkerClustering(
  markers: SpatialMarker[],
  cameraDistance: number,
  options: UseMarkerClusteringOptions = {}
): UseMarkerClusteringReturn {
  const { autoCluster = true, ...clusteringOptions } = options;

  console.log('[useMarkerClustering] Hook initialized', {
    markerCount: markers.length,
    cameraDistance,
    autoCluster,
  });

  // Debug: Clustering state
  const [manualClusteringEnabled, setManualClusteringEnabled] = useState<boolean | null>(null);

  // Debug: Determine if auto-clustering should be enabled
  const autoClusteringEnabled = useMemo(() => {
    if (!autoCluster) return false;
    return shouldEnableClustering(cameraDistance, clusteringOptions);
  }, [autoCluster, cameraDistance, clusteringOptions]);

  // Debug: Actual clustering state (manual override or auto)
  const isClusteringEnabled = useMemo(() => {
    return manualClusteringEnabled !== null
      ? manualClusteringEnabled
      : autoClusteringEnabled;
  }, [manualClusteringEnabled, autoClusteringEnabled]);

  // Debug: Compute clusters
  const clusters = useMemo(() => {
    const startTime = performance.now();

    if (!isClusteringEnabled) {
      // Return individual markers as single-marker clusters
      const singleClusters = markers.map((marker) => {
        const position = typeof (marker as any).position === 'string'
          ? JSON.parse((marker as any).position)
          : { x: marker.position_x ?? 0, y: marker.position_y ?? 0, z: marker.position_z ?? 0 };

        return {
          id: `single-${marker.id}`,
          position: position || { x: 0, y: 0, z: 0 },
          markerIds: [marker.id],
          count: 1,
          bounds: {
            minX: position?.x || 0,
            minY: position?.y || 0,
            minZ: position?.z || 0,
            maxX: position?.x || 0,
            maxY: position?.y || 0,
            maxZ: position?.z || 0,
          },
        };
      });

      const elapsed = performance.now() - startTime;
      console.log('[useMarkerClustering] No clustering (individual markers)', {
        count: singleClusters.length,
        elapsed: `${elapsed.toFixed(2)}ms`,
      });

      return singleClusters;
    }

    const clustered = clusterMarkers(markers, clusteringOptions);

    const elapsed = performance.now() - startTime;
    console.log('[useMarkerClustering] Clusters computed', {
      markerCount: markers.length,
      clusterCount: clustered.length,
      elapsed: `${elapsed.toFixed(2)}ms`,
    });

    return clustered;
  }, [markers, isClusteringEnabled, clusteringOptions]);

  // Debug: Calculate statistics
  const stats = useMemo(() => {
    const multiMarkerClusters = clusters.filter((c) => c.count > 1);
    const totalClustered = multiMarkerClusters.reduce((sum, c) => sum + c.count, 0);

    return {
      totalMarkers: markers.length,
      totalClusters: clusters.length,
      multiMarkerClusters: multiMarkerClusters.length,
      totalClustered,
      singleMarkers: markers.length - totalClustered,
    };
  }, [clusters, markers.length]);

  // Debug: Control functions
  const enableClustering = useCallback(() => {
    console.log('[useMarkerClustering] Manually enabling clustering');
    setManualClusteringEnabled(true);
  }, []);

  const disableClustering = useCallback(() => {
    console.log('[useMarkerClustering] Manually disabling clustering');
    setManualClusteringEnabled(false);
  }, []);

  const toggleClustering = useCallback(() => {
    console.log('[useMarkerClustering] Toggling clustering', {
      current: isClusteringEnabled,
    });
    setManualClusteringEnabled((prev) => {
      if (prev === null) {
        return !autoClusteringEnabled;
      }
      return !prev;
    });
  }, [isClusteringEnabled, autoClusteringEnabled]);

  const resetAutoMode = useCallback(() => {
    console.log('[useMarkerClustering] Resetting to auto mode');
    setManualClusteringEnabled(null);
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[useMarkerClustering] State updated', {
      isClusteringEnabled,
      manualOverride: manualClusteringEnabled !== null,
      stats,
    });
  }, [isClusteringEnabled, manualClusteringEnabled, stats]);

  return {
    clusters,
    isClusteringEnabled,
    enableClustering,
    disableClustering,
    toggleClustering,
    resetAutoMode,
    stats,
  };
}
