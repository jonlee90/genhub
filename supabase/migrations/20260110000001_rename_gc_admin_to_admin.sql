-- Migration: Rename gc_admin to admin
-- This migration renames the gc_admin enum value to admin and updates the helper function

-- Step 1: Rename the enum value (preserves existing data)
ALTER TYPE public.user_role RENAME VALUE 'gc_admin' TO 'admin';

-- Step 2: Rename the helper function for consistency
ALTER FUNCTION public.is_user_gc_admin(uuid) RENAME TO is_user_admin;

-- Step 3: Create an alias function for backward compatibility during transition
-- This allows existing code to continue working until fully migrated
CREATE OR REPLACE FUNCTION public.is_user_gc_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_user_admin(p_user_id);
$$;

COMMENT ON FUNCTION public.is_user_gc_admin IS 'Deprecated: Use is_user_admin instead. This alias exists for backward compatibility.';
COMMENT ON FUNCTION public.is_user_admin IS 'Check if user has admin role in their company';
