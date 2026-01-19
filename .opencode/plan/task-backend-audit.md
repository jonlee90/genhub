# Task Backend Audit + Performance Plan

## Goals

- Fast loading across all views: task list, kanban, task detail, project view, analytics/dashboard.
- Optimize all task endpoints for latency, payload size, and query count.
- Include DB-level improvements where needed.

---

## Phase 1 — Inventory & Baseline

1. Catalog all task endpoints in `app/actions/tasks.ts`.
   - CRUD, status updates, dependencies, comments, approvals, assignees, analytics, attachments.
2. Map each endpoint to consuming views.
   - Task list, kanban board, detail drawer/page, project view, analytics/dashboard.
3. Capture revalidation + notifications.
   - Identify cache churn and fan‑out.

**Outputs**

- Endpoint → View matrix
- Revalidation map
- Notification map

---

## Phase 2 — Query & Payload Profiling

1. Inspect all task read endpoints.
   - `select` shape, joins, filters, sorting, pagination.
2. Measure payload size and redundant fields.
   - Identify heavy nested joins in list endpoints.
3. Identify query patterns that drive N+1.
   - Activity logs, assignees, attachments, dependencies, analytics.

**Outputs**

- Per‑endpoint query profile
- Payload reduction opportunities
- N+1 risk list

---

## Phase 3 — Vercel Perf Rule Audit

Apply these rules across task data flows:

- `async-parallel` → parallelize independent fetches
- `server-cache-react` → cache user context, access checks, stable lookups
- `server-serialization` → trim list payloads, detail on demand
- `server-parallel-fetching` → reorganize view data fetches
- `async-api-routes` → start promises early, await late

**Outputs**

- Waterfall elimination checklist
- Cache/dedupe targets
- Serialization reductions per endpoint

---

## Phase 4 — Refactor & Shared Helpers

1. Extract shared access helpers.
   - User context, project access, task access.
2. Standardize return types + error shapes.
   - Reduce client branching.
3. Consolidate validation schemas.
   - Avoid duplicate validation rules.
4. Create shared query builders.
   - List vs detail vs analytics.

**Outputs**

- Refactor checklist
- Shared helper API proposal

---

## Phase 5 — DB-Level Optimization

1. Indexes (candidate set).
   - `tasks(project_id, status)`
   - `tasks(project_id, phase_id)`
   - `tasks(project_id, assignee_id)`
   - `task_assignees(task_id, user_id)`
   - `task_dependencies(task_id, depends_on_task_id)`
2. Optional view/RPC for analytics.
   - Pre‑aggregate counts for list/kanban metrics.
3. RLS + filter alignment.
   - Ensure indexed columns match filter patterns.

**Outputs**

- Index proposal list
- RPC/view design options

---

## Phase 6 — Fast Loading for All Views

1. Two‑tier payload strategy.
   - Minimal list payload for initial render.
   - Deferred detail fetch for activity/attachments/analytics.
2. Pagination everywhere.
   - Strict limits for lists + timeline/activity.
3. Cache short‑TTL hot data.
   - Assignees, task counts, lightweight summaries.
4. Reduce revalidation footprint.
   - Revalidate only necessary paths.

**Outputs**

- Per‑view loading strategy
- Pagination + caching blueprint

---

## Phase 7 — Validation & Rollout

1. Metrics tracking.
   - TTFB, payload size, query count, waterfall depth.
2. Staged rollout.
   - Read endpoints first → mutations → DB changes.
3. QA checklist.
   - RLS enforcement, role permissions, regression testing.

**Outputs**

- Rollout plan
- Metrics targets + validation checklist

---

## Deliverables

- Endpoint inventory matrix
- Query + payload profile report
- Refactor + optimization backlog
- DB index/view proposals
- Per‑view fast‑load strategy
