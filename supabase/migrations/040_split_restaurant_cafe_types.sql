-- Migration: 040_split_restaurant_cafe_types
-- Description: Split "Restaurant/Cafe" into two separate project types: "Restaurant" and "Cafe"
-- This migration updates the seeding function and migrates existing data

-- ============================================================================
-- PART 1: Update the seeding function to create separate Restaurant and Cafe types
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_company_templates(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_residential_id uuid;
  v_restaurant_id uuid;
  v_cafe_id uuid;
  v_commercial_id uuid;
  v_industrial_id uuid;
  v_phase_id uuid;
BEGIN
  -- Insert default project type configs (now with separate Restaurant and Cafe)
  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (p_company_id, 'Residential', 'Residential construction projects', 'Home', '#3B82F6', true, 0),
    (p_company_id, 'Restaurant', 'Restaurant construction projects', 'UtensilsCrossed', '#10B981', false, 1),
    (p_company_id, 'Cafe', 'Cafe and coffee shop construction projects', 'Coffee', '#F59E0B', false, 2),
    (p_company_id, 'Commercial Office', 'Commercial office construction projects', 'Building2', '#8B5CF6', false, 3),
    (p_company_id, 'Industrial', 'Industrial construction projects', 'Factory', '#6366F1', false, 4)
  ON CONFLICT (company_id, name) DO NOTHING;

  -- Get IDs for each project type
  SELECT id INTO v_residential_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Residential';
  SELECT id INTO v_restaurant_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Restaurant';
  SELECT id INTO v_cafe_id FROM public.project_type_configs WHERE company_id = p_company_id AND name = 'Cafe';
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

  -- ============================================================================
  -- RESIDENTIAL PROJECT PHASES AND TASKS
  -- ============================================================================

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

  -- ============================================================================
  -- RESTAURANT PROJECT PHASES AND TASKS
  -- ============================================================================

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
    (p_company_id, v_phase_id, 'Concept Design', 4),
    (p_company_id, v_phase_id, 'Menu & Kitchen Layout Planning', 5)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Health Department Review', 1),
    (p_company_id, v_phase_id, 'Fire Code Compliance Review', 2),
    (p_company_id, v_phase_id, 'Utility Setup', 3),
    (p_company_id, v_phase_id, 'Grease Trap Installation Planning', 4),
    (p_company_id, v_phase_id, 'Site Logistics', 5),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 6)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Commercial Kitchen Equipment', 0),
    (p_company_id, v_phase_id, 'Refrigeration Units', 1),
    (p_company_id, v_phase_id, 'Cooking Ranges & Ovens', 2),
    (p_company_id, v_phase_id, 'Ventilation Hood System', 3),
    (p_company_id, v_phase_id, 'Dining Furniture & Fixtures', 4),
    (p_company_id, v_phase_id, 'Order Light Fixtures', 5),
    (p_company_id, v_phase_id, 'Award MEP Subcontractors', 6)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Under-Slab Plumbing Inspection', 0),
    (p_company_id, v_phase_id, 'Grease Trap Installation', 1),
    (p_company_id, v_phase_id, 'Kitchen Wall Cover Inspection', 2),
    (p_company_id, v_phase_id, 'Hood & Fire Suppression Install', 3),
    (p_company_id, v_phase_id, 'Walk-in Cooler Assembly', 4),
    (p_company_id, v_phase_id, 'Quality Control Checks', 5),
    (p_company_id, v_phase_id, 'Inspection Coordination', 6)
  ON CONFLICT DO NOTHING;

  -- Restaurant > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_restaurant_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Equipment Commissioning', 0),
    (p_company_id, v_phase_id, 'Health Department Sign-off', 1),
    (p_company_id, v_phase_id, 'Final Fire Inspection', 2),
    (p_company_id, v_phase_id, 'Kitchen Equipment Training', 3),
    (p_company_id, v_phase_id, 'Final Cleaning & Sanitization', 4)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- CAFE PROJECT PHASES AND TASKS
  -- ============================================================================

  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, order_index)
  VALUES
    (p_company_id, v_cafe_id, 'Initiation', 'Project kickoff and initial planning', 0),
    (p_company_id, v_cafe_id, 'Pre-construction', 'Planning and preparation before construction begins', 1),
    (p_company_id, v_cafe_id, 'Procurement', 'Material and equipment procurement', 2),
    (p_company_id, v_cafe_id, 'Construction', 'Active construction phase', 3),
    (p_company_id, v_cafe_id, 'Post-construction', 'Final inspections and project closeout', 4)
  ON CONFLICT (project_type_config_id, name) DO NOTHING;

  -- Cafe > Initiation tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_cafe_id AND name = 'Initiation';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Site Assessment', 0),
    (p_company_id, v_phase_id, 'Preliminary Estimating', 1),
    (p_company_id, v_phase_id, 'Proposal Submission', 2),
    (p_company_id, v_phase_id, 'Sign Prime Contract', 3),
    (p_company_id, v_phase_id, 'Concept Design', 4),
    (p_company_id, v_phase_id, 'Coffee Bar Layout Planning', 5)
  ON CONFLICT DO NOTHING;

  -- Cafe > Pre-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_cafe_id AND name = 'Pre-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Permitting', 0),
    (p_company_id, v_phase_id, 'Health Department Review', 1),
    (p_company_id, v_phase_id, 'Utility Setup', 2),
    (p_company_id, v_phase_id, 'Water Line Upgrades', 3),
    (p_company_id, v_phase_id, 'Site Logistics', 4),
    (p_company_id, v_phase_id, 'Create Construction Schedule', 5)
  ON CONFLICT DO NOTHING;

  -- Cafe > Procurement tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_cafe_id AND name = 'Procurement';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Espresso Machine & Grinder', 0),
    (p_company_id, v_phase_id, 'Coffee Brewing Equipment', 1),
    (p_company_id, v_phase_id, 'Refrigerated Display Case', 2),
    (p_company_id, v_phase_id, 'Pastry Display & Storage', 3),
    (p_company_id, v_phase_id, 'Seating & Furniture', 4),
    (p_company_id, v_phase_id, 'Light Fixtures & Decor', 5),
    (p_company_id, v_phase_id, 'Award MEP Subcontractors', 6)
  ON CONFLICT DO NOTHING;

  -- Cafe > Construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_cafe_id AND name = 'Construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Coffee Bar Plumbing Rough-in', 0),
    (p_company_id, v_phase_id, 'Electrical for Espresso Equipment', 1),
    (p_company_id, v_phase_id, 'Countertop & Backsplash Install', 2),
    (p_company_id, v_phase_id, 'Seating Area Buildout', 3),
    (p_company_id, v_phase_id, 'Quality Control Checks', 4),
    (p_company_id, v_phase_id, 'Inspection Coordination', 5)
  ON CONFLICT DO NOTHING;

  -- Cafe > Post-construction tasks
  SELECT id INTO v_phase_id FROM public.phase_templates WHERE project_type_config_id = v_cafe_id AND name = 'Post-construction';
  INSERT INTO public.task_templates (company_id, phase_template_id, title, order_index)
  VALUES
    (p_company_id, v_phase_id, 'Espresso Machine Installation', 0),
    (p_company_id, v_phase_id, 'Equipment Commissioning', 1),
    (p_company_id, v_phase_id, 'Health Department Sign-off', 2),
    (p_company_id, v_phase_id, 'Barista Equipment Training', 3),
    (p_company_id, v_phase_id, 'Final Cleaning', 4)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- COMMERCIAL OFFICE PROJECT PHASES AND TASKS
  -- ============================================================================

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

  -- ============================================================================
  -- INDUSTRIAL PROJECT PHASES AND TASKS
  -- ============================================================================

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

