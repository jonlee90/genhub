-- Fix update_task_costs trigger: expenses.status was dropped in
-- 20260419194601_remove_expense_approval_workflow. All expenses now
-- contribute to task.actual_cost (approval workflow is gone).

CREATE OR REPLACE FUNCTION public.update_task_costs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.tasks t
  SET actual_cost = COALESCE(
    (SELECT SUM(total_cost)
     FROM public.material_assignments ma
     WHERE ma.task_id = t.id),
    0
  ) + COALESCE(
    (SELECT SUM(e.amount)
     FROM public.expenses e
     WHERE e.task_id = t.id),
    0
  )
  WHERE t.id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN NEW;
END;
$function$;
