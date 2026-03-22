# Tasks: Materials-Estimates Integration

> **Status:** Draft
> **Created:** 2026-02-16
> **Module:** Estimates + Materials

## Codebase Status (Pre-Implementation)

| Component | Status |
|-----------|--------|
| `material-suggestions.ts` (5 server actions) | EXISTS — needs algorithm upgrade |
| `MaterialSuggestionPicker.tsx` (165 lines) | EXISTS — needs HD search fallback |
| `LinkedMaterialBadge.tsx` (43 lines) | EXISTS — needs stale indicator enhancement |
| `CostEditor.tsx` (447 lines) | EXISTS — needs bulk match button |
| `CostLineItemRow.tsx` (236 lines) | EXISTS — **NOT wired** to picker/badge |
| `EstimateSummary.tsx` (438 lines) | EXISTS — needs stale warnings, orders UI |
| `TradeDonutChart.tsx` (320 lines) | EXISTS — needs material cost breakdown |
| `home-depot-api.ts` (905 lines) | EXISTS — needs DB cache layer |
| `update-material-prices/route.ts` (221 lines) | EXISTS — needs batch + priority sync |
| `budget-conversion.ts` (153 lines) | EXISTS — needs procurement extension |
| `estimates.ts` (1,975 lines, 33 functions) | EXISTS — needs cascadePriceUpdates |
| `lib/materials/category-mapping.ts` | **DOES NOT EXIST** — new file |
| Migration `20260216000006` (material_id FK) | EXISTS — **UNAPPLIED** |
| `home_depot_cache` table | **DOES NOT EXIST** |
| `materials.last_api_sync_at` column | **DOES NOT EXIST** |

---

## Phase 1: Foundation (Zero New API Calls)

### Task 1.1: Apply `material_id` FK Migration
- **Agent:** `backend-engineer`
- **Dependencies:** None
- **Complexity:** Simple

#### Subtasks:
1. **1.1.1** — Verify migration SQL in `20260216000006_add_material_id_to_estimate_line_items.sql` is correct (FK, partial indexes on linked/unlinked)
2. **1.1.2** — Apply migration via `supabase db push` or MCP `apply_migration`
3. **1.1.3** — Add SELECT RLS policy for `estimate_line_items.material_id` (company-scoped via `get_user_company_id(next_auth.uid())`)
4. **1.1.4** — Run `npm run db:gen-types` and verify `material_id` appears in generated types
5. **1.1.5** — Update `types/db/tables/estimates.ts` if manual type overrides exist — add `material_id?: string | null`

**Acceptance Criteria:**
- `estimate_line_items.material_id` column exists with FK to `materials(id)` ON DELETE SET NULL
- Partial index on `material_id IS NOT NULL` and `material_id IS NULL` exist
- TypeScript types include `material_id`

---

### Task 1.2: Apply Cache & Sync Migrations
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.1
- **Complexity:** Simple

#### Subtasks:
1. **1.2.1** — Write migration: create `home_depot_cache` table (id, cache_key UNIQUE, cache_type CHECK, response_data JSONB, product_count, created_at, expires_at, hit_count)
2. **1.2.2** — Add indexes on `cache_key` and `expires_at` columns
3. **1.2.3** — Add RLS: `ENABLE ROW LEVEL SECURITY` + service-role-only policy (`FOR ALL USING (false)`)
4. **1.2.4** — Write migration: `ALTER TABLE materials ADD COLUMN IF NOT EXISTS last_api_sync_at TIMESTAMPTZ`
5. **1.2.5** — Add comment on `last_api_sync_at` column
6. **1.2.6** — Run `npm run db:gen-types` and verify both new schema elements in types

**Acceptance Criteria:**
- `home_depot_cache` table exists with correct schema, indexes, and RLS
- `materials.last_api_sync_at` column exists
- Types regenerated with both additions

---

### Task 1.3: Create Category Mapping Utility
- **Agent:** `backend-engineer`
- **Dependencies:** None
- **Complexity:** Medium

