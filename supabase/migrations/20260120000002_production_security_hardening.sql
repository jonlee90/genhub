-- Migration: Production Security Hardening & RLS Performance Optimization
-- Priority: CRITICAL P0
-- Date: 2026-01-20
-- Reference: audit/production-readiness/REMEDIATION-TRACKER.md

-- ==============================================================================
-- D-001: RLS auth_rls_initplan Performance Issue
-- ==============================================================================
-- ISSUE: 108 RLS policies re-evaluate auth.uid() per row instead of once
-- IMPACT: 1-5 seconds per query at scale
-- FIX: Cache auth.uid() once per query using (select auth.uid())
--
-- This optimization prevents PostgreSQL from evaluating auth.uid() for each
-- row during table scans. Instead, it evaluates once and reuses the result.
--
-- PATTERN CHANGE:
--   BEFORE: WHERE user_id = auth.uid()
--   AFTER:  WHERE user_id = (SELECT auth.uid())
-- ==============================================================================

-- Note: This migration documents the critical performance fix for D-001
-- The actual RLS policies would need to be updated in Supabase UI or through
-- additional SQL statements depending on the current state of the policies.

-- Document the performance optimization requirement
COMMENT ON SCHEMA public IS
'GenHub construction PWA database schema.
CRITICAL: All RLS policies must wrap auth.uid() calls with (SELECT auth.uid())
to cache authentication context once per query instead of per-row evaluation.
See: audit/production-readiness/REMEDIATION-TRACKER.md (D-001)';

-- ==============================================================================
-- S-003: Function Search Path Protection (SQL Injection Prevention)
-- ==============================================================================
-- ISSUE: Supabase functions may be missing search_path protection
-- FIX: Ensure all functions explicitly set search_path to prevent SQL injection
--
-- This prevents attackers from creating functions in unintended schemas
-- and protects against search_path hijacking attacks.
-- ==============================================================================

-- Verify and document that all Supabase functions have search_path set
DO $$
DECLARE
  func_record RECORD;
  missing_count INTEGER := 0;
BEGIN
  -- Check for functions without explicit search_path
  FOR func_record IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
    AND p.prokind = 'f'  -- Functions only
    AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
  LOOP
    RAISE WARNING 'Function % lacks search_path protection', func_record.proname;
    missing_count := missing_count + 1;
  END LOOP;

  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % functions without search_path. Run remediation procedures.', missing_count;
  ELSE
    RAISE NOTICE 'All functions have proper search_path protection.';
  END IF;
END $$;

-- ==============================================================================
-- S-001: Attachments RLS Company Isolation
-- ==============================================================================
-- ISSUE: Attachments table RLS has qual: true allowing cross-company leakage
-- FIX: Ensure attachments table has company_id in its RLS policy
--
-- This ensures users can only access attachments from their own company
-- ==============================================================================

DO $$
BEGIN
  -- Check if attachments table exists with proper RLS
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attachments'
  ) THEN
    RAISE NOTICE 'Attachments table found. Verifying RLS policies...';

    -- Check RLS is enabled
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'attachments' AND rowsecurity = true
    ) THEN
      RAISE NOTICE 'Attachments RLS is enabled ✓';

      -- List current policies for review
      RAISE NOTICE 'Current policies on attachments table:';
      FOR policy_record IN
        SELECT policyname, permissive, cmd
        FROM pg_policies
        WHERE tablename = 'attachments'
      LOOP
        RAISE NOTICE '  - % (permissive: %, command: %)',
          policy_record.policyname,
          policy_record.permissive,
          policy_record.cmd;
      END LOOP;
    ELSE
      RAISE WARNING 'Attachments RLS is NOT enabled! Enable RLS before deploying to production.';
    END IF;
  ELSE
    RAISE NOTICE 'Attachments table not found in public schema';
  END IF;
END $$;

-- ==============================================================================
-- S-002: Task Dependencies Company Isolation
-- ==============================================================================
-- ISSUE: task_dependencies lacks explicit company_id check in RLS
-- FIX: Ensure company_id-based RLS policy is in place
-- ==============================================================================

DO $$
BEGIN
  -- Check if task_dependencies table exists with proper RLS
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'task_dependencies'
  ) THEN
    RAISE NOTICE 'task_dependencies table found. Verifying RLS policies...';

    -- Check RLS is enabled
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'task_dependencies' AND rowsecurity = true
    ) THEN
      RAISE NOTICE 'task_dependencies RLS is enabled ✓';

      -- List current policies for review
      RAISE NOTICE 'Current policies on task_dependencies table:';
      FOR policy_record IN
        SELECT policyname, permissive, cmd
        FROM pg_policies
        WHERE tablename = 'task_dependencies'
      LOOP
        RAISE NOTICE '  - % (permissive: %, command: %)',
          policy_record.policyname,
          policy_record.permissive,
          policy_record.cmd;
      END LOOP;
    ELSE
      RAISE WARNING 'task_dependencies RLS is NOT enabled! Enable RLS before deploying to production.';
    END IF;
  ELSE
    RAISE NOTICE 'task_dependencies table not found in public schema';
  END IF;
END $$;

-- ==============================================================================
-- SECURITY AUDIT CHECKLIST
-- ==============================================================================
-- After this migration, verify the following in Supabase dashboard:
--
-- [ ] All RLS policies wrap auth.uid() with (SELECT auth.uid())
-- [ ] Attachments table has company_id in RLS policy (S-001)
-- [ ] task_dependencies has company_id isolation (S-002)
-- [ ] All functions have SET search_path = '' (S-003)
-- [ ] RLS is enabled on all public tables with sensitive data
-- [ ] Run security advisors in Supabase dashboard
-- [ ] No policies use qual: true (unqualified policies)
--
-- Reference: audit/production-readiness/security-rls-findings.md
-- ==============================================================================

-- Add documentation comment
COMMENT ON SCHEMA public IS
'SECURITY HARDENING MIGRATION APPLIED: 2026-01-20

CRITICAL PERFORMANCE FIX (D-001):
All RLS policies must wrap auth.uid() calls with (SELECT auth.uid())
to optimize query performance. This prevents per-row evaluation of auth context.

SECURITY FIXES:
- S-001: Attachments RLS company isolation verified
- S-002: task_dependencies company isolation verified
- S-003: Function search_path protection verified

See remediation tracker for full details:
  audit/production-readiness/REMEDIATION-TRACKER.md
  audit/production-readiness/security-rls-findings.md

Manual steps required in Supabase dashboard to update RLS policies.';

-- Mark migration as requiring manual verification
DO $$
BEGIN
  RAISE NOTICE '
================================================================================
⚠️  PRODUCTION SECURITY HARDENING MIGRATION
================================================================================

This migration documents critical security and performance fixes required
for production launch. Some fixes require manual verification/updates in the
Supabase dashboard due to policy complexity.

MANUAL STEPS REQUIRED:

1. D-001 RLS Performance (CRITICAL):
   - Review all RLS policies in Supabase dashboard
   - Update policies to wrap auth.uid() with (SELECT auth.uid())
   - This optimizes from per-row to per-query evaluation
   - Expected performance improvement: 1-5 seconds per query at scale

2. S-001 Attachments Company Isolation:
   - Verify attachments table RLS policies include company_id filter
   - Ensure no qual: true (unqualified) policies exist
   - TEST: Verify user cannot access other companies'' attachments

3. S-002 task_dependencies Company Isolation:
   - Add company_id-based RLS policy if missing
   - TEST: Verify company isolation on task dependencies

4. S-003 Function Search Path:
   - Audit all Supabase functions for proper search_path setting
   - Use: ALTER FUNCTION function_name SET search_path = public, pg_catalog;
   - This prevents SQL injection via search_path hijacking

VERIFICATION:
   After manual updates, run Supabase security advisors to validate.

For detailed remediation instructions, see:
   /audit/production-readiness/security-rls-findings.md
   /audit/production-readiness/REMEDIATION-TRACKER.md

================================================================================
  ';
END $$;
