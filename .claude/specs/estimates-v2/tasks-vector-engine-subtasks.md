# Vector Engine — Granular Subtasks

**Source:** `tasks-vector-engine.md` (VEC-001 through VEC-015)
**Date:** 2026-02-16
**Agent:** backend-engineer (all tasks)
**Effort granularity:** ~2–4 hours per subtask

---

## VEC-001: Types & Shared Interfaces

### VEC-001.1: Core geometry primitives
- **Effort:** 1.5h
- **Dependencies:** None
- **File:** `lib/extraction/types.ts` (create)
- **Deliverable:** TypeScript interfaces for all raw vector element types
- **Implementation:**
  - Define `Point { x: number; y: number }`
  - Define `Rect { x: number; y: number; width: number; height: number }`
  - Define `VectorLine { start: Point; end: Point; strokeWidth: number; dashArray: number[] | null }`
  - Define `VectorArc { center: Point; radius: number; startAngle: number; endAngle: number; strokeWidth: number }`
  - Define `VectorPath { points: Point[]; isClosed: boolean; hasFill: boolean; fillColor: string | null; strokeWidth: number }`
  - Define `VectorRect { x: number; y: number; width: number; height: number; hasFill: boolean; strokeWidth: number }`
  - Define `TextObject { content: string; position: Point; fontSize: number; bounds: Rect }`
  - Add JSDoc comment: "All coordinates in inches. 1 PDF point = 1/72 inch."
- **Acceptance:**
  - [ ] All 7 primitive types exported from `lib/extraction/types.ts`
  - [ ] No TypeScript errors (`npm run lint:ts`)
  - [ ] JSDoc coordinate convention documented on file

### VEC-001.2: VectorPage and classification types
- **Effort:** 1h
- **Dependencies:** VEC-001.1
- **File:** `lib/extraction/types.ts` (extend)
- **Deliverable:** `VectorPage`, `ScaleInfo`, `TextCluster` interfaces
- **Implementation:**
  - Define `TextClusterType` as union: `'roomNames' | 'dimensions' | 'notes' | 'titleBlock' | 'sheetTitle'`
  - Define `TextCluster { texts: TextObject[]; centroid: Point; clusterType: TextClusterType }`
  - Define `PageClassification` as union: `'vector' | 'raster' | 'mixed'`
  - Define `SheetType` as union: `'floor_plan' | 'rcp' | 'elevation' | 'section' | 'detail' | 'code' | 'schedule' | 'mep' | 'unknown'`
  - Define `ScaleInfo { factor: number; confidence: 'metadata' | 'explicit' | 'scale_bar' | 'calibrated' | 'inferred' | 'user_provided'; requiresCalibration?: boolean }`
  - Define `VectorPage { pageNumber: number; pageClassification: PageClassification; sheetType: SheetType; lines: VectorLine[]; arcs: VectorArc[]; paths: VectorPath[]; rects: VectorRect[]; texts: TextObject[]; textClusters: TextCluster[]; scale: ScaleInfo | null; hasLowDensity: boolean }`
- **Acceptance:**
  - [ ] `VectorPage` exported with all listed fields
  - [ ] `ScaleInfo.confidence` union includes all 6 values
  - [ ] `SheetType` union includes all 9 values

### VEC-001.3: Extracted element result types
- **Effort:** 2h
- **Dependencies:** VEC-001.1, VEC-001.2
- **File:** `lib/extraction/types.ts` (extend)
- **Deliverable:** Output types for wall, door, window, room, quantity results
- **Implementation:**
  - Define `ConstructionStatus` as union: `'new' | 'existing_to_remain' | 'demolition'`
  - Define `WallType` as union: `'structural' | 'partition'`
  - Define `WallSegment { id: string; start: Point; end: Point; thickness: number; type: WallType; constructionStatus: ConstructionStatus; isCurved: boolean; confidenceScore: number; needsReview: boolean }`
  - Define `DoorType` as union: `'DOOR' | 'POCKET_DOOR' | 'SLIDING_DOOR' | 'BIFOLD_DOOR' | 'OVERHEAD_DOOR' | 'DOUBLE_DOOR'`
  - Define `DoorElement { id: string; position: Point; width: number; doorType: DoorType; wallId: string | null; confidenceScore: number; needsReview: boolean; reviewFlags: string[] }`
  - Define `WindowElement { id: string; position: Point; width: number; windowType: 'WINDOW' | 'CURTAIN_WALL'; wallId: string | null; scheduleRef: string | null; mullionCount?: number; confidenceScore: number; needsReview: boolean }`
  - Define `RoomPolygon { id: string; name: string; classification: string; polygon: Point[]; areaSqft: number; perimeterFt: number; wallIds: string[]; doorIds: string[]; windowIds: string[]; confidenceScore: number; needsReview: boolean; reviewFlags: string[] }`
- **Acceptance:**
  - [ ] All 5 result element types exported
  - [ ] `ConstructionStatus` used on `WallSegment`
  - [ ] `reviewFlags: string[]` present on Door, Window, Room types

### VEC-001.4: ExtractionResult and QuantityResult schemas
- **Effort:** 1.5h
- **Dependencies:** VEC-001.3
- **File:** `lib/extraction/types.ts` (extend)
- **Deliverable:** Top-level `ExtractionResult` and `QuantityResult` types matching REQ-033
- **Implementation:**
  - Define `QuantityResult { drywallSf: number; flooringSf: number; baseboardLf: number; ceilingSf: number; paintSf: number; demoDrywallSf: number; demoFramingLf: number; ceilingHeightFt: number; ceilingHeightAssumed: boolean }`
  - Define `ClassificationResult { walls: WallSegment[]; doors: DoorElement[]; windows: WindowElement[]; rooms: RoomPolygon[]; reviewFlags: string[] }`
  - Define `ScoringContext { scale: ScaleInfo | null; nearbyTexts: TextObject[]; adjacentWalls: WallSegment[]; elementDensity: number }`
  - Define `ExtractionMeta { engineVersion: string; model: string; pagesProcessed: number; processingTimeMs: number; cost: number; reviewFlagCount: number }`
  - Define `ExtractionResult` with all top-level sections: `projectSummary`, `rooms`, `walls`, `doors`, `windows`, `quantities`, `finishes`, `mep`, `extractionMeta`
- **Acceptance:**
  - [ ] `ExtractionResult` exported and matches REQ-033 field list
  - [ ] `ExtractionMeta.cost` field present (set to 0 for vector engine)
  - [ ] `ExtractionMeta.model` field present (set to `'vector-engine-v1'`)
  - [ ] No circular type dependencies

---

## VEC-002: Vector PDF Preprocessor

### VEC-002.1: pdfjs-dist Node.js bootstrap and page loader
- **Effort:** 2h
- **Dependencies:** VEC-001 (types must exist)
- **File:** `lib/extraction/vector-parser.ts` (create)
- **Deliverable:** Working pdfjs document loader that opens a PDF buffer and accesses a page
- **Implementation:**
  - Import `pdfjs-dist/legacy/build/pdf.mjs` (already installed — do NOT reinstall)
  - Implement `async function loadPdfPage(pdfBytes: Buffer, pageNumber: number)` that returns a pdfjs page object
  - Handle `getDocument({ data: pdfBytes })` initialization (no canvas, no worker in Node)
  - Verify `page.getOperatorList()` returns an operator list
  - Export skeleton `async function extractVectorPage(pdfBytes: Buffer, pageNumber: number): Promise<VectorPage>`
  - Stub all fields with empty arrays; full parsing added in VEC-002.2–002.5
