-- GenHub PWA: Team Member Statistics Function
-- Created: 2025-12-06
-- Epic 4, Task 2: Fix N+1 query problem in team management page
-- This function efficiently aggregates project counts for all team members in a single query

-- Drop function if exists (for idempotent migrations)
DROP FUNCTION IF EXISTS public.get_team_member_project_counts(uuid);

-- Create function to get project counts for all team members in a company
-- Uses LEFT JOIN to include members with 0 projects
-- Returns table with user_id and project_count
CREATE OR REPLACE FUNCTION public.get_team_member_project_counts(p_company_id uuid)
RETURNS TABLE (
  user_id uuid,
  project_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cu.user_id,
    COUNT(pt.id) as project_count
  FROM public.company_users cu
  LEFT JOIN public.project_team pt ON pt.user_id = cu.user_id
  WHERE cu.company_id = p_company_id
    AND cu.status = 'active'
  GROUP BY cu.user_id;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_team_member_project_counts(uuid) IS
'Returns project counts for all active team members in a company. Used to optimize team management page by eliminating N+1 queries.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_member_project_counts(uuid) TO authenticated;
