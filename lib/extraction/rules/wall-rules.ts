/**
 * Wall Detection Rules (VEC-004)
 *
 * Detects wall segments from a VectorPage using four rules:
 *   VEC-004.1: Rule 1 (Parallel Line Pair) + Rule 2 (Filled Rectangle)
 *   VEC-004.2: Rule 3 (Thick Single Line) + Rule 4 (Curved Wall)
 *   VEC-004.3: Wall intersection detection + TI construction status
 *
 * Coordinate convention:
 *   - VectorPage coordinates are in drawing-space inches (PDF points / 72).
 *   - To obtain real-world dimensions, multiply by ScaleInfo.factor.
 *   - Positions are kept in drawing-space inches throughout.
 */

import type {
  VectorPage,
  VectorLine,
  VectorRect,
  VectorPath,
  WallSegment,
  ScaleInfo,
  Point,
  WallType,
  ConstructionStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Extended WallSegment with intersection metadata (VEC-004.3)
// ---------------------------------------------------------------------------

export interface WallIntersection {
  wallId: string;
  type: "T" | "L" | "X";
  point: Point;
}

export interface WallSegmentWithIntersections extends WallSegment {
  intersections: WallIntersection[];
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lineLength(start: Point, end: Point): number {
  return dist(start, end);
}

/** Angle in radians in the range [0, π). */
function lineAngleNorm(start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let a = Math.atan2(dy, dx);
  if (a < 0) a += Math.PI;
  if (a >= Math.PI) a -= Math.PI;
  return a;
}

/** Perpendicular distance from point p to the infinite line through a→b. */
function perpDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) return dist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Midpoint of two points. */
function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Project point p onto the infinite line through a→b.
 * Returns the parameter t such that the projection = a + t*(b-a).
 */
function projectOntoLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return 0;
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
}

/** Point at parameter t along segment a→b. */
function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Fit a circle through three non-collinear points.
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
 * Compute signed angle (radians) from the center to a point relative to 0°.
 */
function angleFromCenter(center: Point, p: Point): number {
  return Math.atan2(p.y - center.y, p.x - center.x);
}

/**
 * Parametric segment-segment intersection.
 * Returns { t, u } where t is parameter on segment A (a1→a2),
 * u is parameter on segment B (b1→b2). Intersection is valid if
 * both t and u are in [0, 1].
 */
function segmentIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): { t: number; u: number; point: Point } | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-9) return null; // Parallel

  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;

  const point: Point = {
    x: a1.x + t * dx1,
    y: a1.y + t * dy1,
  };
  return { t, u, point };
}

// ---------------------------------------------------------------------------
// VEC-004.1: Rule 1 — Parallel Line Pair
// ---------------------------------------------------------------------------

const DEG_TO_RAD = Math.PI / 180;

/**
 * Detect wall segments from pairs of parallel lines.
 * Lines are parallel if their angle difference (mod π) <= 1°.
 * The perpendicular distance in real-world inches must be 3"–12".
 * Each line must be > 24" real-world length.
 * Dashed lines (dashArray !== null) are excluded.
 */
