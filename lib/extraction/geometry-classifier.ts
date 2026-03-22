/**
 * Geometry Classifier (VEC-010)
 *
 * Orchestrates the full geometry classification pipeline for a single VectorPage:
 *   VEC-010.1: Pipeline — walls → doors → windows → rooms → scoring → flags
 *   VEC-010.2: Sheet type routing — skip non-floor-plan sheet types early
 *
 * Coordinate convention:
 *   - All coordinates remain in drawing-space inches throughout.
 *   - ScaleInfo.factor converts drawing-space to real-world inches.
 */

import type {
  VectorPage,
  ScaleInfo,
  ClassificationResult,
  WallSegment,
  DoorElement,
  WindowElement,
  RoomPolygon,
} from "./types";
import { detectWalls } from "./rules/wall-rules";
import { detectDoors } from "./rules/door-rules";
import { detectWindows } from "./rules/window-rules";
import { detectRooms } from "./rules/room-rules";
import { scoreElement, generateReviewFlags } from "./confidence-scorer";
import type { ExtendedScoringContext } from "./confidence-scorer";

// ---------------------------------------------------------------------------
// VEC-010.2: Helper — empty ClassificationResult
// ---------------------------------------------------------------------------

function emptyResult(flags: string[]): ClassificationResult {
  return { walls: [], doors: [], windows: [], rooms: [], reviewFlags: flags };
}

// ---------------------------------------------------------------------------
// VEC-010.1: Score all walls
// ---------------------------------------------------------------------------

function scoreWalls(
  walls: WallSegment[],
  page: VectorPage,
  scale: ScaleInfo,
): void {
  for (const wall of walls) {
    const context: ExtendedScoringContext = {
      scale,
      nearbyTexts: page.texts,
      adjacentWalls: walls,
      elementDensity: walls.length,
      geometryMatchStrength: "exact",
      conflictingRules: false,
      ambiguousMatch: false,
    };
    const result = scoreElement(wall, context);
    wall.confidenceScore = result.score;
    wall.needsReview = result.needsReview;
  }
}

// ---------------------------------------------------------------------------
// VEC-010.1: Score all doors
// ---------------------------------------------------------------------------

