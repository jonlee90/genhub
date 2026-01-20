# Enable Cache Components - Technical Design

## Overview

This document specifies the technical architecture for enabling Next.js 16's Cache Components feature in GenHub. The implementation will leverage the `"use cache"` directive, `cacheTag()`, `cacheLife()`, and `revalidateTag()` APIs to achieve Partial Pre-Rendering (PPR), granular caching, and instant invalidation.

## Requirements Reference

See: `.claude/tasks/features/enable-cache-components/requirements.md`

---

## Architecture Overview

### Cache Components Mode Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE HIERARCHY                               │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   Static Shell   │ ← Pre-rendered at build time (PPR)        │
│  │  (Layout, Nav)   │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│  ┌────────▼─────────┐                                           │
│  │  "use cache"     │ ← Persistent cross-request cache          │
│  │   Functions      │   (cacheLife: 5m, 15m, 1h, 1d)           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│  ┌────────▼─────────┐                                           │
│  │   React.cache()  │ ← Per-request deduplication (existing)    │
│  │   (lib/*.ts)     │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│  ┌────────▼─────────┐                                           │
│  │   Supabase RLS   │ ← Company-isolated queries                │
│  │   (per-request)  │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with Existing Patterns

| Layer | Current | After Cache Components |
|-------|---------|------------------------|
| Page Components | Server Components with `cache()` | Server Components + Suspense boundaries |
| Data Functions | `lib/*.ts` with `React.cache()` | `lib/cache/*.ts` with `"use cache"` directive |
| Server Actions | `revalidatePath()` + some `revalidateTag()` | Consistent `revalidateTag()` for all mutations |
| API Routes | `dynamic = 'force-dynamic'` | Remove export, routes are dynamic by default |

---

## Configuration Changes

### 1. next.config.ts Updates

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Enable Cache Components (dynamicIO) for Next.js 16
    dynamicIO: true,
    // Enable Partial Pre-Rendering
    ppr: true,
  },
  // Define custom cache profiles
  cacheLife: {
    // Short-lived cache for frequently changing data
    short: {
      stale: 30,      // Serve stale for 30s
      revalidate: 60, // Revalidate after 1 min
      expire: 300,    // Expire after 5 min
    },
    // Medium cache for dashboard/list data
    medium: {
      stale: 60,
      revalidate: 300,  // 5 min
      expire: 900,      // 15 min
    },
    // Long cache for relatively static data
    long: {
      stale: 300,
      revalidate: 3600,  // 1 hour
      expire: 86400,     // 24 hours
    },
    // User-scoped cache (shorter due to personalization)
    userScoped: {
      stale: 30,
      revalidate: 120,  // 2 min
      expire: 600,      // 10 min
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.thdstatic.com' },
      { protocol: 'https', hostname: 'fozwbpqgkcduwxqvmkjd.supabase.co' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, crypto: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
```

### 2. TypeScript Configuration

No changes required. The `"use cache"` directive is recognized by Next.js 16.

### 3. Environment Variables

No new environment variables required. Cache behavior is controlled via `cacheLife` profiles.

---

## Migration Strategy

### Phase 1: Remove Legacy `dynamic` Exports (6 Files)

These files currently use `dynamic = 'force-dynamic'` which is incompatible with Cache Components.

| File | Current Purpose | Migration Strategy |
|------|-----------------|-------------------|
| `app/accept-invite/page.tsx` | Dynamic token validation | Remove export (pages dynamic by default with dynamicIO) |
| `app/app/expenses/page.tsx` | Fresh expense data | Remove export, add `"use cache"` to data function |
| `app/api/cron/cleanup-price-history/route.ts` | Cron job | Remove export (API routes always dynamic) |
| `app/api/cron/update-material-prices/route.ts` | Cron job | Remove export (API routes always dynamic) |
| `app/api/(payment)/checkout/route.ts` | Payment processing | Remove export (API routes always dynamic) |
| `app/api/(payment)/refund/route.ts` | Refund processing | Remove export (API routes always dynamic) |

**Migration Pattern:**
```typescript
// BEFORE (app/app/expenses/page.tsx)
export const dynamic = "force-dynamic";

export default async function ExpensesPage() { ... }

// AFTER
// Remove the export - page is dynamic by default when using dynamicIO
// Data caching is handled in lib/cache/expenses.ts

export default async function ExpensesPage() { ... }
```

### Phase 2: Create Cached Data Functions

Create new cached functions in `lib/cache/` directory to separate caching logic from data fetching logic.

#### 2.1 lib/cache/projects.ts (New File)

```typescript
"use cache";

import { cacheTag, cacheLife } from "next/cache";
import { getProjectsWithStats } from "@/app/actions/projects";
import { getProjectTypes } from "@/app/actions/project-types";

/**
 * Cached projects list data
 * Cache key includes companyId for tenant isolation
 */
export async function getCachedProjectsData(companyId: string) {
  "use cache";
  cacheLife("medium"); // 5 min revalidate, 15 min expire
  cacheTag("projects", `projects-${companyId}`);

  const [projectsResult, projectTypesResult] = await Promise.all([
    getProjectsWithStats(companyId),
    getProjectTypes(),
  ]);

  return {
    projects: projectsResult.projects || [],
    totalCount: projectsResult.totalCount || 0,
    projectTypes: projectTypesResult.success ? projectTypesResult.projectTypes || [] : [],
  };
}

/**
 * Cached single project detail data
 */
export async function getCachedProjectDetail(projectId: string, companyId: string) {
  "use cache";
  cacheLife("short"); // 1 min revalidate, 5 min expire
  cacheTag("projects", `project-${projectId}`, `projects-${companyId}`);

  // Import dynamically to avoid circular dependencies
  const { getProjectDetailData } = await import("@/lib/projects");
  return getProjectDetailData(projectId);
}
```

#### 2.2 lib/cache/dashboard.ts (New File)

```typescript
"use cache";

import { cacheTag, cacheLife } from "next/cache";

/**
 * Cached dashboard KPIs
 * Uses materialized view for optimal performance
 */
export async function getCachedDashboardKPIs(companyId: string) {
  "use cache";
  cacheLife("short"); // Dashboard data changes frequently
  cacheTag("dashboard", "dashboard-kpis", `dashboard-${companyId}`);

  const { getDashboardData } = await import("@/app/actions/dashboard");
  return getDashboardData();
}
```

#### 2.3 lib/cache/expenses.ts (New File)

```typescript
"use cache";

import { cacheTag, cacheLife } from "next/cache";

/**
 * Cached expenses list data
 */
export async function getCachedExpensesData(companyId: string) {
  "use cache";
  cacheLife("short"); // Expenses change frequently
  cacheTag("expenses", `expenses-${companyId}`);

  const { getExpensesData } = await import("@/lib/expenses");
  return getExpensesData();
}
```

### Phase 3: Refactor Existing lib/*.ts Files

#### 3.1 lib/projects.ts Refactoring

**Current State:** Uses `React.cache()` for per-request deduplication only.

**Target State:** Keep `React.cache()` for internal deduplication, wrap with `"use cache"` in lib/cache/projects.ts.

```typescript
// lib/projects.ts - MINIMAL CHANGES
// Keep existing React.cache() wrappers for per-request deduplication
// The "use cache" layer in lib/cache/projects.ts handles persistent caching

import "server-only";
import { cache } from "react";
// ... existing imports

// KEEP: Per-request deduplication still valuable
export const getProjectsPageData = cache(async function getProjectsPageData() {
  // ... existing implementation unchanged
});

// KEEP: Per-request deduplication still valuable
export const getProjectDetailData = cache(async function getProjectDetailData(id: string) {
  // ... existing implementation unchanged
});
```

#### 3.2 lib/dashboard.ts Refactoring

**Current State:** Uses `React.cache()` for per-request deduplication.

**Target State:** Wrap with `"use cache"` in lib/cache/dashboard.ts.

```typescript
// lib/dashboard.ts - NO CHANGES NEEDED
// Keep existing React.cache() wrapper
// Persistent caching handled in lib/cache/dashboard.ts
```

### Phase 4: Update Server Actions for Tag-Based Invalidation

**Current Pattern:** Mixed use of `revalidatePath()` and `revalidateTag()`.

**Target Pattern:** Consistent `revalidateTag()` for granular invalidation.

#### 4.1 Tag Naming Convention

```
TAG FORMAT: {entity}[-{scope}][-{id}]

Examples:
- "projects"                    → All projects (global)
- "projects-{companyId}"        → Company's projects
- "project-{projectId}"         → Single project
- "dashboard"                   → All dashboard data
- "dashboard-{companyId}"       → Company's dashboard
- "tasks"                       → All tasks
- "tasks-{projectId}"           → Project's tasks
- "expenses"                    → All expenses
- "expenses-{companyId}"        → Company's expenses
```

#### 4.2 Server Action Updates

**app/actions/projects.ts:**
```typescript
// AFTER createProject()
revalidateTag("projects");
revalidateTag(`projects-${companyId}`);
revalidateTag("dashboard");
revalidateTag(`dashboard-${companyId}`);

// AFTER updateProject()
revalidateTag("projects");
revalidateTag(`project-${id}`);
revalidateTag(`projects-${companyId}`);

// AFTER deleteProject()
revalidateTag("projects");
revalidateTag(`project-${id}`);
revalidateTag(`projects-${companyId}`);
revalidateTag("dashboard");
revalidateTag(`dashboard-${companyId}`);
```

**app/actions/tasks.ts:**
```typescript
// AFTER createTask()
revalidateTag("tasks");
revalidateTag(`tasks-${projectId}`);
revalidateTag(`project-${projectId}`);
revalidateTag("dashboard");

// AFTER updateTask()
revalidateTag("tasks");
revalidateTag(`task-${id}`);
revalidateTag(`tasks-${projectId}`);
revalidateTag(`project-${projectId}`);
```

**app/actions/expenses.ts:**
```typescript
// AFTER createExpense()
revalidateTag("expenses");
revalidateTag(`expenses-${companyId}`);
revalidateTag(`project-${projectId}`);
revalidateTag("dashboard");
revalidateTag(`dashboard-${companyId}`);
```

---

## Caching Strategy

### Cache Profile Selection

| Data Type | Profile | Stale | Revalidate | Expire | Rationale |
|-----------|---------|-------|------------|--------|-----------|
| Dashboard KPIs | `short` | 30s | 60s | 5m | Frequently updated metrics |
| Projects List | `medium` | 60s | 5m | 15m | Moderately stable |
| Project Detail | `short` | 30s | 60s | 5m | Contains live task status |
| Expenses List | `short` | 30s | 60s | 5m | Financial data must be current |
| Team Members | `medium` | 60s | 5m | 15m | Relatively stable |
| Project Types | `long` | 5m | 1h | 24h | Rarely changes |
| Materials Catalog | `long` | 5m | 1h | 24h | Updated by cron |

### Suspense Boundary Placement (async-suspense-boundaries)

```
┌─────────────────────────────────────────────────────────────────┐
│ DashboardPage (Server Component)                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Static Shell (PPR - instant)                                │ │
│ │ - Header, Navigation, Layout                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ <Suspense fallback={<KPICardsSkeleton />}>                  │ │
│ │   <DashboardKPIs /> ← "use cache" getCachedDashboardKPIs   │ │
│ │ </Suspense>                                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ <Suspense fallback={<ProjectsTableSkeleton />}>             │ │
│ │   <RecentProjects /> ← "use cache" getCachedProjectsData   │ │
│ │ </Suspense>                                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Parallel Fetching Pattern (async-parallel)

```typescript
// GOOD: Parallel fetching in cached function
export async function getCachedDashboardData(companyId: string) {
  "use cache";
  cacheTag("dashboard", `dashboard-${companyId}`);
  cacheLife("short");

  // All fetches start simultaneously
  const [kpis, projects, tasks] = await Promise.all([
    getDashboardKPIs(companyId),
    getRecentProjects(companyId, 5),
    getUpcomingTasks(companyId, 10),
  ]);

  return { kpis, projects, tasks };
}

// BAD: Sequential waterfall
export async function getDashboardData(companyId: string) {
  const kpis = await getDashboardKPIs(companyId);      // 100ms
  const projects = await getRecentProjects(companyId); // +100ms
  const tasks = await getUpcomingTasks(companyId);     // +100ms
  // Total: 300ms (should be ~100ms with parallel)
}
```

---

## Data Flow Architecture

### Server Component to Database Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Page (RSC)     │     │   lib/cache/*.ts │     │   Supabase       │
│                  │     │   "use cache"    │     │   (RLS)          │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  1. getCachedData()    │                        │
         │───────────────────────▶│                        │
         │                        │                        │
         │                        │  2. Check cache        │
         │                        │  (cacheTag match?)     │
         │                        │                        │
         │                        │  3a. Cache HIT         │
         │◀───────────────────────│  Return cached data    │
         │                        │                        │
         │                        │  3b. Cache MISS        │
         │                        │───────────────────────▶│
         │                        │                        │
         │                        │  4. Query with RLS     │
         │                        │◀───────────────────────│
         │                        │                        │
         │                        │  5. Store in cache     │
         │◀───────────────────────│  Return fresh data     │
         │                        │                        │
```

### Cache Invalidation Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Server Action   │     │   Next.js Cache  │     │   Next Request   │
│  (mutation)      │     │                  │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  1. Mutation completes │                        │
         │                        │                        │
         │  2. revalidateTag()    │                        │
         │───────────────────────▶│                        │
         │                        │                        │
         │                        │  3. Mark tags invalid  │
         │                        │                        │
         │                        │                        │  4. User navigates
         │                        │◀───────────────────────│
         │                        │                        │
         │                        │  5. Cache MISS         │
         │                        │  (tag invalidated)     │
         │                        │                        │
         │                        │  6. Fetch fresh data   │
         │                        │───────────────────────▶│
         │                        │                        │
```

---

## Security & RLS

### Tenant Isolation via Cache Keys

**Critical Rule:** Every cached function that returns company-specific data MUST include `companyId` in its cache tags.

```typescript
// CORRECT: Company-scoped cache
export async function getCachedProjectsData(companyId: string) {
  "use cache";
  cacheTag("projects", `projects-${companyId}`); // ✅ Company isolation
  // ...
}

// WRONG: Global cache for company data
export async function getCachedProjectsData() {
  "use cache";
  cacheTag("projects"); // ❌ Data leakage between companies!
  // ...
}
```

### Session Handling with Cached Functions

**Pattern:** Auth check happens OUTSIDE the cached function, companyId passed as parameter.

```typescript
// Page component (NOT cached)
export default async function ProjectsPage() {
  const session = await auth(); // Per-request auth check
  if (!session?.user?.id) redirect("/");

  const companyUser = await getCompanyUser(session.user.id);
  if (!companyUser) redirect("/app/onboarding");

  // Cached function receives validated companyId
  const data = await getCachedProjectsData(companyUser.company_id);

  return <ProjectsList data={data} />;
}

// Cached function (does NOT check auth - trusts caller)
export async function getCachedProjectsData(companyId: string) {
  "use cache";
  cacheTag(`projects-${companyId}`);
  // ... fetch data for companyId
}
```

### Private Data Handling

For user-specific data that should not be shared:

```typescript
export async function getCachedUserPreferences(userId: string) {
  "use cache";
  cacheLife("userScoped");
  cacheTag(`user-${userId}`, "user-preferences");
  // User-scoped data with short TTL
}
```

---

## Integration Points

### Existing Server Actions (22 API Routes)

**No Changes Required:** API routes are dynamic by default with dynamicIO enabled. The `dynamic = 'force-dynamic'` exports are simply removed.

| Route | Type | Cache Impact |
|-------|------|--------------|
| `/api/auth/[...nextauth]` | Auth | None (always dynamic) |
| `/api/webhook/stripe` | Webhook | None (always dynamic) |
| `/api/cron/*` | Cron | None (always dynamic) |
| `/api/(payment)/*` | Payment | None (always dynamic) |
| `/api/project-files/upload` | Upload | Invalidates `project-{id}` tag |
| `/api/project-photos/upload` | Upload | Invalidates `project-{id}` tag |
| `/api/spatial/*` | 3D Models | Invalidates `project-{id}` tag |
| `/api/companies/*` | Data | Uses cache tags |
| `/api/chat/*` | Real-time | None (always fresh) |

### Existing revalidateTag Calls

The following Server Actions already use `revalidateTag()` (20 calls identified in upgrade):

- `app/actions/team.ts` - `team-members-{companyId}`
- `app/actions/subcontractors.ts` - `subcontractors-{companyId}`, `subcontractor-{id}`
- `app/actions/dashboard.ts` - `dashboard`, `dashboard-kpis`, `dashboard-{companyId}`
- `app/actions/projects.ts` - `projects`, `project-{id}`, `dashboard`

**Migration:** Ensure all invalidation calls use the same tag naming convention documented above.

### Dashboard Materialized View

The `mv_dashboard_kpis` materialized view is already optimized for dashboard queries. Cache Components adds a layer on top:

```
Request → Cache (5 min TTL) → Materialized View → Base Tables
          ↑                    ↑
          Instant              ~50ms
          (cache hit)          (view query)
```

**Invalidation:** When data changes, `revalidateTag("dashboard")` is called. The materialized view is refreshed independently by Supabase.

---

## Error Handling

| Scenario | Cache Behavior | User Experience |
|----------|---------------|-----------------|
| Cache miss + DB error | Don't cache error | Show error UI via error boundary |
| Cache hit + stale | Serve stale, revalidate | Show cached data immediately |
| Cache expired | Fetch fresh | Show loading skeleton via Suspense |
| Tag invalidation | Mark stale | Next request fetches fresh |

### Error Boundary Integration

```typescript
// app/app/projects/page.tsx
export default async function ProjectsPage() {
  return (
    <ErrorBoundary fallback={<ProjectsError />}>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## Performance Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| TTFB (cached) | ~300ms | <100ms | Lighthouse |
| TTFB (uncached) | ~500ms | <200ms | Lighthouse |
| Cache Hit Rate | N/A | >80% | Application logs |
| LCP | ~3s | <2.5s | Core Web Vitals |
| Database Queries/Page | ~5-10 | ~1-2 (cache hit) | Supabase metrics |

---

## File Structure After Migration

```
lib/
├── cache/                    # NEW: Cached data functions
│   ├── projects.ts           # "use cache" wrappers for projects
│   ├── dashboard.ts          # "use cache" wrappers for dashboard
│   ├── expenses.ts           # "use cache" wrappers for expenses
│   └── index.ts              # Re-exports
├── projects.ts               # EXISTING: React.cache() wrappers (unchanged)
├── dashboard.ts              # EXISTING: React.cache() wrappers (unchanged)
└── expenses.ts               # EXISTING: Data fetching logic (unchanged)

app/
├── app/
│   ├── page.tsx              # Dashboard - uses getCachedDashboardKPIs
│   ├── projects/
│   │   └── page.tsx          # Uses getCachedProjectsData
│   └── expenses/
│       └── page.tsx          # MIGRATED: Remove dynamic export
├── accept-invite/
│   └── page.tsx              # MIGRATED: Remove dynamic export
└── api/
    ├── cron/                 # MIGRATED: Remove dynamic exports
    └── (payment)/            # MIGRATED: Remove dynamic exports
```

---

## Rollback Strategy

If issues arise after enabling Cache Components:

1. **Quick Disable:** Set `dynamicIO: false` and `ppr: false` in next.config.ts
2. **Restore Exports:** Re-add `dynamic = 'force-dynamic'` to migrated files
3. **Keep Tag Calls:** The `revalidateTag()` calls are harmless without Cache Components

---

## Testing Strategy

### Unit Tests
- Verify cache tag naming follows convention
- Verify companyId included in all company-scoped caches

### Integration Tests
- Cache hit returns same data within TTL
- Cache miss after `revalidateTag()` call
- Different companies get isolated cached data

### Performance Tests
- TTFB < 200ms for cached pages
- Cache hit rate > 80% under load

---

**Status:** PENDING APPROVAL

**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)

---

## Summary

This design document specifies:

- **Configuration:** `dynamicIO: true`, `ppr: true`, custom `cacheLife` profiles
- **Migration:** 6 files removing `dynamic = 'force-dynamic'`
- **New Files:** 3 cached data function files in `lib/cache/`
- **Tag Convention:** `{entity}[-{companyId}][-{id}]` for consistent invalidation
- **Security:** Company isolation via cache key parameters
- **Performance:** Target TTFB < 200ms, Cache Hit Rate > 80%

**Next Step:** Awaiting approval to proceed to Phase 3: Implementation Tasks.
