---
name: construction-schedule-extractor
description: "Extract structured data from tabular schedules on construction drawings (door schedules, finish schedules, fixture schedules, equipment schedules, panel schedules). Use when implementing schedule parsing, table extraction from PDFs, or processing construction drawing schedules. Triggers on: schedule extraction, table parsing, door schedule, finish schedule, fixture schedule, equipment schedule, panel schedule, tabular data from construction PDFs."
globs:
  - "lib/extraction/**/*.ts"
  - "app/api/estimates/**/*.ts"
---

# Construction Schedule Extractor

> Extract structured data from tabular schedules on construction drawings into typed JSON.

## Problem

Construction PDFs contain critical estimating data in table format: door schedules, finish schedules, fixture schedules, equipment schedules. The current system **skips all schedule sheets** (returns empty in `geometry-classifier.ts`). This data represents 20-30% of a commercial estimate.

## Schedule Types & Schemas

### 1. Door Schedule

Found on: A-sheets (often A-2 or dedicated sheet)

```typescript
interface DoorScheduleEntry {
  mark: string;           // "1", "2", "3" or "A", "B", "C"
  quantity: number;        // How many of this type
  size: string;            // "3'-0\"x7'-0\"" or "3'-0\"x7'-0\"x1-3/4\""
  type: string;            // "A", "B", "C" (references detail)
  material: string;        // "EXISTING FRONT DOOR METAL FRAMING W/ TEMPERED GLASS"
  frame: string;           // "A", "B", "C" (frame type)
  hardware: string[];      // ["A", "D", "E", "F", "H"] (hardware set codes)
  fireRated: boolean;
  remarks: string;         // "SEE NOTES #1, #2, #3, #5"
  isExisting: boolean;     // (E) tag
  isRemoved: boolean;      // (R) tag
  isSwitched: boolean;     // (S) tag
}
```

**Cha Redefine Example (A-2):**
| Mark | Qty | Size | Type | Material | Hardware |
|------|-----|------|------|----------|----------|
| 1 | 2 | 3'-0"x7'-0" (PAIR) | A | Existing front door metal framing w/ tempered glass | A,D,E,F,H |
| 2 | 1 | 3'-0"x7'-0"x1-3/4" | B | Restroom door | A,C,G |
| 3 | 1 | 3'-0"x7'-0"x1-3/4" | C | Stainless steel double swing door | A |

### 2. Finish Schedule

Found on: A-2.1 or dedicated finish sheet

```typescript
interface FinishScheduleEntry {
  roomName: string;        // "DINING AREA", "KITCHEN", "RESTROOM"
  roomNumber: string;      // "101", "102"
  floorFinish: string;     // "VCT", "CERAMIC TILE", "EPOXY"
  wallFinish: string;      // "PAINT", "FRP", "CERAMIC TILE"
  baseFinish: string;      // "RUBBER BASE", "CERAMIC TILE BASE"
  ceilingFinish: string;   // "ACT 2x4", "GWB", "EXPOSED"
  ceilingHeight: string;   // "9'-0\"", "10'-0\""
  notes: string;
}
```

### 3. Ceiling Fixture Schedule

Found on: A-1 (RCP sheet)

```typescript
interface CeilingFixtureEntry {
  symbol: string;          // Circle with letter, or graphic symbol
  description: string;     // "1' Recessed LED downlight"
  manufacturer: string;    // "USA Light & Electric"
  location: string;        // "Kitchen/washer/Prepare area"
  wattage: number | null;
  circuitType: string;     // "Emergency / wet combination"
  quantity: number;        // Counted from plan
}
```

**Cha Redefine Example (A-1):**
| Symbol | Description | Manufacturer | Location |
|--------|-------------|-------------|----------|
| ○ | 1' Recessed LED downlight | USA Light & Electric | Kitchen/washer/Prepare area |
| ◊ | 2x4 Fluorescent lighting fixture | - | Restrooms |
| × | Existing exhaust fan for remodel | - | Restrooms |
| ⊕ | (E)Emergency / wet combination | - | - |

### 4. Equipment Schedule

Found on: A-3 or M-sheets

```typescript
interface EquipmentScheduleEntry {
  tag: string;             // "RTU-1", "EF-1"
  description: string;     // "Rooftop unit"
  manufacturer: string;
  model: string;
  capacity: string;        // "5 TON", "2000 CFM"
  electrical: string;      // "208V/3PH/60HZ"
  location: string;
  notes: string;
}
```

### 5. Panel Schedule

Found on: E-sheets

```typescript
interface PanelScheduleEntry {
  panel: string;           // "LP-1", "MDP"
  circuitNumber: number;
  breakerSize: number;     // Amps
  poles: number;           // 1, 2, or 3
  load: string;            // "LIGHTING", "RECEPTACLES", "HVAC"
  wireSize: string;        // "#12", "#10", "#8"
  conduitSize: string;     // "3/4\"", "1\""
  description: string;
}
```

