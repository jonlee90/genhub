-- ============================================================
-- FIX: Add missing role column to project_team table
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Add role column to project_team table (reuse user_role enum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_team'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.project_team
    ADD COLUMN role public.user_role NOT NULL DEFAULT 'field_worker';
    RAISE NOTICE '✅ Added role column to project_team table';
  ELSE
    RAISE NOTICE 'role column already exists in project_team table';
  END IF;
END $$;

-- Add column comment
COMMENT ON COLUMN public.project_team.role IS 'User role on this project';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_team'
  AND column_name = 'role';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅✅ project_team.role column added!';
  RAISE NOTICE '🚀 Projects page should now work!';
END $$;
