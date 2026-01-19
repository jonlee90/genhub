-- Migration: Fix RPC function name mismatch for project detail
-- Issue: Code calls get_project_with_full_stats but only get_project_detail_with_stats exists
-- Solution: Create wrapper function to bridge the gap

-- Create wrapper function that matches code expectations
CREATE OR REPLACE FUNCTION public.get_project_with_full_stats(
  p_project_id UUID,
  p_company_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Call the actual implementation
  -- Note: p_company_id is passed for potential RLS verification, though not currently used
  RETURN get_project_detail_with_stats(p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_with_full_stats(UUID, UUID) 
TO authenticated;

-- Add documentation
COMMENT ON FUNCTION public.get_project_with_full_stats(UUID, UUID) IS
'Wrapper for get_project_detail_with_stats to match code expectations in projects.ts. Takes project_id and company_id parameters.';
