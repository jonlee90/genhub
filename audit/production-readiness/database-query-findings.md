# Database Query Analysis Findings

**Audit Date:** 2026-01-20
**Priority:** P1 HIGH
**Status:** ORCHESTRATED=true SKIP_BUILD=true

---

## Executive Summary

| Metric | Value | Severity |
|--------|-------|----------|
| N+1 Patterns Found | 2 | HIGH |
| select() Overuse | 69 instances | MEDIUM |
| Missing Indexes (per advisors) | 17 unindexed foreign keys | HIGH |
| Unused Indexes | 94 indexes | LOW |
| RLS Performance Issues | 108 auth_rls_initplan issues | CRITICAL |
| Multiple Permissive Policies | 20 instances | MEDIUM |
| Complex Queries | ~50+ with joins/filters | MEDIUM |

**Overall Assessment:** Database has critical RLS performance issues and several N+1 patterns. Good index coverage but many unused. Recent optimization migration applied (dashboard_sql_aggregation_optimizations).

---

## CRITICAL ISSUES (P0)

### 1. RLS Performance - auth_rls_initplan (108 instances)

**Issue:** RLS policies re-evaluate `auth.<function>()` for EACH row, causing O(n) performance degradation.

**Impact:** Severe performance issues at scale. Each query with RLS re-executes auth functions per row.

**Sample Affected Tables:**
- `public.companies` - policy: "Authenticated users can create companies"
- `public.user_profiles` - policies: "Users can update their own profile", "Users can insert their own profile"
- `public.task_assignees` - policies: "task_assignees_select", "task_assignees_insert"

**Solution:** Replace `auth.uid()` with `(select auth.uid())` in all RLS policies.

**Example Fix:**
```sql
-- BEFORE (re-evaluates for each row)
CREATE POLICY "task_assignees_select" ON task_assignees
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- AFTER (evaluates once per query)
CREATE POLICY "task_assignees_select" ON task_assignees
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id((select auth.uid())));
```

**Affected Count:** 108 policies across multiple tables

**Recommendation:** Create migration to fix all RLS policies. This is the HIGHEST priority database issue.

---

## HIGH ISSUES (P1)

### 2. N+1 Query Patterns

#### Pattern 1: Push Notifications in Chat (app/actions/chat.ts:394)

**Location:** `/Users/jonathanlee/Desktop/genhub/app/actions/chat.ts:394`

**Code:**
```typescript
await Promise.allSettled(
  participants.map(async (participant) => {
    // ... sends push notification per participant
  })
);
```

**Issue:** Maps over participants and sends individual push notifications in parallel.

**Impact:** MEDIUM - Uses Promise.allSettled which is parallel, but could be batched.

**Status:** ACCEPTABLE - Parallel execution mitigates N+1 impact. Consider batching API if available.

---

#### Pattern 2: Material Price History (app/actions/materials.ts:1704)

**Location:** `/Users/jonathanlee/Desktop/genhub/app/actions/materials.ts:1704-1718`

**Code:**
```typescript
await Promise.all(
  materialsWithPrices.map(async (material: any) => {
    const { data: oldPrice } = await supabase
      .from("material_price_history")
      .select("price")
      .eq("material_id", material.id)
      .lte("recorded_at", sevenDaysAgo.toISOString())
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (oldPrice && oldPrice.price < material.unit_price) {
      priceIncreasesLast7Days++;
    }
  })
);
```

**Issue:** CLASSIC N+1 PATTERN - Queries price history for each material individually.

**Impact:** HIGH - If 100 materials, executes 101 queries (1 for materials + 100 for price history).

**Solution:** Use SQL join or window function to get latest price in single query:
```sql
SELECT
  m.id,
  m.unit_price,
  (
    SELECT price
    FROM material_price_history mph
    WHERE mph.material_id = m.id
      AND mph.recorded_at <= '7 days ago'
    ORDER BY recorded_at DESC
    LIMIT 1
  ) as old_price
FROM materials m
WHERE m.company_id = ?
```

**Recommendation:** Refactor to use lateral join or create RPC function for this aggregation.

---

### 3. Missing Indexes on Foreign Keys (17 instances)

