/**
 * Confidence Scorer (VEC-006)
 *
 * Scores extracted construction elements (walls, doors, windows, rooms) using
 * a positive-points + penalty system, then applies threshold classification
 * to decide if an element needs human review.
 *
 * Also provides a page-level review flag generator for aggregate quality checks.
 */

import type {
  WallSegment,
  DoorElement,
  WindowElement,
  RoomPolygon,
  VectorPage,
  ScoringContext,
  Point,
} from "./types";

// ---------------------------------------------------------------------------
// VEC-006.1: ScoreResult and ExtendedScoringContext
// ---------------------------------------------------------------------------

export interface ScoreResult {
  score: number;
  factors: Record<string, number>;
  reviewFlags: string[];
  needsReview: boolean;
}

/**
 * Extended scoring context that augments the base ScoringContext with
 * geometry-match strength and optional boolean signals used for penalties.
 */
export type ExtendedScoringContext = ScoringContext & {
  geometryMatchStrength: "exact" | "partial" | "weak";
  conflictingRules?: boolean;
  ambiguousMatch?: boolean;
  hasNearbyText?: boolean;
  hasDimensionConfirmation?: boolean;
  hasSymbolMatch?: boolean;
};

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const GEOMETRY_SCORES: Record<"exact" | "partial" | "weak", number> = {
  exact: 50,
  partial: 35,
  weak: 15,
};

const PENALTY_CONFLICTING_RULES = 20;
const PENALTY_AMBIGUOUS_MATCH = 10;
const PENALTY_SCALE_MISSING = 15;
const PENALTY_LOW_DENSITY = 5;
const BONUS_TEXT_VALIDATION = 20;
const BONUS_DIMENSION_CONFIRMATION = 15;
const BONUS_SYMBOL_MATCH = 15;

const LOW_DENSITY_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// VEC-006.1: scoreElement
// ---------------------------------------------------------------------------

/**
 * Score a single extracted element using positive bonuses and penalties.
 *
 * @param element  - A WallSegment, DoorElement, WindowElement, or RoomPolygon
 * @param context  - Extended scoring context with geometry match strength
 * @returns ScoreResult with score [0–100], breakdown, flags, and review status
 */
export function scoreElement(
  element: WallSegment | DoorElement | WindowElement | RoomPolygon,
  context: ExtendedScoringContext,
): ScoreResult {
  const factors: Record<string, number> = {};
  const reviewFlags: string[] = [];

  // Seed review flags from element's own reviewFlags (if it has them)
  if ("reviewFlags" in element && Array.isArray(element.reviewFlags)) {
    reviewFlags.push(...element.reviewFlags);
  }

  // --- Positive scoring ---

  const geometryScore = GEOMETRY_SCORES[context.geometryMatchStrength];
  factors.geometryMatch = geometryScore;

  const textScore = context.hasNearbyText ? BONUS_TEXT_VALIDATION : 0;
  factors.textValidation = textScore;

  const dimScore = context.hasDimensionConfirmation
    ? BONUS_DIMENSION_CONFIRMATION
    : 0;
  factors.dimensionConfirmation = dimScore;

  const symbolScore = context.hasSymbolMatch ? BONUS_SYMBOL_MATCH : 0;
  factors.symbolMatch = symbolScore;

  let rawScore = geometryScore + textScore + dimScore + symbolScore;

  // --- Penalties ---

  if (context.conflictingRules) {
    factors.penaltyConflictingRules = -PENALTY_CONFLICTING_RULES;
    rawScore -= PENALTY_CONFLICTING_RULES;
    reviewFlags.push("conflicting_rules");
  }

  if (context.ambiguousMatch) {
    factors.penaltyAmbiguousMatch = -PENALTY_AMBIGUOUS_MATCH;
    rawScore -= PENALTY_AMBIGUOUS_MATCH;
  }

  const scaleMissing =
    context.scale === null || context.scale.requiresCalibration === true;
  if (scaleMissing) {
    factors.penaltyScaleMissing = -PENALTY_SCALE_MISSING;
    rawScore -= PENALTY_SCALE_MISSING;
    reviewFlags.push("scale_not_calibrated");
  }

  if (context.elementDensity < LOW_DENSITY_THRESHOLD) {
    factors.penaltyLowDensity = -PENALTY_LOW_DENSITY;
    rawScore -= PENALTY_LOW_DENSITY;
  }

  // --- Clamp to [0, 100] ---
  const score = Math.max(0, Math.min(100, rawScore));

  // --- VEC-006.2: Threshold classification ---
  const needsReview = score < 70;
  if (score < 40) {
    reviewFlags.push("low_confidence_warning");
  }

  return { score, factors, reviewFlags, needsReview };
}

