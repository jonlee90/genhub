# Production Readiness Remediation Tracker

**Date:** 2026-01-20
**Project:** GenHub PWA
**Status:** AUDIT COMPLETE - REMEDIATION REQUIRED

---

## Executive Summary

| Domain | Status | P0 Issues | P1 Issues | P2 Issues |
|--------|--------|-----------|-----------|-----------|
| Security - RLS | NEEDS WORK | 3 | 5 | 3 |
| Security - Auth | PASS | 0 | 0 | 1 |
| Security - Validation | PARTIAL | 0 | 3 | 11 |
| Performance - Waterfalls | NEEDS WORK | 6 | 9 | 6 |
| Performance - Bundle | NEEDS WORK | 3 | 8 | 0 |
| Performance - Suspense | GOOD | 0 | 1 | 3 |
| Database - Queries | NEEDS WORK | 1 | 2 | 3 |
| Error Boundaries | NEEDS WORK | 3 | 5 | 9 |
| Build | PASS | 0 | 0 | 0 |
| **TOTAL** | - | **16** | **33** | **36** |

**Overall Production Readiness:** 72% - REQUIRES P0 FIXES BEFORE LAUNCH

---

## P0 CRITICAL Issues (Must Fix Before Production)

### SECURITY

#### S-001: Attachments Table RLS Policy Vulnerability
- **File:** `supabase/migrations/` (RLS policy)
- **Issue:** `qual: true` allows cross-company data leakage
- **Impact:** MAJOR - Users can access other companies' attachments
- **Fix:** Add company_id filter to attachments RLS policy
- **Effort:** 30 min
- **Status:** [ ] Pending

#### S-002: Task Dependencies Missing Company Isolation
- **File:** RLS policies for `task_dependencies`
- **Issue:** Lacks explicit company_id check
- **Impact:** HIGH - Potential cross-company task access
- **Fix:** Add company_id-based RLS policy
- **Effort:** 30 min
- **Status:** [ ] Pending

#### S-003: Function Search Path Vulnerabilities
- **File:** 2 Supabase functions
- **Issue:** Missing search_path protection (SQL injection risk)
- **Impact:** HIGH - Potential SQL injection
- **Fix:** Add `SET search_path = ''` to functions
- **Effort:** 15 min
- **Status:** [ ] Pending

### PERFORMANCE - WATERFALLS

#### P-001: materials.ts getMaterialSummaryStats N+1
- **File:** `app/actions/materials.ts`
- **Line:** ~getMaterialSummaryStats function
- **Issue:** N+1 loop queries for price history
- **Impact:** 100-500ms per material
- **Fix:** Use Promise.all or JOIN query
- **Effort:** 2 hours
- **Status:** [ ] Pending

#### P-002: spatial.ts getMarkersByProject Sequential Fetches
- **File:** `app/actions/spatial.ts`
- **Issue:** 3 sequential fetches for markers/counts/content
- **Impact:** ~300ms latency
- **Fix:** Use Promise.all for parallel queries
- **Effort:** 1 hour
- **Status:** [ ] Pending

#### P-003: phases.ts applyTaskTemplates N+1
- **File:** `app/actions/phases.ts`
- **Issue:** N+1 template queries in loop
- **Impact:** ~100ms per template
- **Fix:** Batch query all templates first
- **Effort:** 2 hours
- **Status:** [ ] Pending

#### P-004: default-models.ts Loop with Sequential Queries
- **File:** `app/actions/default-models.ts`
- **Issue:** Loop with sequential queries
- **Impact:** Variable based on data size
- **Fix:** Use Promise.all
- **Effort:** 1 hour
- **Status:** [ ] Pending

#### P-005: materials.ts getMaterialsByMarker Sequential Validation
- **File:** `app/actions/materials.ts`
- **Issue:** 3 sequential validation queries
- **Impact:** ~150ms latency
- **Fix:** Parallelize validation queries
- **Effort:** 1 hour
- **Status:** [ ] Pending

#### P-006: expenses.ts createExpenseFromTask Sequential Lookup
- **File:** `app/actions/expenses.ts`
- **Issue:** Sequential task + assignee lookup
- **Impact:** ~100ms latency
- **Fix:** Use Promise.all or JOIN
- **Effort:** 45 min
- **Status:** [ ] Pending

