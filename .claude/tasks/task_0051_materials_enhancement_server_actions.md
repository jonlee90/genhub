# Task 0051: Materials Enhancement - Server Actions

**Date:** 2026-01-04
**Status:** 🔵 **PENDING**
**Agent:** agent-backend-engineer
**Estimated Effort:** 3-4 hours

---

## Overview

Implement server actions for the Materials Page Enhancement feature, including paginated task-linked materials queries, tracked materials with price changes, tracking toggle, summary statistics, and manual lead time updates.

---

## Prerequisites

- [x] Design document approved
- [x] Requirements approved
- [ ] Task 0050 completed (database schema exists)
- [ ] TypeScript types generated (`tracked_materials`, `material_price_history`)
- [ ] Supabase client configured in `utils/supabase/server.ts`

---

## Subtasks

### 1. Implement `getTaskLinkedMaterials()`

**File:** `app/actions/materials.ts`

- [ ] Add function signature with pagination params
- [ ] Input validation with Zod (page >= 1, limit: 6-24)
- [ ] Get authenticated user and company_id
- [ ] Build aggregation query:
  - JOIN materials with material_assignments
  - SUM(quantity) as total_quantity
  - COUNT(DISTINCT task_id) as task_count
  - Subquery: Check if user tracks this material (is_tracked)
- [ ] Apply pagination (OFFSET/LIMIT)
- [ ] Get total count for pagination
- [ ] Return typed response: `{ data?: { materials, total }, error? }`
- [ ] Add error handling and logging
- [ ] Test with sample data (0, 11, 12, 13, 24 materials)

### 2. Implement `getTrackedMaterials()`

**File:** `app/actions/materials.ts`

- [ ] Add function signature (no params, user-scoped)
- [ ] Get authenticated user
- [ ] Build price change query:
  - JOIN tracked_materials with materials
  - Subquery: Get price from 7 days ago (previous_price)
  - Calculate price_change_percent in application logic
- [ ] Limit to 10 results (max tracked)
- [ ] Return typed response: `{ data?: TrackedMaterial[], error? }`
- [ ] Add error handling and logging
- [ ] Test with 0, 5, 10 tracked materials

### 3. Implement `toggleTracking()`

**File:** `app/actions/materials.ts`

- [ ] Add function signature: `(material_id, track: boolean)`
- [ ] Input validation with Zod (material_id: uuid, track: boolean)
- [ ] Get authenticated user and company_id
- [ ] If `track === true`:
  - [ ] Check current tracking count (< 10)
  - [ ] Verify material exists and is in user's company
  - [ ] Insert into tracked_materials (trigger enforces limit)
  - [ ] Record baseline price in material_price_history
  - [ ] Handle duplicate insert error (material already tracked)
- [ ] If `track === false`:
  - [ ] Delete from tracked_materials (user_id + material_id)
  - [ ] Verify deletion succeeded
- [ ] Revalidate `/app/materials` path
- [ ] Return typed response: `{ success: boolean, error? }`
- [ ] Add error handling and logging
- [ ] Test edge cases: track 11th, track duplicate, untrack non-tracked

### 4. Implement `getMaterialSummaryStats()`

**File:** `app/actions/materials.ts`

- [ ] Add function signature (no params, company-scoped)
- [ ] Get authenticated user and company_id
- [ ] Build aggregation query:
  - `total_materials_linked`: COUNT(DISTINCT material_id) from material_assignments
  - `total_estimated_cost`: SUM(total_cost) from material_assignments
  - `price_increases_last_7_days`: Subquery count materials with price > previous price
  - `average_lead_time_days`: AVG(lead_time_days) from materials with assignments
- [ ] Return typed response: `{ data?: MaterialSummaryStats, error? }`
- [ ] Add error handling and logging
- [ ] Test with various scenarios (no materials, no price increases, etc.)

### 5. Implement `updateMaterialLeadTime()`

**File:** `app/actions/materials.ts`

- [ ] Add function signature: `(material_id, lead_time_days: number)`
- [ ] Input validation with Zod (material_id: uuid, lead_time_days: 0-365)
- [ ] Get authenticated user and company_id
- [ ] Check user permission (GC/PM only via RLS)
- [ ] Update materials.lead_time_days
- [ ] Revalidate `/app/materials` path
- [ ] Return typed response: `{ success: boolean, error? }`
- [ ] Add error handling and logging
- [ ] Test with valid/invalid lead times

