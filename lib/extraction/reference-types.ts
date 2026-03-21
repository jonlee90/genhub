/**
 * Types for cross-reference resolution between construction drawing sheets.
 *
 * Enables linking items across sheets: floor plan door marks → door schedule,
 * detail callouts → detail drawings, finish keys → finish schedules, etc.
 */

import type { Rect } from "./types";

// ---------------------------------------------------------------------------
// Reference types
// ---------------------------------------------------------------------------

export type ReferenceType =
  | "detail_callout"
  | "section_marker"
  | "elevation_marker"
  | "door_schedule_ref"
  | "window_schedule_ref"
  | "finish_schedule_ref"
  | "fixture_schedule_ref"
  | "equipment_schedule_ref"
  | "specification_ref"
  | "sheet_continuation"
  | "general_note_ref";

// ---------------------------------------------------------------------------
// Reference graph
// ---------------------------------------------------------------------------

export interface SheetNode {
  sheetNumber: string;
  pageIndex: number;
  extractedItemIds: string[];
}

export interface ReferenceEdge {
  id: string;
  fromSheet: string;
  toSheet: string;
  referenceType: ReferenceType;
  referenceText: string;
  sourceRegion: Rect | null;
  resolved: boolean;
  linkedItemIds: string[];
}

export interface ReferenceGraph {
  nodes: SheetNode[];
  edges: ReferenceEdge[];
}

// ---------------------------------------------------------------------------
// Extracted reference (found during per-page extraction)
// ---------------------------------------------------------------------------

export interface ExtractedReference {
  /** Reference type */
  type: ReferenceType;
  /** Raw text that triggered detection (e.g., "SEE DETAIL 3/A-4") */
  rawText: string;
  /** Source sheet number where this reference was found */
  fromSheet: string;
  /** Target sheet number this reference points to */
  toSheet: string | null;
  /** Detail/section/elevation number on the target sheet */
  targetNumber: string | null;
  /** Type mark (e.g., Door Type "A", Finish Key "1") */
  typeMark: string | null;
  /** Bounding box where the reference appears on the source page */
  sourceRegion: Rect | null;
  /** Confidence in the extraction */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ReferenceValidation {
  totalReferences: number;
  resolvedCount: number;
  unresolvedCount: number;
  unresolvedRefs: Array<{
    fromSheet: string;
    referenceText: string;
    type: ReferenceType;
    reason: string;
  }>;
  mismatches: Array<{
    description: string;
    fromSheet: string;
    toSheet: string;
    details: string;
  }>;
}