### PERFORMANCE - BUNDLE

#### B-001: TaskModal Static Import
- **File:** `components/projects/PhaseDetailPanel.tsx:21`
- **Issue:** Heavy modal imported statically
- **Impact:** ~40KB in initial bundle
- **Fix:** Use next/dynamic with ssr: false
- **Effort:** 15 min
- **Status:** [ ] Pending

#### B-002: CreateProjectModal Static Import
- **File:** `components/projects/ProjectsPageClient.tsx:21`
- **Issue:** Heavy modal imported statically
- **Impact:** ~35KB in initial bundle
- **Fix:** Use next/dynamic with ssr: false
- **Effort:** 15 min
- **Status:** [ ] Pending

#### B-003: ManagePhasesModal Static Import
- **File:** `components/projects/MetroJourney.tsx:11`
- **Issue:** Heavy modal imported statically
- **Impact:** ~35KB in initial bundle
- **Fix:** Use next/dynamic with ssr: false
- **Effort:** 15 min
- **Status:** [ ] Pending

### DATABASE

#### D-001: RLS auth_rls_initplan Performance (CRITICAL)
- **File:** 108 RLS policies
- **Issue:** `auth.uid()` re-evaluated per row instead of once
- **Impact:** 1-5 seconds per query at scale
- **Fix:** Wrap with `(select auth.uid())` in all policies
- **Effort:** 4-6 hours
- **Status:** [ ] Pending

### ERROR HANDLING

#### E-001: Dashboard Missing Error Boundary
- **File:** `app/app/error.tsx` (create)
- **Issue:** Dashboard loads multiple data sources, no error recovery
- **Impact:** Full page crash on any data failure
- **Fix:** Add error.tsx with retry capability
- **Effort:** 30 min
- **Status:** [ ] Pending

#### E-002: Tasks Page Missing Error Boundary
- **File:** `app/app/tasks/error.tsx` (create)
- **Issue:** Complex state management, no error recovery
- **Impact:** Task board crashes unrecoverable
- **Fix:** Add error.tsx
- **Effort:** 30 min
- **Status:** [ ] Pending

#### E-003: Chat Page Missing Error Boundary
- **File:** `app/app/chat/error.tsx` (create)
- **Issue:** Real-time features can fail
- **Impact:** Chat crashes unrecoverable
- **Fix:** Add error.tsx
- **Effort:** 30 min
- **Status:** [ ] Pending

---

## P1 HIGH Priority Issues

### SECURITY - INPUT VALIDATION

#### V-001: spatial.ts Missing Zod Validation (21 functions)
- **File:** `app/actions/spatial.ts`
- **Issue:** Complex mutations without Zod schemas
- **Risk:** HIGH - Position data, file uploads
- **Effort:** 2 hours
- **Status:** [ ] Pending

#### V-002: project-files.ts Missing Zod Validation
- **File:** `app/actions/project-files.ts`
- **Issue:** Search/filter params without validation
- **Risk:** HIGH - User input in ILIKE
- **Effort:** 1 hour
- **Status:** [ ] Pending

#### V-003: project-photos.ts Missing Zod Validation
- **File:** `app/actions/project-photos.ts`
- **Issue:** Manual UUID validation instead of Zod
- **Risk:** MEDIUM-HIGH
- **Effort:** 45 min
- **Status:** [ ] Pending

### PERFORMANCE - WATERFALLS (9 P1 issues)

See detailed waterfall findings in `performance-waterfall-findings.md`

### DATABASE

#### D-002: 17 Unindexed Foreign Keys
- **Issue:** Missing indexes on foreign key columns
- **Impact:** Slow JOINs and cascade operations
- **Effort:** 2-3 hours
- **Status:** [ ] Pending

#### D-003: Material Price History N+1
- **File:** `app/actions/materials.ts:1704`
- **Issue:** Queries price history per material
- **Fix:** Batch query with IN clause
- **Effort:** 2-4 hours
- **Status:** [ ] Pending

### ERROR HANDLING (5 P1 routes)

