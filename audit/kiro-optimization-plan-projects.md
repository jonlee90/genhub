# Kiro Optimization Plan: Projects Module

**Generated:** 2026-01-13T10:30:00Z
**Agent:** Kiro Requirement Agent v3.0
**Scope:** Projects list + detail pages
**Status:** Implementation Ready

---

## Executive Summary

### Multi-Agent Analysis Results

**Agents Dispatched:**
- performance-auditor → 7 findings
- db-optimization-agent → 3 findings
- agent-code-reviewer → 6 finding categories

**Total Issues:** 16 raw findings
**De-duplicated:** 10 unique issues
**Prioritized:** 7 issues in roadmap (3 deferred to backlog)

### Performance Health Score: 62/100 (Needs Attention)

**Critical Issues:** 0
**High Priority:** 3
**Medium Priority:** 4
**Low Priority:** 3

### Expected Impact (if all High implemented)

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Detail page load | 2000-3000ms | 400-500ms | 75% faster |
| List page (cached) | 150ms | 10-20ms | 90% faster |
| Database queries (detail) | 18 sequential | 3-4 parallel | 78% reduction |
| Data transferred | 240KB | 45KB | 81% reduction |

---

## Phase 1: Parallel Agent Analysis

### Agent Dispatch Summary

**Dispatched:** 2026-01-13T10:23:00Z
**Completed:** 2026-01-13T10:29:30Z
**Duration:** 6.5 minutes (parallel execution)
**Wall-Clock Savings:** N/A (only 3 agents available, not 4)

### Agent Reports

- `performance-report-projects-2026-01-13-0223.md` (via agent output) - 7 findings
- `db-optimization-report-projects.md` (via agent output) - 3 findings
- `code-review-report-projects.md` (via agent output) - 6 categories

---

## Consolidated Findings

### HIGH PRIORITY Issues (Fix Immediately)

#### ARCH-001: Detail Page Waterfall Query Cascade

**Severity:** HIGH (78% optimization potential)
**Source Agents:** performance-auditor, db-optimization-agent
**Category:** ARCHITECTURE + DATABASE
**Location:** `app/app/projects/[id]/page.tsx:17-494`

**Problem:**
The project detail page executes **18 sequential database queries**, creating a 2000-3000ms waterfall cascade. Only 1 query has dependencies on others; the remaining 17 could run in parallel.

**Current Behavior:**
```typescript
// Sequential execution (2000-3000ms total)
const project = await getProject(id);           // Query 1: 150ms
const tasks = await getTasks(id);               // Query 2: 200ms
const materials = await getMaterials(id);       // Query 3: 180ms
const expenses = await getExpenses(id);         // Query 4: 170ms
const users = await getUsers(taskIds);          // Query 5: 150ms (depends on tasks)
// ... 13 more sequential queries
```

**Query Breakdown:**
1. Main project fetch: 150ms
2-15. Independent queries (tasks, materials, expenses, users, subcontractors, assignees, dependencies, etc.): 1800-2400ms
16-18. Server Action calls (files, photos, team costs): 300-400ms

**Impact:**
- User Experience: 2-3 second wait on every detail page load
- Mobile: 3-4 seconds on 4G connection
- Scalability: Blocks page render until all queries complete

**Root Cause:**
Page performs extensive data fetching in sequential manner despite most queries being independent.

**Recommended Solution:**
Refactor to 3-phase parallel query pattern:

```typescript
async function getProjectData(id: string) {
  // Phase 1: Initial project (required for context)
  const project = await getProject(id); // 150ms

  // Phase 2: Parallel independent queries
  const [
    tasks,
    materials,
    expenses,
    phases,
    team
  ] = await Promise.all([
    getTasks(id),
    getMaterials(id),
    getExpenses(id),
    getPhases(id),
    getTeam(id)
  ]); // 200ms (longest query)

  // Phase 3: Parallel dependent queries
  const taskIds = tasks.map(t => t.id);
  const [
    users,
    assignees,
    dependencies,
    files,
    photos
  ] = await Promise.all([
    getUsers(taskIds),
    getAssignees(taskIds),
    getDependencies(taskIds),
    getFiles(id),
    getPhotos(id)
  ]); // 200ms (longest query)

  // Total: 150 + 200 + 200 = 550ms (vs 2500ms)
}
```

