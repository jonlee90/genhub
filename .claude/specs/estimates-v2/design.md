# Design: Estimates Module v2.3 - Vector Extraction Engine

**Project:** GenHub PWA - Estimates Module Enhancement
**Date:** 2026-02-14 | **Version:** 2.4 | **Status:** PENDING APPROVAL
**Based on:** `requirements.md` v2.3 (REQ-001 through REQ-042)
**Companion:** `accuracy-framework.md` v1.0 (10-layer validation architecture)

---

## 1. Architecture Overview

### 1.1 System Context

```
                          GenHub Estimates v2.3
                          =====================

User Upload (PDF)
      |
      v
+------------------+     +---------------------+     +------------------+
| /api/estimates/  |---->| Extraction Router   |---->| Worker Queue     |
| extract (NEW)    |     | (REQ-034)           |     | (PGMQ/REQ-035)  |
+------------------+     +---------------------+     +------------------+
                            |            |                    |
                   +--------+    +-------+           +--------+--------+
                   v             v                   v                 v
          +-------------+  +-----------+    +---------------+  +-------------+
          | Vector      |  | GPT-4o    |    | Per-Page      |  | Cross-Page  |
          | Engine      |  | Vision    |    | Stages 1-8    |  | Stages 9-10 |
          | (NEW)       |  | (Legacy)  |    +---------------+  +-------------+
          +-------------+  +-----------+            |
                   |             |                   v
                   +------+------+          +------------------+
                          v                 | Realtime Progress|
                  +---------------+         | (REQ-036)        |
                  | normalize     |         +------------------+
                  | TakeoffItem() |
                  +---------------+
                          |
                          v
                  +---------------+
                  | takeoff_items |
                  | table         |
                  +---------------+
```

### 1.2 Data Flow - Full Pipeline

```
PDF Upload
  |
  v
[1] extract_vectors ---- pdfjs-dist getOperatorList() per page
  |                      Output: VectorPage (lines, arcs, paths, texts, rects)
  v
[2] classify_sheet ----- Raster/vector/mixed detection (REQ-027D)
  |                      Sheet type detection + filtering (REQ-027C)
  |                      Hatch/dimension filtering (REQ-027E)
  v
[3] detect_scale ------- 6-priority cascade (REQ-029A-G)
  |                      Output: ScaleInfo with method + confidence
  v
[4] detect_elements ---- Wall/door/window rules (REQ-028A-C)
  |                      TI wall classification (new/existing/demo)
  v
[5] detect_rooms ------- Wall-graph cycle detection (REQ-028D)
  |                      Point-in-polygon text assignment
  v
[6] extract_schedules -- Table detection + parsing (REQ-038)
  |                      Equipment/door/fixture/panel/finish schedules
  v
[7] extract_mep -------- Electrical/plumbing/HVAC (REQ-040-042)
  |                      Symbol counting, pipe/duct tracing
  v
[8] calculate_quantities - Drywall/flooring/baseboard/ceiling (REQ-031)
  |
  === All pages complete ===
  |
[9] cross_page_reconcile - Merge rooms, resolve scale conflicts,
  |                        cross-ref schedules with geometry
  v
[10] generate_estimate --- Final ExtractionResult + confidence (REQ-032-033)
  |
  v
normalizeTakeoffItem() --> takeoff_items table
```

### 1.3 Integration Points with Existing Code

| Existing Code | How v2.3 Integrates |
|---|---|
| `app/api/estimates/parse/route.ts` | Kept intact for GPT-4o fallback; called by router for raster pages |
| `lib/ai/normalize-takeoff.ts` | Reused by both engines; expanded trade/waste mappings |
| `lib/ai/parse-prompt.ts` | Kept for GPT-4o; enhanced with room_context + page_type |
| `takeoff_items` table | Both engines write here via `normalizeTakeoffItem()` |
| `plan_parse_results` table | Vector engine writes with `model: "vector-engine-v1"` |
| `ai_usage_log` table | Vector engine logs `cost: 0` |

### 1.4 Feature Flag Routing (REQ-034)

```
ENV: EXTRACTION_ENGINE = "auto" | "vector" | "openai"

auto (default):
  per page -> classify (REQ-027D)
    vector  -> rule engine
    raster  -> GPT-4o (/api/estimates/parse)
    mixed   -> vector extraction + GPT-4o for image regions

vector:
  all pages -> rule engine (error on raster)

openai:
  all pages -> GPT-4o (legacy behavior)
```

---

## 2. Type System

### 2.1 Core Vector Types (`lib/extraction/types.ts` -- NEW)

