-- ============================================================
-- FIX: Add missing actual_cost column to projects table
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Add actual_cost column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'actual_cost'
  ) THEN
    ALTER TABLE public.projects
    ADD COLUMN actual_cost NUMERIC(12, 2) DEFAULT 0.00;
    RAISE NOTICE '✅ Added actual_cost column to projects table';
  ELSE
    RAISE NOTICE 'actual_cost column already exists in projects table';
  END IF;
END $$;

-- Add column comment
COMMENT ON COLUMN public.projects.actual_cost IS 'Actual cost spent on the project so far';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name = 'actual_cost';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Projects table actual_cost column added!';
END $$;
