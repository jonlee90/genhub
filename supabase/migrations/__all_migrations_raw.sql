-- NextAuth.js Supabase Adapter Schema
-- Required for authentication to work
-- Run this BEFORE other migrations

-- Create next_auth schema
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Grant usage to postgres roles
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Create users table
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- Create function to get current user id (used by RLS policies)
CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Create accounts table (for OAuth providers)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid NOT NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Create sessions table
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expires timestamptz NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Create verification tokens table (for email magic links)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON next_auth.accounts("userId");
CREATE INDEX IF NOT EXISTS sessions_userId_idx ON next_auth.sessions("userId");
-- GenHub PWA: Companies Table
-- Multi-tenant company profiles for general contractors
-- Created: 2025-12-04

-- Companies table for multi-tenant isolation
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  logo_url text,
  website text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.companies IS 'Multi-tenant company profiles for general contractors. Each company has isolated data through RLS policies.';

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_companies_name ON public.companies(name);

-- RLS Policies: Companies are accessed through company_users membership
-- Users can only see companies they belong to (enforced via company_users join)
CREATE POLICY "Users can view their companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- Only GC Admins can update company info
CREATE POLICY "GC Admins can update company"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- Allow authenticated users to create companies (for onboarding)
CREATE POLICY "Authenticated users can create company"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- GenHub PWA: User Profiles Table
-- Extended user profiles linked to next-auth users
-- Created: 2025-12-04

-- User profiles extending next-auth users
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT next_auth.uid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  avatar_url text,
  phone text,
  job_title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles linked to next-auth authenticated users. Contains additional user information beyond auth data.';

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- RLS Policies
-- Users can view profiles of people in their company
CREATE POLICY "Users can view profiles in their company"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Can always view own profile
    id = next_auth.uid()
    OR
    -- Can view profiles of users in same company
    EXISTS (
      SELECT 1 FROM public.company_users cu1
      JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
      WHERE cu1.user_id = next_auth.uid()
      AND cu2.user_id = user_profiles.id
      AND cu1.status = 'active'
    )
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = next_auth.uid());
-- GenHub PWA: Company Users Table
-- Role-based access control linking users to companies
-- Created: 2025-12-04

-- Create role enum
CREATE TYPE public.user_role AS ENUM (
  'gc_admin',        -- Full access to all features
  'project_manager', -- Manage projects and tasks
  'foreman',         -- Field supervision access
  'field_worker',    -- Basic task access
  'subcontractor',   -- Limited to assigned work
  'client'           -- Client portal access only
);

-- Create status enum
CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'inactive'
);

-- Company users junction table
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  role public.user_role NOT NULL DEFAULT 'field_worker',
  status public.member_status NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES public.user_profiles(id),
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure unique user per company
  CONSTRAINT unique_user_per_company UNIQUE (company_id, user_id)
);

-- Add table comment
COMMENT ON TABLE public.company_users IS 'Junction table linking users to companies with role-based access control. Supports multi-company membership.';

-- Enable Row Level Security
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_role ON public.company_users(role);
CREATE INDEX idx_company_users_status ON public.company_users(status);

-- RLS Policies
-- Users can see members of their companies
CREATE POLICY "Users can view company members"
  ON public.company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins can manage company members
CREATE POLICY "GC Admins can insert members"
  ON public.company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow self-registration as gc_admin for new companies
    (user_id = next_auth.uid() AND role = 'gc_admin')
    OR
    -- Or GC Admin inviting others
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can update members"
  ON public.company_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can delete members"
  ON public.company_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
-- GenHub PWA: Subcontractors Directory Table
-- Subcontractor profiles with trade info, license, and performance tracking
-- Created: 2025-12-04

-- Trade specialization enum
CREATE TYPE public.trade_type AS ENUM (
  'general',
  'electrical',
  'plumbing',
  'hvac',
  'carpentry',
  'masonry',
  'roofing',
  'flooring',
  'painting',
  'drywall',
  'concrete',
  'landscaping',
  'demolition',
  'steel_work',
  'glass_glazing',
  'fire_protection',
  'insulation',
  'other'
);

-- Subcontractors directory table
CREATE TABLE public.subcontractors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  trade_specialization public.trade_type NOT NULL DEFAULT 'general',
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  state text,
  zip_code text,
  license_number text,
  license_expiry date,
  insurance_provider text,
  insurance_policy_number text,
  insurance_expiry date,
  performance_rating decimal(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  total_projects integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.subcontractors IS 'Directory of subcontractors with trade specializations, licensing, insurance, and performance tracking. Isolated by company.';

-- Enable Row Level Security
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_subcontractors_company_id ON public.subcontractors(company_id);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade_specialization);
CREATE INDEX idx_subcontractors_is_active ON public.subcontractors(is_active);
CREATE INDEX idx_subcontractors_company_name ON public.subcontractors(company_name);

