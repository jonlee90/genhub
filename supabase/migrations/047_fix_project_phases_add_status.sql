-- Fix project_phases table: Add missing status column
-- This migration ensures the status column exists with proper enum type
-- Created: 2026-01-03

-- First, ensure the phase_status enum exists
DO $$ BEGIN
  CREATE TYPE public.phase_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column if it doesn't exist
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

    -- Add index for status queries
    CREATE INDEX idx_project_phases_status ON public.project_phases(status);

    -- Add comment
    COMMENT ON COLUMN public.project_phases.status IS 'Current phase status: not_started, in_progress, or completed';
  END IF;
END $$;

-- Ensure other important columns exist
DO $$
BEGIN
  -- Add completion_percentage if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN completion_percentage integer DEFAULT 0
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
  END IF;

  -- Add started_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN started_at timestamp with time zone;
  END IF;

  -- Add completed_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_phases'
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.project_phases
    ADD COLUMN completed_at timestamp with time zone;
  END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_phases'
ORDER BY ordinal_position;