function detectWallsFromParallelLines(
  lines: VectorLine[],
  scaleFactor: number,
): Array<{
  start: Point;
  end: Point;
  thickness: number;
  sourceType: "parallel";
  isDashed: boolean;
}> {
  const results: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "parallel";
    isDashed: boolean;
  }> = [];

  // Pre-filter: skip dashed lines; compute angles and lengths
  const eligible = lines
    .map((l, i) => {
      const len = lineLength(l.start, l.end) * scaleFactor; // real-world inches
      const angle = lineAngleNorm(l.start, l.end);
      return { line: l, index: i, len, angle };
    })
    .filter((e) => e.line.dashArray === null && e.len > 24);

  const ANGLE_TOL = 1 * DEG_TO_RAD;

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const a = eligible[i];
      const b = eligible[j];

      // Check parallel: angle diff mod π <= 1°
      let angleDiff = Math.abs(a.angle - b.angle);
      if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff;
      if (angleDiff > ANGLE_TOL) continue;

      // Perpendicular distance between the two lines (in drawing inches)
      const midA = midpoint(a.line.start, a.line.end);
      const perpDistDrawing = perpDist(midA, b.line.start, b.line.end);
      const perpDistReal = perpDistDrawing * scaleFactor;

      // Wall thickness must be 3"–12"
      if (perpDistReal < 3 || perpDistReal > 12) continue;

      // Build wall segment along the direction vector
      // Wall direction: use the angle of line A
      const dx = Math.cos(a.angle);
      const dy = Math.sin(a.angle);

      // Project both lines' endpoints onto the shared direction to find extent
      const allPoints = [a.line.start, a.line.end, b.line.start, b.line.end];
      const projections = allPoints.map((p) => {
        const mx = midA.x;
        const my = midA.y;
        return (p.x - mx) * dx + (p.y - my) * dy;
      });
      const tMin = Math.min(...projections);
      const tMax = Math.max(...projections);

      // Wall center line: average midpoints, projected onto direction
      const midB = midpoint(b.line.start, b.line.end);
      const avgMid = midpoint(midA, midB);

      const wallStart: Point = {
        x: avgMid.x + tMin * dx,
        y: avgMid.y + tMin * dy,
      };
      const wallEnd: Point = {
        x: avgMid.x + tMax * dx,
        y: avgMid.y + tMax * dy,
      };

      results.push({
        start: wallStart,
        end: wallEnd,
        thickness: perpDistReal,
        sourceType: "parallel",
        isDashed: false,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// VEC-004.1: Rule 2 — Filled Rectangle
// ---------------------------------------------------------------------------

/**
 * Detect wall segments from filled rectangles with high aspect ratio.
 * Aspect ratio > 4:1, shorter real-world dimension 3"–12", hasFill === true.
 */
function detectWallsFromFilledRects(
  rects: VectorRect[],
  scaleFactor: number,
): Array<{
  start: Point;
  end: Point;
  thickness: number;
  sourceType: "rect";
}> {
  const results: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "rect";
  }> = [];

  for (const rect of rects) {
    if (!rect.hasFill) continue;

    const realW = rect.width * scaleFactor;
    const realH = rect.height * scaleFactor;
    const longer = Math.max(realW, realH);
    const shorter = Math.min(realW, realH);

    if (shorter < 1e-9) continue;
    const aspectRatio = longer / shorter;
    if (aspectRatio <= 4) continue;
    if (shorter < 3 || shorter > 12) continue;

    // Long axis: horizontal or vertical
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    let wallStart: Point;
    let wallEnd: Point;

    if (realW >= realH) {
      // Horizontal wall: long axis is X
      wallStart = { x: rect.x, y: cy };
      wallEnd = { x: rect.x + rect.width, y: cy };
    } else {
      // Vertical wall: long axis is Y
      wallStart = { x: cx, y: rect.y };
      wallEnd = { x: cx, y: rect.y + rect.height };
    }

    results.push({
      start: wallStart,
      end: wallEnd,
      thickness: shorter,
      sourceType: "rect",
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// VEC-004.2: Rule 3 — Thick Single Line
// ---------------------------------------------------------------------------

/**
 * Detect walls from single thick lines.
 * strokeWidth (already in drawing-space inches) * scaleFactor = real-world inches.
 * Accept if real stroke width 3"–12" AND real line length > 24".
 */
function detectWallsFromThickLines(
  lines: VectorLine[],
  scaleFactor: number,
): Array<{
  start: Point;
  end: Point;
  thickness: number;
  sourceType: "thick";
  isDashed: boolean;
  drawingStart: Point;
  drawingEnd: Point;
}> {
  const results: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "thick";
    isDashed: boolean;
    drawingStart: Point;
    drawingEnd: Point;
  }> = [];

  for (const line of lines) {
    // strokeWidth is stored in drawing-space inches (ptToIn applied in parser)
    const realThickness = line.strokeWidth * scaleFactor;
    const realLength = lineLength(line.start, line.end) * scaleFactor;

    if (realThickness < 3 || realThickness > 12) continue;
    if (realLength <= 24) continue;

    results.push({
      start: line.start,
      end: line.end,
      thickness: realThickness,
      sourceType: "thick",
      isDashed: line.dashArray !== null,
      drawingStart: line.start,
      drawingEnd: line.end,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// VEC-004.2: Rule 4 — Curved Wall
// ---------------------------------------------------------------------------

/**
 * Detect curved walls from VectorPaths with 10+ points.
 * Fits a circle to first/middle/last point; accepts if radius > 36" real
 * and consistent stroke width 3"–12" real.
 */
function detectWallsFromCurvedPaths(
  paths: VectorPath[],
  scaleFactor: number,
): Array<{
  start: Point;
  end: Point;
  thickness: number;
  sourceType: "curved";
}> {
  const results: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "curved";
  }> = [];

  for (const path of paths) {
    if (path.isClosed) continue;
    if (path.points.length < 10) continue;

    const realThickness = path.strokeWidth * scaleFactor;
    if (realThickness < 3 || realThickness > 12) continue;

    const pts = path.points;
    const first = pts[0];
    const mid = pts[Math.floor(pts.length / 2)];
    const last = pts[pts.length - 1];

    const circle = fitCircle3(first, mid, last);
    if (!circle) continue;

    const realRadius = circle.r * scaleFactor;
    if (realRadius <= 36) continue;

    results.push({
      start: first,
      end: last,
      thickness: realThickness,
      sourceType: "curved",
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// VEC-004.2: Deduplication — Rule 1 vs Rule 3
// ---------------------------------------------------------------------------

/**
 * If a Rule-3 (thick single line) result has both endpoints within 2" real
 * of a Rule-1 (parallel pair) result, keep the Rule-1 result and drop Rule-3.
 */
function deduplicateParallelVsThick(
  parallelResults: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "parallel";
    isDashed: boolean;
  }>,
  thickResults: Array<{
    start: Point;
    end: Point;
    thickness: number;
    sourceType: "thick";
    isDashed: boolean;
    drawingStart: Point;
    drawingEnd: Point;
  }>,
  scaleFactor: number,
): Array<{
  start: Point;
  end: Point;
  thickness: number;
  sourceType: "thick";
  isDashed: boolean;
  drawingStart: Point;
  drawingEnd: Point;
}> {
  const DEDUP_THRESHOLD = 2 / scaleFactor; // 2" real → drawing-space

  return thickResults.filter((thick) => {
    const dominated = parallelResults.some((par) => {
      const startClose =
        dist(thick.start, par.start) <= DEDUP_THRESHOLD ||
        dist(thick.start, par.end) <= DEDUP_THRESHOLD;
      const endClose =
        dist(thick.end, par.start) <= DEDUP_THRESHOLD ||
        dist(thick.end, par.end) <= DEDUP_THRESHOLD;
      return startClose && endClose;
    });
    return !dominated;
  });
}

// ---------------------------------------------------------------------------
// VEC-004.3: Construction status from line properties
// ---------------------------------------------------------------------------

function determineConstructionStatus(
  isDashed: boolean,
  strokeWidthDrawing: number,
  scaleFactor: number,
): ConstructionStatus {
  if (isDashed) return "demolition";
  // Very thin strokes (real < 0.5 PDF points worth) = existing to remain
  // 0.5 PDF points = 0.5/72 drawing inches * scaleFactor real inches
  // Check: real strokeWidth < 0.5pt equivalent
  const realStroke = strokeWidthDrawing * scaleFactor;
  const halfPtReal = (0.5 / 72) * scaleFactor;
  if (realStroke < halfPtReal) return "existing_to_remain";
  return "new";
}

// ---------------------------------------------------------------------------
// VEC-004.3: Intersection detection
// ---------------------------------------------------------------------------

const INTERSECTION_TOLERANCE = 2; // inches real-world

/**
 * Detect intersections between wall segments.
 * Classifies as T, L, or X based on endpoint proximity and interior position.
 * Tolerance is 2" real-world, converted to drawing-space.
 */
function detectIntersections(
  walls: WallSegmentWithIntersections[],
  scaleFactor: number,
): void {
  const tol = INTERSECTION_TOLERANCE / scaleFactor; // drawing-space tolerance

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];

      const result = segmentIntersect(a.start, a.end, b.start, b.end);

      // Determine if endpoints of one wall are near the other wall
      const aEndpointsNearB = [a.start, a.end].map((pt) => {
        const t = projectOntoLine(pt, b.start, b.end);
        const proj = lerpPoint(b.start, b.end, t);
        return {
          isNearEndpoint: dist(pt, b.start) <= tol || dist(pt, b.end) <= tol,
          isNearInterior:
            t > tol / lineLength(b.start, b.end) &&
            t < 1 - tol / lineLength(b.start, b.end) &&
            dist(pt, proj) <= tol,
          pt,
        };
      });

      const bEndpointsNearA = [b.start, b.end].map((pt) => {
        const t = projectOntoLine(pt, a.start, a.end);
        const proj = lerpPoint(a.start, a.end, t);
        return {
          isNearEndpoint: dist(pt, a.start) <= tol || dist(pt, a.end) <= tol,
          isNearInterior:
            t > tol / lineLength(a.start, a.end) &&
            t < 1 - tol / lineLength(a.start, a.end) &&
            dist(pt, proj) <= tol,
          pt,
        };
      });

      const aEndNearBEndpoint = aEndpointsNearB.some((e) => e.isNearEndpoint);
      const aEndNearBInterior = aEndpointsNearB.some((e) => e.isNearInterior);
      const bEndNearAEndpoint = bEndpointsNearA.some((e) => e.isNearEndpoint);
      const bEndNearAInterior = bEndpointsNearA.some((e) => e.isNearInterior);

      let intersectionPoint: Point | null = null;
      let intersectionType: "T" | "L" | "X" | null = null;

      // X-intersection: parametric intersection interior to both segments
      if (
        result &&
        result.t > 0 &&
        result.t < 1 &&
        result.u > 0 &&
        result.u < 1
      ) {
        // Check if the intersection point is not near any endpoint
        const nearAEndpoint =
          dist(result.point, a.start) <= tol ||
          dist(result.point, a.end) <= tol;
        const nearBEndpoint =
          dist(result.point, b.start) <= tol ||
          dist(result.point, b.end) <= tol;

        if (!nearAEndpoint && !nearBEndpoint) {
          intersectionType = "X";
          intersectionPoint = result.point;
        }
      }

      // T-intersection: one wall's endpoint is near the other wall's interior
      if (!intersectionType && (aEndNearBInterior || bEndNearAInterior)) {
        intersectionType = "T";
        if (aEndNearBInterior) {
          const ep = aEndpointsNearB.find((e) => e.isNearInterior);
          intersectionPoint = ep ? ep.pt : midpoint(a.start, b.start);
        } else {
          const ep = bEndpointsNearA.find((e) => e.isNearInterior);
          intersectionPoint = ep ? ep.pt : midpoint(a.start, b.start);
        }
      }

      // L-corner: both walls have endpoints near each other
      if (!intersectionType && aEndNearBEndpoint && bEndNearAEndpoint) {
        intersectionType = "L";
        // Find the closest pair of endpoints
        let minD = Infinity;
        for (const pa of [a.start, a.end]) {
          for (const pb of [b.start, b.end]) {
            const d = dist(pa, pb);
            if (d < minD) {
              minD = d;
              intersectionPoint = midpoint(pa, pb);
            }
          }
        }
      }

      if (intersectionType && intersectionPoint) {
        walls[i].intersections.push({
          wallId: b.id,
          type: intersectionType,
          point: intersectionPoint,
        });
        walls[j].intersections.push({
          wallId: a.id,
          type: intersectionType,
          point: intersectionPoint,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// VEC-004: Main export
// ---------------------------------------------------------------------------

/**
 * Detect wall segments from a VectorPage using all four detection rules.
 *
 * Returns WallSegmentWithIntersections[] (extends WallSegment with intersections[]).
 * All positions remain in drawing-space inches; thickness values are in real-world inches.
 */
export function detectWalls(
  page: VectorPage,
  scale: ScaleInfo,
): WallSegmentWithIntersections[] {
  const f = scale.factor;
  const walls: WallSegmentWithIntersections[] = [];

  // Rule 1: Parallel Line Pairs
  const parallelWalls = detectWallsFromParallelLines(page.lines, f);

  for (const w of parallelWalls) {
    const wallType: WallType = w.thickness > 8 ? "structural" : "partition";
    // Determine construction status from the source lines
    // Parallel walls: already filtered to non-dashed, default to 'new'
    const seg: WallSegmentWithIntersections = {
      id: crypto.randomUUID(),
      start: w.start,
      end: w.end,
      thickness: w.thickness,
      type: wallType,
      constructionStatus: "new" as ConstructionStatus,
      isCurved: false,
      confidenceScore: 75,
      needsReview: false,
      intersections: [],
    };
    walls.push(seg);
  }

  // Rule 2: Filled Rectangles
  const rectWalls = detectWallsFromFilledRects(page.rects, f);

  for (const w of rectWalls) {
    const wallType: WallType = w.thickness > 8 ? "structural" : "partition";
    const seg: WallSegmentWithIntersections = {
      id: crypto.randomUUID(),
      start: w.start,
      end: w.end,
      thickness: w.thickness,
      type: wallType,
      constructionStatus: "new" as ConstructionStatus,
      isCurved: false,
      confidenceScore: 75,
      needsReview: false,
      intersections: [],
    };
    walls.push(seg);
  }

  // Rule 3: Thick Single Lines (with deduplication against Rule 1)
  const thickResults = detectWallsFromThickLines(page.lines, f);
  const dedupedThick = deduplicateParallelVsThick(
    parallelWalls,
    thickResults,
    f,
  );

  for (const w of dedupedThick) {
    const wallType: WallType = w.thickness > 8 ? "structural" : "partition";
    // Estimate strokeWidth in drawing-space for construction status check
    // Real thickness = strokeWidth_drawing * scaleFactor, so drawing = real / factor
    const strokeWidthDrawing = w.thickness / f;
    const status = determineConstructionStatus(
      w.isDashed,
      strokeWidthDrawing,
      f,
    );
    const seg: WallSegmentWithIntersections = {
      id: crypto.randomUUID(),
      start: w.start,
      end: w.end,
      thickness: w.thickness,
      type: wallType,
      constructionStatus: status,
      isCurved: false,
      confidenceScore: 75,
      needsReview: false,
      intersections: [],
    };
    walls.push(seg);
  }

  // Rule 4: Curved Walls
  const curvedResults = detectWallsFromCurvedPaths(page.paths, f);

  for (const w of curvedResults) {
    const wallType: WallType = w.thickness > 8 ? "structural" : "partition";
    const seg: WallSegmentWithIntersections = {
      id: crypto.randomUUID(),
      start: w.start,
      end: w.end,
      thickness: w.thickness,
      type: wallType,
      constructionStatus: "new" as ConstructionStatus,
      isCurved: true,
      confidenceScore: 75,
      needsReview: false,
      intersections: [],
    };
    walls.push(seg);
  }

  // VEC-004.3: Apply construction status from line style analysis
  // For Rule-1 (parallel) walls, check the original line dashes
  // We need to re-examine the lines to assign construction status to parallel walls
  applyConstructionStatusToParallelWalls(
    walls,
    page.lines,
    f,
    parallelWalls.length,
  );

  // VEC-004.3: Detect intersections between all walls
  detectIntersections(walls, f);

  return walls;
}

/**
 * Apply construction status to the parallel-pair walls (first N walls) based
 * on the source line properties. Checks nearby lines for dashes.
 */
function applyConstructionStatusToParallelWalls(
  walls: WallSegmentWithIntersections[],
  lines: VectorLine[],
  scaleFactor: number,
  parallelCount: number,
): void {
  const tol = 1 / scaleFactor; // 1" real → drawing-space

  for (let i = 0; i < parallelCount && i < walls.length; i++) {
    const wall = walls[i];
    // Find lines closest to this wall's center line
    const wallMid = midpoint(wall.start, wall.end);
    const nearLines = lines.filter((l) => {
      const lineMid = midpoint(l.start, l.end);
      return (
        dist(wallMid, lineMid) <
        (lineLength(wall.start, wall.end) / scaleFactor + 12) / scaleFactor
      );
    });

    const hasDashedNearby = nearLines.some((l) => l.dashArray !== null);
    if (hasDashedNearby) {
      wall.constructionStatus = "demolition";
    } else {
      wall.constructionStatus = "new";
    }
  }
}