### 6. Add TypeScript Types

**File:** `app/actions/materials.ts`

- [ ] Define `MaterialWithStats` interface
- [ ] Define `TrackedMaterial` interface
- [ ] Define `MaterialSummaryStats` interface
- [ ] Export types for use in UI components

### 7. Write Unit Tests (Optional but Recommended)

- [ ] Test `getTaskLinkedMaterials()` pagination edge cases
- [ ] Test `toggleTracking()` max limit enforcement
- [ ] Test price change calculation logic
- [ ] Test RLS enforcement (user can't track materials in other companies)

---

## Acceptance Criteria

✅ **All Actions Implemented:**
- [ ] `getTaskLinkedMaterials()` returns paginated results
- [ ] `getTrackedMaterials()` returns max 10 materials with price changes
- [ ] `toggleTracking()` adds/removes tracking with validation
- [ ] `getMaterialSummaryStats()` returns 4 metrics
- [ ] `updateMaterialLeadTime()` updates lead time with permission check

✅ **Validation Working:**
- [ ] Invalid inputs return error (not throw exception)
- [ ] Max 10 tracking limit enforced
- [ ] Company isolation enforced (can't track other companies' materials)
- [ ] Material existence verified before tracking

✅ **Performance:**
- [ ] Pagination queries < 100ms (with indexes from Task 0050)
- [ ] Tracked materials query < 50ms (max 10 records)
- [ ] Summary stats query < 200ms (single aggregation)

✅ **Error Handling:**
- [ ] All errors logged with context
- [ ] User-friendly error messages returned
- [ ] No database errors exposed to client
- [ ] All edge cases handled gracefully

✅ **Revalidation:**
- [ ] `/app/materials` path revalidated after tracking changes
- [ ] `/app/materials` path revalidated after lead time updates

---

## Implementation Notes

### Key Technical Details

**1. Pagination Pattern:**
```typescript
const limit = Math.min(Math.max(input.limit, 6), 24); // Clamp to 6-24
const offset = (input.page - 1) * limit;

const { data: materials, count } = await supabase
  .from('materials')
  .select('*, material_assignments(*)', { count: 'exact' })
  .range(offset, offset + limit - 1);

return {
  data: {
    materials: materials || [],
    total: count || 0,
    page: input.page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  },
};
```

**2. Price Change Calculation:**
```typescript
// In database query, get previous_price (from 7 days ago)
// In application logic:
const price_change_percent = previous_price
  ? ((current_price - previous_price) / previous_price) * 100
  : null;
```

**3. Tracking Toggle with Baseline Price:**
```typescript
// When tracking starts, record current price as baseline
if (track) {
  const material = await supabase
    .from('materials')
    .select('unit_price')
    .eq('id', material_id)
    .single();

  await supabase.from('material_price_history').insert({
    company_id,
    material_id,
    price: material.data.unit_price,
    source: 'baseline',
  });
}
```

**4. Company Isolation:**
```typescript
// Always filter by company_id
const { data } = await supabase
  .from('materials')
  .select('*')
  .eq('company_id', company_id)
  .eq('id', material_id)
  .single();

if (!data) {
  return { error: 'Material not found or access denied' };
}
```

### Query Examples

**getTaskLinkedMaterials (Aggregation):**
```sql
SELECT
  m.id as material_id,
  m.product_name,
  m.sku,
  m.category,
  m.unit_price,
  m.stock_status,
  m.product_image_url,
  m.home_depot_product_id,
  SUM(ma.quantity) as total_quantity,
  COUNT(DISTINCT ma.task_id) as task_count,
  EXISTS(
    SELECT 1 FROM tracked_materials
    WHERE material_id = m.id AND user_id = $user_id
  ) as is_tracked
FROM materials m
INNER JOIN material_assignments ma ON ma.material_id = m.id
WHERE m.company_id = $company_id
GROUP BY m.id
ORDER BY total_quantity DESC
LIMIT $limit OFFSET $offset;
```

**getTrackedMaterials (Price Change):**
```sql
SELECT
  m.id as material_id,
  m.product_name,
  m.sku,
  m.unit_price as current_price,
  (
    SELECT price
    FROM material_price_history
    WHERE material_id = m.id
    AND recorded_at <= NOW() - INTERVAL '7 days'
    ORDER BY recorded_at DESC
    LIMIT 1
  ) as previous_price,
  m.product_image_url,
  tm.tracked_at
FROM tracked_materials tm
INNER JOIN materials m ON m.id = tm.material_id
WHERE tm.user_id = $user_id
ORDER BY tm.tracked_at DESC
LIMIT 10;
```

**getMaterialSummaryStats (Aggregation):**
```sql
SELECT
  COUNT(DISTINCT m.id) as total_materials_linked,
  SUM(ma.total_cost) as total_estimated_cost,
  (
    SELECT COUNT(DISTINCT mph.material_id)
    FROM material_price_history mph
    WHERE mph.company_id = $company_id
    AND mph.recorded_at >= NOW() - INTERVAL '7 days'
    AND mph.price > (
      SELECT price
      FROM material_price_history
      WHERE material_id = mph.material_id
      AND recorded_at < mph.recorded_at
      ORDER BY recorded_at DESC
      LIMIT 1
    )
  ) as price_increases_last_7_days,
  AVG(m.lead_time_days) as average_lead_time_days
FROM materials m
INNER JOIN material_assignments ma ON ma.material_id = m.id
WHERE m.company_id = $company_id;
```

---

## Files to Modify/Create

### Modify:
- `app/actions/materials.ts` (add 5 new functions)

### Reference:
- Design Document: Lines 246-435 (API Specification)
- Existing `app/actions/materials.ts` (for patterns)

---

## Testing Instructions

### 1. Test `getTaskLinkedMaterials()` Pagination

```typescript
// In app/app/materials/page.tsx or test file
const result1 = await getTaskLinkedMaterials(1, 12);
console.log('Page 1:', result1.data?.materials.length, 'of', result1.data?.total);

const result2 = await getTaskLinkedMaterials(2, 12);
console.log('Page 2:', result2.data?.materials.length);

// Edge cases
const result3 = await getTaskLinkedMaterials(999, 12); // Out of bounds
console.log('Page 999:', result3.data?.materials.length); // Should be 0
```

### 2. Test `toggleTracking()` Max Limit

```typescript
// Track 10 materials
for (let i = 1; i <= 10; i++) {
  await toggleTracking(materialIds[i], true);
}

// Try to track 11th
const result = await toggleTracking(materialIds[11], true);
console.log('Track 11th:', result.error); // Should fail
```

### 3. Test Price Change Calculation

```typescript
const tracked = await getTrackedMaterials();
console.log('Tracked materials:', tracked.data?.map(m => ({
  name: m.product_name,
  current: m.current_price,
  previous: m.previous_price,
  change: m.price_change_percent,
})));

// Verify percentage calculation:
// If current = 10, previous = 8 → change should be +25%
// If current = 8, previous = 10 → change should be -20%
```

### 4. Test Summary Stats

```typescript
const stats = await getMaterialSummaryStats();
console.log('Summary:', {
  total: stats.data?.total_materials_linked,
  cost: stats.data?.total_estimated_cost,
  increases: stats.data?.price_increases_last_7_days,
  avgLeadTime: stats.data?.average_lead_time_days,
});

// Verify calculations match expected values from database
```

---

## Dependencies

**Depends on:**
- Task 0050 (database schema must exist)
- TypeScript types (`Database`, `Tables`)
- Supabase client (`utils/supabase/server.ts`)
- Auth helper (`next_auth.uid()`)

**Required by:**
- Task 0053 (UI components need these actions)
- Task 0054 (page integration calls these actions)

---

## References

- Design Document: `docs/specs/materials-page-enhancement/design.md`
  - API Specification: Lines 246-497
  - Server Actions: Lines 1632-1667
- Existing Actions: `app/actions/materials.ts`
- DB Schema: `.claude/docs/law/DB_SCHEMA.md`

---

## Success Checklist

Before marking this task complete:

- [ ] All 5 server actions implemented
- [ ] Input validation with Zod
- [ ] Error handling comprehensive
- [ ] RLS enforcement tested
- [ ] Pagination working correctly
- [ ] Max 10 tracking limit enforced
- [ ] Price change calculation accurate
- [ ] Summary stats correct
- [ ] Revalidation paths correct
- [ ] No TypeScript errors
- [ ] All tests passed

---

**Next Task:** Task 0052 - Scheduled Jobs (Daily Price Sync & Cleanup)