**Expected Improvement:**
- Current: 2000-3000ms
- Target: 400-550ms
- **Improvement: 75-80% faster** (5x speedup)

**Implementation Notes:**
- Agent: backend-engineer
- Breaking change: No
- Risk: Low (logical grouping maintains data integrity)
- Effort: 1-2 hours
- Testing: Verify stats accuracy matches current output

**De-duplication Note:**
This consolidates:
- PERF-PROJ-001 (performance-auditor): "Detail page waterfall cascade"
- DB-PROJ-001 (db-optimization-agent): "getProjectWithStats N+1 pattern"

---

#### API-001: Missing Caching on Server Actions

**Severity:** HIGH (90% database load reduction)
**Source Agents:** performance-auditor
**Category:** API + ARCHITECTURE
**Location:** `app/actions/projects.ts:992-1571`

**Problem:**
Three frequently-called Server Actions have **zero caching**:
- `getProjectsWithStats()` (lines 992-1153) - List page
- `getProjectWithStats()` (lines 1158-1303) - Detail page
- `getProjectTeamCostSummary()` (lines 1336-1571) - Team costs

**Current Behavior:**
```typescript
// NO React.cache() wrapper, NO Next.js 'use cache' directive
export async function getProjectsWithStats(options?: {
  limit?: number;
  offset?: number;
}) {
  const { data: result, error: rpcError } = await supabase
    .rpc('get_projects_with_stats', {
      p_company_id: companyId,
      p_limit: limit,
      p_offset: offset
    });
  // 150ms database query re-executed on EVERY request
}
```

**Impact:**
- List page: 150ms DB query on every page load
- Detail page: 400ms aggregate queries on every load
- Back button: Full reload (no cache benefit)
- Database load: Scales linearly with page views (not users)
- Cost: Increased Supabase usage at scale

**Risk if Unaddressed:**
- Database becomes bottleneck at 100+ concurrent users
- Slow page transitions (back button = 2s wait)

**Recommended Solution:**
Add Next.js 15 caching:

```typescript
// For projects list (short cache, frequent updates)
export async function getProjectsWithStats(options?: {
  limit?: number;
  offset?: number;
}) {
  'use cache';
  cacheLife('minutes'); // Next.js 15: cache for 5 minutes
  cacheTag('projects');

  // ... existing implementation
}

// For project detail (longer cache)
export async function getProjectWithStats(projectId: string) {
  'use cache';
  cacheLife('hours'); // Cache for 1 hour
  cacheTag('projects', `project-${projectId}`);

  // ... existing implementation
}

// Alternative: React.cache for deduplication only
import { cache } from 'react';
export const getProjectById = cache(async (id: string) => {
  // Deduplicates multiple calls in single request
});
```

**Expected Improvement:**
- List page: 150ms → 10ms (15x faster on cache hit)
- Detail page: 400ms → 20ms (20x faster on cache hit)
- Database load: 100% → 10% (**90% reduction** in query executions)

**Implementation Notes:**
- Agent: backend-engineer
- Breaking change: No
- Risk: Low (proper cache invalidation with revalidateTag)
- Effort: 30 minutes
- Testing: Verify cache invalidation on mutations

**Context:**
Projects are read-heavy (10:1 read:write ratio). Caching is critical for performance and cost optimization.

---

#### DB-001: Client-Side Data Aggregations

**Severity:** HIGH (20x CPU reduction)
**Source Agents:** performance-auditor, db-optimization-agent
**Category:** DATABASE + ARCHITECTURE
**Location:** `app/app/projects/[id]/page.tsx:17-494`

**Problem:**
The detail page executes **300+ lines of JavaScript data transformations** on the server, processing 100+ tasks, materials, and expenses in nested loops. This runs on every request due to no caching (see API-001).

