# Plan: Integrate Materials Module into Estimates v2

## Context

The Estimates module has a costing workflow where users manually enter `material_cost`, `labor_cost`, `equipment_cost` per line item. The Materials module has a rich company-wide catalog with real pricing from Home Depot API, price history, and procurement tracking. These modules are completely disconnected today — the upgrade-research spec (`.claude/specs/estimates-v2/upgrade-research.md`) already identifies this as Gap 6 (line 113).

**Goal**: Bridge estimates and materials so that real catalog pricing flows into estimates, and approved estimates feed into procurement.

---

## Phase 1: Schema Migration

**File**: `supabase/migrations/YYYYMMDD_add_material_id_to_estimate_line_items.sql`

```sql
ALTER TABLE public.estimate_line_items
ADD COLUMN material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

CREATE INDEX idx_eli_material_id ON public.estimate_line_items(material_id)
WHERE material_id IS NOT NULL;
```

Then run `npm run db:gen-types`.

---

## Phase 2: Trade → MaterialCategory Mapping Utility

**New file**: `lib/materials/category-mapping.ts`

Two mapping functions:
1. `getMaterialCategoriesForTrade(trade: string): MaterialCategory[]` — maps estimate trades (framing, drywall, concrete...) to material categories (lumber, drywall, concrete...)
2. `scoreMaterialRelevance(materialName: string, subType: string): number` — keyword scoring (0-100) to rank suggestions

Key mappings:
| Trade | MaterialCategory[] |
|-------|-------------------|
| framing | lumber, hardware |
| drywall | drywall, hardware |
| concrete | concrete |
| electrical | electrical, fixtures |
| plumbing | plumbing, fixtures |
| hvac | hvac, insulation |
| flooring | flooring |
| painting | paint |
| roofing | roofing |
| carpentry | lumber, hardware, doors_windows |

**Reuses**: Trade values from `lib/ai/normalize-takeoff.ts`, MaterialCategory enum from `types/db/tables/materials.ts`

---

## Phase 3: Material Suggestion Server Action

**New file**: `app/actions/material-suggestions.ts`

### `suggestMaterialsForLineItem({ trade, category, subType, limit?: 5 })`
1. Map trade → MaterialCategory[] via Phase 2 utility
2. Query `materials` WHERE `category IN (...)` AND `is_active = true` AND `company_id` matches
3. Score each by relevance to `subType`
4. Return top N: `{ material_id, product_name, unit_price, unit_of_measure, sku, product_image_url, relevance_score }`

### `bulkMatchMaterialsToTakeoffItems(planUploadId: string)`
1. Get accepted takeoff items via `getTakeoffItems(planUploadId, { reviewStatus: 'accepted' })`
2. Fetch all company materials once
3. For each takeoff item, find best matching material
4. Return: `{ takeoff_item_id, sub_type, suggested_material: { id, name, price, confidence } }[]`

---

## Phase 4: Update `createEstimate` to Accept material_id

**File**: `app/actions/estimates.ts`

- Add `materialId: z.string().uuid().optional()` to line item schema
- Pass `material_id: item.materialId || null` in the insert
- Update `getEstimate()` to join `materials` table when `material_id` is set (return product_name, unit_price, sku)

**File**: `types/db/tables/estimates.ts`

- Add `material_id?: string` to `EstimateLineItem`
- Add `EstimateLineItemWithMaterial` type extending with material details

---

## Phase 5: Estimate → Procurement Bridge

**New file**: `app/actions/estimate-to-procurement.ts`

### `createMaterialAssignmentsFromEstimate(estimateId: string)`
1. Verify estimate is approved
2. Get line items WHERE `material_id IS NOT NULL`
3. Find or create a "Procurement" task in the project's first phase
4. For each line item, call existing `assignMaterialToTask()` from `app/actions/materials.ts` with:
   - `material_id`, `task_id`, `project_id`
   - `quantity` from line item
   - `unit_cost` = `material_cost`
   - `procurement_status` = `'needed'`
