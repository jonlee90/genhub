# Design: Materials-Estimates Integration

> **Status:** Draft
> **Created:** 2026-02-16
> **Module:** Estimates + Materials

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (PWA)                         │
│  CostEditor → MaterialSuggestionPicker → LinkedBadge   │
│  EstimateSummary → TradeDonutChart → PriceTrend         │
└────────────────────────┬────────────────────────────────┘
                         │ Server Actions
┌────────────────────────▼────────────────────────────────┐
│              Server Actions / API Routes                │
│  material-suggestions.ts    estimates.ts                │
│  budget-conversion.ts       estimate-chat.ts            │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Service Layer                              │
│  lib/materials/category-mapping.ts (NEW)                │
│  lib/services/home-depot-api.ts (MODIFY)                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Database (Supabase)                        │
│  estimate_line_items.material_id → materials            │
│  home_depot_cache (NEW)                                 │
│  materials.last_api_sync_at (NEW)                       │
│  pricing_template_items.material_id (Phase 3)           │
└─────────────────────────────────────────────────────────┘
```

---

## Three-Tier Caching Architecture

```
Request → In-Memory (30min) → DB Cache (24h-7d) → SerpAPI
                                    ↑
                          materials table IS the long-term cache
```

### Tier 1: In-Memory Cache (Existing)
- 30-min TTL for burst protection within serverless instance
- Keep as-is, no changes needed

### Tier 2: Database Cache Table (`home_depot_cache`)
- Search results cached 24 hours
- Product details cached 7 days
- Key: normalized query string or `product_id`
- Weekly cleanup of expired entries via existing cron

### Tier 3: `materials` Table as Persistent Cache
- Once saved to catalog, the material is source of truth
- Daily cron refreshes prices for estimate-linked materials
- Weekly cron refreshes all other active materials
- No API call needed for catalog matches

### Cache Flow

```
searchHomeDepot(query):
  1. Normalize query → cache_key
  2. Check home_depot_cache WHERE cache_key = key AND expires_at > now()
     → HIT: return response_data, increment hit_count
  3. Check materials WHERE name ILIKE query (fuzzy)
     → HIT: return as suggestion (zero API calls)
  4. Call SerpAPI
  5. Store in home_depot_cache (expires: search=24h, product=7d)
  6. Return results
```

---

## Smart Matching Algorithm

Replace basic ILIKE with multi-factor weighted scoring:

| Factor | Weight | Logic |
|--------|--------|-------|
| Trade-category match | 30 | Material category in `TRADE_TO_MATERIAL_CATEGORIES[trade]` |
| Description keyword overlap | 25 | Word match including construction synonyms |
| Unit-of-measure compatibility | 20 | Compatible unit groups (LF/foot, SF/sheet, etc.) |
| Specification dimension match | 15 | "2x4", "3/4 in" found in material specs |
| Price reasonableness | 10 | Within 3x of category median |

**Auto-link threshold:** Score >= 70

### Category Mapping (`lib/materials/category-mapping.ts`)

```typescript
// Trade → Material category mapping
export const TRADE_TO_MATERIAL_CATEGORIES: Record<string, string[]> = {
  'Framing': ['Lumber', 'Structural', 'Fasteners'],
  'Electrical': ['Electrical', 'Wire', 'Conduit', 'Panels'],
  'Plumbing': ['Plumbing', 'Pipe', 'Fittings', 'Fixtures'],
  'Drywall': ['Drywall', 'Joint Compound', 'Tape'],
  'Roofing': ['Roofing', 'Underlayment', 'Flashing'],
  'Flooring': ['Flooring', 'Tile', 'Adhesive', 'Underlayment'],
  'Painting': ['Paint', 'Primer', 'Caulk', 'Tape'],
  'HVAC': ['HVAC', 'Ductwork', 'Insulation'],
  'Insulation': ['Insulation', 'Vapor Barrier'],
  'Concrete': ['Concrete', 'Rebar', 'Forms', 'Aggregate'],
}

// Compatible unit groups
export const UNIT_COMPATIBILITY: Record<string, string[]> = {
  length: ['LF', 'ft', 'foot', 'feet', 'linear foot'],
  area: ['SF', 'sq ft', 'square foot', 'sheet'],
  volume: ['CF', 'cu ft', 'cubic foot', 'yard'],
  count: ['EA', 'each', 'piece', 'pc', 'unit'],
  weight: ['LB', 'lb', 'pound', 'ton'],
  bundle: ['BDL', 'bundle', 'roll', 'bag', 'box'],
}

