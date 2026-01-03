-- ============================================
-- Fix projects table: Add missing status column
-- ============================================
-- This migration adds the status column to the projects table
-- which is required by the project creation logic.
--
-- Created: 2026-01-03
-- ============================================

-- First, create the enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'active',
    'on_hold',
    'completed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status public.project_status NOT NULL DEFAULT 'active';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

COMMENT ON COLUMN public.projects.status IS 'Project status (active, on_hold, completed, archived)';