#### Subtasks:
1. **1.3.1** — Create `lib/materials/` directory
2. **1.3.2** — Create `lib/materials/category-mapping.ts` with `TRADE_TO_MATERIAL_CATEGORIES` constant — map all 10 trades (Framing, Electrical, Plumbing, Drywall, Roofing, Flooring, Painting, HVAC, Insulation, Concrete) to material category arrays
3. **1.3.3** — Add `UNIT_COMPATIBILITY` constant — 6 unit groups (length, area, volume, count, weight, bundle) with all known aliases
4. **1.3.4** — Add `CONSTRUCTION_SYNONYMS` constant — bidirectional lookup for construction terms (stud/2x4, drywall/sheetrock, wire/romex, pipe/PVC, plywood/CDX/OSB, insulation/fiberglass)
5. **1.3.5** — Implement `scoreMaterialMatch(lineItem, material)` function:
   - Trade-category match (30 pts): check if material category is in trade's category list
   - Description keyword overlap (25 pts): tokenize + match including synonyms
   - UOM compatibility (20 pts): check if units are in same compatibility group
   - Specification dimension match (15 pts): regex for "2x4", "3/4 in", etc.
   - Price reasonableness (10 pts): within 3x of category median
   - Return `{ score: number; factors: Record<string, number> }`
6. **1.3.6** — Export helper `getCompatibleUnits(unit: string): string[]` for UOM lookups
7. **1.3.7** — Export helper `expandSynonyms(term: string): string[]` for keyword expansion

**Acceptance Criteria:**
- All constants exported and typed
- `scoreMaterialMatch()` returns 0-100 with factor breakdown
- Helper functions exported for reuse in other modules

---

### Task 1.4: Upgrade Material Suggestion Algorithm
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.1, Task 1.3
- **Complexity:** Medium

#### Subtasks:
1. **1.4.1** — Import `scoreMaterialMatch`, `TRADE_TO_MATERIAL_CATEGORIES` from `lib/materials/category-mapping`
2. **1.4.2** — Refactor `suggestMaterialsForLineItem()`:
   - Replace ILIKE fuzzy matching with `scoreMaterialMatch()` scoring
   - Fetch candidate materials by trade category (narrowed query) instead of broad ILIKE
   - Sort results by score descending, return top 3
   - Include `score` and `factors` in response data
3. **1.4.3** — Update `linkLineItemToMaterial()`:
   - Set `estimate_line_items.material_id` (new FK column)
   - Set `unit_cost` from `materials.unit_price`
   - Return updated line item with material details
4. **1.4.4** — Refactor `bulkMatchMaterials()`:
   - Fetch all unlinked line items for estimate (`WHERE material_id IS NULL`)
   - Score each against candidate materials
   - Auto-link items with score >= 70
   - Return `{ matched, skipped, failed, details[] }`
5. **1.4.5** — Add `unlinkMaterialFromLineItem(lineItemId)` server action:
   - Set `material_id = NULL` on the line item
   - Optionally reset `unit_cost` to 0 or keep last-known price (configurable)
6. **1.4.6** — Update Zod schemas for any new input/output shapes

**Acceptance Criteria:**
- `suggestMaterialsForLineItem()` uses multi-factor scoring
- `bulkMatchMaterials()` auto-links at score >= 70
- `linkLineItemToMaterial()` sets `material_id` FK + `unit_cost`
- `unlinkMaterialFromLineItem()` clears the FK

---

### Task 1.5: Wire MaterialSuggestionPicker into CostLineItemRow
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 1.4
- **Complexity:** Medium
- **Skills:** `bundle-barrel-imports`, `bundle-dynamic-imports`, `rendering-conditional-render`, `rerender-memo`, `rerender-functional-setstate`

#### Subtasks:
1. **1.5.1** — Update `CostLineItemRow` props to accept `materialId?: string | null` and `materialName?: string | null`
2. **1.5.2** — Add conditional rendering using **ternary** (not `&&`) — `rendering-conditional-render`:
   ```tsx
   {materialId ? <LinkedMaterialBadge ... /> : <LinkButton ... />}
   ```
3. **1.5.3** — Lazy-load `MaterialSuggestionPicker` with `next/dynamic` — `bundle-dynamic-imports`:
   ```tsx
   const MaterialSuggestionPicker = dynamic(
     () => import('./MaterialSuggestionPicker'),
     { loading: () => <Skeleton className="h-[200px]" /> }
   )
   ```
4. **1.5.4** — Add state management for picker open/close (local `useState`)
5. **1.5.5** — Wire `onSelectMaterial` callback using **functional setState** — `rerender-functional-setstate`:
   ```tsx
   const handleSelect = useCallback((materialId: string, unitPrice: number) => {
     setItems(prev => prev.map(item =>
       item.id === lineItemId ? { ...item, materialId, unitCost: unitPrice } : item
     ))
   }, [lineItemId])
   ```
