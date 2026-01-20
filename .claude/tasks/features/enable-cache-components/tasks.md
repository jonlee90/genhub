# Enable Cache Components - Implementation Tasks

## References

- **Requirements:** `.claude/tasks/features/enable-cache-components/requirements.md`
- **Design:** `.claude/tasks/features/enable-cache-components/design.md`

---

## Execution Summary

| Phase | Tasks | Agent Focus |
|-------|-------|-------------|
| 1: Configuration | 1 task | backend-engineer |
| 2: Cache Functions | 3 tasks | backend-engineer |
| 3: API Route Migration | 4 tasks | backend-engineer |
| 4: Page Migration | 2 tasks | frontend-engineer |
| 5: Verification | 1 task | code-reviewer |

**Total:** 11 tasks

---

## Phase 1: Configuration

### Task 1: Enable Cache Components in next.config.ts

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md`
- **Files:**
  - Modify: `next.config.ts`
- **Depends on:** None
- **Complexity:** Simple

**Requirements:**

1. Add `dynamicIO: true` to `experimental` block
2. Add `ppr: true` to `experimental` block
3. Add `cacheLife` configuration object with 4 profiles:
   ```typescript
   cacheLife: {
     short: { stale: 30, revalidate: 60, expire: 300 },
     medium: { stale: 60, revalidate: 300, expire: 900 },
     long: { stale: 300, revalidate: 3600, expire: 86400 },
     userScoped: { stale: 30, revalidate: 120, expire: 600 },
   }
   ```

**Acceptance:**

- [ ] `dynamicIO: true` present in experimental block
- [ ] `ppr: true` present in experimental block
- [ ] All 4 `cacheLife` profiles defined with correct values
- [ ] `npm run build` succeeds with new configuration

---

## Phase 2: Create Cached Data Functions

### Task 2: Create lib/cache/projects.ts

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/server-cache-react.md`
- **Files:**
  - Create: `lib/cache/projects.ts`
- **Depends on:** Task 1
- **Complexity:** Medium

**Requirements:**

1. Add `"use cache"` directive at top of file
2. Import `cacheTag`, `cacheLife` from `next/cache`
3. Create `getCachedProjectsData(companyId: string)` function:
   - Uses `cacheLife("medium")`
   - Tags: `"projects"`, `` `projects-${companyId}` ``
   - Calls `getProjectsWithStats` and `getProjectTypes` in parallel
   - Returns `{ projects, totalCount, projectTypes }`
4. Create `getCachedProjectDetail(projectId: string, companyId: string)` function:
   - Uses `cacheLife("short")`
   - Tags: `"projects"`, `` `project-${projectId}` ``, `` `projects-${companyId}` ``
   - Imports `getProjectDetailData` dynamically to avoid circular deps
   - Returns project detail data

**Acceptance:**

- [ ] File exists at `lib/cache/projects.ts`
- [ ] Both functions have `"use cache"` directive
- [ ] `companyId` included in cache tags for tenant isolation
- [ ] TypeScript compiles without errors
- [ ] Parallel fetching pattern used where applicable

---

### Task 3: Create lib/cache/dashboard.ts

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/server-cache-react.md`
- **Files:**
  - Create: `lib/cache/dashboard.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Add `"use cache"` directive at top of file
2. Import `cacheTag`, `cacheLife` from `next/cache`
3. Create `getCachedDashboardKPIs(companyId: string)` function:
   - Uses `cacheLife("short")` (dashboard data changes frequently)
   - Tags: `"dashboard"`, `"dashboard-kpis"`, `` `dashboard-${companyId}` ``
   - Imports `getDashboardData` dynamically from `@/app/actions/dashboard`
   - Returns dashboard KPI data

**Acceptance:**

- [ ] File exists at `lib/cache/dashboard.ts`
- [ ] Function has `"use cache"` directive
- [ ] `companyId` included in cache tags
- [ ] TypeScript compiles without errors

---

### Task 4: Create lib/cache/expenses.ts

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/server-cache-react.md`
- **Files:**
  - Create: `lib/cache/expenses.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Add `"use cache"` directive at top of file
