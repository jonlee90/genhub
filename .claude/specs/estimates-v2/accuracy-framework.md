# Accuracy Validation Framework - Estimates v2.3

**Project:** GenHub PWA - Plan Extraction Accuracy Engine
**Date:** 2026-02-14 | **Version:** 1.0 | **Status:** PENDING APPROVAL
**Extends:** `design.md` v2.3, replaces Section 7 (Confidence Scoring)
**Based on:** `requirements.md` v2.3 (REQ-027-042)

---

## Executive Summary

This framework replaces the flat confidence scorer (design.md Section 7) with a 10-layer validation architecture that cross-verifies extraction results through geometry, dimensions, constraints, symbol relationships, schedule reconciliation, and redundant quantity checks before presenting minimal human confirmation prompts.

**Target:** Near-perfect extraction reliability for CAD-exported vector PDFs with minimal human input.

**Key Insight:** A single confidence score computed post-extraction is insufficient. Validation must be woven into every stage of the pipeline, with each layer producing evidence that subsequent layers consume and verify.

---

## 1. Architecture Overview

### 1.1 System Context

```
                     Accuracy Validation Framework
                     =============================

Existing Pipeline (design.md Stages 1-8)
  |
  v
[L1] Vector-First Extraction ---- raw geometry + text (enhanced Stage 1-2)
  |
  v
[L2] Dimension Cross-Validation -- scale verification per dimension string
  |
  v
[L3] Geometry Constraint Solver -- wall graph integrity, closure, angles
  |
  v
[L4] Symbol Relationship Graph --- contextual validation (door-in-wall, etc.)
  |
  v
[L5] Cross-Sheet Reconciliation -- schedule vs geometry counts
  |
  v
[L6] Redundant Quantity Validation - area cross-check (3+ methods)
  |
  v
[L7] Probabilistic Confidence Engine - weighted multi-evidence scoring
  |
  v
[L8] Human Micro-Confirmation --- 3-5 targeted yes/no prompts
  |
  v
[L9] Error Recovery & Auto-Correction - snap, merge, heal
  |
  v
[L10] Final Approval Gate -------- lock or route to review
  |
  v
ExtractionResult (validated)
```

### 1.2 Integration with Existing Pipeline

The framework hooks into the existing 10-stage worker queue pipeline (design.md Section 5.7):

| Existing Stage | Framework Layer(s) Injected |
|---|---|
| `extract_vectors` (Stage 1) | L1 runs as enhancement |
| `detect_scale` (Stage 3) | L2 runs after scale detection |
| `detect_elements` (Stage 4) | L3, L4 run after element detection |
| `detect_rooms` (Stage 5) | L3 (room closure), L6 (area cross-check) |
| `extract_schedules` (Stage 6) | L5 consumes schedule data |
| `calculate_quantities` (Stage 8) | L6 validates quantities |
| `cross_page_reconcile` (Stage 9) | L5 runs cross-sheet checks |
| `generate_estimate` (Stage 10) | L7, L8, L9, L10 run sequentially |

### 1.3 Data Flow Between Layers

Each layer produces a `LayerEvidence` record consumed by downstream layers:

```typescript
interface LayerEvidence {
  layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  elementId: string;           // references DetectedWall.id, DetectedRoom.id, etc.
  elementType: ElementType;
  verdict: 'pass' | 'warn' | 'fail';
  score: number;               // 0-100 contribution to final confidence
  details: string;             // human-readable explanation
  evidence: Record<string, unknown>; // structured data for downstream layers
  autoCorrection?: AutoCorrection;   // if layer applied a fix
}

type ElementType = 'wall' | 'door' | 'window' | 'room' | 'scale'
  | 'schedule_row' | 'quantity' | 'fixture' | 'equipment';

interface AutoCorrection {
  type: string;
  before: unknown;
  after: unknown;
  confidence: number;
}
```

---

## 2. Layer 1 — Vector-First Extraction (Enhanced)

### 2.1 Purpose

Extract raw geometry with quality metadata that downstream layers use for validation. Extends existing `vector-parser.ts` (design.md Section 5.1) with extraction quality signals.

### 2.2 Inputs

- PDF page binary data (ArrayBuffer)
- pdfjs-dist `getOperatorList()` output

### 2.3 Outputs

Existing `VectorPage` (design.md Section 2.1) PLUS:

```typescript
interface ExtractionQuality {
  operatorCount: number;           // total PDF operators processed
  textObjectCount: number;         // text objects extracted
  pathObjectCount: number;         // path/line/arc objects extracted
  imageObjectCount: number;        // raster images found
  cadLayersDetected: string[];     // PDF optional content groups (layers)
  coordinatePrecision: number;     // decimal places in coordinates (CAD = 6+, hand = 1-2)
  hasUserUnitKey: boolean;         // PDF metadata scale hint
  colorSpaceCount: number;         // distinct colors used (CAD typically 4-8)
  duplicatePathCount: number;      // overlapping identical paths (CAD artifact)
  estimatedCadOrigin: 'autocad' | 'revit' | 'archicad' | 'sketchup' | 'unknown';
}
```

### 2.4 Validation Rules

| Rule | Condition | Verdict |
|------|-----------|---------|
| Minimum path density | pathObjectCount > 50 per page | pass/fail |
| CAD origin detection | coordinatePrecision >= 4 | pass (likely CAD) |
| Layer presence | cadLayersDetected.length > 0 | pass (structured CAD) |
| Duplicate filtering | Remove exact duplicate paths | auto-correct |
| Color consistency | colorSpaceCount < 20 | pass (not a rendering) |

### 2.5 Failure States

| Failure | Recovery |
|---------|----------|
| pathObjectCount < 10 | Classify as raster, route to GPT-4o fallback |
| coordinatePrecision < 2 | Flag as hand-drawn/low-quality, reduce all downstream confidence by 20% |
| imageObjectCount > pathObjectCount | Classify as mixed, dual-process |

### 2.6 CAD Origin Detection

```typescript
function detectCadOrigin(page: VectorPage, metadata: Record<string, unknown>): string {
  // AutoCAD: /Producer contains "AutoCAD", high coordinate precision, layer names like "A-WALL"
  // Revit: /Producer contains "Revit", category-based layer names
  // ArchiCAD: /Producer contains "ARCHICAD", specific path patterns
  // SketchUp: /Producer contains "SketchUp", triangulated geometry
  // Unknown: default
}
```

CAD origin informs rule tolerance tuning — AutoCAD exports have tighter geometric precision than SketchUp exports.

### 2.7 File

`lib/extraction/validation/extraction-quality.ts` (**NEW**)

---

## 3. Layer 2 — Dimension Cross-Validation

### 3.1 Purpose

Verify drawing scale by cross-checking every dimension string against its corresponding vector geometry. This catches scale errors before they propagate to all quantity calculations.

### 3.2 Inputs

- `VectorPage.textClusters.dimensions` — dimension text strings
- `VectorPage.elements.lines` — all lines (including extension lines)
- `ScaleInfo` from scale detector (design.md Section 5.3)

### 3.3 Outputs

```typescript
interface DimensionValidation {
  dimensionText: string;        // e.g., "24'-6""
  parsedInches: number;         // 294 inches
  extensionLineSpan: number;    // vector distance between extension line endpoints (drawing units)
  computedScale: number;        // parsedInches / extensionLineSpan
  currentScale: number;         // from ScaleInfo.scaleFactor
  deviation: number;            // |computedScale - currentScale| / currentScale
  verdict: 'pass' | 'warn' | 'fail';
  position: Point;              // location on page for UI highlighting
}

interface ScaleValidationResult {
  dimensions: DimensionValidation[];
  medianComputedScale: number;
  scaleConsistency: number;     // 0-100 (100 = all dimensions agree)
  recommendedScale: number | null; // if current scale appears wrong
  verdict: 'confirmed' | 'uncertain' | 'conflicting';
}
```

### 3.4 Validation Rules

| Rule | Condition | Verdict |
|------|-----------|---------|
| Dimension match | deviation < 2% | pass |
| Dimension soft mismatch | 2% <= deviation < 5% | warn |
| Dimension hard mismatch | deviation >= 5% | fail |
| Scale consensus | >= 80% of dimensions agree within 2% | confirmed |
| Scale conflict | < 50% agree | conflicting → trigger L8 micro-confirmation |

### 3.5 Algorithm: Dimension-Extension Line Pairing

```
For each dimension text cluster:
  1. Parse dimension string → real_inches
     Patterns: XX'-YY", XX'-Y", XX", X.X m, etc.
  2. Find nearest extension lines:
     a. Search within 2" radius of text bounding box
     b. Extension lines are perpendicular to the dimension line
     c. The dimension line connects two extension line endpoints
  3. Measure vector distance between extension line outer endpoints
  4. Compute scale: real_inches / vector_distance
  5. Compare to current ScaleInfo.scaleFactor
```

### 3.6 Failure States