## Extraction Pipeline

```
Schedule Sheet (classified by Skill 1)
    ↓
Step 1: Detect table boundaries
    ├─ Vector approach: Find grid lines (horizontal + vertical intersections)
    └─ Fallback: Text alignment analysis (column detection from x-coordinates)
    ↓
Step 2: Extract table structure
    ├─ Identify header row (usually bold, larger font, or top row)
    ├─ Identify data rows
    └─ Handle merged cells, multi-line cells
    ↓
Step 3: AI-assisted cell extraction
    ├─ Send cropped table region to Gemini 2.5 Pro (best for tables)
    ├─ Use schedule-type-specific Zod schema for validation
    └─ Fallback: Claude vision if Gemini unavailable
    ↓
Step 4: Validate & normalize
    ├─ Check required fields present
    ├─ Normalize dimensions ("3'-0\"x7'-0\"" → {width: 36, height: 84})
    ├─ Resolve hardware codes to descriptions
    └─ Flag low-confidence cells for review
    ↓
Step 5: Convert to takeoff items
    ├─ Door schedule → CSI Div 08 items
    ├─ Finish schedule → CSI Div 09 items
    ├─ Fixture schedule → CSI Div 26 items
    └─ Equipment schedule → respective CSI division
```

## AI Prompt Pattern (for table extraction)

```typescript
const SCHEDULE_EXTRACTION_PROMPT = `
You are extracting a {scheduleType} from a construction drawing.

The table has the following expected columns:
{columnHeaders}

Rules:
1. Extract EVERY row in the table, including rows with partial data
2. Preserve exact text as written (do not paraphrase material descriptions)
3. For quantity columns, extract the number only
4. For dimension columns, preserve the original format (e.g., 3'-0"x7'-0")
5. For hardware/code columns, list each code separated by commas
6. Mark cells that are empty or illegible as null
7. If a cell spans multiple lines, join with a space
8. Look for legend/key that explains abbreviations (E)=Existing, (R)=Removed, etc.

Return a JSON array of objects matching this schema:
{zodSchemaDescription}
`;
```

## Model Selection for Tables

| Model | Table Accuracy | Cost | When to Use |
|-------|---------------|------|-------------|
| **Gemini 2.5 Pro** | Highest (benchmark winner) | ~$0.005/page | Default for all schedules |
| **Claude Opus** | High (reasoning) | ~$0.015/page | Complex schedules with cross-refs |
| **GPT-4o** | Medium (struggles with complex tables) | ~$0.010/page | Fallback only |

**Recommendation:** Use Gemini 2.5 Pro as primary, Claude as fallback.

## Vector-Based Table Detection

```typescript
// Detect table regions from vector geometry (free, no AI needed)
function detectTableBoundaries(page: VectorPage): TableRegion[] {
  // 1. Find horizontal lines grouped by similar y-coordinate
  const hLines = groupByY(page.lines.filter(isHorizontal), tolerance: 0.05);

  // 2. Find vertical lines grouped by similar x-coordinate
  const vLines = groupByX(page.lines.filter(isVertical), tolerance: 0.05);

  // 3. Table exists where >= 3 horizontal and >= 2 vertical lines form a grid
  // 4. Compute bounding box of the grid
  // 5. Extract text objects within each cell (intersection of h/v lines)

  return tables.map(grid => ({
    bounds: computeBounds(grid),
    rows: grid.horizontalLines.length - 1,
    cols: grid.verticalLines.length - 1,
    cells: extractCellContents(grid, page.texts),
  }));
}
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/extraction/schedule-extractor.ts` | **CREATE** — main schedule extraction logic |
| `lib/extraction/schedule-types.ts` | **CREATE** — Zod schemas for each schedule type |
| `lib/extraction/table-detector.ts` | **CREATE** — vector-based table boundary detection |
| `app/api/estimates/extract/route.ts` | **MODIFY** — route schedule sheets to extractor |
| `types/db/tables/estimates.ts` | **MODIFY** — add schedule-related types |

## Database Schema Addition

```sql
-- Schedule extraction results (linked to takeoff_items)
CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_page_id UUID REFERENCES plan_pages(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL, -- 'door', 'finish', 'fixture', 'equipment', 'panel'
  row_index INT NOT NULL,
  entry_data JSONB NOT NULL, -- Full row data matching schedule type schema
  confidence REAL DEFAULT 1.0,
  needs_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link schedule entries to takeoff items they generate
ALTER TABLE takeoff_items ADD COLUMN schedule_entry_id UUID REFERENCES schedule_entries(id);
```

## Error Handling

- If table detection finds no tables on a "schedule" sheet → fall back to full-page AI vision
- If AI returns fewer rows than expected → flag for user review, show original image alongside
- If column headers don't match expected schema → attempt fuzzy matching, flag unknowns
- If merged cells detected → split content and assign to appropriate cells
- Track extraction confidence per cell, not just per row