**Current Behavior:**
```typescript
// Lines 169-176: Attach phase info to tasks (nested loop)
if (project.tasks && project.project_phases) {
  (project.tasks as any[]).forEach((task: any) => {
    if (task.phase_id) {
      task.phase = project.project_phases.find((p: any) => p.id === task.phase_id) || null;
    }
  });
}

// Lines 221-236: Attach assignees to tasks (nested loop)
(project.tasks as any[]).forEach((task: any) => {
  const taskAssigns = taskAssignees.filter(ta => ta.task_id === task.id);
  task.assignees = taskAssigns.map(ta => ({
    // ... complex mapping logic
  }));
});

// Lines 245-259: Aggregate material stats per task
const statsByTask = materialStats.reduce((acc: any, stat: any) => {
  if (!acc[stat.task_id]) {
    acc[stat.task_id] = { count: 0, totalCost: 0 };
  }
  acc[stat.task_id].count += 1;
  acc[stat.task_id].totalCost += Number(stat.total_cost || 0);
  return acc;
}, {});

// Total: 300+ lines of data processing, O(n²) complexity in places
```

**Impact:**
- Performance: 50-100ms CPU time for 100 tasks (200-400ms on mobile)
- Scalability: O(n²) complexity on some aggregations (tasks × assignees)
- Maintainability: 574-line function is difficult to optimize or refactor

**Risk if Unaddressed:**
- Large projects (500+ tasks) will cause noticeable lag
- Mobile devices will struggle with CPU-intensive processing

**Recommended Solution:**
Move aggregations to database level (follow existing pattern from `get_projects_with_stats`):

1. **Create database function `get_project_detail_with_stats(p_project_id UUID)`**
   - Pre-aggregate task stats, material stats, expense stats
   - Return denormalized JSON with all needed data
   - Similar to existing `get_projects_with_stats()` RPC function

2. **Simplify page to single RPC call:**
```typescript
async function getProjectData(id: string) {
  const { data: projectDetail } = await supabase
    .rpc('get_project_detail_with_stats', { p_project_id: id });

  // Minimal processing, all aggregations done in database
  return projectDetail;
}
```

**Expected Improvement:**
- CPU time: 100ms → 5ms (20x faster)
- Database query: 400ms → 150ms (2.5x faster due to single optimized query)
- Code complexity: 574 lines → 100 lines (5.7x reduction)

**Implementation Notes:**
- Agent: backend-engineer (database function creation)
- Breaking change: No
- Risk: Low (follow proven pattern from list page)
- Effort: 2-3 hours (create function + migration + test)
- Testing: Verify aggregations match existing output

**Context:**
This is the most complex page in the app. Optimizing it will set pattern for other detail pages.

**De-duplication Note:**
This consolidates:
- PERF-PROJ-003 (performance-auditor): "Client-side data transformations"
- DB-PROJ-002 (db-optimization-agent): "Client-side filtering in detail page"

---

### MEDIUM PRIORITY Issues

#### FE-001: No Pagination UI on Projects List

**Severity:** MEDIUM (future scalability)
**Source Agents:** performance-auditor
**Category:** FRONTEND + UX
**Location:** `app/app/projects/page.tsx:35-36`, `app/actions/projects.ts:992-1000`

**Problem:**
The projects list page has pagination support in the Server Action (default limit=20, offset=0), but no UI for users to navigate pages. Users with 21+ projects cannot see all projects.

**Current Behavior:**
```typescript
// app/actions/projects.ts:992-1000
export async function getProjectsWithStats(options?: {
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit ?? 20;  // Hard-coded default
  const offset = options?.offset ?? 0;
  // ... fetches only 20 projects

// app/app/projects/page.tsx:35-36
const { projects, error } = await getProjectsWithStats();
// No options passed, always fetches first 20
```

**Impact:**
- User Experience: Users cannot see projects beyond first 20
- Scalability: Works fine now (current max: 12 projects), but will be problem at 50+ projects
- Workaround risk: Users may create duplicate projects because they can't find existing ones

**Recommended Solution:**
Add pagination UI in ProjectsPageClient component:

```typescript
<Pagination
  currentPage={page}
  totalPages={Math.ceil(totalCount / 20)}
  onPageChange={(newPage) => {
    // Server Action to refetch with new offset
  }}
/>
```

Also return `totalCount` from Server Action for proper pagination.

**Expected Improvement:**
- User can access all projects
- Better scalability for companies with 50+ projects

**Implementation Notes:**
- Agent: frontend-engineer
- Breaking change: No
- Risk: Low
- Effort: 2-3 hours (backend + frontend)
- Priority: Medium (not urgent, current max is 12 projects)

---

#### API-002: Over-Fetching in Detail Page Joins

