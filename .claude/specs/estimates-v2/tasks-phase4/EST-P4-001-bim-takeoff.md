# EST-P4-001: 3D Model Takeoff (BIM Integration)

**Parent Task:** `EST-P4-001` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~7.5 days
**Dependencies:** EST-P3-001 (measurement tools infrastructure helpful but not blocking)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-001-A | Database migrations | backend-engineer | 0.5d | — |
| P4-001-B | BIM upload API route | backend-engineer | 1.0d | P4-001-A |
| P4-001-C | IFC parser library | backend-engineer | 1.0d | — |
| P4-001-D | Quantity calculator | backend-engineer | 1.0d | P4-001-C |
| P4-001-E | BimViewer 3D component | frontend-engineer | 2.0d | P4-001-A |
| P4-001-F | BimElementPicker component | frontend-engineer | 1.0d | P4-001-E |
| P4-001-G | PlanUploadPanel IFC option | frontend-engineer | 0.5d | P4-001-B |

---

## P4-001-A: Database Migrations

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_bim_models.sql`

**Task:**
```sql
CREATE TABLE public.bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,              -- Supabase Storage path
  file_size_bytes BIGINT,
  ifc_schema_version TEXT,             -- IFC2X3, IFC4, etc.
  element_count INTEGER,
  parse_status TEXT DEFAULT 'pending'
    CHECK (parse_status IN ('pending', 'processing', 'complete', 'error')),
  parse_error TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bim_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bim_model_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  ifc_guid TEXT NOT NULL,
  element_type TEXT NOT NULL,          -- IfcWall, IfcSlab, IfcDoor, IfcWindow
  element_name TEXT,
  material_name TEXT,
  quantity_type TEXT,                  -- area, volume, count
  quantity_value NUMERIC(12,3),
  quantity_unit TEXT,
  properties JSONB DEFAULT '{}',
  takeoff_item_id UUID REFERENCES takeoff_items(id) ON DELETE SET NULL
);

CREATE INDEX idx_bim_models_estimate ON bim_models(estimate_id);
CREATE INDEX idx_bim_elements_model ON bim_elements(bim_model_id);
CREATE INDEX idx_bim_elements_type ON bim_elements(bim_model_id, element_type);
```

RLS: company_id-scoped for all operations.

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] RLS enforces company isolation
- [ ] `npm run db:gen-types` updated

---

## P4-001-B: BIM Upload API Route

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-001-A

**Files:**
- `app/api/estimates/bim-upload/route.ts` (new)

**Task:**
Multipart upload handler for `.ifc` files.

```typescript
// POST /api/estimates/bim-upload
// FormData: { file: File, estimateId: string }
// Returns: { modelId: string } or { error: string }
```

Flow:
1. Validate auth + company_id
2. Validate file type (`.ifc` only, max 100MB)
3. Upload to Supabase Storage: `bim-models/{company_id}/{estimateId}/{filename}`
4. Insert `bim_models` record with `parse_status: 'pending'`
5. Trigger background parse (or return modelId and parse in next request)
6. Return `{ modelId }`

Note: Revit `.rvt` conversion requires Autodesk Forge API (out of scope for v1 — only IFC supported).

**Acceptance Criteria:**
- [ ] Rejects non-IFC files with 400 error
- [ ] Rejects files >100MB
- [ ] Stores file in correct Storage path
- [ ] Returns `modelId` for polling parse status

---

## P4-001-C: IFC Parser Library

**Agent:** backend-engineer
**Effort:** 1.0 days

**Files:**
- `lib/bim/ifc-parser.ts` (new)

**Task:**
Server-side IFC parsing using `web-ifc` (must be dynamically imported — ~500KB).

```typescript
export interface ParsedElement {
  ifcGuid: string
  elementType: 'IfcWall' | 'IfcSlab' | 'IfcDoor' | 'IfcWindow' | 'IfcSpace' | string
  name?: string
  material?: string
  geometry?: {
    vertices: Float32Array
    indices: Uint32Array
  }
  properties: Record<string, unknown>
}

export async function parseIFCFile(fileBuffer: ArrayBuffer): Promise<ParsedElement[]>
export async function extractElementTypes(fileBuffer: ArrayBuffer): Promise<Record<string, number>>
// Returns { IfcWall: 42, IfcDoor: 8, ... }
```

Implementation notes:
- `const { IfcAPI } = await import('web-ifc')`
- Extract: `IfcWall`, `IfcSlab`, `IfcDoor`, `IfcWindow`, `IfcSpace`
- For each element: get GUID via `IfcGloballyUniqueId`, name via `IfcLabel`
- Material: traverse `IfcRelAssociatesMaterial`
- Return geometry only if caller requests it (expensive)

**Acceptance Criteria:**
- [ ] Parses a sample IFC2X3 file and returns correct element counts
- [ ] Material extraction works for common material assignment types
- [ ] Dynamic import — not loaded in initial bundle
- [ ] Memory: call `ifcApi.CloseModel()` after parsing

---

## P4-001-D: Quantity Calculator

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-001-C

**Files:**
- `lib/bim/quantity-calculator.ts` (new)

**Task:**
Calculate quantities from parsed IFC elements and save to `bim_elements` table.

```typescript
export interface ElementQuantity {
  ifcGuid: string
  elementType: string
  quantityType: 'area' | 'volume' | 'count'
  quantityValue: number
  quantityUnit: string  // 'sqft', 'cuft', 'each'
}

