'use client';

// P3.8 - Marker clustering UI component
// Renders cluster markers with count badges, click to expand, toggle on/off

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Grid3x3, MapPin, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  clusterMarkers,
  shouldEnableClustering,
  type MarkerCluster,
  type ClusteringOptions,
} from '@/lib/clustering/cluster-algorithm';
import type { SpatialMarker } from '@/types/spatial';

export interface MarkerClustererProps {
  markers: SpatialMarker[];
  cameraDistance: number; // Distance from camera to scene center
  onClusterClick?: (cluster: MarkerCluster) => void;
  onMarkerClick?: (marker: SpatialMarker) => void;
  selectedMarkerId?: string | null;
  clusteringOptions?: ClusteringOptions;
  className?: string;
}

/**
 * MarkerClusterer - Manages marker clustering and rendering
 *
 * Features:
 * - Auto-clusters markers within 1m grid cells
 * - Auto-enables clustering when camera distance > 30m
 * - Auto-disables clustering when camera distance < 10m
 * - Manual toggle for user control
 * - Click cluster to zoom and expand
 * - Construction-themed badges with count
 */
export function MarkerClusterer({
  markers,
  cameraDistance,
  onClusterClick,
  onMarkerClick,
  selectedMarkerId,
  clusteringOptions,
  className,
}: MarkerClustererProps) {
  console.log('[MarkerClusterer] Rendering', {
    markerCount: markers.length,
    cameraDistance,
  });

  // Debug: Clustering state
  const [manualClusteringEnabled, setManualClusteringEnabled] = useState<boolean | null>(null);

  // Debug: Determine if clustering is active
  const autoClusteringEnabled = shouldEnableClustering(cameraDistance, clusteringOptions);
  const clusteringEnabled = manualClusteringEnabled !== null
    ? manualClusteringEnabled
    : autoClusteringEnabled;

  // Debug: Compute clusters
  const clusters = useMemo(() => {
    if (!clusteringEnabled) {
      // Return individual markers as single-marker clusters
      return markers.map((marker) => {
        // Use individual position fields from database schema
        const position = {
          x: marker.position_x ?? 0,
          y: marker.position_y ?? 0,
          z: marker.position_z ?? 0,
        };

        return {
          id: `single-${marker.id}`,
          position,
          markerIds: [marker.id],
          count: 1,
          bounds: {
            minX: position.x,
            minY: position.y,
            minZ: position.z,
            maxX: position.x,
            maxY: position.y,
            maxZ: position.z,
          },
        };
      });
    }

    return clusterMarkers(markers, clusteringOptions);
  }, [markers, clusteringEnabled, clusteringOptions]);

  // Debug: Handle cluster click
  const handleClusterClick = useCallback(
    (cluster: MarkerCluster) => {
      console.log('[MarkerClusterer] Cluster clicked', {
        clusterId: cluster.id,
        markerCount: cluster.count,
      });

      if (cluster.count === 1 && onMarkerClick) {
        // Single marker - trigger marker click
        const marker = markers.find((m) => m.id === cluster.markerIds[0]);
        if (marker) {
          onMarkerClick(marker);
        }
      } else if (onClusterClick) {
        // Multi-marker cluster - trigger cluster click (zoom to expand)
        onClusterClick(cluster);
      }
    },
    [markers, onClusterClick, onMarkerClick]
  );

  // Debug: Toggle clustering
  const handleToggleClustering = useCallback(() => {
    console.log('[MarkerClusterer] Toggling clustering', {
      current: clusteringEnabled,
      manual: manualClusteringEnabled,
    });

    setManualClusteringEnabled((prev) => {
      if (prev === null) {
        // First manual toggle - invert auto state
        return !autoClusteringEnabled;
      }
      return !prev;
    });
  }, [clusteringEnabled, manualClusteringEnabled, autoClusteringEnabled]);

  // Debug: Reset manual override on auto state change
  const handleResetManual = useCallback(() => {
    console.log('[MarkerClusterer] Resetting manual override');
    setManualClusteringEnabled(null);
  }, []);

  // Debug: Calculate cluster stats
  const stats = useMemo(() => {
    const multiMarkerClusters = clusters.filter((c) => c.count > 1);
    const totalClustered = multiMarkerClusters.reduce((sum, c) => sum + c.count, 0);

    return {
      totalClusters: clusters.length,
      multiMarkerClusters: multiMarkerClusters.length,
      totalClustered,
      singleMarkers: markers.length - totalClustered,
    };
  }, [clusters, markers.length]);

  return (
    <div className={cn('relative', className)}>
      {/* Debug: Clustering control panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-50 bg-white border-2 border-[#001B51] rounded-lg shadow-lg overflow-hidden"
      >
        {/* Debug: Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleClustering}
          className={cn(
            'flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-200',
            clusteringEnabled && 'bg-[#001B51] text-white hover:bg-[#001B51]/90'
          )}
        >
          {clusteringEnabled ? (
            <Grid3x3 className="w-4 h-4" />
          ) : (
            <Layers className="w-4 h-4" />
          )}
          <span className="text-xs font-bold uppercase tracking-tight">
            {clusteringEnabled ? 'Clustered' : 'Individual'}
          </span>
        </Button>

        {/* Debug: Stats */}
        <div className="px-3 py-2 bg-gray-50 text-[10px] text-gray-600 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="font-medium">Markers:</span>
            <span className="font-bold text-[#001B51]">{markers.length}</span>
          </div>
          {clusteringEnabled && (
            <>
              <div className="flex justify-between gap-4">
                <span className="font-medium">Clusters:</span>
                <span className="font-bold text-[#059669]">{stats.multiMarkerClusters}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium">Grouped:</span>
                <span className="font-bold text-[#059669]">{stats.totalClustered}</span>
              </div>
            </>
          )}
          {manualClusteringEnabled !== null && (
            <button
              onClick={handleResetManual}
              className="text-[#001B51] hover:underline mt-1 font-medium"
            >
              Reset Auto
            </button>
          )}
        </div>
      </motion.div>

      {/* Debug: Cluster markers (rendered in 3D space - this is a placeholder for 3D integration) */}
      <div className="cluster-markers-container">
        <AnimatePresence mode="popLayout">
          {clusters.map((cluster) => (
            <ClusterMarker
              key={cluster.id}
              cluster={cluster}
              isSelected={cluster.markerIds.includes(selectedMarkerId || '')}
              onClick={() => handleClusterClick(cluster)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * ClusterMarker - Individual cluster or marker badge
 */
interface ClusterMarkerProps {
  cluster: MarkerCluster;
  isSelected: boolean;
  onClick: () => void;
}

function ClusterMarker({ cluster, isSelected, onClick }: ClusterMarkerProps) {
  const isCluster = cluster.count > 1;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'cluster-marker-badge cursor-pointer',
        'absolute transform -translate-x-1/2 -translate-y-1/2',
        'transition-all duration-200'
      )}
      style={{
        // Position will be set by 3D viewer integration
        left: '50%',
        top: '50%',
      }}
      onClick={onClick}
    >
      {isCluster ? (
        // Multi-marker cluster badge
        <div
          className={cn(
            'relative flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-gradient-to-br from-[#001B51] to-[#3C3C3C]',
            'border-4 border-white shadow-lg',
            isSelected && 'ring-4 ring-[#FFB627] ring-offset-2'
          )}
        >
          <span className="text-white font-black text-lg">{cluster.count}</span>

          {/* Debug: Cluster expand hint */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFB627] rounded-full flex items-center justify-center shadow-md"
          >
            <ZoomIn className="w-3 h-3 text-[#001B51]" />
          </motion.div>
        </div>
      ) : (
        // Single marker badge
        <div
          className={cn(
            'relative flex items-center justify-center',
            'w-8 h-8 rounded-full',
            'bg-white border-3 border-[#001B51] shadow-md',
            isSelected && 'ring-4 ring-[#FFB627] ring-offset-2'
          )}
        >
          <MapPin className="w-4 h-4 text-[#001B51]" />
        </div>
      )}
    </motion.div>
  );
}