**Severity:** MEDIUM (3.2x data reduction)
**Source Agents:** performance-auditor
**Category:** API + OVER_FETCHING
**Location:** `app/app/projects/[id]/page.tsx:62-104`

**Problem:**
The initial project query fetches ALL fields from projects table and nested relations (100+ columns), but many fields are unused or only needed conditionally.

**Current Behavior:**
```typescript
// Lines 62-104: Massive select with nested relations
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,  // All 20+ project columns
    project_phases(...),  // 8 fields per phase
    project_team(...),    // 6 fields per member
    tasks(...)            // 18 fields per task
  `)
  .eq('id', id)
  .single();

// Fetches 100+ total columns across all relations
// But many are unused (e.g., task.description in overview, task.blocked_reason until clicked)
```

**Impact:**
- Performance: 50-80KB initial payload
- Network: Mobile users on slow connections download unnecessary data
- Parse time: 50ms to parse large JSON payload

**Recommended Solution:**
Split query by tab needs:
- Overview tab: Fetch minimal task fields (id, status, phase_id, due_date)
- Tasks tab: Fetch full task details on tab switch (lazy load)
- Files tab: Fetch files on tab switch

```typescript
// Initial load: minimal data
const { data: project } = await supabase
  .from('projects')
  .select(`
    id, name, status, budget, start_date, end_date,
    project_phases(id, name, status, order_index),
    tasks(id, status, phase_id, due_date, planned_cost, actual_cost)
  `)
  .eq('id', id)
  .single();

// Tasks tab: full task details
const { data: fullTasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', id);
```

**Expected Improvement:**
- Initial payload: 80KB → 25KB (3.2x reduction)
- Parse time: 50ms → 15ms (3.3x faster)

**Implementation Notes:**
- Agent: backend-engineer
- Breaking change: No
- Risk: Low
- Effort: 1-2 hours
- Context: GenHub is mobile-first PWA, minimize initial payload

---

#### CODE-001: Excessive `any` Type Usage (43 occurrences)

**Severity:** MEDIUM (type safety)
**Source Agents:** agent-code-reviewer
**Category:** CODE_QUALITY + TYPE_SAFETY
**Locations:** Multiple files

**Problem:**
43 occurrences of `any` type across components, actions, and API routes reduce type safety and increase risk of runtime errors.

**Examples:**
```typescript
// components/projects/CreateProjectForm.tsx:89
project?: any; // Should be: ProjectsRow

// components/projects/ProjectDetailContent.tsx:48,65-70
project: any;
taskDependencies?: any[];

// app/actions/projects.ts:344,1029,1042
createdTasks as any
const projects = (result || []) as any[];

// app/api/project-files/upload/route.ts:83,86
category: (category || 'general') as any,
```

**Impact:**
- Type Safety: No compile-time checks for shape of data
- Maintainability: Harder to refactor without breaking changes
- Developer Experience: No IntelliSense/autocomplete

**Recommended Solution:**
Create proper TypeScript interfaces and use database types:

```typescript
// types/components/projects.ts
import type { ProjectsRow, TasksRow } from '@/types/db/tables';

export interface ProjectWithRelations extends ProjectsRow {
  tasks?: TasksRow[];
  project_phases?: ProjectPhase[];
  project_team?: ProjectTeamMember[];
}

export interface ProjectDetailProps {
  project: ProjectWithRelations;
  taskDependencies?: TaskDependency[];
  projectFiles?: ProjectFile[];
  projectPhotos?: ProjectPhoto[];
}
```

**Expected Improvement:**
- Type Safety: 100% of props properly typed
- Developer Experience: Full IntelliSense support
- Refactoring: Safer, compiler-assisted changes

**Implementation Notes:**
- Agent: frontend-engineer
- Breaking change: No
- Risk: Low
- Effort: 1-2 hours
- Priority: Medium (improves maintainability)

---

#### CODE-002: Duplicate Utility Functions

**Severity:** MEDIUM (maintainability)
**Source Agents:** agent-code-reviewer
**Category:** CODE_QUALITY + DUPLICATION
**Locations:** Multiple files

**Problem:**
`formatCurrency` and `formatDate` functions duplicated across 3 files each, leading to maintenance burden and inconsistency risk.

**Duplicated Functions:**
- `formatCurrency`: TeamCostSummaryCard, ProjectOverview, ProjectTeam
- `formatDate`: ProjectOverview, PhaseStation, ModelManagementPanel

**Recommended Solution:**
Move to `/lib/utils.ts`:

```typescript
// Add to /lib/utils.ts
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });}
```

Then import in components:
```typescript
import { formatCurrency, formatDate } from '@/lib/utils';
```

**Expected Improvement:**
- Code Duplication: 6 copies → 1 shared function
- Maintainability: Single source of truth
- Consistency: All formatting uses same logic

**Implementation Notes:**
- Agent: frontend-engineer
- Breaking change: No
- Risk: Low
- Effort: 30 minutes
- Priority: Medium

---

### LOW PRIORITY Issues (Backlog)

#### CODE-003: Large Component Files (5 files > 600 lines)

**Severity:** LOW (maintainability)
**Source Agents:** agent-code-reviewer

**Files:**
1. CreateProjectForm.tsx - 1,086 lines
2. SpatialViewer.tsx - 816 lines
3. PhaseDetailPanel.tsx - 716 lines
4. ProjectDetailContent.tsx - 666 lines
5. ProjectsPageClient.tsx - 565 lines

**Recommendation:**
- Files are well-structured despite size
- Only split if they grow beyond 1,200 lines
- CreateProjectForm could be split into form sections
- Monitor growth, no immediate action required

---

#### CODE-004: Missing JSDoc Comments

**Severity:** LOW (documentation)
**Source Agents:** agent-code-reviewer

**Location:** All 11 exported functions in `app/actions/projects.ts`

**Recommendation:**
Add JSDoc comments documenting parameters, return types, permissions, side effects.

**Example:**
```typescript
/**
 * Creates a new project with optional template-based phases and tasks
 *
 * @param formData - Form data containing project details
 * @returns Success response with project data or error message
 *
 * @requires Admin or Project Manager role
 * @triggers Database trigger for phase/task creation if template exists
 */