```typescript
// ============================================
// Geometric Primitives
// ============================================

interface Point {
  x: number; // inches (PDF points / 72)
  y: number;
}

interface VectorLine {
  start: Point;
  end: Point;
  strokeWidth: number;    // in PDF points
  dashArray: number[];    // empty = solid, [5,3] = dashed
  strokeColor: RGBColor;
  opacity: number;
  length: number;         // computed, in inches
}

interface VectorArc {
  center: Point;
  radius: number;         // inches
  startAngle: number;     // radians
  endAngle: number;
  strokeWidth: number;
  dashArray: number[];
  sweepDegrees: number;   // computed
}

interface VectorPath {
  segments: PathSegment[]; // moveTo, lineTo, curveTo, closePath
  strokeWidth: number;
  dashArray: number[];
  strokeColor: RGBColor;
  fillColor: RGBColor | null;
  isClosed: boolean;
  boundingBox: BoundingBox;
}

interface PathSegment {
  type: 'moveTo' | 'lineTo' | 'curveTo' | 'closePath';
  points: Point[];        // 1 for moveTo/lineTo, 3 for curveTo, 0 for close
}

interface TextObject {
  content: string;
  position: Point;
  fontSize: number;       // in points
  fontName: string;
  boundingBox: BoundingBox;
  transform: number[];    // PDF text matrix [a,b,c,d,e,f]
}

interface VectorRect {
  position: Point;        // top-left
  width: number;          // inches
  height: number;
  strokeWidth: number;
  strokeColor: RGBColor | null;
  fillColor: RGBColor | null;
  rotation: number;       // degrees
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RGBColor {
  r: number; g: number; b: number; // 0-1
}

// ============================================
// Text Clustering
// ============================================

interface TextCluster {
  texts: TextObject[];
  combinedContent: string;
  centroid: Point;
  boundingBox: BoundingBox;
  role: 'room_name' | 'dimension' | 'note' | 'title_block' | 'sheet_title' | 'annotation';
}

// ============================================
// Scale
// ============================================

type ScaleMethod = 'metadata' | 'explicit' | 'scale_bar' | 'calibrated' | 'inferred' | 'user_provided';

interface ScaleInfo {
  scaleFactor: number;        // drawing units to real inches (e.g., 48 for 1/4"=1'-0")
  method: ScaleMethod;
  confidence: number;         // 0-100
  scaleString: string | null; // e.g., "1/4\" = 1'-0\""
  zone?: BoundingBox;         // for multi-scale pages (REQ-029F)
}

// ============================================
// Page-Level Output
// ============================================

type PageClassification = 'vector' | 'raster' | 'mixed';
type SheetType = 'floor_plan' | 'reflected_ceiling' | 'site_plan' | 'elevation'
  | 'section' | 'detail' | 'code' | 'schedule' | 'electrical' | 'plumbing'
  | 'mechanical' | 'cover' | 'unknown';

interface VectorPage {
  pageNumber: number;
  pageClassification: PageClassification;
  sheetType: SheetType;
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
  filteredElements: {
    hatchLines: VectorLine[];      // excluded from classification
    dimensionLines: VectorLine[];  // excluded from classification
  };
  stats: {
    totalPaths: number;
    totalImages: number;
    imageAreaPct: number;          // for raster detection
    extractionTimeMs: number;
  };
}

// ============================================
// Classified Geometry
// ============================================

type WallType = 'partition' | 'structural';
type ConstructionStatus = 'new' | 'existing_to_remain' | 'demolition';
type DoorType = 'single' | 'double' | 'pocket' | 'sliding' | 'bifold' | 'overhead';

interface DetectedWall {
  id: string;
  startPoint: Point;
  endPoint: Point;
  thickness: number;            // inches
  length: number;               // inches (real-world after scale)
  wallType: WallType;
  constructionStatus: ConstructionStatus;
  isCurved: boolean;
  adjacentRooms: string[];
  confidenceScore: number;
  matchedRule: string;          // e.g., "parallel_line_pair", "filled_rectangle"
}

interface DetectedDoor {
  id: string;
  position: Point;
  width: number;                // inches (real-world)
  doorType: DoorType;
  room: string | null;
  scheduleRef: string | null;   // e.g., "D1" from annotation
  confidenceScore: number;
  matchedRule: string;
}

interface DetectedWindow {
  id: string;
  position: Point;
  width: number;                // inches
  isCurtainWall: boolean;
  mullionCount: number | null;
  room: string | null;
  scheduleRef: string | null;   // e.g., "W1"
  confidenceScore: number;
  matchedRule: string;
}

interface DetectedRoom {
  id: string;
  name: string;
  classification: RoomClassification;
  polygon: Point[];             // vertices
  areaSqft: number;
  perimeterFt: number;
  ceilingHeightFt: number | null;
  wallSegmentIds: string[];
  doorIds: string[];
  windowIds: string[];
  confidenceScore: number;
}

type RoomClassification = 'bedroom' | 'kitchen' | 'living_room' | 'bathroom'
  | 'mechanical' | 'storage' | 'garage' | 'office' | 'laundry' | 'closet'
  | 'corridor' | 'lobby' | 'restroom' | 'break_room' | 'unknown';

// ============================================
// Schedule Types (REQ-038)
// ============================================

type ScheduleType = 'equipment_schedule' | 'door_schedule' | 'window_schedule'
  | 'plumbing_fixture_schedule' | 'panel_schedule' | 'finish_schedule';

interface DetectedTable {
  boundingBox: BoundingBox;
  scheduleType: ScheduleType;
  headers: string[];
  rows: string[][];
  confidence: number;
}

interface EquipmentItem {
  mark: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  dimensions: string | null;
  utilityRequirements: string | null;
  quantity: number;
  sheetReference: string;
  confidenceScore: number;
}

interface FinishMapping {
  roomName: string;
  floor: string | null;
  base: string | null;
  wall: string | null;
  paint: string | null;
  ceiling: string | null;
  confidenceScore: number;
}

// ============================================
// MEP Types (REQ-040-042)
// ============================================

interface ElectricalSummary {
  panelSizeAmps: number | null;
  outletCount: number;
  switchCount: number;
  lightingFixtureCount: number;
  dedicatedCircuits: number;
  deviceBreakdown: { type: string; count: number }[];
}

interface PlumbingSummary {
  fixtureCount: number;
  fixtures: { type: string; count: number }[];
  waterHeater: string | null;
  greaseInterceptor: boolean;
}

interface HvacSummary {
  unitCount: number;
  totalTonnage: number | null;
  ductLf: number;
  diffuserCount: number;
  units: { id: string; type: string; capacity: string }[];
}

// ============================================
// Final Output (REQ-033)
// ============================================

interface ExtractionResult {
  projectSummary: {
    grossSqft: number;
    totalRooms: number;
    totalWallsLf: number;
    newWallsLf: number;
    existingWallsLf: number;
    demoWallsLf: number;
    totalDoors: number;
    totalWindows: number;
    totalEquipment: number;
    totalPlumbingFixtures: number;
    totalElectricalDevices: number;
    sheetsProcessed: number;
    sheetsSkipped: number;
    schedulesExtracted: number;
  };
  rooms: DetectedRoom[];
  walls: DetectedWall[];
  doors: DetectedDoor[];
  windows: DetectedWindow[];
  ceiling: {
    totalAreaSqft: number;
    gridType: string | null;
    lightFixtures: number;
    diffusers: number;
    confidenceScore: number;
  } | null;
  quantities: {
    drywallSf: number;
    flooringSf: number;
    baseboardLf: number;
    ceilingSf: number;
    paintSf: number;
    demoDrywallSf: number;
    demoFramingLf: number;
  };
  equipment: EquipmentItem[] | null;
  finishes: FinishMapping[] | null;
  mep: {
    electrical: ElectricalSummary | null;
    plumbing: PlumbingSummary | null;
    hvac: HvacSummary | null;
  } | null;
  extractionMeta: {
    scaleMethod: ScaleMethod | null;
    scaleFactor: number | null;
    overallConfidence: number;
    requiresReview: boolean;
    reviewFlags: string[];
    processingTimeMs: number;
    engineVersion: string;  // "vector-engine-v1"
  };
}
```

### 2.2 Validation Types (`lib/extraction/validation/types.ts` -- NEW)

> Full type definitions in `accuracy-framework.md` Sections 2-11. Summary below.

```typescript
// ============================================
// Layer Evidence (shared across all 10 layers)
// ============================================

interface LayerEvidence {
  layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  elementId: string;
  elementType: ElementType;
  verdict: 'pass' | 'warn' | 'fail';
  score: number;               // 0-100
  details: string;
  evidence: Record<string, unknown>;
  autoCorrection?: AutoCorrection;
}

type ElementType = 'wall' | 'door' | 'window' | 'room' | 'scale'
  | 'schedule_row' | 'quantity' | 'fixture' | 'equipment';

interface AutoCorrection {
  type: string;
  before: unknown;
  after: unknown;
  confidence: number;
}

// ============================================
// L1: Extraction Quality
// ============================================

interface ExtractionQuality {
  operatorCount: number;
  textObjectCount: number;
  pathObjectCount: number;
  imageObjectCount: number;
  cadLayersDetected: string[];
  coordinatePrecision: number;
  hasUserUnitKey: boolean;
  colorSpaceCount: number;
  duplicatePathCount: number;
  estimatedCadOrigin: 'autocad' | 'revit' | 'archicad' | 'sketchup' | 'unknown';
}

// ============================================
// L3: Wall Graph (Constraint Solver)
// ============================================

interface WallGraph {
  nodes: WallNode[];
  edges: WallEdge[];
  faces: GraphFace[];
}

interface WallNode {
  id: string;
  position: Point;
  degree: number;
  type: 'L' | 'T' | 'X' | 'endpoint' | 'dead_end';
}

interface WallEdge {
  id: string;
  wallId: string;
  startNodeId: string;
  endNodeId: string;
  length: number;
  thickness: number;
  angle: number;
}

interface GraphFace {
  id: string;
  edgeIds: string[];
  vertices: Point[];
  areaSqft: number;
  isClosed: boolean;
  perimeterFt: number;
}

// ============================================
// L7: Confidence Engine (replaces flat scorer)
// ============================================

interface ConfidenceResult {
  elementScores: ElementConfidence[];
  categoryScores: CategoryConfidence[];
  overallConfidence: number;
  requiresReview: boolean;
  reviewFlags: ReviewFlag[];
  confidenceBreakdown: ConfidenceBreakdown;
}

interface ConfidenceBreakdown {
  geometryIntegrity: number;
  dimensionAccuracy: number;
  constraintSatisfaction: number;
  relationshipValidity: number;
  crossSheetMatch: number;
  quantityIntegrity: number;
}

// ============================================
// L8: Micro-Confirmation
// ============================================

type MicroConfirmationType =
  | 'scale_confirm' | 'ceiling_height' | 'door_count'
  | 'room_count' | 'wall_type_confirm' | 'schedule_match'
  | 'element_verify';

interface MicroConfirmation {
  id: string;
  type: MicroConfirmationType;
  question: string;
  options: { label: string; value: unknown; isDefault: boolean }[];
  context: {
    pageNumber: number;
    region: BoundingBox;
    relatedElementIds: string[];
    currentValue: unknown;
  };
  priority: number;
  confidenceImpact: number;
}

// ============================================
// L10: Approval Gate
// ============================================

interface ApprovalGateResult {
  decision: 'auto_approved' | 'review_required' | 'rejected';
  overallConfidence: number;
  criticalFlags: ReviewFlag[];
  validationSummary: ValidationSummary;
  extractionResult: ExtractionResult;
}

// ============================================
// Validated Output (extends ExtractionResult)
// ============================================

interface ValidatedExtractionResult extends ExtractionResult {
  validationSummary: {
    geometryIntegrity: number;
    dimensionAccuracy: number;
    crossSheetMatch: number;
    constraintIntegrity: number;
    quantityIntegrity: number;
    overallConfidence: number;
    requiresReview: boolean;
  };
  discrepancies: SheetDiscrepancy[];
  autoCorrectionsApplied: CorrectionRecord[];
  finalQuantities: ExtractionResult['quantities'];
}
```

### 2.3 Worker Queue Types (`lib/extraction/types.ts` continued)

