/**
 * L8 Validation Layer: Micro-Confirmation Logic
 *
 * Generates 3-5 targeted yes/no prompts for uncertain detections.
 * Task: EST-P1-007 Micro-Confirmation Cards
 *
 * @module lib/extraction/validation/micro-confirmation
 */

// ============================================
// Types
// ============================================

export type MicroConfirmationType =
  | "scale_confirm"
  | "ceiling_height"
  | "door_count"
  | "room_count"
  | "wall_type_confirm"
  | "schedule_match"
  | "element_verify";

export interface MicroConfirmation {
  id: string;
  confirmationType: MicroConfirmationType;
  questionText: string;
  responseOptions: ResponseOption[];
  contextData: ConfirmationContext;
  priority: number; // 1-5, higher = more important
  confidenceBoost: number; // Points added when answered
}

export interface ResponseOption {
  label: string;
  value: string;
  isDefault: boolean;
}

export interface ConfirmationContext {
  pageNumber: number;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  relatedElementIds?: string[];
  currentValue?: unknown;
}

interface ExtractionResult {
  projectSummary: {
    totalRooms: number;
    totalDoors: number;
    totalWallsLf: number;
  };
  scale?: {
    scaleString: string | null;
    confidence: number;
  } | null;
  rooms?: Array<{
    id: string;
    name: string;
    ceilingHeightFt: number | null;
    confidenceScore: number;
  }>;
  doors?: Array<{
    id: string;
    confidenceScore: number;
  }>;
  walls?: Array<{
    id: string;
    wallType: "partition" | "structural";
    confidenceScore: number;
  }>;
}

// ============================================
// Confidence Boost Mapping (per card type)
// ============================================

const CONFIDENCE_BOOST_MAP: Record<MicroConfirmationType, number> = {
  scale_confirm: 15, // Highest impact - affects all measurements
  ceiling_height: 10,
  door_count: 10,
  room_count: 10,
  wall_type_confirm: 10,
  schedule_match: 10,
  element_verify: 10,
};

// ============================================
// Main Generator Function
// ============================================

/**
 * Generate micro-confirmation cards for uncertain detections.
 *
 * @param extractionResult - Full extraction result with confidence scores
 * @param pageNumber - Current page number for context
 * @returns Array of micro-confirmation cards (max 5)
 *
 * @example
 * const confirmations = generateMicroConfirmations(result, 1);
 * // Returns 3-5 targeted cards sorted by priority
 */
