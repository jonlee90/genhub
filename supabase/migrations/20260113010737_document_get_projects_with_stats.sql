-- Migration: Document existing get_projects_with_stats function
-- Purpose: This function already exists in production but was not tracked in migrations
--          Adding this migration to document the function for version control
-- Issue: PERF-008 - Add pagination to getProjectsWithStats
-- Status: Function already has pagination (p_limit DEFAULT 20, p_offset DEFAULT 0)

-- Note: This is a documentation-only migration. The function already exists.
-- If needed to recreate from scratch, use the definition below.

/*
CREATE OR REPLACE FUNCTION public.get_projects_with_stats(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
      COUNT(*) FILTER (WHERE e.status = 'approved') as expenses_approved,
      COUNT(*) FILTER (WHERE e.status = 'submitted') as expenses_pending,
      COUNT(*) FILTER (WHERE e.status = 'rejected') as expenses_rejected,
      COALESCE(SUM(e.amount), 0) as expenses_total_amount,
      COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'approved'), 0) as expenses_approved_amount,
      COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'submitted'), 0) as expenses_pending_amount
    FROM expenses e
    GROUP BY e.project_id
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
        'expenses_approved', COALESCE(es.expenses_approved, 0),
        'expenses_pending', COALESCE(es.expenses_pending, 0),
        'expenses_rejected', COALESCE(es.expenses_rejected, 0),
        'expenses_total_amount', COALESCE(es.expenses_total_amount, 0),
        'expenses_approved_amount', COALESCE(es.expenses_approved_amount, 0),
        'expenses_pending_amount', COALESCE(es.expenses_pending_amount, 0)
      )
    ) ORDER BY p.created_at DESC
  )
  FROM projects p
  LEFT JOIN task_stats ts ON ts.project_id = p.id
  LEFT JOIN material_stats ms ON ms.project_id = p.id
  LEFT JOIN team_stats tms ON tms.project_id = p.id
  LEFT JOIN expense_stats es ON es.project_id = p.id
  WHERE p.company_id = p_company_id
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_projects_with_stats(UUID, INTEGER, INTEGER) TO authenticated;
*/

-- Verification query
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_projects_with_stats';