-- RLS Policies
-- Company members can view subcontractors
CREATE POLICY "Company members can view subcontractors"
  ON public.subcontractors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can manage subcontractors
CREATE POLICY "GC Admins and PMs can insert subcontractors"
  ON public.subcontractors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins and PMs can update subcontractors"
  ON public.subcontractors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can delete subcontractors"
  ON public.subcontractors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
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
-- GenHub PWA: Tasks Table
-- Task management with status, priority, dependencies, and cost tracking
-- Created: 2025-12-04

-- Task status enum
CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'review',
  'blocked',
  'completed'
);

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  due_date date,
  planned_cost decimal(10,2),
  actual_cost decimal(10,2) DEFAULT 0,
  blocker_reason text,
  display_order integer DEFAULT 0,
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.tasks IS 'Task management with Kanban/List views, priority levels, cost tracking, and assignment to users or subcontractors.';

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_phase_id ON public.tasks(phase_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_subcontractor_id ON public.tasks(subcontractor_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- RLS Policies
-- Company members can view tasks
CREATE POLICY "Company members can view tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = tasks.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins, PMs, and Foremen can create tasks
CREATE POLICY "Managers can insert tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = tasks.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager', 'foreman')
      AND cu.status = 'active'
    )
  );

-- Task assignees and managers can update tasks
CREATE POLICY "Assignees and managers can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    -- Assignee can update
    assignee_id = next_auth.uid()
    OR
    -- Managers can update
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = tasks.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager', 'foreman')
      AND cu.status = 'active'
    )
  );

-- Only managers can delete tasks
CREATE POLICY "Managers can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = tasks.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );
-- GenHub PWA: Task Dependencies Table
-- Dependency relationships between tasks for auto-blocking
-- Created: 2025-12-04

-- Task dependencies table
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),

  -- Prevent self-dependency
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  -- Unique dependency relationship
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

-- Add table comment
COMMENT ON TABLE public.task_dependencies IS 'Dependency relationships between tasks. A task cannot start until all its dependencies are completed.';

-- Enable Row Level Security
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

-- RLS Policies (inherit from task access)
CREATE POLICY "Users can view dependencies of accessible tasks"
  ON public.task_dependencies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE t.id = task_dependencies.task_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

CREATE POLICY "Managers can insert dependencies"
  ON public.task_dependencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE t.id = task_dependencies.task_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager', 'foreman')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "Managers can delete dependencies"
  ON public.task_dependencies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE t.id = task_dependencies.task_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager', 'foreman')
      AND cu.status = 'active'
    )
  );
-- GenHub PWA: Task Activity Table
-- Audit log for task changes and comments
-- Created: 2025-12-04

-- Activity action enum
CREATE TYPE public.activity_action AS ENUM (
  'created',
  'status_changed',
  'priority_changed',
  'assigned',
  'unassigned',
  'due_date_changed',
  'description_updated',
  'blocked',
  'unblocked',
  'completed',
  'comment',
  'attachment_added',
  'attachment_removed'
);

-- Task activity table
CREATE TABLE public.task_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  action public.activity_action NOT NULL,
  old_value text,
  new_value text,
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.task_activity IS 'Audit log tracking all task changes and comments. Provides complete history for task detail view.';

-- Enable Row Level Security
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_task_activity_task_id ON public.task_activity(task_id);
CREATE INDEX idx_task_activity_user_id ON public.task_activity(user_id);
CREATE INDEX idx_task_activity_created_at ON public.task_activity(created_at DESC);

-- RLS Policies
-- Users who can see the task can see its activity
CREATE POLICY "Users can view activity of accessible tasks"
  ON public.task_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE t.id = task_activity.task_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- Users who can update tasks can add activity
CREATE POLICY "Users can insert activity for accessible tasks"
  ON public.task_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE t.id = task_activity.task_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- Activity cannot be updated or deleted (immutable audit log)
-- GenHub PWA: Notifications Table
-- Multi-channel notification system
-- Created: 2025-12-04

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_overdue',
  'task_blocked',
  'task_comment',
  'project_update',
  'team_invited',
  'team_joined',
  'mention',
  'deadline_reminder',
  'phase_completed'
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  entity_type text, -- 'task', 'project', 'team', etc.
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.notifications IS 'User notifications for task assignments, updates, mentions, and system events. Supports in-app, email, push, and KakaoTalk channels.';

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = next_auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = next_auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = next_auth.uid());
-- GenHub PWA: Attachments Table
-- File storage metadata for tasks, projects, and profiles
-- Created: 2025-12-04