```typescript
type ExtractionStage =
  | 'extract_vectors'
  | 'classify_sheet'
  | 'detect_scale'
  | 'detect_elements'
  | 'detect_rooms'
  | 'extract_schedules'
  | 'extract_mep'
  | 'calculate_quantities'
  | 'cross_page_reconcile'
  | 'generate_estimate';

type JobStatus = 'pending' | 'claimed' | 'processing' | 'completed' | 'failed' | 'dead_letter';

interface ExtractionJob {
  id: string;
  planUploadId: string;
  pageNumber: number;
  stage: ExtractionStage;
  status: JobStatus;
  dependsOn: string[];
  result: Record<string, unknown> | null;
  error: string | null;
  attempt: number;
  maxAttempts: number;
  claimedAt: string | null;
  heartbeatAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface ExtractionProgress {
  planUploadId: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  currentStage: ExtractionStage | null;
  progressPct: number;
  pageStatuses: {
    pageNumber: number;
    stages: { stage: ExtractionStage; status: JobStatus }[];
  }[];
}
```

---

## 3. Database Schema Changes

### 3.1 New Table: `extraction_jobs` (REQ-035)

```sql
-- Migration: 20260216000001_create_extraction_jobs.sql

CREATE TABLE public.extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'extract_vectors', 'classify_sheet', 'detect_scale',
    'detect_elements', 'detect_rooms', 'extract_schedules',
    'extract_mep', 'calculate_quantities',
    'cross_page_reconcile', 'generate_estimate'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'claimed', 'processing', 'completed', 'failed', 'dead_letter'
  )),
  depends_on UUID[] DEFAULT '{}',
  result JSONB,
  error TEXT,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  claimed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_extraction_jobs_claimable
  ON extraction_jobs(status, created_at)
  WHERE status IN ('pending', 'claimed');
CREATE INDEX idx_extraction_jobs_plan
  ON extraction_jobs(plan_upload_id);
CREATE INDEX idx_extraction_jobs_company
  ON extraction_jobs(company_id);

-- RLS
ALTER TABLE public.extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_read_extraction_jobs" ON public.extraction_jobs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Trigger
CREATE TRIGGER update_extraction_jobs_updated_at
  BEFORE UPDATE ON public.extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Job claim function (SKIP LOCKED for concurrency)
CREATE OR REPLACE FUNCTION public.claim_extraction_job(p_worker_id TEXT)
RETURNS SETOF public.extraction_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE extraction_jobs
  SET status = 'claimed',
      claimed_at = now(),
      heartbeat_at = now(),
      attempt = attempt + 1
  WHERE id = (
    SELECT ej.id FROM extraction_jobs ej
    WHERE ej.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(ej.depends_on) AS dep_id
        JOIN extraction_jobs dep ON dep.id = dep_id
        WHERE dep.status != 'completed'
      )
    ORDER BY ej.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$;

-- Dead letter / heartbeat timeout function
CREATE OR REPLACE FUNCTION public.reap_stale_extraction_jobs()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stale AS (
    UPDATE extraction_jobs
    SET status = CASE
      WHEN attempt >= max_attempts THEN 'dead_letter'
      ELSE 'pending'
    END,
    claimed_at = NULL,
    heartbeat_at = NULL
    WHERE status = 'claimed'
      AND heartbeat_at < now() - INTERVAL '60 seconds'
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM stale;
$$;

-- Enable Supabase Realtime for progress tracking (REQ-036)
ALTER PUBLICATION supabase_realtime ADD TABLE public.extraction_jobs;
```

### 3.2 Modify: `plan_pages` -- Add classification columns (REQ-008, REQ-027D)

```sql
-- Migration: 20260216000002_add_plan_pages_classification.sql

ALTER TABLE public.plan_pages
ADD COLUMN page_type TEXT CHECK (page_type IN (
  'floor_plan', 'site_plan', 'elevation', 'section', 'detail',
  'schedule', 'electrical', 'plumbing', 'mechanical', 'cover',
  'specification', 'unknown'
)),
ADD COLUMN page_classification TEXT CHECK (page_classification IN (
  'vector', 'raster', 'mixed'
)),
ADD COLUMN classification_confidence NUMERIC(5,2);
```

### 3.3 Modify: `estimate_line_items` -- Add material FK (REQ-011)

```sql
-- Migration: 20260216000003_add_material_id_to_estimate_line_items.sql

ALTER TABLE public.estimate_line_items
ADD COLUMN material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

CREATE INDEX idx_eli_material_id
  ON public.estimate_line_items(material_id)
  WHERE material_id IS NOT NULL;
```

### 3.4 Modify: `takeoff_items` -- Add extraction engine metadata

```sql
-- Migration: 20260216000004_add_takeoff_items_extraction_metadata.sql

-- Add vector engine extraction method
ALTER TYPE extraction_method ADD VALUE IF NOT EXISTS 'vector';

-- Add room context and construction status
ALTER TABLE public.takeoff_items
ADD COLUMN room_context TEXT,
ADD COLUMN construction_status TEXT CHECK (construction_status IN (
  'new', 'existing_to_remain', 'demolition'
)),
ADD COLUMN extraction_engine TEXT CHECK (extraction_engine IN (
  'openai', 'vector-engine-v1'
));
```

### 3.5 New Table: `validation_evidence` (Accuracy Framework)

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

CREATE INDEX idx_validation_evidence_plan ON validation_evidence(plan_upload_id);
CREATE INDEX idx_validation_evidence_element ON validation_evidence(plan_upload_id, element_id);

ALTER TABLE public.validation_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_read_validation_evidence" ON public.validation_evidence
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));
```

### 3.6 New Table: `micro_confirmations` (Accuracy Framework)

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

CREATE INDEX idx_micro_confirmations_plan ON micro_confirmations(plan_upload_id);

ALTER TABLE public.micro_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_read_micro_confirmations" ON public.micro_confirmations
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "company_respond_micro_confirmations" ON public.micro_confirmations
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));
```

### 3.7 Modify: `extraction_jobs` — Add validation stage + awaiting_confirmation

```sql
-- Migration: 20260216000007_add_validation_stage.sql

ALTER TABLE public.extraction_jobs DROP CONSTRAINT extraction_jobs_stage_check;
ALTER TABLE public.extraction_jobs ADD CONSTRAINT extraction_jobs_stage_check CHECK (stage IN (
  'extract_vectors', 'classify_sheet', 'detect_scale',
  'detect_elements', 'detect_rooms', 'extract_schedules',
  'extract_mep', 'calculate_quantities',
  'cross_page_reconcile', 'validate', 'generate_estimate'
));

ALTER TABLE public.extraction_jobs DROP CONSTRAINT extraction_jobs_status_check;
ALTER TABLE public.extraction_jobs ADD CONSTRAINT extraction_jobs_status_check CHECK (status IN (
  'pending', 'claimed', 'processing', 'completed', 'failed',
  'dead_letter', 'awaiting_confirmation'
));
```

### 3.8 Modify: `plan_uploads` — Add validation summary

```sql
-- Migration: 20260216000008_add_plan_uploads_validation.sql

ALTER TABLE public.plan_uploads
ADD COLUMN validation_summary JSONB,
ADD COLUMN auto_corrections_applied INTEGER DEFAULT 0,
ADD COLUMN human_confirmations INTEGER DEFAULT 0;
```

### 3.9 Migration Order

```
1. 20260216000001_create_extraction_jobs.sql       (no deps)
2. 20260216000002_add_plan_pages_classification.sql (no deps)
3. 20260216000003_add_material_id_to_estimate_line_items.sql (no deps)
4. 20260216000004_add_takeoff_items_extraction_metadata.sql  (no deps)
5. 20260216000005_create_validation_evidence.sql    (depends on #1 for plan_uploads ref)
6. 20260216000006_create_micro_confirmations.sql    (depends on #1 for plan_uploads ref)
7. 20260216000007_add_validation_stage.sql          (depends on #1 for extraction_jobs)
8. 20260216000008_add_plan_uploads_validation.sql   (no deps)
```

All changes are additive (new tables, new columns, new enum values, constraint updates). No data migration needed. Rollback = drop table / drop columns / revert constraints.

---

## 4. Module Architecture

### 4.1 File Tree (`lib/extraction/` -- ALL NEW)

