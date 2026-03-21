---
name: construction-sheet-classifier
description: "Classify construction PDF pages by discipline and content type. Use when implementing or improving sheet classification, PDF extraction routing, plan set processing, or the estimates extraction pipeline. Triggers on: sheet type detection, page classification, plan set categorization, extraction routing, multi-discipline PDF processing, SheetType enum changes, computeSheetType modifications."
globs:
  - "lib/extraction/**/*.ts"
  - "app/api/estimates/**/*.ts"
  - "lib/ai/parse-prompt.ts"
---

# Construction Sheet Classifier

> Classify every page in a construction plan set by discipline, content type, and extraction routing.

## Purpose

Replace the current `computeSheetType()` (30-line regex in `vector-parser.ts`) with a robust, multi-signal classifier that correctly routes pages to the right extraction engine.

## Current System (What Exists)

```typescript
// lib/extraction/vector-parser.ts:796
function computeSheetType(textClusters: TextCluster[]): SheetType {
  // Only checks title text with basic string matching
  // Defaults to "floor_plan" if no match → WRONG for most sheets
  // Returns 9 types: floor_plan | rcp | elevation | section | detail | code | schedule | mep | unknown
}
```

**Problems:**
- Defaults unrecognized sheets to `floor_plan` (should be `unknown`)
- No sheet number parsing (A-1, M-0, P-2, E-3)
- No visual content analysis
- Lumps all MEP into one `mep` type (can't distinguish electrical vs plumbing vs mechanical)
- No confidence scoring
- No sub-classification (e.g., "schedule" doesn't specify door vs finish vs equipment)

## Target Classification Taxonomy

### Disciplines (from sheet number prefix)

| Prefix | Discipline | Priority |
|--------|-----------|----------|
| `G` | General / Cover | Low (no quantities) |
| `T` | Title / ADA / Code | Low (reference only) |
| `A` | Architectural | High |
| `S` | Structural | High |
| `M` | Mechanical (HVAC) | High |
| `E` | Electrical | High |
| `P` | Plumbing | High |
| `L` | Landscape | Medium |
| `C` | Civil / Site | Medium |
| `D` | Demolition | High |
| `FP` | Fire Protection | Medium |

### Content Types (from title + visual analysis)

| Content Type | Detection Signals | Extraction Engine |
|-------------|-------------------|-------------------|
| `cover` | "COVER", "TITLE", "INDEX", T-1 | Skip (metadata only) |
| `site_plan` | "SITE PLAN", "SITE", scale 1/32" or smaller | Vector (site) |
| `floor_plan` | "FLOOR PLAN", "PLAN", A-1/A-2 | Vector + AI fallback |
| `demolition_plan` | "DEMO", "DEMOLITION", "EXISTING" | Vector (demo mode) |
| `rcp` | "REFLECTED CEILING", "RCP" | Vector (ceiling rules) |
| `roof_plan` | "ROOF PLAN" | Vector (basic) |
| `elevation` | "ELEVATION", section markers | AI vision |
| `section` | "SECTION", "BUILDING SECTION" | AI vision |
| `detail` | "DETAIL", detail bubbles, large scale (1"=1', 3"=1') | AI vision |
| `door_schedule` | "DOOR SCHEDULE", table with door types | Schedule extractor |
| `window_schedule` | "WINDOW SCHEDULE" | Schedule extractor |
| `finish_schedule` | "FINISH SCHEDULE", "ROOM FINISH" | Schedule extractor |
| `fixture_schedule` | "FIXTURE SCHEDULE", "LIGHTING SCHEDULE" | Schedule extractor |
| `equipment_schedule` | "EQUIPMENT SCHEDULE", "MECHANICAL SCHEDULE" | Schedule extractor |
| `panel_schedule` | "PANEL SCHEDULE", circuit table | Schedule extractor |
| `plumbing_plan` | "PLUMBING", P-sheets, fixture symbols | MEP engine (plumbing) |
| `mechanical_plan` | "MECHANICAL", "HVAC", M-sheets, duct runs | MEP engine (mechanical) |
| `electrical_plan` | "ELECTRICAL", "POWER", "LIGHTING", E-sheets | MEP engine (electrical) |
| `fire_protection` | "FIRE PROTECTION", "SPRINKLER", FP-sheets | MEP engine (fire) |
| `structural` | "STRUCTURAL", "FOUNDATION", S-sheets | AI vision (structural) |
| `code_compliance` | "GREEN CODE", "CALGREEN", "CODE", G-sheets | Skip (no quantities) |
| `ada_compliance` | "ADA", "ACCESSIBILITY" | Skip (reference only) |
| `egress` | "EGRESS", "OCCUPANT LOAD" | Skip (reference, extract occupant count) |

### Extraction Routing Matrix

```
Sheet Classification Result
    ↓
Route to engine:
├─ floor_plan, demolition_plan → Vector Engine (existing)
├─ rcp, roof_plan → Vector Engine (ceiling rules)
├─ *_schedule → Schedule Extractor (Skill 2)
├─ plumbing_plan, mechanical_plan, electrical_plan → MEP Engine (Skill 3)
├─ elevation, section, detail, structural → AI Vision (specialized prompts)
├─ site_plan → AI Vision (site-specific prompt)
├─ cover, code_compliance, ada_compliance → Skip (extract metadata only)
└─ unknown → AI Vision (generic prompt, flag for user review)
```

## Implementation Pattern

### Enhanced SheetType (extend existing)

```typescript
// lib/extraction/types.ts — extend the existing SheetType

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

export type ExtractionEngine =
  | "vector"
  | "vector_ceiling"
  | "schedule_extractor"
  | "mep_engine"
  | "ai_vision"
  | "ai_vision_specialized"
  | "skip";

export interface ClassificationSignal {
  source: "sheet_number" | "title_text" | "visual_content" | "text_density" | "table_detection";
  value: string;
  weight: number;
}
```

### Classification Pipeline (3 signals, weighted)

```typescript
// lib/extraction/sheet-classifier.ts

export function classifySheet(page: VectorPage): SheetClassification {
  const signals: ClassificationSignal[] = [];

  // Signal 1: Sheet number parsing (weight: 0.5) — highest confidence
  const sheetNumber = extractSheetNumber(page.texts);
  if (sheetNumber) {
    signals.push(sheetNumberSignal(sheetNumber));
  }

  // Signal 2: Title text matching (weight: 0.3)
  const titleSignal = analyzeTitleText(page.texts);
  if (titleSignal) {
    signals.push(titleSignal);
  }

  // Signal 3: Visual content analysis (weight: 0.2) — table grid detection, symbol density
  const visualSignal = analyzeVisualContent(page);
  if (visualSignal) {
    signals.push(visualSignal);
  }

  // Combine signals → resolve contentType + discipline
  return resolveClassification(signals, sheetNumber);
}
```

### Sheet Number Parsing Rules

```typescript
// Standard format: [Prefix]-[Number] or [Prefix][Number]
// Examples from Cha Redefine PDF:
//   T-1, T-2, T-3, T-4     → Title/ADA/Egress
//   G-1, G-2, G-3, G-4     → Green Code
//   A-1, A-2, A-2.1, A-3   → Architectural
//   A-3.1, A-4              → Arch details/elevations
//   M0, M1, M2.0, M3.0     → Mechanical
//   E0, E1, E2, E3, E4     → Electrical
//   P0, P1, P2              → Plumbing

const SHEET_NUMBER_PATTERNS: Record<string, SheetDiscipline> = {
  "T": "general",      // Title, ADA, Egress
  "G": "general",      // Green/CalGreen code
  "A": "architectural",
  "S": "structural",
  "M": "mechanical",
  "E": "electrical",
  "P": "plumbing",
  "L": "civil",        // Landscape
  "C": "civil",
  "D": "architectural", // Demo (architectural discipline)
  "FP": "fire_protection",
};
```

### Title Text Keywords (by content type)

```typescript
const TITLE_KEYWORDS: Record<SheetContentType, string[]> = {
  cover: ["COVER", "TITLE PAGE", "INDEX OF SHEETS", "PROJECT DATA"],
  site_plan: ["SITE PLAN", "EXISTING SITE"],
  floor_plan: ["FLOOR PLAN", "DIMENSIONED FLOOR", "NEW FLOOR"],
  demolition_plan: ["DEMO", "DEMOLITION", "EXISTING TO REMAIN"],
  rcp: ["REFLECTED CEILING", "RCP", "CEILING PLAN"],
  roof_plan: ["ROOF PLAN"],
  elevation: ["ELEVATION", "FRONT ELEVATION", "STORE FRONT"],
  section: ["SECTION", "BUILDING SECTION", "WALL SECTION"],
  detail: ["DETAIL", "PARTITION DETAIL", "CONNECTION DETAIL"],
  door_schedule: ["DOOR SCHEDULE"],
  window_schedule: ["WINDOW SCHEDULE"],
  finish_schedule: ["FINISH SCHEDULE", "ROOM FINISH", "FLOOR FINISH"],
  fixture_schedule: ["FIXTURE SCHEDULE", "CEILING FIXTURE", "LIGHTING SCHEDULE"],
  equipment_schedule: ["EQUIPMENT SCHEDULE", "EQUIPMENT LIST"],
  panel_schedule: ["PANEL SCHEDULE", "ELECTRICAL PANEL"],
  plumbing_plan: ["PLUMBING", "WASTE & VENT", "COLD & HOT WATER"],
  mechanical_plan: ["MECHANICAL", "HVAC", "FC DUCT", "SPECIFICATION HVAC"],
  electrical_plan: ["ELECTRICAL", "POWER PLAN", "LIGHTING PLAN"],
  fire_protection_plan: ["FIRE PROTECTION", "SPRINKLER"],
  structural_plan: ["STRUCTURAL", "FOUNDATION", "FRAMING PLAN"],
  code_compliance: ["GREEN BUILDING", "CALGREEN", "BUILDING CODE", "MANDATORY MEASURES"],
  ada_compliance: ["ADA", "ACCESSIBILITY", "ACCESSIBLE"],
  egress: ["EGRESS", "OCCUPANT LOAD", "EXIT PLAN"],
};
```

### Table Detection (for schedule classification)

```typescript
// Visual signal: detect grid patterns indicating a table/schedule
function detectTableRegions(page: VectorPage): boolean {
  // Look for:
  // 1. Many horizontal + vertical lines at regular intervals
  // 2. Text objects aligned in rows/columns
  // 3. Rectangle grid patterns

  const horizontalLines = page.lines.filter(l =>
    Math.abs(l.start.y - l.end.y) < 0.05 // nearly horizontal
  );
  const verticalLines = page.lines.filter(l =>
    Math.abs(l.start.x - l.end.x) < 0.05 // nearly vertical
  );

  // Table heuristic: >= 5 horizontal + >= 3 vertical lines forming a grid
  return horizontalLines.length >= 5 && verticalLines.length >= 3;
}
```

## Backward Compatibility

The existing `SheetType` (9 values) MUST remain as-is since it's used in:
- `geometry-classifier.ts` switch statement
- `vector-parser.ts` return type
- Database `sheetType` columns

**Strategy:** `SheetClassification.sheetType` maps to the legacy 9-value enum. New code uses `contentType` and `discipline` for fine-grained routing.

```typescript
// Map new contentType → legacy SheetType
function toLegacySheetType(ct: SheetContentType): SheetType {
  const mapping: Record<SheetContentType, SheetType> = {
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
  return mapping[ct];
}
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/extraction/sheet-classifier.ts` | **CREATE** — main classifier |
| `lib/extraction/types.ts` | **MODIFY** — add SheetClassification, SheetDiscipline, SheetContentType, ExtractionEngine types |
| `lib/extraction/vector-parser.ts` | **MODIFY** — replace `computeSheetType()` call with `classifySheet()` |
| `app/api/estimates/extract/route.ts` | **MODIFY** — use classification for routing decisions |

## Testing Against Cha Redefine PDF

Expected classification results:

| Sheet | Number | Discipline | Content Type | Engine |
|-------|--------|-----------|-------------|--------|
| T-1 | T-1 | general | cover | skip |
| T-2 | T-2 | general | ada_compliance | skip |
| T-3 | T-3 | general | egress | skip (extract occupant count) |
| T-4 | T-4 | general | elevation | ai_vision |
| G-1..G-4 | G-* | general | code_compliance | skip |
| A-1 | A-1 | architectural | rcp | vector_ceiling |
| A-2 | A-2 | architectural | floor_plan | vector |
| A-2.1 | A-2.1 | architectural | finish_schedule | schedule_extractor |
| A-3 | A-3 | architectural | floor_plan | vector |
| A-3.1 | A-3.1 | architectural | elevation | ai_vision |
| A-4 | A-4 | architectural | detail | ai_vision |
| M0 | M-0 | mechanical | mechanical_plan | mep_engine |
| M1 | M-1 | mechanical | mechanical_plan | mep_engine |
| M2.0 | M-2 | mechanical | equipment_schedule | schedule_extractor |
| M3.0 | M-3 | mechanical | mechanical_plan | mep_engine |
| E0..E4 | E-* | electrical | electrical_plan | mep_engine |
| P0..P2 | P-* | plumbing | plumbing_plan | mep_engine |

## Error Handling

- If no signals match → `contentType: "unknown"`, `extractionEngine: "ai_vision"`, `confidence: 0.1`
- If signals conflict → highest-weight signal wins, lower confidence
- If sheet number found but title contradicts → trust sheet number (weight 0.5 > 0.3)
- Log all classifications for debugging: `console.info(`[SheetClassifier] ${sheetNumber}: ${contentType} (${confidence})`)`