| Failure | Recovery |
|---------|----------|
| No extension lines found near dimension text | Skip dimension, reduce scale confidence by 5 per skipped dimension |
| All dimensions conflict with detected scale | Override scale with median of dimension-computed scales, flag for L8 confirmation |
| Mixed scales on same page | Trigger L2 multi-scale zone detection (feeds into REQ-029F) |

### 3.7 File

`lib/extraction/validation/dimension-validator.ts` (**NEW**)

---

## 4. Layer 3 — Geometry Constraint Solver

### 4.1 Purpose

Model the floor plan as a planar graph and enforce geometric constraints that real buildings must satisfy. Detects impossible configurations and attempts auto-repair.

### 4.2 Inputs

- `DetectedWall[]` from geometry classifier
- `DetectedDoor[]` from door detection
- `DetectedWindow[]` from window detection
- `ScaleInfo` (validated by L2)

### 4.3 Outputs

```typescript
interface ConstraintSolverResult {
  wallGraph: WallGraph;
  violations: ConstraintViolation[];
  repairs: AutoRepair[];
  roomCandidates: RoomCandidate[];
  graphIntegrity: number;  // 0-100
}

interface WallGraph {
  nodes: WallNode[];       // intersection points
  edges: WallEdge[];       // wall segments between intersections
  faces: GraphFace[];      // minimal cycles = room candidates
}

interface WallNode {
  id: string;
  position: Point;
  degree: number;          // number of connected edges
  type: 'L' | 'T' | 'X' | 'endpoint' | 'dead_end';
}

interface WallEdge {
  id: string;
  wallId: string;          // references DetectedWall.id
  startNodeId: string;
  endNodeId: string;
  length: number;          // inches
  thickness: number;
  angle: number;           // degrees from horizontal
}

interface GraphFace {
  id: string;
  edgeIds: string[];
  vertices: Point[];
  areaSqft: number;
  isClosed: boolean;
  perimeterFt: number;
}

interface ConstraintViolation {
  type: ConstraintType;
  severity: 'error' | 'warning';
  elements: string[];      // affected element IDs
  description: string;
  autoRepairable: boolean;
}

type ConstraintType =
  | 'open_room'            // room polygon not closed
  | 'overlapping_walls'    // two walls occupy same space
  | 'non_orthogonal'       // wall not at 0/90/45 degree angle (unless labeled)
  | 'door_detached'        // door arc not touching any wall
  | 'window_floating'      // window not embedded in wall
  | 'dead_end_wall'        // wall segment with one free endpoint
  | 'impossible_thickness' // wall < 2" or > 24" thick
  | 'tiny_room'            // room area < 10 sqft (likely detection error)
  | 'huge_room'            // room area > 10000 sqft (likely missed interior wall)
  | 'wall_crossing';       // walls cross without forming intersection node

interface AutoRepair {
  violationId: string;
  action: RepairAction;
  before: unknown;
  after: unknown;
  confidence: number;      // 0-100
}

type RepairAction =
  | 'snap_endpoint'        // move wall endpoint to nearest node within 2"
  | 'close_polygon'        // add short wall segment to close gap
  | 'merge_collinear'      // merge two collinear wall segments
  | 'split_at_crossing'    // split crossing walls into 4 segments at intersection
  | 'snap_door_to_wall'    // move door position to nearest wall gap
  | 'snap_window_to_wall'  // move window to nearest wall midline
  | 'adjust_angle';        // snap near-orthogonal angle to exact 90
```

### 4.4 Constraint Rules

#### 4.4.1 Room Closure
```
For each face in wall graph:
  gap = max distance between consecutive edge endpoints
  IF gap > 0 AND gap <= max_door_width (120"):
    → Check if door exists in gap → PASS (doorway)
    → No door in gap → WARNING (possible missed door)
  IF gap > max_door_width:
    → FAIL: open_room
  IF gap <= 2":
    → AUTO-REPAIR: snap_endpoint (close the micro-gap)
```

#### 4.4.2 Wall Overlap
```
For each pair of walls (w1, w2):
  IF parallel AND distance < max(w1.thickness, w2.thickness):
    IF same direction AND overlap > 50%:
      → FAIL: overlapping_walls
      → AUTO-REPAIR: merge into single wall with averaged properties
```

#### 4.4.3 Angle Normalization
```
For each wall:
  angle_from_axis = min(angle % 90)
  IF angle_from_axis < 3°:
    → AUTO-REPAIR: adjust_angle to nearest 0/90
  IF 3° <= angle_from_axis < 10°:
    → WARNING: non_orthogonal (may be intentional diagonal wall)
  IF angle_from_axis >= 10°:
    → PASS (intentional non-orthogonal wall, e.g., 45° bay)
```

#### 4.4.4 Door Attachment
```
For each door:
  nearest_wall_gap = find_nearest_wall_gap(door.position, walls)
  IF distance(door, nearest_wall_gap) <= 2":
    → PASS
  IF 2" < distance <= 6":
    → AUTO-REPAIR: snap_door_to_wall
  IF distance > 6":
    → FAIL: door_detached
```

#### 4.4.5 Window Embedding
```
For each window:
  host_wall = find_containing_wall(window.position, walls)
  IF host_wall exists AND window within wall extents:
    → PASS
  IF host_wall exists AND window partially outside:
    → AUTO-REPAIR: snap_window_to_wall
  IF no host_wall:
    → FAIL: window_floating
```

#### 4.4.6 Room Size Sanity
```
For each room candidate (graph face):
  IF area < 10 sqft:
    → FAIL: tiny_room (likely a wall cavity or detection artifact)
  IF area > 10000 sqft AND not labeled "WAREHOUSE" or "GYM":
    → WARNING: huge_room (likely missed interior partition)
  IF 10 <= area <= 10000:
    → PASS
```

### 4.5 Failure States

| Failure | Recovery |
|---------|----------|
| >30% of rooms have open_room violations | Flag entire page for L8 scale confirmation (scale error may cause misaligned walls) |
| Dead-end walls > 20% of total | Possible hatch filter failure — re-run L1 with stricter hatch detection |
| Wall graph disconnected (multiple components) | Process each component as separate zone; flag for review |

### 4.6 File

`lib/extraction/validation/constraint-solver.ts` (**NEW**)

---

## 5. Layer 4 — Symbol Relationship Graph Engine

### 5.1 Purpose

Validate detected elements by checking whether they satisfy contextual relationships that real buildings exhibit. A door without a wall, an outlet far from a wall, or a fixture outside a room all indicate detection errors.

### 5.2 Inputs

- All detected elements (walls, doors, windows, rooms)
- MEP elements (outlets, switches, fixtures) from L1
- Equipment items from schedule extraction

### 5.3 Outputs

```typescript
interface RelationshipGraphResult {
  relationships: ElementRelationship[];
  violations: RelationshipViolation[];
  confidenceAdjustments: ConfidenceAdjustment[];
}

interface ElementRelationship {
  sourceId: string;
  sourceType: ElementType;
  targetId: string;
  targetType: ElementType;
  relationship: RelationshipType;
  satisfied: boolean;
  distance: number;        // physical distance in inches
}

type RelationshipType =
  | 'door_connects_rooms'    // door must have room on each side
  | 'door_in_wall'           // door arc must intersect wall
  | 'window_in_wall'         // window must be within wall span
  | 'outlet_near_wall'       // outlet must be within 6" of wall boundary
  | 'switch_near_door'       // switch typically within 12" of door frame
  | 'fixture_in_room'        // plumbing fixture must be inside room polygon
  | 'equipment_in_room'      // equipment must be inside room polygon
  | 'diffuser_in_ceiling'    // diffuser must be within room ceiling boundary
  | 'light_in_room'          // light fixture must be within room boundary
  | 'thermostat_on_wall';    // thermostat must be near wall, inside room

interface RelationshipViolation {
  relationship: ElementRelationship;
  expectedDistance: number;
  actualDistance: number;
  confidencePenalty: number; // points to deduct from element confidence
}

interface ConfidenceAdjustment {
  elementId: string;
  adjustment: number;        // positive (relationship confirmed) or negative (violated)
  reason: string;
}
```

### 5.4 Relationship Rules

```
RULE: door_connects_rooms
  For each door:
    rooms_adjacent = rooms where door.position is on boundary or within 6"
    IF count(rooms_adjacent) == 2: +10 confidence (ideal: door between two rooms)
    IF count(rooms_adjacent) == 1: +5 confidence (door to exterior or undetected room)
    IF count(rooms_adjacent) == 0: -15 confidence (orphan door)

RULE: door_in_wall
  For each door:
    host_wall = wall where door arc endpoint intersects within 2"
    IF host_wall exists: +10 confidence
    IF no host_wall: -20 confidence (suspicious detection)

RULE: window_in_wall
  For each window:
    host_wall = wall containing window midpoint within wall extents
    IF host_wall AND window.width < host_wall.length: +10 confidence
    IF host_wall AND window.width >= host_wall.length: -5 (window spans entire wall, unusual)
    IF no host_wall: -20 confidence

RULE: outlet_near_wall
  For each outlet:
    nearest_wall = closest wall to outlet.position
    IF distance <= 6": +5 confidence
    IF 6" < distance <= 18": 0 (might be on island or pillar)
    IF distance > 18": -10 confidence (likely misdetection)

RULE: switch_near_door
  For each switch:
    nearest_door = closest door to switch.position
    IF distance <= 24": +5 confidence (standard placement)
    IF distance > 48": -5 confidence (unusual, but possible in large rooms)

RULE: fixture_in_room
  For each plumbing fixture:
    containing_room = room whose polygon contains fixture.position
    IF containing_room: +5 confidence
    IF no room: -10 confidence (orphan fixture)
    IF containing_room.classification == 'bathroom' AND fixture.type == 'water_closet': +10 confidence
    IF containing_room.classification == 'kitchen' AND fixture.type == 'sink': +10 confidence
    IF containing_room.classification == 'bedroom' AND fixture.type == 'water_closet': -15 confidence (toilet in bedroom = likely misassigned)
```