function scoreDoors(
  doors: DoorElement[],
  walls: WallSegment[],
  page: VectorPage,
  scale: ScaleInfo,
): void {
  for (const door of doors) {
    const context: ExtendedScoringContext = {
      scale,
      nearbyTexts: page.texts,
      adjacentWalls: walls,
      elementDensity: doors.length,
      geometryMatchStrength: "exact",
      conflictingRules: false,
      ambiguousMatch: false,
    };
    const result = scoreElement(door, context);
    door.confidenceScore = result.score;
    door.needsReview = result.needsReview;
    // Merge any new review flags from scoring into the door's existing flags
    for (const flag of result.reviewFlags) {
      if (!door.reviewFlags.includes(flag)) {
        door.reviewFlags.push(flag);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// VEC-010.1: Score all windows
// ---------------------------------------------------------------------------

function scoreWindows(
  windows: WindowElement[],
  walls: WallSegment[],
  page: VectorPage,
  scale: ScaleInfo,
): void {
  for (const win of windows) {
    const context: ExtendedScoringContext = {
      scale,
      nearbyTexts: page.texts,
      adjacentWalls: walls,
      elementDensity: windows.length,
      geometryMatchStrength: "exact",
      conflictingRules: false,
      ambiguousMatch: false,
    };
    const result = scoreElement(win, context);
    win.confidenceScore = result.score;
    win.needsReview = result.needsReview;
  }
}

// ---------------------------------------------------------------------------
// VEC-010.1: Score all rooms
// ---------------------------------------------------------------------------

function scoreRooms(
  rooms: RoomPolygon[],
  walls: WallSegment[],
  page: VectorPage,
  scale: ScaleInfo,
): void {
  for (const room of rooms) {
    const context: ExtendedScoringContext = {
      scale,
      nearbyTexts: page.texts,
      adjacentWalls: walls,
      elementDensity: rooms.length,
      geometryMatchStrength: "exact",
      conflictingRules: false,
      ambiguousMatch: false,
    };
    const result = scoreElement(room, context);
    room.confidenceScore = result.score;
    room.needsReview = result.needsReview;
    // Merge scoring flags into the room's existing flags
    for (const flag of result.reviewFlags) {
      if (!room.reviewFlags.includes(flag)) {
        room.reviewFlags.push(flag);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// VEC-010.1: Aggregate review flags from all elements
// ---------------------------------------------------------------------------

function collectElementFlags(
  walls: WallSegment[],
  doors: DoorElement[],
  windows: WindowElement[],
  rooms: RoomPolygon[],
): string[] {
  const flags: string[] = [];

  // WallSegment does not carry reviewFlags (no such field in the interface)
  // so we check needsReview as an indicator only
  void walls;

  for (const door of doors) {
    for (const flag of door.reviewFlags) {
      if (!flags.includes(flag)) {
        flags.push(flag);
      }
    }
  }

  // WindowElement does not carry reviewFlags (no such field in the interface)
  void windows;

  for (const room of rooms) {
    for (const flag of room.reviewFlags) {
      if (!flags.includes(flag)) {
        flags.push(flag);
      }
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// VEC-010.1: Main export — classifyGeometry
// ---------------------------------------------------------------------------

/**
 * Classify all geometry on a single VectorPage.
 *
 * Pipeline:
 *   1. Sheet type routing (VEC-010.2) — skip non-relevant sheet types
 *   2. detectWalls → walls
 *   3. detectDoors → doors
 *   4. detectWindows → windows
 *   5. detectRooms → rooms
 *   6. Score all elements via scoreElement()
 *   7. generateReviewFlags() for page-level flags
 *   8. Combine page-level + element-level flags
 *
 * @param page  - The VectorPage to classify (geometry pre-filtered by vector-parser)
 * @param scale - Scale info for the page; must be non-null when calling this function
 * @returns ClassificationResult with walls, doors, windows, rooms, and aggregated reviewFlags
 */
export async function classifyGeometry(
  page: VectorPage,
  scale: ScaleInfo,
): Promise<ClassificationResult> {
  // VEC-010.2: Sheet type routing
  switch (page.sheetType) {
    case "detail":
    case "code":
      console.log(
        "[geometry-classifier] Skipping sheet type:",
        page.sheetType,
        "page:",
        page.pageNumber,
      );
      return emptyResult(["sheet_skipped_detail_or_code"]);

    case "mep":
      console.log(
        "[geometry-classifier] Skipping sheet type:",
        page.sheetType,
        "page:",
        page.pageNumber,
      );
      return emptyResult(["sheet_skipped_mep"]);

    case "schedule":
      console.log(
        "[geometry-classifier] Skipping sheet type:",
        page.sheetType,
        "page:",
        page.pageNumber,
      );
      return emptyResult(["sheet_skipped_schedule"]);

    case "rcp":
      console.log(
        "[geometry-classifier] Skipping sheet type:",
        page.sheetType,
        "page:",
        page.pageNumber,
      );
      return emptyResult(["rcp_processing_pending"]);

    case "floor_plan":
    case "elevation":
    case "section":
    case "unknown":
      // Run full pipeline below
      break;
  }

  // VEC-010.1: Full classification pipeline

  // Step 1: Detect walls
  const walls = detectWalls(page, scale);

  // Step 2: Detect doors (requires walls for gap analysis)
  const doors = detectDoors(page, walls, scale);

  // Step 3: Detect windows (requires walls for proximity checks)
  const windows = detectWindows(page, walls, scale);

  // Step 4: Detect rooms (requires walls, doors, windows for association)
  const rooms = detectRooms(page, walls, doors, windows, scale);

  // Step 5: Score all elements
  scoreWalls(walls, page, scale);
  scoreDoors(doors, walls, page, scale);
  scoreWindows(windows, walls, page, scale);
  scoreRooms(rooms, walls, page, scale);

  // Step 6: Generate page-level review flags
  const pageLevelFlags = generateReviewFlags(page, walls, rooms);

  // Step 7: Collect element-level flags and merge with page-level flags
  const elementFlags = collectElementFlags(walls, doors, windows, rooms);

  const allFlags: string[] = [...pageLevelFlags];
  for (const flag of elementFlags) {
    if (!allFlags.includes(flag)) {
      allFlags.push(flag);
    }
  }

  return {
    walls,
    doors,
    windows,
    rooms,
    reviewFlags: allFlags,
  };
}
