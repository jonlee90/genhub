# Estimates Module v2 - Requirements

**Project:** GenHub PWA - Estimates Module Enhancement
**Date:** 2026-02-15 | **Version:** 2.3 | **Status:** Draft

---

## Summary

Backend ~95% complete, Frontend ~60% complete (core upload->parse->review works; cost editor, summaries, templates, manual items are placeholders). This spec covers bug fixes, gap closures, wiring up existing components, **materials catalog integration**, and a **new deterministic vector-based extraction engine** replacing the current OpenAI vision API approach.

**Architecture Change (v2.1):** The extraction pipeline is being replaced from an ML-first (OpenAI GPT-4o vision) approach to a **deterministic, rule-based vector PDF parsing engine**. The new engine extracts geometry directly from CAD-exported vector PDFs using line/arc/path analysis, eliminating per-page API costs and providing reproducible, auditable results.

**42 requirements** across 6 priority levels:

| Priority | Count | Scope |
|----------|-------|-------|
| P0 Bug Fixes | 3 | Role check, cache cost, N+1 query |
| P0 Extraction Engine | 14 | Vector parser, raster detection, hatch filtering, geometry classifier (+ TI wall classification), scale detector, confidence, worker queue, progress, element detection, table/schedule extraction, finish schedule mapping, MEP extraction (electrical, plumbing, HVAC) |
| P1 Backend | 12 | Trade mappings, AI prompt, missing actions, material FK, materials mapping, suggestions, procurement bridge, stale prices |
| P1 Frontend | 8 | Wire CostEditor+materials, Summary+stale prices, Templates, Manual, Budget, History, 4 new material UI components |
| P2 New Features | 3 | PDF export, estimate-to-budget, assemblies |
| NFR | 5 | Performance, mobile, a11y, errors, security |

**Materials Integration**: See `.claude/specs/estimates-v2/materials-integration-plan.md` for detailed phase-by-phase implementation plan. Requirements REQ-011, REQ-022–026 cover the 7 phases.

