-- Migration: Auto-create phases and tasks from templates
-- Author: agent-backend-engineer
-- Date: 2026-01-06
-- Purpose: Replace hardcoded phase creation with template-based automation

-- ============================================
-- 1. Add project_type_config_id to projects table if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'project_type_config_id'
  ) THEN
    ALTER TABLE public.projects
    ADD COLUMN project_type_config_id uuid REFERENCES public.project_type_configs(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_projects_project_type_config_id
      ON public.projects(project_type_config_id);

    COMMENT ON COLUMN public.projects.project_type_config_id IS
      'Reference to project type configuration. Used to auto-create phases and tasks from templates.';
  END IF;
END $$;

-- ============================================
-- 2. Drop old hardcoded phase creation trigger
-- ============================================
DROP TRIGGER IF EXISTS create_phases_on_project_insert ON public.projects;
DROP FUNCTION IF EXISTS public.create_default_project_phases();

-- ============================================
-- 3. Create new template-based phase and task creation function
-- ============================================
CREATE OR REPLACE FUNCTION public.create_phases_and_tasks_from_templates()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_template RECORD;
  v_task_template RECORD;
  v_new_phase_id uuid;
  v_company_id uuid;
  v_project_start_date date;
BEGIN
  -- Get company_id and start_date from the new project
  v_company_id := NEW.company_id;
  v_project_start_date := NEW.start_date;

  -- Check if project has a project_type_config_id
  IF NEW.project_type_config_id IS NULL THEN
    -- Fallback: Create default 5 universal phases (backwards compatibility)
    INSERT INTO public.project_phases (project_id, name, display_order, status)
    VALUES
      (NEW.id, 'Initiation', 1, 'not_started'),
      (NEW.id, 'Pre-Construction', 2, 'not_started'),
      (NEW.id, 'Procurement', 3, 'not_started'),
      (NEW.id, 'Construction', 4, 'not_started'),
      (NEW.id, 'Post-Construction', 5, 'not_started');

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
    INSERT INTO public.project_phases (
      project_id,
      name,
      display_order,
      status,
      description
    )
    VALUES (
      NEW.id,
      v_phase_template.name,
      v_phase_template.order_index,
      'not_started',
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
      INSERT INTO public.tasks (
        project_id,
        phase_id,
        title,
        description,
        status,
        priority,
        display_order,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Create trigger for automatic phase/task creation
-- ============================================
CREATE TRIGGER create_phases_and_tasks_on_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_phases_and_tasks_from_templates();

-- ============================================
-- 5. Add comments
-- ============================================
COMMENT ON FUNCTION public.create_phases_and_tasks_from_templates() IS
  'Automatically creates phases and tasks from templates when a new project is inserted. Falls back to 5 universal phases if no project_type_config_id is set.';

COMMENT ON TRIGGER create_phases_and_tasks_on_project_insert ON public.projects IS
  'Trigger that creates phases and tasks from templates when a new project is created.';