6. **1.5.6** — Wire `LinkedMaterialBadge.onClick` to show unlink option (popover with "Unlink Material" button)
7. **1.5.7** — Call `unlinkMaterialFromLineItem()` on unlink action
8. **1.5.8** — Wrap `CostLineItemRow` in `memo()` — `rerender-memo` (renders in a list, prevents re-render of all rows on single item change)
9. **1.5.9** — Wrap `LinkedMaterialBadge` in `memo()` — `rerender-memo` (renders per row, static between price syncs)
10. **1.5.10** — All imports must be direct paths — `bundle-barrel-imports`:
    ```tsx
    import { Button } from '@/components/ui/Button'
    import Link2 from 'lucide-react/icons/link-2'
    import Unlink from 'lucide-react/icons/unlink'
    ```
11. **1.5.11** — Ensure 44px touch targets on link/unlink buttons, add `active:scale-95` states
12. **1.5.12** — Add dark mode variants for badge and picker
13. **1.5.13** — Pass material data from `CostEditor` parent — update `CostEditor` to fetch material info with line items (join or separate query)

**Acceptance Criteria:**
- Unlinked items show link button → opens picker
- Linked items show badge with material name → click to unlink
- `MaterialSuggestionPicker` lazy-loaded via `next/dynamic`
- `CostLineItemRow` and `LinkedMaterialBadge` wrapped in `memo()`
- Ternary conditionals (no `&&` rendering)
- Direct imports only (no barrel files)
- 44px touch targets, dark mode, active states
- State syncs between picker selection and row display

---

### Task 1.6: Wire Bulk Match Button into CostEditor
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 1.4
- **Complexity:** Simple
- **Skills:** `bundle-barrel-imports`, `rendering-conditional-render`, `rerender-functional-setstate`, `rerender-transitions`

#### Subtasks:
1. **1.6.1** — Add "Match All" button to `CostEditor` toolbar (next to existing "Add Item" / template buttons)
2. **1.6.2** — Memoize unlinked count with `useMemo` to avoid recompute on every render:
   ```tsx
   const unlinkedCount = useMemo(() => items.filter(i => !i.materialId).length, [items])
   ```
3. **1.6.3** — Button label: use **ternary** — `rendering-conditional-render`:
   ```tsx
   {unlinkedCount > 0 ? `Match ${unlinkedCount} Items` : 'All Matched'}
   ```
4. **1.6.4** — On click: wrap in `startTransition` for non-blocking UI — `rerender-transitions`:
   ```tsx
   const [isPending, startTransition] = useTransition()
   const handleBulkMatch = () => {
     startTransition(async () => {
       const result = await bulkMatchMaterials(estimateId)
       // update state...
     })
   }
   ```
5. **1.6.5** — On success: show toast with "Matched {matched}/{total}, Skipped {skipped}"
6. **1.6.6** — Refresh line items state using **functional setState** — `rerender-functional-setstate`
7. **1.6.7** — Direct Lucide import — `bundle-barrel-imports`:
   ```tsx
   import Sparkles from 'lucide-react/icons/sparkles'
   ```
8. **1.6.8** — 44px min touch target, dark mode variant

**Acceptance Criteria:**
- Button shows unlinked count, disabled when none
- Bulk match uses `startTransition` for non-blocking UI
- Toast shows results summary
- Direct Lucide imports, ternary conditionals
- 44px touch target, dark mode, mobile responsive

---

## Phase 2: Persistent Caching (Reduces Existing API Calls)

### Task 2.1: Add DB Cache Layer to Home Depot API
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.2
- **Complexity:** Medium

#### Subtasks:
1. **2.1.1** — Create `normalizeSearchQuery(query: string): string` helper in `home-depot-api.ts`:
   - Lowercase, trim whitespace, sort words alphabetically
   - Remove common stop words ("the", "a", "for")
   - Return normalized string as cache key
2. **2.1.2** — Create `getCachedSearch(cacheKey: string): Promise<HomeDepotSearchResult | null>`:
   - Query `home_depot_cache WHERE cache_key = key AND cache_type = 'search' AND expires_at > now()`
   - If hit: increment `hit_count`, return `response_data`
   - If miss: return null
3. **2.1.3** — Create `getCachedProduct(productId: string): Promise<HomeDepotProduct | null>`:
   - Query `home_depot_cache WHERE cache_key = productId AND cache_type = 'product' AND expires_at > now()`
   - Same hit/miss logic
4. **2.1.4** — Create `setCacheEntry(key, type, data, ttlHours): Promise<void>`:
   - Upsert into `home_depot_cache` with `expires_at = now() + interval '{ttlHours} hours'`
   - Set `product_count` for search results
5. **2.1.5** — Modify `searchHomeDepotProducts()`:
   - Before SerpAPI call: check `getCachedSearch(normalizeSearchQuery(params.query))`
   - After SerpAPI call: store result with `setCacheEntry(key, 'search', data, 24)`
   - Add `bypassCache?: boolean` param for forced refresh