- `/app/expenses/error.tsx`
- `/app/materials/error.tsx`
- `/app/tasks/[id]/error.tsx`
- `/app/tasks/new/error.tsx`
- `/app/profile/error.tsx`

### BUNDLE (8 Radix packages)

Add to `optimizePackageImports` in next.config.ts:
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-scroll-area

---

## P2 MEDIUM Priority Issues

### INPUT VALIDATION (11 files)
- default-models.ts
- kakao.ts
- chat-queries.ts
- project-deferred.ts
- tasks-spatial.ts
- stripe.ts
- auth.ts
- client.ts
- dashboard.ts
- seed-demo-data.ts
- team-email-helper.ts

### ERROR BOUNDARIES (9 routes)
- /app/settings
- /app/settings/default-models
- /app/client/[projectId]/spatial
- /app/client/projects/[id]
- /app/owner/companies
- /app/owner/invites
- /app/owner/users
- /app/admin/seed-data
- /app/materials

### SUSPENSE (4 routes)
- /app/settings (add loading.tsx)
- /app/owner/* routes
- Standardize chat/expenses to use loading.tsx

---

## Remediation Effort Estimates

| Priority | Issues | Effort |
|----------|--------|--------|
| P0 | 16 | ~12 hours |
| P1 | 33 | ~15 hours |
| P2 | 36 | ~8 hours |
| **Total** | **85** | **~35 hours** |

---

## Recommended Execution Order

### Phase 1: Security (4 hours) - BLOCKING
1. [ ] S-001: Fix attachments RLS policy
2. [ ] S-002: Add task_dependencies company isolation
3. [ ] S-003: Fix function search_path
4. [ ] D-001: Fix RLS auth_rls_initplan (CRITICAL for scale)

### Phase 2: Error Handling (3 hours)
1. [ ] E-001, E-002, E-003: Add P0 error boundaries
2. [ ] Add 5 P1 error boundaries

### Phase 3: Performance - Waterfalls (8 hours)
1. [ ] P-001 through P-006: Fix all P0 waterfalls
2. [ ] Fix P1 waterfalls

### Phase 4: Bundle Optimization (2 hours)
1. [ ] B-001, B-002, B-003: Dynamic import modals
2. [ ] Add Radix packages to optimizePackageImports

### Phase 5: Input Validation (7 hours)
1. [ ] V-001, V-002, V-003: High-risk files
2. [ ] P2 files for consistency

### Phase 6: Database Optimization (6 hours)
1. [ ] D-002: Add foreign key indexes
2. [ ] D-003: Fix material price N+1

---

## Verification Checklist

After each fix:
- [ ] Run specific automated check
- [ ] `npm run build` passes
- [ ] Manual smoke test for P0 issues
- [ ] Update status in this tracker

---

## Success Criteria

- [x] Zero P0 issues (16 remaining)
- [ ] All P1 issues have documented plan
- [ ] RLS coverage 100% with proper policies
- [x] Build: zero errors
- [ ] Error boundaries on all 21 routes (currently 4)
- [x] Heavy components use next/dynamic (mostly done)
- [ ] Promise.all() for independent async ops
- [x] No createClient in 'use client' files

---

## Audit Reports Index

| Report | Location |
|--------|----------|
| RLS Security | `audit/production-readiness/security-rls-findings.md` |
| Auth Validation | `audit/production-readiness/security-auth-findings.md` |
| Input Validation | `audit/production-readiness/security-validation-findings.md` |
| Waterfall Detection | `audit/production-readiness/performance-waterfall-findings.md` |
| Bundle Analysis | `audit/production-readiness/performance-bundle-findings.md` |
| Suspense Boundaries | `audit/production-readiness/performance-suspense-findings.md` |
| Database Queries | `audit/production-readiness/database-query-findings.md` |
| Error Boundaries | `audit/production-readiness/error-boundary-findings.md` |
| Build Verification | `audit/production-readiness/build-verification.md` |
| Core Web Vitals | `audit/production-readiness/cwv-lighthouse-report.md` |

---

**Last Updated:** 2026-01-20
**Next Review:** After P0 fixes complete