2. Import `cacheTag`, `cacheLife` from `next/cache`
3. Create `getCachedExpensesData(companyId: string)` function:
   - Uses `cacheLife("short")` (financial data must be current)
   - Tags: `"expenses"`, `` `expenses-${companyId}` ``
   - Imports `getExpensesData` dynamically from `@/lib/expenses`
   - Returns expenses list data

**Acceptance:**

- [ ] File exists at `lib/cache/expenses.ts`
- [ ] Function has `"use cache"` directive
- [ ] `companyId` included in cache tags
- [ ] TypeScript compiles without errors

---

## Phase 3: API Route Migration (Remove Legacy Exports)

### Task 5: Migrate cleanup-price-history cron route

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-api-routes.md`
- **Files:**
  - Modify: `app/api/cron/cleanup-price-history/route.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Remove `export const dynamic = 'force-dynamic';` line
2. Keep the comment explaining Node.js runtime requirement
3. No other changes needed (API routes are dynamic by default with dynamicIO)

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] Route handler functions unchanged
- [ ] `npm run build` succeeds

---

### Task 6: Migrate update-material-prices cron route

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-api-routes.md`
- **Files:**
  - Modify: `app/api/cron/update-material-prices/route.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Remove `export const dynamic = 'force-dynamic';` line
2. Keep the comment explaining Node.js runtime requirement
3. No other changes needed

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] Route handler functions unchanged
- [ ] `npm run build` succeeds

---

### Task 7: Migrate payment checkout route

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-api-routes.md`
- **Files:**
  - Modify: `app/api/(payment)/checkout/route.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Remove `export const dynamic = "force-dynamic";` line
2. No other changes needed (API routes are dynamic by default with dynamicIO)

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] Route handler functions unchanged
- [ ] `npm run build` succeeds

---

### Task 8: Migrate payment refund route

- **Agent:** backend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-api-routes.md`
- **Files:**
  - Modify: `app/api/(payment)/refund/route.ts`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Remove `export const dynamic = "force-dynamic";` line
2. No other changes needed

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] Route handler functions unchanged
- [ ] `npm run build` succeeds

---

## Phase 4: Page Migration

### Task 9: Migrate accept-invite page

- **Agent:** frontend-engineer
- **Skills:** `.claude/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md`
- **Files:**
  - Modify: `app/accept-invite/page.tsx`
- **Depends on:** Task 1
- **Complexity:** Simple

**Requirements:**

1. Remove `export const dynamic = "force-dynamic";` line
2. Page is already Server Component with token validation
3. No cached function needed (dynamic token validation per-request)
4. No other changes needed (pages with auth check are dynamic by default)

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] Token validation logic unchanged
- [ ] Page renders correctly at `/accept-invite?token=...`
- [ ] `npm run build` succeeds

---

### Task 10: Migrate expenses page with cached function

- **Agent:** frontend-engineer
- **Skills:**
  - `.claude/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md`
  - `.claude/skills/vercel-react-best-practices/rules/server-parallel-fetching.md`
- **Files:**
  - Modify: `app/app/expenses/page.tsx`
- **Depends on:** Task 1, Task 4
- **Complexity:** Medium

**Requirements:**

1. Remove `export const dynamic = "force-dynamic";` line
2. Import `getCachedExpensesData` from `@/lib/cache/expenses`
3. Update data fetching to use cached function with `companyId` parameter
4. Auth check must happen BEFORE cached function call (security requirement)
5. Pass `companyUser.company_id` to cached function

**Implementation Pattern:**

```typescript
// 1. Auth check (NOT cached)
const session = await auth();
if (!session?.user?.id) redirect("/");
const companyUser = await getCompanyUser(session.user.id);
if (!companyUser) redirect("/app/onboarding");