// ---------------------------------------------------------------------------
// VEC-006.2: Polygon / geometry helpers for page-level flags
// ---------------------------------------------------------------------------

/** Bounding box of a polygon (list of points). */
function polygonBounds(polygon: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** Check if two room polygons overlap using axis-aligned bounding box intersection. */
function roomsOverlap(a: RoomPolygon, b: RoomPolygon): boolean {
  if (a.polygon.length === 0 || b.polygon.length === 0) return false;
  const ba = polygonBounds(a.polygon);
  const bb = polygonBounds(b.polygon);
  // AABB intersection: overlap if one does NOT completely miss the other
  const noOverlap =
    ba.maxX <= bb.minX ||
    bb.maxX <= ba.minX ||
    ba.maxY <= bb.minY ||
    bb.maxY <= ba.minY;
  return !noOverlap;
}

/** Check if a point lies inside an AABB-approximated polygon. */
function pointInsidePolygonBounds(pt: Point, polygon: Point[]): boolean {
  if (polygon.length === 0) return false;
  const { minX, minY, maxX, maxY } = polygonBounds(polygon);
  return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
}

// ---------------------------------------------------------------------------
// VEC-006.2: generateReviewFlags
// ---------------------------------------------------------------------------

/**
 * Generate page-level review flags by checking six aggregate quality conditions.
 *
 * @param page   - The VectorPage (used for scale info and text clusters)
 * @param walls  - All WallSegments extracted from this page
 * @param rooms  - All RoomPolygons extracted from this page
 * @returns Array of flag strings; empty array if page passes all checks
 */
export function generateReviewFlags(
  page: VectorPage,
  walls: WallSegment[],
  rooms: RoomPolygon[],
): string[] {
  const flags: string[] = [];

  // Flag 1: Scale uncertain
  if (page.scale === null || page.scale.confidence === "inferred") {
    flags.push("scale_uncertain");
  }

  // Flag 2: Overlapping room polygons (AABB approximation)
  let hasOverlap = false;
  outer: for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (roomsOverlap(rooms[i], rooms[j])) {
        hasOverlap = true;
        break outer;
      }
    }
  }
  if (hasOverlap) {
    flags.push("overlapping_room_polygons");
  }

  // Flag 3: Wall thickness inconsistent (variance > 4" across same sheet)
  if (walls.length >= 2) {
    const thicknesses = walls.map((w) => w.thickness).filter((t) => t > 0);
    if (thicknesses.length >= 2) {
      const minThickness = Math.min(...thicknesses);
      const maxThickness = Math.max(...thicknesses);
      if (maxThickness - minThickness > 4) {
        flags.push("wall_thickness_inconsistent");
      }
    }
  }

  // Flag 4: Arc not matched to wall endpoint — aggregate from element reviewFlags
  const allElementFlags: string[] = [];
  for (const wall of walls) {
    // WallSegment does not expose reviewFlags, but may in future; safe to skip
    void wall;
  }
  for (const room of rooms) {
    if (room.reviewFlags) allElementFlags.push(...room.reviewFlags);
  }
  // Also check page-level VectorPage arcs absence of match
  const hasArcNotMatched = allElementFlags.some(
    (f) => f === "arc_not_matched_to_wall_endpoint",
  );
  if (hasArcNotMatched) {
    flags.push("arc_not_matched_to_wall_endpoint");
  }

  // Flag 5: Text outside room boundaries — roomNames clusters not inside any room
  const roomNameClusters = page.textClusters.filter(
    (c) => c.clusterType === "roomNames",
  );
  if (rooms.length > 0 && roomNameClusters.length > 0) {
    const anyTextOutside = roomNameClusters.some((cluster) => {
      const isInsideAnyRoom = rooms.some((room) =>
        pointInsidePolygonBounds(cluster.centroid, room.polygon),
      );
      return !isInsideAnyRoom;
    });
    if (anyTextOutside) {
      flags.push("text_outside_room_boundaries");
    }
  }

  // Flag 6: Open polygon — any room polygon has 'open_polygon' in its reviewFlags
  const hasOpenPolygon = rooms.some(
    (r) => r.reviewFlags && r.reviewFlags.includes("open_polygon"),
  );
  if (hasOpenPolygon) {
    flags.push("open_polygon");
  }

  return flags;
}
