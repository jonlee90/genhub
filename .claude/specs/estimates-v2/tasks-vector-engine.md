# Vector Extraction Engine — Implementation Subtasks

**Spec:** `requirements.md` P0: Vector Extraction Engine (REQ-027–042)
**Date:** 2026-02-16 | **Status:** DRAFT
**Based on:** `requirements.md` v2.3, `design.md` v2.4

---

## Codebase Status (as of 2026-02-16)

| File | Status | Notes |
|------|--------|-------|
| `app/api/estimates/extract/route.ts` | ✅ EXISTS | Creates `extraction_jobs` rows. No vector engine wired. |
| `app/api/estimates/extraction-progress/route.ts` | ✅ EXISTS | Progress GET endpoint |
| `lib/extraction/progress-tracker.ts` | ✅ EXISTS | `useExtractionProgress` Supabase Realtime hook |
| `lib/extraction/result-assembler.ts` | ✅ EXISTS (partial) | `calculateExtractionProgress` utility |
| `lib/extraction/validation/micro-confirmation.ts` | ✅ EXISTS | Unknown — check before using |
| `lib/extraction/vector-parser.ts` | ❌ MISSING | Core — REQ-027 |
| `lib/extraction/types.ts` | ❌ MISSING | Core — REQ-027/033 |
| `lib/extraction/geometry-classifier.ts` | ❌ MISSING | REQ-028 orchestrator |
| `lib/extraction/rules/` (entire dir) | ❌ MISSING | REQ-028–031, 038–042 |
| `lib/extraction/scale-detector.ts` | ❌ MISSING | REQ-029 |
| `lib/extraction/quantity-calculator.ts` | ❌ MISSING | REQ-031 |
| `lib/extraction/confidence-scorer.ts` | ❌ MISSING | REQ-032 |
| `lib/extraction/worker-queue.ts` | ❌ MISSING | REQ-035 |
| `lib/extraction/schedule-parser.ts` | ❌ MISSING | REQ-038 |
| `supabase/migrations/*_extraction_jobs.sql` | ❌ MISSING | REQ-035 DB migration |

**Current behavior:** `/api/estimates/extract` queues jobs but no worker processes them. All live parsing still uses GPT-4o via `/api/estimates/parse`.

---

## Implementation Tiers

| Tier | Tasks | Scope |
|------|-------|-------|
| **Tier 1 (MVP)** | VEC-001–007 | Types, vector parser, scale, walls+doors, confidence, router wiring |
| **Tier 2 (Core)** | VEC-008–012 | Windows, rooms, classifier orchestrator, quantities, progress API |
| **Tier 3 (Infrastructure)** | VEC-013–015 | DB migration, worker queue, RCP rules |
| **Tier 4 (Schedules)** | VEC-016–017 | Table/schedule extraction, finish schedule mapping |
| **Tier 5 (MEP)** | VEC-018–020 | Electrical, plumbing, HVAC extraction |
| **Tier 6 (Expansion)** | VEC-021–022 | Stairs/columns/elevators, multi-scale zones |

---

## TIER 1: MVP — Walls, Doors, Scale, Routing

### VEC-001: Types & Shared Interfaces

**ID:** `VEC-001`
**Priority:** P0 — Must be first
**Agent:** backend-engineer
**Effort:** 0.5 days
**Dependencies:** None

**Description:** Create the shared TypeScript interfaces used by all extraction modules.

**New Files:**
- `lib/extraction/types.ts`