**Extraction Engine**: See [P0: Vector Extraction Engine](#p0-vector-extraction-engine) below for the complete specification.

---

## P0: Bug Fixes

### REQ-001: Fix PM Approval Authorization

**Story:** As a PM, I want to approve estimates without requiring admin intervention.

**Bug:** `approveEstimate()` only checks `role !== "admin"`. PMs get "Insufficient permissions".

**File:** `app/actions/estimates.ts:287`

**Acceptance Criteria:**
- GIVEN role is `"project_manager"` WHEN calling `approveEstimate()` THEN estimate status changes to `"approved"`
- GIVEN role is `"admin"` WHEN calling `approveEstimate()` THEN estimate status changes to `"approved"`
- GIVEN role is `"foreman"` or `"worker"` WHEN calling `approveEstimate()` THEN error returned

**Fix:** `if (context.role !== "admin" && context.role !== "project_manager")`

---

### REQ-002: Fix Cache Hit Cost Logging

**Story:** As a GC, I want AI budget tracking to be accurate - cached results should cost $0.

**Bug:** Cache hits log original cost from cached result, inflating monthly spend.

**File:** `app/api/estimates/parse/route.ts:213`

**Acceptance Criteria:**
- GIVEN cache hit WHEN logging to `ai_usage_log` THEN cost = `0.00`
- GIVEN cache miss WHEN logging THEN cost = actual OpenAI API cost

**Fix:** `cost = 0; // Cache hits cost nothing`

---

### REQ-003: Fix N+1 Query in Template Application

**Story:** As a PM, I want pricing templates to apply instantly for 50+ line items.

**Bug:** `applyPricingTemplate()` fires individual UPDATE per line item (N+1 pattern).

**File:** `app/actions/pricing-templates.ts:221-242`

**Acceptance Criteria:**
- GIVEN 50 line items WHEN applying template THEN operation completes in <500ms
- GIVEN template application WHEN it fails THEN no items are partially updated

**Fix:** Replace `for` loop with `Promise.all()` batch or single RPC call.

---

## P0: Vector Extraction Engine

> **Replaces:** Current OpenAI GPT-4o vision pipeline (`app/api/estimates/parse/route.ts`)
> **Approach:** Deterministic rule-based geometry extraction from CAD-exported vector PDFs
> **Key Benefit:** Zero per-page API cost, reproducible results, auditable extraction rules

### Architecture Overview

```
PDF Upload → Worker Queue (PGMQ) → Raster/Vector Classification
  ├─ Vector PDF → pdfjs-dist (getOperatorList) → Hatch/Dimension Filtering
  │    → Sheet Type Detection → Scale Calibration (6-priority cascade)
  │    → Geometry Classification (walls/doors/windows/stairs/columns)
  │    → Room Detection (wall-graph cycle) → Quantity Calculation
  │    → Confidence Scoring → Structured Output
  └─ Raster PDF → GPT-4o Vision Fallback → normalize
Real-time Progress → Supabase Realtime (WebSocket push)
```

**Current flow (DEPRECATED):**
```
PDF → pdf-to-png-converter (rasterize) → sharp (optimize) → OpenAI GPT-4o (vision API) → Zod validate → normalize
```

**New flow:**
```
PDF → pdfjs-dist (getOperatorList API) → Rule Engine (geometry classify) → Quantity Calculator → normalize
```

> **Library note:** `pdfjs-dist` v5.4.624 (already installed). `pdf-lib` is PDF creation-only and cannot extract vectors. The `getOperatorList()` API provides access to all PDF drawing operators (constructPath, paintImageXObject, setLineWidth, etc.).

---

### REQ-027: Vector PDF Preprocessing Engine

**Story:** As a system, I need to extract raw vector elements from CAD-exported PDFs so the rule engine can classify geometry deterministically.

**Files:** `lib/extraction/vector-parser.ts` (**NEW**), `lib/extraction/types.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-027A: Vector Element Extraction**
- Extract from each PDF page:
  - Lines (start point, end point, stroke weight, dash style)
  - Arcs (center, radius, start angle, end angle, stroke weight)
  - Paths (compound bezier paths with fill/stroke info)
  - Text objects (content, position, font size, bounding box)
  - Rectangles (position, width, height, stroke/fill)
- All coordinates normalized from PDF points to inches (1 point = 1/72 inch)
- GIVEN a vector PDF page WHEN extracting THEN all geometric primitives returned with normalized coordinates

**REQ-027B: Text Clustering**
- Cluster text objects by spatial proximity into semantic groups:
  - Room names (centered text within enclosed regions)
  - Dimension strings (text near extension lines, matching pattern: `XX'-YY"` or `XX'-Y"`)
  - Notes/annotations (text blocks outside plan boundaries)
  - Title block text (text in bottom-right quadrant matching title block patterns)
  - Sheet titles (large text, typically top of sheet)
- GIVEN scattered text objects WHEN clustering THEN grouped by semantic role with >90% accuracy

**REQ-027C: Sheet Filtering**
- Detect and exclude non-plan sheets:
  - "DETAIL" in sheet title → skip (detail sheets)
  - "CODE" in sheet title → skip (code compliance)
  - Title block-only pages → skip
  - Cover sheets → skip
- GIVEN a multi-sheet PDF WHEN filtering THEN only plan sheets (floor, ceiling, site) proceed to extraction

**Output Type:**
```typescript
interface VectorPage {
  pageNumber: number;
  pageClassification: 'vector' | 'raster' | 'mixed'; // REQ-027D
  sheetType: 'floor_plan' | 'reflected_ceiling' | 'site_plan' | 'elevation' | 'section' | 'detail' | 'code' | 'unknown';
  elements: {
    lines: VectorLine[];
    arcs: VectorArc[];
    paths: VectorPath[];
    texts: TextObject[];
    rectangles: VectorRect[];
  };
  textClusters: {
    roomNames: TextCluster[];
    dimensions: TextCluster[];
    notes: TextCluster[];
    titleBlock: TextCluster | null;
    sheetTitle: TextCluster | null;
  };
  scale: ScaleInfo | null;
}
```

**REQ-027D: Raster PDF Detection** (**NEW**)
- Classify each page as `vector`, `raster`, or `mixed` before processing
- Detection heuristic:
  - `paintImageXObject` covers >90% of page area AND <10 `constructPath` operators → `raster`
  - <10% image area AND >50 `constructPath` operators → `vector`
  - Otherwise → `mixed`
- Raster pages fall back to GPT-4o vision pipeline (REQ-034 fallback)
- Mixed pages get dual processing: vector extraction + GPT-4o for image regions
- GIVEN a scanned PDF page WHEN classifying THEN `pageClassification = 'raster'` and routed to vision fallback
- GIVEN a CAD-exported PDF WHEN classifying THEN `pageClassification = 'vector'` and processed by rule engine

**REQ-027E: Hatch & Dimension Line Filtering** (**NEW**)
- Filter hatching patterns before wall detection to prevent false positives:
  - Detect parallel lines at consistent angle and spacing (tolerance ±0.5°, spacing ±0.1")
  - Group into hatch regions and exclude from geometry classification
- Filter dimension lines:
  - Lines with arrow endpoints (triangular or tick mark terminators)
  - Associated dimension text (matching `XX'-YY"` or metric patterns)
  - Extension lines perpendicular to dimension lines
  - Exclude all from wall/door/window detection
- MUST run before REQ-028 wall detection to prevent thousands of false positive walls from hatch patterns
- GIVEN a floor plan with concrete hatch patterns WHEN filtering THEN hatch lines excluded, only structural lines remain

---

### REQ-028: Geometry Classification Rule Engine

**Story:** As a system, I need to classify vector elements into construction components (walls, doors, windows, rooms) using deterministic geometric rules.

**Files:** `lib/extraction/geometry-classifier.ts` (**NEW**), `lib/extraction/rules/` (**NEW** directory)

**Acceptance Criteria:**

**REQ-028A: Wall Detection**
- Rule 1: Parallel Line Pair
  - Two parallel lines with perpendicular distance between 3"-12"
  - Both lines length > 24"
  - → Classify as WALL
- Rule 2: Filled Rectangle
  - Rectangle with aspect ratio >4:1
  - Thickness 3"-12" (shorter dimension)
  - Has fill (not just stroke)
  - → Classify as WALL
- Rule 3: Thick Single Line
  - Single line with `strokeWidth` converting to 3"-12" at drawing scale
  - Length > 24"
  - → Classify as WALL (thickness = strokeWidth × scale_factor)
- Rule 4: Curved Wall (Bezier)
  - Bezier path with consistent thickness (3"-12")
  - Radius > 36" (filters out door arcs and small curves)
  - → Classify as CURVED_WALL
- Wall intersection handling:
  - T-intersection: wall endpoint within 2" of another wall's midline
  - L-intersection: two walls meeting at ~90° (±5°)
  - X-intersection: two walls crossing (creates 4 wall segments)
- Filter: skip dashed lines (hidden/demolition lines in CAD)
- If wall thickness > 8" → type = `"structural"`
- If wall thickness <= 8" → type = `"partition"`
- Closed wall polygons → candidate room boundaries
- **TI Wall Classification (Tenant Improvement support):**
  - Analyze line weight, style, and fill to classify wall construction status:
    - `new` — new construction walls (typically bold/dark lines, often filled)
    - `existing_to_remain` — existing walls staying (typically lighter/gray lines, or shaded/hatched fill, per legend)
    - `demolition` — walls to be removed (dashed or annotated "DEMO")
  - Detection strategy:
    1. Parse floor plan legend/key (commonly bottom-left or bottom of sheet) for line style definitions
    2. Match legend patterns to wall line properties (strokeWidth, dashArray, fillColor, opacity)
    3. If no legend found: heavy lines = `new`, lighter/gray lines = `existing_to_remain`, dashed = `demolition`
  - Wall output includes `construction_status` field
  - Only `new` walls count toward framing/drywall material quantities (REQ-031)
  - `existing_to_remain` walls count for paint/finish quantities only
  - `demolition` walls generate demo quantities (labor, hauling)
  - CRITICAL for TI projects — the majority of commercial construction work
- GIVEN parallel lines 6" apart and 120" long WHEN classifying THEN detected as partition wall
- GIVEN parallel lines 10" apart and 240" long WHEN classifying THEN detected as structural wall
- GIVEN filled rectangle 6"×120" WHEN classifying THEN detected as partition wall
- GIVEN dashed parallel lines WHEN classifying THEN classified as demolition wall
- GIVEN lighter/gray shaded wall lines matching legend "EXISTING TO REMAIN" WHEN classifying THEN `construction_status = 'existing_to_remain'`
- GIVEN bold/dark wall lines not matching existing legend WHEN classifying THEN `construction_status = 'new'`

**REQ-028B: Door Detection**
- Rule 1: Arc at Wall Gap
  - Arc sweep 80-100° (expanded from 85-95° — too tight for real-world CAD variance)
  - Arc radius between 20"-60" (expanded from 24"-48" — covers commercial doors)
  - Arc endpoint intersects or is within 2" of a wall endpoint
  - → Classify as DOOR
- Rule 2: Polyline Arc
  - 8+ short line segments forming a curve (approximated arc in some CAD exports)
  - Combined sweep ~90° with consistent radius
  - Near wall gap
  - → Classify as DOOR
- Rule 3: Pocket Door
  - Thin rectangle partially inside wall cavity
  - Rectangle width matches wall gap
  - → Classify as POCKET_DOOR
- Rule 4: Sliding Door
  - Two overlapping thin rectangles at wall gap
  - Each rectangle width ~50% of opening
  - → Classify as SLIDING_DOOR
- Rule 5: Bi-fold Door
  - Zigzag pattern of thin rectangles at wall gap
  - → Classify as BIFOLD_DOOR
- Rule 6: Overhead/Garage Door
  - Dashed lines across wide gap (>8' / 96")
  - Wall continues on both sides
  - → Classify as OVERHEAD_DOOR
- Fallback Rule: Universal Wall-Gap Detection
  - Gap in wall 24"-120" wide
  - Wall continues on both sides of gap
  - No other door type matched
  - → Classify as DOOR (low confidence, flagged for review)
- If two mirrored arcs at same wall opening → DOUBLE_DOOR
- Door width = arc radius (single) or arc radius x 2 (double)
- GIVEN 90-degree arc with 36" radius touching wall endpoint WHEN classifying THEN detected as 3'-0" door
- GIVEN polyline with 12 segments forming ~90° curve WHEN classifying THEN detected as door
- GIVEN dashed lines across 16' garage opening WHEN classifying THEN detected as overhead door

**REQ-028C: Window Detection**
- Rule 1: Thin Rectangle in Wall
  - Rectangle embedded within a detected wall segment
  - Rectangle width between 24"-120"
  - Rectangle thickness < wall thickness
  - Parallel lines inside rectangle (mullion pattern) optional
  - → Classify as WINDOW
- Rule 2: Curtain Wall / Storefront
  - Continuous window band >10' (120")
  - Regular mullion lines (vertical lines at consistent spacing within band)
  - → Classify as CURTAIN_WALL
  - Report total width and mullion count
- Window schedule cross-reference:
  - Detect text annotations near windows matching patterns: "W1", "W2", "W-01", etc.
  - Cross-reference with schedule tables if detected on other sheets
  - Include schedule reference in output for reviewer
- Window width = rectangle width
- GIVEN thin rectangle 48" wide embedded in wall WHEN classifying THEN detected as 4'-0" window
- GIVEN 20' continuous window band with 5 mullions WHEN classifying THEN detected as curtain wall

**REQ-028D: Room Detection**
- Algorithm: Wall-Graph Cycle Detection (replaces simple "centered text in polygon")
  - Build graph: walls as edges, intersections as nodes
  - Find minimal cycles (rooms) using planar graph face enumeration
  - This handles complex floorplans with shared walls correctly
- Text assignment: Point-in-Polygon test
  - Use ray casting algorithm for text-to-room assignment
  - Do NOT rely on centroid distance (fails for L-shaped rooms)
  - Each text object tested against all room polygons
- Room classification from text patterns:
  - BR / BEDROOM → `bedroom`
  - KIT / KITCHEN → `kitchen`
  - LR / LIVING → `living_room`
  - BA / BATH → `bathroom`
  - MECH / MECHANICAL → `mechanical`
  - STOR / STORAGE → `storage`
  - GAR / GARAGE → `garage`
  - OFFICE / OFF → `office`
  - LAUNDRY / LAU → `laundry`
  - CLOSET / CL → `closet`
- Area calculation: Shoelace formula with proper winding order
  - `room_area = |Σ(x_i × y_{i+1} - x_{i+1} × y_i)| / 2 × scale_factor²`
  - Ensures correct area regardless of vertex order (CW vs CCW)
- Compute: `room_perimeter = sum(wall segment lengths) × scale_factor`
- GIVEN closed wall polygon with "KITCHEN" text inside WHEN detecting THEN room created with name="KITCHEN", classification="kitchen", area, perimeter
- GIVEN open wall polygon (gap > door width) WHEN detecting THEN room NOT created (flagged for review)
- GIVEN L-shaped room with text in one wing WHEN assigning THEN text correctly assigned via point-in-polygon

---

### REQ-029: Scale Detection and Calibration

**Story:** As a system, I need to determine the drawing scale to convert vector measurements to real-world dimensions.

**File:** `lib/extraction/scale-detector.ts` (**NEW**)

**Acceptance Criteria:**

**Scale detection uses a 6-priority cascade — each method tried in order, stopping at first success:**

**REQ-029A: Priority 1 — PDF Metadata Check**
- Check PDF metadata/info dict for embedded scale (common in CAD exports from AutoCAD, Revit)
- Parse `/UserUnit` and custom metadata keys
- If found: `scale_confidence = "metadata"` (highest confidence)
- GIVEN AutoCAD-exported PDF with embedded scale metadata WHEN checking THEN scale extracted without page analysis

**REQ-029B: Priority 2 — Title Block Parsing**
- Search bottom-right quadrant of page (typical title block location)
- Extract text matching scale patterns near "SCALE:" or "DRAWING SCALE:" labels
- Architectural scale patterns:
  - `1/8" = 1'-0"` → scale_factor = 96
  - `3/16" = 1'-0"` → scale_factor = 64
  - `1/4" = 1'-0"` → scale_factor = 48
  - `3/8" = 1'-0"` → scale_factor = 32
  - `1/2" = 1'-0"` → scale_factor = 24
  - `1" = 1'-0"` → scale_factor = 12
- Engineering scale patterns:
  - `1" = 10'` → scale_factor = 120
  - `1" = 20'` → scale_factor = 240
  - `1" = 30'` → scale_factor = 360
  - `1" = 40'` → scale_factor = 480
  - `1" = 50'` → scale_factor = 600
  - `1" = 100'` → scale_factor = 1200
- Metric scale patterns:
  - `1:50` → scale_factor = 50
  - `1:100` → scale_factor = 100
  - `1:200` → scale_factor = 200
  - `1:500` → scale_factor = 500
- `Scale: X" = Y'-Z"` → compute scale_factor dynamically
- If found: `scale_confidence = "explicit"`
- GIVEN text "1/4\" = 1'-0\"" in title block WHEN detecting scale THEN scale_factor = 48

**REQ-029C: Priority 3 — Scale Bar Detection**
- Detect graphic scale bars:
  - Horizontal line with tick marks at regular intervals
  - Numeric labels at tick marks (e.g., "0", "5'", "10'", "20'")
  - Compute scale from tick spacing vs labeled distance
- If found: `scale_confidence = "scale_bar"`
- GIVEN graphic scale bar with ticks labeled 0-10'-20' WHEN measuring tick spacing THEN scale_factor computed

**REQ-029D: Priority 4 — Dimension String Calibration**
- Find dimension strings (e.g., `24'-6"`, `12'-0"`)
- Measure vector distance between corresponding extension line endpoints
- `scale_factor = real_dimension_inches / vector_distance_inches`
- Outlier rejection: compute scale from 3+ dimensions, reject values >2σ from median
- Use median of remaining values as final scale_factor
- If found: `scale_confidence = "calibrated"`
- GIVEN 5 dimension strings with computed scales [48, 48, 47.8, 48.2, 96] WHEN calibrating THEN outlier 96 rejected, scale_factor = 48

**REQ-029E: Priority 5 — Known Sheet Size Inference**
- If sheet size is known (from PDF MediaBox):
  - ARCH D (24"×36") + residential plan → likely 1/4" = 1'-0" (48)
  - ARCH E (36"×48") + commercial plan → likely 1/8" = 1'-0" (96)
  - ANSI D (22"×34") → similar to ARCH D
- Flag as `scale_confidence = "inferred"` (low confidence, flagged for review)
- Only used when all higher-priority methods fail

**REQ-029F: Priority 6 — Multi-Scale Zone Detection**
- Detect detail views with different scales on same page
- Detail bubbles: circles with text like "DETAIL A" and separate scale notation
- Each zone gets its own `ScaleInfo` with boundary coordinates
- Elements within detail zones use zone-specific scale
- GIVEN floor plan at 1/4"=1'-0" with detail callout at 1/2"=1'-0" WHEN detecting THEN two scale zones identified

**REQ-029G: User Calibration Fallback**
- If no automatic method succeeds:
  - Return `scale: null` with `requires_calibration: true`
  - Frontend prompts user to:
    1. Click two points on the plan
    2. Enter the real-world distance between them
    3. System computes scale_factor from that input
  - Flag `scale_confidence` as `"user_provided"`
- GIVEN no automatic scale detection succeeds WHEN processing THEN `requires_calibration: true` returned

---

### REQ-030: Reflected Ceiling Plan (RCP) Rules

**Story:** As a system, I need to extract ceiling quantities from RCP sheets.

**File:** `lib/extraction/rules/ceiling-rules.ts` (**NEW**)

**Acceptance Criteria:**
- Detect RCP sheets via sheet title containing "REFLECTED CEILING PLAN" or "RCP"
- Detect ceiling grid: evenly spaced orthogonal line patterns (typically 2'x2' or 2'x4')
- Detect light fixtures: rectangle with internal cross pattern (±symbol tolerance)
- Detect diffusers: square with concentric line pattern
- Compute: `ceiling_area` per room (from room polygons)
- Compute: `fixture_count` (light fixtures detected)
- Compute: `diffuser_count` (HVAC diffusers detected)
- GIVEN RCP sheet with 2x4 grid WHEN extracting THEN grid_size, ceiling_area, fixture_count, diffuser_count returned

---

### REQ-031: Quantity Calculation Engine

**Story:** As a system, I need to compute construction quantities from detected geometry for estimation.

**File:** `lib/extraction/quantity-calculator.ts` (**NEW**)

**Acceptance Criteria:**

**Drywall:**
- `wall_area = wall_length × ceiling_height - door_openings - window_openings`
- Ceiling height: extract from section drawings or use default (9'-0" if not found, flagged for review)
- Both sides of partition walls counted (×2)
- One side of exterior/structural walls
- **TI filtering:** Only walls with `construction_status = 'new'` count toward drywall quantities
- Walls with `construction_status = 'existing_to_remain'` → paint/finish quantities only
- Walls with `construction_status = 'demolition'` → generate demo quantities (SF of demo drywall)

**Flooring:**
- `total_flooring = sum(room_area)` for all detected rooms
- Exclude rooms tagged as "unfinished" or "mechanical"

**Baseboard/Trim:**
- `baseboard_lf = room_perimeter - sum(door_widths)` per room
- Total = sum across all rooms

**Ceiling:**
- `ceiling_sf = ceiling_area` per room (from RCP or room polygons)

**Doors/Windows:**
- Count from geometry detection (REQ-028B, REQ-028C)
- Include sizes for scheduling

---

### REQ-032: Confidence Scoring System

**Story:** As a system, I need to score extraction confidence so reviewers know which items to verify.

**File:** `lib/extraction/confidence-scorer.ts` (**NEW**)

**Acceptance Criteria:**

**Scoring Components (0-100, graduated):**
| Component | Points | Condition |
|-----------|--------|-----------|
| Vector geometry match | 0-50 | Graduated: exact rule match (50), partial match (25-40), weak match (10-20) |
| Text validation | 0-20 | Associated text confirms classification (room name, dimension label, schedule ref) |
| Dimension confirmation | 0-15 | Scale-converted measurement falls within expected range for component type |
| Symbol match | 0-15 | CAD symbol block matches known pattern library |

**Penalty System:**
| Penalty | Points | Condition |
|---------|--------|-----------|
| Conflicting signals | -20 | Multiple rules match same element with different classifications |
| Ambiguous geometry | -10 | Element partially matches multiple rules |
| Scale missing | -15 | No scale detected for page (all dimensions uncertain) |
| Low element density | -5 | Few supporting elements nearby (isolated wall segment, etc.) |

**Thresholds:**
- Score >= 70 → `needs_review: false` (auto-accepted)
- Score 40-69 → `needs_review: true` (flagged for human review)
- Score < 40 → `needs_review: true` + `low_confidence_warning` in output

**Review Flags (auto-generated):**
- Scale uncertain (no explicit scale text found)
- Overlapping room polygons detected
- Wall thickness inconsistent within same sheet
- Arc not matched to any wall endpoint
- Text cluster outside all room boundaries
- Open polygon (room boundary not closed)

---

### REQ-033: Structured Output Schema

**Story:** As a system, I need to produce estimation-ready JSON output from the extraction engine.

**File:** `lib/extraction/types.ts` (extends REQ-027)

**Output Schema:**
```typescript
interface ExtractionResult {
  // Project-level summary
  project_summary: {
    gross_sqft: number;
    total_rooms: number;
    total_walls_lf: number;
    new_walls_lf: number;          // TI: only new construction
    existing_walls_lf: number;     // TI: existing to remain
    demo_walls_lf: number;         // TI: demolition
    total_doors: number;
    total_windows: number;
    total_equipment: number;       // from schedule extraction
    total_plumbing_fixtures: number;
    total_electrical_devices: number;
    sheets_processed: number;
    sheets_skipped: number;
    schedules_extracted: number;   // count of tables parsed
  };

  // Per-room breakdown
  rooms: Array<{
    name: string;
    area_sqft: number;
    perimeter_ft: number;
    ceiling_height_ft: number | null;
    floor_type: string | null; // from finish schedule if available
    wall_segments: number;
    doors: number;
    windows: number;
    confidence_score: number;
  }>;

  // Wall inventory
  walls: Array<{
    length_ft: number;
    thickness_in: number;
    type: 'partition' | 'structural';
    construction_status: 'new' | 'existing_to_remain' | 'demolition'; // TI classification
    rooms_adjacent: string[]; // room names on each side
    confidence_score: number;
  }>;

  // Opening inventory
  doors: Array<{
    width_ft: number;
    type: 'single' | 'double' | 'pocket' | 'sliding' | 'bifold' | 'overhead';
    room: string | null;
    confidence_score: number;
  }>;

  windows: Array<{
    width_ft: number;
    room: string | null;
    confidence_score: number;
  }>;

  // Ceiling data (from RCP)
  ceiling: {
    total_area_sqft: number;
    grid_type: string | null; // '2x2', '2x4', 'gypsum', etc.
    light_fixtures: number;
    diffusers: number;
    confidence_score: number;
  } | null;

  // Computed quantities for estimation
  quantities: {
    drywall_sf: number;       // new walls only
    flooring_sf: number;
    baseboard_lf: number;
    ceiling_sf: number;
    paint_sf: number;         // all walls (new + existing_to_remain)
    demo_drywall_sf: number;  // demolition walls
    demo_framing_lf: number;  // demolition wall framing
  };

  // Equipment schedule (from REQ-038)
  equipment: Array<{
    name: string;
    model: string | null;
    dimensions: string | null;    // e.g., "36\"W x 30\"D x 35\"H"
    utility_requirements: string | null; // e.g., "208V/3PH/60HZ"
    quantity: number;
    sheet_reference: string;      // e.g., "A-3"
    confidence_score: number;
  }> | null;

  // Finish schedule (from REQ-039)
  finishes: Array<{
    room_name: string;
    floor: string | null;         // e.g., "CT-1" (Ceramic Tile Type 1)
    base: string | null;
    wall: string | null;
    paint: string | null;
    ceiling: string | null;
    confidence_score: number;
  }> | null;

  // MEP summary (from REQ-040-042)
  mep: {
    electrical: {
      panel_size_amps: number | null;
      outlet_count: number;
      switch_count: number;
      lighting_fixture_count: number;
      dedicated_circuits: number;
    } | null;
    plumbing: {
      fixture_count: number;
      fixtures: Array<{ type: string; count: number }>;
      water_heater: string | null;
      grease_interceptor: boolean;
    } | null;
    hvac: {
      unit_count: number;
      total_tonnage: number | null;
      duct_lf: number;
      diffuser_count: number;
    } | null;
  } | null;

  // Quality metadata
  extraction_meta: {
    scale_method: 'metadata' | 'explicit' | 'scale_bar' | 'calibrated' | 'inferred' | 'user_provided' | null;
    scale_factor: number | null;
    overall_confidence: number; // 0-100
    requires_review: boolean;
    review_flags: string[];
    processing_time_ms: number;
  };
}
```

**Mapping to Existing Schema:**
- `ExtractionResult.rooms` → `takeoff_items` with category `"architectural"`, sub_type `"room"`
- `ExtractionResult.walls` → `takeoff_items` with category `"structural"|"architectural"`, sub_type `"wall"`
- `ExtractionResult.doors` → `takeoff_items` with category `"architectural"`, sub_type `"door"`
- `ExtractionResult.windows` → `takeoff_items` with category `"architectural"`, sub_type `"window"`
- `ExtractionResult.quantities` → `takeoff_items` with computed quantities (drywall, flooring, baseboard, ceiling, paint)
- `ExtractionResult.ceiling` → `takeoff_items` with category `"architectural"`, sub_type `"ceiling"`
- `ExtractionResult.equipment` → `takeoff_items` with category `"food_service"|"hvac"|"plumbing"`, sub_type from equipment type
- `ExtractionResult.finishes` → enriches room `takeoff_items` with material specifications
- `ExtractionResult.mep.electrical` → `takeoff_items` with category `"electrical"`, sub_types per device type
- `ExtractionResult.mep.plumbing` → `takeoff_items` with category `"plumbing"`, sub_types per fixture type
- `ExtractionResult.mep.hvac` → `takeoff_items` with category `"hvac"`, sub_types per equipment/duct type
- All items pass through existing `normalizeTakeoffItem()` for trade inference and waste factors

---

### REQ-034: Extraction Router with GPT-4o Fallback

**Story:** As a developer, the extraction pipeline must route between vector engine and GPT-4o vision based on PDF type and configuration.

**Files:** `app/api/estimates/parse/route.ts`, `app/api/estimates/extract/route.ts` (**NEW**), `lib/ai/parse-prompt.ts`

**Feature Flag:** `EXTRACTION_ENGINE` environment variable:
| Value | Behavior |
|-------|----------|
| `vector` | All pages use vector extraction engine (fails on raster PDFs) |
| `openai` | All pages use GPT-4o vision (legacy behavior) |
| `auto` (default) | Vector for vector PDFs, GPT-4o for raster PDFs (per REQ-027D classification) |

**Acceptance Criteria:**
- Keep `/api/estimates/parse` endpoint functional (NOT deprecated) — used for `openai` and `auto` modes
- Keep `lib/ai/parse-prompt.ts` and `lib/ai/normalize-takeoff.ts` intact (reused by both engines)
- Add new endpoint: `POST /api/estimates/extract` as the primary entry point
- New endpoint accepts `{ planUploadId, pageIds? }` (same interface as old parse)
- New endpoint reads `EXTRACTION_ENGINE` env var to determine routing:
  - `auto` mode: classify each page via REQ-027D, route vector pages to rule engine, raster pages to `/api/estimates/parse`
  - `vector` mode: all pages to rule engine, return error for raster pages
  - `openai` mode: all pages to GPT-4o vision pipeline
- Both engines write to same `takeoff_items` table via `normalizeTakeoffItem()`
- Budget/usage logging: vector extraction logs `cost: 0`, `model: "vector-engine-v1"`; GPT-4o logs actual cost
- GIVEN `auto` mode and vector PDF WHEN extracting THEN vector engine processes pages
- GIVEN `auto` mode and raster PDF WHEN extracting THEN GPT-4o vision processes pages
- GIVEN `auto` mode and mixed PDF WHEN extracting THEN vector pages use rule engine, raster pages use GPT-4o

---

### REQ-035: Worker Queue System (**NEW**)

**Story:** As a system, I need a reliable extraction pipeline that processes multi-page PDFs with dependency tracking, retries, and heartbeat monitoring.

**Files:** `lib/extraction/worker-queue.ts` (**NEW**), `supabase/migrations/extraction_jobs.sql` (**NEW**)

**Architecture:** Supabase PGMQ-based job queue using `SKIP LOCKED` for concurrent worker claims.

**Database Schema:**
```sql
CREATE TABLE extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id UUID NOT NULL REFERENCES plan_uploads(id),
  page_number INTEGER NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'extract_vectors',
    'classify_sheet',
    'detect_scale',
    'detect_elements',
    'detect_rooms',
    'extract_schedules',
    'extract_mep',
    'calculate_quantities',
    'cross_page_reconcile',
    'generate_estimate'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'processing', 'completed', 'failed', 'dead_letter')),
  depends_on UUID[] DEFAULT '{}',
  result JSONB,
  error TEXT,
  attempt INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  claimed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status) WHERE status IN ('pending', 'claimed');
CREATE INDEX idx_extraction_jobs_plan ON extraction_jobs(plan_upload_id);
```

**Job Claim Function:**
```sql
CREATE FUNCTION claim_extraction_job(worker_id TEXT)
RETURNS extraction_jobs AS $$
  UPDATE extraction_jobs
  SET status = 'claimed', claimed_at = now(), attempt = attempt + 1
  WHERE id = (
    SELECT id FROM extraction_jobs
    WHERE status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(depends_on) dep_id
        JOIN extraction_jobs dep ON dep.id = dep_id
        WHERE dep.status != 'completed'
      )
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$ LANGUAGE sql;
```

**Pipeline Stages (per page):**
1. `extract_vectors` — Parse PDF page via pdfjs-dist (REQ-027)
2. `classify_sheet` — Determine vector/raster/mixed + sheet type (REQ-027C-D)
3. `detect_scale` — Run 6-priority scale cascade (REQ-029)
4. `detect_elements` — Wall/door/window detection (REQ-028, incl. TI classification)
5. `detect_rooms` — Room detection via wall graph (REQ-028D)
6. `extract_schedules` — Table/schedule extraction from schedule sheets (REQ-038-039)
7. `extract_mep` — Electrical/plumbing/HVAC extraction from MEP sheets (REQ-040-042)
8. `calculate_quantities` — Compute construction quantities (REQ-031)

**Cross-page stages (after all pages complete):**
9. `cross_page_reconcile` — Merge duplicate rooms across sheets, resolve scale conflicts, cross-reference schedules with geometric detection
10. `generate_estimate` — Final ExtractionResult assembly + confidence scoring (REQ-032-033)

**Acceptance Criteria:**
- GIVEN 10-page PDF upload WHEN processing THEN 10×6 page jobs + 2 cross-page jobs created
- GIVEN job with unmet dependencies WHEN claiming THEN job NOT returned (waits for deps)
- GIVEN job with no heartbeat for 60 seconds WHEN monitoring THEN job status reset to `pending`
- GIVEN job failed 3 times WHEN retrying THEN job moved to `dead_letter` status
- GIVEN all page jobs completed WHEN checking THEN cross-page jobs become claimable

---

### REQ-036: Real-time Progress Updates (**NEW**)

**Story:** As a PM, I want to see extraction progress in real-time instead of polling, so I know how far along my plan upload is.

**Files:** `lib/extraction/progress-tracker.ts` (**NEW**), `components/estimates/ExtractionProgress.tsx` (**NEW**)

**Acceptance Criteria:**
- Subscribe to `extraction_jobs` table changes via Supabase Realtime
- Filter by `plan_upload_id` for current upload
- Compute progress: `completed_jobs / total_jobs × 100`
- Display current stage name for in-progress jobs
- Show per-page status (pending/processing/completed/failed)
- Replace current polling mechanism with WebSocket push
- GIVEN extraction in progress WHEN job completes THEN progress bar updates within 500ms
- GIVEN all jobs completed WHEN listening THEN automatic transition to review step
- GIVEN job fails WHEN listening THEN error shown with retry option

---

### REQ-037: Additional Element Detection (**NEW** — Phase 2)

**Story:** As a system, I need to detect additional construction elements beyond walls/doors/windows for more complete takeoffs.

**Files:** `lib/extraction/rules/stair-rules.ts` (**NEW**), `lib/extraction/rules/column-rules.ts` (**NEW**), `lib/extraction/rules/elevator-rules.ts` (**NEW**)

> **Priority:** Phase 2 — implement after core wall/door/window detection is validated with real plans.

**REQ-037A: Stair Detection**
- Parallel lines (treads) perpendicular to stair run direction
- Direction arrow (triangle or line with arrowhead) indicating UP/DN
- Text annotation: "UP", "DN", "DOWN"
- Tread count × tread depth = stair run length
- → Classify as STAIR with direction, tread count, width
- GIVEN parallel lines with "UP" text and direction arrow WHEN classifying THEN detected as stair

**REQ-037B: Column Detection**
- Small filled squares (12"×12" to 36"×36") or circles (12"-36" diameter) at regular grid spacing
- Grid regularity: columns at consistent X and/or Y intervals (±2")
- → Classify as COLUMN with size, grid spacing, count
- GIVEN 8 filled 24"×24" squares at 20' grid WHEN classifying THEN detected as column grid (8 columns, 20' spacing)

**REQ-037C: Elevator Detection**
- Large rectangle (6'×8' minimum)
- Internal cross pattern (diagonal lines corner to corner) or door symbol
- Text: "ELEV", "ELEVATOR", or elevator number
- → Classify as ELEVATOR with size, count
- GIVEN 7'×8' rectangle with cross pattern and "ELEV" text WHEN classifying THEN detected as elevator

---

### REQ-038: Table/Schedule Extraction Engine (**NEW**)

**Story:** As a system, I need to extract structured tabular data from plan schedules (equipment, door, fixture, panel schedules) because schedules contain precise specifications that geometric detection cannot capture.

> **Validated against:** 140 W Valley Blvd commercial restaurant TI — equipment schedule (A-3, 30+ items), door schedule (A-2), plumbing fixture schedule (P0), electrical panel schedule (E1), finish schedule (A-2.1). Schedules account for 40-60% of estimable data on commercial TI plans.

**Files:** `lib/extraction/schedule-parser.ts` (**NEW**), `lib/extraction/rules/schedule-rules.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-038A: Table Detection**
- Detect tabular structures on plan pages:
  - Grid of horizontal and vertical lines forming cells
  - Consistent row heights and column widths (tolerance ±5%)
  - Header row detection (bold text, shaded cells, or first row with different formatting)
- Classify table type by header content:
  - Headers containing "EQUIPMENT", "MODEL", "MFR" → `equipment_schedule`
  - Headers containing "DOOR", "MARK", "SIZE", "TYPE" → `door_schedule`
  - Headers containing "FIXTURE", "GPM", "TRAP" → `plumbing_fixture_schedule`
  - Headers containing "CIRCUIT", "BREAKER", "LOAD" → `panel_schedule`
  - Headers containing "ROOM", "FLOOR", "BASE", "WALL", "CEILING" → `finish_schedule`
  - Headers containing "WINDOW", "MARK", "SIZE", "GLAZING" → `window_schedule`
- GIVEN a page with horizontal/vertical grid lines forming cells with text WHEN detecting THEN table boundaries and cell contents extracted

**REQ-038B: Equipment Schedule Extraction**
- Parse equipment schedule tables extracting per row:
  - Item number/mark
  - Equipment name/description
  - Manufacturer and model number
  - Dimensions (W × D × H)
  - Utility requirements (voltage, phase, BTU, gas, water connections)
  - Quantity
- Map equipment to trade categories:
  - Kitchen equipment → `food_service`
  - HVAC units → `hvac`
  - Plumbing fixtures → `plumbing`
- GIVEN equipment schedule with 30 rows WHEN parsing THEN all items extracted with name, model, dimensions, utility requirements
- GIVEN equipment item "WALK-IN COOLER, 8'×10'×8'H, 208V/1PH" WHEN parsing THEN dimensions and electrical requirements extracted separately

**REQ-038C: Door Schedule Extraction**
- Parse door schedule tables extracting:
  - Door mark (D1, D2, etc.)
  - Size (width × height)
  - Type (solid, glass, hollow metal, wood)
  - Frame type
  - Hardware set
  - Fire rating
- Cross-reference with geometrically detected doors (REQ-028B) to enrich data
- GIVEN door schedule row "D1, 3'-0"×7'-0", GLASS, AL FRAME, HW-1" WHEN parsing THEN door enriched with material specifications

**REQ-038D: Plumbing Fixture Schedule Extraction**
- Parse fixture schedules from P-sheets:
  - Fixture type (water closet, lavatory, sink, floor drain, etc.)
  - Mark/identifier
  - Manufacturer and model
  - Connection sizes
  - Flow rates (GPM)
  - Trap size
  - Quantity
- GIVEN plumbing fixture schedule WHEN parsing THEN fixture counts and specifications extracted

**REQ-038E: Electrical Panel Schedule Extraction**
- Parse panel schedules from E-sheets:
  - Panel identifier (e.g., "PANEL A")
  - Main breaker size (amps)
  - Voltage/phase (e.g., 208V/3PH)
  - Circuit list with: circuit number, description, breaker size, load (watts/amps)
  - Total connected load
- GIVEN panel schedule "PANEL A, 200A, 208V/3PH" with 42 circuits WHEN parsing THEN panel specs and all circuits extracted

---

### REQ-039: Finish Schedule → Room Mapping (**NEW**)

**Story:** As a PM, I need finish specifications mapped to rooms so material quantities reflect the actual specified finishes per space (tile in kitchens, carpet in offices, etc.) rather than generic assumptions.

> **Validated against:** 140 W Valley Blvd A-2.1 — finish schedule grid with floor/base/wall/paint/ceiling per room name. Standard on all commercial projects.

**File:** `lib/extraction/rules/finish-rules.ts` (**NEW**)

**Acceptance Criteria:**

- Detect finish schedule tables (via REQ-038A with `finish_schedule` classification)
- Parse room-to-finish mapping: room name → floor type, base type, wall finish, paint spec, ceiling type
- Decode common finish abbreviations:
  - Floor: CT (ceramic tile), VCT (vinyl composition tile), CPT (carpet), CONC (concrete), EPX (epoxy), HWD (hardwood), PORC (porcelain)
  - Base: RB (rubber base), CB (ceramic base), WB (wood base), VB (vinyl base)
  - Wall: GWB (gypsum wallboard), FRP (fiberglass reinforced panel), CT (ceramic tile), PORC (porcelain)
  - Ceiling: ACT (acoustic ceiling tile), GWB (gypsum), EXP (exposed structure), SCC (suspended ceiling)
- Cross-reference with detected rooms (REQ-028D) — match by room name
- Enrich `ExtractionResult.finishes[]` with decoded finish types
- When finish type known, refine quantity estimates:
  - Ceramic tile rooms → flooring unit = SF with tile waste factor (15%)
  - Carpet rooms → flooring unit = SY with carpet waste factor (10%)
  - FRP wall rooms → additional wall finish SF quantity
- GIVEN finish schedule mapping "KITCHEN" → floor: CT-1, wall: FRP WHEN extracting THEN kitchen room enriched with ceramic tile flooring and FRP wall finish
- GIVEN room detected but not in finish schedule WHEN mapping THEN `finishes = null` for that room (flagged for review)

---

### REQ-040: Electrical Fixture/Outlet Extraction (**NEW**)

**Story:** As a PM, I need electrical device counts from power plans so the electrical scope can be estimated without manually counting every outlet and switch.

> **Validated against:** 140 W Valley Blvd E1-E3 — panel schedule (200A, 42 circuits), power plan with outlets/switches, reflected ceiling plan with lighting fixtures.

**Files:** `lib/extraction/rules/electrical-rules.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-040A: Power Plan Device Counting**
- Detect electrical sheet types: E-prefix sheets, titles containing "POWER", "ELECTRICAL"
- Count devices by symbol type:
  - Duplex outlet (circle with two parallel lines): count
  - GFI outlet (circle with "GFI" or "GFCI" text): count
  - 220V/dedicated outlet (circle with special mark): count
  - Single-pole switch (S): count
  - 3-way switch (S3): count
  - Dimmer switch (SD): count
  - Junction box (square with X): count
- Symbol matching: use PDF symbol blocks or pattern-match known electrical symbols
- GIVEN power plan with 25 duplex outlets, 4 GFI outlets, 3 dedicated circuits WHEN counting THEN accurate device counts returned

**REQ-040B: Lighting Fixture Counting (Enhancement to REQ-030)**
- On electrical RCP sheets (E-prefix RCP), detect and count lighting fixtures by type:
  - Recessed can lights (circle symbols)
  - 2×4 troffers (rectangle with internal lines)
  - Linear fixtures (elongated rectangles)
  - Track lighting (dashed lines with fixture marks)
  - Exit signs (triangle or rectangle with "EXIT" text)
  - Emergency lights (circle with "EM" or battery symbol)
- Cross-reference with lighting fixture schedule if present
- GIVEN electrical RCP with 15 recessed cans, 8 troffers, 2 exit signs WHEN counting THEN fixture types and counts returned

**REQ-040C: Panel Summary**
- Extract from panel schedule (via REQ-038E):
  - Total panel count
  - Main breaker sizes
  - Total circuit count
  - Dedicated circuit count
- GIVEN 1 panel, 200A main, 42 circuits WHEN summarizing THEN electrical summary populated

---

### REQ-041: Plumbing Fixture Extraction (**NEW**)

**Story:** As a PM, I need plumbing fixture counts and specifications from plumbing plans so the plumbing scope can be estimated.

> **Validated against:** 140 W Valley Blvd P0-P2 — fixture schedule (15+ fixtures), cold/hot water plan, waste/vent plan, grease interceptor, water heater.

**Files:** `lib/extraction/rules/plumbing-rules.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-041A: Fixture Schedule Parsing**
- Extract from plumbing fixture schedule (via REQ-038D):
  - Total fixture count by type
  - Water closets (floor-mounted, wall-mounted)
  - Lavatories
  - Sinks (kitchen, bar, mop, hand)
  - Floor drains
  - Floor sinks
  - Hose bibbs
  - Drinking fountains
- GIVEN fixture schedule with 3 water closets, 3 lavatories, 5 sinks, 4 floor drains WHEN parsing THEN fixture summary returned with counts

**REQ-041B: Plumbing Plan Symbol Counting**
- On P-prefix sheets, detect plumbing symbols:
  - Fixture symbols matching schedule marks
  - Cleanouts (CO)
  - Backflow preventers (BFP)
  - Water heater (WH or tank symbol)
  - Grease interceptor/trap (GI or labeled)
- GIVEN water plan showing water heater and grease interceptor WHEN detecting THEN `water_heater` and `grease_interceptor` fields populated

**REQ-041C: Pipe Run Estimation** (Phase 2)
- Trace pipe routing on P1/P2 sheets:
  - Hot water pipe runs (LF)
  - Cold water pipe runs (LF)
  - Waste pipe runs (LF) by size
  - Vent pipe runs (LF) by size
- Use pipe size annotations on plans (e.g., "3/4\" CW", "2\" W")
- GIVEN hot water plan with labeled pipe runs WHEN tracing THEN total LF by pipe size returned
- > Note: Phase 2 — implement after symbol counting is validated

---

### REQ-042: HVAC Duct Extraction (**NEW**)

**Story:** As a PM, I need HVAC equipment and duct quantities from mechanical plans so the mechanical scope can be estimated.

> **Validated against:** 140 W Valley Blvd M0-M3.0 — HVAC notes, duct plan, rooftop unit schedule, ventilation calculations.

**Files:** `lib/extraction/rules/hvac-rules.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-042A: HVAC Equipment Schedule**
- Extract from mechanical equipment schedule (via REQ-038B or M-sheet tables):
  - Unit identifier (RTU-1, FCU-1, etc.)
  - Type (rooftop unit, fan coil, split system, exhaust fan, MAU)
  - Capacity (tons, BTU/h, CFM)
  - Electrical requirements
  - Refrigerant type
  - Quantity
- GIVEN HVAC schedule with "RTU-1, 5 TON, 208V/3PH" WHEN parsing THEN unit specs extracted

**REQ-042B: Duct Run Measurement**
- On M-prefix duct plan sheets:
  - Detect duct routing by line style (supply = solid, return = dashed, exhaust = dash-dot per legend)
  - Measure duct run lengths (LF) by size
  - Read duct size annotations (e.g., "12×8", "10\" Ø")
  - Count duct fittings: elbows, tees, transitions, end caps
- GIVEN duct plan with labeled runs WHEN measuring THEN total duct LF by size and type returned

**REQ-042C: Diffuser/Register Counting (Enhancement to REQ-030)**
- On mechanical plans, count:
  - Supply diffusers by size
  - Return air grilles by size
  - Exhaust grilles
  - Thermostats
- Cross-reference with diffuser schedule if present
- GIVEN duct plan with 12 supply diffusers, 4 return grilles WHEN counting THEN counts by type and size returned

---

### Migration Strategy

1. **Phase 1:** Build vector extraction engine (REQ-027–033) + TI wall classification as new files in `lib/extraction/`
2. **Phase 2:** Create `/api/estimates/extract` endpoint with auto-routing (REQ-034)
3. **Phase 3:** Build worker queue system (REQ-035) and real-time progress (REQ-036)
4. **Phase 3b:** Build table/schedule extraction engine (REQ-038) — high ROI, unlocks equipment/door/fixture/panel/finish data
5. **Phase 4:** Update frontend to call `/api/estimates/extract` instead of `/api/estimates/parse`
6. **Phase 5:** Add finish schedule mapping (REQ-039) and MEP extraction (REQ-040–042)
7. **Phase 6:** Add additional element detection (REQ-037) based on field feedback

**Routing:** Feature flag `EXTRACTION_ENGINE=auto|vector|openai` controls extraction routing:
- `auto` (default): vector engine for vector PDFs, GPT-4o fallback for raster PDFs
- `vector`: force vector engine only (for testing)
- `openai`: force GPT-4o only (rollback to legacy behavior)

**Accuracy Expectations:** Rule-based MVP targets 60-70% accuracy for element detection. This is acceptable because:
- All items go through human review step (confidence scoring flags uncertain items)
- Iterative improvement: rules tuned based on real plan feedback
- Zero per-page cost enables re-processing after rule improvements

### Expected Accuracy by Tier (Validated Against Real Commercial TI Plan)

> Baseline: 140 W Valley Blvd, Unit 118-B — 26-page commercial restaurant TI plan set (ARCH D, Adobe Acrobat Pro/CAD export). Includes architectural, mechanical, electrical, plumbing sheets with equipment schedules, finish schedules, and MEP plans.

| Data Category | Pre-v2.3 (Tiers 1-2 only) | Post-v2.3 (All Tiers) | Tier Required |
|---|---|---|---|
| Sheet filtering | ~85% | ~90% | Tier 1 |
| Scale detection | ~95% | ~95% | Tier 1 |
| Wall detection (all walls) | ~65% | ~75% | Tier 1 |
| **Wall classification (new/existing/demo)** | **0%** | **~70%** | **Tier 1 (TI enhancement)** |
| Door detection (geometric) | ~70% | ~80% | Tier 1 |
| Door specifications (schedule) | 0% | ~85% | Tier 4 (REQ-038C) |
| Window/storefront | ~40% | ~55% | Tier 2 |
| Room detection | ~60% | ~65% | Tier 2 |
| Room areas | ~70% | ~75% | Tier 2 |
| Drywall qty (new walls only) | 0% | ~65% | Tier 1 + Tier 2 |
| Flooring qty | ~50% | ~70% | Tier 2 + Tier 4 (finishes) |
| Ceiling quantities | ~60% | ~65% | Tier 3 |
| Light fixture counts | ~50% | ~70% | Tier 3 + Tier 5 |
| **Finish schedule extraction** | **0%** | **~80%** | **Tier 4 (REQ-039)** |
| **Equipment schedule extraction** | **0%** | **~85%** | **Tier 4 (REQ-038B)** |
| **Electrical device counts** | **0%** | **~65%** | **Tier 5 (REQ-040)** |
| **Plumbing fixture counts** | **0%** | **~80%** | **Tier 5 (REQ-041)** |
| **HVAC unit specs** | **0%** | **~75%** | **Tier 5 (REQ-042)** |
| **HVAC duct quantities** | **0%** | **~50%** | **Tier 5 (REQ-042B)** |

**Overall estimable data captured:**
- Pre-v2.3 (Tiers 1-2): ~**30-40%** of what a GC needs for a commercial TI estimate
- Post-v2.3 (All Tiers): ~**70-80%** of what a GC needs for a commercial TI estimate
- Remaining ~20-30%: casework/millwork details, specialty items, labor-specific scope, code-driven requirements that require human judgment

### Implementation Tiers

| Tier | Requirements | Scope |
|------|-------------|-------|
| Tier 1 (MVP) | REQ-027A-E, 028A-B (incl. TI classification), 029A-D, 032, 034 | Vector extract, walls (new/existing/demo), doors, basic scale, confidence, routing |
| Tier 2 (Core) | REQ-028C-D, 029E-G, 031, 033 | Windows, rooms, full scale cascade, quantities, output schema |
| Tier 3 (Infrastructure) | REQ-030, 035, 036, **038** | RCP rules, worker queue, real-time progress, **table/schedule extraction** |
| Tier 4 (Schedules & Finishes) | **REQ-038B-E, 039** | Equipment/door/fixture/panel schedule parsing, finish schedule mapping |
| Tier 5 (MEP) | **REQ-040, 041, 042** | Electrical counting, plumbing fixtures, HVAC duct extraction |
| Tier 6 (Expansion) | REQ-037, 029F | Stairs/columns/elevators, multi-scale zones |

### Performance Targets

| Metric | Target |
|--------|--------|
| Vector extraction per page | <2 seconds |
| Geometry classification per page | <1 second |
| Scale detection per page | <500ms |
| Schedule/table extraction per page | <1 second |
| MEP symbol counting per page | <1.5 seconds |
| Full pipeline (10-page PDF) | <30 seconds |
| Full pipeline (26-page commercial TI) | <60 seconds |
| Full pipeline (50-page PDF) | <3 minutes |
| Worker queue claim latency | <100ms |

---

## P1: Backend Enhancements

### REQ-004: Expand Trade Mappings (21 -> 35+)

**Story:** As a PM, I want AI items to map to correct trades instead of falling to "general".

**File:** `lib/ai/normalize-takeoff.ts:4-21`

**Acceptance Criteria:**
- GIVEN category "architectural" + subType containing "roofing" THEN trade = "roofing"
- GIVEN category "architectural" + subType containing "tile" THEN trade = "tile"
- GIVEN category "structural" + subType containing "masonry" THEN trade = "masonry"
- GIVEN unmapped combo THEN keyword fallback checks 20+ construction terms
- GIVEN no match THEN trade defaults to "general"

**New mappings needed:** roofing, siding, tile, insulation, masonry, carpentry (trim/cabinet), countertops, stucco, landscaping, fencing, low-voltage, flatwork, utilities, ceiling (-> drywall), foundation (-> concrete), rebar (-> concrete), lighting (-> electrical), duct (-> hvac), equipment (-> hvac), fixture-plumbing, drain, water-heater.

---

### REQ-005: Expand Waste Factors (9 -> 20+)

**Story:** As a PM, I want accurate waste calculations so material orders are right.

**File:** `lib/ai/normalize-takeoff.ts:24-34`

**Acceptance Criteria:**
- GIVEN trade "roofing" THEN waste factor = 10-12%
- GIVEN trade "tile" THEN waste factor = 15-18%
- GIVEN trade "masonry" THEN waste factor = 5%
- GIVEN trade "insulation" THEN waste factor = 5-10%
- GIVEN unknown trade THEN waste factor = 0%

**New factors:** roofing (0.12), tile (0.15), masonry (0.05), insulation (0.05), siding (0.08), carpentry (0.05), glazing (0.02), hvac (0.05), steel (0.03), countertops (0.02), stucco (0.08), landscaping (0.10), flatwork (0.03), low-voltage (0.10).

---

### REQ-006: AI Prompt - Room/Space Context

**Story:** As a PM, I want takeoff items grouped by room so I see material distribution across the building.

**File:** `lib/ai/parse-prompt.ts`

**Acceptance Criteria:**
- GIVEN visible room labels WHEN parsing THEN items include `room_context` field
- GIVEN no visible rooms WHEN parsing THEN `room_context` is null
- GIVEN Zod schema THEN `room_context` is optional string field on `TakeoffItemSchema`

---

### REQ-007: Increase max_tokens to 4000

**Story:** As a PM, I want complex plans to fully extract without truncation.

**File:** `app/api/estimates/parse/route.ts:252`

**Acceptance Criteria:**
- GIVEN plan with 50+ items WHEN parsing THEN all items extracted
- Change `max_tokens: 2000` to `max_tokens: 4000`

---

### REQ-008: AI Page Type Classification

**Story:** As a PM, I want to know what type each plan page is (floor plan, elevation, detail, etc.).

**File:** `lib/ai/parse-prompt.ts`

**Acceptance Criteria:**
- WHEN parsing THEN `page_type` is one of: floor_plan, site_plan, elevation, section, detail, schedule, electrical, plumbing, mechanical, unknown
- WHEN stored THEN `plan_parse_results.page_type` reflects classification

---

### REQ-009: Add Missing Server Actions

**File:** `app/actions/estimates.ts`

**REQ-009A: `duplicateEstimate(estimateId)`**
- Creates new estimate with name "{original} (Copy)", status "draft"
- Copies all line items with same costs
- Clears `approved_by` and `approved_at`

**REQ-009B: `deleteEstimate(estimateId)`**
- Soft-deletes by setting status to "superseded"
- Sets `superseded_by` to null (archived, not replaced)
- Superseded estimates filtered out in `getEstimates()` by default

**REQ-009C: `getAiUsage(companyId)`**
- Returns current month's total cost, breakdown by model
- Returns cached vs non-cached call counts
- Returns percentage of monthly budget used

---

### REQ-010: Bulk Takeoff Server Actions

**Story:** As a PM, I want to accept/reject multiple items via server actions (not just API routes).

**File:** `app/actions/estimates.ts`

**Acceptance Criteria:**
- `bulkAcceptTakeoffItems(planUploadId, itemIds[])` - accepts all specified items
- `bulkRejectTakeoffItems(planUploadId, itemIds[])` - rejects all specified items
- Operations complete in <500ms for 50 items

---

### REQ-011: Add material_id FK to estimate_line_items

**Story:** As a PM, I want to link line items to materials catalog so estimates use real pricing.

**Files:** `supabase/migrations/new.sql`, `types/db/tables/estimates.ts`, `app/actions/estimates.ts`

**Acceptance Criteria:**
- `material_id UUID` nullable FK to `materials(id)` with `ON DELETE SET NULL`
- Index on `material_id WHERE material_id IS NOT NULL`
- Migration file created, `npm run db:gen-types` succeeds
- `EstimateLineItem` type updated with `material_id?: string`
- New `EstimateLineItemWithMaterial` type extending with `product_name`, `unit_price`, `sku`
- `createEstimate()` accepts optional `materialId` per line item, passes `material_id` in insert
- `getEstimate()` joins `materials` table when `material_id` is set, returns material details

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 1 + 4

---

### REQ-022: Trade → MaterialCategory Mapping Utility

**Story:** As a PM, I want the system to automatically suggest relevant materials from my company catalog based on the trade of each takeoff item.

**File:** `lib/materials/category-mapping.ts` (**NEW**)

**Acceptance Criteria:**
- `getMaterialCategoriesForTrade(trade: string): MaterialCategory[]` maps estimate trades to material categories
- `scoreMaterialRelevance(materialName: string, subType: string): number` returns 0-100 relevance score
- Key mappings: framing→[lumber,hardware], drywall→[drywall,hardware], concrete→[concrete], electrical→[electrical,fixtures], plumbing→[plumbing,fixtures], hvac→[hvac,insulation], flooring→[flooring], painting→[paint], roofing→[roofing], carpentry→[lumber,hardware,doors_windows]
- Reuses trade values from `lib/ai/normalize-takeoff.ts` and MaterialCategory enum from `types/db/tables/materials.ts`
- GIVEN unknown trade THEN returns empty array (no crash)

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 2

---

### REQ-023: Material Suggestion Server Actions

**Story:** As a PM, I want to see suggested materials from my catalog when costing line items, and bulk-match all items at once.

**File:** `app/actions/material-suggestions.ts` (**NEW**)

**Acceptance Criteria:**

**REQ-023A: `suggestMaterialsForLineItem({ trade, category, subType, limit?: 5 })`**
- Maps trade → MaterialCategory[] via REQ-022 utility
- Queries `materials` WHERE `category IN (...)` AND `is_active = true` AND `company_id` matches
- Scores each by relevance to `subType`
- Returns top N: `{ material_id, product_name, unit_price, unit_of_measure, sku, product_image_url, relevance_score }`

**REQ-023B: `bulkMatchMaterialsToTakeoffItems(planUploadId: string)`**
- Gets accepted takeoff items via `getTakeoffItems(planUploadId, { reviewStatus: 'accepted' })`
- Fetches all company materials once (no N+1)
- For each takeoff item, finds best matching material
- Returns: `{ takeoff_item_id, sub_type, suggested_material: { id, name, price, confidence } }[]`

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 3

---

### REQ-024: Estimate → Procurement Bridge

**Story:** As a PM, I want to convert approved estimates into procurement orders so my team can start ordering materials.

**File:** `app/actions/estimate-to-procurement.ts` (**NEW**)

**Acceptance Criteria:**
- `createMaterialAssignmentsFromEstimate(estimateId: string)` server action
- GIVEN estimate not approved WHEN called THEN returns error
- GIVEN approved estimate WHEN called THEN:
  - Gets line items WHERE `material_id IS NOT NULL`
  - Finds or creates a "Procurement" task in the project's first phase
  - For each line item, calls existing `assignMaterialToTask()` from `app/actions/materials.ts`
  - Sets `quantity` from line item, `unit_cost` = `material_cost`, `procurement_status` = `'needed'`
- Returns count of assignments created
- Reuses existing `assignMaterialToTask()` — no new DB tables needed

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 5

---

### REQ-025: Stale Price Detection

**Story:** As a PM, I want to be warned when material prices have changed since I created the estimate, so I don't submit outdated proposals.

**File:** `app/actions/material-suggestions.ts`

**Acceptance Criteria:**
- `checkEstimatePriceStaleness(estimateId: string, threshold?: 5)` server action
- Gets line items with `material_id` joined to `materials`
- Compares `line_item.material_cost` vs `material.unit_price`
- Returns items where `|change| >= threshold%`: `{ line_item_id, product_name, estimate_price, current_price, change_pct }`
- GIVEN no stale items THEN returns empty array

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 6

---

## P1: Frontend Completion

### REQ-012: Wire CostEditor to Accepted Takeoff Items + Materials Integration

**Story:** As a PM, I want accepted takeoff items to auto-populate as cost line items, with the ability to link materials from my catalog.

**Files:** `components/estimates/CostEditor.tsx`, `components/estimates/CostLineItemRow.tsx`

**Acceptance Criteria:**
- WHEN entering cost editor THEN all items with `review_status: "accepted"` load as line items
- WHEN updating material/labor/equipment costs THEN subtotal recalculates (100ms debounce)
- WHEN clicking "Save Estimate" THEN `createEstimate()` server action called (including `material_id` per item)
- **Materials: Auto-Match** — "Auto-Match Materials" button in header calls `bulkMatchMaterialsToTakeoffItems()`, shows `MaterialMatchConfirmModal` (REQ-026B), then populates `material_id` + `material_cost`
- **Materials: Per-Row Link** — Each `CostLineItemRow` has a "Link Material" button (Lucide `Package` icon, 44px touch target) that opens `MaterialSuggestionPicker` (REQ-026A)
- WHEN material selected THEN auto-fills `materialCost` from `unit_price`, shows `LinkedMaterialBadge` (REQ-026C)
- "Unlink" button to clear `material_id` and badge

---

### REQ-013: Wire EstimateSummary to Real Data + Stale Prices + Procurement

**Story:** As a PM, I want trade-grouped breakdown with functional approve button, stale price warnings, and a path to procurement.

**File:** `components/estimates/EstimateSummary.tsx`

**Acceptance Criteria:**
- WHEN viewing THEN breakdown reflects actual line item totals grouped by trade
- WHEN clicking "Approve" THEN `approveEstimate()` called (admin/PM only)
- WHEN user is not admin/PM THEN approve button hidden
- **Stale Prices** — On load, calls `checkEstimatePriceStaleness()` (REQ-025). Shows `StalePriceWarning` banner (REQ-026D) if stale items found
- **Procurement** — WHEN estimate is approved AND has linked materials THEN "Create Procurement Orders" button visible. Calls `createMaterialAssignmentsFromEstimate()` (REQ-024). Shows toast with count of assignments created

---

### REQ-014: Wire PricingTemplateModal

**Story:** As a PM, I want to load saved pricing templates.

**File:** `components/estimates/PricingTemplateModal.tsx`

**Acceptance Criteria:**
- WHEN modal opens THEN fetches real templates via `getPricingTemplates()`
- WHEN user selects and clicks "Load" THEN `applyPricingTemplate()` called
- WHEN applied THEN toast shows "Template applied: X items matched"

---

### REQ-015: Wire SaveTemplateModal

**Story:** As a PM, I want to save current costs as reusable template.

**File:** `components/estimates/SaveTemplateModal.tsx`

**Acceptance Criteria:**
- WHEN clicking "Save" THEN `createPricingTemplate()` called with current line items
- WHEN name empty THEN save button disabled

---

### REQ-016: Wire AddManualItemModal

**Story:** As a PM, I want to manually add takeoff items AI missed.

**File:** `components/estimates/AddManualItemModal.tsx`

**Acceptance Criteria:**
- WHEN clicking "Add Item" THEN `addManualTakeoffItem()` server action called
- WHEN added THEN item appears with `extraction_method: "manual"`, `confidence: 1.0`

---

### REQ-017: Wire AiBudgetBanner

**Story:** As a GC, I want AI budget warnings when approaching monthly limit.

**File:** `components/estimates/AiBudgetBanner.tsx`

**Acceptance Criteria:**
- WHEN loading THEN calls `getAiUsage()` for current month spend
- WHEN 75-89% THEN yellow warning banner
- WHEN 90%+ THEN red critical banner
- WHEN <75% THEN blue info (or hidden)

---

### REQ-018: Wire EstimateHistoryList

**Story:** As a PM, I want to see estimate version history.

**File:** `components/estimates/EstimateHistoryList.tsx`

**Acceptance Criteria:**
- WHEN viewing THEN shows versions linked via `superseded_by` chain
- WHEN comparing THEN cost delta displayed with up/down arrows

---

### REQ-026: Materials Integration UI Components

**Story:** As a PM, I need dedicated UI components for linking materials to estimate line items.

**REQ-026A: `MaterialSuggestionPicker`** (**NEW** `components/estimates/MaterialSuggestionPicker.tsx`)
- ResponsiveModal showing suggestions from `suggestMaterialsForLineItem()` (REQ-023A)
- Displays: product name, unit price, unit of measure, SKU, product image, relevance score
- Search input to filter suggestions
- 44px touch targets, `active:` states, dark mode

**REQ-026B: `MaterialMatchConfirmModal`** (**NEW** `components/estimates/MaterialMatchConfirmModal.tsx`)
- ResponsiveModal for bulk match confirmation
- Table: takeoff item → suggested material with confidence score
- "Accept All" / "Accept Selected" / "Cancel" actions
- 44px touch targets

**REQ-026C: `LinkedMaterialBadge`** (**NEW** `components/estimates/LinkedMaterialBadge.tsx`)
- Small inline badge showing linked material name + current price
- Click to open material detail or unlink
- Truncates long names with tooltip

**REQ-026D: `StalePriceWarning`** (**NEW** `components/estimates/StalePriceWarning.tsx`)
- Banner component for EstimateSummary
- Lists items with price changes: product name, estimate price → current price, % change
- "Update Prices" action to refresh all stale items
- Yellow for 5-15% change, red for >15% change

**Reference:** `.claude/specs/estimates-v2/materials-integration-plan.md` Phase 7

---

## P2: New Capabilities

### REQ-019: PDF Export

**Story:** As a PM, I want branded PDF proposals from estimates.

**Acceptance Criteria:**
- Server-side PDF generation with company logo, trade-grouped breakdown
- Export completes in <5 seconds
- API route: `POST /api/estimates/[id]/export-pdf`

---

### REQ-020: Estimate-to-Budget Conversion

**Story:** As a PM, I want to convert approved estimates into project budgets.

**Acceptance Criteria:**
- WHEN estimate is approved THEN "Convert to Budget" button appears
- `convertEstimateToBudget()` creates budget line items from estimate line items
- Sets `project.budget = estimate.grand_total`

---

### REQ-021: Assemblies System

**Story:** As a PM, I want assemblies (grouped items) for common construction elements.

**Acceptance Criteria:**
- Create `assemblies` + `assembly_items` tables
- `applyAssembly(estimateId, assemblyId, quantity)` generates component line items
- Example: "Interior Wall - 200 LF" generates studs, drywall, tape, primer, paint

---

## Non-Functional Requirements

### NFR-001: Performance
- Plan upload (10-page PDF): <30 seconds
- AI parse per page: <15 seconds
- Takeoff list (200 items): <100ms render
- Template application (50 items): <500ms

### NFR-002: Mobile
- 44px minimum touch targets
- `active:` states on all buttons
- `dvh` viewport heights
- `pb-[env(safe-area-inset-bottom)]` safe areas
- Dark mode variants

### NFR-003: Accessibility
- `aria-label` on all icon-only buttons
- Keyboard navigation for all interactive elements
- Color-blind safe confidence badges (icons + text, not just color)

### NFR-004: Error Handling
- All server actions return `{ success, data?, error? }`
- Network errors show user-friendly messages
- Toast notifications for all mutations

### NFR-005: Security
- All queries include `company_id` filter
- All server actions call `getUserContext()`
- File uploads validate MIME type + size
- OpenAI key in env vars only

---

## Out of Scope (v2)

- Chat with plans (Togal.AI pattern) - Future
- On-plan measurement tools (PlanSwift pattern) - Future (REQ-029G user calibration is a minimal version)
- BIM/IFC file support
- Supplier API pricing integration
- Real-time multi-user collaboration
- Offline editing
- Change order tracking
- Subcontractor portal
- ML-based symbol recognition (future enhancement to rule engine)

> **Note:** Scanned/raster PDF support is now handled via GPT-4o fallback in `auto` mode (REQ-027D + REQ-034).

---

## Critical Files

| File | Requirements |
|------|-------------|
| `app/actions/estimates.ts` | REQ-001, 009, 010, 011 |
| `app/api/estimates/parse/route.ts` | REQ-002, 007, 034 (kept for GPT-4o fallback) |
| `app/api/estimates/extract/route.ts` | REQ-034 (**NEW** — primary extraction entry point) |
| `app/actions/pricing-templates.ts` | REQ-003 |
| `lib/ai/normalize-takeoff.ts` | REQ-004, 005 (reused by both engines) |
| `lib/ai/parse-prompt.ts` | REQ-006, 008 (used by GPT-4o fallback) |
| `lib/extraction/vector-parser.ts` | REQ-027, 027D, 027E (**NEW**) |
| `lib/extraction/types.ts` | REQ-027, 033 (**NEW**) |
| `lib/extraction/geometry-classifier.ts` | REQ-028 (**NEW**) |
| `lib/extraction/rules/wall-rules.ts` | REQ-028A (**NEW**) |
| `lib/extraction/rules/door-rules.ts` | REQ-028B (**NEW**) |
| `lib/extraction/rules/window-rules.ts` | REQ-028C (**NEW**) |
| `lib/extraction/rules/room-rules.ts` | REQ-028D (**NEW**) |
| `lib/extraction/rules/ceiling-rules.ts` | REQ-030 (**NEW**) |
| `lib/extraction/rules/stair-rules.ts` | REQ-037A (**NEW** — Phase 2) |
| `lib/extraction/rules/column-rules.ts` | REQ-037B (**NEW** — Phase 2) |
| `lib/extraction/rules/elevator-rules.ts` | REQ-037C (**NEW** — Phase 2) |
| `lib/extraction/schedule-parser.ts` | REQ-038 (**NEW** — table/schedule extraction engine) |
| `lib/extraction/rules/schedule-rules.ts` | REQ-038A-E (**NEW** — schedule type classification) |
| `lib/extraction/rules/finish-rules.ts` | REQ-039 (**NEW** — finish schedule mapping) |
| `lib/extraction/rules/electrical-rules.ts` | REQ-040 (**NEW** — electrical device counting) |
| `lib/extraction/rules/plumbing-rules.ts` | REQ-041 (**NEW** — plumbing fixture extraction) |
| `lib/extraction/rules/hvac-rules.ts` | REQ-042 (**NEW** — HVAC duct extraction) |
| `lib/extraction/scale-detector.ts` | REQ-029 (**NEW**) |
| `lib/extraction/quantity-calculator.ts` | REQ-031 (**NEW**) |
| `lib/extraction/confidence-scorer.ts` | REQ-032 (**NEW**) |
| `lib/extraction/worker-queue.ts` | REQ-035 (**NEW**) |
| `lib/extraction/progress-tracker.ts` | REQ-036 (**NEW**) |
| `supabase/migrations/new.sql` | REQ-011 |
| `supabase/migrations/extraction_jobs.sql` | REQ-035 (**NEW**) |
| `types/db/tables/estimates.ts` | REQ-011 |
| `lib/materials/category-mapping.ts` | REQ-022 (**NEW**) |
| `app/actions/material-suggestions.ts` | REQ-023, 025 (**NEW**) |
| `app/actions/estimate-to-procurement.ts` | REQ-024 (**NEW**) |
| `components/estimates/CostEditor.tsx` | REQ-012 |
| `components/estimates/CostLineItemRow.tsx` | REQ-012 |
| `components/estimates/EstimateSummary.tsx` | REQ-013, 019 |
| `components/estimates/PricingTemplateModal.tsx` | REQ-014 |
| `components/estimates/SaveTemplateModal.tsx` | REQ-015 |
| `components/estimates/AddManualItemModal.tsx` | REQ-016 |
| `components/estimates/AiBudgetBanner.tsx` | REQ-017 |
| `components/estimates/EstimateHistoryList.tsx` | REQ-018 |
| `components/estimates/ExtractionProgress.tsx` | REQ-036 (**NEW**) |
| `components/estimates/MaterialSuggestionPicker.tsx` | REQ-026A (**NEW**) |
| `components/estimates/MaterialMatchConfirmModal.tsx` | REQ-026B (**NEW**) |
| `components/estimates/LinkedMaterialBadge.tsx` | REQ-026C (**NEW**) |
| `components/estimates/StalePriceWarning.tsx` | REQ-026D (**NEW**) |
