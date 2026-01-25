-- Fix project_team RLS policy to allow INSERT operations
-- Issue: The policy had no WITH CHECK clause, causing INSERT failures

-- Drop the existing policy
DROP POLICY IF EXISTS project_access ON project_team;

-- Recreate the policy with both USING and WITH CHECK clauses
CREATE POLICY project_access ON project_team
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
