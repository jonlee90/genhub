-- Migration: Remove expense approval workflow
-- Decision: Expenses are plain CRUD data — no approval gate.
-- All expenses count in financials/KPIs regardless of former status.
--
-- Steps:
--   1. Drop status-based indexes
--   2. Rebuild views/functions that filtered expenses by status
--   3. Drop approval columns from expenses table
--   4. Drop expense_status enum
--   5. Note on orphaned notification enum values

-- ============================================================
-- STEP 1: Drop status-based indexes
-- ============================================================

DROP INDEX IF EXISTS idx_expenses_task_status;
DROP INDEX IF EXISTS idx_expenses_project_status;
-- Also drop the compound status indexes that will become useless
DROP INDEX IF EXISTS expenses_status_idx;
DROP INDEX IF EXISTS expenses_company_status_idx;
DROP INDEX IF EXISTS expenses_project_status_idx;

-- ============================================================
-- STEP 2: Rebuild mv_dashboard_kpis (most recent base:
--         20260206000002_exclude_archived_from_dashboard_kpis.sql)
--
-- Changes:
--   - expense_stats CTE: remove status filters, count/sum ALL expenses
--   - Remove pending_expenses / pending_expense_amount columns
--   - Rename approved_expense_amount -> expenses_total_amount
-- ============================================================

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
    COUNT(*) as expenses_total,
    COALESCE(SUM(e.amount), 0) as expenses_total_amount
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

  -- Expense Stats (no approval workflow — all expenses count)
  COALESCE(es.expenses_total, 0) as expenses_total,
  COALESCE(es.expenses_total_amount, 0) as expenses_total_amount,

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

COMMENT ON MATERIALIZED VIEW mv_dashboard_kpis IS 'Pre-aggregated dashboard KPIs by company. Uses CTE-based pre-aggregation to avoid Cartesian product inflation of SUM columns. Excludes archived projects from all aggregations except archived_projects count. No expense approval workflow — all expenses count. Refresh via refresh_dashboard_kpis() function.';

-- Refresh to populate with correct data
REFRESH MATERIALIZED VIEW mv_dashboard_kpis;


-- ============================================================
-- STEP 2b: Rebuild get_task_analytics
-- (most recent base: 20260206000001_exclude_archived_from_task_analytics.sql)
--
-- Changes:
--   - RETURNS TABLE: replace expenses_pending/approved with expenses_total
--     and pending_amount/approved_amount with total_amount
--   - expense_stats CTE: remove status filters, count/sum ALL expenses
--
-- Must DROP first because RETURNS TABLE signature is changing
-- ============================================================

DROP FUNCTION IF EXISTS get_task_analytics(TEXT, UUID);

