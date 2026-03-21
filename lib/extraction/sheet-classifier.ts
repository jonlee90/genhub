/**
 * Sheet Classifier — Classify construction PDF pages by discipline and content type.
 *
 * Replaces the simple `computeSheetType()` in vector-parser.ts with a multi-signal
 * classifier that uses sheet number parsing, title text matching, and visual content
 * analysis to determine the correct extraction engine for each page.
 */

import type {
  VectorPage,
  TextObject,
  SheetType,
  SheetDiscipline,
  SheetContentType,
  ExtractionEngine,
  ClassificationSignal,
  SheetClassification,
} from "./types";

// ---------------------------------------------------------------------------
// Sheet number → discipline mapping
// ---------------------------------------------------------------------------

const SHEET_PREFIX_DISCIPLINE: Record<string, SheetDiscipline> = {
  T: "general",
  G: "general",
  A: "architectural",
  S: "structural",
  M: "mechanical",
  E: "electrical",
  P: "plumbing",
  L: "civil",
  C: "civil",
  D: "architectural",
  FP: "fire_protection",
};

// ---------------------------------------------------------------------------
// Title text keywords → content type mapping (ordered by specificity)
// ---------------------------------------------------------------------------

const TITLE_KEYWORDS: Array<{
  contentType: SheetContentType;
  keywords: string[];
}> = [
  // Schedules (most specific first)
  { contentType: "door_schedule", keywords: ["DOOR SCHEDULE"] },
  { contentType: "window_schedule", keywords: ["WINDOW SCHEDULE"] },
  {
    contentType: "finish_schedule",
    keywords: ["FINISH SCHEDULE", "ROOM FINISH", "FLOOR FINISH"],
  },
  {
    contentType: "fixture_schedule",
    keywords: [
      "FIXTURE SCHEDULE",
      "CEILING FIXTURE SCHEDULE",
      "LIGHTING SCHEDULE",
    ],
  },
  {
    contentType: "equipment_schedule",
    keywords: ["EQUIPMENT SCHEDULE", "EQUIPMENT LIST"],
  },
  {
    contentType: "panel_schedule",
    keywords: ["PANEL SCHEDULE", "ELECTRICAL PANEL"],
  },

  // Specific plan types
  {
    contentType: "demolition_plan",
    keywords: ["DEMO", "DEMOLITION", "EXISTING TO REMAIN"],
  },
  {
    contentType: "rcp",
    keywords: ["REFLECTED CEILING", "RCP", "CEILING PLAN"],
  },
  { contentType: "roof_plan", keywords: ["ROOF PLAN"] },
  { contentType: "site_plan", keywords: ["SITE PLAN", "EXISTING SITE"] },
  { contentType: "egress", keywords: ["EGRESS", "OCCUPANT LOAD", "EXIT PLAN"] },

  // Code/compliance
  {
    contentType: "code_compliance",
    keywords: [
      "GREEN BUILDING",
      "CALGREEN",
      "BUILDING CODE",
      "MANDATORY MEASURES",
      "GREEN CODE",
    ],
  },
  {
    contentType: "ada_compliance",
    keywords: ["ADA STANDARD", "ACCESSIBILITY", "ACCESSIBLE"],
  },

  // MEP plans
  {
    contentType: "plumbing_plan",
    keywords: [
      "PLUMBING",
      "WASTE & VENT",
      "WASTE AND VENT",
      "COLD & HOT WATER",
      "COLD AND HOT WATER",
    ],
  },
  {
    contentType: "mechanical_plan",
    keywords: ["MECHANICAL", "HVAC", "FC DUCT", "SPECIFICATION HVAC"],
  },
  {
    contentType: "electrical_plan",
    keywords: ["ELECTRICAL", "POWER PLAN", "LIGHTING PLAN"],
  },
  {
    contentType: "fire_protection_plan",
    keywords: ["FIRE PROTECTION", "SPRINKLER"],
  },
  {
    contentType: "structural_plan",
    keywords: ["STRUCTURAL", "FOUNDATION", "FRAMING PLAN"],
  },

  // Architectural
  {
    contentType: "cover",
    keywords: ["COVER", "TITLE PAGE", "INDEX OF SHEETS", "PROJECT DATA"],
  },
  {
    contentType: "elevation",
    keywords: ["ELEVATION", "FRONT ELEVATION", "STORE FRONT ELEVATION"],
  },
  {
    contentType: "section",
    keywords: ["SECTION", "BUILDING SECTION", "WALL SECTION"],
  },
  {
    contentType: "detail",
    keywords: [
      "DETAIL",
      "PARTITION DETAIL",
      "CONNECTION DETAIL",
      "RESTROOMS DETAIL",
    ],
  },
  {
    contentType: "floor_plan",
    keywords: ["FLOOR PLAN", "DIMENSIONED FLOOR", "NEW FLOOR"],
  },
];

