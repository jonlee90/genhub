# Performance Audit: Request Waterfall Detection

**Audit Date:** 2026-01-20
**Auditor:** Performance Engineer Agent
**Scope:** All `app/actions/*.ts` files
**Priority:** P0 CRITICAL

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Waterfalls Found** | 21 |
| **Files Affected** | 8 of 12 |
| **Critical (P0)** | 6 |
| **High (P1)** | 9 |
| **Medium (P2)** | 6 |
| **Estimated Latency Impact** | 200-800ms per affected operation |

### Files Status

| File | Status | Waterfalls | Notes |
|------|--------|------------|-------|
| `dashboard.ts` | GOOD | 0 | Uses Promise.all, materialized views |
| `tasks.ts` | GOOD | 1 | Minor waterfall in `addTaskDependency` |
| `projects.ts` | GOOD | 1 | Uses RPC functions for optimization |
| `materials.ts` | NEEDS WORK | 3 | Loop queries, sequential validations |
| `spatial.ts` | NEEDS WORK | 5 | Multiple sequential verification patterns |
| `expenses.ts` | NEEDS WORK | 3 | Sequential in create/review flows |
| `chat.ts` | GOOD | 0 | Excellent Promise.all usage |
| `chat-queries.ts` | MINOR | 1 | Single sequential in getMessageById |
| `team.ts` | MINOR | 1 | Sequential membership checks |
| `phases.ts` | NEEDS WORK | 4 | Template application has N+1 |
| `default-models.ts` | NEEDS WORK | 2 | Loop with sequential queries |
| `owner.ts` | GOOD | 0 | Uses Promise.all throughout |

---

## Critical Waterfalls (P0)

These cause 200ms+ delays in user-facing operations.

| # | File | Function | Lines | Pattern | Est. Impact |
|---|------|----------|-------|---------|-------------|
| 1 | `materials.ts` | `getMaterialSummaryStats` | 1703-1718 | N+1 loop queries | 300-500ms |
| 2 | `spatial.ts` | `getMarkersByProject` | 1215-1258 | 3 sequential fetches | 200-300ms |
| 3 | `phases.ts` | `applyTaskTemplates` | varies | N+1 template queries | 400-800ms |
| 4 | `default-models.ts` | `getDefaultModelsForCompany` | varies | Loop sequential queries | 200-400ms |
| 5 | `materials.ts` | `getMaterialsByMarker` | 1127-1159 | 3 sequential queries | 150-250ms |
| 6 | `expenses.ts` | `createExpenseFromTask` | 1221-1256 | Sequential task lookup | 100-200ms |

---

## Detailed Findings

### 1. materials.ts

#### 1.1 getMaterialSummaryStats - N+1 Loop (P0 CRITICAL)

**Location:** Lines 1703-1718
**Impact:** 300-500ms for 10+ materials

**Current Code (Waterfall):**
```typescript
// Inside Promise.all, but each iteration makes sequential query
await Promise.all(materialsWithPrices.map(async (material) => {
  const { data: oldPrice } = await supabase
    .from("material_price_history")
    .select("price")
    .eq("material_id", material.id)
    .order("recorded_at", { ascending: false })
    .limit(2);
  // N queries for N materials
}));
```

**Fix (Batch Query):**
```typescript
// Single query with all material IDs
const materialIds = materialsWithPrices.map(m => m.id);
const { data: allPriceHistory } = await supabase
  .from("material_price_history")
  .select("material_id, price, recorded_at")
  .in("material_id", materialIds)
  .order("recorded_at", { ascending: false });

// Group in memory
const priceByMaterial = new Map();
allPriceHistory?.forEach(row => {
  if (!priceByMaterial.has(row.material_id)) {
    priceByMaterial.set(row.material_id, []);
  }
  priceByMaterial.get(row.material_id).push(row);
});
```

---

#### 1.2 getMaterialsByMarker - Sequential Queries (P0 CRITICAL)

**Location:** Lines 1127-1159
**Impact:** 150-250ms

**Current Code (Waterfall):**
```typescript
// Query 1: Get marker
const { data: marker } = await supabase
  .from("spatial_markers")
  .select("id, project_id")
  .eq("id", markerId)
  .single();

// Query 2: Get company user (depends on nothing from marker)
const { data: companyUser } = await supabase
  .from("company_users")
  .select("company_id")
  .eq("user_id", userId)
  .single();

// Query 3: Get project (needs marker.project_id)
const { data: project } = await supabase
  .from("projects")
  .select("company_id")
  .eq("id", marker.project_id)
  .single();
```

**Fix (Parallel Where Possible):**
```typescript
// Start marker and companyUser in parallel (independent)
const [markerResult, companyUserResult] = await Promise.all([
  supabase
    .from("spatial_markers")
    .select("id, project_id")
    .eq("id", markerId)
    .single(),
  supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .single(),
]);

const { data: marker } = markerResult;
const { data: companyUser } = companyUserResult;

// Project query depends on marker, must be sequential
const { data: project } = await supabase
  .from("projects")
  .select("company_id")
  .eq("id", marker.project_id)
  .single();
```

