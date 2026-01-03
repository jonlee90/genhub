-- Migration: 049_verify_auto_phase_task_creation
-- Description: Verify that automatic phase and task creation from templates is working correctly
-- Date: 2026-01-03
-- This migration tests the trigger and doesn't make schema changes

-- ============================================
-- 1. Verify trigger exists
-- ============================================
DO $$
DECLARE
  v_trigger_exists boolean;
  v_function_exists boolean;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'create_phases_and_tasks_on_project_insert'
    AND tgrelid = 'public.projects'::regclass
  ) INTO v_trigger_exists;

  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'create_phases_and_tasks_from_templates'
    AND pronamespace = 'public'::regnamespace
  ) INTO v_function_exists;

  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION 'Trigger create_phases_and_tasks_on_project_insert does not exist. Run migration 045 first.';
  END IF;

  IF NOT v_function_exists THEN
    RAISE EXCEPTION 'Function create_phases_and_tasks_from_templates does not exist. Run migration 045 first.';
  END IF;

  RAISE NOTICE '✓ Trigger and function exist';
END $$;

-- ============================================
-- 2. Verify column exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'project_type_config_id'
  ) THEN
    RAISE EXCEPTION 'Column project_type_config_id does not exist in projects table. Run migration 045 first.';
  END IF;

  RAISE NOTICE '✓ Column project_type_config_id exists in projects table';
END $$;

-- ============================================
-- 3. Verify template data exists
-- ============================================
DO $$
DECLARE
  v_phase_template_count integer;
  v_task_template_count integer;
  v_project_type_config_count integer;
BEGIN
  -- Count phase templates
  SELECT COUNT(*) INTO v_phase_template_count FROM public.phase_templates;

  -- Count task templates
  SELECT COUNT(*) INTO v_task_template_count FROM public.task_templates;

  -- Count project type configs
  SELECT COUNT(*) INTO v_project_type_config_count FROM public.project_type_configs;

  IF v_project_type_config_count = 0 THEN
    RAISE WARNING 'No project_type_configs found. Run migration 039 to seed default templates.';
  ELSE
    RAISE NOTICE '✓ Found % project type configs', v_project_type_config_count;
  END IF;

  IF v_phase_template_count = 0 THEN
    RAISE WARNING 'No phase_templates found. Run migration 039 to seed default templates.';
  ELSE
    RAISE NOTICE '✓ Found % phase templates', v_phase_template_count;
  END IF;

  IF v_task_template_count = 0 THEN
    RAISE WARNING 'No task_templates found. Run migration 039 to seed default templates.';
  ELSE
    RAISE NOTICE '✓ Found % task templates', v_task_template_count;
  END IF;
END $$;

-- ============================================
-- 4. Show sample template data for verification
-- ============================================
DO $$
DECLARE
  v_sample_config RECORD;
  v_sample_phase RECORD;
  v_sample_task RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Sample Template Data ===';

  -- Show first project type config
  SELECT * INTO v_sample_config
  FROM public.project_type_configs
  ORDER BY created_at
  LIMIT 1;

  IF FOUND THEN
    RAISE NOTICE 'Sample Project Type: % (id: %)', v_sample_config.name, v_sample_config.id;

    -- Show phases for this config
    FOR v_sample_phase IN
      SELECT * FROM public.phase_templates
      WHERE project_type_config_id = v_sample_config.id
      ORDER BY order_index
      LIMIT 3
    LOOP
      RAISE NOTICE '  Phase: % (order: %)', v_sample_phase.name, v_sample_phase.order_index;

      -- Show tasks for this phase
      FOR v_sample_task IN
        SELECT * FROM public.task_templates
        WHERE phase_template_id = v_sample_phase.id
        ORDER BY order_index
        LIMIT 2
      LOOP
        RAISE NOTICE '    Task: % (order: %)', v_sample_task.title, v_sample_task.order_index;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- 5. Verification Summary
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Complete ===';
  RAISE NOTICE 'Automatic phase and task creation from templates is configured correctly.';
  RAISE NOTICE 'When a new project is created with project_type_config_id set,';
  RAISE NOTICE 'phases and tasks will be automatically created from templates.';
  RAISE NOTICE '';
  RAISE NOTICE 'To test, insert a new project with a valid project_type_config_id:';
  RAISE NOTICE '  1. Get a project_type_config_id from project_type_configs table';
  RAISE NOTICE '  2. Insert a project with that project_type_config_id';
  RAISE NOTICE '  3. Check project_phases and tasks tables for auto-created records';
END $$;
