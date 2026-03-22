/**
 * Quantity Calculator (VEC-011)
 *
 * Computes construction quantities from extracted geometry:
 *   VEC-011.1: Core quantities — drywall, flooring, baseboard, ceiling
 *   VEC-011.2: TI-specific and demo quantities — paint, demo drywall, demo framing
 *
 * Coordinate convention:
 *   - WallSegment start/end are in drawing-space inches.
 *   - Multiplying by ScaleInfo.factor gives real-world inches.
 *   - All output quantities use feet or square feet.
 */

import type {
  RoomPolygon,
  WallSegment,
  DoorElement,
  WindowElement,
  ScaleInfo,
  QuantityResult,
} from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default ceiling height in feet when no section drawing is present. */
const DEFAULT_CEILING_HEIGHT_FT = 9.0;

/** Assumed door height in feet for drywall deduction. */
const DOOR_HEIGHT_FT = 7.0;

/** Assumed window height in feet for drywall deduction. */
const WINDOW_HEIGHT_FT = 4.0;

// ---------------------------------------------------------------------------
// Geometry helper
// ---------------------------------------------------------------------------

/**
 * Compute the real-world length of a wall segment in inches.
 *
 * @param start       - Wall start point in drawing-space inches
 * @param end         - Wall end point in drawing-space inches
 * @param scaleFactor - ScaleInfo.factor (drawing-space → real-world inches)
 * @returns Real-world length in inches
 */
function segmentLengthReal(
  start: { x: number; y: number },
  end: { x: number; y: number },
  scaleFactor: number,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy) * scaleFactor;
}

// ---------------------------------------------------------------------------
// VEC-011.1: Wall area helpers
// ---------------------------------------------------------------------------

/**
 * Compute the gross drywall area of a single wall in square feet.
 *
 * @param wall            - The wall segment
 * @param ceilingHeightFt - Ceiling height in feet
 * @param scaleFactor     - ScaleInfo.factor
 * @returns Gross area in SF (before opening deductions); already accounts for
 *          partition (×2 sides) vs structural (×1 side).
 */
function grossWallAreaSf(
  wall: WallSegment,
  ceilingHeightFt: number,
  scaleFactor: number,
): number {
  const wallLengthInches = segmentLengthReal(wall.start, wall.end, scaleFactor);
  const wallLengthFt = wallLengthInches / 12;
  const rawAreaSf = wallLengthFt * ceilingHeightFt;
  // Partition walls are finished on both sides; structural walls on one side only.
  const sides = wall.type === "partition" ? 2 : 1;
  return rawAreaSf * sides;
}

/**
 * Sum the drywall area deducted by door openings assigned to a specific wall.
 *
 * @param wallId  - The wall's id
 * @param doors   - All detected door elements
 * @returns Deduction in SF (based on door.width in real-world inches)
 */
function doorDeductionSf(wallId: string, doors: DoorElement[]): number {
  let deduction = 0;
  for (const door of doors) {
    if (door.wallId === wallId) {
      const doorWidthFt = door.width / 12;
      deduction += doorWidthFt * DOOR_HEIGHT_FT;
    }
  }
  return deduction;
}

/**
 * Sum the drywall area deducted by window openings assigned to a specific wall.
 *
 * @param wallId  - The wall's id
 * @param windows - All detected window elements
 * @returns Deduction in SF (based on window.width in real-world inches)
 */
function windowDeductionSf(wallId: string, windows: WindowElement[]): number {
  let deduction = 0;
  for (const win of windows) {
    if (win.wallId === wallId) {
      const winWidthFt = win.width / 12;
      deduction += winWidthFt * WINDOW_HEIGHT_FT;
    }
  }
  return deduction;
}

// ---------------------------------------------------------------------------
// VEC-011.2: Baseboard helper
// ---------------------------------------------------------------------------

/**
 * Compute total door width in feet for doors associated with a specific room.
 *
 * Door widths are stored in real-world inches; convert to feet.
 *
 * @param room  - The room polygon (has doorIds)
 * @param doors - All detected door elements
 * @returns Total door width in feet
 */
function roomDoorWidthFt(room: RoomPolygon, doors: DoorElement[]): number {
  const doorMap = new Map<string, DoorElement>();
  for (const door of doors) {
    doorMap.set(door.id, door);
  }

  let totalFt = 0;
  for (const doorId of room.doorIds) {
    const door = doorMap.get(doorId);
    if (door) {
      totalFt += door.width / 12;
    }
  }
  return totalFt;
}

// ---------------------------------------------------------------------------
// VEC-011: Main export — calculateQuantities
// ---------------------------------------------------------------------------

