-- Migration: Auto-seed default project type and task type configs on company creation
-- Author: Claude Code
-- Date: 2026-01-19
-- Purpose: Ensure new companies have default configs so ProjectTypeSelector and TaskTypeSelector work immediately

-- ============================================
-- 1. Create function to seed default configs for a company
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_default_configs_for_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Seed default project type configs
  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Residential', 'Homes & apartments', 'Home', '#3b82f6', true, 1),
    (NEW.id, 'Restaurant', 'Full-service dining', 'UtensilsCrossed', '#10b981', false, 2),
    (NEW.id, 'Cafe', 'Coffee & eateries', 'Coffee', '#f59e0b', false, 3),
    (NEW.id, 'Commercial Office', 'Office & retail', 'Building2', '#64748b', false, 4),
    (NEW.id, 'Industrial', 'Warehouse & factory', 'Factory', '#8b5cf6', false, 5);

  -- Seed default task type configs
  INSERT INTO public.task_type_configs (company_id, name, description, icon_name, color, is_default)
  VALUES
    (NEW.id, 'Work', 'Standard labor and construction tasks', 'Hammer', '#3b82f6', true),
    (NEW.id, 'Purchase', 'Materials, equipment, and supplies', 'ShoppingCart', '#10b981', false),
    (NEW.id, 'Approval', 'Permits, sign-offs, and inspections', 'ClipboardCheck', '#f59e0b', false),
    (NEW.id, 'Admin', 'Administrative and overhead tasks', 'FileText', '#64748b', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- 2. Create trigger to run seeding on company creation
-- ============================================
DROP TRIGGER IF EXISTS seed_default_configs_on_company_insert ON public.companies;

CREATE TRIGGER seed_default_configs_on_company_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_configs_for_company();

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON FUNCTION public.seed_default_configs_for_company() IS
  'Automatically seeds default project type and task type configurations when a new company is created. This ensures the ProjectTypeSelector and TaskTypeSelector components have data to display.';

COMMENT ON TRIGGER seed_default_configs_on_company_insert ON public.companies IS
  'Trigger that seeds default configuration data when a new company is created.';

-- ============================================
-- 4. Seed existing companies that don't have configs
-- ============================================
-- This ensures existing companies without configs get the defaults
DO $$
DECLARE
  v_company RECORD;
BEGIN
  -- Find companies without any project_type_configs
  FOR v_company IN
    SELECT c.id
    FROM public.companies c
    LEFT JOIN public.project_type_configs ptc ON ptc.company_id = c.id
    WHERE ptc.id IS NULL
  LOOP
    -- Seed project type configs
    INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
    VALUES
      (v_company.id, 'Residential', 'Homes & apartments', 'Home', '#3b82f6', true, 1),
      (v_company.id, 'Restaurant', 'Full-service dining', 'UtensilsCrossed', '#10b981', false, 2),
      (v_company.id, 'Cafe', 'Coffee & eateries', 'Coffee', '#f59e0b', false, 3),
      (v_company.id, 'Commercial Office', 'Office & retail', 'Building2', '#64748b', false, 4),
      (v_company.id, 'Industrial', 'Warehouse & factory', 'Factory', '#8b5cf6', false, 5);
  END LOOP;

  -- Find companies without any task_type_configs
  FOR v_company IN
    SELECT c.id
    FROM public.companies c
    LEFT JOIN public.task_type_configs ttc ON ttc.company_id = c.id
    WHERE ttc.id IS NULL
  LOOP
    -- Seed task type configs
    INSERT INTO public.task_type_configs (company_id, name, description, icon_name, color, is_default)
    VALUES
      (v_company.id, 'Work', 'Standard labor and construction tasks', 'Hammer', '#3b82f6', true),
      (v_company.id, 'Purchase', 'Materials, equipment, and supplies', 'ShoppingCart', '#10b981', false),
      (v_company.id, 'Approval', 'Permits, sign-offs, and inspections', 'ClipboardCheck', '#f59e0b', false),
      (v_company.id, 'Admin', 'Administrative and overhead tasks', 'FileText', '#64748b', false);
  END LOOP;
END $$;