**Source:** Supabase Performance Advisors

Foreign keys without indexes cause slow JOINs and ON DELETE CASCADE operations.

**Affected Foreign Keys:**
```
company_users.invited_by                      (company_users_invited_by_fkey)
expenses.reviewed_by                          (expenses_reviewed_by_fkey)
file_audit_log.performed_by                   (file_audit_log_performed_by_fkey)
material_assignments.assigned_by              (material_assignments_assigned_by_fkey)
materials.created_by                          (materials_created_by_fkey)
model_elements.parent_element_id              (model_elements_parent_element_id_fkey)
project_team.assigned_by                      (project_team_assigned_by_fkey)
project_team.subcontractor_id                 (project_team_subcontractor_id_fkey)
projects.created_by                           (projects_created_by_fkey)
spatial_markers.created_by                    (spatial_markers_created_by_fkey)
spatial_markers.phase_id                      (spatial_markers_phase_id_fkey)
task_activity.user_id                         (task_activity_user_id_fkey)
task_assignees.assigned_by                    (task_assignees_assigned_by_fkey)
tasks.approved_by                             (tasks_approved_by_fkey)
tasks.created_by                              (tasks_created_by_fkey)
team_invitations.invited_by                   (team_invitations_invited_by_fkey)
tracked_materials.company_id                  (tracked_materials_company_id_fkey)
```

**Impact:** Slow JOINs, especially for audit queries (created_by, assigned_by, etc.)

**Recommendation:** Create indexes for high-traffic foreign keys:
```sql
-- Priority: High-traffic audit columns
CREATE INDEX idx_materials_created_by ON materials(created_by);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_approved_by ON tasks(approved_by);

-- Priority: Assignment lookups
CREATE INDEX idx_material_assignments_assigned_by ON material_assignments(assigned_by);
CREATE INDEX idx_task_assignees_assigned_by ON task_assignees(assigned_by);
CREATE INDEX idx_project_team_assigned_by ON project_team(assigned_by);
CREATE INDEX idx_project_team_subcontractor_id ON project_team(subcontractor_id);

-- Priority: Activity/audit trail
CREATE INDEX idx_task_activity_user_id ON task_activity(user_id);
CREATE INDEX idx_file_audit_log_performed_by ON file_audit_log(performed_by);
CREATE INDEX idx_expenses_reviewed_by ON expenses(reviewed_by);

-- Lower priority (hierarchical/spatial)
CREATE INDEX idx_model_elements_parent_element_id ON model_elements(parent_element_id);
CREATE INDEX idx_spatial_markers_phase_id ON spatial_markers(phase_id);
CREATE INDEX idx_spatial_markers_created_by ON spatial_markers(created_by);

-- Company tracking
CREATE INDEX idx_tracked_materials_company_id ON tracked_materials(company_id);
```

---

## MEDIUM ISSUES (P2)

### 4. select() Without Column Specification (69 instances)

**Files Affected:**
```
tasks.ts:                 9 instances
default-models.ts:        3 instances
expenses.ts:              5 instances
subcontractors.ts:        4 instances
materials.ts:             3 instances
chat.ts:                  4 instances
spatial.ts:               9 instances
phases.ts:                6 instances
projects.ts:              5 instances
... 21 files total
```

**Issue:** Using `.select()` without parameters fetches ALL columns, including potentially large JSON/text fields.

**Impact:** Over-fetching data increases network transfer and memory usage.

**Example - Good vs Bad:**
```typescript
// BAD - fetches ALL columns
const { data } = await supabase
  .from('tasks')
  .select()
  .eq('project_id', projectId);

// GOOD - only needed columns
const { data } = await supabase
  .from('tasks')
  .select('id, title, status, due_date, assignee_id')
  .eq('project_id', projectId);
```

**Recommendation:** Audit each `.select()` call and specify only needed columns. Priority areas:
1. List views (task lists, project lists) - only need summary fields
2. Search/autocomplete - minimal fields
3. Nested queries - avoid over-fetching joined data

---

### 5. Multiple Permissive Policies (20 instances)

**Issue:** Tables have multiple SELECT policies for same role, causing OR condition evaluation overhead.

