-- ============================================
-- Part 3: All Application Tables (NO RLS YET)
-- Run this THIRD
-- ============================================

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companies_name_idx ON public.companies(name);

-- User profiles table (extends next_auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);

-- Company users table (membership/roles)
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'field_worker',
  status public.member_status NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES next_auth.users(id),
  invited_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_users_unique UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS company_users_company_idx ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS company_users_user_idx ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS company_users_status_idx ON public.company_users(status);

-- Subcontractors table
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  trade_specialization public.trade_type NOT NULL DEFAULT 'general',
  contact_name text NOT NULL,
  email text,
  phone text,
  address text,
  license_number text,
  license_expiry date,
  insurance_provider text,
  insurance_expiry date,
  performance_rating numeric(3,2) DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subcontractors_company_idx ON public.subcontractors(company_id);
CREATE INDEX IF NOT EXISTS subcontractors_trade_idx ON public.subcontractors(trade_specialization);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  budget numeric(12,2),
  health_score integer DEFAULT 100,
  completion_percentage integer DEFAULT 0,
  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_company_idx ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS projects_type_idx ON public.projects(project_type);

-- Project phases table
CREATE TABLE IF NOT EXISTS public.project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  status public.phase_status NOT NULL DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_phases_unique UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS project_phases_project_idx ON public.project_phases(project_id);
CREATE INDEX IF NOT EXISTS project_phases_status_idx ON public.project_phases(status);

-- Project team table
CREATE TABLE IF NOT EXISTS public.project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES next_auth.users(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES next_auth.users(id),
  CONSTRAINT project_team_user_unique UNIQUE (project_id, user_id),
  CONSTRAINT project_team_sub_unique UNIQUE (project_id, subcontractor_id),
  CONSTRAINT project_team_one_type CHECK (
    (user_id IS NOT NULL AND subcontractor_id IS NULL) OR
    (user_id IS NULL AND subcontractor_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS project_team_project_idx ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS project_team_user_idx ON public.project_team(user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  due_date date,
  planned_cost numeric(10,2),
  actual_cost numeric(10,2),
  blocked_reason text,
  completed_at timestamptz,
  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_project_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_phase_idx ON public.tasks(phase_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_dependencies_unique UNIQUE (task_id, depends_on_task_id),
  CONSTRAINT task_dependencies_no_self CHECK (task_id != depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS task_dependencies_task_idx ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS task_dependencies_depends_idx ON public.task_dependencies(depends_on_task_id);

-- Task activity table
CREATE TABLE IF NOT EXISTS public.task_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  action public.activity_action NOT NULL,
  old_value text,
  new_value text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_activity_task_idx ON public.task_activity(task_id);
CREATE INDEX IF NOT EXISTS task_activity_created_idx ON public.task_activity(created_at DESC);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at DESC);

-- Attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.attachment_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES next_auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attachments_entity_idx ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS attachments_uploaded_by_idx ON public.attachments(uploaded_by);