// ---------------------------------------------------------------------------
// Content type → legacy SheetType mapping
// ---------------------------------------------------------------------------

const CONTENT_TO_LEGACY: Record<SheetContentType, SheetType> = {
  cover: "unknown",
  site_plan: "floor_plan",
  floor_plan: "floor_plan",
  demolition_plan: "floor_plan",
  rcp: "rcp",
  roof_plan: "floor_plan",
  elevation: "elevation",
  section: "section",
  detail: "detail",
  door_schedule: "schedule",
  window_schedule: "schedule",
  finish_schedule: "schedule",
  fixture_schedule: "schedule",
  equipment_schedule: "schedule",
  panel_schedule: "schedule",
  plumbing_plan: "mep",
  mechanical_plan: "mep",
  electrical_plan: "mep",
  fire_protection_plan: "mep",
  structural_plan: "unknown",
  code_compliance: "code",
  ada_compliance: "code",
  egress: "code",
  unknown: "unknown",
};

// ---------------------------------------------------------------------------
// Content type → extraction engine mapping
// ---------------------------------------------------------------------------

const CONTENT_TO_ENGINE: Record<SheetContentType, ExtractionEngine> = {
  cover: "skip",
  site_plan: "ai_vision",
  floor_plan: "vector",
  demolition_plan: "vector",
  rcp: "vector_ceiling",
  roof_plan: "vector",
  elevation: "ai_vision",
  section: "ai_vision",
  detail: "ai_vision",
  door_schedule: "schedule_extractor",
  window_schedule: "schedule_extractor",
  finish_schedule: "schedule_extractor",
  fixture_schedule: "schedule_extractor",
  equipment_schedule: "schedule_extractor",
  panel_schedule: "schedule_extractor",
  plumbing_plan: "mep_engine",
  mechanical_plan: "mep_engine",
  electrical_plan: "mep_engine",
  fire_protection_plan: "mep_engine",
  structural_plan: "ai_vision_specialized",
  code_compliance: "skip",
  ada_compliance: "skip",
  egress: "skip",
  unknown: "ai_vision",
};

// Content types that produce extractable quantities
const QUANTITY_CONTENT_TYPES = new Set<SheetContentType>([
  "floor_plan",
  "demolition_plan",
  "rcp",
  "roof_plan",
  "elevation",
  "section",
  "detail",
  "door_schedule",
  "window_schedule",
  "finish_schedule",
  "fixture_schedule",
  "equipment_schedule",
  "panel_schedule",
  "plumbing_plan",
  "mechanical_plan",
  "electrical_plan",
  "fire_protection_plan",
  "structural_plan",
  "site_plan",
]);

// ---------------------------------------------------------------------------
// Signal 1: Sheet number extraction and parsing
// ---------------------------------------------------------------------------

/**
 * Extract the sheet number from text objects — looks for patterns like
 * "A-1", "M0", "T-3", "A-2.1", "FP-1", "E3" typically found in the
 * bottom-right title block area.
 */
function extractSheetNumber(texts: TextObject[]): string | null {
  // Sheet numbers are typically in the bottom-right of the page,
  // with large or bold font, and match [A-Z]{1,2}-?\d+(\.\d+)?
  const sheetNumberPattern = /^(FP|[A-Z])-?(\d+(?:\.\d+)?)$/;

  // Sort candidates: prefer larger font size (title block sheet number is usually big)
  const candidates = texts
    .filter((t) => sheetNumberPattern.test(t.content.trim()))
    .sort((a, b) => b.fontSize - a.fontSize);

  if (candidates.length > 0) {
    const raw = candidates[0].content.trim();
    // Normalize: ensure prefix-number format
    const match = raw.match(sheetNumberPattern);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }

  // Fallback: look for "Sheet No." or "SHEET NO" label near a number
  for (const t of texts) {
    if (/sheet\s*no\.?/i.test(t.content)) {
      // Find nearby text that looks like a sheet number
      const nearby = texts.filter(
        (other) =>
          other !== t &&
          Math.abs(other.position.y - t.position.y) < 0.5 &&
          Math.abs(other.position.x - t.position.x) < 3 &&
          sheetNumberPattern.test(other.content.trim()),
      );
      if (nearby.length > 0) {
        const m = nearby[0].content.trim().match(sheetNumberPattern);
        if (m) return `${m[1]}-${m[2]}`;
      }
    }
  }

  return null;
}