6. **2.1.6** — Modify `getHomeDepotProduct()`:
   - Before SerpAPI call: check `getCachedProduct(productId)`
   - After SerpAPI call: store result with `setCacheEntry(productId, 'product', data, 168)` (7 days)
7. **2.1.7** — Create Supabase client helper using service role for cache operations (no RLS)

**Acceptance Criteria:**
- Search results cached 24h, product details cached 7d
- Cache HIT skips SerpAPI call, increments hit_count
- Cache MISS calls SerpAPI then stores result
- `bypassCache` option available for forced refresh
- Query normalization prevents duplicate cache entries

---

### Task 2.2: Optimize Price Sync Cron
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.2, Task 2.1
- **Complexity:** Complex

#### Subtasks:
1. **2.2.1** — Add priority sync query: fetch materials linked to draft/reviewed estimates
   ```sql
   SELECT DISTINCT m.id, m.product_id, m.category
   FROM materials m
   JOIN estimate_line_items eli ON eli.material_id = m.id
   JOIN estimates e ON e.id = eli.estimate_id
   WHERE e.status IN ('draft', 'reviewed')
     AND (m.last_api_sync_at IS NULL OR m.last_api_sync_at < now() - interval '1 day')
   ```
2. **2.2.2** — Add weekly sync query: fetch non-estimate-linked active materials synced >7 days ago
3. **2.2.3** — Implement batch-by-category logic:
   - Group materials by HD category
   - One category search returns multiple product prices
   - Extract individual prices from batch results and update each material
4. **2.2.4** — Add budget guard:
   - Track API calls made this month (count `home_depot_cache` entries created this month)
   - Stop syncing if approaching 80% of monthly budget (4,000 calls)
   - Log warning when budget threshold reached
5. **2.2.5** — Update `materials.last_api_sync_at` after each successful price sync
6. **2.2.6** — Replace per-material `getHomeDepotProduct()` loop with batch category search
7. **2.2.7** — Keep `material_price_history` insert on price change (existing behavior)
8. **2.2.8** — Add structured logging: sync start, priority count, weekly count, API calls used, errors

**Acceptance Criteria:**
- Estimate-linked materials sync daily, others weekly
- Batch-by-category reduces API calls (~43/month vs ~1,500)
- Budget guard prevents overspend
- `last_api_sync_at` updated after sync
- Projected: ~43 calls/month

---

### Task 2.3: Add Cache Cleanup to Cron
- **Agent:** `backend-engineer`
- **Dependencies:** Task 2.1
- **Complexity:** Simple

#### Subtasks:
1. **2.3.1** — Add cleanup step at end of `update-material-prices` cron handler (or existing cleanup cron if one exists)
2. **2.3.2** — Delete from `home_depot_cache WHERE expires_at < now()`
3. **2.3.3** — Log count of deleted entries
4. **2.3.4** — Add optional age limit: delete entries older than 30 days regardless of expiry

**Acceptance Criteria:**
- Expired cache entries cleaned up weekly
- Cleanup logged with deletion count
- No impact on active (non-expired) cache entries

---

## Phase 3: Smart Search & Price Cascade

### Task 3.1: Inline Home Depot Search in MaterialSuggestionPicker
- **Agent:** `frontend-engineer` + `backend-engineer`
- **Dependencies:** Task 2.1
- **Complexity:** Medium
- **Skills:** `bundle-barrel-imports`, `rendering-conditional-render`, `rerender-transitions`, `rerender-memo`, `server-serialization`

#### Backend Subtasks:
1. **3.1.1** — Add `searchAndLinkMaterial(lineItemId, query)` server action in `material-suggestions.ts`:
   - Call `searchHomeDepotProducts({ query })` (uses DB cache)
   - Return **only serializable fields** needed by UI — `server-serialization` (name, price, imageUrl, productId — no full API response)
2. **3.1.2** — Add `saveAndLinkMaterial(lineItemId, productData)` server action:
   - Upsert product into `materials` table (check by `home_depot_product_id`)
   - Set `estimate_line_items.material_id` and `unit_cost`
   - Return updated line item + material

#### Frontend Subtasks:
3. **3.1.3** — Add "Search Home Depot" button using **ternary** — `rendering-conditional-render`:
   ```tsx
   {suggestions.length > 0 ? <SuggestionList ... /> : <SearchFallback ... />}
   ```
4. **3.1.4** — Add search input field pre-filled with line item description
5. **3.1.5** — Memoize search result items — `rerender-memo`:
   ```tsx
   const SearchResultItem = memo(function SearchResultItem({ product, onSelect }) { ... })
   ```
