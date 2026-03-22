# Estimates Module v2 - Upgrade Research & Design

> Date: 2026-02-15 | Author: Claude (GC + Software Engineer perspective)
> Status: Research Complete | Scope: Backend improvements + Frontend build + New capabilities

---

## Executive Summary

The current Estimates module has a **solid backend** (server actions, API routes, AI pipeline, database schema) but **zero frontend components**. This document analyzes the existing implementation against industry-leading tools (Buildertrend, Procore, STACK CT, Togal.AI, PlanSwift), identifies concrete improvements, and provides a prioritized upgrade plan.

**Current state**: Backend 100% complete, Frontend 0% complete, 6 backend bugs/gaps identified.

---

## Part 1: Existing Backend Audit - Issues Found

### Bug 1: `approveEstimate()` - Missing PM Role Check

**File**: `app/actions/estimates.ts:287`

```typescript
// CURRENT (broken)
if (context.role !== "admin") {
  return { success: false, error: "Insufficient permissions to approve estimates" };
}

// SHOULD BE (per authorization matrix in reference doc)
if (context.role !== "admin" && context.role !== "project_manager") {
  return { success: false, error: "Insufficient permissions to approve estimates" };
}
```

The reference doc says both admin AND PM can approve estimates, but code only checks for admin.

---

### Bug 2: `applyPricingTemplate()` - N+1 Update Problem

**File**: `app/actions/pricing-templates.ts:221-242`

The template application uses a `for` loop with individual UPDATE queries per line item. For an estimate with 50 line items, this fires 50+ separate database calls.

```typescript
// CURRENT (N+1 query pattern)
for (const lineItem of lineItems) {
  const match = templateItems.find(...);
  if (match) {
    await context.supabase.from("estimate_line_items").update({...}).eq("id", lineItem.id);
  }
}

// SHOULD BE (batch update)
// Group matched items, build a single RPC call or use Promise.all with a bounded concurrency
```

---

### Bug 3: Missing `company_id` Check on `plan_parse_results` Insert

**File**: `app/api/estimates/parse/route.ts:285-299`

The parse result insert doesn't include `company_id`, but the table requires it (NOT NULL constraint). This would fail at runtime.

```typescript
// CURRENT (missing company_id)
.insert({
  plan_page_id: page.id,
  raw_response: validated,
  page_type: validated.page_type || "unknown",
  model: OPENAI_MODEL,
  // ... no company_id!
})

// SHOULD INCLUDE
company_id: companyId,
```

---

### Bug 4: Cached Result Cost Accounting

**File**: `app/api/estimates/parse/route.ts:205-213`

On cache hit, the code logs the *original* cost from the cached result instead of $0. This inflates the AI usage budget tracking.

```typescript
// CURRENT
cost = Number(cachedResult.cost); // Logs original cost on cache hit
cached = true;

// SHOULD BE
cost = 0; // Cache hits should cost nothing
cached = true;
```

---

### Gap 5: Missing Server Actions Referenced in Docs

The reference document lists these API routes/actions that don't exist:
- `POST /api/estimates/takeoff-items/accept` - Not implemented
- `POST /api/estimates/takeoff-items/reject` - Not implemented
- `POST /api/estimates/takeoff-items/bulk-accept` - Not implemented
- `POST /api/estimates/takeoff-items/bulk-reject` - Not implemented
- `POST /api/estimates/takeoff-items/update` - Not implemented
- `getPlanPageStatus()` server action - Not implemented

These are referenced in the docs but were never built. The server actions in `estimates.ts` handle individual review/update, but no bulk operations or dedicated takeoff-item API routes exist.

---

### Gap 6: `estimate_line_items` Missing `material_id` FK

The reference doc mentions `estimate_line_items.material_id` for linking to the materials module, but the migration doesn't include this column:

```sql
-- MISSING from 20260208015245_create_estimating_support.sql
material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
```

---

## Part 2: Competitive Analysis - Best Features to Steal

### From Togal.AI: "Chat With Your Plans"

**What it does**: Conversational AI interface where contractors can ask questions about their plans ("How many doors on floor 2?", "What's the total drywall area?").

**Why it matters**: GCs don't think in structured queries. They think in questions. A chat interface over parsed takeoff data would be a massive differentiator.

**Implementation approach**: Use the existing `plan_parse_results` + `takeoff_items` data as context for an LLM chat. No new AI parsing needed - just a RAG layer over already-extracted data.

