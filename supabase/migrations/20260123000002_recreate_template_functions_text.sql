-- Migration: Recreate template functions with text type for task_type
--
-- This migration recreates the seed_company_templates and
-- create_phases_and_tasks_from_templates functions that were dropped
-- in the previous migration. They now use text instead of task_type enum.

-- =============================================================================
-- Recreate create_phases_and_tasks_from_templates (triggered on project creation)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_phases_and_tasks_from_templates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_phase_template RECORD;
  v_task_template RECORD;
  v_new_phase_id uuid;
  v_company_id uuid;
  v_project_start_date date;
  v_is_first_phase boolean := true;
  v_phase_status public.phase_status;
BEGIN
  -- Get company_id and start_date from the new project
  v_company_id := NEW.company_id;
  v_project_start_date := NEW.start_date;

  -- Check if project has a project_type_config_id
  IF NEW.project_type_config_id IS NULL THEN
    -- Fallback: Create default 5 universal phases (backwards compatibility)
    -- First phase gets 'in_progress', rest get 'not_started'
    INSERT INTO public.project_phases (project_id, name, order_index, status)
    VALUES
      (NEW.id, 'Initiation', 1, 'in_progress'::public.phase_status),
      (NEW.id, 'Pre-Construction', 2, 'not_started'::public.phase_status),
      (NEW.id, 'Procurement', 3, 'not_started'::public.phase_status),
      (NEW.id, 'Construction', 4, 'not_started'::public.phase_status),
      (NEW.id, 'Post-Construction', 5, 'not_started'::public.phase_status);

    RETURN NEW;
  END IF;

  -- Loop through phase templates for this project type
  FOR v_phase_template IN
    SELECT *
    FROM public.phase_templates
    WHERE project_type_config_id = NEW.project_type_config_id
      AND company_id = v_company_id
      AND is_active = true
    ORDER BY order_index ASC
  LOOP
    -- Determine status for this phase
    IF v_is_first_phase THEN
      v_phase_status := 'in_progress'::public.phase_status;
      v_is_first_phase := false;
    ELSE
      v_phase_status := 'not_started'::public.phase_status;
    END IF;

    -- Create phase from template
    INSERT INTO public.project_phases (
      project_id,
      name,
      order_index,
      status,
      notes
    )
    VALUES (
      NEW.id,
      v_phase_template.name,
      v_phase_template.order_index,
      v_phase_status,
      v_phase_template.description
    )
    RETURNING id INTO v_new_phase_id;

    -- Create tasks for this phase from task templates
    FOR v_task_template IN
      SELECT *
      FROM public.task_templates
      WHERE phase_template_id = v_phase_template.id
        AND company_id = v_company_id
        AND is_active = true
      ORDER BY order_index ASC
    LOOP
      -- Create task from template
      -- CHANGED: task_type is now text, not enum
      INSERT INTO public.tasks (
        project_id,
        phase_id,
        title,
        description,
        task_type,
        status,
        priority,
        due_date,
        created_by
      )
      VALUES (
        NEW.id,
        v_new_phase_id,
        v_task_template.title,
        v_task_template.description,
        COALESCE(v_task_template.default_task_type, 'work'), -- TEXT, not enum
        'todo'::public.task_status,
        COALESCE(v_task_template.default_priority, 'medium')::public.task_priority,
        -- Calculate due_date if days_offset is set and project has start_date
        CASE
          WHEN v_project_start_date IS NOT NULL AND v_task_template.days_offset IS NOT NULL
          THEN v_project_start_date + (v_task_template.days_offset || ' days')::interval
          ELSE NULL
        END,
        NEW.created_by
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Recreate trigger for create_phases_and_tasks_from_templates
DROP TRIGGER IF EXISTS create_phases_and_tasks_after_project_insert ON public.projects;
CREATE TRIGGER create_phases_and_tasks_after_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_phases_and_tasks_from_templates();

-- Note: The seed_company_templates function is very large and contains
-- no task_type enum casts, so it doesn't need modification. It's recreated
-- in the next migration if needed, or can be skipped if it was never dropped.
