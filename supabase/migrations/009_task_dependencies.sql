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