// 2. Cached data fetch (with company isolation)
const expensesData = await getCachedExpensesData(companyUser.company_id);
```

**Acceptance:**

- [ ] No `dynamic` export in file
- [ ] `getCachedExpensesData` imported and used
- [ ] `companyId` passed for tenant isolation
- [ ] Auth check precedes cached function call
- [ ] Page renders correctly at `/app/expenses`
- [ ] `npm run build` succeeds

---

## Phase 5: Verification

### Task 11: Verify Cache Components implementation

- **Agent:** code-reviewer
- **Skills:** `.claude/skills/vercel-react-best-practices/SKILL.md`
- **Files:**
  - Review: All modified/created files from Tasks 1-10
- **Depends on:** Tasks 1-10
- **Complexity:** Medium

**Requirements:**

1. **Build Verification:**
   - Run `npm run build` - must succeed without errors
   - Verify no `dynamic = 'force-dynamic'` exports remain (grep check)

2. **Cache Function Review:**
   - Verify all 3 cache files have `"use cache"` directive
   - Verify all cache functions include `companyId` in tags (tenant isolation)
   - Verify `cacheLife` profiles are appropriate for data type

3. **Security Review:**
   - Verify auth checks happen OUTSIDE cached functions
   - Verify no sensitive data cached without user scoping
   - Verify `companyId` is passed as parameter, not derived inside cache

4. **Configuration Review:**
   - Verify `dynamicIO: true` in next.config.ts
   - Verify `ppr: true` in next.config.ts
   - Verify all 4 `cacheLife` profiles present

5. **Runtime Verification (if dev server available):**
   - Navigate to `/app/expenses` - page should load
   - Navigate to `/app` - dashboard should load
   - Verify no console errors related to caching

**Acceptance:**

- [ ] `npm run build` succeeds
- [ ] No remaining `dynamic = 'force-dynamic'` exports
- [ ] All cache functions have proper tenant isolation
- [ ] Security pattern (auth before cache) verified
- [ ] Configuration complete and correct

---

## Execution Order

```
Dependency Graph:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Task 1 (Config)                                             │
│      │                                                       │
│      ├──────┬──────┬──────┬──────┬──────┬──────┬──────┐     │
│      │      │      │      │      │      │      │      │     │
│      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼     │
│    T2     T3     T4     T5     T6     T7     T8     T9      │
│   (proj) (dash) (exp) (cron) (cron) (pay) (pay) (invite)   │
│      │      │      │                                        │
│      │      │      └─────────────────────┐                  │
│      │      │                            │                  │
│      │      │                            ▼                  │
│      │      │                          T10 (expenses page)  │
│      │      │                            │                  │
│      └──────┴────────────────────────────┘                  │
│                         │                                    │
│                         ▼                                    │
│                       T11 (Verification)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Parallelization Opportunities:
- Tasks 2, 3, 4, 5, 6, 7, 8, 9 can run in parallel (after Task 1)
- Task 10 requires Task 4 (cached expenses function)
- Task 11 requires all previous tasks
```

---

## Agent Assignments Summary

| Agent | Tasks | Token Estimate |
|-------|-------|----------------|
| **backend-engineer** | 1, 2, 3, 4, 5, 6, 7, 8 | ~35k tokens |
| **frontend-engineer** | 9, 10 | ~15k tokens |
| **code-reviewer** | 11 | ~20k tokens |

**Recommended Execution:**

1. **Batch 1 (backend-engineer):** Tasks 1-8 in sequence
2. **Batch 2 (frontend-engineer):** Tasks 9-10 in sequence
3. **Batch 3 (code-reviewer):** Task 11

---

## Rollback Plan

If issues arise after deployment:

1. **Quick Disable:** Set `dynamicIO: false` and `ppr: false` in `next.config.ts`
2. **Restore Exports:** Re-add `dynamic = 'force-dynamic'` to all 6 migrated files
3. **Keep Cache Files:** The `lib/cache/*.ts` files are harmless without dynamicIO
4. **No Data Loss:** Cache invalidation calls (`revalidateTag`) work regardless

---

## Estimated Effort

- **Backend Phase:** 8 tasks, ~2-3 hours
- **Frontend Phase:** 2 tasks, ~1 hour
- **Verification Phase:** 1 task, ~30 minutes
- **Total:** 11 tasks, ~4 hours

---

**Status:** READY FOR IMPLEMENTATION

**Execute via:** `/kc:impl` or orchestrator dispatch