CREATE OR REPLACE FUNCTION get_task_analytics(
  project_filter TEXT,
  p_company_id UUID
)
RETURNS TABLE (
  -- Completion metrics
  total_tasks BIGINT,
  completed BIGINT,
  completion_rate INT,

  -- Schedule metrics
  overdue BIGINT,
  at_risk BIGINT,
  on_time BIGINT,

  -- Budget metrics
  total_planned NUMERIC,
  total_actual NUMERIC,
  budget_variance NUMERIC,
  budget_utilization INT,

  -- Blocked tasks
  blocked_count BIGINT,
  blocked_rate INT,
  top_blocked_reasons TEXT[],

  -- Workload
  unassigned BIGINT,
  top_assignees_json JSON,

  -- Materials
  materials_needed BIGINT,
  materials_ordered BIGINT,
  materials_delivered BIGINT,

  -- Priority
  priority_high BIGINT,
  priority_medium BIGINT,
  priority_low BIGINT,

  -- Expenses (no approval workflow — all expenses count)
  expenses_total BIGINT,
  total_amount NUMERIC,

  -- Dependencies
  blocked_by_deps BIGINT,
  ready_to_start BIGINT,

  -- Velocity
  tasks_per_day NUMERIC(5,1),
  velocity_trend INT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  -- Base CTE: Filtered tasks with company scope, excluding archived projects
  WITH filtered_tasks AS (
    SELECT
      t.*,
      up.name as assignee_name,
      up.avatar_url as assignee_avatar
    FROM tasks t
    LEFT JOIN user_profiles up ON t.assignee_id = up.id
    WHERE t.project_id IN (
      SELECT id FROM projects WHERE company_id = p_company_id AND status != 'archived'
    )
    AND (
      CASE
        WHEN project_filter = 'all' THEN TRUE
        ELSE t.project_id = project_filter::uuid
      END
    )
  ),

  -- Aggregations using FILTER clause (PostgreSQL 9.4+)
  task_stats AS (
    SELECT
      -- Completion metrics
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,

      -- Schedule metrics
      COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
      COUNT(*) FILTER (WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
                       AND status IN ('todo', 'in_progress')) as at_risk,

      -- Budget metrics
      COALESCE(SUM(planned_cost), 0) as total_planned,
      COALESCE(SUM(actual_cost), 0) as total_actual,

      -- Blocked tasks
      COUNT(*) FILTER (WHERE status = 'blocked') as blocked_count,

      -- Unassigned tasks
      COUNT(*) FILTER (WHERE assignee_id IS NULL) as unassigned,

      -- Priority distribution
      COUNT(*) FILTER (WHERE priority = 'high') as priority_high,
      COUNT(*) FILTER (WHERE priority = 'medium') as priority_medium,
      COUNT(*) FILTER (WHERE priority = 'low') as priority_low,

      -- Velocity (last 7 days)
      COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days') as last_7_days,
      COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '14 days'
                       AND completed_at < NOW() - INTERVAL '7 days') as prev_7_days
    FROM filtered_tasks
  ),

  -- Top blockers
  top_blockers AS (
    SELECT blocked_reason
    FROM filtered_tasks
    WHERE status = 'blocked' AND blocked_reason IS NOT NULL
    GROUP BY blocked_reason
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ),

  -- Top assignees
  top_assignees AS (
    SELECT
      assignee_id as id,
      assignee_name as name,
      assignee_avatar as avatar_url,
      COUNT(*) as task_count
    FROM filtered_tasks
    WHERE assignee_id IS NOT NULL
    GROUP BY assignee_id, assignee_name, assignee_avatar
    ORDER BY task_count DESC
    LIMIT 3
  ),

  -- Material stats (requires join)
  material_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE ma.procurement_status = 'needed') as materials_needed,
      COUNT(*) FILTER (WHERE ma.procurement_status = 'ordered') as materials_ordered,
      COUNT(*) FILTER (WHERE ma.procurement_status = 'delivered') as materials_delivered
    FROM material_assignments ma
    WHERE ma.task_id IN (SELECT id FROM filtered_tasks)
  ),

  -- Expense stats (no approval workflow — count/sum ALL expenses)
  expense_stats AS (
    SELECT
      COUNT(*) as expenses_total,
      COALESCE(SUM(e.amount), 0) as total_amount
    FROM expenses e
    WHERE e.task_id IN (SELECT id FROM filtered_tasks)
  ),

  -- Dependency stats
  dependency_stats AS (
    SELECT COUNT(DISTINCT td.task_id) as blocked_by_deps
    FROM task_dependencies td
    INNER JOIN filtered_tasks ft ON td.task_id = ft.id
    INNER JOIN tasks dependency_task ON td.depends_on_task_id = dependency_task.id
    WHERE dependency_task.status != 'completed'
  )

  -- Final result: Single row with all analytics
  SELECT
    -- Completion
    ts.total_tasks,
    ts.completed,
    CASE WHEN ts.total_tasks > 0 THEN (ts.completed::float / ts.total_tasks * 100)::int ELSE 0 END as completion_rate,

    -- Schedule
    ts.overdue,
    ts.at_risk,
    (ts.total_tasks - ts.overdue - ts.at_risk) as on_time,

    -- Budget
    ts.total_planned,
    ts.total_actual,
    (ts.total_planned - ts.total_actual) as budget_variance,
    CASE WHEN ts.total_planned > 0 THEN (ts.total_actual / ts.total_planned * 100)::int ELSE 0 END as budget_utilization,

    -- Blocked
    ts.blocked_count,
    CASE WHEN ts.total_tasks > 0 THEN (ts.blocked_count::float / ts.total_tasks * 100)::int ELSE 0 END as blocked_rate,
    ARRAY(SELECT blocked_reason FROM top_blockers) as top_blocked_reasons,

    -- Workload
    ts.unassigned,
    (SELECT json_agg(row_to_json(ta.*)) FROM top_assignees ta) as top_assignees_json,

    -- Materials
    COALESCE(ms.materials_needed, 0) as materials_needed,
    COALESCE(ms.materials_ordered, 0) as materials_ordered,
    COALESCE(ms.materials_delivered, 0) as materials_delivered,

    -- Priority
    ts.priority_high,
    ts.priority_medium,
    ts.priority_low,

    -- Expenses
    COALESCE(es.expenses_total, 0) as expenses_total,
    COALESCE(es.total_amount, 0) as total_amount,

    -- Dependencies
    COALESCE(ds.blocked_by_deps, 0) as blocked_by_deps,
    (ts.total_tasks - COALESCE(ds.blocked_by_deps, 0)) as ready_to_start,

    -- Velocity
    CASE WHEN ts.last_7_days > 0 THEN (ts.last_7_days::float / 7)::numeric(5,1) ELSE 0 END as tasks_per_day,
    CASE
      WHEN ts.prev_7_days > 0 THEN ((ts.last_7_days - ts.prev_7_days)::float / ts.prev_7_days * 100)::int
      ELSE 0
    END as velocity_trend
  FROM task_stats ts
  CROSS JOIN material_stats ms
  CROSS JOIN expense_stats es
  CROSS JOIN dependency_stats ds;