---

### From STACK CT: AI Document Intelligence

**What it does**: Auto-detects common elements (doors, windows, walls, rooms) and creates editable takeoffs automatically.

**Our gap**: Our GPT-4o prompt extracts items but doesn't categorize by room or spatial context. We get "150 LF of 2x4 studs" but not "Master Bedroom: 45 LF, Kitchen: 35 LF, Living Room: 70 LF".

**Enhancement**: Add room/space context to the AI prompt to group takeoff items by location.

---

### From Procore: Estimate-to-Budget Pipeline

**What it does**: Approved estimates automatically become project budgets. Actual costs track against the original estimate in real-time.

**Our gap**: We have `estimates.project_id` FK but no mechanism to convert an approved estimate into a project budget or track variance.

**Enhancement**: Add `convertEstimateToBudget()` server action that creates budget line items from approved estimates, with ongoing variance tracking.

---

### From Buildertrend: Assemblies & Cost Catalog

**What it does**: Drag-and-drop assemblies (e.g., "Interior Wall Assembly" = studs + drywall + tape + mud + primer + paint) onto estimates. One click adds 6 line items with correct quantities and pricing.

**Our gap**: Our `pricing_templates` only match by trade + category. No concept of assemblies (groups of related items that go together).

**Enhancement**: Add `assemblies` table that groups multiple template items. When a GC adds "Interior Wall - 100 LF", the system auto-generates all component line items.

---

### From PlanSwift: On-Plan Measurement Tools

**What it does**: Click-to-measure tools directly on plan images (area, linear, count). Measurements auto-populate takeoff items.

**Our gap**: Our `PlanViewer` shows bounding boxes from AI extraction but doesn't let users draw measurements on the plan.

**Enhancement**: Add basic measurement tools to the plan viewer (area select, linear measure, point count). These feed into `addManualTakeoffItem()`.

---

### From All Tools: PDF Export with Branding

**What it does**: Generate professional PDF proposals from estimates, with company logo, cover page, trade-grouped breakdown, and terms & conditions.

**Our gap**: No export capability at all.

**Enhancement**: Server-side PDF generation using the existing estimate data. Trade-grouped layout with company branding.

---

## Part 3: Prioritized Upgrade Plan

### Phase 1: Backend Fixes (Immediate - Fix What's Broken)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1.1 | Fix `approveEstimate()` role check (add PM) | Bug fix | 5 min |
| 1.2 | Fix `plan_parse_results` missing `company_id` | Bug fix | 5 min |
| 1.3 | Fix cached result cost accounting ($0 for cache hits) | Bug fix | 5 min |
| 1.4 | Add bulk takeoff item operations (accept/reject) | Missing feature | 1 hr |
| 1.5 | Fix N+1 in `applyPricingTemplate()` | Performance | 30 min |
| 1.6 | Add `material_id` to `estimate_line_items` migration | Schema gap | 15 min |
| 1.7 | Add `duplicateEstimate()` server action | Missing feature | 30 min |
| 1.8 | Add `deleteEstimate()` server action (soft delete via supersede) | Missing feature | 20 min |
| 1.9 | Add `getAiUsage()` server action for budget display | Missing feature | 20 min |
| 1.10 | Add `getPlanPageStatus()` server action | Missing feature | 15 min |

---

### Phase 2: AI Prompt Improvements (High Impact, Low Effort)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 2.1 | Add room/space context to parse prompt | Better data quality | 30 min |
| 2.2 | Add construction scale detection | Fewer manual edits | 30 min |
| 2.3 | Improve trade mapping coverage (currently 15 mappings, should be 30+) | Better categorization | 30 min |
| 2.4 | Add page type classification (floor plan, elevation, detail, schedule) | Smarter parsing | 20 min |
| 2.5 | Add multi-item assembly inference (e.g., wall = studs + plates + drywall) | Richer extractions | 30 min |
| 2.6 | Increase `max_tokens` from 2000 to 4000 for complex pages | More complete results | 5 min |

---