6. **3.1.6** — On select: wrap in `startTransition` — `rerender-transitions`:
   ```tsx
   startTransition(async () => {
     await saveAndLinkMaterial(lineItemId, productData)
     // close picker, update parent
   })
   ```
7. **3.1.7** — Show `isPending` loading state during search and save-and-link (from `useTransition`)
8. **3.1.8** — Direct Lucide imports — `bundle-barrel-imports`:
   ```tsx
   import Search from 'lucide-react/icons/search'
   import ExternalLink from 'lucide-react/icons/external-link'
   ```
9. **3.1.9** — 44px touch targets on search results, dark mode, active states

**Acceptance Criteria:**
- "Search Home Depot" fallback when no catalog match
- Search pre-filled with line item description
- Select saves to catalog + links to line item in one step
- Repeat searches use DB cache (0 additional API calls)
- Memoized result items, ternary conditionals, direct imports
- Server action returns minimal serializable data

---

### Task 3.2: Price Cascade on Sync
- **Agent:** `backend-engineer`
- **Dependencies:** Task 2.2
- **Complexity:** Medium

#### Subtasks:
1. **3.2.1** — Add `cascadePriceUpdates(materialId, newPrice)` function in `app/actions/estimates.ts`:
   - Query `estimate_line_items WHERE material_id = materialId`
   - Join with `estimates` to filter `status IN ('draft', 'reviewed')`
   - Update `unit_cost` on matching line items
   - Return count of updated items
2. **3.2.2** — Add audit logging: insert into `estimate_activity` for each price change (old price -> new price, material name, timestamp)
3. **3.2.3** — Call `cascadePriceUpdates()` from cron after each material price update
4. **3.2.4** — Handle estimate total recalculation:
   - After updating line item costs, recalculate `estimates.total_cost` (or rely on computed column/view if exists)
5. **3.2.5** — Add guard: skip cascade if price change < 1% (avoid noise from rounding)

**Acceptance Criteria:**
- Material price updates cascade to linked draft/reviewed estimate line items
- Approved/archived estimates are NOT affected
- Price changes logged for audit trail
- Estimate totals recalculated after cascade

---

### Task 3.3: Stale Price Warnings
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 3.2
- **Complexity:** Simple
- **Skills:** `bundle-barrel-imports`, `rendering-conditional-render`, `async-parallel`, `rerender-transitions`

#### Subtasks:
1. **3.3.1** — Update `LinkedMaterialBadge`:
   - Accept `lastSyncAt?: string` prop
   - Use **ternary** for indicator color — `rendering-conditional-render`:
     ```tsx
     {isStale ? <span className="bg-amber-500" /> : <span className="bg-green-500" />}
     ```
   - Tooltip: "Price last updated {X days ago}"
2. **3.3.2** — Update `EstimateSummary`:
   - Fetch stale data **in parallel** with other summary data — `async-parallel`:
     ```tsx
     const [staleResult, activityResult] = await Promise.all([
       checkStalePrices(estimateId),
       getEstimateActivity(estimateId)
     ])
     ```
   - Show warning banner using **ternary** (not `&&`):
     ```tsx
     {staleCount > 0 ? <StalePriceBanner count={staleCount} /> : null}
     ```
3. **3.3.3** — "Update Stale Prices" button: wrap in `useTransition` — `rerender-transitions`:
   - `isPending` shows loading spinner on button
   - Non-blocking: user can still interact with rest of page
4. **3.3.4** — Visual distinction: fresh (green dot), stale (amber dot), unlinked (gray dot)
5. **3.3.5** — Direct Lucide imports — `bundle-barrel-imports`:
   ```tsx
   import AlertTriangle from 'lucide-react/icons/alert-triangle'
   import RefreshCw from 'lucide-react/icons/refresh-cw'
   ```
6. **3.3.6** — 44px touch targets, dark mode variants on warning banner and update button

**Acceptance Criteria:**
- Badge shows stale indicator when `last_api_sync_at` > 7 days
- Summary shows stale count warning (ternary conditional)
- Stale data fetched in parallel with other data
- "Update Stale Prices" uses `useTransition` for non-blocking UI
- Direct imports only
- Fresh/stale/unlinked visually distinct

---

### Task 3.4: Apply Pricing Template Material FK Migration
- **Agent:** `backend-engineer`
- **Dependencies:** None
- **Complexity:** Simple

#### Subtasks:
1. **3.4.1** — Write migration: `ALTER TABLE pricing_template_items ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE SET NULL`
2. **3.4.2** — Add partial index: `CREATE INDEX idx_pricing_template_items_material ON pricing_template_items(material_id) WHERE material_id IS NOT NULL`
3. **3.4.3** — Apply migration
4. **3.4.4** — Run `npm run db:gen-types`

