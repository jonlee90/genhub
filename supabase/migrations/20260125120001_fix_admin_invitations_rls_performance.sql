-- Migration: Fix admin_invitations RLS performance issue
-- Date: 2026-01-25
-- Reference: User Invite System Audit - Finding H-001
-- Issue: N+1 RLS performance - next_auth.uid() re-evaluated per row
-- Fix: Wrap next_auth.uid() calls with (SELECT next_auth.uid()) to cache once per query

-- ==============================================================================
-- H-001: Admin Invitations RLS Policy Optimization
-- ==============================================================================
-- ISSUE: RLS policy re-evaluates next_auth.uid() per row causing 10-50ms penalty
-- FIX: Wrap with (SELECT next_auth.uid()) to cache once per query
-- ==============================================================================

DROP POLICY IF EXISTS "user_access" ON public.admin_invitations;

CREATE POLICY "user_access" ON public.admin_invitations
  FOR ALL
  TO authenticated
  USING (
    (invited_by = (SELECT next_auth.uid()))
    OR
    ((SELECT next_auth.uid()) IN (
      SELECT cu.user_id
      FROM company_users cu
      WHERE cu.role = 'admin'::user_role
      AND cu.status = 'active'::member_status
    ))
  )
  WITH CHECK (
    (invited_by = (SELECT next_auth.uid()))
    OR
    ((SELECT next_auth.uid()) IN (
      SELECT cu.user_id
      FROM company_users cu
      WHERE cu.role = 'admin'::user_role
      AND cu.status = 'active'::member_status
    ))
  );

COMMENT ON POLICY "user_access" ON public.admin_invitations
  IS 'Platform owners and admins can manage invitations. Optimized with cached next_auth.uid().';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '
================================================================================
✓ Admin Invitations RLS Performance Fix Applied
================================================================================

ISSUE FIXED:
  - next_auth.uid() now cached per query (not re-evaluated per row)
  - Expected performance improvement: 10-50ms per query

AFFECTED QUERIES:
  - getPendingAdminInvitations() in app/actions/owner.ts
  - inviteAdmin() duplicate check in app/actions/owner.ts

VERIFICATION:
  Run EXPLAIN ANALYZE on admin_invitations queries to verify single uid() call

================================================================================
  ';
END $$;
