/**
 * Cross-Reference Resolver
 *
 * Links information across multiple sheets in a construction plan set.
 * Resolves detail callouts, section markers, schedule references, and
 * specification links found during per-page extraction.
 *
 * Pipeline:
 * 1. COLLECT — each extraction engine emits references it finds
 * 2. INDEX — build sheet-to-page mapping after all pages extracted
 * 3. RESOLVE — link references to their targets
 * 4. VALIDATE — check completeness and flag mismatches
 */

import type { TextObject, VectorPage } from "./types";
import type {
  ExtractedReference,
  ReferenceEdge,
  ReferenceGraph,
  ReferenceValidation,
  SheetNode,
} from "./reference-types";

// ---------------------------------------------------------------------------
// Phase 1: COLLECT — Extract references from page text
// ---------------------------------------------------------------------------

/** Regex patterns for detecting cross-references in text content */
const PATTERNS = {
  // "SEE DETAIL 3 @ A-4" or "DETAIL 3/A-4" or "SEE DETAIL #3 ON SHEET A-4"
  detail:
    /(?:SEE\s+)?DETAIL\s*#?\s*(\d+)\s*(?:@|ON|\/|,?\s*(?:SHEET\s*)?)\s*([A-Z]-?\d+(?:\.\d+)?)/gi,

  // "SEE SECTION 2/A-3" or "SECTION 2 @ A-3"
  section:
    /(?:SEE\s+)?SECTION\s*#?\s*(\d+)\s*(?:@|ON|\/|,?\s*(?:SHEET\s*)?)\s*([A-Z]-?\d+(?:\.\d+)?)/gi,

  // "SEE ELEVATION 1/A-3.1"
  elevation:
    /(?:SEE\s+)?ELEV(?:ATION)?\s*#?\s*(\d+)\s*(?:@|ON|\/|,?\s*(?:SHEET\s*)?)\s*([A-Z]-?\d+(?:\.\d+)?)/gi,

  // "SEE SHEET A-4" or "REFER TO SHEET M-1" or "CONTINUE ON M-2"
  sheet:
    /(?:SEE|REFER\s+TO|CONTINUE\s+ON)\s+(?:SHEET\s+)?([A-Z]-?\d+(?:\.\d+)?)/gi,

  // "PER SPEC SECTION 09 29 00" or "SEE SPECIFICATION 06200"
  spec: /(?:PER|SEE)\s+(?:SPEC(?:IFICATION)?\.?\s+)?(?:SECTION\s+)?(\d{2}\s*\d{2}\s*\d{2})/gi,

  // "WALL TYPE A" or "DOOR TYPE 1" or "FINISH TYPE B"
  doorType: /DOOR\s+(?:TYPE|TYP\.?)\s*#?\s*([A-Z0-9]+)/gi,
  windowType: /WINDOW\s+(?:TYPE|TYP\.?)\s*#?\s*([A-Z0-9]+)/gi,
  wallType: /(?:WALL|PARTITION)\s+(?:TYPE|TYP\.?)\s*#?\s*([A-Z0-9]+)/gi,
  finishType: /FINISH\s+(?:TYPE|KEY|TYP\.?)\s*#?\s*([A-Z0-9]+)/gi,
};

/**
 * Extract all cross-references from a page's text content.
 */
export function extractReferences(
  texts: TextObject[],
  fromSheet: string,
): ExtractedReference[] {
  const refs: ExtractedReference[] = [];
  const allText = texts.map((t) => t.content).join(" ");

  // Detail callouts
  for (const match of allText.matchAll(PATTERNS.detail)) {
    refs.push({
      type: "detail_callout",
      rawText: match[0],
      fromSheet,
      toSheet: normalizeSheetNumber(match[2]),
      targetNumber: match[1],
      typeMark: null,
      sourceRegion: null,
      confidence: 0.9,
    });
  }

  // Section markers
  for (const match of allText.matchAll(PATTERNS.section)) {
    refs.push({
      type: "section_marker",
      rawText: match[0],
      fromSheet,
      toSheet: normalizeSheetNumber(match[2]),
      targetNumber: match[1],
      typeMark: null,
      sourceRegion: null,
      confidence: 0.9,
    });
  }

  // Elevation markers
  for (const match of allText.matchAll(PATTERNS.elevation)) {
    refs.push({
      type: "elevation_marker",
      rawText: match[0],
      fromSheet,
      toSheet: normalizeSheetNumber(match[2]),
      targetNumber: match[1],
      typeMark: null,
      sourceRegion: null,
      confidence: 0.9,
    });
  }

  // Sheet references
  for (const match of allText.matchAll(PATTERNS.sheet)) {
    refs.push({
      type: "sheet_continuation",
      rawText: match[0],
      fromSheet,
      toSheet: normalizeSheetNumber(match[1]),
      targetNumber: null,
      typeMark: null,
      sourceRegion: null,
      confidence: 0.8,
    });
  }

  // Specification references
  for (const match of allText.matchAll(PATTERNS.spec)) {
    refs.push({
      type: "specification_ref",
      rawText: match[0],
      fromSheet,
      toSheet: null,
      targetNumber: match[1].replace(/\s/g, " "),
      typeMark: null,
      sourceRegion: null,
      confidence: 0.85,
    });
  }

  // Door type references
  for (const match of allText.matchAll(PATTERNS.doorType)) {
    refs.push({
      type: "door_schedule_ref",
      rawText: match[0],
      fromSheet,
      toSheet: null, // Resolved in Phase 3
      targetNumber: null,
      typeMark: match[1],
      sourceRegion: null,
      confidence: 0.85,
    });
  }

  // Window type references
  for (const match of allText.matchAll(PATTERNS.windowType)) {
    refs.push({
      type: "window_schedule_ref",
      rawText: match[0],
      fromSheet,
      toSheet: null,
      targetNumber: null,
      typeMark: match[1],
      sourceRegion: null,
      confidence: 0.85,
    });
  }

  return refs;
}

