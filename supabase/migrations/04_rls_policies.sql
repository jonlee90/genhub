-- ============================================
-- Part 4: RLS and Policies
-- Run this FOURTH (after all tables exist)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Companies Policies
-- ============================================
CREATE POLICY "Users can view their company"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "GC Admin can update company"
  ON public.companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND role = 'gc_admin' AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (next_auth.uid() IS NOT NULL);

-- ============================================
-- User Profiles Policies
-- ============================================
CREATE POLICY "Users can view profiles in their company"
  ON public.user_profiles FOR SELECT
  USING (
    id = next_auth.uid() OR
    id IN (
      SELECT cu2.user_id FROM public.company_users cu1
      JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
      WHERE cu1.user_id = next_auth.uid() AND cu1.status = 'active'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = next_auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = next_auth.uid());

-- ============================================
-- Company Users Policies
-- ============================================
CREATE POLICY "Users can view company members"
  ON public.company_users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "GC Admin can manage company users"
  ON public.company_users FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND role = 'gc_admin' AND status = 'active'
    )
  );

-- ============================================
-- Subcontractors Policies
-- ============================================
CREATE POLICY "Users can view company subcontractors"
  ON public.subcontractors FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "GC/PM can manage subcontractors"
  ON public.subcontractors FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager')
        AND status = 'active'
    )
  );

-- ============================================
-- Projects Policies
-- ============================================
CREATE POLICY "Users can view company projects"
  ON public.projects FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "GC/PM can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager')
        AND status = 'active'
    )
  );

CREATE POLICY "GC/PM can update projects"
  ON public.projects FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager')
        AND status = 'active'
    )
  );

CREATE POLICY "GC Admin can delete projects"
  ON public.projects FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND role = 'gc_admin' AND status = 'active'
    )
  );

-- ============================================
-- Project Phases Policies
-- ============================================
CREATE POLICY "Users can view project phases"
  ON public.project_phases FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "GC/PM can manage phases"
  ON public.project_phases FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
          AND role IN ('gc_admin', 'project_manager')
          AND status = 'active'
      )
    )
  );

-- ============================================
-- Project Team Policies
-- ============================================
CREATE POLICY "Users can view project team"
  ON public.project_team FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "GC/PM can manage project team"
  ON public.project_team FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
          AND role IN ('gc_admin', 'project_manager')
          AND status = 'active'
      )
    )
  );

-- ============================================
-- Tasks Policies
-- ============================================
CREATE POLICY "Users can view tasks in their projects"
  ON public.tasks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "GC/PM can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
          AND role IN ('gc_admin', 'project_manager')
          AND status = 'active'
      )
    )
  );

-- ============================================
-- Task Dependencies Policies
-- ============================================
CREATE POLICY "Users can view task dependencies"
  ON public.task_dependencies FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users
          WHERE user_id = next_auth.uid() AND status = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can manage task dependencies"
  ON public.task_dependencies FOR ALL
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users
          WHERE user_id = next_auth.uid() AND status = 'active'
        )
      )
    )
  );

-- ============================================
-- Task Activity Policies
-- ============================================
CREATE POLICY "Users can view task activity"
  ON public.task_activity FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users
          WHERE user_id = next_auth.uid() AND status = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can create task activity"
  ON public.task_activity FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users
          WHERE user_id = next_auth.uid() AND status = 'active'
        )
      )
    )
  );

-- ============================================
-- Notifications Policies
-- ============================================
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (user_id = next_auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = next_auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Attachments Policies
-- ============================================
CREATE POLICY "Users can view attachments"
  ON public.attachments FOR SELECT
  USING (true);

CREATE POLICY "Users can create attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (uploaded_by = next_auth.uid());

CREATE POLICY "Users can delete their attachments"
  ON public.attachments FOR DELETE
  USING (uploaded_by = next_auth.uid());