### Phase 3: New Backend Capabilities

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 3.1 | Add `estimate_assemblies` table + server actions | Assembly-based estimating | 2 hrs |
| 3.2 | Add `convertEstimateToBudget()` action | Estimate-to-project pipeline | 1 hr |
| 3.3 | Add estimate comparison/diff action | Version comparison | 1 hr |
| 3.4 | Add PDF export API route | Professional output | 3 hrs |
| 3.5 | Add estimate sharing (read-only link for clients/subs) | Collaboration | 2 hrs |
| 3.6 | Add takeoff item grouping by room/location | Spatial organization | 1 hr |
| 3.7 | Add re-parse with override (force re-parse ignoring cache) | User control | 30 min |

---

### Phase 4: Frontend Build (Core UI - Must Have)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 4.1 | `EstimatesTab.tsx` - Server component data fetcher | Entry point | 30 min |
| 4.2 | `EstimatesTabClient.tsx` - Async wrapper for client boundary | Next.js pattern | 20 min |
| 4.3 | `EstimatesTabContent.tsx` - Main state machine (upload/review/cost/summary) | Core orchestrator | 2 hrs |
| 4.4 | `PlanUploadPanel.tsx` - Drag-drop with XHR progress | Upload flow | 1.5 hrs |
| 4.5 | `ParseProgressOverlay.tsx` - Per-page polling status | Parse flow | 1 hr |
| 4.6 | `TakeoffReviewScreenContent.tsx` - Responsive split view | Review flow | 3 hrs |
| 4.7 | `PlanViewer.tsx` - GPU-accelerated pan/zoom with bounding boxes | Plan display | 3 hrs |
| 4.8 | `TakeoffItemList.tsx` - Filterable list with bulk actions | Item management | 2 hrs |
| 4.9 | `TakeoffItemRow.tsx` - Accept/reject/edit per item | Individual review | 1 hr |
| 4.10 | `TakeoffItemEditModal.tsx` - Edit modal (ResponsiveModal) | Item editing | 1 hr |
| 4.11 | `AddManualItemModal.tsx` - Manual takeoff entry | Manual override | 1 hr |
| 4.12 | `CostEditor.tsx` - Line items + overhead/markup with live totals | Costing | 2.5 hrs |
| 4.13 | `CostLineItemRow.tsx` - Material/labor/equipment inputs | Cost entry | 1.5 hrs |
| 4.14 | `EstimateSummary.tsx` - Trade-grouped breakdown + approve | Summary | 2 hrs |
| 4.15 | `EstimateHistoryList.tsx` - Version history with status badges | Versioning | 1 hr |
| 4.16 | `AiBudgetBanner.tsx` - Budget warning/stop banner | Cost control | 30 min |
| 4.17 | `EstimateStatusBadge.tsx` / `ConfidenceBadge.tsx` - Status colors | Visual indicators | 30 min |
| 4.18 | `EmptyEstimatesState.tsx` / `EstimatesSkeleton.tsx` | Loading/empty states | 30 min |
| 4.19 | `PricingTemplateModal.tsx` / `SaveTemplateModal.tsx` | Template management | 1.5 hrs |
| 4.20 | `EstimatesErrorBoundary.tsx` - Error isolation | Error handling | 20 min |

---

### Phase 5: Frontend Enhancements (Competitive Edge)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 5.1 | Add estimate KPI cards to project overview | Visibility | 1 hr |
| 5.2 | Add estimate vs. actual budget variance widget | Financial insight | 2 hrs |
| 5.3 | Add takeoff item confidence heatmap on plan | Visual review aid | 2 hrs |
| 5.4 | Add keyboard shortcuts for review (A=accept, R=reject, E=edit) | Power user speed | 1 hr |
| 5.5 | Add swipe gestures for mobile review (swipe right=accept, left=reject) | Mobile UX | 1.5 hrs |
| 5.6 | Add plan page thumbnails strip for navigation | Multi-page navigation | 1 hr |
| 5.7 | Add "Quick Estimate" mode (skip AI, manual entry only) | Alternative workflow | 1 hr |
| 5.8 | Add estimate duplication button | Workflow speed | 30 min |
| 5.9 | Add cost comparison chart (bar chart of trade costs) | Visual analysis | 1.5 hrs |
| 5.10 | Add PDF export button | Professional output | 30 min (UI only, backend in Phase 3) |

---

## Part 4: Detailed Design for Key Improvements

### Improvement A: Enhanced AI Prompt (Phase 2.1)

**Current prompt issues**:
1. No room/space context - items aren't grouped by location
2. No scale detection - can't validate quantities against plan scale
3. Limited category mappings - only 15 trade mappings
4. Low max_tokens (2000) - truncates on complex pages

