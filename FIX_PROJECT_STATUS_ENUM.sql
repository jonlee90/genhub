-- ============================================================
-- FIX: Add missing values to project_status enum
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Add 'planning' to project_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'planning'
    AND enumtypid = 'public.project_status'::regtype
  ) THEN
    ALTER TYPE public.project_status ADD VALUE 'planning';
    RAISE NOTICE '✅ Added "planning" to project_status enum';
  ELSE
    RAISE NOTICE '"planning" already exists in project_status enum';
  END IF;
END $$;

-- Add 'in_progress' to project_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'in_progress'
    AND enumtypid = 'public.project_status'::regtype
  ) THEN
    ALTER TYPE public.project_status ADD VALUE 'in_progress';
    RAISE NOTICE '✅ Added "in_progress" to project_status enum';
  ELSE
    RAISE NOTICE '"in_progress" already exists in project_status enum';
  END IF;
END $$;

-- Verify all enum values
SELECT enumlabel as project_status_values
FROM pg_enum
WHERE enumtypid = 'public.project_status'::regtype
ORDER BY enumsortorder;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅✅ project_status enum updated successfully!';
  RAISE NOTICE '📋 Valid values: active, on_hold, completed, archived, planning, in_progress';
END $$;
