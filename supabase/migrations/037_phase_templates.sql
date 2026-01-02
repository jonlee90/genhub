-- Migration: 037_phase_templates
-- Description: Create phase_templates table for project phase template configuration
-- This table stores the phase templates that will be used when creating new projects

-- Create phase_templates table
CREATE TABLE IF NOT EXISTS public.phase_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_type_config_id uuid NOT NULL REFERENCES public.project_type_configs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure unique phase names per project type config
  CONSTRAINT unique_project_type_phase_name UNIQUE (project_type_config_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_phase_templates_company_id
  ON public.phase_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_phase_templates_project_type_config_id
  ON public.phase_templates(project_type_config_id);

CREATE INDEX IF NOT EXISTS idx_phase_templates_project_type_order
  ON public.phase_templates(project_type_config_id, order_index);

-- Enable RLS
ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to SELECT (read) phase templates for their company
CREATE POLICY "phase_templates_select_policy"
  ON public.phase_templates
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
  );

-- RLS Policy: Only GC admins can INSERT phase templates
CREATE POLICY "phase_templates_insert_policy"
  ON public.phase_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can UPDATE phase templates
CREATE POLICY "phase_templates_update_policy"
  ON public.phase_templates
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can DELETE phase templates
CREATE POLICY "phase_templates_delete_policy"
  ON public.phase_templates
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- Add trigger to auto-update updated_at timestamp
CREATE TRIGGER update_phase_templates_updated_at
  BEFORE UPDATE ON public.phase_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.phase_templates IS
  'Phase templates for project types. When a new project is created, phases are automatically created based on these templates.';