```
lib/extraction/
  types.ts                    # All TypeScript interfaces (Section 2)
  vector-parser.ts            # REQ-027A: pdfjs-dist getOperatorList wrapper
  page-classifier.ts          # REQ-027C-D: sheet filtering + raster detection
  hatch-filter.ts             # REQ-027E: hatch pattern + dimension line filtering
  text-clusterer.ts           # REQ-027B: spatial text clustering
  scale-detector.ts           # REQ-029: 6-priority scale cascade
  geometry-classifier.ts      # REQ-028: orchestrator for rules
  room-detector.ts            # REQ-028D: wall-graph cycle + point-in-polygon
  quantity-calculator.ts      # REQ-031: drywall/flooring/baseboard/ceiling
  confidence-scorer.ts        # REQ-032: scoring + review flags
  schedule-parser.ts          # REQ-038: table detection + cell extraction
  extraction-router.ts        # REQ-034: auto/vector/openai routing
  worker-queue.ts             # REQ-035: job creation, claim, heartbeat
  progress-tracker.ts         # REQ-036: Supabase Realtime subscription
  result-assembler.ts         # REQ-033: ExtractionResult assembly
  normalize-bridge.ts         # Bridge: ExtractionResult -> normalizeTakeoffItem()
  rules/
    wall-rules.ts             # REQ-028A: 4 wall detection rules + TI classification
    door-rules.ts             # REQ-028B: 7 door detection rules
    window-rules.ts           # REQ-028C: 2 window rules + schedule cross-ref
    ceiling-rules.ts          # REQ-030: RCP grid/fixture/diffuser detection
    schedule-rules.ts         # REQ-038A: table type classification by headers
    finish-rules.ts           # REQ-039: finish abbreviation decoding + room mapping
    electrical-rules.ts       # REQ-040: power plan + lighting symbol counting
    plumbing-rules.ts         # REQ-041: fixture schedule + symbol counting
    hvac-rules.ts             # REQ-042: equipment schedule + duct measurement
    stair-rules.ts            # REQ-037A: stair detection (Tier 6)
    column-rules.ts           # REQ-037B: column grid detection (Tier 6)
    elevator-rules.ts         # REQ-037C: elevator detection (Tier 6)
  validation/                   # Accuracy Validation Framework (NEW)
    types.ts                  # Shared validation types (LayerEvidence, etc.)
    extraction-quality.ts     # L1: extraction quality assessment + CAD origin
    dimension-validator.ts    # L2: dimension cross-validation
    constraint-solver.ts      # L3: geometry constraint solver (wall graph)
    relationship-graph.ts     # L4: symbol relationship graph engine
    cross-sheet-reconciler.ts # L5: cross-sheet reconciliation
    quantity-validator.ts     # L6: redundant quantity validation
    confidence-engine.ts      # L7: probabilistic confidence (replaces confidence-scorer.ts)
    micro-confirmation.ts     # L8: human micro-confirmation logic
    error-recovery.ts         # L9: auto-correction engine
    approval-gate.ts          # L10: final approval gate
```

### 4.2 Module Dependency Graph

```
vector-parser.ts
  |
  v
page-classifier.ts -----> (raster? -> GPT-4o fallback via extraction-router.ts)
  |
  v
hatch-filter.ts
  |
  v
text-clusterer.ts
  |
  +---> scale-detector.ts
  |
  v
geometry-classifier.ts
  |---- wall-rules.ts
  |---- door-rules.ts
  |---- window-rules.ts
  |
  v
room-detector.ts
  |
  v
schedule-parser.ts -----> schedule-rules.ts, finish-rules.ts
  |
  v
electrical-rules.ts, plumbing-rules.ts, hvac-rules.ts
  |
  v
quantity-calculator.ts
  |
  v
confidence-scorer.ts (replaced by validation/confidence-engine.ts)
  |
  v
validation/ (Accuracy Framework - L1-L10)
  |---- extraction-quality.ts (L1, inline with vector-parser)
  |---- dimension-validator.ts (L2, after scale-detector)
  |---- constraint-solver.ts (L3, after geometry-classifier)
  |---- relationship-graph.ts (L4, after room-detector)
  |---- cross-sheet-reconciler.ts (L5, cross-page stage)
  |---- quantity-validator.ts (L6, after quantity-calculator)
  |---- confidence-engine.ts (L7, replaces confidence-scorer.ts)
  |---- micro-confirmation.ts (L8, generates prompts)
  |---- error-recovery.ts (L9, applies corrections)
  |---- approval-gate.ts (L10, final decision)
  |
  v
result-assembler.ts --> normalize-bridge.ts --> normalizeTakeoffItem()
```

---

## 5. Key Module Designs

### 5.1 Vector Parser (`lib/extraction/vector-parser.ts`)

**Purpose:** Extract raw geometric primitives from each PDF page using pdfjs-dist.

**Key API:**
```typescript
import * as pdfjsLib from 'pdfjs-dist';
import { OPS } from 'pdfjs-dist/lib/core/ops';

export async function extractVectorPage(
  pdfData: ArrayBuffer,
  pageNumber: number
): Promise<VectorPage>

// Internal: processes getOperatorList() operators
// - OPS.constructPath -> lines, arcs, paths
// - OPS.paintImageXObject -> image tracking (for raster detection)
// - OPS.setLineWidth, OPS.setStrokeRGBColor -> style context
// - OPS.showText, OPS.showSpacedText -> text objects
// - OPS.rectangle -> rectangles
// Coordinates: all converted from PDF points to inches (/ 72)
```

**pdfjs-dist Worker Configuration:**
```typescript
// Configure worker for Node.js (Server Action / API route context)
// pdfjs-dist v5.4.624 ships with ESM worker
pdfjsLib.GlobalWorkerOptions.workerSrc = undefined; // disable worker in Node
// Use pdfjsLib.getDocument({ data, useWorkerFetch: false })
```

**Performance:** Target <2s per page. The getOperatorList() call is synchronous parsing of the PDF content stream -- no network calls, no rendering.

### 5.2 Page Classifier (`lib/extraction/page-classifier.ts`)

**Purpose:** Determine vector/raster/mixed + sheet type for routing.

```typescript
export function classifyPage(page: VectorPage): {
  classification: PageClassification;
  sheetType: SheetType;
  shouldSkip: boolean;
  skipReason: string | null;
}

// Raster detection (REQ-027D):
//   imageAreaPct > 90% AND constructPathCount < 10 -> 'raster'
//   imageAreaPct < 10% AND constructPathCount > 50 -> 'vector'
//   otherwise -> 'mixed'
//
// Sheet filtering (REQ-027C):
//   sheetTitle contains "DETAIL" -> skip
//   sheetTitle contains "CODE" -> skip
//   only title block text -> skip (cover sheet)
//
// Sheet type detection:
//   Title contains "FLOOR PLAN" or "FP" -> floor_plan
//   Title contains "RCP" or "REFLECTED CEILING" -> reflected_ceiling
//   Title contains "SITE" -> site_plan
//   E-prefix sheet number -> electrical
//   P-prefix sheet number -> plumbing
//   M-prefix sheet number -> mechanical
//   Contains table structures -> schedule
```

### 5.3 Scale Detector (`lib/extraction/scale-detector.ts`)

**Purpose:** 6-priority cascade to determine drawing scale.

```typescript
export async function detectScale(
  page: VectorPage,
  pdfMetadata: Record<string, unknown>
): Promise<ScaleInfo | null>

// Priority cascade (stops at first success):
// 1. checkPdfMetadata(pdfMetadata) -- /UserUnit, custom keys
// 2. parseTitleBlockScale(page.textClusters.titleBlock) -- regex patterns
// 3. detectScaleBar(page.elements) -- tick marks + labels
// 4. calibrateFromDimensions(page.textClusters.dimensions, page.elements)
//    -- measure extension lines, compute median, reject outliers >2sigma
// 5. inferFromSheetSize(pdfMediaBox) -- ARCH D/E heuristics
// 6. return null (requires_calibration: true)
```

**Scale Pattern RegExes:**
```typescript
const ARCH_SCALE = /(\d+\/\d+)"?\s*=\s*1'-0"/;     // 1/4" = 1'-0"
const ENG_SCALE = /1"\s*=\s*(\d+)'/;                // 1" = 20'
const METRIC_SCALE = /1\s*:\s*(\d+)/;               // 1:100
const FRACTION_MAP: Record<string, number> = {
  '1/8': 96, '3/16': 64, '1/4': 48, '3/8': 32, '1/2': 24, '1': 12
};
```

### 5.4 Geometry Classifier (`lib/extraction/geometry-classifier.ts`)

