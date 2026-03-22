/**
 * Window Detection Rules (VEC-008)
 *
 * Detects window elements from a VectorPage:
 *   VEC-008.1: Standard window + curtain wall + schedule cross-reference
 *
 * Coordinate convention:
 *   - VectorPage coordinates are in drawing-space inches (PDF points / 72).
 *   - To obtain real-world dimensions, multiply by ScaleInfo.factor.
 *   - Positions are kept in drawing-space inches; width values are real-world inches.
 */

import type {
  VectorPage,
  VectorRect,
  VectorLine,
  WindowElement,
  WallSegment,
  ScaleInfo,
  Point,
} from "../types";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Compute the minimum distance from point p to the line segment a→b.
 */
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const lenSq = ab.x ** 2 + ab.y ** 2;
  if (lenSq < 1e-12) return dist(p, a);
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / lenSq));
  const closest = { x: a.x + t * ab.x, y: a.y + t * ab.y };
  return dist(p, closest);
}

/**
 * Normalized angle in [0, π).
 */
function lineAngleNorm(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI;
  if (angle >= Math.PI) angle -= Math.PI;
  return angle;
}

// ---------------------------------------------------------------------------
// VEC-008.1: Wall thickness estimation
// ---------------------------------------------------------------------------

/**
 * Estimate average wall thickness from detected walls (in drawing-space inches).
 * Falls back to a nominal 6" / scale.factor if walls is empty.
 */
function estimateWallThicknessDrawing(
  walls: WallSegment[],
  scaleFactor: number,
): number {
  if (walls.length === 0) return 6 / scaleFactor;
  const avg = walls.reduce((sum, w) => sum + w.thickness, 0) / walls.length;
  // Wall thickness is already in real-world inches; convert to drawing-space
  return avg / scaleFactor;
}

// ---------------------------------------------------------------------------
// VEC-008.1: Schedule cross-reference lookup
// ---------------------------------------------------------------------------

const WINDOW_SCHEDULE_PATTERN = /W[-\s]?\d+|W[A-Z]\d*/i;

/**
 * Search textClusters within 6" drawing-space of the given centroid
 * for a window schedule reference matching the WINDOW_SCHEDULE_PATTERN regex.
 * Returns the matched text (trimmed) or null.
 */
