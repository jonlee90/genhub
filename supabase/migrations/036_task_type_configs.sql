-- Migration: 036_task_type_configs
-- Description: Create task_type_configs table for company-scoped task type configuration
-- This table stores customizable task type definitions per company, replacing hardcoded enum values

-- Create task_type_configs table
CREATE TABLE IF NOT EXISTS public.task_type_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  icon_name text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure unique task type names per company
  CONSTRAINT unique_company_task_type UNIQUE (company_id, name)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_task_type_configs_company_id
  ON public.task_type_configs(company_id);

-- Enable RLS
ALTER TABLE public.task_type_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to SELECT (read) active task types for their company
CREATE POLICY "task_type_configs_select_policy"
  ON public.task_type_configs
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND is_active = true
  );

-- RLS Policy: Only GC admins can INSERT task types
CREATE POLICY "task_type_configs_insert_policy"
  ON public.task_type_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can UPDATE task types
CREATE POLICY "task_type_configs_update_policy"
  ON public.task_type_configs
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can DELETE task types
CREATE POLICY "task_type_configs_delete_policy"
  ON public.task_type_configs
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- Add trigger to auto-update updated_at timestamp
CREATE TRIGGER update_task_type_configs_updated_at
  BEFORE UPDATE ON public.task_type_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.task_type_configs IS
  'Company-scoped task type configurations. Allows GC admins to customize task types (previously hardcoded as work, purchase, approval, admin).';