$$;

COMMENT ON FUNCTION get_task_analytics(TEXT, UUID) IS
  'Aggregates task analytics metrics for TaskBoard dashboard. Excludes archived projects. Filters by company_id for security. Returns single row. No expense approval workflow — all expenses counted. Performance target: < 500ms for 1000 tasks.';


-- ============================================================
-- STEP 2c: Rebuild get_projects_with_stats
-- (live function body retrieved via pg_get_functiondef)
--
-- Changes:
--   - expense_stats CTE: remove status-based sub-counts,
--     keep only expenses_total and expenses_total_amount
--   - Remove expenses_approved, expenses_pending, expenses_rejected,
--     expenses_approved_amount, expenses_pending_amount from output
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_projects_with_stats(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH task_stats AS (
    SELECT
      t.project_id,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
      COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
      COUNT(*) FILTER (WHERE t.status = 'blocked') as blocked_tasks,
      COUNT(*) FILTER (WHERE t.status = 'todo') as todo_tasks,
      COUNT(*) FILTER (
        WHERE t.due_date IS NOT NULL
        AND t.due_date < CURRENT_DATE
        AND t.status NOT IN ('completed')
      ) as overdue_tasks,
      COALESCE(SUM(t.actual_cost), 0) as actual_spent,
      COALESCE(SUM(t.planned_cost), 0) as planned_cost
    FROM tasks t
    GROUP BY t.project_id
  ),
  material_stats AS (
    SELECT
      ma.project_id,
      COUNT(*) FILTER (WHERE ma.procurement_status = 'needed') as materials_needed,
      COUNT(*) FILTER (WHERE ma.procurement_status = 'ordered') as materials_ordered,
      COUNT(*) FILTER (WHERE ma.procurement_status IN ('delivered', 'installed')) as materials_delivered
    FROM material_assignments ma
    GROUP BY ma.project_id
  ),
  team_stats AS (
    SELECT
      pt.project_id,
      COUNT(DISTINCT pt.user_id) as team_size
    FROM project_team pt
    GROUP BY pt.project_id
  ),
  expense_stats AS (
    SELECT
      e.project_id,
      COUNT(*) as expenses_total,
      COALESCE(SUM(e.amount), 0) as expenses_total_amount
    FROM expenses e
    GROUP BY e.project_id
  ),
  -- Calculate schedule status in SQL instead of JavaScript
  -- Note: date - date returns integer in PostgreSQL (number of days)
  schedule_calc AS (
    SELECT
      p.id as project_id,
      -- Days remaining (date subtraction returns integer days directly)
      GREATEST(0, (p.end_date - CURRENT_DATE)) as days_remaining,
      -- Raw days remaining (can be negative for overdue)
      (p.end_date - CURRENT_DATE) as raw_days_remaining,
      -- Total project duration in days
      NULLIF((p.end_date - p.start_date), 0) as total_days,
      -- Elapsed days since start
      (CURRENT_DATE - p.start_date) as elapsed_days,
      p.completion_percentage
    FROM projects p
    WHERE p.company_id = p_company_id
  ),
  schedule_status AS (
    SELECT
      sc.project_id,
      sc.days_remaining,
      -- Calculate expected progress as percentage
      CASE
        WHEN sc.total_days IS NULL THEN 0
        WHEN sc.elapsed_days <= 0 THEN 0
        WHEN sc.elapsed_days >= sc.total_days THEN 100
        ELSE LEAST(100, GREATEST(0, (sc.elapsed_days::numeric / sc.total_days * 100)))
      END as expected_progress,
      sc.raw_days_remaining,
      COALESCE(sc.completion_percentage, 0) as actual_progress
    FROM schedule_calc sc
  ),
  schedule_final AS (
    SELECT
      ss.project_id,
      ss.days_remaining::integer,
      -- Calculate days behind based on progress difference
      GREATEST(0, ROUND(
        ((ss.expected_progress - ss.actual_progress) / 100.0) * ss.days_remaining
      ))::integer as days_behind,
      -- Determine status
      CASE
        WHEN ss.raw_days_remaining < 0 THEN 'delayed'
        WHEN GREATEST(0, ROUND(
          ((ss.expected_progress - ss.actual_progress) / 100.0) * ss.days_remaining
        ))::integer > 5 THEN 'delayed'
        WHEN GREATEST(0, ROUND(
          ((ss.expected_progress - ss.actual_progress) / 100.0) * ss.days_remaining
        ))::integer >= 1 THEN 'at-risk'
        ELSE 'on-time'
      END as schedule_status
    FROM schedule_status ss
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'company_id', p.company_id,
      'name', p.name,
      'description', p.description,
      'status', p.status,
      'project_type', p.project_type,
      'start_date', p.start_date,
      'end_date', p.end_date,
      'budget', p.budget,
      'actual_cost', p.actual_cost,
      'completion_percentage', p.completion_percentage,
      'health_score', p.health_score,
      'client_name', p.client_name,
      'client_email', p.client_email,
      'client_phone', p.client_phone,
      'address', p.address,
      'city', p.city,
      'state', p.state,
      'zip_code', p.zip_code,
      'latitude', p.latitude,
      'longitude', p.longitude,
      'image_url', p.image_url,
      'project_type_config_id', p.project_type_config_id,
      'created_by', p.created_by,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'stats', jsonb_build_object(
        'total_tasks', COALESCE(ts.total_tasks, 0),
        'completed_tasks', COALESCE(ts.completed_tasks, 0),
        'in_progress_tasks', COALESCE(ts.in_progress_tasks, 0),
        'blocked_tasks', COALESCE(ts.blocked_tasks, 0),
        'todo_tasks', COALESCE(ts.todo_tasks, 0),
        'overdue_tasks', COALESCE(ts.overdue_tasks, 0),
        'actual_spent', COALESCE(ts.actual_spent, 0),
        'planned_cost', COALESCE(ts.planned_cost, 0),
        'materials_needed', COALESCE(ms.materials_needed, 0),
        'materials_ordered', COALESCE(ms.materials_ordered, 0),
        'materials_delivered', COALESCE(ms.materials_delivered, 0),
        'team_size', COALESCE(tms.team_size, 0),
        'expenses_total', COALESCE(es.expenses_total, 0),
        'expenses_total_amount', COALESCE(es.expenses_total_amount, 0),
        -- Pre-calculated schedule status from SQL
        'schedule_days_remaining', COALESCE(sf.days_remaining, 0),
        'schedule_days_behind', COALESCE(sf.days_behind, 0),
        'schedule_status', COALESCE(sf.schedule_status, 'on-time')
      )
    ) ORDER BY p.created_at DESC
  )
  FROM projects p
  LEFT JOIN task_stats ts ON ts.project_id = p.id
  LEFT JOIN material_stats ms ON ms.project_id = p.id
  LEFT JOIN team_stats tms ON tms.project_id = p.id
  LEFT JOIN expense_stats es ON es.project_id = p.id
  LEFT JOIN schedule_final sf ON sf.project_id = p.id
  WHERE p.company_id = p_company_id
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_projects_with_stats(UUID, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_projects_with_stats IS
  'Returns paginated project list with aggregated stats per project. No expense approval workflow — all expenses counted via expenses_total and expenses_total_amount.';


-- ============================================================
-- STEP 2d: Rebuild get_project_detail_with_stats
-- (live function body retrieved via pg_get_functiondef)
--
-- Changes:
--   - Overall expense_stats sub-query: remove status-based keys,
--     keep only total and totalAmount
-- ============================================================

CREATE OR REPLACE FUNCTION get_project_detail_with_stats(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'project', (
      SELECT row_to_json(p) FROM (
        SELECT
          proj.id,
          proj.name,
          proj.status,
          proj.start_date,
          proj.end_date,
          proj.budget,
          proj.company_id,
          proj.created_by,
          proj.created_at,
          proj.updated_at,
          proj.address,
          proj.description,
          proj.project_type,
          proj.client_name,
          proj.client_email,
          proj.client_phone,

          -- Calculated health score
          calculate_project_health_score(p_project_id) as calculated_health_score,

          -- Material stats per task
          (SELECT json_object_agg(
            t.id::text,
            json_build_object(
              'count', COALESCE(ma_stats.count, 0),
              'totalCost', COALESCE(ma_stats.total_cost, 0)
            )
          )
          FROM tasks t
          LEFT JOIN (
            SELECT task_id, COUNT(*) as count, SUM(total_cost) as total_cost
            FROM material_assignments
            WHERE project_id = p_project_id
            GROUP BY task_id
          ) ma_stats ON ma_stats.task_id = t.id
          WHERE t.project_id = p_project_id
          ) as material_stats_by_task,

          -- Expense stats per task
          (SELECT json_object_agg(
            t.id::text,
            json_build_object(
              'count', COALESCE(exp_stats.count, 0),
              'totalAmount', COALESCE(exp_stats.total_amount, 0)
            )
          )
          FROM tasks t
          LEFT JOIN (
            SELECT task_id, COUNT(*) as count, SUM(amount) as total_amount
            FROM expenses
            WHERE task_id IS NOT NULL AND project_id = p_project_id
            GROUP BY task_id
          ) exp_stats ON exp_stats.task_id = t.id
          WHERE t.project_id = p_project_id
          ) as expense_stats_by_task,

          -- Overall expense stats (no approval workflow — all expenses count)
          (SELECT json_build_object(
            'total', COUNT(*),
            'totalAmount', COALESCE(SUM(amount), 0)
          )
          FROM expenses
          WHERE project_id = p_project_id
          ) as expense_stats,

          -- Phase task stats
          (SELECT json_object_agg(
            pp.id::text,
            json_build_object(
              'totalTasks', COALESCE(phase_stats.total, 0),
              'completedTasks', COALESCE(phase_stats.completed, 0),
              'blockedTasks', COALESCE(phase_stats.blocked, 0),
              'overdueTasks', COALESCE(phase_stats.overdue, 0)
            )
          )
          FROM project_phases pp
          LEFT JOIN (
            SELECT
              phase_id,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'completed') as completed,
              COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
              COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue
            FROM tasks
            WHERE project_id = p_project_id
            GROUP BY phase_id
          ) phase_stats ON phase_stats.phase_id = pp.id
          WHERE pp.project_id = p_project_id
          ) as phase_task_stats,

          -- Overall task stats
          (SELECT json_build_object(
            'total', COUNT(*),
            'completed', COUNT(*) FILTER (WHERE status = 'completed'),
            'inProgress', COUNT(*) FILTER (WHERE status = 'in_progress'),
            'blocked', COUNT(*) FILTER (WHERE status = 'blocked'),
            'overdue', COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed'),
            'totalPlannedCost', COALESCE(SUM(planned_cost), 0),
            'totalActualCost', COALESCE(SUM(actual_cost), 0),
            'budgetVariance', COALESCE(SUM(planned_cost) - SUM(actual_cost), 0),
            'budgetUtilization', CASE
              WHEN SUM(planned_cost) > 0 THEN (SUM(actual_cost) / SUM(planned_cost)) * 100
              ELSE 0
            END,
            'unassignedCount', COUNT(*) FILTER (WHERE assignee_id IS NULL AND status != 'completed'),
            'tasksWithMaterials', (
              SELECT COUNT(DISTINCT task_id)
              FROM material_assignments
              WHERE project_id = p_project_id AND task_id IS NOT NULL
            ),
            'totalMaterialCost', (
              SELECT COALESCE(SUM(total_cost), 0)
              FROM material_assignments
              WHERE project_id = p_project_id
            )
          )
          FROM tasks
          WHERE project_id = p_project_id
          ) as task_stats,

          -- Top assignees by workload (active tasks only)
          (SELECT json_agg(
            json_build_object(
              'id', up.id,
              'name', up.name,
              'avatar_url', up.avatar_url,
              'taskCount', assignee_counts.task_count
            )
          )
          FROM (
            SELECT assignee_id, COUNT(*) as task_count
            FROM tasks
            WHERE project_id = p_project_id
              AND status != 'completed'
              AND assignee_id IS NOT NULL
            GROUP BY assignee_id
            ORDER BY COUNT(*) DESC
            LIMIT 3
          ) assignee_counts
          JOIN user_profiles up ON up.id = assignee_counts.assignee_id
          ) as top_assignees

        FROM projects proj
        WHERE proj.id = p_project_id
      ) p
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_project_detail_with_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_project_detail_with_stats(UUID) IS
  'Returns comprehensive project statistics including task stats, expense stats, material costs, phase stats, top assignees, and calculated health score. No expense approval workflow — all expenses counted.';


-- ============================================================
-- STEP 3: Drop approval columns from expenses table
-- ============================================================

ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS approval_notes,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS submitted_at,
  DROP COLUMN IF EXISTS submitted_by;


-- ============================================================
-- STEP 4: Drop the expense_status enum
-- (must be after columns are dropped)
-- ============================================================

DROP TYPE IF EXISTS public.expense_status;


-- ============================================================
-- STEP 5: Notification enum note
-- The notification_type enum still contains values:
--   expense_submitted, expense_approved, expense_rejected
-- Postgres cannot remove individual enum values without recreating
-- the type. These values are now dead (all send-sites will be
-- removed in application code) but are harmless to leave in place.
-- ============================================================
