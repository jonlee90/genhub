-- Migration: Phase 1 Security Fixes - Production Blocking Issues
-- Date: 2026-01-22
-- Reference: /audit/REMEDIATION-PROGRESS.md
-- Issues: S-001, S-002, S-003, D-001

-- ==============================================================================
-- S-003: Function Search Path Protection (15 min)
-- ==============================================================================
-- ISSUE: 3 functions missing SET search_path = ''
-- FIX: Add search_path protection to prevent SQL injection
-- ==============================================================================

-- Fix the 3 functions identified by security advisor
ALTER FUNCTION public.get_project_team_cost_summary(p_project_id uuid)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_top_assignees(p_company_id uuid, p_limit integer)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_expenses_by_category(p_company_id uuid)
  SET search_path = public, pg_catalog;

-- ==============================================================================
-- S-001: Attachments RLS Company Isolation (30 min)
-- ==============================================================================
-- ISSUE: Attachments SELECT policy has qual: true allowing cross-company access
-- FIX: Replace with proper company isolation via entity relationship
-- ==============================================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view attachments" ON public.attachments;

-- Create secure company-isolated policy
-- Attachments are linked to entities (tasks, projects, etc) which have company_id
CREATE POLICY "Users can view company attachments" ON public.attachments
  FOR SELECT
  TO public
  USING (
    -- Allow if attachment belongs to a task in user's company
    entity_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
    OR
    -- Allow if attachment belongs to a project in user's company
    entity_id IN (
      SELECT p.id
      FROM projects p
      WHERE p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
    OR
    -- Allow if attachment belongs to an expense in user's company
    entity_id IN (
      SELECT e.id
      FROM expenses e
      WHERE e.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

-- ==============================================================================
-- S-002: Task Dependencies Company Isolation (30 min)
-- ==============================================================================
-- ISSUE: Current policy only checks task_id, not depends_on_task_id
-- FIX: Ensure both tasks in dependency are in user's company
-- ==============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "task_project_access" ON public.task_dependencies;

-- Create comprehensive policy that checks both tasks
CREATE POLICY "task_dependencies_company_access" ON public.task_dependencies
  FOR ALL
  TO authenticated
  USING (
    -- Both the task and the dependency must be in user's company
    task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
    AND
    depends_on_task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

-- ==============================================================================
-- D-001: RLS auth_rls_initplan Performance - Part 1 (High Impact Tables)
-- ==============================================================================
-- ISSUE: RLS policies re-evaluate next_auth.uid() per row causing 1-5s penalty
-- FIX: Wrap with (SELECT next_auth.uid()) to cache once per query
-- NOTE: Fixing all 42+ tables in batches. This batch covers highest-traffic tables.
-- ==============================================================================

-- ATTACHMENTS (already fixed above in S-001)

-- COMPANY_USERS (4 policies)
DROP POLICY IF EXISTS "GC Admin can delete company users" ON public.company_users;
CREATE POLICY "GC Admin can delete company users" ON public.company_users
  FOR DELETE
  TO public
  USING (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "GC Admin can insert company users" ON public.company_users;
CREATE POLICY "GC Admin can insert company users" ON public.company_users
  FOR INSERT
  TO public
  WITH CHECK (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "GC Admin can update company users" ON public.company_users;
CREATE POLICY "GC Admin can update company users" ON public.company_users
  FOR UPDATE
  TO public
  USING (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "Users can view company members" ON public.company_users;
CREATE POLICY "Users can view company members" ON public.company_users
  FOR SELECT
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- PROJECTS (4 policies)
DROP POLICY IF EXISTS "GC Admin can delete projects" ON public.projects;
CREATE POLICY "GC Admin can delete projects" ON public.projects
  FOR DELETE
  TO public
  USING (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "GC/PM can create projects" ON public.projects;
CREATE POLICY "GC/PM can create projects" ON public.projects
  FOR INSERT
  TO public
  WITH CHECK (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "GC/PM can update projects" ON public.projects;
CREATE POLICY "GC/PM can update projects" ON public.projects
  FOR UPDATE
  TO public
  USING (
    is_user_admin((SELECT next_auth.uid()))
    AND (company_id = get_user_company_id((SELECT next_auth.uid())))
  );

DROP POLICY IF EXISTS "Users can view company projects" ON public.projects;
CREATE POLICY "Users can view company projects" ON public.projects
  FOR SELECT
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- TASKS (3 policies)
DROP POLICY IF EXISTS "GC/PM can delete tasks" ON public.tasks;
CREATE POLICY "GC/PM can delete tasks" ON public.tasks
  FOR DELETE
  TO public
  USING (
    is_user_admin((SELECT next_auth.uid()))
    AND (project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id((SELECT next_auth.uid()))
    ))
  );

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT
  TO public
  WITH CHECK (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
CREATE POLICY "Users can update tasks" ON public.tasks
  FOR UPDATE
  TO public
  USING (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;
CREATE POLICY "Users can view tasks in their projects" ON public.tasks
  FOR SELECT
  TO public
  USING (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

-- TASK_ASSIGNEES (4 policies)
DROP POLICY IF EXISTS "task_assignees_delete" ON public.task_assignees;
CREATE POLICY "task_assignees_delete" ON public.task_assignees
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_assignees.task_id
        AND p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

DROP POLICY IF EXISTS "task_assignees_insert" ON public.task_assignees;
CREATE POLICY "task_assignees_insert" ON public.task_assignees
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_assignees.task_id
        AND p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

DROP POLICY IF EXISTS "task_assignees_select" ON public.task_assignees;
CREATE POLICY "task_assignees_select" ON public.task_assignees
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_assignees.task_id
        AND p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

DROP POLICY IF EXISTS "task_assignees_update" ON public.task_assignees;
CREATE POLICY "task_assignees_update" ON public.task_assignees
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_assignees.task_id
        AND p.company_id = get_user_company_id((SELECT next_auth.uid()))
    )
  );

-- USER_PROFILES (2 policies)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT
  TO public
  WITH CHECK (id = (SELECT next_auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE
  TO public
  USING (id = (SELECT next_auth.uid()));

-- MATERIALS (1 policy)
DROP POLICY IF EXISTS "company_access" ON public.materials;
CREATE POLICY "company_access" ON public.materials
  FOR ALL
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- EXPENSES (1 policy)
DROP POLICY IF EXISTS "company_access" ON public.expenses;
CREATE POLICY "company_access" ON public.expenses
  FOR ALL
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- SUBCONTRACTORS (1 policy)
DROP POLICY IF EXISTS "company_access" ON public.subcontractors;
CREATE POLICY "company_access" ON public.subcontractors
  FOR ALL
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- MATERIAL_PRICE_HISTORY (1 policy)
DROP POLICY IF EXISTS "material_price_history_select" ON public.material_price_history;
CREATE POLICY "material_price_history_select" ON public.material_price_history
  FOR SELECT
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- COMPANY_DEFAULT_MODELS (1 policy)
DROP POLICY IF EXISTS "company_access" ON public.company_default_models;
CREATE POLICY "company_access" ON public.company_default_models
  FOR ALL
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- TEAM_INVITATIONS (1 policy)
DROP POLICY IF EXISTS "company_access" ON public.team_invitations;
CREATE POLICY "company_access" ON public.team_invitations
  FOR ALL
  TO public
  USING (company_id = get_user_company_id((SELECT next_auth.uid())));

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '
================================================================================
✓ Phase 1 Security Fixes Applied Successfully
================================================================================

S-001: Attachments RLS Company Isolation - FIXED
  - Replaced qual: true with proper company isolation
  - Attachments now filtered by entity relationship to company

S-002: Task Dependencies Company Isolation - FIXED
  - Added company_id check for both tasks in dependency
  - Prevents cross-company dependency access

S-003: Function Search Path Protection - FIXED
  - get_project_team_cost_summary
  - get_top_assignees
  - get_expenses_by_category

D-001: RLS auth_rls_initplan Performance - PARTIALLY COMPLETE
  - Fixed 25+ policies on high-traffic tables
  - Wrapped next_auth.uid() with (SELECT next_auth.uid())
  - Expected performance improvement: 1-5 seconds per query

TABLES OPTIMIZED (D-001):
  - attachments, company_users, projects, tasks, task_assignees
  - user_profiles, materials, expenses, subcontractors
  - material_price_history, company_default_models, team_invitations

NEXT STEPS:
  1. Run security advisor: mcp__supabase__get_advisors("security")
  2. Verify no critical issues remain
  3. Test attachments company isolation
  4. Test task dependencies isolation
  5. Monitor query performance improvements

================================================================================
  ';
END $$;