**Upgraded prompt design**:

```
ENHANCED EXTRACTION RULES:
1. SPATIAL CONTEXT: Group items by room/space when identifiable
   - Include room_name field (e.g., "Master Bedroom", "Kitchen")
   - Include floor_level if visible (e.g., "1st Floor", "Basement")

2. SCALE DETECTION: Look for scale indicators
   - Note any scale bars, scale text (e.g., "1/4" = 1'-0"")
   - Use scale to validate calculated dimensions

3. PAGE CLASSIFICATION: Identify page type
   - floor_plan, elevation, section, detail, schedule, site_plan, electrical, plumbing, mechanical

4. ASSEMBLY INFERENCE: When items commonly go together, note the assembly
   - Wall framing + drywall + finishing = "Interior Wall Assembly"
   - Roof trusses + sheathing + underlayment = "Roof Assembly"

5. DIMENSIONS: Extract both individual and running totals
   - Individual room dimensions
   - Overall building dimensions
   - Note discrepancies
```

---

### Improvement B: Bulk Takeoff Operations (Phase 1.4)

**New server actions**:

```typescript
// Bulk accept - accept all items matching filter criteria
export async function bulkAcceptTakeoffItems(input: {
  planUploadId: string;
  filter?: {
    trade?: string;
    minConfidence?: number;
    category?: TakeoffCategory;
  };
}) { ... }

// Bulk reject
export async function bulkRejectTakeoffItems(input: {
  planUploadId: string;
  itemIds: string[];
}) { ... }

// Accept all with confidence >= threshold
export async function acceptHighConfidenceItems(input: {
  planUploadId: string;
  confidenceThreshold: number; // default 0.85
}) { ... }
```

---

### Improvement C: Estimate Duplication (Phase 1.7)

```typescript
export async function duplicateEstimate(estimateId: string) {
  // 1. Get original estimate + line items
  // 2. Create new estimate with:
  //    - name: "{original.name} (Copy)"
  //    - status: "draft"
  //    - All line items duplicated
  //    - Totals preserved
  //    - New created_by/created_at
  // 3. Return new estimate
}
```

---

### Improvement D: Assemblies System (Phase 3.1)

**Schema addition**:

```sql
CREATE TABLE public.estimate_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g., "Interior Wall Assembly"
  description TEXT,
  category takeoff_category NOT NULL,
  unit TEXT NOT NULL,                    -- e.g., "LF" (linear feet of wall)
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.estimate_assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assembly_id UUID NOT NULL REFERENCES public.estimate_assemblies(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  category takeoff_category NOT NULL,
  sub_type TEXT NOT NULL,                -- e.g., "2x4 studs"
  quantity_per_unit NUMERIC(10,4) NOT NULL, -- e.g., 1.0 LF studs per 1 LF wall
  unit TEXT NOT NULL,
  material_cost NUMERIC(12,2) DEFAULT 0,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  equipment_cost NUMERIC(12,2) DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Use case**: GC adds "Interior Wall - 200 LF". System auto-generates:
- 200 LF 2x4 studs @ $1.85/LF (framing)
- 200 LF top/bottom plates @ $1.85/LF (framing)
- 400 SF 5/8" drywall @ $0.45/SF (drywall - 2 sides)
- 400 SF tape & mud @ $0.25/SF (drywall finishing)
- 400 SF primer + paint @ $0.35/SF (painting)

---

### Improvement E: Estimate-to-Budget Pipeline (Phase 3.2)

```typescript
export async function convertEstimateToBudget(estimateId: string) {
  // 1. Verify estimate is approved
  // 2. Get estimate with line items
  // 3. Update project with:
  //    - project.budget = estimate.grand_total
  //    - project.estimated_cost = estimate.grand_total
  // 4. Create budget_line_items from estimate_line_items
  // 5. Link estimate to project budget
  // 6. Return success with project budget URL
}
```

---

## Part 5: Enhanced Trade Mapping

**Current**: 15 mappings in `normalize-takeoff.ts`

**Upgraded to 35+ mappings**:

```typescript
const TRADE_MAPPING: Record<string, string> = {
  // Structural
  "structural-concrete": "concrete",
  "structural-steel": "steel",
  "structural-lumber": "framing",
  "structural-masonry": "masonry",
  "structural-foundation": "concrete",
  "structural-rebar": "concrete",

  // Architectural
  "architectural-framing": "framing",
  "architectural-drywall": "drywall",
  "architectural-door": "carpentry",
  "architectural-window": "glazing",
  "architectural-flooring": "flooring",
  "architectural-paint": "painting",
  "architectural-ceiling": "drywall",
  "architectural-trim": "carpentry",
  "architectural-cabinet": "carpentry",
  "architectural-countertop": "countertops",
  "architectural-tile": "tile",
  "architectural-insulation": "insulation",
  "architectural-roofing": "roofing",
  "architectural-siding": "siding",
  "architectural-stucco": "stucco",

  // Mechanical
  "mechanical-hvac": "hvac",
  "mechanical-duct": "hvac",
  "mechanical-equipment": "hvac",

  // Electrical
  "electrical-wiring": "electrical",
  "electrical-panel": "electrical",
  "electrical-fixture": "electrical",
  "electrical-conduit": "electrical",
  "electrical-low-voltage": "low-voltage",

  // Plumbing
  "plumbing-pipe": "plumbing",
  "plumbing-fixture": "plumbing",
  "plumbing-drain": "plumbing",
  "plumbing-water-heater": "plumbing",

  // Painting
  "painting-interior": "painting",
  "painting-exterior": "painting",

  // Site
  "site-excavation": "sitework",
  "site-paving": "sitework",
  "site-concrete": "flatwork",
  "site-landscaping": "landscaping",
  "site-fencing": "fencing",
  "site-grading": "sitework",
  "site-utilities": "utilities",
};