### 5.5 Failure States

| Failure | Recovery |
|---------|----------|
| >50% doors have no host wall | Wall detection may have failed — re-examine wall rules with relaxed thresholds |
| >50% fixtures outside rooms | Room detection likely incomplete — flag for L8 room count confirmation |
| Element in wrong room type | Reduce element confidence, flag specific room assignment for review |

### 5.6 File

`lib/extraction/validation/relationship-graph.ts` (**NEW**)

---

## 6. Layer 5 — Cross-Sheet Reconciliation

### 6.1 Purpose

Compare quantities and details extracted from different sheets within the same plan set. Schedules (door schedule, equipment schedule, finish schedule) are ground truth — geometric detection should match.

### 6.2 Inputs

- Geometric detection results (walls, doors, windows, rooms) from all pages
- Schedule extraction results (from REQ-038) across all pages
- Sheet metadata (page numbers, sheet types)

### 6.3 Outputs

```typescript
interface CrossSheetResult {
  reconciliations: SheetReconciliation[];
  discrepancies: SheetDiscrepancy[];
  overallMatch: number;  // 0-100
}

interface SheetReconciliation {
  dataType: 'doors' | 'windows' | 'rooms' | 'fixtures' | 'equipment' | 'finishes';
  geometricCount: number;      // from floor plan detection
  scheduleCount: number;       // from schedule table extraction
  matchRate: number;           // 0-100
  matchedItems: MatchedItem[];
  unmatchedGeometric: string[]; // detected but not in schedule
  unmatchedSchedule: string[];  // in schedule but not detected
}

interface SheetDiscrepancy {
  dataType: string;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  geometricSource: { page: number; elementId: string } | null;
  scheduleSource: { page: number; row: number } | null;
  suggestedResolution: string;
}

interface MatchedItem {
  geometricId: string;
  scheduleRef: string;   // e.g., "D1", "W-01"
  geometricValue: unknown;
  scheduleValue: unknown;
  match: boolean;
  deviation: string | null;
}
```

### 6.4 Reconciliation Rules

#### 6.4.1 Door Count Reconciliation
```
schedule_door_count = count(door_schedule_rows)
geometric_door_count = count(detected_doors)

IF schedule_door_count == geometric_door_count: +15 confidence (all doors)
IF |difference| <= 1: +10 confidence (minor variance acceptable)
IF |difference| <= 3: +5 confidence, WARNING with list of unmatched
IF |difference| > 3: 0 confidence, flag CRITICAL discrepancy

For each door with schedule_ref (e.g., "D1"):
  Find matching row in door schedule
  Compare: size (±2"), type, fire rating
  If match: +5 per door
  If mismatch: flag specific discrepancy
```

#### 6.4.2 Room-Finish Reconciliation
```
schedule_rooms = rooms listed in finish schedule
detected_rooms = rooms from geometric detection

For each schedule_room:
  matching_detected = detected room where name matches (fuzzy, e.g., "KITCHEN" == "Kitchen")
  IF match found:
    Compare areas if finish schedule includes area column (±10% tolerance)
    +5 confidence per matched room
  IF no match:
    Flag: "Room '{name}' in finish schedule not detected geometrically"
    -5 confidence for room detection

For each detected_room not in schedule:
  Minor warning (some rooms may intentionally lack finish specs, e.g., mechanical)
```

#### 6.4.3 Fixture Count Reconciliation
```
schedule_fixture_count = sum(fixture_schedule quantities)
geometric_fixture_count = count(detected plumbing symbols on P-sheets)

Reconcile by type:
  For each fixture type (WC, LAV, SINK, FD, etc.):
    schedule_count = count in schedule
    geometric_count = count detected
    IF match: +5 per type
    IF difference: flag with type-specific discrepancy
```

#### 6.4.4 Equipment Reconciliation
```
schedule_equipment = equipment schedule items
geometric_equipment = labeled equipment on floor plan

For each schedule item:
  Find matching floor plan label/symbol by mark number
  IF found: +5 confidence
  IF not found: flag (equipment in schedule but not on plan — may be on different sheet)
```

#### 6.4.5 Lighting Fixture Reconciliation
```
rcp_fixture_count = count from RCP geometric detection
lighting_schedule_count = count from lighting fixture schedule (if exists)

IF |difference| <= 2: PASS
IF |difference| > 2: flag discrepancy
```

### 6.5 Failure States

| Failure | Recovery |
|---------|----------|
| No schedules found in plan set | Skip L5, note in extraction_meta.review_flags: "no_schedules_for_cross_reference" |
| Door count mismatch > 5 | Likely a detection issue — flag for L8 micro-confirmation of total door count |
| Room count mismatch between schedule and geometry | Flag for L8 room count confirmation |

### 6.6 File

`lib/extraction/validation/cross-sheet-reconciler.ts` (**NEW**)

---

## 7. Layer 6 — Redundant Quantity Validation

### 7.1 Purpose

Validate room areas and key quantities using multiple independent calculation methods. Divergence indicates a measurement or scale error.

### 7.2 Inputs

- `DetectedRoom[]` with polygon vertices and areas
- `ScaleInfo` (validated by L2)
- Dimension strings with parsed values
- Ceiling grid data from RCP (if available)
- Finish schedule room areas (if present)

### 7.3 Outputs

```typescript
interface QuantityValidation {
  roomValidations: RoomAreaValidation[];
  quantityChecks: QuantityCheck[];
  overallIntegrity: number;  // 0-100
}

interface RoomAreaValidation {
  roomId: string;
  roomName: string;
  methods: AreaCalculationMethod[];
  medianArea: number;
  maxDeviation: number;      // % from median
  verdict: 'pass' | 'warn' | 'fail';
}

interface AreaCalculationMethod {
  method: 'polygon' | 'dimension_lw' | 'ceiling_grid' | 'gross_minus_partitions' | 'schedule';
  area: number;
  confidence: number;
  source: string;            // which data was used
}

interface QuantityCheck {
  quantity: string;           // e.g., "drywall_sf", "flooring_sf"
  primaryValue: number;
  crossCheckValue: number | null;
  crossCheckMethod: string;
  deviation: number;
  verdict: 'pass' | 'warn' | 'fail';
}
```

### 7.4 Room Area Cross-Check Methods

```
Method 1: Polygon Geometry (Shoelace formula)
  area = |sum(x_i * y_{i+1} - x_{i+1} * y_i)| / 2 * scale^2
  Source: wall graph vertices
  Confidence: 90 (direct measurement)

Method 2: Dimension L x W
  Find dimension strings labeled for room length and width
  area = length * width
  Source: dimension text clusters assigned to room
  Confidence: 85 (depends on dimension text parsing accuracy)
  Only works for rectangular rooms; skip for L-shaped, etc.

Method 3: Ceiling Grid Tile Count (if RCP available)
  count_tiles = count ceiling grid cells within room boundary
  area = count_tiles * tile_area (typically 2x2=4sqft or 2x4=8sqft)
  Source: RCP sheet ceiling grid detection
  Confidence: 80 (depends on grid detection accuracy)

Method 4: Gross Boundary Minus Partitions
  gross_area = building footprint area (outer wall polygon)
  sum_room_areas = sum of all individual room areas
  IF |gross_area - sum_room_areas| < 5% of gross_area:
    → Areas are consistent
  IF deviation > 5%:
    → Some space unaccounted for (corridors, wall cavities, or missed rooms)
  Source: outer boundary + all inner rooms
  Confidence: 75 (indirect check)

Method 5: Finish Schedule (if present)
  schedule_area = area listed in finish schedule for room
  Source: REQ-039 finish schedule extraction
  Confidence: 95 (architect's stated area)
```

### 7.5 Validation Rules

| Rule | Condition | Verdict |
|------|-----------|---------|
| Area methods agree | max_deviation < 3% from median | pass |
| Minor divergence | 3% <= max_deviation < 8% | warn |
| Significant divergence | max_deviation >= 8% | fail → investigate scale or polygon |
| Gross area check | sum(rooms) within 10% of gross | pass |
| Gross area mismatch | sum(rooms) < 80% of gross | fail → likely missed rooms |

### 7.6 Quantity Cross-Checks