export function generateMicroConfirmations(
  extractionResult: ExtractionResult,
  pageNumber: number,
): MicroConfirmation[] {
  const confirmations: MicroConfirmation[] = [];

  // 1. Scale confirmation (highest priority if uncertain)
  if (shouldConfirmScale(extractionResult.scale)) {
    confirmations.push(
      createScaleConfirmation(extractionResult.scale, pageNumber),
    );
  }

  // 2. Ceiling height confirmation (if no ceiling heights detected)
  if (shouldConfirmCeilingHeight(extractionResult.rooms)) {
    confirmations.push(
      createCeilingHeightConfirmation(extractionResult.rooms, pageNumber),
    );
  }

  // 3. Door count confirmation (if high variance)
  if (
    shouldConfirmDoorCount(
      extractionResult.doors,
      extractionResult.projectSummary.totalDoors,
    )
  ) {
    confirmations.push(
      createDoorCountConfirmation(
        extractionResult.projectSummary.totalDoors,
        pageNumber,
      ),
    );
  }

  // 4. Room count confirmation (if low confidence rooms)
  if (
    shouldConfirmRoomCount(
      extractionResult.rooms,
      extractionResult.projectSummary.totalRooms,
    )
  ) {
    confirmations.push(
      createRoomCountConfirmation(
        extractionResult.projectSummary.totalRooms,
        pageNumber,
      ),
    );
  }

  // 5. Wall type confirmation (if mixed structural/partition)
  if (shouldConfirmWallType(extractionResult.walls)) {
    confirmations.push(
      createWallTypeConfirmation(extractionResult.walls, pageNumber),
    );
  }

  // Sort by priority (highest first) and limit to 5
  return confirmations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ============================================
// Condition Checkers
// ============================================

function shouldConfirmScale(scale: ExtractionResult["scale"]): boolean {
  // Trigger if scale confidence < 80 or scale is null
  if (!scale) return true;
  return scale.confidence < 80;
}

function shouldConfirmCeilingHeight(rooms: ExtractionResult["rooms"]): boolean {
  // Trigger if no rooms have ceiling heights
  if (!rooms || rooms.length === 0) return false;
  const roomsWithCeiling = rooms.filter((r) => r.ceilingHeightFt !== null);
  return roomsWithCeiling.length === 0 && rooms.length > 0;
}

function shouldConfirmDoorCount(
  doors: ExtractionResult["doors"],
  totalDoors: number,
): boolean {
  // Trigger if >30% of doors have low confidence (<70)
  if (!doors || doors.length === 0) return false;
  const lowConfidenceDoors = doors.filter((d) => d.confidenceScore < 70);
  return lowConfidenceDoors.length / doors.length > 0.3;
}

function shouldConfirmRoomCount(
  rooms: ExtractionResult["rooms"],
  totalRooms: number,
): boolean {
  // Trigger if >20% of rooms have low confidence (<70)
  if (!rooms || rooms.length === 0) return false;
  const lowConfidenceRooms = rooms.filter((r) => r.confidenceScore < 70);
  return lowConfidenceRooms.length / rooms.length > 0.2;
}

function shouldConfirmWallType(walls: ExtractionResult["walls"]): boolean {
  // Trigger if we have both partition and structural walls with low confidence
  if (!walls || walls.length === 0) return false;
  const partitions = walls.filter(
    (w) => w.wallType === "partition" && w.confidenceScore < 75,
  );
  const structural = walls.filter(
    (w) => w.wallType === "structural" && w.confidenceScore < 75,
  );
  return partitions.length > 0 && structural.length > 0;
}

// ============================================
// Card Creators
// ============================================

function createScaleConfirmation(
  scale: ExtractionResult["scale"],
  pageNumber: number,
): MicroConfirmation {
  const scaleString = scale?.scaleString || "unknown";

  return {
    id: `scale_${pageNumber}`,
    confirmationType: "scale_confirm",
    questionText: `Is the drawing scale ${scaleString}?`,
    responseOptions: [
      { label: "Yes", value: "yes", isDefault: true },
      { label: "No", value: "no", isDefault: false },
    ],
    contextData: {
      pageNumber,
      currentValue: scaleString,
    },
    priority: 5, // Highest priority
    confidenceBoost: CONFIDENCE_BOOST_MAP.scale_confirm,
  };
}

function createCeilingHeightConfirmation(
  rooms: ExtractionResult["rooms"],
  pageNumber: number,
): MicroConfirmation {
  return {
    id: `ceiling_${pageNumber}`,
    confirmationType: "ceiling_height",
    questionText: "What is the ceiling height for this floor?",
    responseOptions: [
      { label: "9 ft", value: "9", isDefault: true },
      { label: "10 ft", value: "10", isDefault: false },
      { label: "12 ft", value: "12", isDefault: false },
    ],
    contextData: {
      pageNumber,
      relatedElementIds: rooms?.map((r) => r.id) || [],
    },
    priority: 4,
    confidenceBoost: CONFIDENCE_BOOST_MAP.ceiling_height,
  };
}

function createDoorCountConfirmation(
  totalDoors: number,
  pageNumber: number,
): MicroConfirmation {
  return {
    id: `doors_${pageNumber}`,
    confirmationType: "door_count",
    questionText: `We detected ${totalDoors} doors. Does this look correct?`,
    responseOptions: [
      { label: "Yes", value: "yes", isDefault: true },
      { label: "No, more", value: "more", isDefault: false },
      { label: "No, less", value: "less", isDefault: false },
    ],
    contextData: {
      pageNumber,
      currentValue: totalDoors,
    },
    priority: 3,
    confidenceBoost: CONFIDENCE_BOOST_MAP.door_count,
  };
}

function createRoomCountConfirmation(
  totalRooms: number,
  pageNumber: number,
): MicroConfirmation {
  return {
    id: `rooms_${pageNumber}`,
    confirmationType: "room_count",
    questionText: `We detected ${totalRooms} rooms. Does this look correct?`,
    responseOptions: [
      { label: "Yes", value: "yes", isDefault: true },
      { label: "No, more", value: "more", isDefault: false },
      { label: "No, less", value: "less", isDefault: false },
    ],
    contextData: {
      pageNumber,
      currentValue: totalRooms,
    },
    priority: 3,
    confidenceBoost: CONFIDENCE_BOOST_MAP.room_count,
  };
}

function createWallTypeConfirmation(
  walls: ExtractionResult["walls"],
  pageNumber: number,
): MicroConfirmation {
  return {
    id: `walls_${pageNumber}`,
    confirmationType: "wall_type_confirm",
    questionText:
      "Are there both partition and structural walls on this floor?",
    responseOptions: [
      { label: "Yes", value: "yes", isDefault: true },
      { label: "Only partition", value: "partition", isDefault: false },
      { label: "Only structural", value: "structural", isDefault: false },
    ],
    contextData: {
      pageNumber,
      relatedElementIds: walls?.map((w) => w.id) || [],
    },
    priority: 2,
    confidenceBoost: CONFIDENCE_BOOST_MAP.wall_type_confirm,
  };
}

// ============================================
// Confidence Boost Calculation
// ============================================

/**
 * Calculate confidence boost for a confirmed answer.
 *
 * @param confirmationType - Type of confirmation card
 * @param userResponse - User's response value
 * @returns Confidence boost in points (0-15)
 *
 * @example
 * const boost = calculateConfidenceBoost('scale_confirm', 'yes'); // Returns 15
 */
export function calculateConfidenceBoost(
  confirmationType: MicroConfirmationType,
  userResponse: string,
): number {
  // Full boost for positive confirmations
  if (userResponse === "yes") {
    return CONFIDENCE_BOOST_MAP[confirmationType];
  }

  // Partial boost for alternative answers (still provides info)
  if (
    ["no", "more", "less", "partition", "structural"].includes(userResponse)
  ) {
    return Math.floor(CONFIDENCE_BOOST_MAP[confirmationType] * 0.5);
  }

  // Skip = 0 boost
  return 0;
}

/**
 * Apply confidence boost to related elements.
 *
 * @param confirmationType - Type of confirmation
 * @param boost - Confidence boost amount
 * @param relatedElementIds - IDs of elements to boost
 * @returns Updated element IDs with boost applied
 *
 * This would be used by the extraction pipeline to update
 * confidence scores in takeoff_items table.
 */
export function applyConfidenceBoost(
  confirmationType: MicroConfirmationType,
  boost: number,
  relatedElementIds: string[],
): { elementIds: string[]; boost: number } {
  return {
    elementIds: relatedElementIds,
    boost,
  };
}