5. Return count of assignments created

**Reuses**: `assignMaterialToTask()` from `app/actions/materials.ts`

---

## Phase 6: Stale Price Detection

**Add to**: `app/actions/material-suggestions.ts`

### `checkEstimatePriceStaleness(estimateId: string, threshold?: 5)`
1. Get line items with `material_id` joined to `materials`
2. Compare `line_item.material_cost` vs `material.unit_price`
3. Return items where `|change| >= threshold%`:
   `{ line_item_id, product_name, estimate_price, current_price, change_pct }`

---

## Phase 7: UI Changes

### 7a: CostLineItemRow Enhancement
**File**: `components/estimates/CostLineItemRow.tsx`

- Add "Link Material" button (Lucide `Package` icon, 44px touch target)
- When clicked, opens `MaterialSuggestionPicker` modal
- When material selected: auto-fill `materialCost` from `unit_price`, show `LinkedMaterialBadge`
- "Unlink" button to clear

### 7b: CostEditor Enhancement
**File**: `components/estimates/CostEditor.tsx`

- Add "Auto-Match Materials" button in header
- Calls `bulkMatchMaterialsToTakeoffItems()`, shows confirmation modal
- After confirmation, populates line items with matched material_id + material_cost

### 7c: New Components
| Component | Purpose |
|-----------|---------|
| `components/estimates/MaterialSuggestionPicker.tsx` | ResponsiveModal showing suggestions with relevance scores, search, images |
| `components/estimates/MaterialMatchConfirmModal.tsx` | Bulk match confirmation — table of takeoff item → suggested material |
| `components/estimates/LinkedMaterialBadge.tsx` | Small badge showing linked material name + price |
| `components/estimates/StalePriceWarning.tsx` | Banner in EstimateSummary when prices are stale |

### 7d: EstimateSummary Enhancement
**File**: `components/estimates/EstimateSummary.tsx`

- Call `checkEstimatePriceStaleness()` on load
- Show `StalePriceWarning` banner if stale items found
- Add "Create Procurement Orders" button (calls Phase 5 action)

---

## Files Modified (summary)

| File | Change |
|------|--------|
| `supabase/migrations/new.sql` | Add material_id FK |
| `lib/materials/category-mapping.ts` | **NEW** - mapping utility |
| `app/actions/material-suggestions.ts` | **NEW** - suggest, bulk-match, staleness |
| `app/actions/estimate-to-procurement.ts` | **NEW** - approved estimate → assignments |
| `app/actions/estimates.ts` | Accept material_id in create, join in get |
| `types/db/tables/estimates.ts` | Add material_id to types |
| `components/estimates/CostLineItemRow.tsx` | Link Material button + badge |
| `components/estimates/CostEditor.tsx` | Auto-Match button |
| `components/estimates/EstimateSummary.tsx` | Stale price warning + procurement button |
| `components/estimates/MaterialSuggestionPicker.tsx` | **NEW** |
| `components/estimates/MaterialMatchConfirmModal.tsx` | **NEW** |
| `components/estimates/LinkedMaterialBadge.tsx` | **NEW** |
| `components/estimates/StalePriceWarning.tsx` | **NEW** |

---

## Verification

1. **Migration**: `npm run db:gen-types` succeeds, material_id appears in generated types
2. **Suggestions**: Call `suggestMaterialsForLineItem({ trade: 'framing', category: 'structural', subType: '2x4 studs' })` → returns lumber materials sorted by relevance
3. **Auto-match**: Upload a plan, parse, accept items → run bulk match → verify suggestions returned for each item
4. **Create estimate**: Create estimate with material_id on line items → verify FK saved in DB
5. **Staleness**: Change a material's unit_price → call staleness check → verify warning returned
6. **Procurement**: Approve estimate → create assignments → verify material_assignments records created
7. **Build**: `npm run build` passes, `npm run lint:ts` clean