**Purpose:** Orchestrate wall/door/window rule evaluation.

```typescript
export function classifyGeometry(
  page: VectorPage,
  scale: ScaleInfo
): {
  walls: DetectedWall[];
  doors: DetectedDoor[];
  windows: DetectedWindow[];
}

// Flow:
// 1. Filter: remove hatch lines, dimension lines (already done by hatch-filter)
// 2. Detect walls (wall-rules.ts) -- parallel pairs, filled rects, thick lines
// 3. Build wall intersection graph (T/L/X intersections)
// 4. Detect doors (door-rules.ts) -- arcs at wall gaps, special types
// 5. Detect windows (window-rules.ts) -- thin rects in walls, curtain walls
// 6. TI classification -- legend parsing, line property matching
// 7. Score each element (confidence-scorer.ts)
```

### 5.5 Room Detector (`lib/extraction/room-detector.ts`)

**Purpose:** Find rooms from wall graph cycles + assign text.

```typescript
export function detectRooms(
  walls: DetectedWall[],
  doors: DetectedDoor[],
  windows: DetectedWindow[],
  textClusters: TextCluster[],
  scale: ScaleInfo
): DetectedRoom[]

// Algorithm:
// 1. Build planar graph: walls = edges, intersections = nodes
// 2. Find minimal cycles (faces) using half-edge face enumeration
// 3. For each cycle:
//    a. Compute polygon vertices
//    b. Area via Shoelace formula: |sum(x_i * y_{i+1} - x_{i+1} * y_i)| / 2
//    c. Perimeter = sum of wall segment lengths
// 4. Text assignment: ray-casting point-in-polygon for each room name cluster
// 5. Room classification from text patterns (KITCHEN -> kitchen, etc.)
// 6. Discard open polygons (gap > max door width) -- flag for review
```

### 5.6 Schedule Parser (`lib/extraction/schedule-parser.ts`)

**Purpose:** Detect and extract tabular data from plan sheets.

```typescript
export function detectTables(page: VectorPage): DetectedTable[]

export function parseEquipmentSchedule(table: DetectedTable): EquipmentItem[]
export function parseDoorSchedule(table: DetectedTable): DoorScheduleItem[]
export function parseFixtureSchedule(table: DetectedTable): FixtureScheduleItem[]
export function parsePanelSchedule(table: DetectedTable): PanelScheduleItem[]
export function parseFinishSchedule(table: DetectedTable): FinishMapping[]

// Table detection:
// 1. Find grid intersections (horizontal + vertical line crossings)
// 2. Group into cells by bounding boxes
// 3. Extract text per cell via point-in-rect
// 4. Classify by header row content (schedule-rules.ts)
```

### 5.7 Worker Queue (`lib/extraction/worker-queue.ts`)

**Purpose:** Create, claim, and manage extraction pipeline jobs.

```typescript
export async function createExtractionPipeline(
  planUploadId: string,
  companyId: string,
  pageCount: number
): Promise<{ totalJobs: number; jobIds: string[] }>

// Creates per-page jobs (stages 1-8) with dependencies:
//   extract_vectors (no deps) -- L1 runs inline
//   classify_sheet (depends on extract_vectors)
//   detect_scale (depends on classify_sheet) -- L2 runs after
//   detect_elements (depends on detect_scale) -- L3, L4 run after
//   detect_rooms (depends on detect_elements) -- L3 room closure, L6 area methods
//   extract_schedules (depends on classify_sheet) -- parallel with geometry
//   extract_mep (depends on classify_sheet) -- parallel with geometry
//   calculate_quantities (depends on detect_rooms + extract_schedules) -- L6 cross-checks
//
// Plus 3 cross-page jobs:
//   cross_page_reconcile (depends on ALL page calculate_quantities) -- L5 runs here
//   validate (depends on cross_page_reconcile) -- L7 + L9; generates L8 prompts
//     If L8 micro-confirmations needed: status = 'awaiting_confirmation'
//     User responds → re-run validate → then generate_estimate
//   generate_estimate (depends on validate) -- L10 gate before writing results

export async function claimJob(workerId: string): Promise<ExtractionJob | null>
// Calls claim_extraction_job RPC

export async function heartbeat(jobId: string): Promise<void>
// UPDATE heartbeat_at = now()

export async function completeJob(jobId: string, result: unknown): Promise<void>
// UPDATE status = 'completed', result = $result, completed_at = now()

export async function failJob(jobId: string, error: string): Promise<void>
// UPDATE status = 'failed', error = $error
// If attempt >= max_attempts, status = 'dead_letter'
```

**Processing Loop (called from API route):**
```typescript
export async function processNextJob(workerId: string): Promise<boolean> {
  const job = await claimJob(workerId);
  if (!job) return false;

  const heartbeatInterval = setInterval(() => heartbeat(job.id), 15_000);

  try {
    const result = await executeStage(job);
    await completeJob(job.id, result);
  } catch (err) {
    await failJob(job.id, err instanceof Error ? err.message : 'Unknown error');
  } finally {
    clearInterval(heartbeatInterval);
  }
  return true;
}
```

### 5.8 Progress Tracker (`lib/extraction/progress-tracker.ts`)

**Purpose:** Client-side Supabase Realtime subscription for extraction progress.

```typescript
// Client-side hook (used in ExtractionProgress.tsx)
export function useExtractionProgress(planUploadId: string): ExtractionProgress

// Implementation:
// 1. Subscribe to extraction_jobs table via Supabase Realtime
//    channel.on('postgres_changes', { event: 'UPDATE',
//      schema: 'public', table: 'extraction_jobs',
//      filter: `plan_upload_id=eq.${planUploadId}` })
// 2. On each change, recompute progress from local state
// 3. Return { totalJobs, completedJobs, progressPct, currentStage, pageStatuses }
```

### 5.9 Normalize Bridge (`lib/extraction/normalize-bridge.ts`)

**Purpose:** Convert ExtractionResult into takeoff_items via existing normalizeTakeoffItem().

```typescript
export function extractionResultToTakeoffItems(
  result: ExtractionResult
): NormalizedTakeoffItem[]

// Mapping:
// result.rooms -> takeoff_items (category: "architectural", sub_type: "room")
// result.walls -> takeoff_items (category: "structural"|"architectural", sub_type: "wall")
//   construction_status carried through
// result.doors -> takeoff_items (category: "architectural", sub_type: "door")
// result.windows -> takeoff_items (category: "architectural", sub_type: "window")
// result.quantities.drywallSf -> takeoff_items (category: "architectural", sub_type: "drywall")
// result.quantities.flooringSf -> takeoff_items (category: "architectural", sub_type: "flooring")
// result.equipment -> takeoff_items with trade inferred from equipment type
// result.mep.electrical -> takeoff_items (category: "electrical")
// result.mep.plumbing -> takeoff_items (category: "plumbing")
// result.mep.hvac -> takeoff_items (category: "mechanical")
//
// All items get extraction_method: "vector", extraction_engine: "vector-engine-v1"
// confidence mapped from 0-100 scale to 0.00-1.00
```

---

## 6. API Endpoints

### 6.1 New: `POST /api/estimates/extract` (REQ-034)

**Purpose:** Primary extraction entry point replacing direct calls to `/api/estimates/parse`.

**Request:**
```typescript
{
  planUploadId: string;
  pageIds?: string[];     // optional, process specific pages
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    jobCount: number;
    planUploadId: string;
    engineMode: 'auto' | 'vector' | 'openai';
  }
}
```

**Flow:**
1. Auth check (session + company_id)
2. Read `EXTRACTION_ENGINE` env var (default: `auto`)
3. If `openai` mode: delegate to existing `/api/estimates/parse` logic
4. If `vector` or `auto` mode:
   a. Create extraction pipeline via `createExtractionPipeline()`
   b. Start processing loop (inline for serverless, or trigger edge function)
   c. Return job count for client to subscribe via Realtime

**Serverless Consideration:** Next.js API routes have a ~30s timeout on Vercel. For PDFs >10 pages, the processing loop runs jobs sequentially within the route. For larger PDFs, each job completes quickly (<2s per stage) so a 26-page PDF with ~210 jobs at ~1s average = ~3.5 minutes. This exceeds API route timeout.

**Solution:** Process in batches within the API route (first 10 pages), then use Supabase Edge Function or scheduled polling to continue. The worker queue design inherently supports this -- any process can call `claimJob()` to pick up remaining work.

### 6.2 Existing: `POST /api/estimates/parse` (unchanged)

