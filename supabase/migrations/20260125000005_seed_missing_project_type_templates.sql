-- Migration: Seed phase templates for project types that don't have templates yet
-- Author: backend-engineer
-- Date: 2026-01-25
-- Purpose: Add templates for project types that exist but have no phase templates
--          (handles case where company has templates for SOME types but not ALL)

DO $$
DECLARE
  v_config RECORD;
  v_phase_id uuid;
BEGIN
  -- Find project_type_configs that have no phase_templates
  FOR v_config IN
    SELECT ptc.id as config_id, ptc.company_id, ptc.name as project_type_name
    FROM public.project_type_configs ptc
    LEFT JOIN public.phase_templates pt ON pt.project_type_config_id = ptc.id
    WHERE pt.id IS NULL
  LOOP
    RAISE NOTICE 'Seeding templates for % - %', v_config.company_id, v_config.project_type_name;

    -- RESIDENTIAL
    IF v_config.project_type_name = 'Residential' THEN
      -- Phase 1: Site set up
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Site survey', 'Conduct initial site assessment', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Permits application', 'Submit permit applications', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Site preparation', 'Clear and prepare site', 'work', 'high', 3);

      -- Phase 2: Framing
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Framing', 'Structural framing work', 'Layers', 2)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Foundation', 'Pour foundation and footings', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Roof framing', 'Install roof structure', 'work', 'high', 3);

      -- Phase 3: MEP Rough In
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Electrical rough-in', 'Install electrical wiring', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Plumbing rough-in', 'Install plumbing systems', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'HVAC installation', 'Install HVAC systems', 'work', 'medium', 3);

      -- Phase 4: Fire life and safety
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Smoke detectors', 'Install smoke detection systems', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 3);

      -- Phase 5: Finishes
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Drywall and painting', 'Install and finish drywall', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Flooring', 'Install final flooring', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
        (v_config.company_id, v_phase_id, 'Punch list', 'Complete remaining items', 'work', 'medium', 4);
    END IF;

    -- RESTAURANT
    IF v_config.project_type_name = 'Restaurant' THEN
      -- Phase 1: Site set up
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Site survey', 'Assess restaurant space', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Health permits', 'Apply for food service permits', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Demolition', 'Remove existing fixtures', 'work', 'high', 3);

      -- Phase 2: Framing
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Framing', 'Structural framing work', 'Layers', 2)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Kitchen layout', 'Build kitchen structure', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Ceiling work', 'Install ceiling structure', 'work', 'medium', 3);

      -- Phase 3: MEP Rough In
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Plumbing rough-in', 'Install kitchen plumbing', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Electrical rough-in', 'Install electrical systems', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Grease trap', 'Install grease trap system', 'work', 'high', 3),
        (v_config.company_id, v_phase_id, 'Ventilation system', 'Install hood and exhaust', 'work', 'high', 4);

      -- Phase 4: Fire life and safety
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Fire suppression', 'Install fire suppression system', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Fire inspection', 'Pass fire safety inspection', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Emergency exits', 'Install emergency exit systems', 'work', 'high', 3);

      -- Phase 5: Finishes
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Kitchen equipment', 'Install commercial kitchen equipment', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Dining finishes', 'Complete dining area finishes', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Health inspection', 'Pass health department inspection', 'approval', 'high', 3),
        (v_config.company_id, v_phase_id, 'Final walkthrough', 'Complete final walkthrough', 'admin', 'medium', 4);
    END IF;

    -- CAFE
    IF v_config.project_type_name = 'Cafe' THEN
      -- Phase 1: Site set up
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Site survey', 'Assess cafe space', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Permits application', 'Apply for health and building permits', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Site preparation', 'Clear and prepare space', 'work', 'high', 3);

      -- Phase 2: Framing
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Framing', 'Structural framing work', 'Layers', 2)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Wall framing', 'Frame walls and partitions', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Bar counter', 'Build espresso bar counter', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Display cases', 'Install display case structures', 'work', 'medium', 3);

      -- Phase 3: MEP Rough In
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Plumbing rough-in', 'Install water and drainage systems', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Electrical rough-in', 'Install electrical wiring', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Ventilation', 'Install ventilation systems', 'work', 'medium', 3);

      -- Phase 4: Fire life and safety
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Emergency systems', 'Install emergency lighting and exits', 'work', 'medium', 3);

      -- Phase 5: Finishes
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Espresso equipment', 'Install espresso machines and grinders', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Interior finishes', 'Complete flooring, painting, fixtures', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Health inspection', 'Pass health department inspection', 'approval', 'high', 3),
        (v_config.company_id, v_phase_id, 'Final walkthrough', 'Complete final walkthrough', 'admin', 'medium', 4);
    END IF;

    -- COMMERCIAL OFFICE
    IF v_config.project_type_name = 'Commercial Office' THEN
      -- Phase 1: Site set up
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Site survey', 'Assess office space', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Permits application', 'Submit building permits', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Space planning', 'Finalize office layout', 'admin', 'high', 3);

      -- Phase 2: Framing
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Framing', 'Structural framing work', 'Layers', 2)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Partition walls', 'Frame office partitions', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Door frames', 'Install door frames', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Conference rooms', 'Build conference room structures', 'work', 'medium', 3);

      -- Phase 3: MEP Rough In
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Data cabling', 'Install network and data cabling', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Electrical rough-in', 'Install electrical systems', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'HVAC zoning', 'Install HVAC zone controls', 'work', 'medium', 3);

      -- Phase 4: Fire life and safety
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Fire alarm system', 'Install fire alarm system', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Sprinkler system', 'Install sprinkler system', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'ADA compliance', 'Verify ADA compliance', 'approval', 'high', 3);

      -- Phase 5: Finishes
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Drywall and painting', 'Install and finish drywall', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Flooring', 'Install final flooring', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
        (v_config.company_id, v_phase_id, 'Move-in ready', 'Prepare for tenant move-in', 'admin', 'medium', 4);
    END IF;

    -- INDUSTRIAL
    IF v_config.project_type_name = 'Industrial' THEN
      -- Phase 1: Site set up
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Site set up', 'Initial site preparation and setup', 'ClipboardCheck', 1)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Site survey', 'Assess industrial facility', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Safety permits', 'Apply for industrial permits', 'approval', 'high', 2),
        (v_config.company_id, v_phase_id, 'Site preparation', 'Prepare industrial site', 'work', 'high', 3);

      -- Phase 2: Framing
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Framing', 'Structural framing work', 'Layers', 2)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Steel framing', 'Install steel structure', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Loading dock', 'Build loading dock structure', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Crane supports', 'Install crane support systems', 'work', 'high', 3);

      -- Phase 3: MEP Rough In
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'MEP Rough In', 'Mechanical, electrical, and plumbing rough-in', 'Wrench', 3)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Heavy electrical', 'Install industrial electrical systems', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Industrial plumbing', 'Install industrial plumbing', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'HVAC systems', 'Install industrial HVAC', 'work', 'medium', 3);

      -- Phase 4: Fire life and safety
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Fire life and safety', 'Fire protection and safety systems', 'HardHat', 4)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Safety systems', 'Install industrial safety systems', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Fire suppression', 'Install fire suppression systems', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Safety inspection', 'Complete safety inspections', 'approval', 'high', 3);

      -- Phase 5: Finishes
      INSERT INTO public.phase_templates (company_id, project_type_config_id, name, description, icon_name, order_index)
      VALUES (v_config.company_id, v_config.config_id, 'Finishes', 'Final finishes and closeout', 'Rocket', 5)
      RETURNING id INTO v_phase_id;

      INSERT INTO public.task_templates (company_id, phase_template_id, title, description, default_task_type, default_priority, order_index)
      VALUES
        (v_config.company_id, v_phase_id, 'Equipment installation', 'Install industrial equipment', 'work', 'high', 1),
        (v_config.company_id, v_phase_id, 'Facility finishes', 'Complete facility finishes', 'work', 'high', 2),
        (v_config.company_id, v_phase_id, 'Final inspection', 'Complete final inspections', 'approval', 'high', 3),
        (v_config.company_id, v_phase_id, 'Operational readiness', 'Prepare for operations', 'admin', 'medium', 4);
    END IF;

  END LOOP;

  RAISE NOTICE 'Missing project type templates seeded successfully';
END $$;
