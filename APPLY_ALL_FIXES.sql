-- ============================================================
-- COMPLETE FIX: All missing columns for GenHub
-- ============================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- This fixes ALL missing columns in one go:
-- - company_users (role, status)
-- - projects (status)
-- - project_phases (status, completion_percentage, started_at, completed_at)
-- ============================================================

-- ============================================
-- PART 1: Create ENUMs
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'gc_admin',
    'project_manager',
    'foreman',
    'field_worker',
    'subcontractor',
    'client'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'user_role enum already exists, skipping';
END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM (
    'active',
    'invited',
    'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'member_status enum already exists, skipping';
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'active',
    'on_hold',
    'completed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'project_status enum already exists, skipping';
END $$;

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

-- ============================================
-- PART 2: Fix company_users table
-- ============================================

-- Add role column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.company_users
    ADD COLUMN role public.user_role NOT NULL DEFAULT 'field_worker';
    RAISE NOTICE 'Added role column to company_users';
  ELSE
    RAISE NOTICE 'role column already exists in company_users';
  END IF;
END $$;

-- Add status column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_users'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.company_users
    ADD COLUMN status public.member_status NOT NULL DEFAULT 'active';
    RAISE NOTICE 'Added status column to company_users';
  ELSE
    RAISE NOTICE 'status column already exists in company_users';
  END IF;
END $$;

-- Update existing records
DO $$
BEGIN
  UPDATE public.company_users
  SET
    role = 'gc_admin',
    status = 'active'
  WHERE activated_at IS NOT NULL;

  UPDATE public.company_users
  SET status = 'invited'
  WHERE activated_at IS NULL AND status = 'active';

  RAISE NOTICE 'Updated existing company_users records';
END $$;

-- ============================================
-- PART 3: Fix projects table
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects
    ADD COLUMN status public.project_status NOT NULL DEFAULT 'active';
    RAISE NOTICE 'Added status column to projects';
  ELSE
    RAISE NOTICE 'status column already exists in projects';
  END IF;
END $$;

-- ============================================
-- PART 4: Fix project_phases table
-- ============================================

-- Add status column
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
    RAISE NOTICE 'status column already exists in project_phases';
  END IF;
END $$;

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
    RAISE NOTICE 'Added completion_percentage column to project_phases';
  ELSE
    RAISE NOTICE 'completion_percentage column already exists in project_phases';
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
    RAISE NOTICE 'Added started_at column to project_phases';
  ELSE
    RAISE NOTICE 'started_at column already exists in project_phases';
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
    RAISE NOTICE 'Added completed_at column to project_phases';
  ELSE
    RAISE NOTICE 'completed_at column already exists in project_phases';
  END IF;
END $$;

-- ============================================
-- PART 5: Add indexes for performance
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'company_users'
    AND indexname = 'idx_company_users_status'
  ) THEN
    CREATE INDEX idx_company_users_status ON public.company_users(status);
    RAISE NOTICE 'Created index on company_users.status';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'projects'
    AND indexname = 'idx_projects_status'
  ) THEN
    CREATE INDEX idx_projects_status ON public.projects(status);
    RAISE NOTICE 'Created index on projects.status';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'project_phases'
    AND indexname = 'idx_project_phases_status'
  ) THEN
    CREATE INDEX idx_project_phases_status ON public.project_phases(status);
    RAISE NOTICE 'Created index on project_phases.status';
  END IF;
END $$;

-- ============================================
-- PART 6: Add column comments
-- ============================================

COMMENT ON COLUMN public.company_users.role IS 'User role in the company';
COMMENT ON COLUMN public.company_users.status IS 'User status: active, invited, or inactive';
COMMENT ON COLUMN public.projects.status IS 'Project status: active, on_hold, completed, or archived';
COMMENT ON COLUMN public.project_phases.status IS 'Phase status: not_started, in_progress, or completed';
COMMENT ON COLUMN public.project_phases.completion_percentage IS 'Phase completion percentage (0-100)';
COMMENT ON COLUMN public.project_phases.started_at IS 'Timestamp when phase was started';
COMMENT ON COLUMN public.project_phases.completed_at IS 'Timestamp when phase was completed';

-- ============================================
-- SUCCESS! All fixes applied
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '✅ company_users: role, status columns added';
  RAISE NOTICE '✅ projects: status column added';
  RAISE NOTICE '✅ project_phases: status, completion_percentage, started_at, completed_at columns added';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ Ready to create projects!';
END $$;