**Acceptance Criteria:**
- `pricing_template_items.material_id` FK exists
- Partial index on non-null values
- Types regenerated

---

## Phase 4: Procurement Bridge & Analytics

### Task 4.1: Estimate-to-Procurement Conversion
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.1
- **Complexity:** Medium

#### Subtasks:
1. **4.1.1** — Add `convertEstimateToProcurement(estimateId)` server action in `budget-conversion.ts`:
   - Verify estimate status is `approved`
   - Fetch all line items with `material_id IS NOT NULL`
2. **4.1.2** — For each linked line item: check if `material_assignments` already exists for this estimate+material combo (prevent duplicates)
3. **4.1.3** — Create `material_assignments` records:
   - `material_id` from line item
   - `quantity` from line item (with UOM conversion if needed)
   - `status = 'needed'`
   - `project_id` from estimate's project
   - `notes`: reference to estimate ID and line item description
4. **4.1.4** — Return summary: `{ created: number, skipped: number, errors: string[] }`
5. **4.1.5** — Handle edge cases: line items with zero quantity, materials with null price, already-ordered materials

**Acceptance Criteria:**
- Creates `material_assignments` with `needed` status for linked items
- Prevents duplicate assignments for same estimate
- Skips items without `material_id`
- Returns actionable summary

---

### Task 4.2: Create Orders UI
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 4.1
- **Complexity:** Medium
- **Skills:** `bundle-barrel-imports`, `bundle-dynamic-imports`, `rendering-conditional-render`, `rerender-transitions`, `rerender-memo`

#### Subtasks:
1. **4.2.1** — Add "Create Orders" button using **ternary** — `rendering-conditional-render`:
   ```tsx
   {estimate.status === 'approved' ? <CreateOrdersButton /> : null}
   ```
2. **4.2.2** — Lazy-load the orders confirmation modal — `bundle-dynamic-imports`:
   ```tsx
   const CreateOrdersModal = dynamic(
     () => import('./CreateOrdersModal'),
     { loading: () => null }
   )
   ```
3. **4.2.3** — Modal content: list linked line items with material name, quantity, unit, cost
4. **4.2.4** — Memoize order preview list items — `rerender-memo`:
   ```tsx
   const OrderPreviewItem = memo(function OrderPreviewItem({ item }) { ... })
   ```
5. **4.2.5** — On confirm: wrap in `useTransition` — `rerender-transitions`:
   - `isPending` disables confirm button and shows spinner
   - Non-blocking: modal stays responsive during conversion
6. **4.2.6** — On success: toast "Created {X} material orders" with link to procurement page
7. **4.2.7** — On partial failure: toast with "Created {X}, Skipped {Y}" and error details
8. **4.2.8** — Disable button after successful conversion (or show "Orders Created" badge)
9. **4.2.9** — Direct Lucide imports — `bundle-barrel-imports`:
   ```tsx
   import ShoppingCart from 'lucide-react/icons/shopping-cart'
   import Check from 'lucide-react/icons/check'
   ```
10. **4.2.10** — 44px touch targets on all buttons, dark mode, active states
11. **4.2.11** — Mobile: full-width modal via `ResponsiveModal` pattern

**Acceptance Criteria:**
- "Create Orders" button on approved estimates only (ternary)
- Modal lazy-loaded via `next/dynamic`
- Order preview items memoized
- Conversion uses `useTransition` for non-blocking UI
- Direct imports, no barrel files
- 44px touch targets, dark mode

---

### Task 4.3: Material Cost Analytics
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 1.5
- **Complexity:** Medium
- **Skills:** `bundle-barrel-imports`, `bundle-dynamic-imports`, `rendering-conditional-render`, `rerender-memo`, `js-combine-iterations`

#### Subtasks:
1. **4.3.1** — Add "Material Costs" section to `EstimateSummary` using **ternary** — `rendering-conditional-render`:
   ```tsx
   {linkedCount < totalCount ? <UnlinkedWarning count={totalCount - linkedCount} /> : null}
   ```
2. **4.3.2** — Compute linked/unlinked counts in **single iteration** — `js-combine-iterations`:
   ```tsx
   const { linkedCount, totalCost, unlinkedCount } = useMemo(() =>
     lineItems.reduce((acc, item) => ({
       linkedCount: acc.linkedCount + (item.materialId ? 1 : 0),
       unlinkedCount: acc.unlinkedCount + (item.materialId ? 0 : 1),
       totalCost: acc.totalCost + item.subtotal,
     }), { linkedCount: 0, unlinkedCount: 0, totalCost: 0 }),
     [lineItems]
   )
   ```