**Sample:**
```
company_users: Multiple policies for anon/authenticated/etc roles:
  - "Users can view company members"
  - "company_users_select"
```

**Impact:** MEDIUM - Postgres must evaluate all policies with OR logic.

**Recommendation:** Consolidate duplicate policies into single policy per action per role.

---

### 6. Complex Queries with Joins/Filters (~50+ instances)

**Sample from grep results:**
```
chat-queries.ts:    Multiple .order(), .filter() chains
chat-search.ts:     Complex .or() searches across entities
chat.ts:            Nested filters with entity references
dashboard.ts:       Multi-level joins with sorting
expenses.ts:        Category/status filtering with aggregations
materials.ts:       Price tracking with date comparisons
```

**Characteristics:**
- Chained `.order()`, `.filter()`, `.or()`, `.and()` methods
- Client-side filtering with `.filter()` after fetch
- Multiple sort operations

**Example - Client-side filtering:**
```typescript
// From chat-queries.ts:318
.filter(id => id && !senderIds.has(id));

// From dashboard.ts:99
.filter((t) => t.user_profiles)
```

**Impact:** MEDIUM - Client-side filtering requires fetching more data than needed.

**Recommendation:** Push filtering to SQL WHERE clauses when possible.

---

## LOW ISSUES (P3)

### 7. Unused Indexes (94 instances)

**Note:** These may be unused in CURRENT queries but could be for future optimization or rare queries.

**Sample Unused Indexes:**
```
projects_company_idx              (public.projects)
projects_type_idx                 (public.projects)
idx_message_reactions_lookup      (public.message_reactions)
idx_push_subscriptions_platform   (public.push_subscriptions)
idx_chat_participants_muted       (public.chat_participants)
idx_messages_content_fts          (public.messages) - Full-text search!
idx_tasks_type                    (public.tasks)
```

**Interesting Notes:**
- `idx_messages_content_fts` is a full-text search index but unused - possibly for future chat search feature
- Several `_type` and `_status` indexes unused - may be for filtering

**Impact:** LOW - Unused indexes consume disk space and slow down writes.

**Recommendation:**
1. Monitor index usage in production for 30 days
2. Drop truly unused indexes
3. Keep indexes for known future features (like FTS)

---

## POSITIVE FINDINGS

### Recent Optimizations Applied

**Migration:** `20260120000001_dashboard_sql_aggregation_optimizations.sql`

**Functions Created:**
1. `get_top_assignees(company_id, limit)` - Replaces in-memory JS aggregation
2. `get_expenses_by_category(company_id)` - SQL GROUP BY vs JS loop

**Expected Performance Gain:** 250-500ms on dashboard load

**Assessment:** EXCELLENT - This follows best practice of pushing aggregations to database.

---

## Query Patterns Analysis

### Complex Queries by File

| File | Complexity | Notes |
|------|------------|-------|
| chat.ts (2775 lines) | HIGH | Multi-table joins, entity references, notifications |
| tasks.ts (2775 lines) | HIGH | Dependencies, assignees, spatial markers |
| materials.ts (1804 lines) | HIGH | Price history, assignments, procurement tracking |
| projects.ts (1690 lines) | MEDIUM | Team, phases, type configs |
| expenses.ts | MEDIUM | Line items, categories, approval workflow |

### RPC Usage
- Only 13 RPC calls found across all actions
- Indicates most aggregation still done in JavaScript
- **Opportunity:** More RPC functions like dashboard optimizations

---

## Recommendations Summary

### Immediate (P0) - CRITICAL
1. **Fix all 108 RLS auth_rls_initplan issues** - Wrap all `auth.uid()` calls in `(select auth.uid())`
   - Expected impact: 50-200ms per query at scale
   - Scope: ~108 policies across multiple tables

### Short-term (P1) - HIGH
2. **Fix material price history N+1 pattern** - Use lateral join or RPC
   - Expected impact: 100-500ms for getMaterialSummaryStats
   - File: `app/actions/materials.ts:1704`

3. **Add indexes to top 10 foreign keys** - Prioritize audit/assignment columns
   - Expected impact: 10-50ms per JOIN query
   - List provided in section 3

