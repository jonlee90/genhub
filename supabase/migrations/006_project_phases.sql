-- GenHub PWA: Project Phases Table
-- Metro Journey phases for visual project tracking
-- Created: 2025-12-04

-- Phase status enum
CREATE TYPE public.phase_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

-- Project phases table
CREATE TABLE public.project_phases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL,
  status public.phase_status NOT NULL DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure unique phase name per project
  CONSTRAINT unique_phase_per_project UNIQUE (project_id, name),
  -- Ensure unique display order per project
  CONSTRAINT unique_order_per_project UNIQUE (project_id, display_order)
);

-- Add table comment
COMMENT ON TABLE public.project_phases IS 'Project phases for Metro Journey visualization. Each phase represents a milestone station in the subway-style project view.';

-- Enable Row Level Security
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_project_phases_project_id ON public.project_phases(project_id);
CREATE INDEX idx_project_phases_status ON public.project_phases(status);

-- RLS Policies (inherit from project access)
-- Users who can see the project can see its phases
CREATE POLICY "Users can view phases of accessible projects"
  ON public.project_phases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_phases.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can manage phases
CREATE POLICY "GC Admins and PMs can insert phases"
  ON public.project_phases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_phases.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins and PMs can update phases"
  ON public.project_phases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_phases.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can delete phases"
  ON public.project_phases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = project_phases.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