3. **4.3.3** — `TradeDonutChart` is already lazy-loaded via `next/dynamic` (confirmed in codebase) — verify it stays that way — `bundle-dynamic-imports`
4. **4.3.4** — Add toggle: "By Trade" / "By Material Type" — material type view groups by category
5. **4.3.5** — Memoize donut chart segments — `rerender-memo` (prevent re-render on toggle unless data changes)
6. **4.3.6** — Add linked/unlinked legend (linked: solid fill, unlinked: gray fill)
7. **4.3.7** — Add total material cost vs. total estimate cost comparison bar
8. **4.3.8** — Direct Lucide imports — `bundle-barrel-imports`:
   ```tsx
   import PieChart from 'lucide-react/icons/pie-chart'
   import AlertCircle from 'lucide-react/icons/alert-circle'
   ```
9. **4.3.9** — Mobile responsive layout, dark mode variants

**Acceptance Criteria:**
- "X of Y items linked" progress bar visible
- Stats computed in single iteration (no filter + map chains)
- Trade donut chart lazy-loaded, segments memoized
- Ternary conditionals, direct imports
- Unlinked items visually flagged
- Mobile responsive, dark mode

---

### Task 4.4: Price Trend Indicators
- **Agent:** `frontend-engineer`
- **Dependencies:** Task 1.5
- **Complexity:** Simple
- **Skills:** `bundle-barrel-imports`, `rendering-conditional-render`, `rerender-memo`, `rendering-content-visibility`, `server-serialization`

#### Subtasks:
1. **4.4.1** — Add server action `getMaterialPriceTrend(materialId)` in `material-suggestions.ts`:
   - Query `material_price_history` for last 30 days
   - Return **minimal serializable data** — `server-serialization`:
     `{ direction: 'up' | 'down' | 'stable', percentChange: number }` (no raw dataPoints unless sparkline needed)
2. **4.4.2** — Create `PriceTrendBadge` component wrapped in `memo()` — `rerender-memo`:
   ```tsx
   const PriceTrendBadge = memo(function PriceTrendBadge({ direction, percentChange }) {
     return direction === 'up'
       ? <span className="text-red-500">...</span>
       : direction === 'down'
         ? <span className="text-green-500">...</span>
         : <span className="text-gray-400">...</span>
   })
   ```
3. **4.4.3** — Wire `PriceTrendBadge` into `CostLineItemRow` using **ternary** — `rendering-conditional-render`:
   ```tsx
   {materialId ? <PriceTrendBadge ... /> : null}
   ```
4. **4.4.4** — Add tooltip: "Price changed {+X%/-X%} over last 30 days"
5. **4.4.5** — Fetch trend data lazily using Intersection Observer — `rendering-content-visibility`:
   - Only fetch when row scrolls into viewport
   - Prevents N+1 server action calls on page load
6. **4.4.6** — Direct Lucide imports — `bundle-barrel-imports`:
   ```tsx
   import TrendingUp from 'lucide-react/icons/trending-up'
   import TrendingDown from 'lucide-react/icons/trending-down'
   import Minus from 'lucide-react/icons/minus'
   ```

**Acceptance Criteria:**
- 30-day price trend badge on linked items (memoized)
- Color coded: green (down), red (up), gray (stable)
- Lazy-fetched via Intersection Observer (not all at once)
- Server action returns minimal serializable data
- Ternary conditionals, direct imports
- Uses `material_price_history` data (zero API calls)

---

### Task 4.5: UOM Conversion in Matching
- **Agent:** `backend-engineer`
- **Dependencies:** Task 1.3
- **Complexity:** Medium

#### Subtasks:
1. **4.5.1** — Add conversion factors to `lib/materials/category-mapping.ts`:
   ```typescript
   export const UOM_CONVERSION_FACTORS: Record<string, Record<string, number>> = {
     'LF_to_EA_2x4_8ft': { from: 'LF', to: 'EA', factor: 0.125 },  // 1 LF = 0.125 of 8ft stud
     'SF_to_sheet_4x8': { from: 'SF', to: 'EA', factor: 0.03125 },  // 1 SF = 1/32 of 4x8 sheet
     // ... more standard construction conversions
   }
   ```
2. **4.5.2** — Implement `convertQuantity(qty, fromUnit, toUnit, materialSpecs?): { convertedQty, conversionNote }`:
   - Use material specs (dimensions) to determine conversion factor
   - E.g., "100 LF of 2x4" → looks up 8ft stud → 100/8 = 13 each (round up)
   - Return note: "100 LF ≈ 13 each (8ft studs)"
