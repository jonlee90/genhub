-- ============================================
-- RLS Policies for Materials and Expenses
-- Migration 021
-- ============================================

-- ============================================
-- Materials Table RLS
-- ============================================

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Users can view materials from their company
CREATE POLICY "materials_select_policy"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
    )
  );

-- GC Admin, PM can create materials
CREATE POLICY "materials_insert_policy"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
      AND role IN ('gc_admin', 'project_manager')
    )
  );

-- GC Admin, PM can update materials
CREATE POLICY "materials_update_policy"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
      AND role IN ('gc_admin', 'project_manager')
    )
  );

-- GC Admin can delete materials
CREATE POLICY "materials_delete_policy"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
      AND role = 'gc_admin'
    )
  );

-- ============================================
-- Material Assignments Table RLS
-- ============================================

ALTER TABLE public.material_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view material assignments for projects they're on
CREATE POLICY "material_assignments_select_policy"
  ON public.material_assignments
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id
      FROM public.projects p
      INNER JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- Team members can create material assignments for their projects
CREATE POLICY "material_assignments_insert_policy"
  ON public.material_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT pt.project_id
      FROM public.project_team pt
      WHERE pt.user_id = next_auth.uid()
    )
    OR
    project_id IN (
      SELECT p.id
      FROM public.projects p
      INNER JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE cu.user_id = next_auth.uid()
      AND cu.status = 'active'
      AND cu.role IN ('gc_admin', 'project_manager')
    )
  );

-- Project team members can update material assignments
CREATE POLICY "material_assignments_update_policy"
  ON public.material_assignments
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT pt.project_id
      FROM public.project_team pt
      WHERE pt.user_id = next_auth.uid()
    )
    OR
    project_id IN (
      SELECT p.id
      FROM public.projects p
      INNER JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE cu.user_id = next_auth.uid()
      AND cu.status = 'active'
      AND cu.role IN ('gc_admin', 'project_manager')
    )
  );

-- GC Admin, PM can delete material assignments
CREATE POLICY "material_assignments_delete_policy"
  ON public.material_assignments
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id
      FROM public.projects p
      INNER JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE cu.user_id = next_auth.uid()
      AND cu.status = 'active'
      AND cu.role IN ('gc_admin', 'project_manager')
    )
  );

-- ============================================
-- Expenses Table RLS
-- ============================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses from their company
CREATE POLICY "expenses_select_policy"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
    )
  );

-- All authenticated users can create expenses
CREATE POLICY "expenses_insert_policy"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
    )
  );

-- Users can update their own submitted expenses, GC Admin/PM can update any
CREATE POLICY "expenses_update_policy"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    -- Own expense (not yet approved)
    (submitted_by = next_auth.uid() AND status = 'submitted')
    OR
    -- GC Admin or PM can update any expense
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
      AND role IN ('gc_admin', 'project_manager')
    )
  );

-- Users can delete their own submitted expenses, GC Admin can delete any
CREATE POLICY "expenses_delete_policy"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    -- Own expense (not yet approved)
    (submitted_by = next_auth.uid() AND status = 'submitted')
    OR
    -- GC Admin can delete any
    company_id IN (
      SELECT company_id
      FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND status = 'active'
      AND role = 'gc_admin'
    )
  );

-- ============================================
-- Expense Line Items Table RLS
-- ============================================

ALTER TABLE public.expense_line_items ENABLE ROW LEVEL SECURITY;

-- Users can view line items for expenses they can see
CREATE POLICY "expense_line_items_select_policy"
  ON public.expense_line_items
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id
      FROM public.expenses e
      WHERE e.company_id IN (
        SELECT company_id
        FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND status = 'active'
      )
    )
  );

-- Users can create line items for their expenses
CREATE POLICY "expense_line_items_insert_policy"
  ON public.expense_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    expense_id IN (
      SELECT e.id
      FROM public.expenses e
      WHERE e.submitted_by = next_auth.uid()
      OR e.company_id IN (
        SELECT company_id
        FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND status = 'active'
        AND role IN ('gc_admin', 'project_manager')
      )
    )
  );

-- Users can update line items for expenses they can edit
CREATE POLICY "expense_line_items_update_policy"
  ON public.expense_line_items
  FOR UPDATE
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id
      FROM public.expenses e
      WHERE (e.submitted_by = next_auth.uid() AND e.status = 'submitted')
      OR e.company_id IN (
        SELECT company_id
        FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND status = 'active'
        AND role IN ('gc_admin', 'project_manager')
      )
    )
  );

-- Users can delete line items for expenses they can edit
CREATE POLICY "expense_line_items_delete_policy"
  ON public.expense_line_items
  FOR DELETE
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id
      FROM public.expenses e
      WHERE (e.submitted_by = next_auth.uid() AND e.status = 'submitted')
      OR e.company_id IN (
        SELECT company_id
        FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND status = 'active'
        AND role = 'gc_admin'
      )
    )
  );

-- ============================================
-- Indexes for Performance
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS material_assignments_project_status_idx
  ON public.material_assignments(project_id, procurement_status);

CREATE INDEX IF NOT EXISTS expenses_company_status_idx
  ON public.expenses(company_id, status);

CREATE INDEX IF NOT EXISTS expenses_project_status_idx
  ON public.expenses(project_id, status);
