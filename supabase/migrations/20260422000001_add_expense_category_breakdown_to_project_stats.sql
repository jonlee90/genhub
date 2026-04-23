-- Add category breakdown to get_project_detail_with_stats RPC
-- The project detail Overview card now surfaces top expense categories
-- instead of the removed approval workflow metrics.

CREATE OR REPLACE FUNCTION public.get_project_detail_with_stats(p_project_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          -- Includes categoryBreakdown: top 5 categories by total amount
          (SELECT json_build_object(
            'total', COUNT(*),
            'totalAmount', COALESCE(SUM(amount), 0),
            'categoryBreakdown', COALESCE((
              SELECT json_agg(cat_row)
              FROM (
                SELECT
                  category::text AS category,
                  COUNT(*) AS count,
                  COALESCE(SUM(amount), 0) AS "totalAmount"
                FROM expenses
                WHERE project_id = p_project_id
                GROUP BY category
                ORDER BY SUM(amount) DESC NULLS LAST
                LIMIT 5
              ) cat_row
            ), '[]'::json)
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
$function$;
