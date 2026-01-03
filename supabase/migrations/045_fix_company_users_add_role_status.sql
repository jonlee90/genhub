-- ============================================
-- Fix company_users table: Add missing role and status columns
-- ============================================
-- This migration adds the role and status columns to the company_users table
-- which are required by the get_user_company_id function and RLS policies.
--
-- Created: 2026-01-03
-- ============================================

-- First, create the enums if they don't exist
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'gc_admin',        -- Full access to all features
    'project_manager', -- Manage projects and tasks
    'foreman',         -- Field supervision access
    'field_worker',    -- Basic task access
    'subcontractor',   -- Limited to assigned work
    'client'           -- Read-only client access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM (
    'active',
    'invited',
    'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'field_worker';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add status column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS status public.member_status NOT NULL DEFAULT 'active';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Update existing records to have proper role and status
-- Set activated users to 'active' status and 'gc_admin' role
UPDATE public.company_users
SET
  role = 'gc_admin',
  status = 'active'
WHERE activated_at IS NOT NULL
  AND (role IS NULL OR role = 'field_worker');

-- Set non-activated users to 'invited' status
UPDATE public.company_users
SET status = 'invited'
WHERE activated_at IS NULL
  AND (status IS NULL OR status = 'active');

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_company_users_role ON public.company_users(role);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);

COMMENT ON COLUMN public.company_users.role IS 'User role within the company (gc_admin, project_manager, foreman, field_worker, subcontractor, client)';
COMMENT ON COLUMN public.company_users.status IS 'Membership status (active, invited, inactive)';