/**
 * Calculate construction quantities from extracted geometry.
 *
 * VEC-011.1 — Core quantities:
 *   - drywallSf: new partition walls × 2 sides, new structural × 1, minus openings
 *   - flooringSf: sum of room areas excluding mechanical/unclassified
 *   - baseboardLf: room perimeters minus door widths
 *   - ceilingSf: sum of all room areas (flat ceiling assumption)
 *
 * VEC-011.2 — TI-specific and demo quantities:
 *   - paintSf: all non-demolition walls (new + existing_to_remain), same formula
 *   - demoDrywallSf: demolition walls, partition × 2, structural × 1
 *   - demoFramingLf: real-world length of all demolition walls in feet
 *
 * @param rooms   - Detected room polygons (area/perimeter already in sqft/ft)
 * @param walls   - Detected wall segments (start/end in drawing-space inches)
 * @param doors   - Detected door elements (width in real-world inches)
 * @param windows - Detected window elements (width in real-world inches)
 * @param scale   - ScaleInfo for converting drawing-space to real-world dimensions
 * @returns QuantityResult with all computed quantities
 */
export function calculateQuantities(
  rooms: RoomPolygon[],
  walls: WallSegment[],
  doors: DoorElement[],
  windows: WindowElement[],
  scale: ScaleInfo,
): QuantityResult {
  const f = scale.factor;
  const ceilingHeightFt = DEFAULT_CEILING_HEIGHT_FT;

  // ---------------------------------------------------------------------------
  // VEC-011.1: Drywall SF (new construction only)
  // ---------------------------------------------------------------------------

  let drywallSf = 0;
  for (const wall of walls) {
    if (wall.constructionStatus !== "new") continue;
    // Compute single-side area, deduct openings, then multiply by number of sides.
    // This matches the formula: (wallLengthFt * ceilingHeightFt - doorDeductSingleSide - winDeductSingleSide) * sides
    const wallLengthInches = segmentLengthReal(wall.start, wall.end, f);
    const wallLengthFt = wallLengthInches / 12;
    const singleSideGross = wallLengthFt * ceilingHeightFt;
    const doorDeduct = doorDeductionSf(wall.id, doors);
    const winDeduct = windowDeductionSf(wall.id, windows);
    const singleSideNet = Math.max(0, singleSideGross - doorDeduct - winDeduct);
    const sides = wall.type === "partition" ? 2 : 1;
    drywallSf += singleSideNet * sides;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.1: Flooring SF (exclude mechanical and unclassified rooms)
  // ---------------------------------------------------------------------------

  let flooringSf = 0;
  for (const room of rooms) {
    if (
      room.classification === "unclassified" ||
      room.classification === "mechanical"
    ) {
      continue;
    }
    flooringSf += room.areaSqft;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.1: Baseboard LF (room perimeter minus door widths)
  // ---------------------------------------------------------------------------

  let baseboardLf = 0;
  for (const room of rooms) {
    const doorWidthFt = roomDoorWidthFt(room, doors);
    const roomBaseboard = Math.max(0, room.perimeterFt - doorWidthFt);
    baseboardLf += roomBaseboard;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.1: Ceiling SF (all rooms, flat ceiling assumption)
  // ---------------------------------------------------------------------------

  let ceilingSf = 0;
  for (const room of rooms) {
    ceilingSf += room.areaSqft;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.2: Paint SF (new + existing_to_remain walls, same wall area formula)
  // ---------------------------------------------------------------------------

  let paintSf = 0;
  for (const wall of walls) {
    if (wall.constructionStatus === "demolition") continue;
    const wallLengthInches = segmentLengthReal(wall.start, wall.end, f);
    const wallLengthFt = wallLengthInches / 12;
    const singleSideGross = wallLengthFt * ceilingHeightFt;
    const doorDeduct = doorDeductionSf(wall.id, doors);
    const winDeduct = windowDeductionSf(wall.id, windows);
    const singleSideNet = Math.max(0, singleSideGross - doorDeduct - winDeduct);
    const sides = wall.type === "partition" ? 2 : 1;
    paintSf += singleSideNet * sides;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.2: Demo Drywall SF (demolition walls, partition ×2, structural ×1)
  // ---------------------------------------------------------------------------

  let demoDrywallSf = 0;
  for (const wall of walls) {
    if (wall.constructionStatus !== "demolition") continue;
    const gross = grossWallAreaSf(wall, ceilingHeightFt, f);
    demoDrywallSf += gross;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.2: Demo Framing LF (real-world length of demolition walls in feet)
  // ---------------------------------------------------------------------------

  let demoFramingLf = 0;
  for (const wall of walls) {
    if (wall.constructionStatus !== "demolition") continue;
    const lengthInches = segmentLengthReal(wall.start, wall.end, f);
    demoFramingLf += lengthInches / 12;
  }

  // ---------------------------------------------------------------------------
  // VEC-011.2: Ceiling height — no section drawing → use default, mark assumed
  // ---------------------------------------------------------------------------
  // In a future enhancement, section drawings could provide actual ceiling heights.
  // For now, no room source from section is tracked — always use default.
  const ceilingHeightAssumed = true;

  return {
    drywallSf,
    flooringSf,
    baseboardLf,
    ceilingSf,
    paintSf,
    demoDrywallSf,
    demoFramingLf,
    ceilingHeightFt: DEFAULT_CEILING_HEIGHT_FT,
    ceilingHeightAssumed,
  };
}