// Enhanced waste factors
const WASTE_FACTORS: Record<string, number> = {
  drywall: 0.10,
  flooring: 0.15,
  framing: 0.05,
  concrete: 0.02,
  lumber: 0.05,
  electrical: 0.10,
  plumbing: 0.10,
  painting: 0.05,
  sitework: 0.02,
  tile: 0.15,        // NEW
  insulation: 0.05,  // NEW
  roofing: 0.10,     // NEW
  siding: 0.08,      // NEW
  masonry: 0.05,     // NEW
  countertops: 0.02, // NEW (expensive, minimize waste)
  carpentry: 0.05,   // NEW
  steel: 0.03,       // NEW
  glazing: 0.02,     // NEW
  hvac: 0.05,        // NEW
  low_voltage: 0.10, // NEW
  flatwork: 0.03,    // NEW
  landscaping: 0.10, // NEW
  stucco: 0.08,      // NEW
};
```

Also improve the keyword fallback matching:

```typescript
// Enhanced keyword matching with more construction terms
if (lower.includes("insulation") || lower.includes("r-value") || lower.includes("batt")) return "insulation";
if (lower.includes("roof") || lower.includes("shingle") || lower.includes("underlayment")) return "roofing";
if (lower.includes("tile") || lower.includes("grout") || lower.includes("thinset")) return "tile";
if (lower.includes("cabinet") || lower.includes("vanity")) return "carpentry";
if (lower.includes("counter") || lower.includes("granite") || lower.includes("quartz")) return "countertops";
if (lower.includes("siding") || lower.includes("hardie")) return "siding";
if (lower.includes("stucco") || lower.includes("lath")) return "stucco";
if (lower.includes("landscape") || lower.includes("sod") || lower.includes("mulch")) return "landscaping";
if (lower.includes("fence") || lower.includes("gate")) return "fencing";
if (lower.includes("masonry") || lower.includes("brick") || lower.includes("block") || lower.includes("cmu")) return "masonry";
if (lower.includes("low voltage") || lower.includes("data") || lower.includes("cat6")) return "low-voltage";
```

---

## Part 6: Frontend Component Architecture

### State Machine for EstimatesTabContent

```
States: 'list' | 'upload' | 'parsing' | 'review' | 'costing' | 'summary'

Transitions:
  list -> upload (click "Upload Plan")
  list -> review (click existing plan with parsed items)
  list -> costing (click existing estimate)
  list -> summary (click approved estimate)
  upload -> parsing (upload complete, auto-trigger parse)
  parsing -> review (all pages parsed)
  review -> costing (all items reviewed, click "Apply Costs")
  costing -> summary (click "Review Estimate")
  summary -> list (after approval or back navigation)
  any -> list (back button)
