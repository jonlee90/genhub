-- GenHub PWA: Projects Table
-- Project management with type templates and health tracking
-- Created: 2025-12-04

-- Project type enum
CREATE TYPE public.project_type AS ENUM (
  'residential',
  'restaurant_cafe',
  'commercial_office',
  'industrial'
);

-- Project status enum
CREATE TYPE public.project_status AS ENUM (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  address text,
  city text,
  state text,
  zip_code text,
  project_type public.project_type NOT NULL DEFAULT 'residential',
  status public.project_status NOT NULL DEFAULT 'active',
  description text,
  start_date date,
  end_date date,
  budget decimal(12,2),
  actual_cost decimal(12,2) DEFAULT 0,
  health_score integer DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.projects IS 'Construction projects with type-specific templates, budget tracking, and health scoring. Isolated by company.';

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_type ON public.projects(project_type);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- RLS Policies
-- Company members can view projects
CREATE POLICY "Company members can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = projects.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can create projects
CREATE POLICY "GC Admins and PMs can insert projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = projects.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can update projects
CREATE POLICY "GC Admins and PMs can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = projects.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

-- Only GC Admins can delete (archive) projects
CREATE POLICY "GC Admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = projects.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
