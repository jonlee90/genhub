-- Migration: 048_fix_project_creation_use_trigger
-- Description: Ensure projects.project_type_config_id is properly set to enable automatic
--              phase and task creation via database trigger
-- Date: 2026-01-03

-- ============================================
-- 1. Verify project_type_config_id column exists
-- ============================================
-- This was added in migration 045, but we verify it here for safety
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
END $$;

-- ============================================
-- 2. Update existing projects to set project_type_config_id
-- ============================================
-- For existing projects without project_type_config_id set, try to match them to configs
-- This enables the trigger for future updates and ensures data consistency

UPDATE public.projects p
SET project_type_config_id = (
  SELECT ptc.id
  FROM public.project_type_configs ptc
  WHERE ptc.company_id = p.company_id
    AND ptc.is_active = true
    AND (
      -- Match residential
      (p.project_type = 'residential' AND ptc.name = 'Residential')
      OR
      -- Match restaurant/cafe (legacy enum value)
      (p.project_type = 'restaurant_cafe' AND ptc.name IN ('Restaurant/Cafe', 'Restaurant', 'Cafe'))
      OR
      -- Match restaurant
      (p.project_type = 'restaurant' AND ptc.name IN ('Restaurant/Cafe', 'Restaurant'))
      OR
      -- Match cafe
      (p.project_type = 'cafe' AND ptc.name IN ('Restaurant/Cafe', 'Cafe'))
      OR
      -- Match commercial_office
      (p.project_type = 'commercial_office' AND ptc.name = 'Commercial Office')
      OR
      -- Match industrial
      (p.project_type = 'industrial' AND ptc.name = 'Industrial')
    )
  LIMIT 1
)
WHERE p.project_type_config_id IS NULL;

-- ============================================
-- 3. Add helpful index if not exists
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_project_type_config_id
  ON public.projects(project_type_config_id)
  WHERE project_type_config_id IS NOT NULL;

-- ============================================
-- 4. Verify trigger exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'create_phases_and_tasks_on_project_insert'
    AND tgrelid = 'public.projects'::regclass
  ) THEN
    RAISE NOTICE 'WARNING: Trigger create_phases_and_tasks_on_project_insert does not exist. Run migration 045.';
  ELSE
    RAISE NOTICE 'Trigger create_phases_and_tasks_on_project_insert exists and is active.';
  END IF;
END $$;

-- ============================================
-- 5. Add comments
-- ============================================
COMMENT ON COLUMN public.projects.project_type_config_id IS
  'Links project to its type configuration. When set, the database trigger automatically creates phases and tasks from templates on project insert.';
