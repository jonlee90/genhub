-- ============================================
-- CRITICAL FIX: Add missing columns to company_users and projects
-- ============================================
-- INSTRUCTIONS: Copy and paste this ENTIRE file into Supabase SQL Editor and run it.
-- This will add the missing role, status columns required for project creation.
-- ============================================

-- STEP 1: Create ENUMs if they don't exist
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


-- STEP 2: Add missing columns to company_users
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


-- STEP 3: Update existing company_users records
-- ============================================

-- Set activated users to 'active' status and 'gc_admin' role
DO $$
BEGIN
  UPDATE public.company_users
  SET
    role = 'gc_admin',
    status = 'active'
  WHERE activated_at IS NOT NULL;

  -- Set non-activated users to 'invited' status
  UPDATE public.company_users
  SET status = 'invited'
  WHERE activated_at IS NULL AND status = 'active';

  RAISE NOTICE 'Updated existing company_users records';
END $$;


-- STEP 4: Add missing status column to projects
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


-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_users_role ON public.company_users(role);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);


-- STEP 6: Add comments
-- ============================================

COMMENT ON COLUMN public.company_users.role IS 'User role within the company (gc_admin, project_manager, foreman, field_worker, subcontractor, client)';
COMMENT ON COLUMN public.company_users.status IS 'Membership status (active, invited, inactive)';
COMMENT ON COLUMN public.projects.status IS 'Project status (active, on_hold, completed, archived)';


-- VERIFICATION
-- ============================================

SELECT '=== VERIFICATION ===' as step;
SELECT 'company_users columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'company_users'
  AND column_name IN ('role', 'status');

SELECT 'projects columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name = 'status';

SELECT '=== FIX COMPLETE ===' as step;