Kept intact. Used when:
- `EXTRACTION_ENGINE=openai`
- Router sends raster pages to GPT-4o in `auto` mode
- Direct fallback

---

## 7. Accuracy Validation Framework (REQ-032)

> **Full specification:** `accuracy-framework.md` v1.0 (23 sections, ~2100 lines)
> This section summarizes the 10-layer validation architecture. Refer to the companion spec for pseudocode, edge cases, failure recovery, and AI integration roadmap.

### 7.1 Architecture: 10-Layer Validation Pipeline

The flat confidence scorer is replaced by a 10-layer validation architecture woven into the extraction pipeline:

```
[L1] Vector-First Extraction ---- extraction quality + CAD origin detection
[L2] Dimension Cross-Validation -- scale verification per dimension string
[L3] Geometry Constraint Solver -- wall graph integrity, closure, angles
[L4] Symbol Relationship Graph --- contextual validation (door-in-wall, etc.)
[L5] Cross-Sheet Reconciliation -- schedule vs geometry counts
[L6] Redundant Quantity Validation - area cross-check (3-5 methods)
[L7] Probabilistic Confidence Engine - weighted multi-evidence scoring
[L8] Human Micro-Confirmation --- 3-5 targeted yes/no prompts
[L9] Error Recovery & Auto-Correction - snap, merge, heal
[L10] Final Approval Gate -------- auto-approve / review / reject
```

**Integration with existing pipeline stages:**

| Existing Stage | Validation Layer(s) |
|---|---|
| `extract_vectors` (Stage 1) | L1 runs inline |
| `detect_scale` (Stage 3) | L2 runs after scale detection |
| `detect_elements` (Stage 4) | L3 + L4 run after geometry classification |
| `detect_rooms` (Stage 5) | L3 (room closure) + L6 (area cross-check) |
| `extract_schedules` (Stage 6) | L5 consumes schedule data |
| `calculate_quantities` (Stage 8) | L6 validates quantities |
| `cross_page_reconcile` (Stage 9) | L5 runs cross-sheet checks |
| `validate` (Stage 10 — NEW) | L7, L9 run; L8 prompts generated |
| `generate_estimate` (Stage 11) | L10 runs as approval gate |

### 7.2 Scoring Model (L7)

6-layer weighted evidence scoring replaces the flat 4-component scorer:

```
Layer weights:
  L1 (extraction quality):     0.05
  L2 (dimension validation):   0.20
  L3 (constraint satisfaction): 0.25
  L4 (relationship graph):     0.15
  L5 (cross-sheet match):      0.20
  L6 (quantity validation):    0.15

Category weights (for overall score):
  walls: 0.25 | rooms: 0.25 | doors: 0.15 | windows: 0.10
  quantities: 0.15 | schedules: 0.10
```

15 penalties (-3 to -20 points) and 8 bonuses (+5 to +10 points). See `accuracy-framework.md` Section 8 for full lists.

### 7.3 Thresholds (5-tier, up from 3)

| Score | Action |
|-------|--------|
| >= 90 | Auto-approved (subject to L10 gate) |
| 80-89 | Auto-approved with minor review flags |
| 60-79 | Requires review — show flags, highlight uncertain elements |
| 40-59 | Low confidence — trigger L8 micro-confirmation |
| < 40 | Rejected — recommend re-upload or manual takeoff |

### 7.4 L10 Approval Gate

```
AUTO_APPROVE if ALL:
  - overallConfidence >= 90
  - No critical review flags
  - Scale confirmed (L2 or L8)
  - Room count matches schedule (or no schedule)
  - No open room polygons after L9 corrections
  - Recovery rate > 80%

REVIEW_REQUIRED if ANY:
  - 60 <= overallConfidence < 90
  - Critical/warning review flags
  - Scale uncertain
  - Cross-sheet discrepancies (critical severity)

REJECTED if ANY:
  - overallConfidence < 40
  - Scale undetermined
  - >50% rooms have open polygons
  - >30% elements needed low-confidence corrections
```

### 7.5 Human Micro-Confirmation (L8)

Max 5 prompts, each answerable in <3 seconds. Card-based swipe UI with 44px touch targets.

| Confirmation Type | Confidence Boost |
|---|---|
| Scale confirmed | +15 all elements on page |
| Ceiling height confirmed | +10 all quantities |
| Door count confirmed | +10 all doors, +5 rooms |
| Room count confirmed | +10 all rooms |
| Wall type confirmed | +10 TI classification |
| Schedule match confirmed | +10 schedule-derived items |

### 7.6 Key Files

| File | Layer | Purpose |
|---|---|---|
| `validation/extraction-quality.ts` | L1 | CAD origin + quality metadata |
| `validation/dimension-validator.ts` | L2 | Scale cross-check via dimensions |
| `validation/constraint-solver.ts` | L3 | Wall graph, cycle detection, auto-repair |
| `validation/relationship-graph.ts` | L4 | Element context validation |
| `validation/cross-sheet-reconciler.ts` | L5 | Schedule vs geometry reconciliation |
| `validation/quantity-validator.ts` | L6 | Multi-method area cross-check |
| `validation/confidence-engine.ts` | L7 | Weighted evidence scoring (replaces `confidence-scorer.ts`) |
| `validation/micro-confirmation.ts` | L8 | Prompt selection + confidence boost |
| `validation/error-recovery.ts` | L9 | Auto-correction with audit trail |
| `validation/approval-gate.ts` | L10 | Final approve/review/reject decision |
| `components/estimates/MicroConfirmation.tsx` | L8 | Card-based confirmation UI |

---

## 8. Existing Code Changes (Bug Fixes + Enhancements)

### 8.1 Fix `approveEstimate()` (REQ-001)

**File:** `app/actions/estimates.ts`
```typescript
// Change: if (context.role !== "admin")
// To:     if (context.role !== "admin" && context.role !== "project_manager")
```

### 8.2 Fix Cache Cost Logging (REQ-002)

**File:** `app/api/estimates/parse/route.ts`
```typescript
// On cache hit, set: cost = 0
```

### 8.3 Fix N+1 in `applyPricingTemplate()` (REQ-003)

**File:** `app/actions/pricing-templates.ts`
```typescript
// Replace: for loop with individual UPDATEs
// With: Promise.all(updates.map(u => supabase.from(...).update(u.data).eq('id', u.id)))
```

### 8.4 Expand Trade Mappings (REQ-004)

**File:** `lib/ai/normalize-takeoff.ts`
- Add 22 new entries to `TRADE_MAPPING`
- Add 14 new keyword fallbacks in `inferTrade()`
- See requirements for full list

### 8.5 Expand Waste Factors (REQ-005)

**File:** `lib/ai/normalize-takeoff.ts`
- Add 14 new entries to `WASTE_FACTORS`

### 8.6 AI Prompt Enhancements (REQ-006, REQ-007, REQ-008)

**File:** `lib/ai/parse-prompt.ts`
- Add `room_context: z.string().optional()` to TakeoffItemSchema
- Change `page_type` to strict enum
- Increase `max_tokens` from 2000 to 4000

---

## 9. Server Actions (New + Modified)

### 9.1 New Server Actions

| Action | File | REQ |
|--------|------|-----|
| `duplicateEstimate(estimateId)` | `app/actions/estimates.ts` | REQ-009A |
| `deleteEstimate(estimateId)` | `app/actions/estimates.ts` | REQ-009B |
| `getAiUsage(companyId)` | `app/actions/estimates.ts` | REQ-009C |
| `bulkAcceptTakeoffItems(planUploadId, itemIds[])` | `app/actions/estimates.ts` | REQ-010 |
| `bulkRejectTakeoffItems(planUploadId, itemIds[])` | `app/actions/estimates.ts` | REQ-010 |
| `suggestMaterialsForLineItem({trade, category, subType})` | `app/actions/material-suggestions.ts` | REQ-023A |
| `bulkMatchMaterialsToTakeoffItems(planUploadId)` | `app/actions/material-suggestions.ts` | REQ-023B |
| `checkEstimatePriceStaleness(estimateId, threshold?)` | `app/actions/material-suggestions.ts` | REQ-025 |
| `createMaterialAssignmentsFromEstimate(estimateId)` | `app/actions/estimate-to-procurement.ts` | REQ-024 |

### 9.2 Modified Server Actions