// Construction synonyms
export const CONSTRUCTION_SYNONYMS: Record<string, string[]> = {
  'stud': ['2x4', '2x6', 'framing lumber'],
  'drywall': ['sheetrock', 'gypsum board', 'wallboard'],
  'wire': ['romex', 'NM-B', 'electrical cable'],
  'pipe': ['PVC', 'copper', 'PEX', 'ABS'],
  'plywood': ['CDX', 'OSB', 'sheathing'],
  'insulation': ['fiberglass', 'R-13', 'R-19', 'R-30', 'batt'],
}
```

### Scoring Function Signature

```typescript
export function scoreMaterialMatch(
  lineItem: { description: string; trade: string; unit: string; quantity: number },
  material: { name: string; category: string; unit: string; price: number; specs?: string }
): { score: number; factors: Record<string, number> }
```

---

## Database Migrations

### Migration 1: Apply Existing `material_id` FK
**File:** `supabase/migrations/20260216000006_add_material_id_to_estimate_line_items.sql` (already written)
- Adds `material_id UUID REFERENCES materials(id) ON DELETE SET NULL`
- Index on `material_id` for join performance

### Migration 2: Home Depot API Response Cache
```sql
CREATE TABLE public.home_depot_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('search', 'product')),
  response_data JSONB NOT NULL,
  product_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INT DEFAULT 0
);

CREATE INDEX idx_home_depot_cache_key ON public.home_depot_cache(cache_key);
CREATE INDEX idx_home_depot_cache_expires ON public.home_depot_cache(expires_at);

-- RLS: company-scoped not needed — this is a shared cache
ALTER TABLE public.home_depot_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.home_depot_cache
  FOR ALL USING (false);
```

### Migration 3: Add `last_api_sync_at` to Materials
```sql
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS last_api_sync_at TIMESTAMPTZ;

COMMENT ON COLUMN public.materials.last_api_sync_at
  IS 'Last time this material price was refreshed from SerpAPI';
```

### Migration 4: Add `material_id` to Pricing Template Items (Phase 3)
```sql
ALTER TABLE public.pricing_template_items
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

CREATE INDEX idx_pricing_template_items_material
  ON public.pricing_template_items(material_id)
  WHERE material_id IS NOT NULL;
```

---

## Priority Sync Strategy

### Daily Sync (Estimate-Linked Materials)
Materials linked to line items on **draft** or **reviewed** estimates get daily price refresh.

```sql
SELECT DISTINCT m.id, m.product_id
FROM materials m
JOIN estimate_line_items eli ON eli.material_id = m.id
JOIN estimates e ON e.id = eli.estimate_id
WHERE e.status IN ('draft', 'reviewed')
  AND (m.last_api_sync_at IS NULL OR m.last_api_sync_at < now() - interval '1 day');
```

### Weekly Sync (All Other Active Materials)
Materials not linked to active estimates sync weekly.

```sql
SELECT m.id, m.product_id
FROM materials m
WHERE m.status = 'active'
  AND m.id NOT IN (/* daily sync set */)
  AND (m.last_api_sync_at IS NULL OR m.last_api_sync_at < now() - interval '7 days');
```

### Batch-by-Category Optimization
Instead of one API call per material, batch by category search:
- Group materials by HD category
- One search returns multiple product prices
- Extract individual prices from batch results

**Projected savings:** ~1,500 calls/mo -> ~43 calls/mo

---

## Data Flow Diagrams

### Flow 1: Auto-Fill Costs on Parse

```
AI Parse → takeoff_items → estimate_line_items (cost=$0)
                                    │
                          scoreMaterialMatch()
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              Score >= 70     50 <= Score < 70    Score < 50
              Auto-link       Show suggestion     "No match"
              Set unit_cost   User confirms       Manual search
```

### Flow 2: Price Cascade

```
Cron fires → SerpAPI batch search → Update materials.price
                                          │
                              Find linked estimate_line_items
                              WHERE estimate.status IN (draft, reviewed)
                                          │
                              Update unit_cost = materials.price
                              Recalculate estimate totals
```

### Flow 3: Estimate to Procurement

```
User approves estimate → "Create Orders" button
                              │
                    For each linked line item:
                    ├── Check existing material_assignments
                    ├── Create if not exists (status: 'needed')
                    └── Set quantity from line item (with UOM conversion)
```

---

## Key Files Reference

| File | Changes | Phase |
|------|---------|-------|
| `app/actions/material-suggestions.ts` | Upgrade matching algorithm, add search-and-link | 1, 3 |
| `lib/materials/category-mapping.ts` | **New** — trade maps, UOM groups, synonyms | 1 |
| `lib/services/home-depot-api.ts` | Add DB cache layer, batch search | 2 |
| `components/estimates/CostEditor.tsx` | Wire bulk-match button | 1 |
| `components/estimates/CostLineItemRow.tsx` | MaterialSuggestionPicker, LinkedMaterialBadge | 1 |
| `components/estimates/EstimateSummary.tsx` | Stale price warnings, analytics | 3 |
| `app/api/cron/update-material-prices/route.ts` | Batch-by-category, budget-aware, priority sync | 2 |
| `app/actions/budget-conversion.ts` | Estimate-to-procurement conversion | 4 |

---

## Component Design

### LinkedMaterialBadge
Small inline badge on linked line items showing:
- Material name (truncated)
- Current price
- Sync status icon (fresh/stale)
- Click to view material details

### MaterialSuggestionPicker
Dropdown/popover on unlinked items:
- Top 3 catalog matches with scores
- "Search Home Depot" fallback button
- One-click link action

### BulkMatchButton
Toolbar button in CostEditor:
- Shows "Match X items" count
- Progress indicator during operation
- Results toast with matched/skipped/failed counts