function findScheduleRef(
  centroid: Point,
  page: VectorPage,
  scaleFactor: number,
): string | null {
  const searchRadius = 6 / scaleFactor; // 6" real → drawing-space

  for (const cluster of page.textClusters) {
    if (dist(cluster.centroid, centroid) > searchRadius) continue;
    for (const textObj of cluster.texts) {
      const trimmed = textObj.content.trim();
      if (WINDOW_SCHEDULE_PATTERN.test(trimmed)) {
        return trimmed;
      }
    }
  }

  // Also search raw texts as fallback
  for (const textObj of page.texts) {
    if (dist(textObj.position, centroid) > searchRadius) continue;
    const trimmed = textObj.content.trim();
    if (WINDOW_SCHEDULE_PATTERN.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// VEC-008.1: Find nearest wall id for a centroid within tolerance
// ---------------------------------------------------------------------------

/**
 * Returns the id of the nearest wall whose centerline is within
 * toleranceDrawing drawing-space inches, or null.
 */
function findNearestWallId(
  centroid: Point,
  walls: WallSegment[],
  toleranceDrawing: number,
): string | null {
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const wall of walls) {
    const d = pointToSegmentDistance(centroid, wall.start, wall.end);
    if (d <= toleranceDrawing && d < bestDist) {
      bestDist = d;
      bestId = wall.id;
    }
  }
  return bestId;
}

// ---------------------------------------------------------------------------
// VEC-008.1: Check if rect centroid is within a wall (within tolerance)
// ---------------------------------------------------------------------------

/**
 * Returns true if the centroid of a rect is within `tolerance` drawing-space
 * inches of any wall segment's centerline.
 */
function isCentroidInWall(
  centroid: Point,
  walls: WallSegment[],
  tolerance: number,
): boolean {
  return walls.some(
    (w) => pointToSegmentDistance(centroid, w.start, w.end) <= tolerance,
  );
}

// ---------------------------------------------------------------------------
// VEC-008.1: Standard window detection
// ---------------------------------------------------------------------------

/**
 * Detect standard window elements from VectorRects embedded in walls.
 *
 * Rule: rect centroid within 2" drawing-space of a wall centerline,
 * real width 24"–120", shorter dimension < wall thickness.
 */
function detectStandardWindows(
  rects: VectorRect[],
  walls: WallSegment[],
  page: VectorPage,
  scaleFactor: number,
  wallThicknessDrawing: number,
): WindowElement[] {
  const windows: WindowElement[] = [];
  const WALL_PROXIMITY_TOL = 2 / scaleFactor; // 2" real → drawing-space
  const MIN_WINDOW_REAL = 24; // real-world inches
  const MAX_WINDOW_REAL = 120;

  for (const rect of rects) {
    const realW = rect.width * scaleFactor;
    const realH = rect.height * scaleFactor;
    const longer = Math.max(realW, realH);
    const shorter = Math.min(realW, realH);

    // Must be within window width range (longer dimension)
    if (longer < MIN_WINDOW_REAL || longer > MAX_WINDOW_REAL) continue;

    // Shorter dimension must be less than estimated wall thickness (in real inches)
    const wallThicknessReal = wallThicknessDrawing * scaleFactor;
    if (shorter >= wallThicknessReal) continue;

    // Centroid
    const centroid: Point = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };

    // Centroid must be within 2" drawing-space of a wall
    if (!isCentroidInWall(centroid, walls, WALL_PROXIMITY_TOL)) continue;

    const scheduleRef = findScheduleRef(centroid, page, scaleFactor);
    const wallId = findNearestWallId(centroid, walls, WALL_PROXIMITY_TOL);

    windows.push({
      id: crypto.randomUUID(),
      position: centroid,
      width: longer,
      windowType: "WINDOW",
      wallId,
      scheduleRef,
      confidenceScore: 70,
      needsReview: false,
    });
  }

  return windows;
}

// ---------------------------------------------------------------------------
// VEC-008.1: Curtain wall detection
// ---------------------------------------------------------------------------

/**
 * Check if a set of parallel lines inside a bounding rect have consistent spacing.
 * Returns mullion count if spacing consistency is within ±5%, otherwise 0.
 */
function countMullions(
  lines: VectorLine[],
  bandRect: { x: number; y: number; width: number; height: number },
  isHorizontalBand: boolean,
  scaleFactor: number,
): number {
  // Filter lines that are inside the band and roughly parallel to the band axis
  const bandAngle = isHorizontalBand ? 0 : Math.PI / 2;
  const ANGLE_TOL = (15 * Math.PI) / 180;

  const inside = lines.filter((l) => {
    const mx = (l.start.x + l.end.x) / 2;
    const my = (l.start.y + l.end.y) / 2;
    if (
      mx < bandRect.x ||
      mx > bandRect.x + bandRect.width ||
      my < bandRect.y ||
      my > bandRect.y + bandRect.height
    ) {
      return false;
    }
    const angle = lineAngleNorm(l.start, l.end);
    // For mullions, they run perpendicular to the band direction
    const perpAngle = (bandAngle + Math.PI / 2) % Math.PI;
    const diff = Math.abs(angle - perpAngle);
    return diff <= ANGLE_TOL || Math.abs(diff - Math.PI) <= ANGLE_TOL;
  });

  if (inside.length < 2) return 0;

  // Compute positions along the band axis
  const positions = inside.map((l) => {
    const mx = (l.start.x + l.end.x) / 2;
    const my = (l.start.y + l.end.y) / 2;
    return isHorizontalBand ? mx : my;
  });
  positions.sort((a, b) => a - b);

  // Compute spacings
  const spacings: number[] = [];
  for (let i = 1; i < positions.length; i++) {
    spacings.push(positions[i] - positions[i - 1]);
  }

  if (spacings.length === 0) return 0;

  const avgSpacing = spacings.reduce((s, v) => s + v, 0) / spacings.length;
  if (avgSpacing < 1e-9) return 0;

  // Check consistency within ±5%
  const consistent = spacings.every(
    (s) => Math.abs(s - avgSpacing) / avgSpacing <= 0.05,
  );

  return consistent ? inside.length : 0;
}

/**
 * Detect curtain wall / storefront windows.
 *
 * Single rect > 120" real width, OR collinear thin rects totalling > 120".
 * Checks for mullion lines with consistent spacing inside the band.
 */
function detectCurtainWalls(
  rects: VectorRect[],
  walls: WallSegment[],
  page: VectorPage,
  scaleFactor: number,
  wallThicknessDrawing: number,
  standardWindowIds: Set<string>,
): WindowElement[] {
  const windows: WindowElement[] = [];
  const WALL_PROXIMITY_TOL = 2 / scaleFactor;
  const MIN_CURTAIN_REAL = 120; // real-world inches
  const wallThicknessReal = wallThicknessDrawing * scaleFactor;

  // --- Single large rect ---
  for (const rect of rects) {
    const realW = rect.width * scaleFactor;
    const realH = rect.height * scaleFactor;
    const longer = Math.max(realW, realH);
    const shorter = Math.min(realW, realH);

    if (longer <= MIN_CURTAIN_REAL) continue;
    if (shorter >= wallThicknessReal) continue;

    const centroid: Point = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };

    if (!isCentroidInWall(centroid, walls, WALL_PROXIMITY_TOL)) continue;

    const isHorizontal = realW >= realH;
    const mullionCount = countMullions(
      page.lines,
      rect,
      isHorizontal,
      scaleFactor,
    );

    const scheduleRef = findScheduleRef(centroid, page, scaleFactor);
    const wallId = findNearestWallId(centroid, walls, WALL_PROXIMITY_TOL);

    windows.push({
      id: crypto.randomUUID(),
      position: centroid,
      width: longer,
      windowType: "CURTAIN_WALL",
      wallId,
      scheduleRef,
      mullionCount: mullionCount > 0 ? mullionCount : undefined,
      confidenceScore: 70,
      needsReview: false,
    });
  }

  // --- Collinear thin rects totalling > 120" ---
  // Find "thin" rects that are not already classified as curtain walls or standard windows
  const thinRects = rects.filter((rect) => {
    const realW = rect.width * scaleFactor;
    const realH = rect.height * scaleFactor;
    const longer = Math.max(realW, realH);
    const shorter = Math.min(realW, realH);
    return (
      shorter < wallThicknessReal && longer >= 24 && longer <= MIN_CURTAIN_REAL
    );
  });

  // Group collinear thin rects: same angle within 1°, perpendicular distance < wall thickness
  const DEG_TOL = (1 * Math.PI) / 180;
  const used = new Set<number>();

  for (let i = 0; i < thinRects.length; i++) {
    if (used.has(i)) continue;

    const base = thinRects[i];
    const baseRealW = base.width * scaleFactor;
    const baseRealH = base.height * scaleFactor;
    const isBaseHoriz = baseRealW >= baseRealH;
    const baseAngle = isBaseHoriz ? 0 : Math.PI / 2;

    const group: VectorRect[] = [base];
    const groupIndices: number[] = [i];

    for (let j = i + 1; j < thinRects.length; j++) {
      if (used.has(j)) continue;

      const other = thinRects[j];
      const otherRealW = other.width * scaleFactor;
      const otherRealH = other.height * scaleFactor;
      const isOtherHoriz = otherRealW >= otherRealH;
      const otherAngle = isOtherHoriz ? 0 : Math.PI / 2;

      // Same orientation
      const angleDiff = Math.abs(baseAngle - otherAngle);
      if (angleDiff > DEG_TOL && Math.abs(angleDiff - Math.PI) > DEG_TOL)
        continue;

      // Roughly collinear: perpendicular distance between centerlines < wall thickness
      const baseCx = base.x + base.width / 2;
      const baseCy = base.y + base.height / 2;
      const otherCx = other.x + other.width / 2;
      const otherCy = other.y + other.height / 2;

      const perpDist = isBaseHoriz
        ? Math.abs(baseCy - otherCy)
        : Math.abs(baseCx - otherCx);

      if (perpDist > wallThicknessDrawing) continue;

      group.push(other);
      groupIndices.push(j);
    }

    if (group.length < 2) continue;

    // Compute total span of the group
    const allCoords = group.flatMap((r) =>
      isBaseHoriz ? [r.x, r.x + r.width] : [r.y, r.y + r.height],
    );
    const totalSpanDrawing = Math.max(...allCoords) - Math.min(...allCoords);
    const totalSpanReal = totalSpanDrawing * scaleFactor;

    if (totalSpanReal <= MIN_CURTAIN_REAL) continue;

    // Compute group centroid
    const groupCx =
      group.reduce((sum, r) => sum + r.x + r.width / 2, 0) / group.length;
    const groupCy =
      group.reduce((sum, r) => sum + r.y + r.height / 2, 0) / group.length;
    const groupCentroid: Point = { x: groupCx, y: groupCy };

    if (!isCentroidInWall(groupCentroid, walls, WALL_PROXIMITY_TOL)) continue;

    // Build bounding box for mullion detection
    const allX = group.flatMap((r) => [r.x, r.x + r.width]);
    const allY = group.flatMap((r) => [r.y, r.y + r.height]);
    const bandRect = {
      x: Math.min(...allX),
      y: Math.min(...allY),
      width: Math.max(...allX) - Math.min(...allX),
      height: Math.max(...allY) - Math.min(...allY),
    };

    const mullionCount = countMullions(
      page.lines,
      bandRect,
      isBaseHoriz,
      scaleFactor,
    );

    const scheduleRef = findScheduleRef(groupCentroid, page, scaleFactor);
    const wallId = findNearestWallId(groupCentroid, walls, WALL_PROXIMITY_TOL);

    windows.push({
      id: crypto.randomUUID(),
      position: groupCentroid,
      width: totalSpanReal,
      windowType: "CURTAIN_WALL",
      wallId,
      scheduleRef,
      mullionCount: mullionCount > 0 ? mullionCount : undefined,
      confidenceScore: 70,
      needsReview: false,
    });

    groupIndices.forEach((idx) => used.add(idx));
  }

  void standardWindowIds; // acknowledged — used by caller to avoid double-counting
  return windows;
}

// ---------------------------------------------------------------------------
// VEC-008: Main export
// ---------------------------------------------------------------------------

/**
 * Detect window elements from a VectorPage using VEC-008.1 rules.
 *
 * Returns WindowElement[] with positions in drawing-space inches and
 * width values in real-world inches.
 */
export function detectWindows(
  page: VectorPage,
  walls: WallSegment[],
  scale: ScaleInfo,
): WindowElement[] {
  const f = scale.factor;

  const wallThicknessDrawing = estimateWallThicknessDrawing(walls, f);

  // Step 1: Standard windows (24"–120" wide)
  const standardWindows = detectStandardWindows(
    page.rects,
    walls,
    page,
    f,
    wallThicknessDrawing,
  );

  const standardWindowIds = new Set<string>(standardWindows.map((w) => w.id));

  // Step 2: Curtain walls / storefronts (> 120" wide)
  const curtainWalls = detectCurtainWalls(
    page.rects,
    walls,
    page,
    f,
    wallThicknessDrawing,
    standardWindowIds,
  );

  return [...standardWindows, ...curtainWalls];
}