| Action | Change | REQ |
|--------|--------|-----|
| `createEstimate()` | Accept optional `materialId` per line item | REQ-011 |
| `getEstimate()` | LEFT JOIN materials for material details | REQ-011 |
| `approveEstimate()` | Allow PM role | REQ-001 |

### 9.3 New Utility Module

**File:** `lib/materials/category-mapping.ts` (REQ-022)
```typescript
export function getMaterialCategoriesForTrade(trade: string): MaterialCategory[]
export function scoreMaterialRelevance(materialName: string, subType: string): number
```

---

## 10. Component Architecture (Frontend)

### 10.1 New Component: `ExtractionProgress` (REQ-036)

```typescript
// components/estimates/ExtractionProgress.tsx
interface ExtractionProgressProps {
  planUploadId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

// Uses useExtractionProgress() hook from progress-tracker.ts
// Displays:
//   - Overall progress bar (completed/total jobs)
//   - Current stage name
//   - Per-page status grid (pending/processing/completed/failed)
//   - ETA based on average job duration
//   - Retry button for failed jobs
//   - Cancel button
// Replaces current polling-based ParseProgressOverlay when vector engine active
```

### 10.2 New Component: `MicroConfirmation` (Accuracy Framework L8)

```typescript
// components/estimates/MicroConfirmation.tsx
interface MicroConfirmationProps {
  confirmations: MicroConfirmation[];
  planPages: { pageNumber: number; imageUrl: string }[];
  onSubmit: (results: MicroConfirmationResult[]) => void;
  onSkip: () => void;
}

// Card-based swipe interface:
// - Plan region image with highlighted elements
// - Simple yes/no/choice question
// - 44px touch-friendly buttons
// - "Skip" always available
// - Confidence updates in real-time after each answer
// - Max 5 cards
```

### 10.3 Modified Components

| Component | Changes for v2.3 |
|-----------|-----------------|
| `EstimatesTabClient` | Route to `/api/estimates/extract` instead of `/api/estimates/parse` when vector engine enabled |
| `ParseProgressOverlay` | Conditionally render `ExtractionProgress` for vector engine, keep existing for GPT-4o |
| `TakeoffReviewScreenContent` | Display `construction_status` badge on wall items; show `extraction_engine` indicator |
| `CostEditor` | Add "Auto-Match Materials" button, per-row "Link Material" button |
| `EstimateSummary` | Add StalePriceWarning banner, "Create Procurement Orders" button |

### 10.4 Materials UI Components (REQ-026)

See existing design.md v2.0 Section 5a items 9-12 for:
- `MaterialSuggestionPicker` (REQ-026A)
- `MaterialMatchConfirmModal` (REQ-026B)
- `LinkedMaterialBadge` (REQ-026C)
- `StalePriceWarning` (REQ-026D)

These remain unchanged from v2.0 design.

---

## 11. Error Handling Strategy

### 11.1 Extraction Pipeline Errors

| Error Type | Handling | Recovery |
|------------|----------|----------|
| PDF parse failure (corrupt file) | Job fails immediately, no retry | User re-uploads |
| pdfjs-dist OOM (huge page) | Job fails, retries with reduced ops limit | 3 retries then dead_letter |
| Scale detection fails all 6 methods | `scale: null`, `requires_calibration: true` | User provides calibration (REQ-029G) |
| Rule engine misclassification | Confidence score < 70, flagged for review | Human review corrects |
| Worker heartbeat timeout (60s) | Job reset to pending, re-claimable | Auto-retry up to 3 times |
| All retries exhausted | Job moved to `dead_letter` | Admin review, manual re-run |
| Raster page in `vector` mode | Returns error for that page | User switches to `auto` mode |

### 11.2 Error Response Format

All extraction errors follow existing pattern:
```typescript
{ success: false, error: "Human-readable message" }
```

Toast notifications for all user-facing errors. Console logging for debugging.

---

## 12. Testing Strategy

### 12.1 Unit Tests (per module)

