-- Migration: 20260103_create_task_analytics_function.sql
-- Purpose: Create optimized analytics function for TaskBoard
-- Performance target: < 500ms for 1000 tasks
-- Reference: docs/specs/taskboard-analytics-redesign/design.md (lines 316-482)

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

  -- Expenses
  expenses_pending BIGINT,
  pending_amount NUMERIC,
  expenses_approved BIGINT,
  approved_amount NUMERIC,

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
  -- Base CTE: Filtered tasks with company scope
  WITH filtered_tasks AS (
    SELECT
      t.*,
      up.name as assignee_name,
      up.avatar_url as assignee_avatar
    FROM tasks t
    LEFT JOIN user_profiles up ON t.assignee_id = up.id
    WHERE t.project_id IN (
      SELECT id FROM projects WHERE company_id = p_company_id
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

  -- Expense stats (requires join)
  expense_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE e.status IN ('submitted', 'under_review')) as expenses_pending,
      COALESCE(SUM(e.amount) FILTER (WHERE e.status IN ('submitted', 'under_review')), 0) as pending_amount,
      COUNT(*) FILTER (WHERE e.status = 'approved') as expenses_approved,
      COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'approved'), 0) as approved_amount
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
    COALESCE(es.expenses_pending, 0) as expenses_pending,
    COALESCE(es.pending_amount, 0) as pending_amount,
    COALESCE(es.expenses_approved, 0) as expenses_approved,
    COALESCE(es.approved_amount, 0) as approved_amount,

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

-- Add function comment
COMMENT ON FUNCTION get_task_analytics(TEXT, UUID) IS
  'Aggregates all 10 task analytics metrics for TaskBoard dashboard. Filters by company_id for security. Returns single row with 32 columns. Performance target: < 500ms for 1000 tasks.';
