-- Migration: Add health score calculation function
-- Calculates project health score based on 5 weighted components:
-- Schedule (30%), Budget (25%), Completion (20%), Resource (15%), Risk (10%)

-- Helper function to calculate project health score
CREATE OR REPLACE FUNCTION calculate_project_health_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_project RECORD;
  v_task_stats RECORD;
  v_schedule_health NUMERIC := 1.0;
  v_budget_health NUMERIC := 1.0;
  v_completion_health NUMERIC := 1.0;
  v_resource_health NUMERIC := 1.0;
  v_risk_health NUMERIC := 1.0;
  v_total_days INTEGER;
  v_elapsed_days INTEGER;
  v_expected_progress NUMERIC;
  v_actual_progress NUMERIC;
  v_expected_completed INTEGER;
BEGIN
  -- Get project details
  SELECT start_date, end_date, budget
  INTO v_project
  FROM projects
  WHERE id = p_project_id;

  -- Get task statistics
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
    COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
    COUNT(*) FILTER (WHERE assignee_id IS NULL AND status != 'completed') as unassigned,
    COALESCE(SUM(planned_cost), 0) as total_planned_cost,
    COALESCE(SUM(actual_cost), 0) as total_actual_cost
  INTO v_task_stats
  FROM tasks
  WHERE project_id = p_project_id;

  -- Edge case: No tasks = new project = 100 health
  IF v_task_stats.total = 0 THEN
    RETURN 100;
  END IF;

  -- 1. SCHEDULE HEALTH (30%)
  -- Based on days elapsed vs expected progress
  IF v_project.start_date IS NOT NULL AND v_project.end_date IS NOT NULL
     AND v_project.end_date > v_project.start_date THEN
    v_total_days := EXTRACT(DAY FROM (v_project.end_date::timestamp - v_project.start_date::timestamp))::INTEGER;
    v_elapsed_days := GREATEST(0, EXTRACT(DAY FROM (NOW() - v_project.start_date::timestamp))::INTEGER);

    IF v_total_days > 0 THEN
      v_expected_progress := LEAST(1.0, v_elapsed_days::NUMERIC / v_total_days);
      v_actual_progress := v_task_stats.completed::NUMERIC / v_task_stats.total;

      -- Schedule health: how close actual is to expected (1.0 = on track, < 1.0 = behind)
      IF v_expected_progress > 0 THEN
        v_schedule_health := LEAST(1.0, v_actual_progress / v_expected_progress);
      END IF;
    END IF;
  END IF;

  -- 2. BUDGET HEALTH (25%)
  -- Based on budget utilization percentage
  IF v_task_stats.total_planned_cost > 0 THEN
    DECLARE
      v_budget_utilization NUMERIC;
    BEGIN
      v_budget_utilization := (v_task_stats.total_actual_cost / v_task_stats.total_planned_cost) * 100;

      IF v_budget_utilization <= 100 THEN
        v_budget_health := 1.0;
      ELSIF v_budget_utilization <= 110 THEN
        v_budget_health := 0.8;
      ELSIF v_budget_utilization <= 125 THEN
        v_budget_health := 0.5;
      ELSE
        v_budget_health := 0.2;
      END IF;
    END;
  END IF;
  -- If no planned cost, budget health remains 1.0 (100%)

  -- 3. COMPLETION HEALTH (20%)
  -- completed_tasks / expected_completed, capped at 1.0
  IF v_project.start_date IS NOT NULL AND v_project.end_date IS NOT NULL
     AND v_project.end_date > v_project.start_date THEN
    v_total_days := EXTRACT(DAY FROM (v_project.end_date::timestamp - v_project.start_date::timestamp))::INTEGER;
    v_elapsed_days := GREATEST(0, EXTRACT(DAY FROM (NOW() - v_project.start_date::timestamp))::INTEGER);

    IF v_total_days > 0 THEN
      v_expected_progress := LEAST(1.0, v_elapsed_days::NUMERIC / v_total_days);
      v_expected_completed := GREATEST(1, CEIL(v_task_stats.total * v_expected_progress)::INTEGER);
      v_completion_health := LEAST(1.0, v_task_stats.completed::NUMERIC / v_expected_completed);
    END IF;
  ELSE
    -- No dates set: completion health based on overall completion rate
    v_completion_health := v_task_stats.completed::NUMERIC / v_task_stats.total;
  END IF;

  -- 4. RESOURCE HEALTH (15%)
  -- 1.0 - (blocked × 0.2 + unassigned × 0.1) / total_tasks
  v_resource_health := GREATEST(0, 1.0 - (
    (v_task_stats.blocked * 0.2 + v_task_stats.unassigned * 0.1) / v_task_stats.total
  ));

  -- 5. RISK HEALTH (10%)
  -- 1.0 - (overdue_tasks / total_tasks)
  v_risk_health := GREATEST(0, 1.0 - (v_task_stats.overdue::NUMERIC / v_task_stats.total));

  -- Calculate weighted score
  RETURN ROUND((
    v_schedule_health * 0.30 +
    v_budget_health * 0.25 +
    v_completion_health * 0.20 +
    v_resource_health * 0.15 +
    v_risk_health * 0.10
  ) * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_project_health_score(UUID) TO authenticated;

-- Add documentation
COMMENT ON FUNCTION calculate_project_health_score(UUID) IS
'Calculates project health score (0-100) based on 5 weighted components:
- Schedule Health (30%): Progress vs expected timeline
- Budget Health (25%): Actual vs planned costs
- Completion Health (20%): Completed tasks vs expected
- Resource Health (15%): Blocked and unassigned task impact
- Risk Health (10%): Overdue task impact
Returns 100 for projects with no tasks (new projects).';


-- Update get_project_detail_with_stats to include calculated health score
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

          -- Overall expense stats
          (SELECT json_build_object(
            'total', COUNT(*),
            'approved', COUNT(*) FILTER (WHERE status = 'approved'),
            'pending', COUNT(*) FILTER (WHERE status = 'submitted'),
            'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
            'totalAmount', COALESCE(SUM(amount), 0),
            'approvedAmount', COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0),
            'pendingAmount', COALESCE(SUM(amount) FILTER (WHERE status = 'submitted'), 0),
            'rejectedAmount', COALESCE(SUM(amount) FILTER (WHERE status = 'rejected'), 0)
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

-- Add comment for documentation
COMMENT ON FUNCTION get_project_detail_with_stats(UUID) IS
'Returns comprehensive project statistics including task stats, expense stats, material costs, phase stats, top assignees, and calculated health score. Replaces client-side aggregations for improved performance.';
