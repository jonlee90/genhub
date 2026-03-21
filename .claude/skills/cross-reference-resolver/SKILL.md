---
name: cross-reference-resolver
description: "Resolve cross-references between construction drawing sheets (detail callouts, section markers, schedule references, specification links). Use when implementing multi-sheet correlation, cross-reference resolution, detail-to-plan linking, or schedule-to-plan matching. Triggers on: cross-reference, multi-sheet, detail callout, section marker, schedule linking, plan correlation, reference graph, sheet linking."
globs:
  - "lib/extraction/**/*.ts"
  - "app/api/estimates/**/*.ts"
---

# Cross-Reference Resolver

> Link information across multiple sheets in a construction plan set by resolving detail callouts, section markers, schedule references, and specification links.

## Problem

Construction documents are deeply cross-referenced. A door type on A-2 references the door schedule, which references a detail drawing, which references a specification section. Current system processes each page **in isolation** — items extracted from different sheets are never connected.

## Reference Types in Construction Drawings

### 1. Detail Callouts
```
  ┌───┐
  │ 3 │  ← Detail number
  │───│
  │A-4│  ← Sheet where detail is found
  └───┘
Meaning: "See Detail 3 on Sheet A-4"
```

### 2. Section Markers
```
  ▽ 2
  ───
  A-3
Meaning: "See Section 2 on Sheet A-3"
```

### 3. Elevation Markers
```
  ◁ 1
  ───
  A-3.1
Meaning: "See Elevation 1 on Sheet A-3.1"
```

### 4. Door/Window Type References
```
  ①  or  (A)  on floor plan
Meaning: "See Door Schedule for Type 1/A"
```

### 5. Finish Keys
```
  Room label with finish code: "101-A"
Meaning: "See Finish Schedule for Room 101, Finish Type A"
```

### 6. Specification References
```
  Note text: "PER SECTION 09 29 00" or "SEE SPEC 06200"
Meaning: "See project specifications Division 09 Section 29 00"
```

### 7. Sheet-to-Sheet References
```
  "SEE SHEET A-4 FOR DETAILS" or "CONTINUE ON M-2"
```

## Reference Graph Data Model

```typescript
interface ReferenceGraph {
  nodes: SheetNode[];
  edges: ReferenceEdge[];
}

interface SheetNode {
  sheetNumber: string;      // "A-2"
  pageIndex: number;        // 0-based page in PDF
  classification: SheetClassification;
  extractedItems: string[]; // IDs of takeoff items from this sheet
}

interface ReferenceEdge {
  id: string;
  fromSheet: string;        // "A-2"
  toSheet: string;          // "A-4"
  referenceType: ReferenceType;
  referenceText: string;    // "Detail 3/A-4"
  sourceRegion: Rect;       // Where the callout appears on source sheet
  resolved: boolean;        // Was the target sheet found and processed?
  linkedItems: string[];    // Takeoff item IDs connected by this reference
}

type ReferenceType =
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
```

## Resolution Pipeline

```
Phase 1: COLLECT (during per-page extraction)
    Each extraction engine emits references it finds:
    ├─ Vector engine: detail bubbles (circle with fraction)
    ├─ AI vision: "SEE DETAIL", "SEE SHEET" text patterns
    ├─ Schedule extractor: type codes that reference other sheets
    └─ Store as unresolved ReferenceEdge entries
    ↓
Phase 2: INDEX (after all pages extracted)
    Build sheet index:
    ├─ Map sheet numbers to page indices
    ├─ Map detail numbers to their sheet locations
    ├─ Map schedule entry keys (Door Type A) to schedule rows
    └─ Map room names/numbers across sheets
    ↓
Phase 3: RESOLVE (link references to targets)
    For each unresolved edge:
    ├─ Find target sheet in index
    ├─ Find specific item on target sheet (detail #, schedule row)
    ├─ Link source takeoff items to target takeoff items
    ├─ Merge complementary data (floor plan quantity + schedule specs)
    └─ Flag unresolved references for user review
    ↓
Phase 4: VALIDATE (check completeness)
    ├─ All door types on floor plan have schedule entries?
    ├─ All schedule entries have corresponding plan symbols?
    ├─ All detail callouts point to existing sheets?
    ├─ All rooms in finish schedule appear on floor plan?
    └─ Generate validation report with missing references
```

## Cross-Reference Extraction Patterns