3. **4.5.3** — Wire into `scoreMaterialMatch()`: boost score when units are convertible (not just identical)
4. **4.5.4** — Wire into `convertEstimateToProcurement()`: use converted quantity for material assignments
5. **4.5.5** — Add `conversionNote` to line item display (shown in `CostLineItemRow` tooltip)

**Acceptance Criteria:**
- "100 LF of 2x4" converts to "13 each" (8ft studs)
- Conversion used in matching score (UOM compatibility factor)
- Conversion used in procurement quantity calculation
- Conversion note shown in UI

---

## Task Dependency Graph

```
Phase 1 (Foundation):
  1.1 ──┬──→ 1.4 ──→ 1.5
  1.2 ──┘         ──→ 1.6
  1.3 ──→ 1.4

  Parallel starts: 1.1 + 1.3 (no deps)
  Then: 1.2 (after 1.1)
  Then: 1.4 (after 1.1 + 1.3)
  Then: 1.5 + 1.6 (parallel, after 1.4)

Phase 2 (Caching):
  1.2 ──→ 2.1 ──→ 2.2
              ──→ 2.3

  Sequential: 2.1 → 2.2 (+ 2.3 parallel with 2.2)

Phase 3 (Search + Cascade):
  2.1 ──→ 3.1
  2.2 ──→ 3.2 ──→ 3.3
  (none) → 3.4

  3.1 and 3.4 can start as soon as deps met
  3.3 waits for 3.2

Phase 4 (Procurement + Analytics):
  1.1 ──→ 4.1 ──→ 4.2
  1.5 ──→ 4.3
  1.5 ──→ 4.4
  1.3 ──→ 4.5

  4.1 → 4.2 sequential
  4.3, 4.4, 4.5 can run in parallel (after respective deps)
```

---

## Subtask Summary

| Phase | Tasks | Subtasks | Backend | Frontend |
|-------|-------|----------|---------|----------|
| 1 | 6 | 39 | 22 | 17 |
| 2 | 3 | 19 | 19 | 0 |
| 3 | 4 | 22 | 10 | 12 |
| 4 | 5 | 31 | 10 | 21 |
| **Total** | **18** | **111** | **61** | **50** |

---

## Vercel React Best Practices Applied

Every frontend task must report which rules were applied in output. Rules enforced across all frontend subtasks:

| Rule | Where Applied | Priority |
|------|--------------|----------|
| `bundle-barrel-imports` | All tasks — direct imports from `@/components/ui/Button`, `lucide-react/icons/check` | CRITICAL |
| `bundle-dynamic-imports` | 1.5 (MaterialSuggestionPicker), 4.2 (CreateOrdersModal), 4.3 (TradeDonutChart verified) | CRITICAL |
| `rendering-conditional-render` | All tasks — ternary (`? :`) never `&&` | CRITICAL |
| `async-parallel` | 3.3 (stale + activity fetch), 1.5.9 (material + line item fetch) | CRITICAL |
| `rerender-memo` | 1.5 (CostLineItemRow, LinkedMaterialBadge), 3.1 (SearchResultItem), 4.2 (OrderPreviewItem), 4.4 (PriceTrendBadge) | MEDIUM |
| `rerender-functional-setstate` | 1.5 (onSelectMaterial callback), 1.6 (bulk match state update) | MEDIUM |
| `rerender-transitions` | 1.6 (bulk match), 3.1 (save-and-link), 3.3 (update stale), 4.2 (create orders) | MEDIUM |
| `server-serialization` | 3.1 (search results), 4.4 (price trend) — minimal data to client | HIGH |
| `js-combine-iterations` | 4.3 (single reduce for linked/unlinked/total) | LOW-MEDIUM |
| `rendering-content-visibility` | 4.4 (Intersection Observer for lazy trend fetch) | MEDIUM |

---

## Implementation Notes

- **Agent flow per phase:** `backend-engineer` → `frontend-engineer` → `code-reviewer`
- **Each task is implementable via:** `/kc:impl {task-id}` (e.g., `/kc:impl 1.1`)
- **Build verification:** Run `/kc:build` after each phase
- **Refactoring:** Run `/refactor-code` after each phase
- **Type regeneration:** Required after Tasks 1.1, 1.2, 3.4 (`npm run db:gen-types`)
- **Skill loading:** Load `postgres-best-practices` for backend tasks, `vercel-react-best-practices` for frontend tasks
- **Key existing code:** Many components exist but aren't wired together — prioritize integration over creation
- **Output requirement:** Every frontend task must include `Skills Applied:` line listing rules used
