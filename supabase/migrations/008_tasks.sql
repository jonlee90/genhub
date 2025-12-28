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