export async function createProject(formData: FormData) {
  // ...
}
```

**Effort:** 2 hours

---

#### CODE-005: Console Logging (393 occurrences)

**Severity:** LOW (production hygiene)
**Source Agents:** agent-code-reviewer

**Analysis:**
- Most logs are debug/info level
- Properly structured with context prefixes: `[createProject]`, `[POST /api/...]`
- No sensitive data exposure detected

**Recommendation:**
- Consider structured logging library for production
- Add log level environment variable control
- Keep current console.error calls for error tracking

---

## Prioritization Matrix

```
HIGH IMPACT, MEDIUM EFFORT (Critical Path)
┌────────────────────────────────────────────┐
│ ARCH-001: Refactor waterfall (1-2h, 75%)  │ ← START HERE
│ API-001: Add caching (30m, 90% DB ↓)      │
│ DB-001: Move aggregations to DB (2-3h)    │
└────────────────────────────────────────────┘

MEDIUM IMPACT, LOW-MEDIUM EFFORT
┌────────────────────────────────────────────┐
│ FE-001: Add pagination UI (2-3h)          │
│ API-002: Reduce over-fetching (1-2h)      │
│ CODE-001: Fix any types (1-2h)            │
│ CODE-002: Consolidate utilities (30m)     │
└────────────────────────────────────────────┘

LOW PRIORITY (Backlog)
┌────────────────────────────────────────────┐
│ CODE-003: Monitor large files             │
│ CODE-004: Add JSDoc comments (2h)         │
│ CODE-005: Structured logging              │
└────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Critical Performance Fixes (4-6 hours)
**Impact:** 75-90% performance improvement on most-used features
**Priority:** CRITICAL (before launch)

| Issue ID | Description | Effort | Impact | Agent |
|----------|-------------|--------|--------|-------|
| ARCH-001 | Refactor detail page waterfall | 1-2h | 75% faster | backend-engineer |
| API-001 | Add Server Action caching | 30m | 90% DB load ↓ | backend-engineer |
| DB-001 | Move aggregations to database | 2-3h | 20x CPU ↓ | backend-engineer |

**Sequential Order:**
1. API-001 (caching) - Immediate win, enables testing of other optimizations
2. ARCH-001 (waterfall) - Biggest latency reduction
3. DB-001 (aggregations) - Complements ARCH-001, reduces CPU load