### Medium-term (P2) - MEDIUM
4. **Audit and fix select() calls** - Specify columns in list views first
   - Expected impact: 10-30% reduction in data transfer
   - 69 instances across 21 files

5. **Consolidate multiple permissive policies** - Merge duplicate SELECT policies
   - Expected impact: 5-15ms per affected query
   - 20 policy duplications

6. **Move client-side filters to SQL** - Push `.filter()` calls to WHERE clauses
   - Expected impact: Reduce over-fetching by 20-40%
   - Scan all `.filter()` calls post-fetch

### Long-term (P3) - LOW
7. **Evaluate unused indexes** - Monitor 30 days, then drop if confirmed unused
   - Expected impact: Faster writes, less disk space
   - 94 unused indexes

8. **Create more RPC functions** - Move complex aggregations to SQL
   - Expected impact: 100-300ms per aggregation
   - Candidate areas: task statistics, project rollups, material tracking

---

## Impact Analysis

### Query Volume Estimate (per typical user session)
- Dashboard load: ~10 queries
- Task list: ~5 queries
- Project detail: ~8 queries
- Chat room: ~6 queries
- Material tracking: ~4 queries

**Total:** ~33 queries per user session

### Performance Gain Estimates

| Fix | Queries Affected | Gain Per Query | Total Gain/Session |
|-----|------------------|----------------|---------------------|
| RLS fix | ~80% (26/33) | 50-200ms | 1.3-5.2s |
| Foreign key indexes | ~40% (13/33) | 10-50ms | 130-650ms |
| Material N+1 fix | 1 (dashboard) | 100-500ms | 100-500ms |
| select() optimization | ~60% (20/33) | 5-20ms | 100-400ms |

**Total Potential Gain:** 1.63-6.75 seconds per user session

---

## Testing Recommendations

### Performance Benchmarks
1. Measure query times BEFORE fixes:
   ```sql
   EXPLAIN ANALYZE SELECT ...
   ```

2. Track metrics:
   - Query execution time
   - Rows scanned vs returned
   - Index usage (seq scans vs index scans)

3. Load testing:
   - 100 concurrent users
   - Dashboard + task list workflow
   - Monitor query queue depth

### Validation Queries
```sql
-- Check for sequential scans (should be minimal)
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC
LIMIT 20;

-- Verify RLS policy changes
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE qual LIKE '%auth.%'
  AND qual NOT LIKE '%(select auth.%';

-- Check index usage after fixes
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Migration Plan

### Phase 1: RLS Fixes (Day 1)
```sql
-- Create migration: 20260121000001_fix_rls_auth_initplan.sql
-- Fix all 108 RLS policies
-- Test SELECT performance before/after
```

### Phase 2: Critical Indexes (Day 2-3)
```sql
-- Create migration: 20260122000001_add_foreign_key_indexes.sql
-- Add 17 missing foreign key indexes
-- Monitor write performance impact
```

### Phase 3: Application Code (Week 1)
- Fix material price N+1 pattern
- Audit top 20 select() calls
- Add column specifications

### Phase 4: Cleanup (Week 2)
- Consolidate duplicate policies
- Move client filters to SQL
- Document unused indexes for future review

---

## Conclusion

**Status:** PRODUCTION READY with critical RLS fix required before scale.

**Key Findings:**
- ✅ Good index coverage on primary access patterns
- ✅ Recent optimization migrations applied (dashboard RPC functions)
- ⚠️ CRITICAL: 108 RLS policies need `(select auth.uid())` fix
- ⚠️ 17 foreign keys without indexes
- ⚠️ 1 major N+1 pattern in material price history
- ⚠️ 69 over-fetching queries with select()

**Recommended Action:** Fix RLS issues BEFORE production scale. Other issues can be addressed incrementally.

**Estimated Effort:**
- P0 RLS fixes: 4-6 hours (migration creation + testing)
- P1 indexes: 2-3 hours (migration + validation)
- P1 N+1 fix: 2-4 hours (code refactor + testing)
- P2 select() audit: 8-12 hours (across 21 files)

**Total:** 16-25 hours to address P0-P1 issues.
