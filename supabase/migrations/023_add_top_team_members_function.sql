-- Migration: Add function to get top team members by completed tasks
-- Created: 2025-12-28
-- Purpose: Support Tasks Dashboard Stats feature

-- Function to get top team members by completed tasks count
CREATE OR REPLACE FUNCTION public.get_top_team_members_by_completed_tasks(
  p_company_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  completed_tasks bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.name,
    up.avatar_url,
    COUNT(t.id)::bigint as completed_tasks
  FROM public.user_profiles up
  INNER JOIN public.company_users cu ON cu.user_id = up.id
  INNER JOIN public.tasks t ON t.assignee_id = up.id
  INNER JOIN public.projects p ON p.id = t.project_id
  WHERE cu.company_id = p_company_id
    AND cu.status = 'active'
    AND t.status = 'completed'
    AND p.company_id = p_company_id
  GROUP BY up.id, up.name, up.avatar_url
  ORDER BY completed_tasks DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_top_team_members_by_completed_tasks(uuid, integer) TO authenticated;

-- Add comment describing the function
COMMENT ON FUNCTION public.get_top_team_members_by_completed_tasks IS 'Returns top team members who completed the most tasks for a given company. Used in Tasks Dashboard Stats.';