**Success Criteria:**
- Detail page load: 2500ms → <500ms
- List page (cached): 150ms → <20ms
- Database queries: 18 sequential → 3-4 phases
- CPU processing: 100ms → <10ms

---

### Phase 2: UX & Code Quality (4-6 hours)
**Impact:** Improved scalability and maintainability
**Priority:** MEDIUM (next sprint)

| Issue ID | Description | Effort | Impact | Agent |
|----------|-------------|--------|--------|-------|
| FE-001 | Add pagination UI | 2-3h | Scalability | frontend-engineer |
| API-002 | Optimize detail joins | 1-2h | 3.2x data ↓ | backend-engineer |
| CODE-001 | Fix any types | 1-2h | Type safety | frontend-engineer |
| CODE-002 | Consolidate utilities | 30m | DRY principle | frontend-engineer |

**Sequential Order:**
1. CODE-002 (utilities) - Quick win, improves consistency
2. CODE-001 (types) - Better developer experience
3. API-002 (over-fetching) - Mobile bandwidth savings
4. FE-001 (pagination) - Enables >20 projects

---

### Phase 3: Nice-to-Have (Backlog)

| Issue ID | Description | Effort | Priority |
|----------|-------------|--------|----------|
| CODE-003 | Monitor large files | Ongoing | LOW |
| CODE-004 | Add JSDoc comments | 2h | LOW |
| CODE-005 | Structured logging | 3-4h | LOW |

---

## Agent Workflow

### Phase 1: Analysis (COMPLETE) ✅
```
✅ performance-auditor (6.5 min)
✅ db-optimization-agent (6.5 min)
✅ agent-code-reviewer (6.5 min)
✅ Kiro (synthesis) (2 min)
```

**Total Phase 1 Time:** ~9 minutes (parallel execution)

### Phase 2: Implementation (Sequential)

#### For HIGH Priority Issues:

**Issue ARCH-001:**
```
1. backend-engineer → Refactor to 3-phase parallel pattern
2. Test detail page load time (target: <500ms)
3. Verify data accuracy
```

**Issue API-001:**
```
1. backend-engineer → Add 'use cache' + cacheLife directives
2. Add revalidateTag to mutations
3. Test cache hit/miss behavior
4. Monitor database query reduction
```

**Issue DB-001:**
```
1. backend-engineer → Create get_project_detail_with_stats() RPC function
2. Create migration file
3. Update getProjectData() to use new function
4. Test aggregations match existing output
```

### Phase 3: Final Verification

```
1. Run full build → Verify no errors
2. Run performance benchmarks → Measure improvement
3. Generate final report → Document results
```

---

## Performance Guardrails

### Database Query Rules
- ✅ Use indexes for all WHERE/JOIN/ORDER BY columns
- ✅ Aggregate in DB, not application layer
- ✅ Use database functions for complex logic
- ✅ Batch queries when possible (avoid N+1)
- ❌ Never SELECT * in production queries
- ❌ Never fetch entire tables without pagination
- ❌ Never do client-side joins or aggregations on large datasets

### API Design Rules
- ✅ Design endpoints around use cases, not database tables
- ✅ Return exactly the data needed (no over-fetching)
- ✅ Use HTTP caching headers where applicable
- ✅ Implement pagination for list endpoints (limit 50 default)
- ❌ Never create separate endpoints for every tiny data need
- ❌ Never return sensitive data that won't be displayed

### Architecture Rules
- ✅ Fetch data in parallel when dependencies allow
- ✅ Use Server Components for data fetching when possible
- ✅ Keep Server Actions thin (orchestration, not logic)
- ✅ Cache read-heavy operations (10:1 read:write ratio)
- ❌ Never create waterfall data fetches
- ❌ Never duplicate data fetching logic across components

---

## Estimated Gains (All High + Medium)

### Performance Metrics

| Metric | Baseline | After High | After Medium | Total Improvement |
|--------|----------|------------|--------------|-------------------|
| Detail page load | 2500ms | 500ms | 400ms | **84% faster** |
| List page (cached) | 150ms | 15ms | 15ms | **90% faster** |
| DB queries (detail) | 18 | 4 | 3 | **83% reduction** |
| Data transfer (detail) | 80KB | 80KB | 25KB | **69% reduction** |
| CPU processing | 100ms | 10ms | 5ms | **95% reduction** |

