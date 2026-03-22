/**
 * Door Detection Rules (VEC-005)
 *
 * Detects door elements from a VectorPage using arc-based and specialty rules:
 *   VEC-005.1: Arc rules + double door + wall-gap fallback
 *   VEC-005.2: Specialty door rules (pocket, sliding, bi-fold, overhead)
 *
 * Coordinate convention:
 *   - VectorPage coordinates are in drawing-space inches (PDF points / 72).
 *   - To obtain real-world dimensions, multiply by ScaleInfo.factor.
 *   - Positions are kept in drawing-space inches; width values are real-world inches.
 */

import type {
  VectorPage,
  VectorArc,
  VectorPath,
  VectorRect,
  DoorElement,
  DoorType,
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

function lineLength(a: Point, b: Point): number {
  return dist(a, b);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Angle of a line segment in radians [0, π). */
function lineAngleNorm(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI;
  if (angle >= Math.PI) angle -= Math.PI;
  return angle;
}

/**
 * Normalize an angle to [0, 2π).
 */
function normalizeAngle(a: number): number {
  let r = a % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r;
}

/**
 * Compute the sweep angle of an arc from startAngle to endAngle (positive direction).
 */
function arcSweep(startAngle: number, endAngle: number): number {
  const start = normalizeAngle(startAngle);
  const end = normalizeAngle(endAngle);
  const sweep = end - start;
  return sweep < 0 ? sweep + 2 * Math.PI : sweep;
}

/**
 * Point on a circle at a given angle.
 */
function pointOnCircle(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

/**
 * Fit a circle through three points.
 * Returns { cx, cy, r } or null if points are collinear.
 */
function fitCircle3(
  p1: Point,
  p2: Point,
  p3: Point,
): { cx: number; cy: number; r: number } | null {
  const ax = p1.x,
    ay = p1.y;
  const bx = p2.x,
    by = p2.y;
  const cx = p3.x,
    cy = p3.y;

  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-9) return null;

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    D;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    D;

  const r = dist({ x: ux, y: uy }, p1);
  return { cx: ux, cy: uy, r };
}

/**
 * Compute the maximum residual of a set of points from a circle fit.
 */
function maxCircleResidual(
  points: Point[],
  cx: number,
  cy: number,
  r: number,
): number {
  let max = 0;
  for (const p of points) {
    const d = Math.abs(dist(p, { x: cx, y: cy }) - r);
    if (d > max) max = d;
  }
  return max;
}

/**
 * Check if a point is within tolerance of any wall endpoint.
 */
function isNearWallEndpoint(
  point: Point,
  walls: WallSegment[],
  tol: number,
): boolean {
  return walls.some(
    (w) => dist(point, w.start) <= tol || dist(point, w.end) <= tol,
  );
}

/**
 * Check if a point is near a wall segment (endpoint or interior).
 */
function isNearWall(point: Point, walls: WallSegment[], tol: number): boolean {
  return walls.some((w) => {
    if (dist(point, w.start) <= tol || dist(point, w.end) <= tol) return true;
    // Check interior: project onto segment
    const len = lineLength(w.start, w.end);
    if (len < 1e-9) return false;
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    const t =
      ((point.x - w.start.x) * dx + (point.y - w.start.y) * dy) / (len * len);
    if (t < 0 || t > 1) return false;
    const proj = { x: w.start.x + t * dx, y: w.start.y + t * dy };
    return dist(point, proj) <= tol;
  });
}

// ---------------------------------------------------------------------------
// VEC-005.1: Wall gap finder
// ---------------------------------------------------------------------------

export interface WallGap {
  point: Point; // midpoint of the gap
  walls: [WallSegment, WallSegment];
  gapLengthInches: number; // real-world inches
}

/**
 * Find pairs of wall endpoints that are within 6" real of each other
 * and roughly collinear (< 15° angle between the walls).
 */
export function findWallGaps(
  walls: WallSegment[],
  scaleFactor: number,
): WallGap[] {
  const gaps: WallGap[] = [];
  const GAP_TOLERANCE = 6 / scaleFactor; // 6" real → drawing-space
  const ANGLE_TOLERANCE = (15 * Math.PI) / 180; // 15°

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];

      const aAngle = lineAngleNorm(a.start, a.end);
      const bAngle = lineAngleNorm(b.start, b.end);

      // Check if walls are roughly collinear
      let angleDiff = Math.abs(aAngle - bAngle);
      if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff;
      if (angleDiff > ANGLE_TOLERANCE) continue;

      // Check endpoint pairs
      const endpointPairs: Array<[Point, Point]> = [
        [a.end, b.start],
        [a.end, b.end],
        [a.start, b.start],
        [a.start, b.end],
      ];

      for (const [pa, pb] of endpointPairs) {
        const d = dist(pa, pb);
        if (d <= GAP_TOLERANCE) {
          const gapLengthInches = d * scaleFactor;
          gaps.push({
            point: midpoint(pa, pb),
            walls: [a, b],
            gapLengthInches,
          });
          break; // Only record one gap per wall pair
        }
      }
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// VEC-005.1: Rule 1 — Arc at Wall Gap
// ---------------------------------------------------------------------------

interface ArcDoorCandidate {
  door: DoorElement;
  arc: VectorArc;
  gapPoint: Point | null;
}

/**
 * Detect doors from VectorArcs with ~90° sweep near wall endpoints.
 */
function detectDoorsFromArcs(
  arcs: VectorArc[],
  walls: WallSegment[],
  gaps: WallGap[],
  scaleFactor: number,
): ArcDoorCandidate[] {
  const candidates: ArcDoorCandidate[] = [];
  const SWEEP_MIN = (80 * Math.PI) / 180;
  const SWEEP_MAX = (100 * Math.PI) / 180;
  const RADIUS_MIN = 20; // real-world inches
  const RADIUS_MAX = 60;
  const WALL_ENDPOINT_TOL = 2 / scaleFactor; // 2" drawing-space

  for (const arc of arcs) {
    const sweep = arcSweep(arc.startAngle, arc.endAngle);
    if (sweep < SWEEP_MIN || sweep > SWEEP_MAX) continue;

    const realRadius = arc.radius * scaleFactor;
    if (realRadius < RADIUS_MIN || realRadius > RADIUS_MAX) continue;

    // Arc start and end points
    const arcStart = pointOnCircle(arc.center, arc.radius, arc.startAngle);
    const arcEnd = pointOnCircle(arc.center, arc.radius, arc.endAngle);

    // Check if start or end is near a wall endpoint
    const nearWallEndpoint =
      isNearWallEndpoint(arcStart, walls, WALL_ENDPOINT_TOL) ||
      isNearWallEndpoint(arcEnd, walls, WALL_ENDPOINT_TOL);

    if (!nearWallEndpoint) continue;

    // Find nearest gap for association
    let nearestGap: WallGap | null = null;
    let nearestGapDist = Infinity;
    for (const gap of gaps) {
      const d = Math.min(
        dist(arc.center, gap.point),
        dist(arcStart, gap.point),
        dist(arcEnd, gap.point),
      );
      if (d < nearestGapDist) {
        nearestGapDist = d;
        nearestGap = gap;
      }
    }

    const door: DoorElement = {
      id: crypto.randomUUID(),
      position: arc.center,
      width: realRadius,
      doorType: "DOOR",
      wallId: null,
      confidenceScore: 75,
      needsReview: false,
      reviewFlags: [],
    };

    candidates.push({
      door,
      arc,
      gapPoint: nearestGap ? nearestGap.point : null,
    });
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// VEC-005.1: Rule 2 — Polyline Arc
// ---------------------------------------------------------------------------

/**
 * Detect doors from VectorPaths that approximate a 90° arc.
 */
function detectDoorsFromPolylineArcs(
  paths: VectorPath[],
  walls: WallSegment[],
  gaps: WallGap[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const RESIDUAL_TOL = 1 / scaleFactor; // 1" real → drawing-space
  const SWEEP_MIN = (75 * Math.PI) / 180;
  const SWEEP_MAX = (105 * Math.PI) / 180;
  const RADIUS_MIN = 20;
  const RADIUS_MAX = 60;
  const GAP_PROXIMITY_TOL = 6 / scaleFactor; // 6" drawing-space

  for (const path of paths) {
    if (path.isClosed) continue;
    if (path.points.length < 8) continue;

    const pts = path.points;
    const first = pts[0];
    const mid = pts[Math.floor(pts.length / 2)];
    const last = pts[pts.length - 1];

    const circle = fitCircle3(first, mid, last);
    if (!circle) continue;

    // Check residuals
    const residual = maxCircleResidual(pts, circle.cx, circle.cy, circle.r);
    if (residual > RESIDUAL_TOL) continue;

    const realRadius = circle.r * scaleFactor;
    if (realRadius < RADIUS_MIN || realRadius > RADIUS_MAX) continue;

    // Compute sweep angle
    const startAngle = Math.atan2(first.y - circle.cy, first.x - circle.cx);
    const endAngle = Math.atan2(last.y - circle.cy, last.x - circle.cx);
    const sweep = arcSweep(startAngle, endAngle);

    if (sweep < SWEEP_MIN || sweep > SWEEP_MAX) continue;

    // Check if centroid is near a wall gap
    const centroid = { x: circle.cx, y: circle.cy };
    const nearGap = gaps.some(
      (g) => dist(centroid, g.point) <= GAP_PROXIMITY_TOL,
    );
    if (!nearGap && !isNearWall(centroid, walls, GAP_PROXIMITY_TOL)) continue;

    doors.push({
      id: crypto.randomUUID(),
      position: centroid,
      width: realRadius,
      doorType: "DOOR",
      wallId: null,
      confidenceScore: 75,
      needsReview: false,
      reviewFlags: [],
    });
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.1: Double Door detection
// ---------------------------------------------------------------------------

/**
 * Promote two Rule-1 arcs with mirrored orientation at the same gap to DOUBLE_DOOR.
 * Returns updated candidates (double-door pairs replaced with single DOUBLE_DOOR entry)
 * and any remaining single doors.
 */
function detectDoubleDoors(
  candidates: ArcDoorCandidate[],
  scaleFactor: number,
): DoorElement[] {
  const SAME_GAP_TOL = 4 / scaleFactor; // 4" real → drawing-space
  const MIRROR_ANGLE_TOL = (20 * Math.PI) / 180; // arcs ~180° apart

  const used = new Set<number>();
  const doors: DoorElement[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (used.has(i)) continue;

    let foundDouble = false;

    for (let j = i + 1; j < candidates.length; j++) {
      if (used.has(j)) continue;

      const a = candidates[i];
      const b = candidates[j];

      // Same gap location?
      const aPos = a.gapPoint ?? a.door.position;
      const bPos = b.gapPoint ?? b.door.position;
      if (dist(aPos, bPos) > SAME_GAP_TOL) continue;

      // Mirrored orientation: start angles ~180° apart
      const aStartNorm = normalizeAngle(a.arc.startAngle);
      const bStartNorm = normalizeAngle(b.arc.startAngle);
      let angleDiff = Math.abs(aStartNorm - bStartNorm);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      if (Math.abs(angleDiff - Math.PI) > MIRROR_ANGLE_TOL) continue;

      // Promote to DOUBLE_DOOR
      const totalWidth = a.door.width + b.door.width; // both radii combined
      const doubleDoor: DoorElement = {
        id: crypto.randomUUID(),
        position: midpoint(a.door.position, b.door.position),
        width: totalWidth,
        doorType: "DOUBLE_DOOR",
        wallId: null,
        confidenceScore: 80,
        needsReview: false,
        reviewFlags: [],
      };
      doors.push(doubleDoor);
      used.add(i);
      used.add(j);
      foundDouble = true;
      break;
    }

    if (!foundDouble) {
      doors.push(candidates[i].door);
      used.add(i);
    }
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.1: Wall-gap fallback
// ---------------------------------------------------------------------------

/**
 * For gaps not matched by Rule 1 or 2, create fallback doors
 * if gap length is 24"–120".
 */
function detectDoorsFromGapFallback(
  gaps: WallGap[],
  matchedGapPoints: Point[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const MATCH_TOL = 4 / scaleFactor; // 4" drawing-space
  const MIN_GAP = 24; // real-world inches
  const MAX_GAP = 120;

  for (const gap of gaps) {
    if (gap.gapLengthInches < MIN_GAP || gap.gapLengthInches > MAX_GAP)
      continue;

    // Check if this gap was already matched
    const alreadyMatched = matchedGapPoints.some(
      (p) => dist(p, gap.point) <= MATCH_TOL,
    );
    if (alreadyMatched) continue;

    doors.push({
      id: crypto.randomUUID(),
      position: gap.point,
      width: gap.gapLengthInches,
      doorType: "DOOR",
      wallId: null,
      confidenceScore: 35,
      needsReview: true,
      reviewFlags: ["arc_not_matched_to_wall_endpoint"],
    });
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.2: Rule 3 — Pocket Door
// ---------------------------------------------------------------------------

/**
 * Detect pocket doors from VectorRects partially overlapping wall cavities.
 * Aspect ratio > 6:1, short side < 2" real, centroid within wall bounds.
 */
function detectPocketDoors(
  rects: VectorRect[],
  walls: WallSegment[],
  gaps: WallGap[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const GAP_MATCH_TOL = 4 / scaleFactor;

  for (const rect of rects) {
    const realW = rect.width * scaleFactor;
    const realH = rect.height * scaleFactor;
    const longer = Math.max(realW, realH);
    const shorter = Math.min(realW, realH);

    if (shorter < 1e-9) continue;
    const aspectRatio = longer / shorter;
    if (aspectRatio <= 6) continue;
    if (shorter >= 2) continue; // short side must be < 2" real

    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const centroid = { x: cx, y: cy };

    // Centroid must be within wall bounds (near a wall)
    const withinWall = isNearWall(
      centroid,
      walls,
      shorter / scaleFactor + 1 / scaleFactor,
    );
    if (!withinWall) continue;

    // Check for matching gap
    const matchingGap = gaps.find(
      (g) => dist(centroid, g.point) <= GAP_MATCH_TOL,
    );
    if (!matchingGap) continue;

    doors.push({
      id: crypto.randomUUID(),
      position: centroid,
      width: longer, // real-world door width
      doorType: "POCKET_DOOR",
      wallId: null,
      confidenceScore: 75,
      needsReview: false,
      reviewFlags: [],
    });
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.2: Rule 4 — Sliding Door
// ---------------------------------------------------------------------------

/**
 * Detect sliding doors from two overlapping VectorRects at same wall gap,
 * each ~50% of gap width.
 */
function detectSlidingDoors(
  rects: VectorRect[],
  gaps: WallGap[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const GAP_MATCH_TOL = 6 / scaleFactor; // 6" drawing-space
  const OVERLAP_FRACTION_MIN = 0.3; // each rect must be ~50% of gap
  const OVERLAP_FRACTION_MAX = 0.7;

  // Pre-compute rect centers and real dimensions
  const rectInfo = rects.map((r) => ({
    rect: r,
    cx: r.x + r.width / 2,
    cy: r.y + r.height / 2,
    realW: r.width * scaleFactor,
    realH: r.height * scaleFactor,
  }));

  for (const gap of gaps) {
    const gapReal = gap.gapLengthInches;
    if (gapReal < 24 || gapReal > 120) continue;

    // Find rects near this gap
    const nearRects = rectInfo.filter(
      (ri) => dist({ x: ri.cx, y: ri.cy }, gap.point) <= GAP_MATCH_TOL,
    );

    if (nearRects.length < 2) continue;

    // Find pairs where each is ~50% of gap width
    for (let i = 0; i < nearRects.length; i++) {
      for (let j = i + 1; j < nearRects.length; j++) {
        const a = nearRects[i];
        const b = nearRects[j];

        const aWidth = Math.max(a.realW, a.realH);
        const bWidth = Math.max(b.realW, b.realH);

        const aFraction = aWidth / gapReal;
        const bFraction = bWidth / gapReal;

        if (
          aFraction < OVERLAP_FRACTION_MIN ||
          aFraction > OVERLAP_FRACTION_MAX
        )
          continue;
        if (
          bFraction < OVERLAP_FRACTION_MIN ||
          bFraction > OVERLAP_FRACTION_MAX
        )
          continue;

        // Combined width should approximate the gap
        const combinedFraction = (aWidth + bWidth) / gapReal;
        if (combinedFraction < 0.8 || combinedFraction > 1.3) continue;

        doors.push({
          id: crypto.randomUUID(),
          position: gap.point,
          width: gapReal,
          doorType: "SLIDING_DOOR",
          wallId: null,
          confidenceScore: 75,
          needsReview: false,
          reviewFlags: [],
        });
        break; // One sliding door per gap
      }
      // Break if we found one for this gap already
      if (
        doors.length > 0 &&
        doors[doors.length - 1].doorType === "SLIDING_DOOR"
      ) {
        const lastPos = doors[doors.length - 1].position;
        if (dist(lastPos, gap.point) < GAP_MATCH_TOL) break;
      }
    }
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.2: Rule 5 — Bi-fold Door
// ---------------------------------------------------------------------------

/**
 * Detect bi-fold doors from zigzag sequences of thin rectangles at alternating ±45° angles.
 */
function detectBifoldDoors(
  rects: VectorRect[],
  gaps: WallGap[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const GAP_MATCH_TOL = 6 / scaleFactor;
  const ANGLE_TARGET = (45 * Math.PI) / 180;
  const ANGLE_TOL = (10 * Math.PI) / 180;
  const MAX_THICKNESS = 2 / scaleFactor; // thin rects < 2" drawing-space

  for (const gap of gaps) {
    if (gap.gapLengthInches < 24 || gap.gapLengthInches > 120) continue;

    // Find thin rects near this gap
    const nearRects = rects.filter((r) => {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      return dist({ x: cx, y: cy }, gap.point) <= GAP_MATCH_TOL;
    });

    if (nearRects.length < 2) continue;

    // Check if rects have alternating ±45° angles
    let zigzagCount = 0;
    for (const r of nearRects) {
      const realW = r.width * scaleFactor;
      const realH = r.height * scaleFactor;
      const shorter = Math.min(realW, realH);

      if (shorter >= 2) continue; // Must be thin

      // Determine long axis angle
      const angle =
        realW >= realH
          ? 0 // horizontal
          : Math.PI / 2; // vertical (would be 90°)

      // For 45° check, we need the rect to be rotated, but VectorRect is axis-aligned.
      // We check if it's a thin rect with roughly equal sides (indicating a rotated thin rect
      // that a PDF tool might render as axis-aligned approximation).
      // Accept if aspect ratio > 3:1 (thin), and check for 45° approximation via
      // equal-ish width and height at 45° projection.
      const longer = Math.max(realW, realH);
      if (shorter < 1e-9 || longer / shorter < 3) continue;

      // Check if the rect's diagonal approximates 45°
      const rectAngle = lineAngleNorm(
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
      );
      const diffFrom45 = Math.abs(rectAngle - ANGLE_TARGET);
      const diffFromNeg45 = Math.abs(rectAngle - (Math.PI - ANGLE_TARGET));

      if (diffFrom45 <= ANGLE_TOL || diffFromNeg45 <= ANGLE_TOL) {
        zigzagCount++;
      }

      // Also accept purely horizontal/vertical thin rects grouped near a gap
      // as potential bi-fold panels
      if (angle === 0 || angle === Math.PI / 2) {
        zigzagCount++;
      }
    }

    if (zigzagCount >= 2) {
      // Compute total span from the rects near this gap
      const nearRectsFiltered = nearRects.filter((r) => {
        const shorter = Math.min(r.width, r.height) * scaleFactor;
        return shorter < 2;
      });

      const allX = nearRectsFiltered.flatMap((r) => [r.x, r.x + r.width]);
      const allY = nearRectsFiltered.flatMap((r) => [r.y, r.y + r.height]);
      const spanX = (Math.max(...allX) - Math.min(...allX)) * scaleFactor;
      const spanY = (Math.max(...allY) - Math.min(...allY)) * scaleFactor;
      const span = Math.max(spanX, spanY);

      // Span should roughly match gap length
      if (
        span > gap.gapLengthInches * 0.5 &&
        span < gap.gapLengthInches * 1.5
      ) {
        doors.push({
          id: crypto.randomUUID(),
          position: gap.point,
          width: gap.gapLengthInches,
          doorType: "BIFOLD_DOOR",
          wallId: null,
          confidenceScore: 75,
          needsReview: false,
          reviewFlags: [],
        });
      }
    }
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005.2: Rule 6 — Overhead/Garage Door
// ---------------------------------------------------------------------------

/**
 * Detect overhead/garage doors from dashed lines spanning gap > 96" real width.
 * Wall must continue on both sides of the gap with no arc present.
 */
function detectOverheadDoors(
  page: VectorPage,
  walls: WallSegment[],
  gaps: WallGap[],
  arcDoors: DoorElement[],
  scaleFactor: number,
): DoorElement[] {
  const doors: DoorElement[] = [];
  const GAP_MATCH_TOL = 6 / scaleFactor;
  const MIN_REAL_WIDTH = 96; // real-world inches

  for (const gap of gaps) {
    if (gap.gapLengthInches < MIN_REAL_WIDTH) continue;

    // No arc door at this gap
    const hasArcDoor = arcDoors.some(
      (d) => dist(d.position, gap.point) <= GAP_MATCH_TOL,
    );
    if (hasArcDoor) continue;

    // Check for dashed lines spanning the gap
    const gapDrawingWidth = gap.gapLengthInches / scaleFactor;
    const dashedLines = page.lines.filter((l) => {
      if (!l.dashArray) return false;
      const len = lineLength(l.start, l.end);
      if (len < gapDrawingWidth * 0.7) return false; // Must span most of the gap
      const lineMid = {
        x: (l.start.x + l.end.x) / 2,
        y: (l.start.y + l.end.y) / 2,
      };
      return dist(lineMid, gap.point) <= GAP_MATCH_TOL;
    });

    if (dashedLines.length === 0) continue;

    // Wall continues on both sides (gap has two walls)
    // By definition of findWallGaps, gap.walls has both sides
    doors.push({
      id: crypto.randomUUID(),
      position: gap.point,
      width: gap.gapLengthInches,
      doorType: "OVERHEAD_DOOR",
      wallId: null,
      confidenceScore: 75,
      needsReview: false,
      reviewFlags: [],
    });
  }

  return doors;
}

// ---------------------------------------------------------------------------
// VEC-005: Main export
// ---------------------------------------------------------------------------

/**
 * Detect door elements from a VectorPage using all VEC-005 rules.
 *
 * Returns DoorElement[] with positions in drawing-space inches and
 * widths in real-world inches.
 */
export function detectDoors(
  page: VectorPage,
  walls: WallSegment[],
  scale: ScaleInfo,
): DoorElement[] {
  const f = scale.factor;
  const allDoors: DoorElement[] = [];

  // Find wall gaps for fallback and specialty rules
  const gaps = findWallGaps(walls, f);

  // Rule 1: Arc at Wall Gap
  const arcCandidates = detectDoorsFromArcs(page.arcs, walls, gaps, f);

  // Rule 2: Polyline Arc
  const polylineArcDoors = detectDoorsFromPolylineArcs(
    page.paths,
    walls,
    gaps,
    f,
  );

  // Detect Double Doors from Rule 1 candidates
  const arcDoors = detectDoubleDoors(arcCandidates, f);

  // Collect matched gap points (from Rule 1 + 2)
  const matchedGapPoints: Point[] = [];
  for (const door of arcDoors) {
    matchedGapPoints.push(door.position);
  }
  for (const door of polylineArcDoors) {
    matchedGapPoints.push(door.position);
  }

  // Wall-gap fallback (Rule 1 / 2 unmatched gaps)
  const fallbackDoors = detectDoorsFromGapFallback(gaps, matchedGapPoints, f);

  allDoors.push(...arcDoors, ...polylineArcDoors, ...fallbackDoors);

  // VEC-005.2: Specialty doors
  // Track which gaps are already claimed by specialty rules to avoid duplicating with fallback
  const specialtyDoors: DoorElement[] = [];

  // Rule 3: Pocket Door
  const pocketDoors = detectPocketDoors(page.rects, walls, gaps, f);
  specialtyDoors.push(...pocketDoors);

  // Rule 4: Sliding Door
  const slidingDoors = detectSlidingDoors(page.rects, gaps, f);
  specialtyDoors.push(...slidingDoors);

  // Rule 5: Bi-fold Door
  const bifoldDoors = detectBifoldDoors(page.rects, gaps, f);
  specialtyDoors.push(...bifoldDoors);

  // Rule 6: Overhead/Garage Door
  const overheadDoors = detectOverheadDoors(page, walls, gaps, arcDoors, f);
  specialtyDoors.push(...overheadDoors);

  allDoors.push(...specialtyDoors);

  return allDoors;
}