**Acceptance Criteria:**
- [ ] `VectorLine { start: Point; end: Point; strokeWidth: number; dashArray: number[] | null }`
- [ ] `VectorArc { center: Point; radius: number; startAngle: number; endAngle: number; strokeWidth: number }`
- [ ] `VectorPath { points: Point[]; isClosed: boolean; hasFill: boolean; fillColor: string | null; strokeWidth: number }`
- [ ] `TextObject { content: string; position: Point; fontSize: number; bounds: Rect }`
- [ ] `VectorRect { x: number; y: number; width: number; height: number; hasFill: boolean; strokeWidth: number }`
- [ ] `VectorPage` with `pageNumber`, `pageClassification`, `sheetType`, `elements`, `textClusters`, `scale`
- [ ] `ScaleInfo { factor: number; confidence: 'metadata'|'explicit'|'scale_bar'|'calibrated'|'inferred'|'user_provided'; requiresCalibration?: boolean }`
- [ ] Full `ExtractionResult` schema matching REQ-033 (project_summary, rooms, walls, doors, windows, ceiling, quantities, equipment, finishes, mep, extraction_meta)
- [ ] All coordinates in inches (1 PDF point = 1/72 inch — document this)

---

### VEC-002: Vector PDF Preprocessor

**ID:** `VEC-002`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 2.5 days
**Dependencies:** VEC-001

**Description:** Extract raw vector elements from CAD-exported PDFs using `pdfjs-dist` v5 `getOperatorList()` API. Already installed — do NOT re-install.

**New Files:**
- `lib/extraction/vector-parser.ts`

**Acceptance Criteria:**

**REQ-027A — Element Extraction:**
- [ ] Parse `constructPath` operators → lines, arcs, bezier paths with stroke/fill metadata
- [ ] Parse `paintImageXObject` operators for raster/vector classification (REQ-027D)
- [ ] Parse text operators → `TextObject[]` with position, font size, content
- [ ] Normalize all coordinates from PDF points to inches (`value / 72`)
- [ ] Export: `async function extractVectorPage(pdfBytes: Buffer, pageNumber: number): Promise<VectorPage>`