- **Acceptance:**
  - [ ] File compiles with `npm run lint:ts`
  - [ ] `extractVectorPage` signature matches VectorPage return type
  - [ ] No canvas or browser globals imported

### VEC-002.2: Path operator parsing (lines, arcs, bezier curves)
- **Effort:** 3h
- **Dependencies:** VEC-002.1
- **File:** `lib/extraction/vector-parser.ts` (extend)
- **Deliverable:** Parse `constructPath` / `moveTo` / `lineTo` / `curveTo` / `closePath` operators into typed elements
- **Implementation:**
  - Walk `operatorList.fnArray` / `operatorList.argsArray` in tandem
  - On `OPS.moveTo`: start new sub-path
  - On `OPS.lineTo`: append to current sub-path
  - On `OPS.curveTo`: append bezier control points, sample to `VectorPath.points` (subdivide at 8 steps)
  - On `OPS.closePath`: mark path `isClosed = true`
  - On `OPS.constructPath`: invoke sub-path builder
  - On `OPS.setLineWidth`: track current stroke width
  - On `OPS.setDash`: track current dash array
  - On `OPS.fill` / `OPS.fillStroke`: mark current path `hasFill = true`, capture `fillColor`
  - Convert 2-point closed-path-no-fill → `VectorLine` if collinear
  - Convert axis-aligned 4-point closed rect → `VectorRect`
  - Otherwise → `VectorPath`
  - Coordinate normalization: divide all PDF points by 72 (inches)
- **Acceptance:**
  - [ ] Lines extracted as `VectorLine[]` on `VectorPage`
  - [ ] Rectangles extracted as `VectorRect[]`
  - [ ] Curves extracted as `VectorPath[]`
  - [ ] All coordinates divided by 72 before storage

### VEC-002.3: Text operator parsing and spatial clustering
- **Effort:** 2.5h
- **Dependencies:** VEC-002.2
- **File:** `lib/extraction/vector-parser.ts` (extend)
- **Deliverable:** Text objects extracted and clustered by proximity
- **Implementation:**
  - Parse `OPS.showText` / `OPS.showSpacedText` / `OPS.nextLineShowText` operators
  - Capture current text matrix for position; capture `fontSize` from `OPS.setFont`
  - Build `TextObject[]` with content, position (inches), fontSize, bounds
  - Implement proximity clustering: group texts within 2" of each other (euclidean centroid distance)
  - Classify clusters:
    - `sheetTitle`: top 10% of page, fontSize > 14pt
    - `titleBlock`: bottom-right 20% of page
    - `dimensions`: content matches regex `/\d+['"][\s-]*\d*['"]/` or `/\d+'-\d+"/`
    - `roomNames`: content is 2–20 chars, mostly uppercase, inside page body
    - `notes`: default fallback
  - Store as `VectorPage.textClusters`
- **Acceptance:**
  - [ ] `VectorPage.texts` populated with `TextObject[]`
  - [ ] `VectorPage.textClusters` populated with classified clusters
  - [ ] Dimension pattern regex matches `3'-6"`, `12"`, `24'-0"` formats

### VEC-002.4: Sheet filtering and raster vs. vector classification
- **Effort:** 1.5h
- **Dependencies:** VEC-002.3
- **File:** `lib/extraction/vector-parser.ts` (extend)
- **Deliverable:** `sheetType` and `pageClassification` set on `VectorPage`
- **Implementation:**
  - Parse `OPS.paintImageXObject` operators; accumulate total image area (bounding boxes)
  - Compute `constructPath` operator count
  - Set `pageClassification`:
    - `'raster'` if image area > 90% of page AND constructPath count < 10
    - `'vector'` if image area < 10% AND constructPath count > 50
    - `'mixed'` otherwise
  - Set `sheetType` from sheet title text cluster:
    - Contains "REFLECTED CEILING" or "RCP" → `'rcp'`
    - Contains "DETAIL" → `'detail'`
    - Contains "CODE" → `'code'`
    - Contains "ELECTRICAL" or "E-" prefix in sheet number → `'mep'`
    - Contains "PLUMBING" or "P-" prefix → `'mep'`
    - Contains "MECHANICAL" or "M-" prefix → `'mep'`
    - Contains "SCHEDULE" → `'schedule'`
    - Contains "ELEVATION" → `'elevation'`
    - Contains "SECTION" → `'section'`
    - Title exists but no match → `'floor_plan'`
    - No title detected → `'unknown'`
  - Set `hasLowDensity: true` when < 10 total path elements (cover/title pages)
- **Acceptance:**
  - [ ] `pageClassification` set correctly for all 3 cases
  - [ ] `sheetType` set for all 10 cases
  - [ ] `hasLowDensity` flag set on sparse pages

