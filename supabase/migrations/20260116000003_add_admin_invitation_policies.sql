-- Migration: Add RLS policies for admin_invitations table
-- Priority: MEDIUM
-- Impact: Explicit security model for owner-managed invitations
-- Estimated execution time: <10 seconds
-- Date: 2026-01-16

-- Context: admin_invitations table has RLS enabled but no policies
-- Current behavior: No rows visible to users (fails closed - safe)
-- New behavior: Owners can manage invitations, admins can view their invitation

-- Policy 1: Owners can view and manage all invitations
CREATE POLICY "owners_can_manage_invitations" ON public.admin_invitations
  FOR ALL
  USING (public.is_user_owner(next_auth.uid()));

COMMENT ON POLICY "owners_can_manage_invitations" ON public.admin_invitations
  IS 'Platform owners can view and manage all admin invitations';

-- Policy 2: Users can view invitations sent to their email
-- This allows invited admins to see their invitation details before accepting
CREATE POLICY "users_can_view_own_invitations" ON public.admin_invitations
  FOR SELECT
  USING (
    email = (
      SELECT email FROM next_auth.users WHERE id = next_auth.uid()
    )
    AND used_at IS NULL
    AND expires_at > now()
  );

COMMENT ON POLICY "users_can_view_own_invitations" ON public.admin_invitations
  IS 'Users can view unexpired invitations sent to their email address';

-- Add documentation comment to table
COMMENT ON TABLE public.admin_invitations IS 'Platform owner invitations for new company admins. RLS policies: owners can manage, invited users can view their own.';

-- Verify policies were created
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'admin_invitations';

  IF policy_count >= 2 THEN
    RAISE NOTICE 'Admin invitation RLS policies created successfully';
    RAISE NOTICE 'Policy count: %', policy_count;
  ELSE
    RAISE WARNING 'Expected at least 2 policies, found %', policy_count;
  END IF;
END $$;
