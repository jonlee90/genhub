-- Migration: Fix is_user_admin function to use correct role value
--
-- Problem: The is_user_admin function checks for role = 'gc_admin' but that enum
-- value was renamed to 'admin' in migration 20260110000001_rename_gc_admin_to_admin.sql
-- This causes all admin RLS policies to fail silently.

-- Recreate the function with the correct role value
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = p_user_id
      AND role = 'admin'
      AND status = 'active'
  );
$$;

COMMENT ON FUNCTION public.is_user_admin IS 'Check if user has admin role in their company';

-- Also update the deprecated alias function
CREATE OR REPLACE FUNCTION public.is_user_gc_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT public.is_user_admin(p_user_id);
$$;

COMMENT ON FUNCTION public.is_user_gc_admin IS 'Deprecated: Use is_user_admin instead. This alias exists for backward compatibility.';
