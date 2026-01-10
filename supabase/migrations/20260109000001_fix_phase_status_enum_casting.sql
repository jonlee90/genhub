-- Fix the create_phases_and_tasks_from_templates function to properly cast
-- phase_status values to the phase_status enum type
--
-- Issue: The function was inserting text values ('in_progress', 'not_started')
-- into the status column which is of type phase_status enum, causing a type mismatch error.
--
-- Fix: Add explicit ::public.phase_status casts to all status value insertions.

CREATE OR REPLACE FUNCTION public.create_phases_and_tasks_from_templates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_phase_template RECORD;
  v_task_template RECORD;
  v_new_phase_id uuid;
  v_company_id uuid;
  v_project_start_date date;
  v_is_first_phase boolean := true;
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
    -- Create phase from template
    -- First phase gets 'in_progress', rest get 'not_started'
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
      (CASE WHEN v_is_first_phase THEN 'in_progress' ELSE 'not_started' END)::public.phase_status,
      v_phase_template.description
    )
    RETURNING id INTO v_new_phase_id;

    -- Mark that we've processed the first phase
    v_is_first_phase := false;

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
      INSERT INTO public.tasks (
        project_id,
        phase_id,
        title,
        description,
        status,
        priority,
        order_index,
        due_date,
        created_by
      )
      VALUES (
        NEW.id,
        v_new_phase_id,
        v_task_template.title,
        v_task_template.description,
        COALESCE(v_task_template.default_task_type, 'todo')::public.task_status,
        COALESCE(v_task_template.default_priority, 'medium')::public.task_priority,
        v_task_template.order_index,
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
