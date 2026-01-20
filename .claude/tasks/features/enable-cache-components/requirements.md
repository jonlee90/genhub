# Enable Cache Components - Requirements

## Overview

Enable Next.js 16's Cache Components feature in GenHub to unlock Partial Pre-Rendering (PPR), advanced caching with the `use cache` directive, and improved performance through static shell generation with dynamic streaming.

## Problem Statement

GenHub currently uses React's `cache()` function for per-request deduplication but lacks:
1. **Partial Pre-Rendering (PPR)**: Routes are either fully static or fully dynamic
2. **Granular Cache Control**: No ability to cache specific components/functions with custom TTLs
3. **Tag-Based Invalidation**: Limited to `revalidatePath()` which invalidates entire route caches
4. **Static Shell Generation**: Initial page loads don't benefit from pre-rendered HTML shells

### Current State Analysis

| Aspect | Current Implementation | Cache Components Improvement |
|--------|----------------------|------------------------------|
| Caching | `cache()` from React (request dedup only) | `use cache` with `cacheLife` (persistent caching) |
| Invalidation | `revalidatePath()` (route-level) | `revalidateTag()`/`updateTag()` (granular) |
| Static Content | None (all SSR) | Static shell pre-rendered at build |
| Dynamic Content | Everything re-rendered per request | Only dynamic parts stream at request time |
| Route Config | `dynamic = 'force-dynamic'` (5 routes) | Removed, replaced with `use cache` |

### Routes Using Legacy Config (Must Migrate)

```
app/accept-invite/page.tsx:        dynamic = "force-dynamic"
app/api/cron/cleanup-price-history/route.ts:  dynamic = 'force-dynamic'
app/api/cron/update-material-prices/route.ts: dynamic = 'force-dynamic'
app/api/(payment)/refund/route.ts:  dynamic = "force-dynamic"
app/api/(payment)/checkout/route.ts: dynamic = "force-dynamic"
app/app/expenses/page.tsx:         dynamic = "force-dynamic"
```

---

## Personas

- **Primary**: **PM** (Project Manager) - Benefits from faster dashboard/project page loads
- **Primary**: **GC** (General Contractor) - Benefits from cached project lists and reports
- **Secondary**: **Worker** - Benefits from faster task list loading on mobile
- **Secondary**: **Admin** - Manages cache configuration and monitoring

---

## User Stories

### US-1: Faster Initial Page Loads via Static Shell

**As a** PM,
**I want** the dashboard and project pages to load instantly with a static shell,
**So that** I can see the page structure immediately while data streams in.

**Acceptance Criteria (EARS):**
- WHEN PM navigates to `/app` (dashboard) THE SYSTEM SHALL display the static shell (header, navigation, layout) within 100ms before data loads
- WHEN PM navigates to `/app/projects` THE SYSTEM SHALL display the page skeleton immediately while project data streams in
- WHILE data is loading THE SYSTEM SHALL show appropriate loading states within Suspense boundaries
- IF the cache is stale THE SYSTEM SHALL serve cached content while revalidating in background (SWR)

**Priority:** Critical

---

### US-2: Granular Cache Control for Data Functions

**As a** GC,
**I want** frequently accessed data (project lists, team members, material catalogs) to be cached with appropriate TTLs,
**So that** repeated page visits are fast and don't overload the database.

**Acceptance Criteria (EARS):**
- WHEN `getProjectsPageData()` is called THE SYSTEM SHALL cache the result for the configured duration (e.g., 5 minutes)
- WHEN `getDashboardPageData()` is called THE SYSTEM SHALL use cached data if available and valid
- WHEN multiple users from the same company request projects THE SYSTEM SHALL serve from shared cache (per company_id tag)
- IF data changes via Server Action THE SYSTEM SHALL invalidate relevant cache tags immediately

**Priority:** High

---

### US-3: Instant Cache Invalidation on Data Mutations

**As a** PM,
**I want** data changes to immediately reflect in the UI,
**So that** I see accurate information after creating/updating projects or tasks.

**Acceptance Criteria (EARS):**
- WHEN user creates a new project via `createProject()` THE SYSTEM SHALL call `updateTag('projects')` for immediate invalidation
- WHEN user updates a task via `updateTask()` THE SYSTEM SHALL invalidate both `tasks` and `project-{id}` tags
- WHEN user deletes an expense via `deleteExpense()` THE SYSTEM SHALL invalidate `expenses` and `project-{id}` tags
- IF mutation succeeds THE SYSTEM SHALL ensure next navigation shows fresh data (not stale cache)

**Priority:** High

---

### US-4: Preserved Component State During Navigation