```
Drywall SF cross-check:
  Primary: sum(wall_length * ceiling_height * 2) - openings  [from L3 wall graph]
  Cross: sum(room_perimeter * ceiling_height * 2) - openings [from L3 room faces]
  These should be equal (±2%) since wall perimeters = room perimeters

Flooring SF cross-check:
  Primary: sum(room.areaSqft)                    [from polygon calculation]
  Cross: sum(room L×W from dimensions)           [from dimension strings]
  Tolerance: 5%

Baseboard LF cross-check:
  Primary: sum(room.perimeterFt) - sum(door widths)
  Cross: sum(wall lengths from wall graph edges) * 2  [each wall has baseboard on both sides]
  Tolerance: 5%
```

### 7.7 Failure States

| Failure | Recovery |
|---------|----------|
| Only 1 area method available (polygon only) | Accept with reduced confidence (no cross-check possible) |
| Method 2 (L×W) unavailable (no dimension strings in room) | Skip, note reduced validation |
| All methods diverge from each other | Flag for L8 scale confirmation, possible scale error |

### 7.8 File

`lib/extraction/validation/quantity-validator.ts` (**NEW**)

---

## 8. Layer 7 — Probabilistic Confidence Engine

### 8.1 Purpose

Compute final confidence scores for each element and the overall extraction by aggregating evidence from all preceding layers with calibrated weights.

**Replaces:** design.md Section 7 (flat 4-component scorer).

### 8.2 Inputs

- `LayerEvidence[]` from layers 1-6 for each element
- Element detection scores (from geometry classifier rules)
- Cross-sheet reconciliation results (L5)
- Quantity validation results (L6)

### 8.3 Outputs

```typescript
interface ConfidenceResult {
  elementScores: ElementConfidence[];
  categoryScores: CategoryConfidence[];
  overallConfidence: number;    // 0-100
  requiresReview: boolean;
  reviewFlags: ReviewFlag[];
  confidenceBreakdown: ConfidenceBreakdown;
}

interface ElementConfidence {
  elementId: string;
  elementType: ElementType;
  rawScore: number;             // before penalties
  penalties: PenaltyRecord[];
  bonuses: BonusRecord[];
  finalScore: number;           // 0-100
  tier: 'high' | 'medium' | 'low';
  evidenceSources: number[];    // which layers contributed
}

interface CategoryConfidence {
  category: string;             // 'walls', 'doors', 'rooms', 'quantities', 'schedules'
  averageScore: number;
  minScore: number;
  elementCount: number;
  lowConfidenceCount: number;
}

interface ConfidenceBreakdown {
  geometryIntegrity: number;    // from L1 + L3 (0-100)
  dimensionAccuracy: number;    // from L2 (0-100)
  constraintSatisfaction: number; // from L3 (0-100)
  relationshipValidity: number; // from L4 (0-100)
  crossSheetMatch: number;      // from L5 (0-100)
  quantityIntegrity: number;    // from L6 (0-100)
}

interface ReviewFlag {
  flag: string;
  severity: 'critical' | 'warning' | 'info';
  elementIds: string[];
  description: string;
  suggestedAction: string;
}
```

### 8.4 Scoring Model

#### 8.4.1 Per-Element Scoring

```
element_score = weighted_sum(layer_evidence_scores)

Weights by layer (calibrated for construction plan domain):
  L1 (extraction quality):     0.05  — baseline quality signal
  L2 (dimension validation):   0.20  — scale accuracy is critical
  L3 (constraint satisfaction): 0.25  — geometric integrity is most important
  L4 (relationship graph):     0.15  — contextual validation
  L5 (cross-sheet match):      0.20  — schedule ground truth
  L6 (quantity validation):    0.15  — redundant checks

If layer has no evidence for element (e.g., no schedule data for L5):
  Redistribute weight proportionally across available layers
```

#### 8.4.2 Penalty System

```typescript
const PENALTIES: Record<string, number> = {
  // Scale issues
  'scale_missing':               -15,
  'scale_conflicting':           -20,
  'scale_inferred_only':         -10,

  // Geometry issues
  'open_room_polygon':           -15,
  'overlapping_rooms':           -10,
  'dead_end_walls':              -5,
  'wall_thickness_inconsistent': -8,

  // Detection issues
  'orphan_door':                 -12,  // door with no wall
  'orphan_window':               -12,  // window with no wall
  'unmatched_arc':               -8,   // arc not classified
  'orphan_text':                 -3,   // text outside all rooms

  // Cross-reference issues
  'schedule_count_mismatch':     -10,
  'finish_room_unmatched':       -5,
  'equipment_not_on_plan':       -3,

  // Processing issues
  'raster_fallback':             -20,  // page processed by GPT-4o
  'no_legend_found':             -8,   // TI classification used heuristics
  'low_path_density':            -10,  // fewer than expected vector elements
};
```

#### 8.4.3 Bonus System

```typescript
const BONUSES: Record<string, number> = {
  // Strong confirmations
  'schedule_count_exact_match':  +10,
  'dimension_scale_confirmed':   +10,
  'all_rooms_closed':            +8,
  'cad_layers_detected':         +5,
  'legend_parsed_successfully':  +8,
  'finish_schedule_full_match':  +7,
  'multiple_area_methods_agree': +10,
  'door_schedule_cross_ref':     +5,  // per door matched to schedule
};
```

#### 8.4.4 Overall Confidence

```
overall_confidence = weighted_average(category_scores)

Category weights:
  walls:       0.25
  rooms:       0.25
  doors:       0.15
  windows:     0.10
  quantities:  0.15
  schedules:   0.10
```

### 8.5 Threshold Logic

| Overall Score | Action |
|---|---|
| >= 90 | Auto-approve candidate (subject to L10 gate) |
| 80-89 | Auto-approve with minor review flags shown |
| 60-79 | Requires review — show all flags, highlight uncertain elements |
| 40-59 | Low confidence — trigger L8 micro-confirmation before proceeding |
| < 40 | Very low confidence — recommend re-upload or manual takeoff |

### 8.6 Review Flag Generation

```typescript
function generateReviewFlags(
  l2: ScaleValidationResult,
  l3: ConstraintSolverResult,
  l4: RelationshipGraphResult,
  l5: CrossSheetResult,
  l6: QuantityValidation
): ReviewFlag[] {
  const flags: ReviewFlag[] = [];

  if (l2.verdict === 'conflicting')
    flags.push({ flag: 'scale_conflicting', severity: 'critical', ... });

  if (l3.violations.filter(v => v.type === 'open_room').length > 0)
    flags.push({ flag: 'open_rooms_detected', severity: 'warning', ... });

  if (l5.discrepancies.some(d => d.severity === 'critical'))
    flags.push({ flag: 'schedule_mismatch', severity: 'critical', ... });

  if (l6.overallIntegrity < 70)
    flags.push({ flag: 'quantity_cross_check_failed', severity: 'warning', ... });

  // ... additional flag generation

  return flags;
}
```

### 8.7 File

`lib/extraction/validation/confidence-engine.ts` (**NEW**, replaces `confidence-scorer.ts`)

---

## 9. Layer 8 — Human Micro-Confirmation Interface

### 9.1 Purpose

Request minimal, targeted human input to resolve specific uncertainties. NOT a full manual review — just 3-5 yes/no or multiple-choice confirmations that dramatically boost confidence.

### 9.2 Design Principles

1. **Minimal friction** — max 5 prompts, each answerable in <3 seconds
2. **High leverage** — each confirmation resolves multiple downstream uncertainties
3. **Contextual** — only ask what the system is uncertain about
4. **Visual** — show the relevant plan region, not just text
5. **Progressive** — each answer updates confidence in real-time

### 9.3 Confirmation Types

```typescript
type MicroConfirmationType =
  | 'scale_confirm'        // "Is the scale 1/4" = 1'-0"? [Yes] [No, it's ___]"
  | 'ceiling_height'       // "Is the ceiling height 9'-0"? [Yes] [No, it's ___]"
  | 'door_count'           // "We detected 12 doors. Correct? [Yes] [+1] [-1] [Other]"
  | 'room_count'           // "We found 8 rooms. Correct? [Yes] [+1] [-1] [Other]"
  | 'wall_type_confirm'    // "Are these highlighted walls NEW construction? [Yes] [No, existing]"
  | 'schedule_match'       // "Does this equipment list match the plan? [Yes] [Partially] [No]"
  | 'element_verify';      // "Is this a [door/window/wall]? [Yes] [No]"

interface MicroConfirmation {
  id: string;
  type: MicroConfirmationType;
  question: string;
  options: ConfirmationOption[];
  context: {
    pageNumber: number;
    region: BoundingBox;       // area of plan to highlight
    relatedElementIds: string[];
    currentValue: unknown;
  };
  priority: number;            // 1=must ask, 2=should ask, 3=nice to have
  confidenceImpact: number;    // how much confidence increases on confirmation
}

interface ConfirmationOption {
  label: string;
  value: unknown;
  isDefault: boolean;          // pre-selected based on system detection
}

interface MicroConfirmationResult {
  confirmationId: string;
  selectedOption: ConfirmationOption;
  timeToAnswerMs: number;
  confidenceBoost: number;
}
```

