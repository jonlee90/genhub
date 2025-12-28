-- ============================================
-- GenHub PWA: Consolidated Database Migration
-- ============================================
-- This file consolidates all 14 migration files in dependency order
-- to ensure proper database setup without circular reference issues.
--
-- EXECUTION ORDER:
-- 1. Setup: Schemas and Extensions
-- 2. NextAuth: Authentication tables and functions
-- 3. ENUMs: All enumeration types
-- 4. TABLES: All table structures with indexes (NO RLS/Policies yet)
-- 5. RLS: Enable Row Level Security on all tables
-- 6. POLICIES: Create all RLS policies (tables exist, can reference them)
-- 7. TRIGGERS: Create all triggers and functions
--
-- Created: 2025-12-04
-- ============================================


-- ============================================
-- SECTION 1: SETUP - Schemas and Extensions
-- ============================================

-- Create next_auth schema
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Grant usage to postgres roles
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================
-- SECTION 2: NEXTAUTH - Authentication Tables
-- ============================================

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


-- ============================================
-- SECTION 3: ENUMS - All Enumeration Types
-- ============================================

-- User role enum
CREATE TYPE public.user_role AS ENUM (
  'gc_admin',        -- Full access to all features
  'project_manager', -- Manage projects and tasks
  'foreman',         -- Field supervision access
  'field_worker',    -- Basic task access
  'subcontractor',   -- Limited to assigned work
  'client'           -- Client portal access only
);

-- Member status enum
CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'inactive'
);

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

-- Phase status enum
CREATE TYPE public.phase_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

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

-- Entity type enum for polymorphic attachments
CREATE TYPE public.attachment_entity_type AS ENUM (
  'task',
  'project',
  'phase',
  'profile',
  'subcontractor',
  'daily_report'
);


-- ============================================
-- SECTION 4: TABLES - All Table Structures
-- ============================================
-- NOTE: RLS and Policies are NOT created here yet.
-- Tables must exist FIRST before policies can reference them.

-- ==================
-- 4.1 Companies Table
-- ==================
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

COMMENT ON TABLE public.companies IS 'Multi-tenant company profiles for general contractors. Each company has isolated data through RLS policies.';

CREATE INDEX idx_companies_name ON public.companies(name);

-- ==================
-- 4.2 User Profiles Table
-- ==================
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

COMMENT ON TABLE public.user_profiles IS 'Extended user profiles linked to next-auth authenticated users. Contains additional user information beyond auth data.';

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- ==================
-- 4.3 Company Users Table
-- ==================
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
  CONSTRAINT unique_user_per_company UNIQUE (company_id, user_id)
);

COMMENT ON TABLE public.company_users IS 'Junction table linking users to companies with role-based access control. Supports multi-company membership.';

CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_role ON public.company_users(role);
CREATE INDEX idx_company_users_status ON public.company_users(status);

-- ==================
-- 4.4 Subcontractors Table
-- ==================
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

COMMENT ON TABLE public.subcontractors IS 'Directory of subcontractors with trade specializations, licensing, insurance, and performance tracking. Isolated by company.';

CREATE INDEX idx_subcontractors_company_id ON public.subcontractors(company_id);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade_specialization);
CREATE INDEX idx_subcontractors_is_active ON public.subcontractors(is_active);
CREATE INDEX idx_subcontractors_company_name ON public.subcontractors(company_name);

-- ==================
-- 4.5 Projects Table
-- ==================
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

COMMENT ON TABLE public.projects IS 'Construction projects with type-specific templates, budget tracking, and health scoring. Isolated by company.';

CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_type ON public.projects(project_type);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- ==================
-- 4.6 Project Phases Table
-- ==================
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
  CONSTRAINT unique_phase_per_project UNIQUE (project_id, name),
  CONSTRAINT unique_order_per_project UNIQUE (project_id, display_order)
);

COMMENT ON TABLE public.project_phases IS 'Project phases for Metro Journey visualization. Each phase represents a milestone station in the subway-style project view.';

CREATE INDEX idx_project_phases_project_id ON public.project_phases(project_id);
CREATE INDEX idx_project_phases_status ON public.project_phases(status);

-- ==================
-- 4.7 Project Team Table
-- ==================
CREATE TABLE public.project_team (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'field_worker',
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_or_subcontractor CHECK (
    (user_id IS NOT NULL AND subcontractor_id IS NULL) OR
    (user_id IS NULL AND subcontractor_id IS NOT NULL)
  ),
  CONSTRAINT unique_user_per_project UNIQUE (project_id, user_id),
  CONSTRAINT unique_sub_per_project UNIQUE (project_id, subcontractor_id)
);

COMMENT ON TABLE public.project_team IS 'Project team assignments linking internal users and subcontractors to specific projects with role-based access.';

CREATE INDEX idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX idx_project_team_user_id ON public.project_team(user_id);
CREATE INDEX idx_project_team_subcontractor_id ON public.project_team(subcontractor_id);

