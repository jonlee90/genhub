-- Fix infinite recursion in company_users RLS policies
-- The issue: policies were querying company_users from within company_users policies

-- Drop the existing recursive policies
DROP POLICY IF EXISTS "Users can view company members" ON public.company_users;
DROP POLICY IF EXISTS "GC Admin can manage company users" ON public.company_users;

-- Create a helper function that bypasses RLS to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
$$;

-- Create new non-recursive policies using the helper function
CREATE POLICY "Users can view company members"
  ON public.company_users FOR SELECT
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
  );

CREATE POLICY "GC Admin can manage company users"
  ON public.company_users FOR ALL
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.company_users
      WHERE user_id = next_auth.uid()
        AND role = 'gc_admin'
        AND status = 'active'
        AND company_id = public.get_user_company_id(next_auth.uid())
    )
  );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