// ---------------------------------------------------------------------------
// Phase 2: INDEX — Build sheet-to-page mapping
// ---------------------------------------------------------------------------

/**
 * Build a reference graph from collected references across all pages.
 */
export function buildReferenceGraph(
  sheetPages: Array<{
    sheetNumber: string;
    pageIndex: number;
    itemIds: string[];
  }>,
  allReferences: ExtractedReference[],
): ReferenceGraph {
  // Build nodes
  const nodes: SheetNode[] = sheetPages.map((sp) => ({
    sheetNumber: sp.sheetNumber,
    pageIndex: sp.pageIndex,
    extractedItemIds: sp.itemIds,
  }));

  // Build sheet index for fast lookup
  const sheetIndex = new Map<string, SheetNode>();
  for (const node of nodes) {
    sheetIndex.set(node.sheetNumber, node);
  }

  // Build edges
  const edges: ReferenceEdge[] = allReferences.map((ref, i) => {
    const resolved = ref.toSheet ? sheetIndex.has(ref.toSheet) : false;

    return {
      id: `ref-${i}`,
      fromSheet: ref.fromSheet,
      toSheet: ref.toSheet ?? "unknown",
      referenceType: ref.type,
      referenceText: ref.rawText,
      sourceRegion: ref.sourceRegion,
      resolved,
      linkedItemIds: [],
    };
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Phase 3: RESOLVE — Link references to targets
// ---------------------------------------------------------------------------

/**
 * Resolve schedule references by finding which sheets contain the schedules.
 * Updates the reference graph edges in place.
 */
export function resolveScheduleReferences(
  graph: ReferenceGraph,
  scheduleSheets: Map<string, string>, // scheduleType → sheetNumber (e.g., "door" → "A-2")
): void {
  for (const edge of graph.edges) {
    if (edge.resolved) continue;

    // Resolve door/window/finish/fixture schedule references
    if (edge.referenceType === "door_schedule_ref") {
      const scheduleSheet = scheduleSheets.get("door");
      if (scheduleSheet) {
        edge.toSheet = scheduleSheet;
        edge.resolved = true;
      }
    } else if (edge.referenceType === "window_schedule_ref") {
      const scheduleSheet = scheduleSheets.get("window");
      if (scheduleSheet) {
        edge.toSheet = scheduleSheet;
        edge.resolved = true;
      }
    } else if (edge.referenceType === "finish_schedule_ref") {
      const scheduleSheet = scheduleSheets.get("finish");
      if (scheduleSheet) {
        edge.toSheet = scheduleSheet;
        edge.resolved = true;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 4: VALIDATE — Check completeness
// ---------------------------------------------------------------------------

/**
 * Validate the reference graph for completeness and consistency.
 */
export function validateReferences(graph: ReferenceGraph): ReferenceValidation {
  const unresolvedRefs: ReferenceValidation["unresolvedRefs"] = [];
  const mismatches: ReferenceValidation["mismatches"] = [];
  let resolvedCount = 0;

  for (const edge of graph.edges) {
    if (edge.resolved) {
      resolvedCount++;
    } else {
      unresolvedRefs.push({
        fromSheet: edge.fromSheet,
        referenceText: edge.referenceText,
        type: edge.referenceType,
        reason:
          edge.toSheet === "unknown"
            ? "Target sheet not identified"
            : `Target sheet ${edge.toSheet} not found in plan set`,
      });
    }
  }

  // Check for schedule references without corresponding schedule sheets
  const doorRefs = graph.edges.filter(
    (e) => e.referenceType === "door_schedule_ref" && !e.resolved,
  );
  if (doorRefs.length > 0) {
    mismatches.push({
      description: "Door type references without door schedule",
      fromSheet: doorRefs.map((r) => r.fromSheet).join(", "),
      toSheet: "N/A",
      details: `Found ${doorRefs.length} door type reference(s) but no door schedule sheet detected`,
    });
  }

  return {
    totalReferences: graph.edges.length,
    resolvedCount,
    unresolvedCount: unresolvedRefs.length,
    unresolvedRefs,
    mismatches,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize sheet number format: "A2" → "A-2", "M0" → "M-0" */
function normalizeSheetNumber(raw: string): string {
  const match = raw.match(/^(FP|[A-Z])-?(\d+(?:\.\d+)?)$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return raw;
}

/**
 * Extract references from a VectorPage (convenience wrapper).
 */
export function extractReferencesFromPage(
  page: VectorPage,
  sheetNumber: string,
): ExtractedReference[] {
  return extractReferences(page.texts, sheetNumber);
}