function sheetNumberToSignal(sheetNumber: string): ClassificationSignal & {
  discipline: SheetDiscipline;
  contentType: SheetContentType | null;
} {
  const match = sheetNumber.match(/^(FP|[A-Z])-?(\d+(?:\.\d+)?)$/);
  if (!match) {
    return {
      source: "sheet_number",
      value: sheetNumber,
      weight: 0.2,
      discipline: "general",
      contentType: null,
    };
  }

  const prefix = match[1];
  const discipline = SHEET_PREFIX_DISCIPLINE[prefix] ?? "general";

  // Infer content type from discipline (will be refined by title text)
  let contentType: SheetContentType | null = null;
  switch (prefix) {
    case "T":
      contentType = "cover"; // Default for T-sheets, refined by title
      break;
    case "G":
      contentType = "code_compliance";
      break;
    case "M":
      contentType = "mechanical_plan";
      break;
    case "E":
      contentType = "electrical_plan";
      break;
    case "P":
      contentType = "plumbing_plan";
      break;
    case "S":
      contentType = "structural_plan";
      break;
    case "FP":
      contentType = "fire_protection_plan";
      break;
    case "L":
    case "C":
      contentType = "site_plan";
      break;
    case "D":
      contentType = "demolition_plan";
      break;
    // A-sheets need title text to distinguish floor_plan vs elevation vs detail etc.
  }

  return {
    source: "sheet_number",
    value: sheetNumber,
    weight: 0.5,
    discipline,
    contentType,
  };
}

// ---------------------------------------------------------------------------
// Signal 2: Title text analysis
// ---------------------------------------------------------------------------