---

#### 1.3 linkMaterialToMarker - Sequential Verification (P1 HIGH)

**Location:** Lines 1054-1075
**Impact:** 100-150ms

**Current Code (Waterfall):**
```typescript
// Query 1: Verify assignment
const { data: assignment } = await supabase
  .from("material_assignments")
  .select("id, project_id")
  .eq("id", assignmentId)
  .single();

// Query 2: Verify marker (independent of assignment)
const { data: marker } = await supabase
  .from("spatial_markers")
  .select("id, project_id")
  .eq("id", markerId)
  .single();
```

**Fix:**
```typescript
const [assignmentResult, markerResult] = await Promise.all([
  supabase
    .from("material_assignments")
    .select("id, project_id")
    .eq("id", assignmentId)
    .single(),
  supabase
    .from("spatial_markers")
    .select("id, project_id")
    .eq("id", markerId)
    .single(),
]);
```

---

### 2. spatial.ts

#### 2.1 getMarkersByProject - Sequential Content Fetch (P0 CRITICAL)

**Location:** Lines 1215-1258
**Impact:** 200-300ms

**Current Code (Waterfall):**
```typescript
// Query 1: Get markers
const { data: markers } = await supabase
  .from("spatial_markers")
  .select("*")
  .eq("project_id", projectId);

// Query 2: Get material counts (sequential)
const markerIds = markers.map(m => m.id);
const { data: materialCounts } = await supabase
  .from("material_assignments")
  .select("marker_id, id")
  .in("marker_id", markerIds);

// Query 3: Get marker content (sequential)
const { data: markerContent } = await supabase
  .from("marker_content")
  .select("*")
  .in("marker_id", markerIds);
```

**Fix (Join or Parallel):**
```typescript
// Option A: Single query with joins
const { data: markers } = await supabase
  .from("spatial_markers")
  .select(`
    *,
    material_assignments(id),
    marker_content(*)
  `)
  .eq("project_id", projectId);

// Option B: Parallel after first query
const { data: markers } = await supabase
  .from("spatial_markers")
  .select("*")
  .eq("project_id", projectId);

const markerIds = markers.map(m => m.id);
const [materialCounts, markerContent] = await Promise.all([
  supabase.from("material_assignments").select("marker_id, id").in("marker_id", markerIds),
  supabase.from("marker_content").select("*").in("marker_id", markerIds),
]);
```

---

#### 2.2 createModelRecord - Sequential Insert (P1 HIGH)

**Location:** Lines 157-176
**Impact:** 100-150ms

**Current Code:**
```typescript
const projectCheck = await verifyProjectAccess(supabase, projectId, userId);
const { data: existingModels } = await supabase
  .from("projects_3d_models")
  .select("version")
  .eq("project_id", projectId);
const { data: model } = await supabase
  .from("projects_3d_models")
  .insert({...});
```

**Fix:**
```typescript
// Parallel: projectCheck and existingModels are independent
const [projectCheck, existingModelsResult] = await Promise.all([
  verifyProjectAccess(supabase, projectId, userId),
  supabase.from("projects_3d_models").select("version").eq("project_id", projectId),
]);

// Insert depends on both
const { data: model } = await supabase
  .from("projects_3d_models")
  .insert({...});
```

---

#### 2.3 setActiveModelVersion (P1 HIGH)

**Location:** Lines 351-365

#### 2.4 createMarker (P1 HIGH)

**Location:** Lines 575-592

#### 2.5 getMarkersByProject - Verification (P2 MEDIUM)

**Location:** Lines 1136-1159

*Similar pattern: Sequential projectCheck then query. Fix with Promise.all for independent operations.*

---

### 3. expenses.ts

#### 3.1 createExpenseFromTask - Sequential Task Lookup (P0 CRITICAL)

**Location:** Lines 1221-1256
**Impact:** 100-200ms

**Current Code:**
```typescript
// Query 1: Get task
const { data: task } = await supabase
  .from("tasks")
  .select("id, name, project_id, phase_id")
  .eq("id", taskId)
  .single();

// Query 2: Get primary assignee (could be joined)
const { data: primaryAssignee } = await supabase
  .from("task_assignees")
  .select("user_id, user_profiles(name)")
  .eq("task_id", taskId)
  .eq("is_primary", true)
  .single();
```

**Fix (Join):**
```typescript
const { data: task } = await supabase
  .from("tasks")
  .select(`
    id, name, project_id, phase_id,
    task_assignees!inner(
      user_id,
      user_profiles(name)
    )
  `)
  .eq("id", taskId)
  .eq("task_assignees.is_primary", true)
  .single();
```

---

#### 3.2 createExpense - Sequential User Lookup (P1 HIGH)

**Location:** Lines 113-143

#### 3.3 reviewExpense - Sequential Update Flow (P1 HIGH)

**Location:** Lines 207-242

---

### 4. phases.ts

