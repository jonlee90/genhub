-- Fix mv_dashboard_kpis: exclude archived projects AND fix Cartesian product bug
--
-- BUG: The previous view used multiple LEFT JOINs on independent fact tables
-- (tasks, materials, expenses, team) which created a cross-product. This caused
-- all SUM() columns (budget, costs, expense amounts) to be inflated by the
-- multiplication factor of rows from other tables.
--
-- FIX: Pre-aggregate each fact table into separate CTEs keyed by company_id,
-- then LEFT JOIN the pre-aggregated results. This gives exactly 1 row per
-- company per CTE, eliminating inflation.
--
-- Also excludes archived projects from all aggregations (except archived_projects count).

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kpis CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_kpis AS
WITH project_stats AS (
  SELECT
    company_id,
    COUNT(*) FILTER (WHERE status != 'archived') as total_projects,
    COUNT(*) FILTER (WHERE status = 'active') as active_projects,
    COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
    COUNT(*) FILTER (WHERE status = 'archived') as archived_projects,
    COALESCE(SUM(budget) FILTER (WHERE status != 'archived'), 0) as total_budget
  FROM projects
  GROUP BY company_id
),
task_stats AS (
  SELECT
    p.company_id,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
    COUNT(*) FILTER (WHERE t.status = 'todo') as todo_tasks,
    COUNT(*) FILTER (WHERE t.status = 'blocked') as blocked_tasks,
    COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'completed') as overdue_tasks,
    COUNT(*) FILTER (WHERE t.due_date = CURRENT_DATE AND t.status != 'completed') as due_today_tasks,
    COUNT(*) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.due_date <= (CURRENT_DATE + INTERVAL '7 days') AND t.status != 'completed') as due_this_week_tasks,
    COUNT(*) FILTER (WHERE t.due_date >= (CURRENT_DATE + INTERVAL '3 days') AND t.status != 'completed') as on_time_tasks,
    COUNT(*) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.due_date < (CURRENT_DATE + INTERVAL '3 days') AND t.status != 'completed') as at_risk_tasks,
    COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'completed') as delayed_tasks,
    COUNT(*) FILTER (WHERE t.approval_status = 'pending') as pending_approval_tasks,
    COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id)) as unassigned_tasks,
    COALESCE(SUM(t.planned_cost), 0) as total_planned_cost,
    COALESCE(SUM(t.actual_cost), 0) as total_actual_cost
  FROM tasks t
  JOIN projects p ON t.project_id = p.id AND p.status != 'archived'
  GROUP BY p.company_id
),
material_stats AS (
  SELECT
    p.company_id,
    COUNT(*) as total_materials,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'needed') as materials_needed,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'ordered') as materials_ordered,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'delivered' OR ma.procurement_status = 'installed') as materials_delivered
  FROM material_assignments ma
  JOIN projects p ON ma.project_id = p.id AND p.status != 'archived'
  GROUP BY p.company_id
),
expense_stats AS (
  SELECT
    p.company_id,
    COUNT(*) FILTER (WHERE e.status IN ('submitted', 'under_review')) as pending_expenses,
    COALESCE(SUM(e.amount) FILTER (WHERE e.status IN ('submitted', 'under_review')), 0) as pending_expense_amount,
    COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'approved' OR e.status = 'paid'), 0) as approved_expense_amount
  FROM expenses e
  JOIN projects p ON e.project_id = p.id AND p.status != 'archived'
  GROUP BY p.company_id
),
team_stats AS (
  SELECT
    company_id,
    COUNT(*) FILTER (WHERE status = 'active') as team_size
  FROM company_users
  GROUP BY company_id
)
SELECT
  c.id as company_id,

  -- Project Stats
  COALESCE(ps.total_projects, 0) as total_projects,
  COALESCE(ps.active_projects, 0) as active_projects,
  COALESCE(ps.on_hold_projects, 0) as on_hold_projects,
  COALESCE(ps.completed_projects, 0) as completed_projects,
  COALESCE(ps.archived_projects, 0) as archived_projects,
  COALESCE(ps.total_budget, 0) as total_budget,

  -- Task Stats - Status
  COALESCE(ts.total_tasks, 0) as total_tasks,
  COALESCE(ts.completed_tasks, 0) as completed_tasks,
  COALESCE(ts.in_progress_tasks, 0) as in_progress_tasks,
  COALESCE(ts.todo_tasks, 0) as todo_tasks,
  COALESCE(ts.blocked_tasks, 0) as blocked_tasks,

  -- Task Stats - Due Dates
  COALESCE(ts.overdue_tasks, 0) as overdue_tasks,
  COALESCE(ts.due_today_tasks, 0) as due_today_tasks,
  COALESCE(ts.due_this_week_tasks, 0) as due_this_week_tasks,

  -- Task Stats - Schedule Health
  COALESCE(ts.on_time_tasks, 0) as on_time_tasks,
  COALESCE(ts.at_risk_tasks, 0) as at_risk_tasks,
  COALESCE(ts.delayed_tasks, 0) as delayed_tasks,

  -- Task Stats - Other
  COALESCE(ts.pending_approval_tasks, 0) as pending_approval_tasks,
  COALESCE(ts.unassigned_tasks, 0) as unassigned_tasks,
  COALESCE(ts.total_planned_cost, 0) as total_planned_cost,
  COALESCE(ts.total_actual_cost, 0) as total_actual_cost,

  -- Material Stats
  COALESCE(ms.total_materials, 0) as total_materials,
  COALESCE(ms.materials_needed, 0) as materials_needed,
  COALESCE(ms.materials_ordered, 0) as materials_ordered,
  COALESCE(ms.materials_delivered, 0) as materials_delivered,

  -- Expense Stats
  COALESCE(es.pending_expenses, 0) as pending_expenses,
  COALESCE(es.pending_expense_amount, 0) as pending_expense_amount,
  COALESCE(es.approved_expense_amount, 0) as approved_expense_amount,

  -- Team Stats
  COALESCE(tms.team_size, 0) as team_size,

  -- Timestamp
  CURRENT_TIMESTAMP as last_updated

FROM companies c
LEFT JOIN project_stats ps ON ps.company_id = c.id
LEFT JOIN task_stats ts ON ts.company_id = c.id
LEFT JOIN material_stats ms ON ms.company_id = c.id
LEFT JOIN expense_stats es ON es.company_id = c.id
LEFT JOIN team_stats tms ON tms.company_id = c.id;

-- Create unique index for fast lookups and concurrent refresh
CREATE UNIQUE INDEX idx_mv_dashboard_kpis_company
ON mv_dashboard_kpis(company_id);

-- Recreate refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_kpis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
END;
$$;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON mv_dashboard_kpis TO authenticated;

COMMENT ON MATERIALIZED VIEW mv_dashboard_kpis IS 'Pre-aggregated dashboard KPIs by company. Uses CTE-based pre-aggregation to avoid Cartesian product inflation of SUM columns. Excludes archived projects from all aggregations except archived_projects count. Refresh via refresh_dashboard_kpis() function.';

-- Refresh to populate with correct data
REFRESH MATERIALIZED VIEW mv_dashboard_kpis;