### 9.4 Prompt Selection Algorithm

```
Select up to 5 micro-confirmations from candidates:

1. ALWAYS ask if overall_confidence < 80:
   - scale_confirm (if L2 verdict != 'confirmed')
   - room_count (if L5 has room count discrepancy)

2. ASK if overall_confidence < 90:
   - ceiling_height (if no section drawing found to extract height)
   - door_count (if L5 has door count discrepancy > 1)

3. ASK if specific elements have low confidence:
   - wall_type_confirm (if TI classification used heuristics, no legend)
   - element_verify (for lowest-confidence element)

Sort by priority, then by confidenceImpact descending.
Take top 5.
```

### 9.5 Confidence Boosts from Confirmation

| Confirmation | Boost Applied |
|---|---|
| Scale confirmed | +15 to all elements on page, L2 verdict → 'confirmed' |
| Ceiling height confirmed | +10 to all quantity calculations |
| Door count confirmed | +10 to all doors, +5 to rooms (boundaries validated) |
| Room count confirmed | +10 to all rooms |
| Wall type confirmed | +10 to TI wall classification, +5 to quantity split |
| Schedule match confirmed | +10 to all schedule-derived items |

### 9.6 Frontend Component

```typescript
// components/estimates/MicroConfirmation.tsx
interface MicroConfirmationProps {
  confirmations: MicroConfirmation[];
  planPages: { pageNumber: number; imageUrl: string }[];
  onSubmit: (results: MicroConfirmationResult[]) => void;
  onSkip: () => void;  // user can skip, proceed with current confidence
}

// UI: card-based swipe interface
// Each card shows:
//   - Plan region image with highlighted elements
//   - Simple question
//   - Large touch-friendly buttons (44px+)
//   - "Skip" option always available
// After all cards: "Done — confidence updated to X%"
```

### 9.7 Failure States

| Failure | Recovery |
|---------|----------|
| User skips all confirmations | Proceed with L7 confidence scores (no boost) |
| User contradicts system detection | Apply negative correction, re-run L7 with updated evidence |
| User provides scale correction | Re-run L2-L7 with new scale, recalculate all quantities |

### 9.8 Files

- `lib/extraction/validation/micro-confirmation.ts` (**NEW**)
- `components/estimates/MicroConfirmation.tsx` (**NEW**)

---

## 10. Layer 9 — Error Recovery & Auto-Correction

### 10.1 Purpose

Systematically attempt to fix detected issues before presenting results. All corrections are logged with before/after states for auditability.

### 10.2 Inputs

- All violations from L3 (constraint solver)
- All relationship violations from L4
- Discrepancies from L5 (cross-sheet)
- User confirmations from L8 (if any)

### 10.3 Outputs

```typescript
interface RecoveryResult {
  correctionsApplied: CorrectionRecord[];
  correctionsSkipped: CorrectionRecord[];
  remainingViolations: ConstraintViolation[];
  recoveryRate: number;  // % of violations that were auto-corrected
}

interface CorrectionRecord {
  id: string;
  type: CorrectionType;
  elementId: string;
  description: string;
  before: unknown;
  after: unknown;
  confidence: number;     // how confident is the correction (0-100)
  applied: boolean;       // false if confidence < threshold
  source: string;         // which layer triggered this correction
}

type CorrectionType =
  | 'scale_override'           // L2/L8 scale correction
  | 'wall_endpoint_snap'       // L3 snap wall endpoint to nearest node
  | 'polygon_close'            // L3 add short wall to close room gap
  | 'wall_merge'               // L3 merge overlapping/collinear walls
  | 'wall_split'               // L3 split crossing walls at intersection
  | 'door_snap'                // L3/L4 move door to nearest wall gap
  | 'window_snap'              // L3/L4 move window to wall midline
  | 'angle_normalize'          // L3 snap near-orthogonal to 90
  | 'room_merge'               // L5 merge duplicate rooms across sheets
  | 'count_reconcile'          // L5 adopt schedule count over geometric count
  | 'area_reconcile'           // L6 adopt best available area measurement
  | 'classification_override'; // L8 user corrects wall type or element type
```

### 10.4 Correction Logic

#### 10.4.1 Scale Corrections
```
IF L8 user provided scale correction:
  Apply user scale as override
  Re-run L2-L6 with new scale
  Confidence: 95 (user-provided)

IF L2 found all dimensions disagree with detected scale:
  Override scale with median of dimension-derived scales
  Confidence: 80 (data-driven correction)
```

#### 10.4.2 Geometry Corrections
```
Wall Endpoint Snap:
  IF wall endpoint within 2" of intersection node:
    Move endpoint to node position
    Confidence: 90 (micro-gap, clearly should connect)

  IF wall endpoint 2-6" from node:
    Move endpoint to node position
    Confidence: 60 (larger gap, might be intentional)
    Only apply if it closes a room polygon

Polygon Close:
  IF room has single gap < 2":
    Insert wall segment to close gap
    Confidence: 85 (micro-gap from CAD export precision)

  IF room has single gap 2"-6":
    Insert wall segment only if no door nearby
    Confidence: 50 (might be doorway without detected door)

Wall Merge:
  IF two collinear walls have endpoints within 2":
    Merge into single wall
    Confidence: 90

  IF two parallel overlapping walls (same thickness ±1"):
    Keep the one with higher confidence
    Confidence: 75
```

#### 10.4.3 Element Corrections
```
Door Snap:
  IF door is within 6" of a wall gap but not exactly at gap:
    Move door to gap center
    Confidence: 80

Window Snap:
  IF window center is within 4" of wall midline:
    Snap to wall midline
    Confidence: 85
```

#### 10.4.4 Count Reconciliation
```
IF schedule_count exists AND |geometric_count - schedule_count| <= 2:
  Adopt schedule_count as authoritative
  Confidence: 90 (schedules are architect-prepared)
  Flag elements to add/remove if count increased/decreased

IF schedule_count exists AND |geometric_count - schedule_count| > 2:
  Keep both counts, flag discrepancy for review
  Do NOT auto-correct (too large a difference to assume)
```

### 10.5 Correction Confidence Threshold

Only apply corrections with confidence >= 60. Below that, log as `correctionsSkipped` and include in review flags.

### 10.6 Failure States

| Failure | Recovery |
|---------|----------|
| Correction makes constraint violations worse | Rollback correction, mark as unapplicable |
| Circular corrections (A fixes B which breaks A) | Apply corrections in dependency order, stop after 3 iterations |
| >50% of elements need correction | Flag entire extraction as low quality, recommend re-upload |

### 10.7 File

`lib/extraction/validation/error-recovery.ts` (**NEW**)

---

## 11. Layer 10 — Final Approval Gate

### 11.1 Purpose

Make the binary decision: auto-approve the extraction result or route to human review. This is the last checkpoint before data is written to `takeoff_items`.

### 11.2 Inputs

- `ConfidenceResult` from L7 (post L8/L9 adjustments)
- `RecoveryResult` from L9
- All review flags accumulated
- User confirmations from L8 (if any)

### 11.3 Outputs

```typescript
interface ApprovalGateResult {
  decision: 'auto_approved' | 'review_required' | 'rejected';
  overallConfidence: number;
  criticalFlags: ReviewFlag[];      // flags that prevented auto-approval
  validationSummary: ValidationSummary;
  extractionResult: ExtractionResult; // final validated result
}

interface ValidationSummary {
  geometryIntegrity: number;        // L1 + L3 combined
  dimensionAccuracy: number;        // L2
  crossSheetMatch: number;          // L5
  constraintIntegrity: number;      // L3
  quantityIntegrity: number;        // L6
  overallConfidence: number;        // L7 final
  requiresReview: boolean;
  autoCorrectionsApplied: number;   // from L9
  humanConfirmations: number;       // from L8
  discrepancies: SheetDiscrepancy[];
}
```

### 11.4 Gate Logic

```
AUTO_APPROVE if ALL of:
  - overallConfidence >= 90
  - No critical review flags
  - Scale confirmed (L2 verdict == 'confirmed' OR L8 user confirmed)
  - Room count matches schedule (or no schedule available)
  - No open room polygons remaining after L9 corrections
  - Recovery rate > 80% (most issues were auto-fixed)

REVIEW_REQUIRED if ANY of:
  - 60 <= overallConfidence < 90
  - Has critical or warning review flags
  - Scale uncertain (L2 verdict == 'uncertain')
  - Cross-sheet discrepancies with severity 'critical'
  - Auto-correction confidence was low for some repairs

REJECTED if ANY of:
  - overallConfidence < 40
  - Scale could not be determined (null)
  - >50% of rooms have open polygons
  - Page classified as raster and vector engine forced
  - >30% elements needed correction with confidence < 60
```

### 11.5 Post-Gate Actions

