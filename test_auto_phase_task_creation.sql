-- Test Script: Verify Automatic Phase and Task Creation
-- Description: This script tests the automatic creation of phases and tasks from templates
-- Date: 2026-01-03
-- Usage: Run this against your Supabase database to verify the trigger is working

-- ============================================
-- STEP 1: Check if templates exist
-- ============================================
SELECT
  'Project Type Configs' as table_name,
  COUNT(*) as count
FROM public.project_type_configs
WHERE is_active = true

UNION ALL

SELECT
  'Phase Templates' as table_name,
  COUNT(*) as count
FROM public.phase_templates
WHERE is_active = true

UNION ALL

SELECT
  'Task Templates' as table_name,
  COUNT(*) as count
FROM public.task_templates
WHERE is_active = true;

-- ============================================
-- STEP 2: View available project types with their templates
-- ============================================
SELECT
  ptc.id as project_type_config_id,
  ptc.name as project_type_name,
  ptc.description,
  ptc.company_id,
  COUNT(DISTINCT pt.id) as phase_count,
  COUNT(tt.id) as task_count
FROM public.project_type_configs ptc
LEFT JOIN public.phase_templates pt ON pt.project_type_config_id = ptc.id AND pt.is_active = true
LEFT JOIN public.task_templates tt ON tt.phase_template_id = pt.id AND tt.is_active = true
WHERE ptc.is_active = true
GROUP BY ptc.id, ptc.name, ptc.description, ptc.company_id
ORDER BY ptc.name;

-- ============================================
-- STEP 3: View phase and task structure for each project type
-- ============================================
SELECT
  ptc.name as project_type,
  pt.name as phase_name,
  pt.order_index as phase_order,
  tt.title as task_title,
  tt.order_index as task_order,
  tt.default_priority,
  tt.days_offset
FROM public.project_type_configs ptc
JOIN public.phase_templates pt ON pt.project_type_config_id = ptc.id
LEFT JOIN public.task_templates tt ON tt.phase_template_id = pt.id
WHERE ptc.is_active = true
  AND pt.is_active = true
  AND (tt.is_active = true OR tt.is_active IS NULL)
ORDER BY
  ptc.name,
  pt.order_index,
  tt.order_index;

-- ============================================
-- STEP 4: Check if trigger exists
-- ============================================
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'create_phases_and_tasks_on_project_insert';

-- ============================================
-- STEP 5: Check if function exists
-- ============================================
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_phases_and_tasks_from_templates';

-- ============================================
-- INSTRUCTIONS FOR TESTING
-- ============================================
/*
To test automatic phase and task creation:

1. Get a valid project_type_config_id and company_id from the first query above
2. Run this INSERT statement (replace the UUIDs with actual values):

-- Example test insert (UPDATE VALUES FIRST!)
INSERT INTO public.projects (
  company_id,
  name,
  client_name,
  project_type,
  project_type_config_id,
  start_date,
  created_by
)
VALUES (
  'YOUR_COMPANY_ID_HERE'::uuid,          -- Get from step 2 above
  'TEST: Auto Phase/Task Creation',
  'Test Client',
  'residential',
  'YOUR_PROJECT_TYPE_CONFIG_ID_HERE'::uuid,  -- Get from step 2 above
  CURRENT_DATE,
  next_auth.uid()
)
RETURNING id;

3. After inserting, verify that phases and tasks were created:

-- Check phases created (replace PROJECT_ID)
SELECT
  id,
  name,
  order_index,
  status,
  notes
FROM public.project_phases
WHERE project_id = 'YOUR_PROJECT_ID_HERE'::uuid
ORDER BY order_index;

-- Check tasks created (replace PROJECT_ID)
SELECT
  t.id,
  ph.name as phase_name,
  t.title,
  t.status,
  t.priority,
  t.due_date
FROM public.tasks t
JOIN public.project_phases ph ON ph.id = t.phase_id
WHERE t.project_id = 'YOUR_PROJECT_ID_HERE'::uuid
ORDER BY ph.order_index, t.created_at;

-- Count phases and tasks created
SELECT
  'Phases Created' as item,
  COUNT(*) as count
FROM public.project_phases
WHERE project_id = 'YOUR_PROJECT_ID_HERE'::uuid

UNION ALL

SELECT
  'Tasks Created' as item,
  COUNT(*) as count
FROM public.tasks
WHERE project_id = 'YOUR_PROJECT_ID_HERE'::uuid;

*/
