-- Fix ALL RLS policies missing WITH CHECK clauses
-- Issue: Multiple tables had policies with USING but no WITH CHECK, causing INSERT failures
-- This fixes all cmd='ALL' policies to include proper WITH CHECK clauses

-- ============================================
-- 1. admin_invitations
-- ============================================
DROP POLICY IF EXISTS user_access ON admin_invitations;
CREATE POLICY user_access ON admin_invitations
  FOR ALL
  TO authenticated
  USING (
    invited_by = next_auth.uid()
    OR next_auth.uid() IN (
      SELECT cu.user_id
      FROM company_users cu
      WHERE cu.role = 'admin'::user_role
        AND cu.status = 'active'::member_status
    )
  )
  WITH CHECK (
    invited_by = next_auth.uid()
    OR next_auth.uid() IN (
      SELECT cu.user_id
      FROM company_users cu
      WHERE cu.role = 'admin'::user_role
        AND cu.status = 'active'::member_status
    )
  );

-- ============================================
-- 2. company_default_models
-- ============================================
DROP POLICY IF EXISTS company_access ON company_default_models;
CREATE POLICY company_access ON company_default_models
  FOR ALL
  TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));

-- ============================================
-- 3. expense_line_items
-- ============================================
DROP POLICY IF EXISTS expense_access ON expense_line_items;
CREATE POLICY expense_access ON expense_line_items
  FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id
      FROM expenses e
      WHERE e.company_id = get_user_company_id(next_auth.uid())
    )
  )
  WITH CHECK (
    expense_id IN (
      SELECT e.id
      FROM expenses e
      WHERE e.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- 4. expenses
-- ============================================
DROP POLICY IF EXISTS company_access ON expenses;
CREATE POLICY company_access ON expenses
  FOR ALL
  TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));

-- ============================================
-- 5. material_assignments
-- ============================================
DROP POLICY IF EXISTS project_access ON material_assignments;
CREATE POLICY project_access ON material_assignments
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id
      FROM projects p
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id
      FROM projects p
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- 6. materials
-- ============================================
DROP POLICY IF EXISTS company_access ON materials;
CREATE POLICY company_access ON materials
  FOR ALL
  TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));

-- ============================================
-- 7. project_phases
-- ============================================
DROP POLICY IF EXISTS "GC/PM can manage phases" ON project_phases;
CREATE POLICY "GC/PM can manage phases" ON project_phases
  FOR ALL
  TO authenticated
  USING (
    is_user_admin(next_auth.uid())
    AND project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id(next_auth.uid())
    )
  )
  WITH CHECK (
    is_user_admin(next_auth.uid())
    AND project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- 8. subcontractors
-- ============================================
DROP POLICY IF EXISTS company_access ON subcontractors;
CREATE POLICY company_access ON subcontractors
  FOR ALL
  TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));

-- ============================================
-- 9. task_activity
-- ============================================
DROP POLICY IF EXISTS task_project_access ON task_activity;
CREATE POLICY task_project_access ON task_activity
  FOR ALL
  TO authenticated
  USING (
    task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- 10. task_dependencies
-- ============================================
DROP POLICY IF EXISTS task_dependencies_company_access ON task_dependencies;
CREATE POLICY task_dependencies_company_access ON task_dependencies
  FOR ALL
  TO authenticated
  USING (
    task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT t.id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- 11. team_invitations
-- ============================================
DROP POLICY IF EXISTS company_access ON team_invitations;
CREATE POLICY company_access ON team_invitations
  FOR ALL
  TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));
