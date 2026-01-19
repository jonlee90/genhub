# Tasks Module Audit - Consolidated Findings

**Date:** 2026-01-18
**Scope:** Tasks Module (47+ components, 3 server action files, 5 pages)

---

## Executive Summary

| Severity | Count | Categories |
|----------|-------|------------|
| CRITICAL | 6 | React.cache, useEffect deps, N+1 loops, blocking logs |
| HIGH | 10 | Bundle imports, async waterfalls, component size, type safety |
| MEDIUM | 14 | Memoization, design tokens, duplicate patterns |
| LOW | 12 | Documentation, edge cases |

**Estimated Performance Impact:**
- Bundle reduction: ~164KB gzipped
- Latency reduction: 350-1100ms per request
- Page load improvement: 600-800ms

---

## CRITICAL Issues (Fix This Week)

### CRIT-001: getUserContext() Not Cached
**File:** `app/actions/tasks.ts:197` + 23 call sites
**Impact:** 2-5 redundant DB queries per page load (+50-150ms each)
**Fix:** Wrap with `React.cache()`
```typescript
import { cache } from 'react';
const getUserContext = cache(async function getUserContext() {
  // existing implementation
});
```

### CRIT-002: Object Dependencies in useEffect
**File:** `components/tasks/TasksPageClient.tsx:127-135`
**Impact:** Risk of infinite loop, stale closures
**Fix:** Stabilize with useMemo before passing to useEffect

### CRIT-003: N+1 Notification Loops
**Files:** `app/actions/tasks.ts:814, 1242, 1482, 1671`
**Impact:** +200-500ms for 10 notifications (sequential DB inserts)
**Fix:** Batch inserts with single query

### CRIT-004: 55+ Blocking console.log Calls
**File:** `app/actions/tasks.ts` (entire file)
**Impact:** +55-275ms total latency
**Fix:** Wrap with `after()` or conditional dev-only

### CRIT-005: Sequential Activity Logging
**File:** `app/actions/tasks.ts:814-823`
**Impact:** N × 50ms = 250ms for 5 changes
**Fix:** Batch insert activity logs

### CRIT-006: Missing Functional setState
**File:** `components/tasks/TaskBoard.tsx:170-172`
**Impact:** Stale closure risk
**Fix:** Use functional updates in callbacks

---

## HIGH Priority Issues

### HIGH-001: Lucide Barrel Imports (24 files)
**Impact:** ~200KB bundle overhead, +600ms page load
**Fix:** Replace with direct imports `lucide-react/icons/{name}`

### HIGH-002: Sequential Post-Creation Operations
**File:** `app/actions/tasks.ts:591-664`
**Impact:** 300ms sequential vs 150ms parallel
**Fix:** Use Promise.all for independent operations

### HIGH-003: Activity User Fetch After Promise.all
**File:** `lib/tasks.ts:423-441`
**Impact:** +50ms round trip
**Fix:** Use Supabase join or batch upfront

### HIGH-004: Large Components Need Splitting
- TaskDetail.tsx: 1,404 lines / 53KB
- TaskModal.tsx: 1,499 lines / 53KB
- tasks.ts: 2,671 lines
**Fix:** Split into focused sub-components

### HIGH-005: Missing React.memo on TaskCard
**File:** `components/tasks/TaskCard.tsx:50`
**Impact:** All 50+ cards re-render on filter change
**Fix:** Add custom comparison function

### HIGH-006: TaskFilters Missing React.memo
**File:** `components/tasks/TaskFilters.tsx`
**Impact:** Re-renders on every TaskBoard render
**Fix:** Wrap with React.memo

### HIGH-007: Unstable Callbacks in KanbanColumn
**File:** `components/tasks/KanbanColumn.tsx`
**Impact:** Defeats React.memo on children
**Fix:** Wrap event handlers in useCallback

### HIGH-008: lib/tasks.ts Any Types
**File:** `lib/tasks.ts:129, 172, 174, 184, 185, 194, 202`
**Impact:** Loses type safety
**Fix:** Define proper interfaces

### HIGH-009: useEffect Missing Cleanup
**File:** `components/tasks/TasksPageClient.tsx:108-122`
**Impact:** Race condition in async fetch
**Fix:** Add cleanup with cancelled flag

### HIGH-010: Kakao + Project Fetch Waterfall
**File:** `app/actions/tasks.ts:645-663`
**Impact:** 50ms import + 40ms fetch sequential
**Fix:** Promise.all for parallel execution

---

## MEDIUM Priority Issues

1. Duplicate error handling pattern (10 files)
2. Duplicate assignee selection logic (3 components)
3. Missing useMemo for computedTaskStats
4. Hard-coded colors instead of design tokens (3 files)
5. TaskList phase name computation in loop
6. KanbanBoard derived state not extracted
7. Missing Suspense boundaries in task pages
8. TaskMaterialsList lacks virtualization
9. content-visibility CSS missing on long lists
10. Duplicate modal patterns (4 components)
11. Missing error boundaries on large components
12. Missing null checks on assignee access
13. Unmemoized expensive computation in TaskBoard
14. SELECT * over-fetching (2 queries)

---

## Remediation Phases

### Phase 2.1: Bundle Optimization (CRITICAL) - 3 hours
- Replace lucide barrel imports in 24 files
- Add next/dynamic to GanttChart, TaskModal, TaskDetail

### Phase 2.2: Async Performance (CRITICAL) - 2 hours
- Add React.cache to getUserContext
- Batch notification inserts
- Parallelize post-creation operations
- Use after() for logging

### Phase 2.3: Re-render Optimization (HIGH) - 2 hours
- Fix useEffect dependencies
- Add React.memo to TaskCard, TaskFilters
- Wrap callbacks in useCallback
- Add cleanup to async effects

### Phase 2.4: Component Refactoring (HIGH) - 4 hours
- Split TaskDetail into sub-components
- Split TaskModal into step-based components
- Extract shared patterns

### Phase 2.5: Server Action Optimization (MEDIUM) - 2 hours
- Split tasks.ts into domain files
- Fix any types in lib/tasks.ts
- Add Zod validation

---

## Agent Assignments

| Phase | Agent | Effort |
|-------|-------|--------|
| 2.1 | frontend-engineer | 3h |
| 2.2 | backend-engineer | 2h |
| 2.3 | frontend-engineer | 2h |
| 2.4 | frontend-engineer | 4h |
| 2.5 | backend-engineer | 2h |

**Total Effort:** ~13 hours

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Bundle size (tasks) | ~300KB | <150KB |
| Page load | ~3s | <1.5s |
| LCP | ~2.8s | <2.0s |
| Largest component | 1,499 lines | <500 lines |
| Type-safe code | ~95% | 100% |
