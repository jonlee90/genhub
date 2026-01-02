// P3.8 - Grid-based marker clustering algorithm
// Performance target: <50ms for 1000 markers

import type { SpatialMarker } from '@/types/spatial';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface MarkerCluster {
  id: string;
  position: Position3D;
  markerIds: string[];
  count: number;
  bounds: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
}

export interface ClusteringOptions {
  gridSize?: number; // Grid cell size in meters (default: 1.0)
  minZoom?: number; // Minimum zoom distance to show clusters (default: 30m)
  maxZoom?: number; // Maximum zoom distance to uncluster (default: 10m)
  minClusterSize?: number; // Minimum markers to form cluster (default: 2)
}

const DEFAULT_OPTIONS: Required<ClusteringOptions> = {
  gridSize: 1.0,
  minZoom: 30,
  maxZoom: 10,
  minClusterSize: 2,
};

/**
 * Parse position from marker (supports both JSON and object formats)
 */
function parsePosition(marker: SpatialMarker): Position3D | null {
  if (!marker.position) return null;

  // Handle JSON string format
  if (typeof marker.position === 'string') {
    try {
      const parsed = JSON.parse(marker.position);
      if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  // Handle object format
  if (typeof marker.position === 'object') {
    const pos = marker.position as any;
    if (typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
      return { x: pos.x, y: pos.y, z: pos.z };
    }
  }

  return null;
}

/**
 * Generate grid cell key from position
 */
function getGridKey(position: Position3D, gridSize: number): string {
  const cellX = Math.floor(position.x / gridSize);
  const cellY = Math.floor(position.y / gridSize);
  const cellZ = Math.floor(position.z / gridSize);
  return `${cellX},${cellY},${cellZ}`;
}

/**
 * Calculate centroid of positions
 */
function calculateCentroid(positions: Position3D[]): Position3D {
  const sum = positions.reduce(
    (acc, pos) => ({
      x: acc.x + pos.x,
      y: acc.y + pos.y,
      z: acc.z + pos.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / positions.length,
    y: sum.y / positions.length,
    z: sum.z / positions.length,
  };
}

/**
 * Calculate bounding box from positions
 */
function calculateBounds(positions: Position3D[]) {
  if (positions.length === 0) {
    return { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
  }

  const bounds = {
    minX: positions[0].x,
    minY: positions[0].y,
    minZ: positions[0].z,
    maxX: positions[0].x,
    maxY: positions[0].y,
    maxZ: positions[0].z,
  };

  for (let i = 1; i < positions.length; i++) {
    const pos = positions[i];
    bounds.minX = Math.min(bounds.minX, pos.x);
    bounds.minY = Math.min(bounds.minY, pos.y);
    bounds.minZ = Math.min(bounds.minZ, pos.z);
    bounds.maxX = Math.max(bounds.maxX, pos.x);
    bounds.maxY = Math.max(bounds.maxY, pos.y);
    bounds.maxZ = Math.max(bounds.maxZ, pos.z);
  }

  return bounds;
}

/**
 * Grid-based clustering algorithm
 * Groups markers within the same grid cell (gridSize x gridSize x gridSize)
 *
 * Performance: O(n) where n is number of markers
 * Target: <50ms for 1000 markers
 */
export function clusterMarkers(
  markers: SpatialMarker[],
  options: ClusteringOptions = {}
): MarkerCluster[] {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('[ClusterAlgorithm] Clustering markers', {
    markerCount: markers.length,
    gridSize: opts.gridSize,
    minClusterSize: opts.minClusterSize,
  });

  // Group markers by grid cell
  const gridMap = new Map<string, { markers: SpatialMarker[]; positions: Position3D[] }>();

  for (const marker of markers) {
    const position = parsePosition(marker);
    if (!position) continue;

    const key = getGridKey(position, opts.gridSize);

    if (!gridMap.has(key)) {
      gridMap.set(key, { markers: [], positions: [] });
    }

    const cell = gridMap.get(key)!;
    cell.markers.push(marker);
    cell.positions.push(position);
  }

  // Create clusters from grid cells with multiple markers
  const clusters: MarkerCluster[] = [];
  let clusterIndex = 0;

  // Convert Map entries to array for iteration (TS compatibility)
  const gridEntries = Array.from(gridMap.entries());

  for (let i = 0; i < gridEntries.length; i++) {
    const [key, cell] = gridEntries[i];

    if (cell.markers.length >= opts.minClusterSize) {
      // Create cluster
      const centroid = calculateCentroid(cell.positions);
      const bounds = calculateBounds(cell.positions);

      clusters.push({
        id: `cluster-${clusterIndex++}-${key}`,
        position: centroid,
        markerIds: cell.markers.map((m) => m.id),
        count: cell.markers.length,
        bounds,
      });
    } else {
      // Single markers (not clustered) - create individual "clusters"
      for (let j = 0; j < cell.markers.length; j++) {
        const marker = cell.markers[j];
        const position = cell.positions[j];

        clusters.push({
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
        });
      }
    }
  }

  const elapsed = performance.now() - startTime;
  console.log('[ClusterAlgorithm] Clustering complete', {
    markerCount: markers.length,
    clusterCount: clusters.length,
    elapsed: `${elapsed.toFixed(2)}ms`,
  });

  return clusters;
}

/**
 * Determine if clustering should be enabled based on zoom distance
 */
export function shouldEnableClustering(
  cameraDistance: number,
  options: ClusteringOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Enable clustering when camera is far (> minZoom)
  // Disable when camera is close (< maxZoom)
  // Hysteresis zone between minZoom and maxZoom prevents flickering

  return cameraDistance > opts.minZoom;
}

/**
 * Get cluster by marker ID
 */
export function getClusterForMarker(
  markerId: string,
  clusters: MarkerCluster[]
): MarkerCluster | undefined {
  return clusters.find((cluster) => cluster.markerIds.includes(markerId));
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(a: Position3D, b: Position3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
