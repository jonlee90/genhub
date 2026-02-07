# Plan: Exclude Archived Projects from All Non-Project Modules

## Context
When a project is archived, its tasks, expenses, materials, and other data still appear in cross-module views (tasks page, dashboard, chat search, etc.). The user wants archived projects to be invisible across the entire app — except on the projects page itself where archived status is managed.

## Scope
- **Exclude:** Every cross-project listing/aggregation outside the projects module
- **Keep as-is:** The `/app/projects` page (it should still display archived projects with their status badge)
- **Keep as-is:** Project-specific pages (e.g., `/app/projects/[id]`) — if a user navigates directly to an archived project, that's fine

## Already Protected (no changes needed)
| Location | Current Filter |
|----------|---------------|
| `app/actions/expenses.ts` `getInitialExpensesPageData()` | `.eq("status", "active")` |
| `lib/materials.ts` `getMaterialsData()` | `.eq("status", "active")` |
| `app/actions/dashboard.ts` `getQuickActionData()` | `.in("status", ["planning", "active"])` |
| `app/app/tasks/new/page.tsx` | `.eq("status", "active")` |
| `app/actions/phases.ts` | All queries are project-specific (by ID) |

---

## Changes Required

### 1. `lib/tasks.ts` — Tasks page data (HIGHEST PRIORITY)

**a) Projects query (line ~86):** Add `.neq("status", "archived")` after `.eq("company_id", companyId)`
```typescript
.eq("company_id", companyId)
.neq("status", "archived")   // ← ADD
.order("name"),
```

**b) Tasks query (line ~126):** Add `.neq("project.status", "archived")` to the inner join filter
```typescript
.eq("project.company_id", companyId)
.neq("project.status", "archived")   // ← ADD
```

### 2. `app/actions/chat-search.ts` — Chat project search (line ~136)

Add `.neq("status", "archived")` to `searchProjects()`:
```typescript
.eq('company_id', companyId)
.neq('status', 'archived')   // ← ADD
.ilike('name', `%${searchQuery}%`)
```

### 3. `app/actions/projects.ts` — Project count for pagination (line ~1196)

Add `.neq("status", "archived")` to the count query in `fetchProjectsWithStats()`:
```typescript
.from("projects")
.select("id", { count: "exact", head: true })
.eq("company_id", companyId)
.neq("status", "archived")   // ← ADD
```

### 4. `get_projects_with_stats` RPC — DB function

**SKIP** — the projects page is the one place that should show archived projects.

### 5. `get_task_analytics` RPC — DB function (line 73 of migration)

The subquery `SELECT id FROM projects WHERE company_id = p_company_id` does NOT exclude archived. Add the filter:
```sql
SELECT id FROM projects WHERE company_id = p_company_id AND status != 'archived'
```

New migration file: `supabase/migrations/{timestamp}_exclude_archived_from_task_analytics.sql`

### 6. `mv_dashboard_kpis` materialized view

The view joins `FROM projects p LEFT JOIN tasks t ON t.project_id = p.id` with no status filter on projects. Task counts, expense counts, material counts, and budget totals all include archived project data.

Add `WHERE p.status != 'archived'` to the main query. This will exclude archived project data from all dashboard KPI aggregations while still allowing the separate `archived_projects` count (which uses a FILTER clause).

New migration file: `supabase/migrations/{timestamp}_exclude_archived_from_dashboard_kpis.sql`

This migration must:
1. `DROP MATERIALIZED VIEW mv_dashboard_kpis` (with CASCADE on the index)
2. Recreate with `WHERE p.status != 'archived'`
3. Recreate the unique index
4. Refresh the view

### 7. `app/actions/owner.ts` — Admin project count (line 394)

**SKIP** — super-admin panel should count ALL projects including archived for admin statistics.

---

## Summary of Files to Modify

| # | File | Change | Type |
|---|------|--------|------|
| 1 | `lib/tasks.ts` | Add `.neq("status", "archived")` to projects + tasks queries | App code |
| 2 | `app/actions/chat-search.ts` | Add `.neq("status", "archived")` to searchProjects | App code |
| 3 | `app/actions/projects.ts` | Add `.neq("status", "archived")` to count query | App code |
| 4 | `supabase/migrations/...exclude_archived_from_task_analytics.sql` | Update `get_task_analytics` RPC | DB migration |
| 5 | `supabase/migrations/...exclude_archived_from_dashboard_kpis.sql` | Recreate `mv_dashboard_kpis` without archived | DB migration |

## Verification
1. `npm run lint:ts` — TypeScript check passes
2. Navigate to `/app/tasks` — no tasks from archived projects should appear, project filter dropdown should not list archived projects
3. Navigate to `/app/projects` — archived projects should still appear with their status
4. Chat search — searching for an archived project name returns no results
5. Dashboard — KPI totals should not include archived project data
6. `npm run build` — production build passes