-- Entity type enum for polymorphic attachments
CREATE TYPE public.attachment_entity_type AS ENUM (
  'task',
  'project',
  'phase',
  'profile',
  'subcontractor',
  'daily_report'
);

-- Attachments table
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type public.attachment_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- MIME type
  file_size integer NOT NULL, -- bytes
  thumbnail_url text,
  uploaded_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.attachments IS 'File attachments stored in Vercel Blob. Polymorphic relationship to tasks, projects, phases, and profiles.';

-- Enable Row Level Security
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- RLS Policies
-- Access depends on the entity type
CREATE POLICY "Users can view attachments of accessible entities"
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    CASE entity_type
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE t.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'project' THEN EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE p.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'phase' THEN EXISTS (
        SELECT 1 FROM public.project_phases ph
        JOIN public.projects p ON p.id = ph.project_id
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE ph.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'profile' THEN (
        attachments.entity_id = next_auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_users cu1
          JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
          WHERE cu1.user_id = next_auth.uid()
          AND cu2.user_id = attachments.entity_id
          AND cu1.status = 'active'
        )
      )
      WHEN 'subcontractor' THEN EXISTS (
        SELECT 1 FROM public.subcontractors s
        JOIN public.company_users cu ON cu.company_id = s.company_id
        WHERE s.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      ELSE false
    END
  );

-- Authenticated users can upload attachments
CREATE POLICY "Users can insert attachments"
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = next_auth.uid());

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (uploaded_by = next_auth.uid());
-- GenHub PWA: Database Triggers and Functions
-- Auto-update timestamps, create default phases, update completion percentages
-- Created: 2025-12-04

-- ============================================
-- 1. Updated At Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Auto-Create Default Project Phases
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the 5 universal phases for new projects
  INSERT INTO public.project_phases (project_id, name, display_order, status)
  VALUES
    (NEW.id, 'Initiation', 1, 'not_started'),
    (NEW.id, 'Pre-Construction', 2, 'not_started'),
    (NEW.id, 'Procurement', 3, 'not_started'),
    (NEW.id, 'Construction', 4, 'not_started'),
    (NEW.id, 'Post-Construction', 5, 'not_started');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_phases_on_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_project_phases();

-- ============================================
-- 3. Update Phase Completion Percentage
-- ============================================

CREATE OR REPLACE FUNCTION public.update_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_percentage integer;
  phase_id_to_update uuid;
BEGIN
  -- Determine which phase to update
  IF TG_OP = 'DELETE' THEN
    phase_id_to_update := OLD.phase_id;
  ELSE
    phase_id_to_update := NEW.phase_id;
  END IF;

  -- Skip if no phase assigned
  IF phase_id_to_update IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count tasks in phase
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE phase_id = phase_id_to_update;

  -- Calculate percentage
  IF total_tasks > 0 THEN
    new_percentage := (completed_tasks * 100) / total_tasks;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update phase
  UPDATE public.project_phases
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.phase_status
      WHEN new_percentage > 0 THEN 'in_progress'::public.phase_status
      ELSE 'not_started'::public.phase_status
    END
  WHERE id = phase_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_phase_completion_on_task_change
  AFTER INSERT OR UPDATE OF status, phase_id OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_phase_completion();

-- ============================================
-- 4. Update Project Completion Percentage
-- ============================================

CREATE OR REPLACE FUNCTION public.update_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_phases integer;
  total_percentage integer;
  new_percentage integer;
  project_id_to_update uuid;
BEGIN
  -- Determine which project to update
  IF TG_OP = 'DELETE' THEN
    project_id_to_update := OLD.project_id;
  ELSE
    project_id_to_update := NEW.project_id;
  END IF;

  -- Calculate average completion across phases
  SELECT COUNT(*), COALESCE(SUM(completion_percentage), 0)
  INTO total_phases, total_percentage
  FROM public.project_phases
  WHERE project_id = project_id_to_update;

  -- Calculate percentage
  IF total_phases > 0 THEN
    new_percentage := total_percentage / total_phases;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update project
  UPDATE public.projects
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.project_status
      ELSE status -- Keep current status if not 100%
    END
  WHERE id = project_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_project_completion_on_phase_change
  AFTER UPDATE OF completion_percentage OR DELETE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_project_completion();

-- ============================================
-- 5. Set Task Completed At Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completed_at_on_task_complete
  BEFORE UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();
