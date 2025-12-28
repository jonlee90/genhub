-- GenHub PWA: Project Team Table
-- Team assignments linking users and subcontractors to projects
-- Created: 2025-12-04

-- Project team table
CREATE TABLE public.project_team (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'field_worker',
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),

  -- Either user_id or subcontractor_id must be set, not both
  CONSTRAINT user_or_subcontractor CHECK (
    (user_id IS NOT NULL AND subcontractor_id IS NULL) OR
    (user_id IS NULL AND subcontractor_id IS NOT NULL)
  ),
  -- Ensure unique assignment per project
  CONSTRAINT unique_user_per_project UNIQUE (project_id, user_id),
  CONSTRAINT unique_sub_per_project UNIQUE (project_id, subcontractor_id)
);

-- Add table comment
COMMENT ON TABLE public.project_team IS 'Project team assignments linking internal users and subcontractors to specific projects with role-based access.';

-- Enable Row Level Security
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX idx_project_team_user_id ON public.project_team(user_id);
CREATE INDEX idx_project_team_subcontractor_id ON public.project_team(subcontractor_id);

-- RLS Policies
-- Company members can view project team
CREATE POLICY "Users can view project team"
  ON public.project_team
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_team.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can manage project team
CREATE POLICY "GC Admins and PMs can insert team members"
  ON public.project_team
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_team.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins and PMs can update team members"
  ON public.project_team
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_team.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins and PMs can delete team members"
  ON public.project_team
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_team.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );
