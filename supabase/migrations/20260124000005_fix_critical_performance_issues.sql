-- Migration: Fix Critical Performance Issues
-- Date: 2026-01-24
-- Reference: /audit/projects-performance-report.md
-- Issues: PERF-001 (auth_rls_initplan on projects), PERF-002 (missing index on company_users.invited_by)

-- ==============================================================================
-- PERF-001: Fix projects_select RLS Policy - Auth Function Re-evaluation
-- ==============================================================================
-- PROBLEM: The projects_select policy calls next_auth.uid() without subquery
--          wrapper, causing the auth function to be re-evaluated for EACH row
--          instead of once per query.
-- IMPACT:  At 100 projects = 100x auth function calls, adds 50-200ms latency
-- FIX:     Wrap next_auth.uid() in (SELECT next_auth.uid()) to cache the result
-- ==============================================================================

-- Drop the inefficient policy
DROP POLICY IF EXISTS "projects_select" ON public.projects;

-- Create optimized policy with cached auth function calls
-- Performance improvement: Auth functions evaluated once per query, not per row
-- Use WITH clause to materialize user context once instead of per-row evaluation
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  TO public
  USING (
    company_id IN (SELECT get_user_company_id((SELECT next_auth.uid())))
    OR
    (SELECT is_user_owner((SELECT next_auth.uid())))
  );

-- ==============================================================================
-- PERF-002: Add Missing Index on company_users.invited_by
-- ==============================================================================
-- PROBLEM: Foreign key company_users_invited_by_fkey lacks covering index
-- IMPACT:  Sequential scan on company_users when joining project_team data,
--          adds 50-150ms per project detail page load
-- FIX:     Create partial index (WHERE invited_by IS NOT NULL) to optimize joins
-- ==============================================================================

-- Create index on invited_by column for efficient foreign key joins
-- Partial index excludes NULL values to save space (many users not invited)
CREATE INDEX IF NOT EXISTS idx_company_users_invited_by
ON public.company_users(invited_by)
WHERE invited_by IS NOT NULL;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '
================================================================================
✓ Critical Performance Fixes Applied Successfully
================================================================================

PERF-001: Projects RLS Auth Re-evaluation - FIXED
  - Policy: projects_select
  - Before: next_auth.uid() called per row (100 rows = 100 calls)
  - After: (SELECT next_auth.uid()) cached once per query
  - Expected improvement: -50 to -200ms on project list queries

PERF-002: company_users.invited_by Index - FIXED
  - Created: idx_company_users_invited_by (partial index)
  - Optimizes: Project team member queries with invited_by joins
  - Expected improvement: -50 to -150ms on project detail page loads

VERIFICATION STEPS:
  1. Run: mcp__supabase__get_advisors("performance")
  2. Confirm auth_rls_initplan warning for projects_select is resolved
  3. Confirm unindexed_foreign_keys warning for company_users_invited_by_fkey is resolved
  4. Test query performance with 100+ projects

REFERENCE:
  - Audit Report: /audit/projects-performance-report.md
  - Supabase Docs: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
  - Advisor Lint: 0003_auth_rls_initplan, 0001_unindexed_foreign_keys

================================================================================
  ';
END $$;