export function calculateElementQuantity(element: ParsedElement): ElementQuantity

export async function processAndSaveElements(
  modelId: string,
  elements: ParsedElement[],
  companyId: string
): Promise<{ saved: number; errors: string[] }>
```

Calculation rules:
- `IfcWall`: area (length × height) in sqft — parse from `IfcQuantityArea` or geometry bounds
- `IfcSlab`: volume (area × thickness) in cuft — parse from `IfcQuantityVolume`
- `IfcDoor`, `IfcWindow`: count = 1 each
- `IfcSpace`: area from `IfcQuantityArea`

Prefer `IfcElementQuantity` property sets when available; fall back to bounding box estimation.

**Acceptance Criteria:**
- [ ] Wall area matches reference IFC viewer for test file
- [ ] Slab volume within ±5% of reference calculation
- [ ] Counts correct for doors/windows
- [ ] Saves all elements to `bim_elements` in batch (single INSERT)

---

## P4-001-E: BimViewer 3D Component

**Agent:** frontend-engineer
**Effort:** 2.0 days
**Depends on:** P4-001-A

**Files:**
- `components/estimates/BimViewer.tsx` (new)

**Task:**
Three.js-based 3D viewer. Both `three` and `web-ifc` must be loaded via `next/dynamic`.

```typescript
interface BimViewerProps {
  modelId: string
  companyId: string
  onElementSelect: (element: BimElement) => void
}
```

Viewer setup:
- `THREE.WebGLRenderer` with antialias, attached to a `<canvas>` ref
- `THREE.OrbitControls` for orbit, pan, zoom
- Camera: perspective, `fov: 60`, positioned at `(0, 10, 20)`
- Ambient light + directional light
- Load geometry from `bim_elements` or re-parse IFC file from Storage URL

Interaction:
- Raycaster on mouse click/tap to pick elements
- Highlight selected element: swap material to highlighted color
- Show tooltip on hover: element type + name

Loading state:
- Progress bar while parsing IFC
- "Model contains X elements" after load

**Skills Applied:**
- `bundle-dynamic-imports` — `next/dynamic` for Three.js scene component
- `rerender-memo` — memo viewer to prevent re-mounting on parent re-render
- `rendering-conditional-render` — ternary for loading/error/viewer

**Mobile Checks:**
- [ ] Touch events for orbit (one-finger rotate, two-finger zoom)
- [ ] `min-h-[300px]` viewer height on mobile
- [ ] `active:` state on toolbar buttons

**Acceptance Criteria:**
- [ ] Model loads and renders within 5 seconds for a 10MB IFC
- [ ] OrbitControls work on both mouse and touch
- [ ] Element click triggers `onElementSelect` with correct element data
- [ ] Three.js and web-ifc NOT in initial bundle (confirm via build analysis)

---

## P4-001-F: BimElementPicker Component

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P4-001-E

**Files:**
- `components/estimates/BimElementPicker.tsx` (new)

**Task:**
Panel for browsing/searching IFC elements and creating takeoff items from them.

```typescript
interface BimElementPickerProps {
  modelId: string
  estimateId: string
  onTakeoffItemCreated: (item: TakeoffItem) => void
}
```

Features:
- Tree view: grouped by element type (IfcWall: 42, IfcDoor: 8, ...)
- Search/filter by element name or material
- Each element row: type icon + name + quantity badge
- "Add to Takeoff" button per element (calls `createTakeoffItemFromBimElement` server action)
- Bulk select: checkbox select multiple, "Add X items to Takeoff" bulk action
- Virtual scroll for large element lists (`content-visibility: auto`)

**Skills Applied:**
- `rendering-content-visibility` — virtual scroll for large element trees
- `bundle-barrel-imports` — direct Lucide icon imports
- `rerender-memo` — memo element rows

**Mobile Checks:**
- [ ] Element rows are `min-h-[44px]`
- [ ] Checkboxes have `aria-label`
- [ ] "Add to Takeoff" button is `min-h-[44px]`

**Acceptance Criteria:**
- [ ] Tree view renders correct element counts per type
- [ ] Search filters elements by name
- [ ] Single "Add to Takeoff" creates takeoff item with correct quantity
- [ ] Bulk add creates multiple items in one action
- [ ] Scrolls smoothly with 500+ elements

---

## P4-001-G: PlanUploadPanel IFC Option

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-001-B

**Files:**
- `components/estimates/PlanUploadPanel.tsx` (modified)

**Task:**
Add IFC upload option alongside existing PDF upload.

- New tab/toggle: "2D Plans (PDF)" | "3D Model (IFC)"
- IFC tab: file drop zone accepting `.ifc` only
- Upload via `POST /api/estimates/bim-upload`
- On success: show `<BimViewer>` + `<BimElementPicker>` (lazy loaded)
- File size limit: 100MB — show warning if exceeded before upload

**Mobile Checks:**
- [ ] Tab toggle buttons are `min-h-[44px]`
- [ ] Drop zone has clear visual feedback on drag
- [ ] `dark:` variants on drop zone border/bg

**Acceptance Criteria:**
- [ ] IFC file upload succeeds end-to-end
- [ ] BimViewer renders after successful upload
- [ ] Non-IFC files rejected with user-friendly error
- [ ] Build passes with no TS errors