```
IF auto_approved:
  Write ExtractionResult to takeoff_items via normalize-bridge.ts
  Set extraction_meta.requires_review = false
  Set plan_upload status = 'completed'
  Show success toast with confidence %

IF review_required:
  Write ExtractionResult to takeoff_items (as draft)
  Set extraction_meta.requires_review = true
  Set plan_upload status = 'review_needed'
  Navigate to TakeoffReviewScreen with flags highlighted
  Show elements sorted by confidence (lowest first)

IF rejected:
  Do NOT write to takeoff_items
  Set plan_upload status = 'failed'
  Show error with specific reasons
  Offer: "Try with GPT-4o Vision" button (fallback)
  Offer: "Re-upload" button
```

### 11.6 File

`lib/extraction/validation/approval-gate.ts` (**NEW**)

---

## 12. Validation Flow Diagram

```
PDF Upload
  |
  v
[Stage 1-2: Extract + Classify]
  |
  +---> [L1] Extraction Quality Assessment
  |         Output: ExtractionQuality + CAD origin
  |         IF raster → GPT-4o fallback (skip L2-L10)
  |
  v
[Stage 3: Scale Detection]
  |
  +---> [L2] Dimension Cross-Validation
  |         Input: detected scale + dimension text + extension lines
  |         Output: ScaleValidationResult
  |         IF scale_conflicting → queue for L8 scale confirmation
  |
  v
[Stage 4: Element Detection]
  |
  +---> [L3] Geometry Constraint Solver
  |         Input: walls, doors, windows
  |         Output: WallGraph + violations + auto-repairs
  |         Applies: snap, merge, split, close repairs
  |
  +---> [L4] Symbol Relationship Graph
  |         Input: all elements + rooms
  |         Output: confidence adjustments per element
  |
  v
[Stage 5-6: Rooms + Schedules]
  |
  +---> [L5] Cross-Sheet Reconciliation
  |         Input: geometric counts + schedule counts
  |         Output: discrepancies + match rates
  |
  v
[Stage 7-8: MEP + Quantities]
  |
  +---> [L6] Redundant Quantity Validation
  |         Input: room areas via 3-5 methods
  |         Output: cross-checked quantities
  |
  v
[All Pages Complete → Stage 9-10]
  |
  +---> [L7] Probabilistic Confidence Engine
  |         Input: all LayerEvidence from L1-L6
  |         Output: per-element + overall confidence
  |
  +---> [L8] Human Micro-Confirmation (if confidence < 90)
  |         Input: top 5 uncertainty prompts
  |         Output: user confirmations → confidence boosts
  |         IF user skips → proceed with L7 scores
  |
  +---> [L9] Error Recovery & Auto-Correction
  |         Input: all violations + user corrections
  |         Output: corrected elements + audit log
  |
  +---> [L10] Final Approval Gate
            Input: confidence + flags + corrections
            Output: auto_approved | review_required | rejected
            → Write to takeoff_items or route to review
```

---

## 13. Pseudocode: Confidence Engine

```typescript
function computeConfidence(
  elementId: string,
  elementType: ElementType,
  evidence: LayerEvidence[]
): ElementConfidence {
  // 1. Compute weighted base score from layer evidence
  const LAYER_WEIGHTS = { 1: 0.05, 2: 0.20, 3: 0.25, 4: 0.15, 5: 0.20, 6: 0.15 };

  const availableLayers = evidence.map(e => e.layer);
  const totalWeight = availableLayers.reduce((sum, l) => sum + LAYER_WEIGHTS[l], 0);

  let rawScore = 0;
  for (const ev of evidence) {
    const normalizedWeight = LAYER_WEIGHTS[ev.layer] / totalWeight; // redistribute
    rawScore += ev.score * normalizedWeight;
  }

  // 2. Apply penalties
  const penalties: PenaltyRecord[] = [];
  for (const ev of evidence) {
    if (ev.verdict === 'fail') {
      const penalty = PENALTIES[ev.details] ?? -5;
      penalties.push({ source: `L${ev.layer}`, reason: ev.details, value: penalty });
    }
  }

  // 3. Apply bonuses
  const bonuses: BonusRecord[] = [];
  for (const ev of evidence) {
    if (ev.verdict === 'pass' && BONUSES[ev.details]) {
      bonuses.push({ source: `L${ev.layer}`, reason: ev.details, value: BONUSES[ev.details] });
    }
  }

  // 4. Compute final score
  const totalPenalty = penalties.reduce((s, p) => s + p.value, 0);
  const totalBonus = bonuses.reduce((s, b) => s + b.value, 0);
  const finalScore = Math.max(0, Math.min(100, rawScore + totalPenalty + totalBonus));

  // 5. Determine tier
  const tier = finalScore >= 80 ? 'high' : finalScore >= 50 ? 'medium' : 'low';

  return {
    elementId,
    elementType,
    rawScore,
    penalties,
    bonuses,
    finalScore,
    tier,
    evidenceSources: availableLayers,
  };
}

function computeOverallConfidence(
  elements: ElementConfidence[],
  categoryWeights: Record<string, number>
): number {
  // Group elements by type
  const categories = groupBy(elements, e => e.elementType);

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [category, elems] of Object.entries(categories)) {
    const weight = categoryWeights[category] ?? 0.1;
    const avgScore = elems.reduce((s, e) => s + e.finalScore, 0) / elems.length;
    weightedSum += avgScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

---

## 14. Pseudocode: Constraint Solver

```typescript
function solveConstraints(
  walls: DetectedWall[],
  doors: DetectedDoor[],
  windows: DetectedWindow[],
  scale: ScaleInfo
): ConstraintSolverResult {
  // 1. Build wall graph
  const nodes: WallNode[] = [];
  const edges: WallEdge[] = [];

  // Find all intersection points
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const intersection = lineLineIntersection(
        walls[i].startPoint, walls[i].endPoint,
        walls[j].startPoint, walls[j].endPoint
      );
      if (intersection && isOnBothSegments(intersection, walls[i], walls[j])) {
        const existingNode = nodes.find(n => distance(n.position, intersection) < 2);
        if (!existingNode) {
          nodes.push({
            id: generateId(),
            position: intersection,
            degree: 0,
            type: 'X', // will be refined
          });
        }
      }
    }
  }

  // Add wall endpoints as nodes
  for (const wall of walls) {
    for (const point of [wall.startPoint, wall.endPoint]) {
      const existingNode = nodes.find(n => distance(n.position, point) < 2);
      if (!existingNode) {
        nodes.push({
          id: generateId(),
          position: point,
          degree: 0,
          type: 'endpoint',
        });
      }
    }
  }

  // Create edges between connected nodes along each wall
  for (const wall of walls) {
    const wallNodes = nodes
      .filter(n => isOnSegment(n.position, wall.startPoint, wall.endPoint, 2))
      .sort((a, b) =>
        distance(a.position, wall.startPoint) - distance(b.position, wall.startPoint)
      );

    for (let i = 0; i < wallNodes.length - 1; i++) {
      edges.push({
        id: generateId(),
        wallId: wall.id,
        startNodeId: wallNodes[i].id,
        endNodeId: wallNodes[i + 1].id,
        length: distance(wallNodes[i].position, wallNodes[i + 1].position) * scale.scaleFactor,
        thickness: wall.thickness,
        angle: angleBetween(wallNodes[i].position, wallNodes[i + 1].position),
      });
    }
  }

  // Classify node types
  for (const node of nodes) {
    node.degree = edges.filter(
      e => e.startNodeId === node.id || e.endNodeId === node.id
    ).length;
    node.type = node.degree === 1 ? 'dead_end'
              : node.degree === 2 ? 'L'
              : node.degree === 3 ? 'T'
              : node.degree >= 4 ? 'X'
              : 'endpoint';
  }

  // 2. Find minimal cycles (room candidates) via half-edge traversal
  const faces = findMinimalCycles(nodes, edges);

  // 3. Check constraints
  const violations: ConstraintViolation[] = [];
  const repairs: AutoRepair[] = [];

  // Room closure check
  for (const face of faces) {
    if (!face.isClosed) {
      const gap = computeGap(face);
      if (gap <= 2) {
        // Auto-repair: snap
        repairs.push({
          violationId: generateId(),
          action: 'snap_endpoint',
          before: face.vertices,
          after: closePolygon(face),
          confidence: 90,
        });
      } else if (gap <= maxDoorWidth(doors)) {
        // Check if door exists in gap
        const doorInGap = doors.some(d =>
          distance(d.position, gapMidpoint(face)) < gap / 2 + 6
        );
        if (!doorInGap) {
          violations.push({
            type: 'open_room',
            severity: 'warning',
            elements: face.edgeIds,
            description: `Room gap of ${gap}" with no door detected`,
            autoRepairable: false,
          });
        }
      } else {
        violations.push({
          type: 'open_room',
          severity: 'error',
          elements: face.edgeIds,
          description: `Room gap of ${gap}" exceeds max door width`,
          autoRepairable: false,
        });
      }
    }
  }

  // Door attachment check
  for (const door of doors) {
    const nearestWall = findNearestWallGap(door.position, walls);
    if (!nearestWall || nearestWall.distance > 6) {
      violations.push({
        type: 'door_detached',
        severity: nearestWall ? 'warning' : 'error',
        elements: [door.id],
        description: `Door ${door.id} is ${nearestWall?.distance ?? '∞'}" from nearest wall`,
        autoRepairable: nearestWall && nearestWall.distance <= 6,
      });
      if (nearestWall && nearestWall.distance <= 6) {
        repairs.push({
          violationId: violations[violations.length - 1].type,
          action: 'snap_door_to_wall',
          before: door.position,
          after: nearestWall.snapPoint,
          confidence: 80 - nearestWall.distance * 10,
        });
      }
    }
  }

  // Window embedding check
  for (const window of windows) {
    const hostWall = findContainingWall(window.position, walls);
    if (!hostWall) {
      violations.push({
        type: 'window_floating',
        severity: 'error',
        elements: [window.id],
        description: `Window ${window.id} not embedded in any wall`,
        autoRepairable: false,
      });
    }
  }

  // Room size sanity
  for (const face of faces) {
    if (face.areaSqft < 10) {
      violations.push({
        type: 'tiny_room',
        severity: 'warning',
        elements: face.edgeIds,
        description: `Room candidate has area ${face.areaSqft} sqft (likely artifact)`,
        autoRepairable: false,
      });
    }
  }

  // Dead-end wall check
  const deadEnds = nodes.filter(n => n.type === 'dead_end');
  if (deadEnds.length > walls.length * 0.2) {
    violations.push({
      type: 'dead_end_wall',
      severity: 'warning',
      elements: deadEnds.map(n => n.id),
      description: `${deadEnds.length} dead-end wall segments (${Math.round(deadEnds.length / walls.length * 100)}%)`,
      autoRepairable: false,
    });
  }

  return {
    wallGraph: { nodes, edges, faces },
    violations,
    repairs,
    roomCandidates: faces.filter(f => f.isClosed && f.areaSqft >= 10),
    graphIntegrity: computeGraphIntegrity(violations, walls.length, faces.length),
  };
}