| Module | Test Focus |
|--------|------------|
| `vector-parser.ts` | Mock pdfjs-dist getOperatorList, verify primitive extraction |
| `page-classifier.ts` | Image area % thresholds, sheet title patterns |
| `hatch-filter.ts` | Parallel line detection at consistent spacing |
| `scale-detector.ts` | Each of 6 cascade methods with known inputs |
| `wall-rules.ts` | Parallel pair (3-12" spacing), filled rect, thick line, curved |
| `door-rules.ts` | Arc sweep angles, polyline arcs, pocket/sliding/bifold/overhead |
| `window-rules.ts` | Thin rect in wall, curtain wall bands |
| `room-detector.ts` | Cycle detection, Shoelace formula, point-in-polygon |
| `confidence-scorer.ts` | Scoring components, penalties, threshold behavior |
| `schedule-parser.ts` | Table grid detection, cell text extraction |
| `quantity-calculator.ts` | Drywall (both sides), TI filtering, area/perimeter formulas |

### 12.2 Integration Tests

- **Full pipeline test:** Sample CAD-exported PDF -> complete ExtractionResult
- **Raster fallback test:** Scanned PDF -> GPT-4o routing
- **Mixed PDF test:** Vector + raster pages -> correct routing per page
- **Worker queue test:** Create pipeline, claim jobs, verify dependency ordering
- **Real plan validation:** 140 W Valley Blvd test plan -> accuracy metrics

### 12.3 Test Data

- Synthetic vector PDFs with known geometry (for unit tests)
- Real commercial TI plan (140 W Valley Blvd, 26 pages) for integration tests
- Scanned residential plan for raster fallback testing

---

## 13. Performance Targets

| Metric | Target | Design Decision |
|--------|--------|-----------------|
| Vector extraction per page | <2s | pdfjs-dist getOperatorList is CPU-bound parsing, no rendering |
| Geometry classification per page | <1s | Rule evaluation is O(n) over elements, spatial indexing for intersections |
| Scale detection per page | <500ms | Regex matching + simple geometry |
| Schedule extraction per page | <1s | Grid detection + text extraction |
| MEP symbol counting per page | <1.5s | Pattern matching over elements |
| **Validation overhead per page** | **~1.5s** | L1:50ms + L2:200ms + L3:500ms + L4:300ms + L6:200ms |
| **Validation overhead total** | **~1.5s** | L5:1s + L7:100ms + L9:300ms + L10:50ms |
| Full pipeline (10 pages) | <45s | 8 stages x 10 pages x ~0.3s avg + validation |
| Full pipeline (26 pages, commercial TI) | <100s | With validation (~67% overhead for near-perfect accuracy) |
| Worker queue claim latency | <100ms | SKIP LOCKED is O(1) on indexed column |
| Realtime progress update | <500ms | Supabase Realtime WebSocket push |

---

## 14. Implementation Sequence (Aligned with Requirements Tiers)

### Tier 1: MVP (REQ-027A-E, 028A-B, 029A-D, 032, 034)

| Task | File | Scope | Days |
|------|------|-------|------|
| T1.1 | `lib/extraction/types.ts` | Core type definitions | 0.5 |
| T1.2 | `lib/extraction/vector-parser.ts` | pdfjs-dist getOperatorList wrapper | 2 |
| T1.3 | `lib/extraction/page-classifier.ts` | Raster/vector/mixed detection | 1 |
| T1.4 | `lib/extraction/hatch-filter.ts` | Hatch + dimension line filtering | 1 |
| T1.5 | `lib/extraction/text-clusterer.ts` | Spatial text clustering | 1 |
| T1.6 | `lib/extraction/scale-detector.ts` | Priorities 1-4 (metadata, title block, scale bar, dimensions) | 2 |
| T1.7 | `lib/extraction/rules/wall-rules.ts` | 4 wall rules + TI classification | 2 |
| T1.8 | `lib/extraction/rules/door-rules.ts` | 7 door detection rules | 1.5 |
| T1.9 | `lib/extraction/geometry-classifier.ts` | Rule orchestration | 1 |
| T1.10 | `lib/extraction/confidence-scorer.ts` | Scoring + review flags | 1 |
| T1.11 | `lib/extraction/extraction-router.ts` | Auto/vector/openai routing | 1 |
| T1.12 | `app/api/estimates/extract/route.ts` | New API endpoint | 1 |
| T1.13 | `lib/extraction/normalize-bridge.ts` | ExtractionResult -> takeoff_items | 1 |
| **Subtotal** | | | **16 days** |

### Tier 2: Core (REQ-028C-D, 029E-G, 031, 033)

| Task | File | Scope | Days |
|------|------|-------|------|
| T2.1 | `lib/extraction/rules/window-rules.ts` | 2 window rules + schedule cross-ref | 1 |
| T2.2 | `lib/extraction/room-detector.ts` | Wall-graph cycles + point-in-polygon | 2 |
| T2.3 | `lib/extraction/scale-detector.ts` | Priorities 5-6 (sheet size, multi-scale) | 1 |
| T2.4 | `lib/extraction/quantity-calculator.ts` | Drywall/flooring/baseboard/ceiling | 1.5 |
| T2.5 | `lib/extraction/result-assembler.ts` | Full ExtractionResult assembly | 1 |
| **Subtotal** | | | **6.5 days** |

### Tier 3: Infrastructure (REQ-030, 035, 036, 038)

| Task | File | Scope | Days |
|------|------|-------|------|
| T3.1 | Migration: extraction_jobs | Database + RPC functions | 0.5 |
| T3.2 | `lib/extraction/worker-queue.ts` | Job CRUD, claim, heartbeat | 2 |
| T3.3 | `lib/extraction/progress-tracker.ts` | Supabase Realtime hook | 1 |
| T3.4 | `components/estimates/ExtractionProgress.tsx` | Progress UI | 1 |
| T3.5 | `lib/extraction/rules/ceiling-rules.ts` | RCP grid/fixture detection | 1 |
| T3.6 | `lib/extraction/schedule-parser.ts` | Table detection + cell extraction | 2 |
| T3.7 | `lib/extraction/rules/schedule-rules.ts` | Table type classification | 1 |
| **Subtotal** | | | **8.5 days** |

### Tier 4: Schedules & Finishes (REQ-038B-E, 039)

| Task | File | Scope | Days |
|------|------|-------|------|
| T4.1 | Schedule-parser extensions | Equipment/door/fixture/panel parsers | 3 |
| T4.2 | `lib/extraction/rules/finish-rules.ts` | Finish abbreviation decoding + room mapping | 1.5 |
| **Subtotal** | | | **4.5 days** |

### Tier 5: MEP (REQ-040, 041, 042)

| Task | File | Scope | Days |
|------|------|-------|------|
| T5.1 | `lib/extraction/rules/electrical-rules.ts` | Power plan + lighting counting | 2 |
| T5.2 | `lib/extraction/rules/plumbing-rules.ts` | Fixture schedule + symbol counting | 1.5 |
| T5.3 | `lib/extraction/rules/hvac-rules.ts` | Equipment + duct measurement | 2 |
| **Subtotal** | | | **5.5 days** |

### Tier 6: Expansion (REQ-037, 029F)

| Task | File | Scope | Days |
|------|------|-------|------|
| T6.1 | `lib/extraction/rules/stair-rules.ts` | Stair detection | 1 |
| T6.2 | `lib/extraction/rules/column-rules.ts` | Column grid detection | 0.5 |
| T6.3 | `lib/extraction/rules/elevator-rules.ts` | Elevator detection | 0.5 |
| **Subtotal** | | | **2 days** |

### Tier 7: Accuracy Validation Framework (accuracy-framework.md)

| Task | File | Scope | Days |
|------|------|-------|------|
| V7.1 | `lib/extraction/validation/types.ts` | Shared validation types | 0.5 |
| V7.2 | `lib/extraction/validation/extraction-quality.ts` | L1: extraction quality + CAD origin | 1 |
| V7.3 | `lib/extraction/validation/dimension-validator.ts` | L2: dimension cross-validation | 2 |
| V7.4 | `lib/extraction/validation/constraint-solver.ts` | L3: wall graph + cycle detection + auto-repair | 3 |
| V7.5 | `lib/extraction/validation/relationship-graph.ts` | L4: symbol relationship validation | 1.5 |
| V7.6 | `lib/extraction/validation/cross-sheet-reconciler.ts` | L5: schedule vs geometry reconciliation | 2 |
| V7.7 | `lib/extraction/validation/quantity-validator.ts` | L6: multi-method area cross-check | 1.5 |
| V7.8 | `lib/extraction/validation/confidence-engine.ts` | L7: weighted evidence scoring (replaces confidence-scorer) | 1.5 |
| V7.9 | `lib/extraction/validation/micro-confirmation.ts` | L8: prompt selection + confidence boost | 1 |
| V7.10 | `components/estimates/MicroConfirmation.tsx` | L8: card-based confirmation UI | 1.5 |
| V7.11 | `lib/extraction/validation/error-recovery.ts` | L9: auto-correction engine | 1.5 |
| V7.12 | `lib/extraction/validation/approval-gate.ts` | L10: final gate logic | 0.5 |
| V7.13 | Migrations 5-8 | DB tables + stage/status updates | 0.5 |
| V7.14 | Integration: wire validate stage into worker-queue.ts | Pipeline integration | 1 |
| **Subtotal** | | | **19.5 days** |

### Bug Fixes + Backend Enhancements (REQ-001-011, 022-025)

| Task | File | Scope | Days |
|------|------|-------|------|
| B0.1-0.3 | Bug fixes (REQ-001, 002, 003) | 3 one-line fixes | 0.5 |
| B1.1-1.2 | Trade/waste expansion (REQ-004, 005) | normalize-takeoff.ts | 0.5 |
| B1.3-1.5 | AI prompt (REQ-006, 007, 008) | parse-prompt.ts | 0.5 |
| B1.6 | Migration: plan_pages + material_id + takeoff metadata | 3 migrations | 0.5 |
| B1.7-1.10 | New server actions (REQ-009, 010) | estimates.ts | 1 |
| B1.11 | createEstimate + getEstimate material join (REQ-011) | estimates.ts | 0.5 |
| B1.12 | Category mapping utility (REQ-022) | category-mapping.ts | 0.5 |
| B1.13 | Material suggestion actions (REQ-023, 025) | material-suggestions.ts | 1 |
| B1.14 | Procurement bridge (REQ-024) | estimate-to-procurement.ts | 0.5 |
| **Subtotal** | | | **5.5 days** |

### Frontend (REQ-012-018, 026, 036)

| Task | Scope | Days |
|------|-------|------|
| F1 | Wire CostEditor + materials integration | 2 |
| F2 | Wire EstimateSummary + stale prices + procurement | 1 |
| F3 | Wire PricingTemplateModal + SaveTemplateModal | 1 |
| F4 | Wire AddManualItemModal + AiBudgetBanner + HistoryList | 1 |
| F5 | Materials UI (4 components: REQ-026A-D) | 2 |
| F6 | ExtractionProgress component (REQ-036) | 1 |
| F7 | Integration: EstimatesTabClient routing to new extract endpoint | 1 |
| **Subtotal** | | **9 days** |

### Grand Total

| Phase | Days |
|-------|------|
| Tier 1: MVP | 16 |
| Tier 2: Core | 6.5 |
| Tier 3: Infrastructure | 8.5 |
| Tier 4: Schedules | 4.5 |
| Tier 5: MEP | 5.5 |
| Tier 6: Expansion | 2 |
| Tier 7: Accuracy Validation | 19.5 |
| Bug fixes + backend | 5.5 |
| Frontend | 9 |
| Integration testing | 3 |
| **Total** | **80 days** |

---

## 15. Security Considerations

- All API routes and server actions call `getUserContext()` / auth check
- All queries include `company_id` filter (app code + RLS)
- `extraction_jobs` has RLS: company members can SELECT only, mutations via admin client
- Worker queue functions are `SECURITY DEFINER` with locked `search_path`
- PDF parsing runs server-side only (no client-side pdfjs-dist)
- Vector engine logs `cost: 0` -- no billing leakage
- Feature flag (`EXTRACTION_ENGINE`) is server-side env var, not client-accessible
- File uploads already validate MIME type + size (<25MB)

---

## 16. Dependencies

### Existing (no new installs for Tier 1-2)

| Package | Version | Purpose |
|---------|---------|---------|
| `pdfjs-dist` | 5.4.624 | Already installed; getOperatorList API for vector extraction |

### Future Tiers (if needed)

| Package | Purpose | When |
|---------|---------|------|
| None anticipated | Rule engine is pure TypeScript computation | -- |

The vector extraction engine is entirely CPU-bound TypeScript. No new npm dependencies required for the extraction pipeline itself.

---

**Status:** PENDING APPROVAL
**Version:** 2.4 (integrated accuracy validation framework)
**Approval Required:** Yes -- approve both `design.md` v2.4 and `accuracy-framework.md` v1.0 before proceeding to `tasks.md`