### VEC-002.5: Hatch and dimension line filtering
- **Effort:** 2h
- **Dependencies:** VEC-002.2
- **File:** `lib/extraction/vector-parser.ts` (extend)
- **Deliverable:** Hatch patterns and dimension lines removed from returned element arrays before VectorPage is returned
- **Implementation:**
  - Hatch detection: find groups of 4+ lines that are parallel (angle difference ≤ 0.5°) with consistent perpendicular spacing (≤ 0.1" variance). Mark group as `isHatch = true`
  - Dimension line detection: line with arrowhead or tick-mark endpoints AND an associated `dimensions`-classified text cluster within 0.5". Mark as `isDimension = true`
  - Arrowhead/tick detection heuristic: two short lines (<0.3") meeting at < 30° angle at endpoint of a longer line
  - Filter: remove all hatch and dimension lines from `VectorPage.lines` and `VectorPage.paths` before returning
  - Add counts to `VectorPage` (optional): `filteredHatchCount`, `filteredDimensionCount` for debugging
- **Acceptance:**
  - [ ] Hatch groups with consistent angle/spacing removed from lines array
  - [ ] Lines adjacent to dimension text clusters removed
  - [ ] Downstream classifiers receive clean geometry (no hatch in output)

---

## VEC-003: Scale Detector

### VEC-003.1: Metadata and title-block scale text parsing (Priorities 1 & 2)
- **Effort:** 2h
- **Dependencies:** VEC-001, VEC-002 (VectorPage type must be importable)
- **File:** `lib/extraction/scale-detector.ts` (create)
- **Deliverable:** Scale detection from PDF metadata and explicit scale text in title block
- **Implementation:**
  - Export `async function detectScale(page: VectorPage, pdfMetadata?: Record<string, string>): Promise<ScaleInfo | null>`
  - **Priority 1 — PDF metadata:** Check `pdfMetadata` for `/UserUnit` and custom keys like `Scale`, `Drawing Scale`. Parse ratio if present → `confidence: 'metadata'`
  - **Priority 2 — Title block text:** Search `textClusters` with `clusterType === 'titleBlock'` for scale patterns:
    - Architectural map: `{ '1/8"=1\'-0"': 96, '3/16"=1\'-0"': 64, '1/4"=1\'-0"': 48, '3/8"=1\'-0"': 32, '1/2"=1\'-0"': 24, '1"=1\'-0"': 12 }`
    - Engineering map: `{ '1"=10\'': 120, '1"=20\'': 240, '1"=30\'': 360, '1"=40\'': 480, '1"=50\'': 600, '1"=100\'': 1200 }`
    - Metric map: `{ '1:50': 50, '1:100': 100, '1:200': 200, '1:500': 500 }`
    - Dynamic: regex `/Scale:\s*([\d.]+)["']\s*=\s*([\d'-]+)/i` → compute factor
  - Return `{ factor, confidence: 'explicit' }` on Priority 2 match
  - Cascade: return immediately on first successful priority
- **Acceptance:**
  - [ ] All architectural scale factors produce correct `factor` values (e.g., `1/4"=1'-0"` → 48)
  - [ ] Engineering scales produce correct factors (e.g., `1"=20'` → 240)
  - [ ] Metric scales produce correct factors
  - [ ] Dynamic regex parses freeform scale strings

### VEC-003.2: Scale bar detection (Priority 3)
- **Effort:** 2h
- **Dependencies:** VEC-003.1
- **File:** `lib/extraction/scale-detector.ts` (extend)
- **Deliverable:** Graphic scale bar parsing from vector geometry
- **Implementation:**
  - Find candidate horizontal lines of length 0.5"–6" (drawing coordinates, before scale applied)
  - Look for 2–6 evenly spaced vertical tick marks perpendicular to the line
  - Find nearby `dimensions`-classified text cluster with numeric content (the bar's label, e.g., "0 10 20 FT")
  - Parse first non-zero numeric value and its position along the bar
  - Compute: `factor = labelValue_in_feet * 12 / barLengthInches`
  - Return `{ factor, confidence: 'scale_bar' }`
  - Skip detection if no candidate lines found (fall through to Priority 4)
- **Acceptance:**
  - [ ] Scale bar with "0 10 20 FT" label at known pixel width produces correct factor
  - [ ] Falls through to next priority when no scale bar found
  - [ ] No false positives from non-scale horizontal lines

### VEC-003.3: Dimension calibration and sheet inference (Priorities 4 & 5)
- **Effort:** 1.5h
- **Dependencies:** VEC-003.2
- **File:** `lib/extraction/scale-detector.ts` (extend)
- **Deliverable:** Calibration-based and sheet-size-based fallback scale detection
- **Implementation:**
  - **Priority 4 — Dimension calibration:**
    - Find all `dimensions`-classified text clusters with parseable foot-inch values
    - For each: find the nearest pair of parallel lines (extension lines) enclosing that dimension
    - Compute `candidate_factor = dimension_in_inches / line_distance_in_pdf_inches`
    - Collect 3+ candidates, reject outliers beyond 2 standard deviations, use median
    - Return `{ factor: median, confidence: 'calibrated' }` if >= 3 non-outlier candidates
  - **Priority 5 — Sheet size inference:**
    - Read PDF MediaBox dimensions (available from pdfjs page.view array [x, y, w, h])
    - Map page sizes to likely scales:
      - ARCH D (24×36 inches) → factor 48 (1/4" = 1')
      - ARCH E (36×48 inches) → factor 96 (1/8" = 1')
      - ARCH C (18×24 inches) → factor 24 (1/2" = 1')
      - Letter/A (8.5×11 inches) → factor 12 (1" = 1')
    - Return `{ factor, confidence: 'inferred' }`
  - **Priority 6 fallback:** Return `null` (caller must handle `requiresCalibration: true`)
- **Acceptance:**
  - [ ] Calibration with 5 dimension strings within 2σ returns correct median factor
  - [ ] ARCH D page (24×36") inferred as factor 48
  - [ ] Returns `null` when all 5 priorities fail
  - [ ] `detectScale` function complete end-to-end with all 6 priorities

---

## VEC-004: Wall Detection Rules

### VEC-004.1: Parallel line pair and filled rectangle wall rules (Rules 1 & 2)
- **Effort:** 2.5h
- **Dependencies:** VEC-001, VEC-002 (VectorPage), VEC-003 (ScaleInfo)
- **File:** `lib/extraction/rules/wall-rules.ts` (create)
- **Deliverable:** Wall detection for the two most common CAD wall representations
- **Implementation:**
  - Export `function detectWalls(page: VectorPage, scale: ScaleInfo): WallSegment[]`
  - **Rule 1 — Parallel Line Pair:**
    - For each line pair: compute angle difference (parallel if ≤ 1°), perpendicular distance
    - Convert distance to real-world inches: `distance_pdf * scale.factor`
    - Accept if real distance is 3"–12" and both lines > 24" real length
    - Skip pairs where either line has `dashArray` (dashed = demo/hidden)
    - Create `WallSegment` from midpoints of the two lines
  - **Rule 2 — Filled Rectangle:**
    - For each `VectorRect`: compute aspect ratio `max(w,h) / min(w,h)`
    - Convert dimensions to real inches via scale factor
    - Accept if aspect ratio > 4:1 AND shorter dimension is 3"–12" AND `hasFill = true`
    - Create `WallSegment` with start/end at rectangle long-axis endpoints
  - Assign `type`: thickness > 8" → `'structural'`, else `'partition'`
- **Acceptance:**
  - [ ] Two parallel lines 6" apart (in real scale), each 48" long → `WallSegment` created
  - [ ] Filled rect with 8:1 aspect ratio and 6" short dimension → `WallSegment` created
  - [ ] Dashed parallel lines NOT classified as wall

### VEC-004.2: Thick single line and curved wall rules (Rules 3 & 4)
- **Effort:** 2h
- **Dependencies:** VEC-004.1
- **File:** `lib/extraction/rules/wall-rules.ts` (extend)
- **Deliverable:** Wall detection from thick-stroke lines and bezier curve paths
- **Implementation:**
  - **Rule 3 — Thick Single Line:**
    - For each `VectorLine`: convert `strokeWidth` from PDF points to real inches: `strokeWidth / 72 * scale.factor`
    - Accept if real stroke width 3"–12" and line real length > 24"
    - Create `WallSegment`
  - **Rule 4 — Curved Wall:**
    - For each `VectorPath` with `isClosed = false` and 10+ points:
    - Fit a circle/arc to the point set (3-point circle fit or least-squares)
    - Accept if fit radius > 36" real inches AND path has consistent stroke width 3"–12"
    - Create `WallSegment` with `isCurved: true`, start/end at path endpoints
  - Deduplicate: if Rule 1 and Rule 3 both match same geometry, keep Rule 1 result (more precise)
- **Acceptance:**
  - [ ] Line with 6pt stroke at 1:48 scale (= 4" real) and length 48" → `WallSegment` created
  - [ ] Curved path with 36"+ radius and consistent thickness → `CURVED_WALL` created
  - [ ] No duplicate wall segments from overlapping rules

### VEC-004.3: Wall intersection detection and TI classification
- **Effort:** 2h
- **Dependencies:** VEC-004.2
- **File:** `lib/extraction/rules/wall-rules.ts` (extend)
- **Deliverable:** Intersection type classification and TI construction status per wall
- **Implementation:**
  - **Intersection Detection:**
    - For each wall pair: compute geometric intersection point
    - Classify: T-intersection (one wall endpoint near midpoint of another, ±2" tolerance), L-corner (endpoints within 2" of each other), X-intersection (both walls cross mid-segment)
    - Attach `intersections: Array<{ wallId: string; type: 'T' | 'L' | 'X'; point: Point }>` to each `WallSegment`
  - **TI Construction Status:**
    - Parse floor plan legend: search `textClusters` in bottom-left quadrant (x < 25%, y < 25%) for legend-style text
    - Match line styles in legend to wall properties (strokeWidth, dashArray, fillColor)
    - Map matched styles to `ConstructionStatus`
    - Fallback (no legend detected):
      - Lines with `dashArray` non-null → `'demolition'`
      - Lines with `strokeWidth` < 0.5pt → `'existing_to_remain'`
      - Default → `'new'`
  - Set `constructionStatus` on every `WallSegment`
- **Acceptance:**
  - [ ] T-intersection detected within 2" tolerance
  - [ ] L-corner detected within 2" tolerance
  - [ ] Dashed walls classified as `'demolition'` when no legend present
  - [ ] Default construction status is `'new'`

---

## VEC-005: Door Detection Rules

### VEC-005.1: Arc-based door rules (Rules 1 & 2) and wall-gap fallback
- **Effort:** 2.5h
- **Dependencies:** VEC-001, VEC-002, VEC-004 (WallSegment[])
- **File:** `lib/extraction/rules/door-rules.ts` (create)
- **Deliverable:** Single-door arc detection and polyline arc detection
- **Implementation:**
  - Export `function detectDoors(page: VectorPage, walls: WallSegment[], scale: ScaleInfo): DoorElement[]`
  - Helper: `findWallGaps(walls: WallSegment[]): Gap[]` — find endpoints of walls that are within 6" of another wall's endpoint, measuring the gap length
  - **Rule 1 — Arc at Wall Gap:**
    - For each `VectorArc`: compute arc sweep angle (endAngle - startAngle)
    - Accept if sweep is 80°–100° AND real radius is 20"–60"
    - Check arc start or end point is within 2" of a wall endpoint (gap location)
    - Create `DoorElement` with `width = arc.radius * scale.factor`
  - **Rule 2 — Polyline Arc:**
    - For each `VectorPath` with 8+ points: compute whether points follow consistent radius circle
    - Accept if arc spans ~90° (±15°) AND near wall gap
    - Create `DoorElement`
  - **Double Door:** If two Rule-1 arcs share same gap location with mirrored orientation → `DOUBLE_DOOR`, `width = radius * 2`
  - **Fallback:** Gap 24"–120" with wall on both sides and no rule matched → `DOOR` with `confidenceScore: 35`, `needsReview: true`, `reviewFlags: ['arc_not_matched_to_wall_endpoint']`
- **Acceptance:**
  - [ ] 90° arc with 30" radius near wall endpoint → `DOOR` with `width = 30"`
  - [ ] Two mirrored arcs at same gap → `DOUBLE_DOOR`
  - [ ] Unmatched gap 36" wide → fallback `DOOR` with review flag

### VEC-005.2: Specialty door rules (Rules 3–6)
- **Effort:** 2h
- **Dependencies:** VEC-005.1
- **File:** `lib/extraction/rules/door-rules.ts` (extend)
- **Deliverable:** Pocket, sliding, bi-fold, and overhead door detection
- **Implementation:**
  - **Rule 3 — Pocket Door:**
    - Find thin rectangle (aspect ratio > 6:1, short side < 2" real) partially overlapping wall cavity
    - Rectangle width matches detected gap → `POCKET_DOOR`
  - **Rule 4 — Sliding Door:**
    - Two overlapping thin rectangles at same wall gap, each roughly 50% of gap width
    - Combined width = gap width → `SLIDING_DOOR`
  - **Rule 5 — Bi-fold:**
    - Zigzag sequence of thin rectangles (alternating 45° angles) at wall gap
    - Total span matches gap → `BIFOLD_DOOR`
  - **Rule 6 — Overhead/Garage:**
    - Dashed lines spanning gap > 96" (8') real width, wall continues on both sides
    - No arc present → `OVERHEAD_DOOR`
  - Each rule sets appropriate `doorType` and `width`
- **Acceptance:**
  - [ ] Thin rect partially inside wall → `POCKET_DOOR`
  - [ ] Two overlapping rects at gap → `SLIDING_DOOR`
  - [ ] Dashed lines across 10' gap → `OVERHEAD_DOOR`
  - [ ] All 4 specialty types produce `DoorElement` with correct `doorType`

---

## VEC-006: Confidence Scorer

### VEC-006.1: Base scoring and penalty system
- **Effort:** 2h
- **Dependencies:** VEC-001 (types)
- **File:** `lib/extraction/confidence-scorer.ts` (create)
- **Deliverable:** Scoring function with all 4 positive components and all 5 penalties
- **Implementation:**
  - Export `function scoreElement(element: WallSegment | DoorElement | WindowElement | RoomPolygon, context: ScoringContext): { score: number; factors: Record<string, number>; reviewFlags: string[] }`
  - **Positive scoring:**
    - `geometryMatch`: exact rule match → 50, partial match → 25–40, weak → 10–20 (passed in context as `geometryMatchStrength: 'exact' | 'partial' | 'weak'`)
    - `textValidation`: nearby text confirms classification → +20; no text → +0
    - `dimensionConfirmation`: scale-converted measurement within expected range → +15; outside → +0
    - `symbolMatch`: known CAD symbol detected → +15; no symbol → +0
  - **Penalties:**
    - Multiple conflicting rules matched → -20
    - Geometry ambiguous (partial match on multiple rules) → -10
    - Scale missing or `requiresCalibration` → -15
    - Isolated element (low neighbor density) → -5
  - Clamp final score to [0, 100]
  - Return `factors` map with individual component values for auditability
- **Acceptance:**
  - [ ] Exact match + text + dimension + symbol = 100 (clamped)
  - [ ] Exact match only = 50
  - [ ] Partial match + scale missing = 25 - 10 - 15 = 0 (clamped)
  - [ ] `factors` object contains all contributing keys

### VEC-006.2: Threshold classification and auto-generated review flags
- **Effort:** 1h
- **Dependencies:** VEC-006.1
- **File:** `lib/extraction/confidence-scorer.ts` (extend)
- **Deliverable:** `needsReview` flag and full review flag catalog
- **Implementation:**
  - Apply thresholds: score >= 70 → `needsReview: false`; 40–69 → `needsReview: true`; < 40 → `needsReview: true` (include `'low_confidence_warning'` in reviewFlags)
  - Implement `function generateReviewFlags(page: VectorPage, walls: WallSegment[], rooms: RoomPolygon[]): string[]` for page-level review:
    - `'scale_uncertain'` if no explicit scale text found
    - `'overlapping_room_polygons'` if any two room polygons intersect
    - `'wall_thickness_inconsistent'` if wall thicknesses on same sheet vary by > 4"
    - `'arc_not_matched_to_wall_endpoint'` (already set on element — aggregate here too)
    - `'text_outside_room_boundaries'` if room-name text clusters not inside any polygon
    - `'open_polygon'` if room polygon has gap > min door width
  - Return combined `reviewFlags: string[]` on `scoreElement` result
- **Acceptance:**
  - [ ] Score 72 → `needsReview: false`
  - [ ] Score 55 → `needsReview: true`, no `low_confidence_warning`
  - [ ] Score 35 → `needsReview: true` with `low_confidence_warning`
  - [ ] All 6 review flag conditions implemented

---

## VEC-007: Extraction Router Upgrade

### VEC-007.1: EXTRACTION_ENGINE env var routing logic
- **Effort:** 2h
- **Dependencies:** VEC-002 (extractVectorPage), VEC-006 (scoreElement)
- **File:** `app/api/estimates/extract/route.ts` (modify)
- **Deliverable:** `EXTRACTION_ENGINE` env var read and routing decision made per page
- **Implementation:**
  - Read `process.env.EXTRACTION_ENGINE` (default `'auto'`) at top of POST handler
  - For each page job being dispatched, determine engine:
    - `'vector'` mode: always route to vector engine (error if page is raster-only)
    - `'openai'` mode: always route to existing `/api/estimates/parse` flow
    - `'auto'` mode: call `extractVectorPage` to get `pageClassification`, then:
      - `'vector'` pages → rule engine
      - `'raster'` pages → OpenAI fallback
      - `'mixed'` pages → vector engine (best effort)
  - Store routing decision in job metadata field for observability
  - Do NOT yet wire to actual classifiers — that is VEC-007.2
- **Acceptance:**
  - [ ] `EXTRACTION_ENGINE=vector` routes all pages to vector path
  - [ ] `EXTRACTION_ENGINE=openai` routes all pages to OpenAI path
  - [ ] `EXTRACTION_ENGINE=auto` calls `extractVectorPage` to classify before routing
  - [ ] Default is `'auto'` when env var not set

### VEC-007.2: Wire vector engine into job processing and logging
- **Effort:** 2h
- **Dependencies:** VEC-007.1, VEC-010 (classifyGeometry), VEC-011 (calculateQuantities)
- **File:** `app/api/estimates/extract/route.ts` (modify)
- **Deliverable:** Vector engine results written to `takeoff_items` via existing normalization pipeline
- **Implementation:**
  - When vector engine selected: call `classifyGeometry(page, scale)` → get `ClassificationResult`
  - Call `calculateQuantities(rooms, walls, doors, windows)` → get `QuantityResult`
  - Convert each detected element to `takeoff_items` row via existing `normalizeTakeoffItem()`
  - Write to `ai_usage_log` with `cost: 0`, `model: 'vector-engine-v1'`, `tokens_used: 0`
  - Leave `as any` casts on `extraction_jobs` with TODO comment: `// TODO: Remove after VEC-013 migration applied`
  - When OpenAI fallback selected: delegate to existing `/api/estimates/parse` route (no change)
- **Acceptance:**
  - [ ] Vector engine results appear in `takeoff_items` table
  - [ ] `ai_usage_log` row created with `cost: 0` and `model: 'vector-engine-v1'`
  - [ ] Existing OpenAI path unchanged
  - [ ] `as any` casts preserved with TODO comments

---

## VEC-008: Window Detection Rules

### VEC-008.1: Standard window and curtain wall detection
- **Effort:** 2.5h
- **Dependencies:** VEC-001, VEC-004 (WallSegment[])
- **File:** `lib/extraction/rules/window-rules.ts` (create)
- **Deliverable:** Window detection in wall openings plus curtain wall/storefront bands
- **Implementation:**
  - Export `function detectWindows(page: VectorPage, walls: WallSegment[], scale: ScaleInfo): WindowElement[]`
  - **Rule 1 — Thin Rectangle in Wall:**
    - For each `VectorRect`: convert dimensions to real inches
    - Check if rect is embedded within a `WallSegment` (centroid within wall bounds ±2")
    - Accept if real width is 24"–120" AND rect thickness < wall thickness
    - Width = real rect width → `WINDOW`
  - **Curtain Wall / Storefront:**
    - Find continuous band of collinear thin rectangles OR a single rect > 120" wide
    - Check for regular mullion lines (parallel lines inside the band, consistent spacing ±5%)
    - Count mullions, compute total width
    - Create `WindowElement` with `windowType: 'CURTAIN_WALL'`, `mullionCount`
  - **Schedule Cross-Reference:**
    - For each detected window: search `textClusters` within 6" for text matching `/W[-\s]?\d+/i` or `/W[A-Z]\d*/i`
    - Set `scheduleRef` to matched text content
- **Acceptance:**
  - [ ] Rect 36" wide embedded in 6" wall → `WINDOW`
  - [ ] Rect 180" wide with 5 mullion lines → `CURTAIN_WALL` with `mullionCount: 5`
  - [ ] Window near "W-3" text cluster → `scheduleRef: 'W-3'`

---

## VEC-009: Room Detection

### VEC-009.1: Wall graph construction and cycle detection
- **Effort:** 3h
- **Dependencies:** VEC-004 (WallSegment[])
- **File:** `lib/extraction/rules/room-rules.ts` (create)
- **Deliverable:** Graph-based room boundary detection from wall network
- **Implementation:**
  - Export `function detectRooms(page: VectorPage, walls: WallSegment[], doors: DoorElement[], windows: WindowElement[], scale: ScaleInfo): RoomPolygon[]`
  - **Wall Graph:**
    - Nodes = wall intersection points (from `WallSegment.intersections`)
    - Edges = wall segments between intersections
    - Build adjacency list
  - **Minimal Cycle Detection (planar face enumeration):**
    - For each node, traverse edges in clockwise order (use angle sorting)
    - Record cycles — each minimal cycle is a candidate room polygon
    - Filter out outer boundary (largest area polygon)
    - Accept cycles with area 20–50,000 sqft (real) to exclude noise
  - **Open Polygon Handling:**
    - If polygon has gap > minimum door width (24"), mark as `needsReview: true`, add `'open_polygon'` flag
    - Still include in results for human review
- **Acceptance:**
  - [ ] 4-wall rectangle produces 1 room polygon
  - [ ] L-shaped room (6 walls) produces 1 correct polygon
  - [ ] Open polygon (wall gap without door) adds `'open_polygon'` review flag

### VEC-009.2: Room name assignment and classification
- **Effort:** 1.5h
- **Dependencies:** VEC-009.1
- **File:** `lib/extraction/rules/room-rules.ts` (extend)
- **Deliverable:** Room names from text assigned via point-in-polygon, classified to standard types
- **Implementation:**
  - **Point-in-Polygon (Ray Casting):**
    - For each `roomNames`-classified text cluster: cast a ray from centroid in +X direction
    - Count polygon edge crossings — odd count = inside
    - Assign matching room polygon's `name` from text content
  - **Room Classification Map:**
    - `BR|BEDROOM|BED RM` → `'bedroom'`
    - `KIT|KITCHEN` → `'kitchen'`
    - `LR|LIVING|GREAT RM|GREAT ROOM` → `'living_room'`
    - `BA|BATH|BATHROOM|LAV` → `'bathroom'`
    - `MECH|MECHANICAL|BOILER|UTILITY` → `'mechanical'`
    - `STOR|STORAGE|CLOSET|CL` → `'storage'`
    - `GAR|GARAGE` → `'garage'`
    - `OFFICE|CONF|CONFERENCE` → `'office'`
    - `LAU|LAUNDRY` → `'laundry'`
    - Default → `'unclassified'`
  - Rooms with no text assigned → `name: 'Unknown'`, add `'text_outside_room_boundaries'` flag
- **Acceptance:**
  - [ ] "BEDROOM" text inside polygon → room classified as `'bedroom'`
  - [ ] "BATH" text inside polygon → `'bathroom'`
  - [ ] Text outside all polygons → flag added, room name stays `'Unknown'`

### VEC-009.3: Area, perimeter calculation and element association
- **Effort:** 1.5h
- **Dependencies:** VEC-009.2
- **File:** `lib/extraction/rules/room-rules.ts` (extend)
- **Deliverable:** Area/perimeter computed per room with associated door/window IDs attached
- **Implementation:**
  - **Shoelace Formula for Area:**
    - `area = |Σ(x_i * y_{i+1} - x_{i+1} * y_i)| / 2` (handles both CW and CCW winding)
    - Convert to sqft: `area_sqft = area_inches² / 144`
    - Multiply by `scale.factor²` (coordinates are in drawing-space inches, scale to real)
  - **Perimeter:**
    - Sum Euclidean distances between consecutive polygon vertices
    - Convert to feet: `perimeter_ft = perimeter_inches * scale.factor / 12`
  - **Associate Doors and Windows:**
    - For each `DoorElement`: check if `position` is within 3" of room polygon boundary → add `door.id` to `room.doorIds`
    - For each `WindowElement`: same boundary proximity check → add to `room.windowIds`
    - Add `wallIds` from intersection data
- **Acceptance:**
  - [ ] 10' × 12' room → `areaSqft` ≈ 120
  - [ ] Same room → `perimeterFt` ≈ 44
  - [ ] Door on room wall → `door.id` in room's `doorIds` array

---

## VEC-010: Geometry Classifier Orchestrator

### VEC-010.1: Orchestrator pipeline implementation
- **Effort:** 2h
- **Dependencies:** VEC-004, VEC-005, VEC-008, VEC-009
- **File:** `lib/extraction/geometry-classifier.ts` (create)
- **Deliverable:** Single entry-point function that runs all detection rules in correct order
- **Implementation:**
  - Export `async function classifyGeometry(page: VectorPage, scale: ScaleInfo): Promise<ClassificationResult>`
  - Pipeline order (strict):
    1. Hatch/dimension filtering (already done by VEC-002 — validate `page` has clean geometry)
    2. `detectWalls(page, scale)` → `walls`
    3. `detectDoors(page, walls, scale)` → `doors`
    4. `detectWindows(page, walls, scale)` → `windows`
    5. `detectRooms(page, walls, doors, windows, scale)` → `rooms`
    6. Score all elements via `scoreElement()` — attach scores to each element
  - Aggregate `reviewFlags` from all elements into `ClassificationResult.reviewFlags`
  - Return `ClassificationResult { walls, doors, windows, rooms, reviewFlags }`
- **Acceptance:**
  - [ ] Pipeline runs all 4 detectors in order
  - [ ] Scale missing → walls/doors still run, scale-dependent rules skip gracefully
  - [ ] Review flags from all elements aggregated into single array
  - [ ] `async` function (future: may need async for heavy ops)

### VEC-010.2: Sheet type routing (skip non-floor-plan sheets)
- **Effort:** 1h
- **Dependencies:** VEC-010.1
- **File:** `lib/extraction/geometry-classifier.ts` (extend)
- **Deliverable:** Orchestrator routes non-floor-plan sheets to appropriate sub-classifiers or skips
- **Implementation:**
  - Check `page.sheetType` before running full pipeline:
    - `'rcp'` → skip wall/door/window detection; call RCP classifier (VEC-015) when available; stub `classifyGeometry` to return empty walls/doors/windows
    - `'detail'` or `'code'` → return empty `ClassificationResult` immediately with note in `reviewFlags`
    - `'mep'` → return empty `ClassificationResult` (MEP handled by VEC-018–020)
    - `'schedule'` → return empty `ClassificationResult` (schedules handled by VEC-016)
    - `'floor_plan'` or `'unknown'` → run full pipeline
  - Log skipped sheets for observability
- **Acceptance:**
  - [ ] `sheetType: 'detail'` returns empty result without running detectors
  - [ ] `sheetType: 'floor_plan'` runs full pipeline
  - [ ] `sheetType: 'rcp'` stubs empty result with `'rcp_processing_pending'` review flag

---

## VEC-011: Quantity Calculator

### VEC-011.1: Core quantity formulas (drywall, flooring, baseboard, ceiling)
- **Effort:** 2h
- **Dependencies:** VEC-001, VEC-009 (RoomPolygon[])
- **File:** `lib/extraction/quantity-calculator.ts` (create)
- **Deliverable:** Primary finish quantity calculations
- **Implementation:**
  - Export `function calculateQuantities(rooms: RoomPolygon[], walls: WallSegment[], doors: DoorElement[], windows: WindowElement[]): QuantityResult`
  - **Drywall SF:**
    - Filter walls to `constructionStatus === 'new'` only
    - `wall_area = wall_length_ft * ceiling_height_ft`
    - Subtract door openings: `door_width_ft * door_height_ft` (assume 7' height if unknown)
    - Subtract window openings: `window_width_ft * window_height_ft` (assume 4' height if unknown)
    - Partition walls × 2 (both sides), structural walls × 1
    - Sum all
  - **Flooring SF:** Sum `room.areaSqft` for rooms not classified as `'unclassified'` or `'mechanical'`
  - **Baseboard LF:** Per room: `room.perimeterFt - sum(door widths in room) / 12`; sum across all rooms
  - **Ceiling SF:** Sum `room.areaSqft` for all rooms (same as floor area — flat ceiling assumption)
- **Acceptance:**
  - [ ] New partition wall 10' long, 9' ceiling, one 3' door → drywall = `(10*9 - 3*7) * 2 = 138 SF`
  - [ ] Flooring excludes mechanical rooms
  - [ ] Baseboard deducts door widths

### VEC-011.2: TI-specific and demo quantities
- **Effort:** 1.5h
- **Dependencies:** VEC-011.1
- **File:** `lib/extraction/quantity-calculator.ts` (extend)
- **Deliverable:** Paint, demo drywall, demo framing calculations
- **Implementation:**
  - **Paint SF:** All walls with `constructionStatus !== 'demolition'` — includes `'new'` and `'existing_to_remain'`
  - **Demo Drywall SF:** Walls with `constructionStatus === 'demolition'`, same formula as drywall (both sides of partition)
  - **Demo Framing LF:** Sum of lengths of all demolition walls, in feet
  - **Ceiling Height:** Check for section drawing pages — if found, parse height from dimension text near vertical walls. Default to 9.0 ft if not found; set `ceilingHeightAssumed: true`
  - Set `ceilingHeightFt` and `ceilingHeightAssumed` on `QuantityResult`
- **Acceptance:**
  - [ ] Demo wall 8' long, 9' ceiling → `demoDrywallSf = 144` (single side × 2 for both sides = 144)
  - [ ] Demo wall 8' long → `demoFramingLf = 8`
  - [ ] No section drawing → `ceilingHeightFt: 9.0`, `ceilingHeightAssumed: true`

---

## VEC-012: Extraction Progress API

### VEC-012.1: Verify and complete extraction-progress GET handler
- **Effort:** 1.5h
- **Dependencies:** None (endpoint exists — read file first)
- **File:** `app/api/estimates/extraction-progress/route.ts` (verify/extend)
- **Deliverable:** Confirmed working GET handler returning shape expected by `useExtractionProgress`
- **Implementation:**
  - Read existing file (already done in context loading)
  - Verify: GET handler exists, calls `getExtractionProgress(planUploadId)`, maps to `{ stage, percentage, eta, jobs[] }`
  - The existing implementation is largely correct but missing:
    - ETA calculation (currently returns `eta: null` always) — implement using `calculateETA()` from `result-assembler.ts`
    - Auth check (currently no auth on this endpoint) — add session check
    - Company scoping (currently no company check) — verify `getExtractionProgress` in `estimates.ts` handles this
  - Add `startedAt` field to job mapping (currently `null` — check if `claimed_at` can serve as proxy)
- **Acceptance:**
  - [ ] GET returns `{ stage, percentage, eta, jobs[] }` shape
  - [ ] `eta` is a number (seconds) or `null` when no completed jobs yet
  - [ ] Unauthenticated request returns 401
  - [ ] Response shape matches `ExtractionProgress` type from `progress-tracker.ts`

---

## VEC-013: Extraction Jobs DB Migration

### VEC-013.1: Create extraction_jobs table and indexes
- **Effort:** 1.5h
- **Dependencies:** None
- **File:** `supabase/migrations/20260217000001_create_extraction_jobs.sql` (create)
- **Deliverable:** `extraction_jobs` table with all required columns and indexes
- **Implementation:**
  - Create table with columns:
    - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
    - `plan_upload_id uuid NOT NULL REFERENCES plan_uploads(id) ON DELETE CASCADE`
    - `company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE`
    - `page_number integer NOT NULL`
    - `stage text NOT NULL` with CHECK constraint for all 10 values: `('extract_vectors', 'classify_sheet', 'detect_scale', 'detect_elements', 'detect_rooms', 'extract_schedules', 'extract_mep', 'calculate_quantities', 'cross_page_reconcile', 'generate_estimate')`
    - `status text NOT NULL DEFAULT 'pending'` with CHECK: `('pending', 'claimed', 'processing', 'completed', 'failed', 'dead_letter')`
    - `depends_on uuid[] DEFAULT '{}'`
    - `result jsonb`
    - `error text`
    - `attempt integer NOT NULL DEFAULT 0`
    - `max_attempts integer NOT NULL DEFAULT 3`
    - `claimed_at timestamptz`
    - `heartbeat_at timestamptz`
    - `completed_at timestamptz`
    - `created_at timestamptz NOT NULL DEFAULT now()`
    - `updated_at timestamptz NOT NULL DEFAULT now()`
  - Add `updated_at` trigger using existing `moddatetime` extension or manual trigger
  - Indexes:
    - `idx_extraction_jobs_plan_upload_id ON (plan_upload_id)`
    - `idx_extraction_jobs_pending ON (status) WHERE status IN ('pending', 'claimed')`
    - `idx_extraction_jobs_company ON (company_id)`
- **Acceptance:**
  - [ ] Migration applies without error: `supabase db push` or local `psql`
  - [ ] Stage CHECK constraint includes all 10 values
  - [ ] Status CHECK constraint includes all 6 values
  - [ ] Partial index on pending/claimed status created

### VEC-013.2: RLS policies and claim function
- **Effort:** 1.5h
- **Dependencies:** VEC-013.1
- **File:** `supabase/migrations/20260217000001_create_extraction_jobs.sql` (extend same file)
- **Deliverable:** RLS policies and `claim_extraction_job()` stored function
- **Implementation:**
  - Enable RLS: `ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY`
  - RLS SELECT policy: company members can read their own jobs via `public.get_user_company_id(next_auth.uid()) = company_id`
  - RLS INSERT/UPDATE/DELETE: service role only (no user-facing policies for writes — workers use service role)
  - `claim_extraction_job(worker_id TEXT)` function:
    ```sql
    UPDATE extraction_jobs
    SET status = 'claimed', claimed_at = now(), heartbeat_at = now()
    WHERE id = (
      SELECT id FROM extraction_jobs
      WHERE status = 'pending'
        AND (depends_on = '{}' OR NOT EXISTS (
          SELECT 1 FROM extraction_jobs dep
          WHERE dep.id = ANY(extraction_jobs.depends_on)
            AND dep.status != 'completed'
        ))
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    ```
  - After migration: run `npm run db:gen-types` to regenerate TypeScript types
- **Acceptance:**
  - [ ] RLS SELECT policy allows company-scoped read
  - [ ] RLS blocks cross-company access
  - [ ] `claim_extraction_job()` function uses `SKIP LOCKED` to prevent double-claiming
  - [ ] Dependency check in function (only claims jobs whose dependencies are completed)
  - [ ] `npm run db:gen-types` runs without error after migration

---

## VEC-014: Worker Queue Implementation

### VEC-014.1: Job claim, complete, fail, and heartbeat functions
- **Effort:** 2h
- **Dependencies:** VEC-013 (extraction_jobs table must exist and types regenerated)
- **File:** `lib/extraction/worker-queue.ts` (create)
- **Deliverable:** Core job lifecycle management functions
- **Implementation:**
  - Import `createAdminClient` from `@/utils/supabase/server` (service role for writes)
  - Export `async function claimJob(workerId: string): Promise<ExtractionJob | null>` — calls `claim_extraction_job(workerId)` RPC
  - Export `async function completeJob(jobId: string, result: unknown): Promise<void>` — updates `status: 'completed'`, `result`, `completed_at: now()`
  - Export `async function failJob(jobId: string, error: string): Promise<void>`:
    - Increment `attempt`
    - If `attempt >= max_attempts` → set `status: 'dead_letter'`
    - Else → set `status: 'failed'`, `error: error`
  - Export `async function heartbeat(jobId: string): Promise<void>` — updates `heartbeat_at: now()`
  - Use `ExtractionJob` type from `lib/extraction/types.ts` (add to VEC-001.4 if not already there, or define locally)
- **Acceptance:**
  - [ ] `claimJob()` returns null when no pending jobs available
  - [ ] `failJob()` with attempt >= max_attempts sets status to `'dead_letter'`
  - [ ] `completeJob()` sets `completed_at` timestamp
  - [ ] All functions use service role client (admin), not user-scoped client

### VEC-014.2: Job processing pipeline and stale job recovery
- **Effort:** 2.5h
- **Dependencies:** VEC-014.1, VEC-010 (classifyGeometry), VEC-011 (calculateQuantities)
- **File:** `lib/extraction/worker-queue.ts` (extend)
- **Deliverable:** `processJob()` stage router and stale heartbeat recovery
- **Implementation:**
  - Export `async function processJob(job: ExtractionJob): Promise<void>`:
    - Route by `job.stage`:
      - `'extract_vectors'` → call `extractVectorPage(pdfBytes, job.pageNumber)`
      - `'classify_sheet'` → classify page type from VectorPage result
      - `'detect_scale'` → call `detectScale(page, metadata)`
      - `'detect_elements'` → call `classifyGeometry(page, scale)` (walls, doors, windows)
      - `'detect_rooms'` → call `detectRooms(...)` if not already run in detect_elements
      - `'extract_schedules'` → stub (VEC-016 not yet implemented)
      - `'extract_mep'` → stub (VEC-018–020 not yet implemented)
      - `'calculate_quantities'` → call `calculateQuantities(...)`
      - `'cross_page_reconcile'` → trigger after all per-page jobs complete
      - `'generate_estimate'` → write final `ExtractionResult` to `takeoff_items`
    - Call `heartbeat(job.id)` every 10 seconds during processing (use `setInterval`)
    - On success: call `completeJob(job.id, result)`
    - On error: call `failJob(job.id, error.message)`
  - Export `async function recoverStaleJobs(): Promise<number>`:
    - Find jobs with `status = 'claimed'` and `heartbeat_at < now() - interval '60 seconds'`
    - Reset to `status = 'pending'`, clear `claimed_at` and `heartbeat_at`
    - Return count of recovered jobs
- **Acceptance:**
  - [ ] Stage routing calls correct function for each of 10 stages
  - [ ] Unimplemented stages (schedules, MEP) stub gracefully without error
  - [ ] `recoverStaleJobs()` resets claimed jobs older than 60s
  - [ ] Heartbeat fires every 10s during processing

---

## VEC-015: RCP Ceiling Rules

### VEC-015.1: RCP sheet detection and ceiling grid extraction
- **Effort:** 2h
- **Dependencies:** VEC-001, VEC-002 (VectorPage)
- **File:** `lib/extraction/rules/ceiling-rules.ts` (create)
- **Deliverable:** Ceiling grid detection from Reflected Ceiling Plan sheets
- **Implementation:**
  - Export `function detectCeilingElements(page: VectorPage, rooms: RoomPolygon[], scale: ScaleInfo): CeilingResult`
  - Define `CeilingResult { gridSize: '2x2' | '2x4' | 'none'; ceilingAreaPerRoom: Record<string, number>; fixtureCount: number; diffuserCount: number }`
  - **RCP Sheet Guard:** If `page.sheetType !== 'rcp'` return empty `CeilingResult` immediately
  - **Ceiling Grid Detection:**
    - Find all horizontal lines: group by Y-coordinate (within 0.1" tolerance)
    - Find all vertical lines: group by X-coordinate
    - Compute Y-spacings between horizontal line groups, X-spacings between vertical groups
    - If median Y-spacing ≈ 24" ± 2" AND median X-spacing ≈ 24" ± 2" → `gridSize: '2x2'`
    - If median Y-spacing ≈ 24" ± 2" AND median X-spacing ≈ 48" ± 2" (or vice versa) → `gridSize: '2x4'`
    - Otherwise → `gridSize: 'none'`
  - **Ceiling Area per Room:**
    - Use room polygons (passed in from VEC-009 results) — ceiling area = floor area
    - `ceilingAreaPerRoom[room.id] = room.areaSqft`
- **Acceptance:**
  - [ ] Non-RCP page returns empty result without errors
  - [ ] Grid with 24"×48" spacing → `gridSize: '2x4'`
  - [ ] Grid with 24"×24" spacing → `gridSize: '2x2'`
  - [ ] Ceiling area matches room floor area

### VEC-015.2: Fixture and diffuser symbol detection
- **Effort:** 2h
- **Dependencies:** VEC-015.1
- **File:** `lib/extraction/rules/ceiling-rules.ts` (extend)
- **Deliverable:** Count of light fixtures and HVAC diffusers from RCP symbol patterns
- **Implementation:**
  - **Light Fixture Detection:**
    - Find `VectorRect` with aspect ratio 1:1 to 1:2 (square or 2×4 ratio), area 4–16 sqft real
    - Must have internal cross pattern: two lines from corner to corner (X shape) inside the rect bounds
    - Count as `fixture`
  - **Diffuser Detection:**
    - Find `VectorRect` or closed `VectorPath` forming square
    - Must have concentric line pattern: 2–3 smaller concentric rects inside (inset by consistent margin)
    - Count as `diffuser`
  - These are approximate — flag detected items with `needsReview: true` if confidence < 70
  - Store `fixtureCount` and `diffuserCount` in `CeilingResult`
- **Acceptance:**
  - [ ] Rect with X cross inside → counted as fixture
  - [ ] Rect with concentric inner rects → counted as diffuser
  - [ ] Counts stored in `CeilingResult`
  - [ ] `CeilingResult` type exported from `lib/extraction/rules/ceiling-rules.ts`

---

## Cross-Dependency Summary

```
VEC-001.1 → VEC-001.2 → VEC-001.3 → VEC-001.4
                                         ↓
VEC-002.1 → VEC-002.2 → VEC-002.3 → VEC-002.4 → VEC-002.5
                                ↓
VEC-003.1 → VEC-003.2 → VEC-003.3
                                ↓
VEC-004.1 → VEC-004.2 → VEC-004.3
     ↓              ↓
VEC-005.1 → VEC-005.2
     ↓
VEC-008.1 (also needs VEC-004)
     ↓
VEC-009.1 → VEC-009.2 → VEC-009.3
     ↓
VEC-010.1 → VEC-010.2
     ↓
VEC-011.1 → VEC-011.2

VEC-006.1 → VEC-006.2   (parallel with VEC-002 — no VectorPage dependency in scorer itself)

VEC-007.1 (needs VEC-002) → VEC-007.2 (needs VEC-010 + VEC-011)

VEC-012.1  (standalone — verify existing file)

VEC-013.1 → VEC-013.2  (then run npm run db:gen-types)
     ↓
VEC-014.1 → VEC-014.2 (needs VEC-010 + VEC-011)

VEC-015.1 → VEC-015.2
```

### Parallelizable Work

After VEC-001 is complete:
- VEC-002.x and VEC-006.x can start in parallel
- VEC-013.x can start at any time (no code dependencies)
- VEC-012.1 can start at any time (existing file audit)

After VEC-002 is complete:
- VEC-003.x starts
- VEC-007.1 can start (only needs VectorPage type and extractVectorPage stub)

After VEC-004 is complete:
- VEC-005.x, VEC-008.x, VEC-009.x all start in parallel

---

## Subtask Count Summary

| Parent Task | Subtasks | Total Estimated Hours |
|-------------|----------|-----------------------|
| VEC-001 | 4 subtasks | ~6h |
| VEC-002 | 5 subtasks | ~11h |
| VEC-003 | 3 subtasks | ~5.5h |
| VEC-004 | 3 subtasks | ~6.5h |
| VEC-005 | 2 subtasks | ~4.5h |
| VEC-006 | 2 subtasks | ~3h |
| VEC-007 | 2 subtasks | ~4h |
| VEC-008 | 1 subtask | ~2.5h |
| VEC-009 | 3 subtasks | ~6h |
| VEC-010 | 2 subtasks | ~3h |
| VEC-011 | 2 subtasks | ~3.5h |
| VEC-012 | 1 subtask | ~1.5h |
| VEC-013 | 2 subtasks | ~3h |
| VEC-014 | 2 subtasks | ~4.5h |
| VEC-015 | 2 subtasks | ~4h |
| **Total** | **36 subtasks** | **~68.5h** |

---

## Implementation Notes for Backend Engineer

1. **pdfjs-dist v5 is already installed** — import from `pdfjs-dist/legacy/build/pdf.mjs`. No canvas, no worker needed in Node.js.
2. **Do NOT modify** `lib/ai/parse-prompt.ts` or `lib/ai/normalize-takeoff.ts` — these are used by the OpenAI fallback path.
3. **Do NOT deprecate** `/api/estimates/parse` — it remains active for `openai` and `auto` modes.
4. **`extraction_jobs as any` casts** in `extract/route.ts` are intentional until VEC-013 migration is applied and `npm run db:gen-types` is run.
5. **Auth pattern:** All DB writes use `createAdminClient()` (service role). Auth checks on API routes use `import { auth } from '@/lib/auth'`.
6. **Company isolation:** Always include `company_id` check in queries. Use `public.get_user_company_id(next_auth.uid())` in SQL policies.
7. **TypeScript:** Run `npm run lint:ts` after each subtask before marking complete.
8. **Test fixture:** Use the 140 W Valley Blvd commercial restaurant TI plan (26 pages, all sheet types) as primary validation target.