### User Experience Impact

**Mobile (4G Connection):**
- Detail page: 3000ms → 600ms (2.4s faster)
- List page: 200ms → 30ms (170ms faster)
- Perceived performance: Slow → Fast
- Bandwidth saved: 55KB/page × 50 views/day = 2.75MB/day

**Desktop:**
- Detail page: 2500ms → 400ms (2.1s faster)
- List page: 150ms → 15ms (135ms faster)
- Back button: Instant (cached)

### Business Impact

**Scalability:**
- Current: 20 projects, 150ms queries
- With optimizations: 200 projects, 15ms queries
- Headroom: 10x data growth without degradation

**Cost Optimization:**
- Database queries: 90% reduction = better resource utilization
- Bandwidth: 69% reduction on detail page
- Server CPU: 95% reduction on aggregations

**User Retention:**
- Faster pages = better UX = higher engagement
- Mobile-first optimization critical for field teams

---

## Success Criteria

This optimization plan is **complete** when:

### Code Quality
- [ ] All HIGH issues resolved
- [ ] All MEDIUM issues implemented or scheduled
- [ ] Build passes with no errors
- [ ] Type check passes with no errors

### Performance
- [ ] Detail page load ≤ 500ms (target: 400ms)
- [ ] List page (cached) ≤ 20ms (target: 15ms)
- [ ] Database queries reduced by ≥ 75% (target: 83%)
- [ ] Data transfer reduced by ≥ 60% (target: 69%)

### Quality Gates
- [ ] All implementations tested for correctness
- [ ] No security regressions (Supabase advisors clean)
- [ ] No breaking changes (backward compatibility maintained)
- [ ] Mobile PWA performance improved

---

## Appendix A: Agent Reports Reference

### Performance Auditor Report
**Findings:** 7 issues
- HIGH: Waterfall cascade, missing caching, client transforms
- MEDIUM: No pagination, over-fetching, bundle analysis
- LOW: Suspense unused

### Database Optimization Report
**Findings:** 3 issues
- MEDIUM: N+1 pattern, client-side filtering
- LOW: Sequential scan ratio (4 rows only)
- ✅ POSITIVE: get_projects_with_stats() already optimized (24ms)

### Code Review Report
**Findings:** 6 categories
- MEDIUM: 43 any types, duplicate utilities
- LOW: Large files, missing JSDoc, console logging
- ✅ OVERALL: Production-ready, zero CRITICAL/HIGH violations

---

## Appendix B: De-duplication Map

Issues found by multiple agents (consolidated):

| Consolidated ID | Sources | Description |
|-----------------|---------|-------------|
| ARCH-001 | performance-auditor (PERF-PROJ-001), db-optimization-agent (DB-PROJ-001) | Detail page waterfall + N+1 pattern |
| DB-001 | performance-auditor (PERF-PROJ-003), db-optimization-agent (DB-PROJ-002) | Client-side aggregations |

**Total raw findings:** 16
**After de-duplication:** 10 unique issues

---

## Appendix C: Implementation Handoff Protocol

### For backend-engineer:

**Files to Modify:**
- `app/actions/projects.ts` (add caching, refactor functions)
- `app/app/projects/[id]/page.tsx` (refactor getProjectData)
- Create migration: `supabase/migrations/YYYYMMDDHHMMSS_optimize_project_detail_stats.sql`

**Skills to Load:**
- `.claude/skills/backend/server-action.md`
- `.claude/skills/database/query-optimization.md`
- `.claude/skills/database/postgres-functions.md`

### For frontend-engineer:

**Files to Modify:**
- `components/projects/ProjectsPageClient.tsx` (add pagination)
- Multiple files for type fixes and utility consolidation
- `/lib/utils.ts` (add shared utilities)
- `/types/components/projects.ts` (create type definitions)

**Skills to Load:**
- `.claude/skills/frontend/component-patterns.md`
- `.claude/skills/frontend/typescript-patterns.md`

---

**Report Status:** READY FOR IMPLEMENTATION
**Next Action:** Begin Phase 1 implementations (ARCH-001, API-001, DB-001)
**Estimated Total Time:** 4-6 hours (Phase 1)
**Expected Performance Gain:** 75-84% across all metrics