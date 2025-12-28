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