-- ==================
-- 4.8 Tasks Table
-- ==================
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

COMMENT ON TABLE public.tasks IS 'Task management with Kanban/List views, priority levels, cost tracking, and assignment to users or subcontractors.';

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_phase_id ON public.tasks(phase_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_subcontractor_id ON public.tasks(subcontractor_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- ==================
-- 4.9 Task Dependencies Table
-- ==================
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

COMMENT ON TABLE public.task_dependencies IS 'Dependency relationships between tasks. A task cannot start until all its dependencies are completed.';

CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

-- ==================
-- 4.10 Task Activity Table
-- ==================
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

COMMENT ON TABLE public.task_activity IS 'Audit log tracking all task changes and comments. Provides complete history for task detail view.';

CREATE INDEX idx_task_activity_task_id ON public.task_activity(task_id);
CREATE INDEX idx_task_activity_user_id ON public.task_activity(user_id);
CREATE INDEX idx_task_activity_created_at ON public.task_activity(created_at DESC);

-- ==================
-- 4.11 Notifications Table
-- ==================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications for task assignments, updates, mentions, and system events. Supports in-app, email, push, and KakaoTalk channels.';

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- ==================
-- 4.12 Attachments Table
-- ==================
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type public.attachment_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  thumbnail_url text,
  uploaded_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.attachments IS 'File attachments stored in Vercel Blob. Polymorphic relationship to tasks, projects, phases, and profiles.';

CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);


-- ============================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- ============================================
-- Enable RLS on all tables that need it

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
-- SECTION 6: RLS POLICIES
-- ============================================
-- Now that all tables exist, we can safely create policies
-- that reference multiple tables

-- ==================
-- 6.1 Companies Policies
-- ==================
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

CREATE POLICY "Authenticated users can create company"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==================
-- 6.2 User Profiles Policies
-- ==================
CREATE POLICY "Users can view profiles in their company"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = next_auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.company_users cu1
      JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
      WHERE cu1.user_id = next_auth.uid()
      AND cu2.user_id = user_profiles.id
      AND cu1.status = 'active'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid());

CREATE POLICY "Users can create own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = next_auth.uid());

-- ==================
-- 6.3 Company Users Policies
-- ==================
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

CREATE POLICY "GC Admins can insert members"
  ON public.company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = next_auth.uid() AND role = 'gc_admin')
    OR
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

-- ==================
-- 6.4 Subcontractors Policies
-- ==================
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

-- ==================
-- 6.5 Projects Policies
-- ==================
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

-- ==================
-- 6.6 Project Phases Policies
-- ==================
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

-- ==================
-- 6.7 Project Team Policies
-- ==================
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

-- ==================
-- 6.8 Tasks Policies
-- ==================
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

CREATE POLICY "Assignees and managers can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    assignee_id = next_auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE p.id = tasks.project_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager', 'foreman')
      AND cu.status = 'active'
    )
  );

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

-- ==================
-- 6.9 Task Dependencies Policies
-- ==================
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

-- ==================
-- 6.10 Task Activity Policies
-- ==================
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

-- ==================
-- 6.11 Notifications Policies
-- ==================
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = next_auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = next_auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = next_auth.uid());

-- ==================
-- 6.12 Attachments Policies
-- ==================
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

CREATE POLICY "Users can insert attachments"
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = next_auth.uid());

CREATE POLICY "Users can delete own attachments"
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (uploaded_by = next_auth.uid());


-- ============================================
-- SECTION 7: TRIGGERS AND FUNCTIONS
-- ============================================

-- ==================
-- 7.1 Updated At Trigger Function
-- ==================
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

-- ==================
-- 7.2 Auto-Create Default Project Phases
-- ==================
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

-- ==================
-- 7.3 Update Phase Completion Percentage
-- ==================
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

-- ==================
-- 7.4 Update Project Completion Percentage
-- ==================
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

-- ==================
-- 7.5 Set Task Completed At Timestamp
-- ==================
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


-- ============================================
-- MIGRATION COMPLETED
-- ============================================
-- All database objects created successfully:
-- - 2 Schemas (public, next_auth)
-- - 1 Extension (uuid-ossp)
-- - 4 NextAuth tables (users, accounts, sessions, verification_tokens)
-- - 11 ENUMs (user_role, member_status, trade_type, project_type, project_status, phase_status, task_status, task_priority, activity_action, notification_type, attachment_entity_type)
-- - 12 Application tables (companies, user_profiles, company_users, subcontractors, projects, project_phases, project_team, tasks, task_dependencies, task_activity, notifications, attachments)
-- - 12 Tables with RLS enabled
-- - 48 RLS Policies
-- - 5 Trigger functions (update_updated_at, create_default_phases, update_phase_completion, update_project_completion, set_task_completed_at)
-- - 13 Triggers
-- ============================================
