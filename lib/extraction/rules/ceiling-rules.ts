/**
 * Ceiling Element Detection Rules (VEC-015)
 *
 * Detects ceiling grid, light fixtures, and HVAC diffusers from an RCP sheet:
 *   VEC-015.1: RCP sheet detection + ceiling grid extraction
 *   VEC-015.2: Fixture and diffuser symbol detection
 *
 * Coordinate convention:
 *   - VectorPage coordinates are in drawing-space inches (PDF points / 72).
 *   - To obtain real-world dimensions, multiply by ScaleInfo.factor.
 */

import type {
  VectorPage,
  VectorLine,
  VectorRect,
  RoomPolygon,
  ScaleInfo,
  Point,
} from "../types";

// ---------------------------------------------------------------------------
// VEC-015: Result type
// ---------------------------------------------------------------------------

export interface CeilingResult {
  gridSize: "2x2" | "2x4" | "none";
  ceilingAreaPerRoom: Record<string, number>;
  fixtureCount: number;
  diffuserCount: number;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Angle of a line in degrees, range (-180, 180]. */
function lineAngle(line: VectorLine): number {
  return (
    Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) *
    (180 / Math.PI)
  );
}

/** Median of a numeric array. Returns 0 for empty input. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Euclidean distance between two points. */
function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Centroid of a VectorRect. */
function rectCentroid(rect: VectorRect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Check if point is strictly inside rect bounds. */
function pointInRect(p: Point, rect: VectorRect): boolean {
  return (
    p.x > rect.x &&
    p.x < rect.x + rect.width &&
    p.y > rect.y &&
    p.y < rect.y + rect.height
  );
}

// ---------------------------------------------------------------------------
// VEC-015.1 helpers: line grouping and grid spacing
// ---------------------------------------------------------------------------

/**
 * Group values into bands where consecutive values are within `tolerance`.
 * Returns the representative Y (or X) value of each band (mean of members).
 */
function groupByProximity(values: number[], tolerance: number): number[] {
  if (values.length === 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const bands: number[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastBand = bands[bands.length - 1];
    const bandMean = lastBand.reduce((sum, v) => sum + v, 0) / lastBand.length;
    if (Math.abs(current - bandMean) <= tolerance) {
      lastBand.push(current);
    } else {
      bands.push([current]);
    }
  }

  return bands.map((band) => band.reduce((sum, v) => sum + v, 0) / band.length);
}

/**
 * Compute consecutive spacings from a sorted array of band positions.
 * Returns empty array if fewer than 2 positions.
 */
function computeSpacings(sortedPositions: number[]): number[] {
  const spacings: number[] = [];
  for (let i = 1; i < sortedPositions.length; i++) {
    spacings.push(sortedPositions[i] - sortedPositions[i - 1]);
  }
  return spacings;
}

// ---------------------------------------------------------------------------
// VEC-015.2 helpers: fixture and diffuser detection
// ---------------------------------------------------------------------------

/** Near-corner check tolerance in drawing-space inches. */
const CORNER_TOLERANCE_IN = 2;

/**
 * Check if a line's endpoints are near two diagonal corners of a rect.
 * Returns true if (start near c1 AND end near c2) OR (start near c2 AND end near c1).
 */
function lineConnectsCorners(
  line: VectorLine,
  c1: Point,
  c2: Point,
  tolerance: number,
): boolean {
  const startNearC1 = dist(line.start, c1) <= tolerance;
  const startNearC2 = dist(line.start, c2) <= tolerance;
  const endNearC1 = dist(line.end, c1) <= tolerance;
  const endNearC2 = dist(line.end, c2) <= tolerance;

  return (startNearC1 && endNearC2) || (startNearC2 && endNearC1);
}

/**
 * Check if a candidate rect qualifies as a light fixture.
 *
 * Criteria:
 * 1. Real dimensions: aspect ratio <= 2:1 and area 4–16 sqft
 * 2. Has an X-pattern (two diagonal lines connecting opposite corners)
 *    within 2" drawing-space tolerance at endpoints
 */
function isLightFixture(
  rect: VectorRect,
  lines: VectorLine[],
  scaleFactor: number,
): boolean {
  const wReal = rect.width * scaleFactor;
  const hReal = rect.height * scaleFactor;

  // Aspect ratio check
  const longSide = Math.max(wReal, hReal);
  const shortSide = Math.min(wReal, hReal);
  if (shortSide <= 0) return false;
  if (longSide / shortSide > 2.0) return false;

  // Area check: 4–16 sqft real (convert sq inches → sqft)
  const areaSqft = (wReal * hReal) / 144;
  if (areaSqft < 4 || areaSqft > 16) return false;

  // X-pattern: two lines connecting the two diagonals
  const corner1: Point = { x: rect.x, y: rect.y };
  const corner2: Point = { x: rect.x + rect.width, y: rect.y + rect.height };
  const corner3: Point = { x: rect.x + rect.width, y: rect.y };
  const corner4: Point = { x: rect.x, y: rect.y + rect.height };

  let diag1Found = false;
  let diag2Found = false;

  for (const line of lines) {
    if (
      !diag1Found &&
      lineConnectsCorners(line, corner1, corner2, CORNER_TOLERANCE_IN)
    ) {
      diag1Found = true;
    }
    if (
      !diag2Found &&
      lineConnectsCorners(line, corner3, corner4, CORNER_TOLERANCE_IN)
    ) {
      diag2Found = true;
    }
    if (diag1Found && diag2Found) break;
  }

  return diag1Found && diag2Found;
}

/**
 * Check if a candidate outer rect qualifies as an HVAC diffuser.
 *
 * Criteria:
 * 1. Real dimensions: aspect ratio < 1.5:1 and area 0.5–4 sqft
 * 2. Has 2+ concentric inner VectorRect objects inside it with consistent
 *    inset margins (0.1"–0.5" drawing-space) within ±20% tolerance
 */
function isDiffuser(
  outerRect: VectorRect,
  allRects: VectorRect[],
  scaleFactor: number,
): boolean {
  const wReal = outerRect.width * scaleFactor;
  const hReal = outerRect.height * scaleFactor;

  // Aspect ratio check
  const longSide = Math.max(wReal, hReal);
  const shortSide = Math.min(wReal, hReal);
  if (shortSide <= 0) return false;
  if (longSide / shortSide >= 1.5) return false;

  // Area check: 0.5–4 sqft real
  const areaSqft = (wReal * hReal) / 144;
  if (areaSqft < 0.5 || areaSqft > 4) return false;

  // Concentric inner rects: centroid inside outer bounds and smaller than outer
  const MIN_INSET_IN = 0.1; // drawing-space inches
  const MAX_INSET_IN = 0.5;
  const INSET_TOLERANCE = 0.2; // ±20% tolerance

  const outerCentroid = rectCentroid(outerRect);

  // Collect inner rect candidates with their inset margins
  const innerRects: Array<{ rect: VectorRect; inset: number }> = [];

  for (const candidate of allRects) {
    if (candidate === outerRect) continue;

    // Centroid must be within outer rect bounds
    const candidateCentroid = rectCentroid(candidate);
    if (!pointInRect(candidateCentroid, outerRect)) continue;

    // Candidate must be strictly smaller than outer
    if (
      candidate.width >= outerRect.width ||
      candidate.height >= outerRect.height
    )
      continue;

    // Compute inset margin: how far each side of the candidate is inset from the outer
    const insetLeft = candidate.x - outerRect.x;
    const insetRight =
      outerRect.x + outerRect.width - (candidate.x + candidate.width);
    const insetTop = candidate.y - outerRect.y;
    const insetBottom =
      outerRect.y + outerRect.height - (candidate.y + candidate.height);

    // For concentric rects, all four insets should be similar (consistent margin)
    // Use mean of all four inset sides as the representative inset
    const meanInset = (insetLeft + insetRight + insetTop + insetBottom) / 4;

    if (meanInset < MIN_INSET_IN || meanInset > MAX_INSET_IN) continue;

    // Verify each inset side is within ±20% of mean (consistent margin)
    const maxDeviation = meanInset * INSET_TOLERANCE;
    const allConsistent =
      Math.abs(insetLeft - meanInset) <= maxDeviation &&
      Math.abs(insetRight - meanInset) <= maxDeviation &&
      Math.abs(insetTop - meanInset) <= maxDeviation &&
      Math.abs(insetBottom - meanInset) <= maxDeviation;

    if (!allConsistent) continue;

    // Centroid alignment: inner centroid should be near outer centroid
    // (concentric means same center)
    if (dist(candidateCentroid, outerCentroid) > MAX_INSET_IN) continue;

    innerRects.push({ rect: candidate, inset: meanInset });
  }

  // Need at least 2 concentric inner rects (1 inner rect is insufficient — skip)
  return innerRects.length >= 2;
}

// ---------------------------------------------------------------------------
// VEC-015: Main export
// ---------------------------------------------------------------------------

/**
 * Detect ceiling elements from an RCP VectorPage.
 *
 * VEC-015.1: Detects ceiling grid (2x2, 2x4, or none) by grouping
 *   horizontal and vertical lines into bands and measuring spacings.
 *
 * VEC-015.2: Detects light fixture symbols (rects with X-cross pattern)
 *   and HVAC diffuser symbols (rects with concentric inner rects).
 *
 * Returns immediately with zeroed CeilingResult if page.sheetType !== 'rcp'.
 */
export function detectCeilingElements(
  page: VectorPage,
  rooms: RoomPolygon[],
  scale: ScaleInfo,
): CeilingResult {
  // RCP sheet guard
  if (page.sheetType !== "rcp") {
    return {
      gridSize: "none",
      ceilingAreaPerRoom: {},
      fixtureCount: 0,
      diffuserCount: 0,
    };
  }

  const f = scale.factor;

  // ---------------------------------------------------------------------------
  // VEC-015.1: Ceiling grid detection
  // ---------------------------------------------------------------------------

  const BAND_TOLERANCE_IN = 0.1; // drawing-space inches
  const REAL_TOLERANCE_IN = 2; // ±2" real-world tolerance for grid classification

  // Separate lines into horizontal (|angle| < 5°) and vertical (|angle ± 90°| < 5°)
  const horizontalLines: VectorLine[] = [];
  const verticalLines: VectorLine[] = [];

  for (const line of page.lines) {
    const angleDeg = lineAngle(line);
    const absAngle = Math.abs(angleDeg);

    // Horizontal: angle within ±5° of 0°
    if (absAngle < 5) {
      horizontalLines.push(line);
      continue;
    }

    // Vertical: angle within ±5° of +90° or -90°
    const distFrom90 = Math.abs(absAngle - 90);
    if (distFrom90 < 5) {
      verticalLines.push(line);
    }
  }

  // Collect Y values for horizontal lines and group into bands
  const hYValues = horizontalLines.map((l) => (l.start.y + l.end.y) / 2);
  const hBands = groupByProximity(hYValues, BAND_TOLERANCE_IN);

  // Collect X values for vertical lines and group into bands
  const vXValues = verticalLines.map((l) => (l.start.x + l.end.x) / 2);
  const vBands = groupByProximity(vXValues, BAND_TOLERANCE_IN);

  let gridSize: "2x2" | "2x4" | "none" = "none";

  // Need at least 3 bands in each axis to determine a grid
  if (hBands.length >= 3 && vBands.length >= 3) {
    const ySpacings = computeSpacings(hBands);
    const xSpacings = computeSpacings(vBands);

    const medianY = median(ySpacings);
    const medianX = median(xSpacings);

    const medianYReal = medianY * f;
    const medianXReal = medianX * f;

    const near24Y = Math.abs(medianYReal - 24) <= REAL_TOLERANCE_IN;
    const near24X = Math.abs(medianXReal - 24) <= REAL_TOLERANCE_IN;
    const near48Y = Math.abs(medianYReal - 48) <= REAL_TOLERANCE_IN;
    const near48X = Math.abs(medianXReal - 48) <= REAL_TOLERANCE_IN;

    if (near24Y && near24X) {
      gridSize = "2x2";
    } else if (near24Y && near48X) {
      gridSize = "2x4";
    } else if (near24X && near48Y) {
      // Rotated 2x4 (24" in X direction, 48" in Y direction)
      gridSize = "2x4";
    }
  }

  // ---------------------------------------------------------------------------
  // Ceiling area per room (flat ceiling = floor area)
  // ---------------------------------------------------------------------------

  const ceilingAreaPerRoom: Record<string, number> = {};
  for (const room of rooms) {
    ceilingAreaPerRoom[room.id] = room.areaSqft;
  }

  // ---------------------------------------------------------------------------
  // VEC-015.2: Fixture and diffuser detection
  // ---------------------------------------------------------------------------

  let fixtureCount = 0;
  let diffuserCount = 0;

  const allRects = page.rects;

  for (const rect of allRects) {
    if (isLightFixture(rect, page.lines, f)) {
      fixtureCount++;
    }
  }

  for (const rect of allRects) {
    if (isDiffuser(rect, allRects, f)) {
      diffuserCount++;
    }
  }

  return {
    gridSize,
    ceilingAreaPerRoom,
    fixtureCount,
    diffuserCount,
  };
}