```typescript
// Regex patterns for reference detection in text
const REFERENCE_PATTERNS = {
  detail_callout: /(?:SEE\s+)?DETAIL\s*#?\s*(\d+)\s*(?:@|ON|\/)\s*(?:SHEET\s*)?([A-Z]-?\d+(?:\.\d+)?)/i,
  section_marker: /(?:SEE\s+)?SECTION\s*#?\s*(\d+)\s*(?:@|ON|\/)\s*(?:SHEET\s*)?([A-Z]-?\d+(?:\.\d+)?)/i,
  elevation_ref: /(?:SEE\s+)?ELEV(?:ATION)?\s*#?\s*(\d+)\s*(?:@|ON|\/)\s*(?:SHEET\s*)?([A-Z]-?\d+(?:\.\d+)?)/i,
  sheet_ref: /SEE\s+(?:SHEET\s+)?([A-Z]-?\d+(?:\.\d+)?)/i,
  spec_ref: /(?:PER|SEE)\s+(?:SPEC(?:IFICATION)?\.?\s+)?(?:SECTION\s+)?(\d{2}\s*\d{2}\s*\d{2})/i,
  wall_type: /(?:WALL\s+)?(?:TYPE|TYP\.?)\s*#?\s*([A-Z0-9]+)/i,
  door_type: /(?:DOOR\s+)?(?:TYPE|TYP\.?)\s*#?\s*([A-Z0-9]+)/i,
  finish_key: /(?:FINISH\s+)?(?:TYPE|KEY)\s*#?\s*([A-Z0-9]+)/i,
};

// Visual pattern: detail bubble (circle with fraction: number/sheet)
// Detected from vector geometry: small circle (r < 0.3") with text inside
function detectDetailBubbles(page: VectorPage): DetailCallout[] {
  const smallCircles = page.arcs.filter(a =>
    a.radius < 0.3 &&
    Math.abs(a.endAngle - a.startAngle) > 5.5 // nearly full circle
  );

  return smallCircles.map(circle => {
    const textsInside = page.texts.filter(t =>
      distanceTo(t.position, circle.center) < circle.radius * 1.5
    );
    // Parse fraction: top = detail number, bottom = sheet number
    return parseDetailBubble(textsInside, circle);
  });
}
```

## Cha Redefine Example

```
Reference Graph for Cha Redefine:

T-1 (Cover)
  └─ INDEX OF SHEETS → references all sheets
  └─ SCOPE OF WORK → context for all trades

A-1 (RCP) ←──────────────────────────┐
  └─ Ceiling fixture symbols ←───── Fixture Schedule (on A-1)
  └─ "DRY WALL CEILING" label ─────→ Finish details

A-2 (Floor Plan)
  ├─ Door Type 1 (circle) ──────────→ Door Schedule (on A-2)
  ├─ Door Type 2 ───────────────────→ Door Schedule (on A-2)
  ├─ Door Type 3 ───────────────────→ Door Schedule (on A-2)
  ├─ "SEE FINISH PLAN" ────────────→ A-2.1
  ├─ Wall Detail #1 ───────────────→ Partition Detail (on A-2)
  ├─ Wall Detail #2 ───────────────→ Service Counter Low Wall (on A-2)
  └─ Floor Plan Legend ────────────→ Wall type definitions

A-3.1 (Elevations)
  └─ Kitchen/service counter dims ──→ Equipment from A-3

M-sheets
  └─ Equipment tags ───────────────→ Equipment schedule
  └─ Duct connections ─────────────→ RTU on roof plan

E-sheets
  └─ Fixture symbols ──────────────→ Fixture schedule (A-1)
  └─ Panel references ─────────────→ Panel schedule (E1)

P-sheets
  └─ Fixture connections ──────────→ Fixture schedule
  └─ Pipe sizing notes ────────────→ Plumbing notes (P0)
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/extraction/cross-reference-resolver.ts` | **CREATE** — reference graph builder and resolver |
| `lib/extraction/reference-types.ts` | **CREATE** — types for reference graph |
| `lib/extraction/detail-bubble-detector.ts` | **CREATE** — visual detection of reference markers |
| `app/api/estimates/extract/route.ts` | **MODIFY** — add cross-reference phase after extraction |

## Database Schema

```sql
CREATE TABLE sheet_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id UUID REFERENCES plan_uploads(id) ON DELETE CASCADE,
  from_page_id UUID REFERENCES plan_pages(id),
  to_page_id UUID REFERENCES plan_pages(id),
  reference_type TEXT NOT NULL,
  reference_text TEXT,
  source_region JSONB, -- {x, y, width, height}
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link takeoff items that are connected by cross-references
CREATE TABLE takeoff_item_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id UUID REFERENCES takeoff_items(id) ON DELETE CASCADE,
  target_item_id UUID REFERENCES takeoff_items(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'schedule_match', 'detail_ref', 'spec_ref'
  reference_id UUID REFERENCES sheet_references(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```