function findMinimalCycles(
  nodes: WallNode[],
  edges: WallEdge[]
): GraphFace[] {
  // Half-edge face enumeration for planar graphs
  // 1. Create half-edges (each edge becomes two directed half-edges)
  // 2. For each half-edge, find the "next" half-edge by:
  //    a. At the target node, find all outgoing half-edges
  //    b. Sort by angle relative to incoming direction
  //    c. Select the LEFTMOST (smallest CW rotation) = next half-edge
  // 3. Follow next pointers to form cycles
  // 4. Each cycle is a face (room candidate)
  // 5. Compute area via Shoelace; discard the outer face (largest area)

  const halfEdges = createHalfEdges(edges);
  linkHalfEdges(halfEdges, nodes);
  const cycles = traceCycles(halfEdges);
  return cycles.map(cycle => ({
    id: generateId(),
    edgeIds: cycle.map(he => he.edgeId),
    vertices: cycle.map(he => getNodePosition(he.startNodeId, nodes)),
    areaSqft: shoelaceArea(cycle.map(he => getNodePosition(he.startNodeId, nodes))),
    isClosed: cycle[0].startNodeId === cycle[cycle.length - 1].endNodeId,
    perimeterFt: cycle.reduce((sum, he) => sum + he.length, 0) / 12,
  }));
}
```

---

## 15. Database Schema Changes

### 15.1 New Table: `validation_evidence`

```sql
-- Migration: 20260216000005_create_validation_evidence.sql

CREATE TABLE public.validation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  layer INTEGER NOT NULL CHECK (layer BETWEEN 1 AND 10),
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'warn', 'fail')),
  score NUMERIC(5,2) NOT NULL,
  details TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  auto_correction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_evidence_plan
  ON validation_evidence(plan_upload_id);
CREATE INDEX idx_validation_evidence_element
  ON validation_evidence(plan_upload_id, element_id);

ALTER TABLE public.validation_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_read_validation_evidence" ON public.validation_evidence
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));
```

### 15.2 New Table: `micro_confirmations`

```sql
-- Migration: 20260216000006_create_micro_confirmations.sql

CREATE TABLE public.micro_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,
  confirmation_type TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  context JSONB NOT NULL,
  response JSONB,
  responded_by UUID REFERENCES public.users(id),
  responded_at TIMESTAMPTZ,
  confidence_boost NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_micro_confirmations_plan
  ON micro_confirmations(plan_upload_id);

ALTER TABLE public.micro_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_read_micro_confirmations" ON public.micro_confirmations
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "company_respond_micro_confirmations" ON public.micro_confirmations
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));
```

### 15.3 Modify: `extraction_jobs` — Add validation stage

```sql
-- Migration: 20260216000007_add_validation_stage.sql

ALTER TABLE public.extraction_jobs
  DROP CONSTRAINT extraction_jobs_stage_check;

ALTER TABLE public.extraction_jobs
  ADD CONSTRAINT extraction_jobs_stage_check CHECK (stage IN (
    'extract_vectors', 'classify_sheet', 'detect_scale',
    'detect_elements', 'detect_rooms', 'extract_schedules',
    'extract_mep', 'calculate_quantities',
    'cross_page_reconcile', 'validate', 'generate_estimate'
  ));
```

This adds a `validate` stage between `cross_page_reconcile` and `generate_estimate` where L7-L10 run.

### 15.4 Modify: `plan_uploads` — Add validation summary

```sql
-- Migration: 20260216000008_add_plan_uploads_validation.sql

ALTER TABLE public.plan_uploads
ADD COLUMN validation_summary JSONB,
ADD COLUMN auto_corrections_applied INTEGER DEFAULT 0,
ADD COLUMN human_confirmations INTEGER DEFAULT 0;
```

---

## 16. Worker Job Segmentation Strategy

### 16.1 Updated Pipeline Stages

The validation framework adds layers as sub-stages within existing worker queue stages:

```
Per-page jobs (existing + enhanced):
  extract_vectors      → L1 runs inline (ExtractionQuality added to output)
  classify_sheet       → unchanged
  detect_scale         → L2 runs after scale detection
  detect_elements      → L3 + L4 run after geometry classification
  detect_rooms         → L3 (room closure) + L6 (area methods) run inline
  extract_schedules    → unchanged
  extract_mep          → unchanged
  calculate_quantities → L6 (quantity cross-checks) runs inline

Cross-page jobs (existing + new):
  cross_page_reconcile → L5 runs as primary logic
  validate             → NEW: L7 + L9 run, L8 prompts generated
  generate_estimate    → L10 runs as gate before writing results
```

### 16.2 Validation Job Details

```typescript
// Added to worker-queue.ts createExtractionPipeline():
// After cross_page_reconcile, before generate_estimate:

{
  stage: 'validate',
  page_number: 0,  // cross-page job
  depends_on: [cross_page_reconcile_job_id],
  // Runs: L7 (confidence engine) + L9 (error recovery)
  // Output: ConfidenceResult + RecoveryResult + MicroConfirmation[]
}

// generate_estimate depends on validate
// If L8 micro-confirmations needed:
//   validate job completes with status 'awaiting_confirmation'
//   Frontend shows MicroConfirmation UI
//   User responds → re-run validate with updated evidence
//   Then generate_estimate proceeds
```

### 16.3 Job Status Extension

```sql
-- validate stage can have additional status:
ALTER TABLE public.extraction_jobs
  DROP CONSTRAINT extraction_jobs_status_check;

ALTER TABLE public.extraction_jobs
  ADD CONSTRAINT extraction_jobs_status_check CHECK (status IN (
    'pending', 'claimed', 'processing', 'completed', 'failed',
    'dead_letter', 'awaiting_confirmation'
  ));
