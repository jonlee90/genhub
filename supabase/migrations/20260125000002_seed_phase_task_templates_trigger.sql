-- Migration: Seed phase and task templates for all project types
-- Author: backend-engineer
-- Date: 2026-01-25
-- Purpose: Auto-seed phase and task templates when company is created, and copy icon_name on project creation

-- ============================================
-- 1. Update seed_default_configs_for_company to include phase/task templates
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_default_configs_for_company()
RETURNS TRIGGER AS $$
DECLARE
  v_residential_id uuid;
  v_restaurant_id uuid;
  v_cafe_id uuid;
  v_commercial_id uuid;
  v_industrial_id uuid;
  v_phase_id uuid;
BEGIN
  -- Seed project type configs and capture IDs
  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Residential', 'Homes & apartments', 'Home', '#3b82f6', true, 1)
  RETURNING id INTO v_residential_id;

  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Restaurant', 'Full-service dining', 'UtensilsCrossed', '#10b981', false, 2)
  RETURNING id INTO v_restaurant_id;

  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Cafe', 'Coffee & eateries', 'Coffee', '#f59e0b', false, 3)
  RETURNING id INTO v_cafe_id;

  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Commercial Office', 'Office & retail', 'Building2', '#64748b', false, 4)
  RETURNING id INTO v_commercial_id;

  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Industrial', 'Warehouse & factory', 'Factory', '#8b5cf6', false, 5)
  RETURNING id INTO v_industrial_id;

  -- Seed task type configs
  INSERT INTO public.task_type_configs (company_id, name, description, icon_name, color, is_default)
  VALUES
    (NEW.id, 'Work', 'Standard labor and construction tasks', 'Hammer', '#3b82f6', true),
    (NEW.id, 'Purchase', 'Materials, equipment, and supplies', 'ShoppingCart', '#10b981', false),
    (NEW.id, 'Approval', 'Permits, sign-offs, and inspections', 'ClipboardCheck', '#f59e0b', false),
    (NEW.id, 'Admin', 'Administrative and overhead tasks', 'FileText', '#64748b', false);

  -- ============================================
  -- RESIDENTIAL TEMPLATES
  -- ============================================

  -- Phase 1: Site set up
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_residential_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Site survey', 'Conduct initial site assessment', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Permits application', 'Submit permit applications', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Site preparation', 'Clear and prepare site', 'work', 'high', 3);

  -- Phase 2: Framing
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_residential_id, 'Framing', 'Structural framing work', 'Layers', 2)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Foundation', 'Pour foundation and footings', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Roof framing', 'Install roof structure', 'work', 'high', 3);

  -- Phase 3: MEP Rough In
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_residential_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Electrical rough-in', 'Install electrical wiring', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Plumbing rough-in', 'Install plumbing systems', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'HVAC installation', 'Install HVAC systems', 'work', 'medium', 3);

  -- Phase 4: Fire life and safety
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_residential_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Smoke detectors', 'Install smoke detection systems', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 3);

  -- Phase 5: Finishes
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_residential_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Drywall and painting', 'Install and finish drywall', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Flooring', 'Install final flooring', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
    (NEW.id, v_phase_id, 'Punch list', 'Complete remaining items', 'work', 'medium', 4);

  -- ============================================
  -- RESTAURANT TEMPLATES
  -- ============================================

  -- Phase 1: Site set up
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_restaurant_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Site survey', 'Assess restaurant space', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Health permits', 'Apply for food service permits', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Demolition', 'Remove existing fixtures', 'work', 'high', 3);

  -- Phase 2: Framing
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_restaurant_id, 'Framing', 'Structural framing work', 'Layers', 2)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Kitchen layout', 'Build kitchen structure', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Ceiling work', 'Install ceiling structure', 'work', 'medium', 3);

  -- Phase 3: MEP Rough In
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_restaurant_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Plumbing rough-in', 'Install kitchen plumbing', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Electrical rough-in', 'Install electrical systems', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Grease trap', 'Install grease trap system', 'work', 'high', 3),
    (NEW.id, v_phase_id, 'Ventilation system', 'Install hood and exhaust', 'work', 'high', 4);

  -- Phase 4: Fire life and safety
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_restaurant_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Fire suppression', 'Install fire suppression system', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Fire inspection', 'Pass fire safety inspection', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Emergency exits', 'Install emergency exit systems', 'work', 'high', 3);

  -- Phase 5: Finishes
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_restaurant_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Kitchen equipment', 'Install commercial kitchen equipment', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Dining finishes', 'Complete dining area finishes', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Health inspection', 'Pass health department inspection', 'approval', 'high', 3),
    (NEW.id, v_phase_id, 'Final walkthrough', 'Complete final walkthrough', 'admin', 'medium', 4);

  -- ============================================
  -- CAFE TEMPLATES
  -- ============================================

  -- Phase 1: Site set up
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_cafe_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Site survey', 'Assess cafe space', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Permits application', 'Apply for health and building permits', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Site preparation', 'Clear and prepare space', 'work', 'high', 3);

  -- Phase 2: Framing
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_cafe_id, 'Framing', 'Structural framing work', 'Layers', 2)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Bar counter', 'Build espresso bar counter', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Display cases', 'Install display case structures', 'work', 'medium', 3);

  -- Phase 3: MEP Rough In
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_cafe_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Plumbing rough-in', 'Install water and drainage systems', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Electrical rough-in', 'Install electrical wiring', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Ventilation', 'Install ventilation systems', 'work', 'medium', 3);

  -- Phase 4: Fire life and safety
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_cafe_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Emergency systems', 'Install emergency lighting and exits', 'work', 'medium', 3);

  -- Phase 5: Finishes
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_cafe_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Espresso equipment', 'Install espresso machines and grinders', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Interior finishes', 'Complete flooring, painting, fixtures', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Health inspection', 'Pass health department inspection', 'approval', 'high', 3),
    (NEW.id, v_phase_id, 'Final walkthrough', 'Complete final walkthrough', 'admin', 'medium', 4);

  -- ============================================
  -- COMMERCIAL OFFICE TEMPLATES
  -- ============================================

  -- Phase 1: Site set up
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_commercial_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Site survey', 'Assess office space', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Permits application', 'Submit building permits', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Space planning', 'Finalize office layout', 'admin', 'high', 3);

  -- Phase 2: Framing
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_commercial_id, 'Framing', 'Structural framing work', 'Layers', 2)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Partition walls', 'Frame office partitions', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Door frames', 'Install door frames', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Conference rooms', 'Build conference room structures', 'work', 'medium', 3);

  -- Phase 3: MEP Rough In
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_commercial_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Data cabling', 'Install network and data cabling', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Electrical rough-in', 'Install electrical systems', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'HVAC zoning', 'Install HVAC zone controls', 'work', 'medium', 3);

  -- Phase 4: Fire life and safety
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_commercial_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Fire alarm system', 'Install fire alarm system', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Sprinkler system', 'Install sprinkler system', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'ADA compliance', 'Verify ADA compliance', 'approval', 'high', 3);

  -- Phase 5: Finishes
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_commercial_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Drywall and painting', 'Install and finish drywall', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Flooring', 'Install final flooring', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
    (NEW.id, v_phase_id, 'Move-in ready', 'Prepare for tenant move-in', 'admin', 'medium', 4);

  -- ============================================
  -- INDUSTRIAL TEMPLATES
  -- ============================================

  -- Phase 1: Site set up
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_industrial_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Site survey', 'Assess industrial facility', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Safety permits', 'Apply for industrial permits', 'approval', 'high', 2),
    (NEW.id, v_phase_id, 'Site preparation', 'Prepare industrial site', 'work', 'high', 3);

  -- Phase 2: Framing
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_industrial_id, 'Framing', 'Structural framing work', 'Layers', 2)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Steel framing', 'Install steel structure', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Loading dock', 'Build loading dock structure', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Crane supports', 'Install crane support systems', 'work', 'high', 3);

  -- Phase 3: MEP Rough In
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_industrial_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Heavy electrical', 'Install industrial electrical systems', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Industrial plumbing', 'Install industrial plumbing', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'HVAC systems', 'Install industrial HVAC', 'work', 'medium', 3);

  -- Phase 4: Fire life and safety
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_industrial_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Safety systems', 'Install industrial safety systems', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 3);

  -- Phase 5: Finishes
  INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
  VALUES (NEW.id, v_industrial_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
  RETURNING id INTO v_phase_id;

  INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
  VALUES
    (NEW.id, v_phase_id, 'Equipment installation', 'Install industrial equipment', 'work', 'high', 1),
    (NEW.id, v_phase_id, 'Facility finishes', 'Complete facility finishes', 'work', 'high', 2),
    (NEW.id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
    (NEW.id, v_phase_id, 'Operational readiness', 'Prepare for operations', 'admin', 'medium', 4);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- 2. Update create_phases_and_tasks_from_templates to copy icon_name
-- ============================================
CREATE OR REPLACE FUNCTION public.create_phases_and_tasks_from_templates()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_template RECORD;
  v_task_template RECORD;
  v_new_phase_id uuid;
  v_company_id uuid;
  v_project_start_date date;
  v_is_first_phase boolean := true;
  v_phase_status public.phase_status;
BEGIN
  v_company_id := NEW.company_id;
  v_project_start_date := NEW.start_date;

  IF NEW.project_type_config_id IS NULL THEN
    INSERT INTO public.project_phases (project_id, name, order_index, status)
    VALUES
      (NEW.id, 'Initiation', 1, 'in_progress'::public.phase_status),
      (NEW.id, 'Pre-Construction', 2, 'not_started'::public.phase_status),
      (NEW.id, 'Procurement', 3, 'not_started'::public.phase_status),
      (NEW.id, 'Construction', 4, 'not_started'::public.phase_status),
      (NEW.id, 'Post-Construction', 5, 'not_started'::public.phase_status);

    RETURN NEW;
  END IF;

  FOR v_phase_template IN
    SELECT *
    FROM public.phase_templates
    WHERE project_type_config_id = NEW.project_type_config_id
      AND company_id = v_company_id
      AND is_active = true
    ORDER BY order_index ASC
  LOOP
    IF v_is_first_phase THEN
      v_phase_status := 'in_progress'::public.phase_status;
      v_is_first_phase := false;
    ELSE
      v_phase_status := 'not_started'::public.phase_status;
    END IF;

    -- Copy icon_name from template
    INSERT INTO public.project_phases (
      project_id,
      name,
      order_index,
      status,
      notes,
      icon_name
    )
    VALUES (
      NEW.id,
      v_phase_template.name,
      v_phase_template.order_index,
      v_phase_status,
      v_phase_template.description,
      v_phase_template.icon_name
    )
    RETURNING id INTO v_new_phase_id;

    FOR v_task_template IN
      SELECT *
      FROM public.task_templates
      WHERE phase_template_id = v_phase_template.id
        AND company_id = v_company_id
        AND is_active = true
      ORDER BY order_index ASC
    LOOP
      INSERT INTO public.tasks (
        project_id,
        phase_id,
        title,
        description,
        task_type,
        status,
        priority,
        due_date,
        created_by
      )
      VALUES (
        NEW.id,
        v_new_phase_id,
        v_task_template.title,
        v_task_template.description,
        COALESCE(v_task_template.default_task_type, 'work'),
        'todo'::public.task_status,
        COALESCE(v_task_template.default_priority, 'medium')::public.task_priority,
        CASE
          WHEN v_project_start_date IS NOT NULL AND v_task_template.days_offset IS NOT NULL
          THEN v_project_start_date + (v_task_template.days_offset || ' days')::interval
          ELSE NULL
        END,
        NEW.created_by
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON FUNCTION public.seed_default_configs_for_company() IS
  'Seeds project types, task types, and phase/task templates with icons for all 5 project types';

COMMENT ON FUNCTION public.create_phases_and_tasks_from_templates() IS
  'Creates phases and tasks from templates, copying icon_name to project_phases';
