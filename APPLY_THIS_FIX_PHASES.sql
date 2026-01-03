-- ============================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================
-- Fix: Add missing status column to project_phases table
-- Date: 2026-01-03
-- Issue: "column status of relation project_phases does not exist"
-- ============================================================

-- Step 1: Create phase_status enum (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE public.phase_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'phase_status enum already exists, skipping';
END $$;

-- Step 2: Add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN status public.phase_status NOT NULL DEFAULT 'not_started';

    RAISE NOTICE 'Added status column to project_phases';
  ELSE
    RAISE NOTICE 'status column already exists, skipping';
  END IF;
END $$;

-- Step 3: Add index for status (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'project_phases'
    AND indexname = 'idx_project_phases_status'
  ) THEN
    CREATE INDEX idx_project_phases_status ON public.project_phases(status);
    RAISE NOTICE 'Created index on status column';
  ELSE
    RAISE NOTICE 'Index on status already exists, skipping';
  END IF;
END $$;

-- Step 4: Add other important columns if missing

-- Add completion_percentage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN completion_percentage integer DEFAULT 0
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    RAISE NOTICE 'Added completion_percentage column';
  ELSE
    RAISE NOTICE 'completion_percentage column already exists, skipping';
  END IF;
END $$;

-- Add started_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN started_at timestamp with time zone;
    RAISE NOTICE 'Added started_at column';
  ELSE
    RAISE NOTICE 'started_at column already exists, skipping';
  END IF;
END $$;

-- Add completed_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN completed_at timestamp with time zone;
    RAISE NOTICE 'Added completed_at column';
  ELSE
    RAISE NOTICE 'completed_at column already exists, skipping';
  END IF;
END $$;

-- Step 5: Add column comments
COMMENT ON COLUMN public.project_phases.status IS 'Current phase status: not_started, in_progress, or completed';
COMMENT ON COLUMN public.project_phases.completion_percentage IS 'Phase completion percentage (0-100)';
COMMENT ON COLUMN public.project_phases.started_at IS 'Timestamp when phase was started';
COMMENT ON COLUMN public.project_phases.completed_at IS 'Timestamp when phase was completed';

-- Step 6: Verify the fix - show all columns
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_phases'
ORDER BY ordinal_position;

-- ============================================================
-- VERIFICATION COMPLETE
-- You should see the status column in the results above
-- ============================================================