```

---

## 17. Failure Recovery Scenarios

| Scenario | Detection | Recovery | Escalation |
|---|---|---|---|
| **Scale wrong by 2x** | L2: all dimensions fail at 2% but pass at 4% (factor of 2 error) | L2 recommends corrected scale, L9 applies if confidence >= 80 | L8 asks user to confirm |
| **Missing interior walls** | L3: huge_room violations, L6: sum(rooms) << gross area | L4: check for relationship violations suggesting walls exist | L8 asks for room count |
| **Hatch lines misdetected as walls** | L3: hundreds of thin parallel walls, L4: walls with no doors/windows | L9: re-run L1 with stricter hatch filter (spacing consistency < 0.05") | Flag for review |
| **Wrong sheet classified as floor plan** | L3: no room cycles found, L4: no relationships | L1: reclassify sheet (likely elevation or section) | Skip sheet, log |
| **Multi-scale page undetected** | L2: bimodal dimension distribution (half at scale A, half at scale B) | L2 triggers multi-scale zone detection (REQ-029F) | L8 asks user to confirm scales |
| **Schedule parsing error (misaligned columns)** | L5: schedule counts wildly inconsistent with geometry | L5: fall back to geometric counts as primary | Flag schedule extraction failure |
| **User contradicts all auto-detection** | L8: all micro-confirmations select non-default options | L9: apply user corrections, re-run L7 | If still low confidence, recommend manual takeoff |
| **Corrupt PDF page** | L1: extraction throws error, pathObjectCount = 0 | Skip page, log error, continue with remaining pages | Show partial results + note skipped page |

---

## 18. Performance Benchmarks

| Layer | Target Latency | Memory | Notes |
|---|---|---|---|
| L1: Extraction Quality | +50ms per page | +1KB | Lightweight metadata extraction |
| L2: Dimension Validation | +200ms per page | +5KB | Regex parsing + line matching |
| L3: Constraint Solver | +500ms per page | +50KB (wall graph) | Graph construction + cycle detection |
| L4: Relationship Graph | +300ms per page | +20KB | Spatial queries (use simple bounding box pre-filter) |
| L5: Cross-Sheet Reconciliation | +1s total (all pages) | +10KB | Runs once, aggregates counts |
| L6: Quantity Validation | +200ms per page | +5KB | Arithmetic cross-checks |
| L7: Confidence Engine | +100ms total | +2KB per element | Weighted arithmetic |
| L8: Micro-Confirmation | 0ms (async, user-driven) | +1KB per prompt | UI renders prompts, user responds |
| L9: Error Recovery | +300ms total | +10KB | Applies corrections, re-scores |
| L10: Approval Gate | +50ms total | +1KB | Simple threshold logic |
| **Total overhead** | **~1.5s per page + ~1.5s total** | **~100KB per page** | Adds ~15% to existing pipeline |

For a 26-page commercial TI plan:
- Existing pipeline: ~60s (design.md Section 13)
- With validation framework: ~100s (~67% increase)
- Acceptable tradeoff for near-perfect accuracy

---

## 19. Edge Case Handling

### 19.1 No Schedules in Plan Set

Some plan sets (especially residential) have no schedule sheets. L5 gracefully degrades:
- Skip cross-sheet reconciliation
- Note in review flags: `"no_schedules_for_cross_reference"`
- L7 redistributes L5 weight to L2, L3, L6

### 19.2 Plan with Only One Page

Skip cross-page stages entirely. L5 runs within single page if schedule tables present on same sheet as floor plan.

### 19.3 Scanned/Raster PDF (Routed to GPT-4o)

L1 detects raster, routes to GPT-4o fallback. Validation framework does NOT run for GPT-4o output (different data format). GPT-4o results get:
- Flat confidence from existing scorer
- `raster_fallback` penalty (-20)
- Always requires review

### 19.4 Mixed Plan Set (Some Vector, Some Raster)

Per-page classification drives routing. Vector pages get full 10-layer validation. Raster pages get GPT-4o fallback. Cross-sheet reconciliation (L5) can still run, comparing vector-extracted geometry against GPT-4o-extracted data from other pages.

### 19.5 Non-English Plans

Text clustering (REQ-027B) uses spatial proximity, not language parsing. Dimension patterns are universal. Room classification (REQ-028D) text matching may fail for non-English labels — falls back to `unknown` classification. Confidence reduced, but geometry extraction works regardless.

### 19.6 Plans with Revision Clouds

Revision clouds (wavy enclosed regions) may interfere with room detection. L3 filters: path with >20 inflection points and no straight segments → likely revision cloud, exclude from wall graph.

### 19.7 Demolition-Only Plans

Some TI plan sets include a separate demolition plan. All walls detected as `demolition` on this sheet. L5 cross-references with floor plan: walls that appear on demolition plan but not on floor plan → confirmed demolition. Walls on both → verify construction_status consistency.

---

## 20. Future AI Integration Strategy

### 20.1 Phase 1 (Current): Rule-Based with Human Micro-Confirmation

Pure deterministic rules + minimal human input. No ML involved. This establishes:
- Baseline accuracy metrics per element type
- Training data collection (user confirmations = labeled corrections)
- Audit trail of what rules worked and what failed

### 20.2 Phase 2: Hybrid Rule + ML Symbol Recognition

After collecting corrections from 100+ plan sets:
- Train lightweight CNN for electrical/plumbing symbol classification
- Use as L4 enhancement: ML predicts symbol type, rules verify context
- Rule engine remains primary; ML provides additional evidence to L7

### 20.3 Phase 3: Learned Rule Tuning

After collecting corrections from 500+ plan sets:
- Analyze which L3 constraints are most violated
- Tune rule thresholds per CAD origin (AutoCAD vs Revit exports have different precision)
- Auto-adjust L7 weights based on historical accuracy per layer

### 20.4 Phase 4: GPT-4o as Verification Layer (Not Primary)

Flip the current model: instead of GPT-4o as primary extractor (expensive, non-reproducible):
- Vector engine extracts quantities (free, deterministic)
- GPT-4o vision verifies uncertain elements (targeted, cost-controlled)
- Only invoke GPT-4o for elements with L7 confidence < 60
- Cost: ~$0.10-0.50 per plan set (vs current $2-5 per plan set)

### 20.5 Data Collection for Training

Every user interaction is a training signal:
- L8 micro-confirmation: user confirms/corrects system output → supervised label
- Takeoff review: user accepts/rejects items → binary signal per element
- Manual additions: items user adds that system missed → false negative signal
- Manual deletions: items user removes → false positive signal

Store in `validation_evidence` table with `user_response` metadata for future model training.

---

## 21. Output Format

The final validation output appended to `ExtractionResult`:

```typescript
// Extends ExtractionResult (design.md Section 2.1)
interface ValidatedExtractionResult extends ExtractionResult {
  validationSummary: {
    geometryIntegrity: number;      // 0-100
    dimensionAccuracy: number;      // 0-100
    crossSheetMatch: number;        // 0-100
    constraintIntegrity: number;    // 0-100
    quantityIntegrity: number;      // 0-100
    overallConfidence: number;      // 0-100
    requiresReview: boolean;
  };
  discrepancies: SheetDiscrepancy[];
  autoCorrectionsApplied: CorrectionRecord[];
  finalQuantities: ExtractionResult['quantities']; // post-correction
}
```

JSON output example:

```json
{
  "validationSummary": {
    "geometryIntegrity": 88,
    "dimensionAccuracy": 95,
    "crossSheetMatch": 82,
    "constraintIntegrity": 91,
    "quantityIntegrity": 87,
    "overallConfidence": 89,
    "requiresReview": false
  },
  "discrepancies": [
    {
      "dataType": "doors",
      "severity": "minor",
      "description": "Door schedule shows 14 doors, geometry detected 13. Door D-14 (storage closet) not detected.",
      "scheduleSource": { "page": 3, "row": 14 }
    }
  ],
  "autoCorrectionsApplied": [
    {
      "type": "wall_endpoint_snap",
      "elementId": "wall_047",
      "description": "Snapped wall endpoint 1.2\" to intersection node",
      "confidence": 92
    },
    {
      "type": "angle_normalize",
      "elementId": "wall_023",
      "description": "Adjusted angle from 89.7° to 90.0°",
      "confidence": 95
    }
  ],
  "finalQuantities": {
    "drywall_sf": 4250,
    "flooring_sf": 1890,
    "baseboard_lf": 620,
    "ceiling_sf": 1890,
    "paint_sf": 6100,
    "demo_drywall_sf": 1200,
    "demo_framing_lf": 340
  }
}
```

---

## 22. New File Tree

```
lib/extraction/validation/           ← ALL NEW
  extraction-quality.ts              # L1: extraction quality assessment
  dimension-validator.ts             # L2: dimension cross-validation
  constraint-solver.ts               # L3: geometry constraint solver
  relationship-graph.ts              # L4: symbol relationship graph
  cross-sheet-reconciler.ts          # L5: cross-sheet reconciliation
  quantity-validator.ts              # L6: redundant quantity validation
  confidence-engine.ts               # L7: probabilistic confidence (replaces confidence-scorer.ts)
  micro-confirmation.ts              # L8: human micro-confirmation logic
  error-recovery.ts                  # L9: auto-correction engine
  approval-gate.ts                   # L10: final approval gate
  types.ts                           # shared validation types

components/estimates/
  MicroConfirmation.tsx              # L8: micro-confirmation UI ← NEW
```

---

## 23. Migration from Existing Confidence Scorer

The existing `confidence-scorer.ts` (design.md Section 5, 7) is replaced:

| Existing | Replacement |
|---|---|
| `confidence-scorer.ts` | `validation/confidence-engine.ts` (L7) |
| Flat 4-component scoring | 6-layer weighted evidence scoring |
| 3 thresholds (70/40) | 5 thresholds (90/80/60/40) |
| Static penalties only | Penalties + bonuses from 6 layers |
| No auto-correction | L9 auto-correction + L8 user input |
| No cross-validation | L2/L5/L6 cross-validation |

Backward compatible: the `ExtractionResult.extraction_meta` interface is extended, not changed. Old fields (`overall_confidence`, `requires_review`, `review_flags`) still populated.

---

**Status:** PENDING APPROVAL
**Approval Required:** Yes — approve before proceeding to implementation tasks