**As a** Worker,
**I want** my scroll position and component state preserved when navigating between pages,
**So that** I don't lose my place in long task lists.

**Acceptance Criteria (EARS):**
- WHEN user navigates away from tasks list and returns THE SYSTEM SHALL preserve scroll position
- WHEN user opens a modal and closes it THE SYSTEM SHALL maintain the underlying page state
- WHILE navigating between cached routes THE SYSTEM SHALL use React Activity component for state preservation
- IF user refreshes the page THE SYSTEM SHALL load fresh data (cache preserved, state reset as expected)

**Priority:** Medium

---

### US-5: API Routes Compatible with Cache Components

**As an** Admin,
**I want** all API routes to work correctly with Cache Components enabled,
**So that** webhooks, cron jobs, and file uploads function properly.

**Acceptance Criteria (EARS):**
- WHEN Stripe webhook is received at `/api/webhook/stripe` THE SYSTEM SHALL process it correctly (no caching)
- WHEN cron job triggers `/api/cron/update-material-prices` THE SYSTEM SHALL execute without cache interference
- WHEN user uploads file via `/api/project-files/upload` THE SYSTEM SHALL process upload and invalidate caches
- IF API route requires dynamic behavior THE SYSTEM SHALL NOT be affected by Cache Components (routes are dynamic by default)

**Priority:** Critical

---

### US-6: Personalized Cached Content

**As a** GC,
**I want** my personalized dashboard data cached separately from other users,
**So that** I get fast loads without seeing other users' data.

**Acceptance Criteria (EARS):**
- WHEN cached function receives `company_id` parameter THE SYSTEM SHALL include it in cache key
- WHEN cached function receives `user_id` parameter THE SYSTEM SHALL include it in cache key (for private data)
- IF two users from different companies request same page THE SYSTEM SHALL serve different cached content
- WHERE user has role-based permissions THE SYSTEM SHALL cache data per role if needed

**Priority:** High

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Byte (TTFB) | < 200ms | Lighthouse / Core Web Vitals |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Cache Hit Rate | > 80% | Application metrics |
| Static Shell Delivery | < 100ms | CDN edge metrics |

### Compatibility

- Node.js runtime required (no Edge runtime)
- All existing API routes must continue working
- No breaking changes to Server Actions
- PWA offline functionality unaffected

### Security

- Cache keys must include company_id for tenant isolation
- Sensitive user data must use `use cache: private` if cached
- Cache invalidation must be immediate for security-relevant changes

### Mobile

- PWA service worker caching works alongside Cache Components
- Mobile users benefit from static shell on slow connections
- Offline fallback unaffected

---

## Out of Scope

- Edge runtime migration (Cache Components requires Node.js)
- Redis/external cache store (using Next.js built-in cache)
- Cache warming strategies (future enhancement)
- Metrics dashboard for cache monitoring (future enhancement)
- `generateStaticParams` for static project pages (future enhancement)

---

## Dependencies

### Required Before This Feature

1. **Next.js 16.1.x stable** - Currently at 16.1.4 (satisfied)
2. **No `runtime = 'nodejs'` declarations** - Verified none exist
3. **Remove legacy route config** - 6 files need `dynamic` export removed

### External Dependencies

- Vercel deployment (full Cache Components support)
- OR Self-hosted with Next.js standalone output (current setup)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cache serving stale data | Medium | High | Comprehensive tag invalidation strategy |
| Build time increase | Low | Low | PPR enables faster incremental builds |
| Debugging complexity | Medium | Medium | Logging for cache hits/misses |
| Tenant data leakage | Low | Critical | Always include company_id in cache keys |

---

## Success Metrics

1. **Performance**: 30% reduction in average page load time (measured via Lighthouse)
2. **Database Load**: 40% reduction in duplicate queries (measured via Supabase metrics)
3. **User Experience**: Static shell visible within 100ms on fast 3G
4. **Stability**: Zero cache-related bugs in production for 2 weeks post-launch

---

## References

- [Next.js 16 Cache Components Documentation](https://nextjs.org/docs/app/getting-started/cache-components)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [cacheTag and revalidateTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)

---

**Status:** PENDING APPROVAL

**Approval Required:** [ ] Yes / [ ] No (proceed to design)

---

## Summary

This requirements document defines the scope for enabling Next.js 16 Cache Components in GenHub:

- **6 User Stories** covering performance, caching, invalidation, state preservation, API compatibility, and personalization
- **6 Files** requiring migration from legacy `dynamic` export
- **Key APIs**: `use cache`, `cacheLife`, `cacheTag`, `updateTag`/`revalidateTag`
- **Risk**: Tenant data isolation via company_id cache keys

**Next Step:** Awaiting approval to proceed to Phase 2: Technical Design.
