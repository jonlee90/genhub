-- Migration: 039_seed_default_templates
-- Description: Seed default project/task type configs and templates, and create trigger for new companies
-- This migration creates a function that seeds all default templates and applies it to existing companies

-- Create function to seed company templates
CREATE OR REPLACE FUNCTION public.seed_company_templates(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_residential_id uuid;
  v_restaurant_id uuid;
  v_commercial_id uuid;
  v_industrial_id uuid;
  v_phase_id uuid;
BEGIN
  -- Insert default project type configs
  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (p_company_id, 'Residential', 'Residential construction projects', 'Home', '#3B82F6', true, 0),
    (p_company_id, 'Restaurant/Cafe', 'Restaurant and cafe construction projects', 'UtensilsCrossed', '#10B981', false, 1),
    (p_company_id, 'Commercial Office', 'Commercial office construction projects', 'Building2', '#F59E0B', false, 2),
    (p_company_id, 'Industrial', 'Industrial construction projects', 'Factory', '#8B5CF6', false, 3)
  ON CONFLICT (company_id, name) DO NOTHING
  RETURNING id INTO v_residential_id;

  -- Get IDs for each project type
  SELECT id INTO v_residential_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Residential';
  SELECT id INTO v_restaurant_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Restaurant/Cafe';
  SELECT id INTO v_commercial_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Commercial Office';
  SELECT id INTO v_industrial_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Industrial';

  -- Insert default task type configs
  INSERT INTO public.task_type_configs (company_id, name, description, color, icon_name, is_default)
  VALUES
    (p_company_id, 'Work', 'Physical construction work tasks', '#3B82F6', 'Hammer', true),
    (p_company_id, 'Purchase', 'Material and equipment procurement tasks', '#10B981', 'ShoppingCart', false),
    (p_company_id, 'Approval', 'Tasks requiring client or authority approval', '#F59E0B', 'CheckCircle', false),
    (p_company_id, 'Admin', 'Administrative and documentation tasks', '#8B5CF6', 'FileText', false)
  ON CONFLICT (company_id, name) DO NOTHING;

  -- Residential project phases
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, order_index)
  VALUES
    (p_company_id, v_residential_id, 'Initiation', 'Project kickoff and initial planning', 0),
    (p_company_id, v_residential_id, 'Pre-construction', 'Planning and preparation before construction begins', 1),
    (p_company_id, v_residential_id, 'Procurement', 'Material and equipment procurement', 2),
    (p_company_id, v_residential_id, 'Construction', 'Active construction phase', 3),
    (p_company_id, v_residential_id, 'Post-construction', 'Final inspections and project closeout', 4)
  ON CONFLICT (project_type_config_id, name) DO NOTHING;

  -- Residential > Initiation tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_residential_id AND name = 'Initiation';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Site Assessment', 0),
    (p_company_id, v_phase_id, 'Preliminary Estimating', 1),
    (p_company_id, v_phase_id, 'Proposal Submission', 2),
    (p_company_id, v_phase_id, 'Sign Prime Contract', 3),
    (p_company_id, v_phase_id, 'Concept Design', 4)
  ON CONFLICT DO NOTHING;

  -- Residential > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_residential_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Utility Setup', 1),
    (p_company_id, v_phase_id, 'Site Logistics', 2),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 3)
  ON CONFLICT DO NOTHING;

  -- Residential > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_residential_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Material Takeoffs', 0),
    (p_company_id, v_phase_id, 'Purchase Orders', 1)
  ON CONFLICT DO NOTHING;

  -- Residential > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_residential_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Foundation Inspection', 0),
    (p_company_id, v_phase_id, 'Framing Walkthrough with Client', 1),
    (p_company_id, v_phase_id, 'Insulation & Drywall Inspection', 2),
    (p_company_id, v_phase_id, 'Quality Control Checks', 3),
    (p_company_id, v_phase_id, 'Inspection Coordination', 4)
  ON CONFLICT DO NOTHING;

  -- Residential > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_residential_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, '"Blue Tape" Walkthrough', 0),
    (p_company_id, v_phase_id, 'Final Cleaning', 1),
    (p_company_id, v_phase_id, 'Demobilization', 2),
    (p_company_id, v_phase_id, 'Certificate of Occupancy', 3)
  ON CONFLICT DO NOTHING;

  -- Restaurant/Cafe project phases
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, order_index)
  VALUES
    (p_company_id, v_restaurant_id, 'Initiation', 'Project kickoff and initial planning', 0),
    (p_company_id, v_restaurant_id, 'Pre-construction', 'Planning and preparation before construction begins', 1),
    (p_company_id, v_restaurant_id, 'Procurement', 'Material and equipment procurement', 2),
    (p_company_id, v_restaurant_id, 'Construction', 'Active construction phase', 3),
    (p_company_id, v_restaurant_id, 'Post-construction', 'Final inspections and project closeout', 4)
  ON CONFLICT (project_type_config_id, name) DO NOTHING;

  -- Restaurant > Initiation tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Initiation';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Site Assessment', 0),
    (p_company_id, v_phase_id, 'Preliminary Estimating', 1),
    (p_company_id, v_phase_id, 'Proposal Submission', 2),
    (p_company_id, v_phase_id, 'Sign Prime Contract', 3),
    (p_company_id, v_phase_id, 'Concept Design', 4)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Health Dept Review', 1),
    (p_company_id, v_phase_id, 'Utility Setup', 2),
    (p_company_id, v_phase_id, 'Site Logistics', 3),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 4)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Kitchen Equipment', 0),
    (p_company_id, v_phase_id, 'Order Light Fixtures & Furniture', 1),
    (p_company_id, v_phase_id, 'Award MEP Subcontractors', 2)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Under-Slab Plumbing Inspection', 0),
    (p_company_id, v_phase_id, 'Kitchen Wall Cover Inspection', 1),
    (p_company_id, v_phase_id, 'Quality Control Checks', 2),
    (p_company_id, v_phase_id, 'Inspection Coordination', 3)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Equipment Commissioning', 0),
    (p_company_id, v_phase_id, 'Health Sign-off', 1),
    (p_company_id, v_phase_id, 'Final Fire Inspection', 2)
  ON CONFLICT DO NOTHING;

  -- Commercial Office project phases
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, order_index)
  VALUES
    (p_company_id, v_commercial_id, 'Initiation', 'Project kickoff and initial planning', 0),
    (p_company_id, v_commercial_id, 'Pre-construction', 'Planning and preparation before construction begins', 1),
    (p_company_id, v_commercial_id, 'Procurement', 'Material and equipment procurement', 2),
    (p_company_id, v_commercial_id, 'Construction', 'Active construction phase', 3),
    (p_company_id, v_commercial_id, 'Post-construction', 'Final inspections and project closeout', 4)
  ON CONFLICT (project_type_config_id, name) DO NOTHING;

  -- Commercial > Initiation tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_commercial_id AND name = 'Initiation';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Site Assessment', 0),
    (p_company_id, v_phase_id, 'Preliminary Estimating', 1),
    (p_company_id, v_phase_id, 'Proposal Submission', 2),
    (p_company_id, v_phase_id, 'Sign Prime Contract', 3),
    (p_company_id, v_phase_id, 'Concept Design', 4)
  ON CONFLICT DO NOTHING;

  -- Commercial > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_commercial_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Health Dept Review', 1),
    (p_company_id, v_phase_id, 'Utility Setup', 2),
    (p_company_id, v_phase_id, 'Site Logistics', 3),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 4)
  ON CONFLICT DO NOTHING;

  -- Commercial > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_commercial_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Order Light Fixtures & Furniture', 0),
    (p_company_id, v_phase_id, 'Award MEP Subcontractors', 1)
  ON CONFLICT DO NOTHING;

  -- Commercial > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_commercial_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Framing & Glazing', 0),
    (p_company_id, v_phase_id, 'MEP Modifications', 1),
    (p_company_id, v_phase_id, 'Quality Control Checks', 2),
    (p_company_id, v_phase_id, 'Inspection Coordination', 3)
  ON CONFLICT DO NOTHING;

  -- Commercial > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_commercial_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Equipment Commissioning', 0),
    (p_company_id, v_phase_id, 'Final Cleaning', 1)
  ON CONFLICT DO NOTHING;

  -- Industrial project phases
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, order_index)
  VALUES
    (p_company_id, v_industrial_id, 'Initiation', 'Project kickoff and initial planning', 0),
    (p_company_id, v_industrial_id, 'Pre-construction', 'Planning and preparation before construction begins', 1),
    (p_company_id, v_industrial_id, 'Procurement', 'Material and equipment procurement', 2),
    (p_company_id, v_industrial_id, 'Construction', 'Active construction phase', 3),
    (p_company_id, v_industrial_id, 'Post-construction', 'Final inspections and project closeout', 4)
  ON CONFLICT (project_type_config_id, name) DO NOTHING;

  -- Industrial > Initiation tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_industrial_id AND name = 'Initiation';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Site Assessment', 0),
    (p_company_id, v_phase_id, 'Soil Report Review', 1),
    (p_company_id, v_phase_id, 'Preliminary Estimating', 2),
    (p_company_id, v_phase_id, 'Proposal Submission', 3),
    (p_company_id, v_phase_id, 'Sign Prime Contract', 4),
    (p_company_id, v_phase_id, 'Concept Design', 5)
  ON CONFLICT DO NOTHING;

  -- Industrial > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_industrial_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Utility Setup', 1),
    (p_company_id, v_phase_id, 'Site Logistics', 2),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 3)
  ON CONFLICT DO NOTHING;

  -- Industrial > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_industrial_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Order Dock Equipment', 0),
    (p_company_id, v_phase_id, 'Order Fire Sprinkler Pump/System', 1)
  ON CONFLICT DO NOTHING;

  -- Industrial > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_industrial_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Manage Mass Grading & Excavation', 0),
    (p_company_id, v_phase_id, 'Foundation/Slab Pour', 1),
    (p_company_id, v_phase_id, 'Quality Control Checks', 2),
    (p_company_id, v_phase_id, 'Inspection Coordination', 3)
  ON CONFLICT DO NOTHING;

  -- Industrial > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_industrial_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Fire Marshall System Test', 0),
    (p_company_id, v_phase_id, 'Flush & Pressure Test Water Lines', 1),
    (p_company_id, v_phase_id, 'Final Cleaning', 2)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create trigger to automatically seed templates for new companies
CREATE OR REPLACE FUNCTION public.on_company_created_seed_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_company_templates(NEW.id);
  RETURN NEW;
END;
$$;

-- Attach trigger to companies table
DROP TRIGGER IF EXISTS trigger_seed_templates_on_company_created ON public.companies;
CREATE TRIGGER trigger_seed_templates_on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.on_company_created_seed_templates();

-- Seed all existing companies
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM public.companies LOOP
    PERFORM public.seed_company_templates(company_record.id);
  END LOOP;
END $$;

-- Add comment
COMMENT ON FUNCTION public.seed_company_templates IS
  'Seeds default project types, task types, phase templates, and task templates for a company. Called automatically when a new company is created.';