-- ============================================================================
-- PART 2: Migrate existing "Restaurant/Cafe" records to separate types
-- ============================================================================

DO $$
DECLARE
  company_record RECORD;
  old_type_id UUID;
  new_cafe_id UUID;
  phase_record RECORD;
  task_record RECORD;
  new_phase_id UUID;
BEGIN
  RAISE NOTICE 'Starting migration of Restaurant/Cafe project types...';

  -- Loop through each company that has "Restaurant/Cafe"
  FOR company_record IN
    SELECT DISTINCT company_id
    FROM project_type_configs
    WHERE name = 'Restaurant/Cafe'
  LOOP
    RAISE NOTICE 'Processing company: %', company_record.company_id;

    -- Get the old "Restaurant/Cafe" type ID
    SELECT id INTO old_type_id
    FROM project_type_configs
    WHERE company_id = company_record.company_id
      AND name = 'Restaurant/Cafe';

    -- Update existing "Restaurant/Cafe" to "Restaurant"
    UPDATE project_type_configs
    SET
      name = 'Restaurant',
      description = 'Restaurant construction projects',
      icon_name = 'UtensilsCrossed',
      color = '#10B981',
      order_index = 1,
      updated_at = now()
    WHERE id = old_type_id;

    RAISE NOTICE 'Updated Restaurant/Cafe (%) to Restaurant', old_type_id;

    -- Create new "Cafe" project type
    INSERT INTO project_type_configs (
      company_id,
      name,
      description,
      icon_name,
      color,
      is_default,
      order_index,
      is_active
    )
    VALUES (
      company_record.company_id,
      'Cafe',
      'Cafe and coffee shop construction projects',
      'Coffee',
      '#F59E0B',
      false,
      2,
      true
    )
    RETURNING id INTO new_cafe_id;

    RAISE NOTICE 'Created new Cafe type: %', new_cafe_id;

    -- Duplicate phase templates for Cafe
    FOR phase_record IN
      SELECT * FROM phase_templates
      WHERE project_type_config_id = old_type_id
      ORDER BY order_index
    LOOP
      INSERT INTO phase_templates (
        company_id,
        project_type_config_id,
        name,
        description,
        order_index,
        is_active
      )
      VALUES (
        phase_record.company_id,
        new_cafe_id,
        phase_record.name,
        phase_record.description,
        phase_record.order_index,
        phase_record.is_active
      )
      RETURNING id INTO new_phase_id;

      -- Duplicate task templates for this phase
      FOR task_record IN
        SELECT * FROM task_templates
        WHERE phase_template_id = phase_record.id
        ORDER BY order_index
      LOOP
        INSERT INTO task_templates (
          company_id,
          phase_template_id,
          title,
          description,
          default_task_type,
          default_priority,
          order_index,
          is_active
        )
        VALUES (
          task_record.company_id,
          new_phase_id,
          task_record.title,
          task_record.description,
          task_record.default_task_type,
          task_record.default_priority,
          task_record.order_index,
          task_record.is_active
        );
      END LOOP;

      RAISE NOTICE 'Duplicated phase % with tasks', phase_record.name;
    END LOOP;

    -- Update order_index for other project types in this company
    UPDATE project_type_configs
    SET order_index = 3, updated_at = now()
    WHERE company_id = company_record.company_id
      AND name = 'Commercial Office';

    UPDATE project_type_configs
    SET order_index = 4, updated_at = now()
    WHERE company_id = company_record.company_id
      AND name = 'Industrial';

    RAISE NOTICE 'Updated order indices for Commercial Office and Industrial';

  END LOOP;

  RAISE NOTICE 'Migration complete!';
END $$;

-- ============================================================================
-- PART 3: Add comment to the updated function
-- ============================================================================

COMMENT ON FUNCTION public.seed_company_templates IS
  'Seeds default project types (Residential, Restaurant, Cafe, Commercial Office, Industrial), task types, phase templates, and task templates for a company. Called automatically when a new company is created.';
