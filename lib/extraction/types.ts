/**
 * Shared TypeScript interfaces for the Vector Extraction Engine.
 *
 * All coordinates in inches. 1 PDF point = 1/72 inch.
 *
 * Coordinate convention:
 * - All raw PDF coordinates (PDF points) are divided by 72 before storage.
 * - After normalization, all x/y/width/height values represent real-world inches
 *   in drawing space. To convert to real-world inches, multiply by ScaleInfo.factor.
 */

// ---------------------------------------------------------------------------
// VEC-001.1: Core geometry primitives
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VectorLine {
  start: Point;
  end: Point;
  strokeWidth: number;
  dashArray: number[] | null;
}

export interface VectorArc {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeWidth: number;
}

export interface VectorPath {
  points: Point[];
  isClosed: boolean;
  hasFill: boolean;
  fillColor: string | null;
  strokeWidth: number;
}

export interface VectorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  hasFill: boolean;
  strokeWidth: number;
}

export interface TextObject {
  content: string;
  position: Point;
  fontSize: number;
  bounds: Rect;
}

// ---------------------------------------------------------------------------
// VEC-001.2: VectorPage and classification types
// ---------------------------------------------------------------------------

export type TextClusterType =
  | "roomNames"
  | "dimensions"
  | "notes"
  | "titleBlock"
  | "sheetTitle";

export interface TextCluster {
  texts: TextObject[];
  centroid: Point;
  clusterType: TextClusterType;
}

export type PageClassification = "vector" | "raster" | "mixed";

/** Exactly 9 values. */
export type SheetType =
  | "floor_plan"
  | "rcp"
  | "elevation"
  | "section"
  | "detail"
  | "code"
  | "schedule"
  | "mep"
  | "unknown";

/** Exactly 6 confidence levels. */
export interface ScaleInfo {
  factor: number;
  confidence:
    | "metadata"
    | "explicit"
    | "scale_bar"
    | "calibrated"
    | "inferred"
    | "user_provided";
  requiresCalibration?: boolean;
}

export interface VectorPage {
  pageNumber: number;
  pageClassification: PageClassification;
  sheetType: SheetType;
  lines: VectorLine[];
  arcs: VectorArc[];
  paths: VectorPath[];
  rects: VectorRect[];
  texts: TextObject[];
  textClusters: TextCluster[];
  scale: ScaleInfo | null;
  hasLowDensity: boolean;
}

// ---------------------------------------------------------------------------
// VEC-001.2b: Enhanced sheet classification types
// ---------------------------------------------------------------------------

export type SheetDiscipline =
  | "architectural"
  | "structural"
  | "mechanical"
  | "electrical"
  | "plumbing"
  | "civil"
  | "fire_protection"
  | "general";

export type SheetContentType =
  | "cover"
  | "site_plan"
  | "floor_plan"
  | "demolition_plan"
  | "rcp"
  | "roof_plan"
  | "elevation"
  | "section"
  | "detail"
  | "door_schedule"
  | "window_schedule"
  | "finish_schedule"
  | "fixture_schedule"
  | "equipment_schedule"
  | "panel_schedule"
  | "plumbing_plan"
  | "mechanical_plan"
  | "electrical_plan"
  | "fire_protection_plan"
  | "structural_plan"
  | "code_compliance"
  | "ada_compliance"
  | "egress"
  | "unknown";

export type ExtractionEngine =
  | "vector"
  | "vector_ceiling"
  | "schedule_extractor"
  | "mep_engine"
  | "ai_vision"
  | "ai_vision_specialized"
  | "skip";

export interface ClassificationSignal {
  source:
    | "sheet_number"
    | "title_text"
    | "visual_content"
    | "text_density"
    | "table_detection";
  value: string;
  weight: number;
}

export interface SheetClassification {
  /** Original 9-value type for backward compat */
  sheetType: SheetType;
  /** Fine-grained discipline */
  discipline: SheetDiscipline;
  /** Fine-grained content type */
  contentType: SheetContentType;
  /** Sheet number as printed (e.g., "A-2", "M-1", "T-3") */
  sheetNumber: string | null;
  /** Confidence 0.0-1.0 */
  confidence: number;
  /** Which signals contributed to classification */
  signals: ClassificationSignal[];
  /** Recommended extraction engine */
  extractionEngine: ExtractionEngine;
  /** Whether this sheet should be extracted at all */
  hasQuantities: boolean;
}

// ---------------------------------------------------------------------------
// VEC-001.3: Extracted element result types
// ---------------------------------------------------------------------------

export type ConstructionStatus = "new" | "existing_to_remain" | "demolition";

export type WallType = "structural" | "partition";

export interface WallSegment {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  type: WallType;
  constructionStatus: ConstructionStatus;
  isCurved: boolean;
  confidenceScore: number;
  needsReview: boolean;
}

export type DoorType =
  | "DOOR"
  | "POCKET_DOOR"
  | "SLIDING_DOOR"
  | "BIFOLD_DOOR"
  | "OVERHEAD_DOOR"
  | "DOUBLE_DOOR";

export interface DoorElement {
  id: string;
  position: Point;
  width: number;
  doorType: DoorType;
  wallId: string | null;
  confidenceScore: number;
  needsReview: boolean;
  reviewFlags: string[];
}

export interface WindowElement {
  id: string;
  position: Point;
  width: number;
  windowType: "WINDOW" | "CURTAIN_WALL";
  wallId: string | null;
  scheduleRef: string | null;
  mullionCount?: number;
  confidenceScore: number;
  needsReview: boolean;
}

export interface RoomPolygon {
  id: string;
  name: string;
  classification: string;
  polygon: Point[];
  areaSqft: number;
  perimeterFt: number;
  wallIds: string[];
  doorIds: string[];
  windowIds: string[];
  confidenceScore: number;
  needsReview: boolean;
  reviewFlags: string[];
}

// ---------------------------------------------------------------------------
// VEC-001.4: ExtractionResult and QuantityResult schemas
// ---------------------------------------------------------------------------

export interface QuantityResult {
  drywallSf: number;
  flooringSf: number;
  baseboardLf: number;
  ceilingSf: number;
  paintSf: number;
  demoDrywallSf: number;
  demoFramingLf: number;
  ceilingHeightFt: number;
  ceilingHeightAssumed: boolean;
}

export interface ClassificationResult {
  walls: WallSegment[];
  doors: DoorElement[];
  windows: WindowElement[];
  rooms: RoomPolygon[];
  reviewFlags: string[];
}

export interface ScoringContext {
  scale: ScaleInfo | null;
  nearbyTexts: TextObject[];
  adjacentWalls: WallSegment[];
  elementDensity: number;
}

export interface ExtractionMeta {
  /** Semantic version of the vector engine (e.g. "vector-engine-v1"). */
  engineVersion: string;
  /** Model identifier — set to "vector-engine-v1" for the rule-based engine; set to the OpenAI model name for AI fallback. */
  model: string;
  pagesProcessed: number;
  processingTimeMs: number;
  /** Monetary cost in USD. Set to 0 for the rule-based vector engine. */
  cost: number;
  reviewFlagCount: number;
}

export interface ExtractionResult {
  projectSummary: {
    totalAreaSqft: number;
    totalRooms: number;
    totalWallLf: number;
    totalDoors: number;
    totalWindows: number;
  };
  rooms: RoomPolygon[];
  walls: WallSegment[];
  doors: DoorElement[];
  windows: WindowElement[];
  quantities: QuantityResult;
  finishes: Record<string, unknown>;
  mep: Record<string, unknown>;
  extractionMeta: ExtractionMeta;
}
