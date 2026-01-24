-- Fix mv_dashboard_kpis to handle companies with zero projects
-- Previous version started with FROM projects, so companies with no projects had no row
-- This version starts with FROM companies to ensure every company has a row

-- Drop the existing materialized view and recreate it
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kpis CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_kpis AS
SELECT
  c.id as company_id,

  -- Project Stats
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'on_hold') as on_hold_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed') as completed_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'archived') as archived_projects,
  COALESCE(SUM(p.budget), 0) as total_budget,

  -- Task Stats - Status
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'todo') as todo_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'blocked') as blocked_tasks,

  -- Task Stats - Due Dates
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'completed') as overdue_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date = CURRENT_DATE AND t.status != 'completed') as due_today_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.due_date <= (CURRENT_DATE + INTERVAL '7 days') AND t.status != 'completed') as due_this_week_tasks,

  -- Task Stats - Schedule Health (tasks with due dates only)
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date >= (CURRENT_DATE + INTERVAL '3 days') AND t.status != 'completed') as on_time_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date >= CURRENT_DATE AND t.due_date < (CURRENT_DATE + INTERVAL '3 days') AND t.status != 'completed') as at_risk_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'completed') as delayed_tasks,

  -- Task Stats - Other
  COUNT(DISTINCT t.id) FILTER (WHERE t.approval_status = 'pending') as pending_approval_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE NOT EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id)) as unassigned_tasks,
  COALESCE(SUM(t.planned_cost), 0) as total_planned_cost,
  COALESCE(SUM(t.actual_cost), 0) as total_actual_cost,

  -- Material Stats
  COUNT(DISTINCT ma.id) as total_materials,
  COUNT(DISTINCT ma.id) FILTER (WHERE ma.procurement_status = 'needed') as materials_needed,
  COUNT(DISTINCT ma.id) FILTER (WHERE ma.procurement_status = 'ordered') as materials_ordered,
  COUNT(DISTINCT ma.id) FILTER (WHERE ma.procurement_status = 'delivered' OR ma.procurement_status = 'installed') as materials_delivered,

  -- Expense Stats
  COUNT(DISTINCT e.id) FILTER (WHERE e.status IN ('submitted', 'under_review')) as pending_expenses,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status IN ('submitted', 'under_review')), 0) as pending_expense_amount,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'approved' OR e.status = 'paid'), 0) as approved_expense_amount,

  -- Team Stats
  COUNT(DISTINCT cu.user_id) FILTER (WHERE cu.status = 'active') as team_size,

  -- Timestamp
  CURRENT_TIMESTAMP as last_updated

FROM companies c
LEFT JOIN projects p ON p.company_id = c.id
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN material_assignments ma ON ma.project_id = p.id
LEFT JOIN expenses e ON e.project_id = p.id
LEFT JOIN company_users cu ON cu.company_id = c.id
GROUP BY c.id;

-- Create unique index for fast lookups by company_id
CREATE UNIQUE INDEX idx_mv_dashboard_kpis_company
ON mv_dashboard_kpis(company_id);

-- Recreate refresh function (same as before)
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

-- Grant SELECT on the view to authenticated users (RLS enforced via company_id filter)
GRANT SELECT ON mv_dashboard_kpis TO authenticated;

-- Comment for documentation
COMMENT ON MATERIALIZED VIEW mv_dashboard_kpis IS 'Pre-aggregated dashboard KPIs by company. Starts from companies table to ensure every company has a row even with zero projects. Refresh via refresh_dashboard_kpis() function. Expected refresh: every 5 minutes.';

-- Initial refresh to populate the view
REFRESH MATERIALIZED VIEW mv_dashboard_kpis;