```

### Component Hierarchy

```
EstimatesTab (server)
  -> EstimatesTabClient (client wrapper - handles async boundary)
    -> EstimatesTabContent (state machine)
      -> EmptyEstimatesState (when no plans/estimates)
      -> AiBudgetBanner (always visible when usage > 50%)
      |
      -> [state: list]
      |   -> EstimateHistoryList (existing estimates)
      |   -> PlanUploadsList (existing plan uploads with status)
      |
      -> [state: upload]
      |   -> PlanUploadPanel (drag-drop zone)
      |   -> PlanUploadProgress (per-file status)
      |
      -> [state: parsing]
      |   -> ParseProgressOverlay (per-page polling)
      |
      -> [state: review]
      |   -> TakeoffReviewScreenContent
      |     -> PlanViewer (left/top - pan/zoom + bounding boxes)
      |     -> TakeoffItemList (right/bottom)
      |       -> TakeoffItemRow (per item - accept/reject/edit)
      |     -> TakeoffItemEditModal (edit)
      |     -> AddManualItemModal (manual add)
      |
      -> [state: costing]
      |   -> CostEditor
      |     -> CostLineItemRow (per line item)
      |     -> PricingTemplateModal (apply template)
      |     -> SaveTemplateModal (save as template)
      |
      -> [state: summary]
          -> EstimateSummary (trade-grouped, totals, approve)
```

---

## Part 7: Implementation Priority Matrix

### Must-Do (Blocking Issues)

| Priority | Task | Justification |
|----------|------|---------------|
| P0 | Fix `approveEstimate()` role check | Bug - PM can't approve |
| P0 | Fix `plan_parse_results` missing `company_id` | Bug - runtime failure |
| P0 | Fix cached result cost accounting | Bug - inflated budget usage |

### Should-Do (High Impact)

| Priority | Task | Justification |
|----------|------|---------------|
| P1 | Add bulk accept/reject | Review 50 items one-by-one is painful |
| P1 | Fix N+1 in `applyPricingTemplate()` | Performance at scale |
| P1 | Expand trade mappings (15 -> 35+) | Better AI extraction accuracy |
| P1 | Enhance AI prompt with room context | More useful takeoff data |
| P1 | Add `duplicateEstimate()` action | Standard workflow need |
| P1 | Increase max_tokens to 4000 | Complex pages get truncated |
| P1 | Add `getAiUsage()` action | Budget display needs data |

### Nice-to-Have (Competitive Edge)

| Priority | Task | Justification |
|----------|------|---------------|
| P2 | Assemblies system | Buildertrend/PlanSwift pattern |
| P2 | Estimate-to-budget pipeline | Procore pattern |
| P2 | PDF export | Professional output |
| P2 | Estimate comparison/diff | Version management |
| P2 | Re-parse with cache override | User control |
| P3 | Chat with plans (Togal.AI pattern) | Major differentiator |
| P3 | On-plan measurement tools | PlanSwift pattern |

---

## Part 8: Recommended Immediate Actions

**For this session, implement Phase 1 (backend fixes) + Phase 2 (AI improvements):**

1. Fix the 3 bugs (P0)
2. Add missing server actions (bulk ops, duplicate, delete, AI usage, page status)
3. Upgrade AI prompt and trade mappings
4. Increase max_tokens
5. Add enhanced keyword matching

These changes improve the foundation before any frontend is built, ensuring the UI layer will have solid, bug-free APIs to call.

---

## Appendix: Competitive Feature Matrix

| Feature | Buildertrend | Procore | STACK CT | Togal.AI | PlanSwift | GenHub v1 | GenHub v2 |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| AI Plan Parsing | - | - | Y | Y | - | Y | Y+ |
| Room-Level Grouping | - | Y | Y | Y | - | - | Y |
| Bulk Review | - | Y | Y | Y | Y | - | Y |
| Assemblies | Y | Y | - | - | Y | - | Y |
| Pricing Templates | Y | Y | - | - | Y | Y | Y |
| PDF Export | Y | Y | Y | Y | Y | - | Y |
| Estimate Versioning | Y | Y | - | - | - | Y | Y |
| Budget Tracking | Y | Y | - | - | - | Y | Y |
| Chat with Plans | - | - | Y | Y | - | - | Future |
| Measurement Tools | - | Y | Y | Y | Y | - | Future |
| BIM Integration | - | Y | - | - | - | - | Future |
| Mobile Optimized | Y | Y | Y | - | - | Y | Y |
| Offline Support | Y | - | - | - | Y | - | Future |