function analyzeTitleText(texts: TextObject[]):
  | (ClassificationSignal & {
      contentType: SheetContentType;
    })
  | null {
  // Collect all text from page, uppercase for matching
  // Focus on larger text (titles tend to be larger font)
  const titleTexts = texts
    .filter((t) => t.fontSize >= 8) // Filter out tiny annotations
    .map((t) => t.content.toUpperCase())
    .join(" ");

  for (const entry of TITLE_KEYWORDS) {
    for (const keyword of entry.keywords) {
      if (titleTexts.includes(keyword)) {
        return {
          source: "title_text",
          value: keyword,
          weight: 0.3,
          contentType: entry.contentType,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Signal 3: Visual content analysis (table detection)
// ---------------------------------------------------------------------------

function analyzeVisualContent(page: VectorPage): ClassificationSignal | null {
  // Detect table grids: many horizontal + vertical lines at regular intervals
  const horizontalLines = page.lines.filter(
    (l) => Math.abs(l.start.y - l.end.y) < 0.05,
  );
  const verticalLines = page.lines.filter(
    (l) => Math.abs(l.start.x - l.end.x) < 0.05,
  );

  const hasTableGrid = horizontalLines.length >= 5 && verticalLines.length >= 3;

  if (hasTableGrid) {
    // Check if tables occupy a significant portion of the page
    // (schedules are mostly table; floor plans may have a small schedule in corner)
    const textDensity = page.texts.length / Math.max(page.lines.length, 1);
    const isScheduleHeavy = textDensity > 0.3 && horizontalLines.length >= 8;

    if (isScheduleHeavy) {
      return {
        source: "table_detection",
        value: `h=${horizontalLines.length},v=${verticalLines.length}`,
        weight: 0.2,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Classification resolver
// ---------------------------------------------------------------------------

function resolveClassification(
  signals: ClassificationSignal[],
  sheetNumber: string | null,
): SheetClassification {
  let discipline: SheetDiscipline = "general";
  let contentType: SheetContentType = "unknown";
  let confidence = 0;

  // Extract typed signals
  const numberSignal = signals.find((s) => s.source === "sheet_number") as
    | (ClassificationSignal & {
        discipline: SheetDiscipline;
        contentType: SheetContentType | null;
      })
    | undefined;
  const titleSignal = signals.find((s) => s.source === "title_text") as
    | (ClassificationSignal & { contentType: SheetContentType })
    | undefined;
  const tableSignal = signals.find((s) => s.source === "table_detection");

  // Apply sheet number signal (highest weight)
  if (numberSignal) {
    discipline = numberSignal.discipline;
    if (numberSignal.contentType) {
      contentType = numberSignal.contentType;
    }
    confidence += numberSignal.weight;
  }

  // Apply title text signal (overrides content type if more specific)
  if (titleSignal) {
    contentType = titleSignal.contentType;
    confidence += titleSignal.weight;

    // Derive discipline from content type if sheet number didn't provide one
    if (!numberSignal) {
      discipline = contentTypeToDiscipline(titleSignal.contentType);
    }
  }

  // Apply table detection signal (may upgrade to schedule type)
  if (tableSignal && contentType === "unknown") {
    // If we detected a table but have no other classification, it's likely a schedule
    contentType = "unknown"; // Will be refined by schedule extractor
    confidence += tableSignal.weight;
  }

  // If still unknown and we have a sheet number discipline, use defaults
  if (
    contentType === "unknown" &&
    numberSignal?.discipline === "architectural"
  ) {
    contentType = "floor_plan"; // Default A-sheets to floor plan
    confidence = Math.max(confidence, 0.3);
  }

  // Clamp confidence
  confidence = Math.min(confidence, 1.0);
  if (confidence === 0) confidence = 0.1;

  const extractionEngine = CONTENT_TO_ENGINE[contentType];
  const sheetType = CONTENT_TO_LEGACY[contentType];
  const hasQuantities = QUANTITY_CONTENT_TYPES.has(contentType);

  const result: SheetClassification = {
    sheetType,
    discipline,
    contentType,
    sheetNumber,
    confidence,
    signals,
    extractionEngine,
    hasQuantities,
  };

  console.info(
    `[SheetClassifier] ${sheetNumber ?? "?"}: ${contentType} (${discipline}) → ${extractionEngine} [confidence=${confidence.toFixed(2)}]`,
  );

  return result;
}

function contentTypeToDiscipline(ct: SheetContentType): SheetDiscipline {
  switch (ct) {
    case "floor_plan":
    case "demolition_plan":
    case "rcp":
    case "roof_plan":
    case "elevation":
    case "section":
    case "detail":
    case "door_schedule":
    case "window_schedule":
    case "finish_schedule":
      return "architectural";
    case "mechanical_plan":
    case "equipment_schedule":
      return "mechanical";
    case "electrical_plan":
    case "panel_schedule":
    case "fixture_schedule":
      return "electrical";
    case "plumbing_plan":
      return "plumbing";
    case "structural_plan":
      return "structural";
    case "fire_protection_plan":
      return "fire_protection";
    case "site_plan":
      return "civil";
    default:
      return "general";
  }
}

// ---------------------------------------------------------------------------
// Main classifier entry point
// ---------------------------------------------------------------------------

/**
 * Classify a construction PDF page using 3 weighted signals:
 * 1. Sheet number parsing (weight 0.5)
 * 2. Title text matching (weight 0.3)
 * 3. Visual content analysis (weight 0.2)
 */
export function classifySheet(page: VectorPage): SheetClassification {
  const signals: ClassificationSignal[] = [];

  // Signal 1: Sheet number
  const sheetNumber = extractSheetNumber(page.texts);
  if (sheetNumber) {
    const signal = sheetNumberToSignal(sheetNumber);
    signals.push(signal);
  }

  // Signal 2: Title text
  const titleSignal = analyzeTitleText(page.texts);
  if (titleSignal) {
    signals.push(titleSignal);
  }

  // Signal 3: Visual content
  const visualSignal = analyzeVisualContent(page);
  if (visualSignal) {
    signals.push(visualSignal);
  }

  return resolveClassification(signals, sheetNumber);
}

/**
 * Classify a page using only text objects (for use when VectorPage is not
 * yet fully constructed, e.g., during vector-parser text extraction phase).
 */
export function classifyFromTexts(texts: TextObject[]): SheetClassification {
  const signals: ClassificationSignal[] = [];

  const sheetNumber = extractSheetNumber(texts);
  if (sheetNumber) {
    signals.push(sheetNumberToSignal(sheetNumber));
  }

  const titleSignal = analyzeTitleText(texts);
  if (titleSignal) {
    signals.push(titleSignal);
  }

  return resolveClassification(signals, sheetNumber);
}
