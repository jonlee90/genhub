-- Migration: 038_task_templates
-- Description: Create task_templates table for phase-specific task template configuration
-- This table stores the task templates that will be used when creating project phases

-- Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phase_template_id uuid NOT NULL REFERENCES public.phase_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  default_task_type text,
  default_priority text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_templates_company_id
  ON public.task_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_phase_template_id
  ON public.task_templates(phase_template_id);

CREATE INDEX IF NOT EXISTS idx_task_templates_phase_order
  ON public.task_templates(phase_template_id, order_index);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to SELECT (read) task templates for their company
CREATE POLICY "task_templates_select_policy"
  ON public.task_templates
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
  );

-- RLS Policy: Only GC admins can INSERT task templates
CREATE POLICY "task_templates_insert_policy"
  ON public.task_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can UPDATE task templates
CREATE POLICY "task_templates_update_policy"
  ON public.task_templates
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can DELETE task templates
CREATE POLICY "task_templates_delete_policy"
  ON public.task_templates
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- Add trigger to auto-update updated_at timestamp
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.task_templates IS
  'Task templates for phase templates. When a new project phase is created, tasks are automatically created based on these templates.';