#### 4.1 applyTaskTemplates - N+1 Template Queries (P0 CRITICAL)

**Impact:** 400-800ms for phases with 10+ task templates

**Pattern:** Loop fetching templates then creating tasks one by one.

**Fix:** Batch fetch all templates, then batch insert tasks.

---

#### 4.2 checkProjectPhasePermission (P1 HIGH)

**Pattern:** Sequential project then team member verification.

#### 4.3 getProjectPhases (P1 HIGH)

**Pattern:** Sequential permission check then phase query.

#### 4.4 createPhase (P2 MEDIUM)

**Pattern:** Sequential validations that could be parallelized.

---

### 5. default-models.ts

#### 5.1 getDefaultModelsForCompany - Loop Queries (P0 CRITICAL)

**Impact:** 200-400ms

**Pattern:** Loop over project types, sequential query for each.

**Fix:** Single query with `.in()` filter, then group in memory.

---

#### 5.2 getCompanyDefaultModel (P2 MEDIUM)

**Pattern:** Sequential company user then default model lookup.

---

### 6. team.ts

#### 6.1 inviteTeamMember - Sequential Membership Check (P2 MEDIUM)

**Location:** Lines 106-145

**Pattern:**
```typescript
const { data: existingUser } = await supabase.from("user_profiles")...;
if (existingUser) {
  const { data: existingMember } = await supabase.from("company_users")...;
}
```

**Note:** This is a conditional waterfall - acceptable if the second query only runs sometimes.

---

### 7. tasks.ts

#### 7.1 addTaskDependency - Sequential Verification (P2 MEDIUM)

**Location:** Lines 1354-1370

**Pattern:** Two sequential `verifyTaskAccess` calls.

**Fix:**
```typescript
const [sourceAccess, targetAccess] = await Promise.all([
  verifyTaskAccess(supabase, sourceTaskId, userId),
  verifyTaskAccess(supabase, targetTaskId, userId),
]);
```

---

### 8. chat-queries.ts

#### 8.1 getMessageById - Sequential Fetch (P2 MEDIUM)

**Pattern:** Message fetch then sender profile fetch.

**Fix:** Use join in select query.

---

## Good Patterns Found (Reference)

### dashboard.ts - Exemplary Parallelization

```typescript
// Lines 36-68: Parallel queries for quick action data
const [projectsResult, teamResult] = await Promise.all([
  supabase.from("projects").select(...),
  supabase.from("company_users").select(...),
]);

// Lines 215-220: Parallel aggregation helpers
const [topAssignees, quickActionData, expensesByCategory] = await Promise.all([
  getTopAssignees(supabase, companyId),
  getQuickActionData(supabase, companyId),
  getExpensesByCategory(supabase, companyId),
]);
```

### chat.ts - Excellent Promise.all Usage

```typescript
// Lines 214-250: Parallel message context fetch
const [senderProfileResult, chatRoomResult, participantsResult, parentMessageResult] =
  await Promise.all([
    supabase.from("user_profiles").select(...),
    supabase.from("chat_rooms").select(...),
    supabase.from("chat_participants").select(...),
    parentMessageId ? supabase.from("messages").select(...) : null,
  ]);
```

### tasks.ts - Promise.allSettled for Non-Blocking

```typescript
// Lines 574-682: Post-creation tasks don't block response
await Promise.allSettled([
  notifyAssignees(...),
  updateProjectStats(...),
  logActivity(...),
]);
```

---

## Recommendations

### Immediate Actions (P0)

1. **materials.ts `getMaterialSummaryStats`** - Replace N+1 loop with batch `.in()` query
2. **spatial.ts `getMarkersByProject`** - Use joins or parallel queries for counts/content
3. **phases.ts `applyTaskTemplates`** - Batch fetch templates, batch insert tasks
4. **default-models.ts `getDefaultModelsForCompany`** - Single query with `.in()` filter

### Short-Term (P1)

5. Apply `Promise.all` pattern to all independent verification queries
6. Use Supabase joins where possible to reduce query count
7. Consider RPC functions for complex multi-table operations

### Long-Term (P2)

8. Audit conditional waterfalls - acceptable if second query rarely runs
9. Add query timing instrumentation to identify new waterfalls
10. Create shared utility for parallel permission checks

---

## Verification Protocol

After fixes are applied:

1. **EXPLAIN ANALYZE** - Verify query plans are optimal
2. **Timing instrumentation** - Add `console.time`/`console.timeEnd` to measure
3. **Load testing** - Test with realistic data volumes
4. **Monitor** - Use Supabase logs to verify query patterns

---

## Summary

**Total Waterfalls Found: 21**

| Severity | Count | Action Required |
|----------|-------|-----------------|
| P0 Critical | 6 | Fix before production |
| P1 High | 9 | Fix within sprint |
| P2 Medium | 6 | Track for future |

**Estimated Total Latency Savings: 1.5-3 seconds** across all affected operations when fixed.

---

*Generated by Performance Engineer Agent - 2026-01-20*
