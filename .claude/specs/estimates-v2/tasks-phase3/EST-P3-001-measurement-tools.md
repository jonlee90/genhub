# EST-P3-001: On-Plan Measurement Tools

**Parent Task:** `EST-P3-001` in `tasks-phase3-phase4.md`
**Priority:** P2 - Future
**Total Effort:** ~4 days
**Dependencies:** EST-P1-009 (PlanOverlayLayer must be complete)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P3-001-A | Database migration | backend-engineer | 0.5d | — |
| P3-001-B | Server actions | backend-engineer | 0.5d | P3-001-A |
| P3-001-C | Geometry utilities | frontend-engineer | 0.5d | — |
| P3-001-D | Area + Linear tools | frontend-engineer | 1.0d | P3-001-C |
| P3-001-E | Count + Scale wizard | frontend-engineer | 1.0d | P3-001-C |
| P3-001-F | Toolbar + PlanViewer wire-up | frontend-engineer | 0.5d | P3-001-B, P3-001-D, P3-001-E |

---

## P3-001-A: Database Migration

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_plan_measurements.sql`

**Task:**
Create the `plan_measurements` table with indexes and RLS.

```sql
CREATE TABLE public.plan_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id UUID NOT NULL REFERENCES plan_uploads(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('area', 'linear', 'count')),
  points JSONB NOT NULL, -- [{ x, y }]
  scale_ratio NUMERIC(10,4),
  result_value NUMERIC(12,2),
  result_unit TEXT,
  takeoff_item_id UUID REFERENCES takeoff_items(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_measurements_upload ON plan_measurements(plan_upload_id);
CREATE INDEX idx_plan_measurements_page ON plan_measurements(plan_upload_id, page_number);
```

RLS: company_id-scoped SELECT/INSERT/UPDATE/DELETE for authenticated users.

**Acceptance Criteria:**
- [x] Migration runs without errors
- [x] RLS blocks cross-company access (SELECT + INSERT + UPDATE + DELETE policies via 20260216000008 follow-up migration)
- [ ] `npm run db:gen-types` produces updated types (pending — run after applying migrations)

---

## P3-001-B: Server Actions

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P3-001-A

**Files:**
- `app/actions/estimates.ts` (add to existing file)

**Task:**
Add three server actions for measurement persistence.

```typescript
// Signatures
saveMeasurement(data: {
  planUploadId: string
  pageNumber: number
  type: 'area' | 'linear' | 'count'
  points: Array<{ x: number; y: number }>
  scaleRatio?: number
  resultValue: number
  resultUnit: string
  takeoffItemId?: string
}): Promise<{ data: PlanMeasurement | null; error: string | null }>

updateMeasurement(id: string, data: Partial<...>): Promise<{ ... }>

deleteMeasurement(id: string): Promise<{ error: string | null }>

getMeasurements(planUploadId: string, pageNumber: number): Promise<{ data: PlanMeasurement[]; error: string | null }>

calibratePlanScale(planUploadId: string, scaleRatio: number): Promise<{ error: string | null }>
```

**Acceptance Criteria:**
- [x] All actions validate auth and company_id
- [x] `saveMeasurement` returns created record
- [x] `getMeasurements` returns all for given page
- [x] No direct Supabase in client components

---

## P3-001-C: Geometry Utilities

**Agent:** frontend-engineer
**Effort:** 0.5 days

**Files:**
- `lib/measurements/geometry.ts` (new)
- `lib/measurements/plan-scale.ts` (new)

**Task:**
Pure utility functions — no React, no side effects.

```typescript
// geometry.ts
export function calculatePolygonArea(points: Point[]): number  // Shoelace formula
export function calculatePolylineLength(points: Point[]): number  // Sum of segment lengths
export function pointDistance(a: Point, b: Point): number
export function scalePixelsToFeet(pixels: number, scaleRatio: number): number

// plan-scale.ts
export function deriveScaleRatio(drawnPixels: number, realWorldFeet: number): number
export function formatMeasurement(value: number, unit: string): string
```

**Acceptance Criteria:**
- [x] Shoelace formula matches known test polygon areas
- [x] `calculatePolylineLength` sums correctly for multi-segment lines
- [x] `deriveScaleRatio` returns pixels-per-foot correctly
- [x] All functions are pure (no side effects)

---

## P3-001-D: Area + Linear Measurement Tools

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-001-C

**Files:**
- `components/estimates/AreaMeasurementTool.tsx` (new)
- `components/estimates/LinearMeasurementTool.tsx` (new)

**Task:**
SVG-based interactive tools rendered inside PlanViewer's overlay canvas.

```typescript
// Props interface (both tools share similar shape)
interface MeasurementToolProps {
  scaleRatio: number
  onComplete: (points: Point[], result: { value: number; unit: string }) => void
  onCancel: () => void
}
```

- Area tool: click to place polygon points, double-click to close, SVG `<polygon>`
- Linear tool: click to place polyline points, double-click to finish, SVG `<polyline>`
- Both: show live measurement label while drawing
- Undo last point on backspace/right-click
- Touch: single tap places point, two-finger gesture does NOT place point

**Skills Applied:**
- `rerender-memo` — memoize SVG path rendering
- `rendering-hoist-jsx` — static SVG defs outside render
- `bundle-barrel-imports` — direct Lucide icon imports

**Mobile Checks:**
- [x] 44px hit area on control points
- [x] `active:` states on toolbar buttons
- [x] Two-finger zoom does not trigger measurement

**Acceptance Criteria:**
- [x] Polygon closes correctly on double-click (phantom point bug fixed with 220ms click timer)
- [x] Area label updates live while drawing
- [x] Undo removes last placed point
- [x] `onComplete` fires with correct points array and calculated result

---

## P3-001-E: Count Tool + Scale Calibration Wizard

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-001-C

**Files:**
- `components/estimates/CountMeasurementTool.tsx` (new)
- `components/estimates/ScaleCalibrationWizard.tsx` (new)

**Task:**

**Count tool:**
- Single tap places numbered SVG `<circle>` markers
- Auto-incrementing counter label
- Tap existing marker to remove it
- `onComplete` fires with markers array + count result

**Scale calibration wizard (3 steps):**
1. "Draw a line on a known dimension" — user draws linear segment
2. "Enter the real-world length" — numeric input in feet/inches
3. Confirm: shows "1 inch = X pixels" summary, Save button

```typescript
interface ScaleCalibrationWizardProps {
  planUploadId: string
  onComplete: (scaleRatio: number) => void
  onCancel: () => void
}
```

Use `ResponsiveModal` for the wizard. Never raw `<Dialog>`.

**Skills Applied:**
- `rendering-conditional-render` — ternary for step visibility
- `async-defer-await` — defer save until wizard confirmed

**Acceptance Criteria:**
- [x] Count increments correctly on each tap
- [x] Removing a marker re-numbers remaining markers
- [x] Wizard 3 steps flow correctly
- [x] `calibratePlanScale` server action called on wizard completion
- [x] Uses `ResponsiveModal` (not raw Dialog)

---

## P3-001-F: PlanMeasurementTools Toolbar + PlanViewer Integration

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-001-B, P3-001-D, P3-001-E

**Files:**
- `components/estimates/PlanMeasurementTools.tsx` (new — toolbar wrapper)
- `components/estimates/PlanViewer.tsx` (modified — add measurement mode)

**Task:**

`PlanMeasurementTools`: Fixed bottom-left FAB that opens tool palette with 4 modes:
- `select` (Move icon) — default, no measurement active
- `area` (Ruler icon)
- `linear` (Minus icon)
- `count` (Hash icon)
- `scale` button to trigger `ScaleCalibrationWizard`

`PlanViewer.tsx` changes:
- Accept `measurementMode` prop
- Render active tool component as SVG overlay
- On tool `onComplete`: call `saveMeasurement` server action, show persisted measurements

```typescript
type MeasurementMode = 'select' | 'area' | 'linear' | 'count'
```

**Mobile Checks:**
- [x] FAB is `min-h-[44px] min-w-[44px]`
- [x] `pb-[env(safe-area-inset-bottom)]` on FAB container
- [x] `active:scale-95` on tool buttons
- [x] `dark:` variants on palette background

**Acceptance Criteria:**
- [x] Switching modes cleanly unmounts/mounts tool
- [x] Completed measurements persist and re-render on page load (getMeasurements on load, rendered as static SVG overlay)
- [x] `PlanViewer` passes scale ratio from plan metadata to tools
- [x] Build passes with no TS errors (0 errors in all new/modified files)

**Implemented:** 2026-02-16
