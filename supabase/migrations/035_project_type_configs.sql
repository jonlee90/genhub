-- Migration: 035_project_type_configs
-- Description: Create project_type_configs table for company-scoped project type configuration
-- This table stores customizable project type definitions per company, replacing hardcoded enum values

-- Create project_type_configs table
CREATE TABLE IF NOT EXISTS public.project_type_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_name text,
  color text,
  is_default boolean DEFAULT false,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure unique project type names per company
  CONSTRAINT unique_company_project_type UNIQUE (company_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_type_configs_company_id
  ON public.project_type_configs(company_id);

CREATE INDEX IF NOT EXISTS idx_project_type_configs_company_order
  ON public.project_type_configs(company_id, order_index);

-- Enable RLS
ALTER TABLE public.project_type_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to SELECT (read) project types for their company
CREATE POLICY "project_type_configs_select_policy"
  ON public.project_type_configs
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
  );

-- RLS Policy: Only GC admins can INSERT project types
CREATE POLICY "project_type_configs_insert_policy"
  ON public.project_type_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can UPDATE project types
CREATE POLICY "project_type_configs_update_policy"
  ON public.project_type_configs
  FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- RLS Policy: Only GC admins can DELETE project types
CREATE POLICY "project_type_configs_delete_policy"
  ON public.project_type_configs
  FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    AND public.is_user_gc_admin(next_auth.uid())
  );

-- Add trigger to auto-update updated_at timestamp
CREATE TRIGGER update_project_type_configs_updated_at
  BEFORE UPDATE ON public.project_type_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.project_type_configs IS
  'Company-scoped project type configurations. Allows GC admins to customize project types (previously hardcoded as residential, restaurant_cafe, commercial_office, industrial).';