**REQ-027B — Text Clustering:**
- [ ] Cluster by spatial proximity (merge text within 2" of each other)
- [ ] Classify clusters: `roomNames` (centered, inside polygon), `dimensions` (near extension lines, pattern `\d+'-\d+"`), `notes` (outside plan boundary), `titleBlock` (bottom-right quadrant), `sheetTitle` (top, large font)

**REQ-027C — Sheet Filtering:**
- [ ] Return `sheetType: 'detail'` when sheet title contains "DETAIL" → caller skips
- [ ] Return `sheetType: 'code'` for "CODE" title → caller skips
- [ ] Detect title-block-only / cover pages → `sheetType: 'unknown'` with low element density flag

**REQ-027D — Raster vs Vector Classification:**
- [ ] `paintImageXObject` > 90% page area AND < 10 `constructPath` → `pageClassification: 'raster'`
- [ ] < 10% image area AND > 50 `constructPath` → `pageClassification: 'vector'`
- [ ] Otherwise → `pageClassification: 'mixed'`

**REQ-027E — Hatch & Dimension Line Filtering:**
- [ ] Detect parallel lines at consistent angle (±0.5°) and spacing (±0.1") → mark as hatch, exclude from geometry
- [ ] Detect lines with arrow/tick endpoints + associated dimension text → mark as dimension line, exclude
- [ ] Filter runs BEFORE returning elements (downstream classifiers receive clean geometry)

**Implementation Note:**
```typescript
// pdfjs-dist v5 Node usage — no canvas required
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
// Use getDocument({ data: pdfBytes }) then page.getOperatorList()
// OPS.constructPath, OPS.moveTo, OPS.lineTo, OPS.curveTo, OPS.closePath
// OPS.paintImageXObject, OPS.setLineWidth, OPS.setDash
```

---

### VEC-003: Scale Detector

**ID:** `VEC-003`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-001, VEC-002

**Description:** 6-priority cascade to determine drawing scale. Stops at first successful detection.

**New Files:**
- `lib/extraction/scale-detector.ts`

**Acceptance Criteria:**

- [ ] Export: `async function detectScale(page: VectorPage, pdfMetadata?: Record<string, string>): Promise<ScaleInfo | null>`
- [ ] **Priority 1 (REQ-029A):** Parse PDF `/UserUnit` metadata + custom keys → `confidence: 'metadata'`
- [ ] **Priority 2 (REQ-029B):** Title block text regex for all scale patterns:
  - Architectural: `1/8"=1'-0"` → 96, `3/16"=1'-0"` → 64, `1/4"=1'-0"` → 48, `3/8"=1'-0"` → 32, `1/2"=1'-0"` → 24, `1"=1'-0"` → 12
  - Engineering: `1"=10'` → 120, `1"=20'` → 240, `1"=30'` → 360, `1"=40'` → 480, `1"=50'` → 600, `1"=100'` → 1200
  - Metric: `1:50` → 50, `1:100` → 100, `1:200` → 200, `1:500` → 500
  - Dynamic: `Scale: X" = Y'-Z"` → compute factor
  - → `confidence: 'explicit'`
- [ ] **Priority 3 (REQ-029C):** Detect graphic scale bars (horizontal line + tick marks + numeric labels) → compute from tick spacing → `confidence: 'scale_bar'`
- [ ] **Priority 4 (REQ-029D):** Dimension string calibration — find 3+ dimension strings, measure vector distance to extension line endpoints, reject outliers >2σ, use median → `confidence: 'calibrated'`
- [ ] **Priority 5 (REQ-029E):** Sheet size inference from PDF MediaBox (ARCH D 24×36 → likely 48, ARCH E 36×48 → likely 96) → `confidence: 'inferred'`
- [ ] **Priority 6 fallback (REQ-029G):** Return `null` with `requiresCalibration: true` when all methods fail

---

### VEC-004: Wall Detection Rules

**ID:** `VEC-004`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 2 days
**Dependencies:** VEC-001, VEC-002, VEC-003

**Description:** Classify vector elements as walls using 4 geometric rules + TI construction status classification.

**New Files:**
- `lib/extraction/rules/wall-rules.ts`

**Acceptance Criteria:**

**4 Wall Rules (REQ-028A):**
- [ ] **Rule 1 — Parallel Line Pair:** Two parallel lines, perpendicular distance 3"–12", both length > 24" → `WALL`
- [ ] **Rule 2 — Filled Rectangle:** Aspect ratio > 4:1, shorter dimension 3"–12", has fill → `WALL`
- [ ] **Rule 3 — Thick Single Line:** strokeWidth converts to 3"–12" at drawing scale, length > 24" → `WALL`
- [ ] **Rule 4 — Curved Wall:** Bezier path, consistent thickness 3"–12", radius > 36" → `CURVED_WALL`
- [ ] Skip dashed lines (hidden/demolition — handled by TI classification below)
- [ ] `thickness > 8"` → `type: 'structural'`; `<= 8"` → `type: 'partition'`
- [ ] Intersection detection: T, L, X types (tolerance 2")

**TI Wall Classification (REQ-028A TI extension):**
- [ ] Parse floor plan legend (bottom-left of sheet) for line style definitions
- [ ] Match legend → wall line properties (strokeWidth, dashArray, fillColor, opacity)
- [ ] Fallback (no legend): heavy lines → `new`, lighter/gray → `existing_to_remain`, dashed → `demolition`
- [ ] Each wall output includes `construction_status: 'new' | 'existing_to_remain' | 'demolition'`

**Export:**
```typescript
export function detectWalls(page: VectorPage, scale: ScaleInfo): WallSegment[]
```

---

### VEC-005: Door Detection Rules

**ID:** `VEC-005`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-001, VEC-002, VEC-004

**Description:** Detect doors using 6 geometric rules plus a universal wall-gap fallback.

**New Files:**
- `lib/extraction/rules/door-rules.ts`

**Acceptance Criteria:**

- [ ] **Rule 1 — Arc at Wall Gap:** Arc sweep 80–100°, radius 20"–60", endpoint within 2" of wall endpoint → `DOOR`
- [ ] **Rule 2 — Polyline Arc:** 8+ short segments forming ~90° curve with consistent radius, near wall gap → `DOOR`
- [ ] **Rule 3 — Pocket Door:** Thin rectangle partially inside wall cavity, width matches gap → `POCKET_DOOR`
- [ ] **Rule 4 — Sliding Door:** Two overlapping thin rectangles at wall gap, each ~50% of opening → `SLIDING_DOOR`
- [ ] **Rule 5 — Bi-fold:** Zigzag pattern of thin rectangles at wall gap → `BIFOLD_DOOR`
- [ ] **Rule 6 — Overhead/Garage:** Dashed lines across gap > 96" (8'), wall continues both sides → `OVERHEAD_DOOR`
- [ ] **Fallback:** Gap 24"–120" with wall on both sides, no rule matched → `DOOR` (low confidence, review flag)
- [ ] Two mirrored arcs at same opening → `DOUBLE_DOOR`, width = radius × 2
- [ ] Door width = arc radius (single door)

**Export:**
```typescript
export function detectDoors(page: VectorPage, walls: WallSegment[], scale: ScaleInfo): DoorElement[]
```

---

### VEC-006: Confidence Scorer

**ID:** `VEC-006`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 0.5 days
**Dependencies:** VEC-001

**Description:** Score each extracted element 0–100 and generate review flags.

**New Files:**
- `lib/extraction/confidence-scorer.ts`

**Acceptance Criteria:**

**Scoring (REQ-032):**
- [ ] Vector geometry match: 0–50 graduated (exact=50, partial=25–40, weak=10–20)
- [ ] Text validation: 0–20 (associated text confirms classification)
- [ ] Dimension confirmation: 0–15 (scale-converted measurement within expected range)
- [ ] Symbol match: 0–15 (CAD symbol matches known pattern)

**Penalties:**
- [ ] Conflicting signals (multiple rules match, different classification): -20
- [ ] Ambiguous geometry (partially matches multiple rules): -10
- [ ] Scale missing: -15
- [ ] Low element density (isolated element): -5

**Thresholds:**
- [ ] Score >= 70 → `needs_review: false`
- [ ] Score 40–69 → `needs_review: true`
- [ ] Score < 40 → `needs_review: true` + `low_confidence_warning`

**Auto-generated Review Flags:**
- [ ] Scale uncertain (no explicit scale text)
- [ ] Overlapping room polygons
- [ ] Wall thickness inconsistent within sheet
- [ ] Arc not matched to wall endpoint
- [ ] Text cluster outside all room boundaries
- [ ] Open polygon (room boundary not closed)

**Export:**
```typescript
export function scoreElement(element: WallSegment | DoorElement | WindowElement | RoomPolygon, context: ScoringContext): { score: number; factors: Record<string, number>; reviewFlags: string[] }
```

---

### VEC-007: Extraction Router Upgrade

**ID:** `VEC-007`
**Priority:** P0
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-002, VEC-003, VEC-004, VEC-005, VEC-006

**Description:** Wire the vector engine into the existing `/api/estimates/extract` route. Add `EXTRACTION_ENGINE` env var routing.

**Modified Files:**
- `app/api/estimates/extract/route.ts` (upgrade existing stubs to call real engine)

**Acceptance Criteria:**

- [ ] Read `process.env.EXTRACTION_ENGINE` (`'auto'` | `'vector'` | `'openai'`, default `'auto'`)
- [ ] `auto` mode: classify page via `pageClassification` from VEC-002 → route vector pages to rule engine, raster pages to `/api/estimates/parse`
- [ ] `vector` mode: all pages to rule engine, return error for raster pages
- [ ] `openai` mode: all pages to GPT-4o (delegate to existing `/api/estimates/parse`)
- [ ] Both engines write to `takeoff_items` via existing `normalizeTakeoffItem()`
- [ ] Vector extraction logs: `cost: 0`, `model: 'vector-engine-v1'` to `ai_usage_log`
- [ ] GPT-4o fallback logs actual cost
- [ ] Remove `as any` casts on `extraction_jobs` once Tier 3 DB migration is applied (leave TODO comment for now)

---

## TIER 2: Core — Windows, Rooms, Quantities

### VEC-008: Window Detection Rules

**ID:** `VEC-008`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-001, VEC-004

**New Files:**
- `lib/extraction/rules/window-rules.ts`

**Acceptance Criteria:**
- [ ] **Rule 1 — Thin Rectangle in Wall:** Rectangle embedded in detected wall, width 24"–120", thickness < wall thickness → `WINDOW`
- [ ] **Curtain Wall / Storefront:** Continuous window band > 120", regular mullion lines (consistent spacing) → `CURTAIN_WALL` with total width + mullion count
- [ ] Window schedule cross-reference: detect text annotations near windows matching "W1", "W-01" patterns; include schedule reference in output
- [ ] Window width = rectangle width

---

### VEC-009: Room Detection

**ID:** `VEC-009`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 2 days
**Dependencies:** VEC-004

**New Files:**
- `lib/extraction/rules/room-rules.ts`

**Acceptance Criteria:**
- [ ] **Wall-Graph Cycle Detection (REQ-028D):** Build graph (walls=edges, intersections=nodes), find minimal cycles via planar face enumeration
- [ ] **Point-in-Polygon text assignment:** Ray casting algorithm — NOT centroid distance (fails for L-shaped rooms)
- [ ] Room classification from text: BR/BEDROOM → bedroom, KIT/KITCHEN → kitchen, LR/LIVING → living_room, BA/BATH → bathroom, MECH → mechanical, STOR → storage, GAR → garage, OFFICE → office, LAU/LAUNDRY → laundry, CL/CLOSET → closet
- [ ] **Area:** Shoelace formula `|Σ(x_i × y_{i+1} - x_{i+1} × y_i)| / 2 × scale_factor²` (handles CW and CCW)
- [ ] **Perimeter:** Sum wall segment lengths × scale_factor
- [ ] Open polygon (gap > door width) → NOT a room, add review flag
- [ ] Each room includes: name, area_sqft, perimeter_ft, wall_segments, doors, windows, confidence_score

---

### VEC-010: Geometry Classifier Orchestrator

**ID:** `VEC-010`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-004, VEC-005, VEC-008, VEC-009

**Description:** Orchestrates all detection rules in correct order. Hatch filtering must run first.

**New Files:**
- `lib/extraction/geometry-classifier.ts`

**Acceptance Criteria:**
- [ ] Pipeline order: hatch filter (VEC-002E) → scale detect → walls → doors → windows → rooms
- [ ] Passes filtered element set to each rule module (hatches/dimension lines already removed by VEC-002)
- [ ] Export: `async function classifyGeometry(page: VectorPage, scale: ScaleInfo): Promise<ClassificationResult>`
- [ ] `ClassificationResult` includes walls, doors, windows, rooms with confidence scores

---

### VEC-011: Quantity Calculator

**ID:** `VEC-011`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-001, VEC-009

**New Files:**
- `lib/extraction/quantity-calculator.ts`

**Acceptance Criteria:**

- [ ] **Drywall SF (REQ-031):** `wall_area = wall_length × ceiling_height - door_openings - window_openings` — only `new` walls (TI filter); partition walls ×2, structural walls ×1
- [ ] **Flooring SF:** Sum `room_area` for all rooms excluding "unfinished" and "mechanical"
- [ ] **Baseboard LF:** `room_perimeter - sum(door_widths)` per room, summed across all rooms
- [ ] **Ceiling SF:** `ceiling_area` per room
- [ ] **Paint SF:** All walls (`new` + `existing_to_remain`) — not demo
- [ ] **Demo drywall SF:** Walls with `construction_status = 'demolition'`
- [ ] **Demo framing LF:** Demolition wall lengths
- [ ] Ceiling height: extract from section drawings or default 9'-0" (flagged for review)
- [ ] Export: `function calculateQuantities(rooms: RoomPolygon[], walls: WallSegment[], doors: DoorElement[], windows: WindowElement[]): QuantityResult`

---

### VEC-012: Extraction Progress API

**ID:** `VEC-012`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 0.5 days
**Dependencies:** None (endpoint exists, check what's needed)

**Files:**
- `app/api/estimates/extraction-progress/route.ts` (verify/complete)

**Acceptance Criteria:**
- [ ] Read existing file first — confirm GET handler exists
- [ ] `GET /api/estimates/extraction-progress?planUploadId=X` returns `ExtractionProgress` shape expected by `useExtractionProgress` hook
- [ ] Queries `extraction_jobs` grouped by `plan_upload_id`, computes `completedJobs / totalJobs`
- [ ] Returns `{ stage, percentage, eta, jobs[] }`
- [ ] Auth + company scoping

---

## TIER 3: Infrastructure — Worker Queue, RCP

### VEC-013: Extraction Jobs DB Migration

**ID:** `VEC-013`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 0.5 days
**Dependencies:** None

**Description:** Create the `extraction_jobs` table that `extract/route.ts` already references via `as any` casts.

**New Files:**
- `supabase/migrations/20260217000001_create_extraction_jobs.sql`

**Acceptance Criteria:**
- [ ] `extraction_jobs` table with all columns from REQ-035 (id, plan_upload_id, company_id, page_number, stage, status, depends_on, result, error, attempt, max_attempts, claimed_at, heartbeat_at, completed_at)
- [ ] `stage` CHECK constraint with all 10 stage values
- [ ] `status` CHECK constraint: `pending`, `claimed`, `processing`, `completed`, `failed`, `dead_letter`
- [ ] `claim_extraction_job(worker_id TEXT)` function using `SKIP LOCKED`
- [ ] Index on `status WHERE status IN ('pending', 'claimed')`
- [ ] Index on `plan_upload_id`
- [ ] RLS: company-scoped read, service role write
- [ ] Run `npm run db:gen-types` after applying

---

### VEC-014: Worker Queue Implementation

**ID:** `VEC-014`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-013, VEC-010, VEC-011

**New Files:**
- `lib/extraction/worker-queue.ts`

**Acceptance Criteria:**
- [ ] `claimJob(workerId: string): Promise<ExtractionJob | null>` — calls `claim_extraction_job()` RPC
- [ ] `completeJob(jobId: string, result: unknown): Promise<void>`
- [ ] `failJob(jobId: string, error: string): Promise<void>` — increments attempt, moves to dead_letter at max_attempts
- [ ] `heartbeat(jobId: string): Promise<void>` — updates `heartbeat_at`
- [ ] `processJob(job: ExtractionJob): Promise<void>` — routes to correct stage handler
- [ ] Heartbeat monitoring: jobs with `heartbeat_at < now() - 60s` reset to `pending`
- [ ] Pipeline stages mapped to VEC-002 through VEC-011 functions
- [ ] Cross-page stages (`cross_page_reconcile`, `generate_estimate`) trigger after all page jobs complete

---

### VEC-015: RCP Ceiling Rules

**ID:** `VEC-015`
**Priority:** P1
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-001, VEC-002

**New Files:**
- `lib/extraction/rules/ceiling-rules.ts`

**Acceptance Criteria (REQ-030):**
- [ ] Detect RCP sheets via title containing "REFLECTED CEILING PLAN" or "RCP"
- [ ] Detect ceiling grid: evenly spaced orthogonal lines (typically 2'×2' or 2'×4')
- [ ] Detect light fixtures: rectangle with internal cross pattern
- [ ] Detect diffusers: square with concentric line pattern
- [ ] Compute `ceiling_area` per room from room polygons
- [ ] Return `{ grid_size, ceiling_area, fixture_count, diffuser_count }`

---

## TIER 4: Schedules & Finishes

### VEC-016: Table / Schedule Parser

**ID:** `VEC-016`
**Priority:** P2
**Agent:** backend-engineer
**Effort:** 3 days
**Dependencies:** VEC-001, VEC-002

**New Files:**
- `lib/extraction/schedule-parser.ts`
- `lib/extraction/rules/schedule-rules.ts`

**Acceptance Criteria:**

**REQ-038A — Table Detection:**
- [ ] Detect grid of H/V lines forming cells with consistent row/column dimensions (±5%)
- [ ] Classify by headers: `equipment_schedule`, `door_schedule`, `plumbing_fixture_schedule`, `panel_schedule`, `finish_schedule`, `window_schedule`

**REQ-038B — Equipment Schedule:**
- [ ] Parse per row: item number, name, manufacturer, model, dimensions (W×D×H), utility requirements, quantity
- [ ] Map to trade: kitchen equipment → `food_service`, HVAC → `hvac`, plumbing fixtures → `plumbing`

**REQ-038C — Door Schedule:**
- [ ] Parse: door mark, size (W×H), type, frame, hardware set, fire rating
- [ ] Cross-reference with geometrically detected doors (enrich data)

**REQ-038D — Plumbing Fixture Schedule:**
- [ ] Parse: fixture type, mark, manufacturer, model, connection sizes, GPM, trap size, quantity

**REQ-038E — Electrical Panel Schedule:**
- [ ] Parse: panel identifier, main breaker size, voltage/phase, circuit list (number, description, breaker size, load), total connected load

---

### VEC-017: Finish Schedule → Room Mapping

**ID:** `VEC-017`
**Priority:** P2
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-009, VEC-016

**New Files:**
- `lib/extraction/rules/finish-rules.ts`

**Acceptance Criteria (REQ-039):**
- [ ] Detect finish schedule tables via REQ-038A with `finish_schedule` type
- [ ] Decode floor abbreviations: CT, VCT, CPT, CONC, EPX, HWD, PORC
- [ ] Decode base abbreviations: RB, CB, WB, VB
- [ ] Decode wall abbreviations: GWB, FRP, CT, PORC
- [ ] Decode ceiling abbreviations: ACT, GWB, EXP, SCC
- [ ] Cross-reference with detected rooms by name
- [ ] Refine quantities for known finish types: tile rooms → SF with 15% waste, carpet → SY with 10% waste, FRP walls → additional wall finish SF
- [ ] Rooms not in finish schedule → `finishes: null` + review flag

---

## TIER 5: MEP Extraction

### VEC-018: Electrical Extraction

**ID:** `VEC-018`
**Priority:** P2
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-001, VEC-016

**New Files:**
- `lib/extraction/rules/electrical-rules.ts`

**Acceptance Criteria (REQ-040):**
- [ ] **REQ-040A — Device Counting:** Detect E-prefix / "POWER" / "ELECTRICAL" sheets. Count by symbol: duplex outlet, GFI, 220V/dedicated, single-pole switch, 3-way switch (S3), dimmer (SD), junction box
- [ ] **REQ-040B — Lighting Fixture Counting:** Recessed cans, 2×4 troffers, linear fixtures, track lighting, exit signs, emergency lights. Cross-reference with lighting schedule.
- [ ] **REQ-040C — Panel Summary:** Total panels, main breaker sizes, total circuit count, dedicated circuit count (from REQ-038E)

---

### VEC-019: Plumbing Extraction

**ID:** `VEC-019`
**Priority:** P2
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-001, VEC-016

**New Files:**
- `lib/extraction/rules/plumbing-rules.ts`

**Acceptance Criteria (REQ-041):**
- [ ] **REQ-041A — Fixture Schedule:** Parse from VEC-016. Count: water closets (floor/wall), lavatories, sinks (kitchen/bar/mop/hand), floor drains, floor sinks, hose bibbs, drinking fountains
- [ ] **REQ-041B — Symbol Counting:** P-prefix sheets. Detect: cleanouts (CO), backflow preventers (BFP), water heater (WH), grease interceptor (GI). Populate `water_heater` and `grease_interceptor` fields

---

### VEC-020: HVAC Extraction

**ID:** `VEC-020`
**Priority:** P2
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-001, VEC-016

**New Files:**
- `lib/extraction/rules/hvac-rules.ts`

**Acceptance Criteria (REQ-042):**
- [ ] **REQ-042A — Equipment Schedule:** Parse from VEC-016. Extract: unit ID (RTU-1), type, capacity (tons/BTU/CFM), electrical requirements, refrigerant, quantity
- [ ] **REQ-042B — Duct Run Measurement:** M-prefix sheets. Detect supply (solid), return (dashed), exhaust (dash-dot) by line style + legend. Measure LF by size, count elbows/tees/transitions
- [ ] **REQ-042C — Diffuser Counting:** Supply diffusers, return grilles, exhaust grilles, thermostats by size. Cross-reference diffuser schedule.

---

## TIER 6: Expansion (Phase 2 — after field validation)

### VEC-021: Additional Element Detection (Stairs, Columns, Elevators)

**ID:** `VEC-021`
**Priority:** P3 — Phase 2
**Agent:** backend-engineer
**Effort:** 1.5 days
**Dependencies:** VEC-010

**New Files:**
- `lib/extraction/rules/stair-rules.ts`
- `lib/extraction/rules/column-rules.ts`
- `lib/extraction/rules/elevator-rules.ts`

> Implement after Tier 1–2 is validated with real commercial plans.

---

### VEC-022: Multi-Scale Zone Detection

**ID:** `VEC-022`
**Priority:** P3 — Phase 2
**Agent:** backend-engineer
**Effort:** 1 day
**Dependencies:** VEC-003

> Detect detail views with different scales on same page (REQ-029F). Implement after Tier 1–2 validated.

---

## Dependency Graph

```
VEC-001 (types)
  └─ VEC-002 (vector parser)
       ├─ VEC-003 (scale detector)
       │    └─ VEC-004 (wall rules)
       │         ├─ VEC-005 (door rules)
       │         ├─ VEC-008 (window rules)
       │         └─ VEC-009 (room rules)
       │              └─ VEC-011 (quantity calculator)
       └─ VEC-015 (RCP rules)
       └─ VEC-016 (schedule parser)
            ├─ VEC-017 (finish rules)      [requires VEC-009]
            ├─ VEC-018 (electrical rules)
            ├─ VEC-019 (plumbing rules)
            └─ VEC-020 (HVAC rules)

VEC-006 (confidence scorer) ─ no deps, can run parallel with VEC-002

VEC-004 + VEC-005 + VEC-008 + VEC-009
  └─ VEC-010 (geometry classifier orchestrator)
       └─ VEC-014 (worker queue)    [requires VEC-013 migration]

VEC-007 (router upgrade) ─ after VEC-002 through VEC-006
VEC-012 (progress API) ─ no deps
VEC-013 (DB migration) ─ no deps
```

**Parallel work possible:**
- VEC-001 → kick off VEC-002 and VEC-006 in parallel
- VEC-013 (migration) can run any time before VEC-014
- VEC-012 (progress API check) can run any time

---

## Effort Summary

| Tier | Tasks | Days |
|------|-------|------|
| Tier 1 (MVP) | VEC-001–007 | ~9 days |
| Tier 2 (Core) | VEC-008–012 | ~5.5 days |
| Tier 3 (Infrastructure) | VEC-013–015 | ~3 days |
| Tier 4 (Schedules) | VEC-016–017 | ~4.5 days |
| Tier 5 (MEP) | VEC-018–020 | ~4 days |
| Tier 6 (Expansion) | VEC-021–022 | ~2.5 days |
| **Total** | 22 tasks | **~28.5 days** |

---

## Implementation Notes

1. **pdfjs-dist v5 already installed** — use `pdfjs-dist/legacy/build/pdf.mjs` for Node.js (no canvas required)
2. **Do NOT touch** `lib/ai/parse-prompt.ts` or `lib/ai/normalize-takeoff.ts` — reused by GPT-4o fallback
3. **Do NOT deprecate** `/api/estimates/parse` — keep functional for `openai` and `auto` modes
4. **extraction_jobs `as any` casts** in `extract/route.ts` are intentional until VEC-013 migration is applied
5. **Skill loading:** Load `postgres-best-practices:postgres-best-practices` before VEC-013; load `vercel-react-best-practices` for any frontend extraction progress components
6. **Test approach:** Use the 140 W Valley Blvd commercial restaurant TI plan as primary test case (26 pages, all sheet types)
