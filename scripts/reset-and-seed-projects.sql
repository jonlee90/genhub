-- ============================================================================
-- RESET AND SEED PROJECTS
-- Description: Delete all existing project data and create 10 realistic projects
-- Created: 2026-01-02
-- ============================================================================

-- This script will:
-- 1. Delete all existing projects, phases, tasks, and related data (cascades)
-- 2. Create 10 new realistic construction projects (2 per project type)
-- 3. Create phases for each project based on templates
-- 4. Create tasks for each phase based on templates
-- 5. Link projects to default 3D models

BEGIN;

-- ============================================================================
-- STEP 1: DELETE ALL EXISTING PROJECT DATA
-- ============================================================================

-- Due to CASCADE constraints, deleting projects will automatically delete:
-- - project_phases
-- - tasks
-- - task_dependencies
-- - project_team
-- - projects_3d_models
-- - spatial_markers
-- - marker_content
-- - bid_packages
-- - expenses
-- - daily_reports
-- - and all other related data

DELETE FROM public.projects;

RAISE NOTICE 'Deleted all existing projects and related data';

-- ============================================================================
-- STEP 2: CREATE 10 NEW REALISTIC PROJECTS
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;

  -- Project Type Config IDs
  v_residential_config_id uuid;
  v_restaurant_config_id uuid;
  v_cafe_config_id uuid;
  v_commercial_config_id uuid;
  v_industrial_config_id uuid;

  -- Default 3D Model IDs
  v_residential_model_id uuid;
  v_restaurant_model_id uuid;
  v_cafe_model_id uuid;
  v_commercial_model_id uuid;
  v_industrial_model_id uuid;

  -- Project IDs (for creating phases/tasks)
  v_project_ids uuid[];
  v_project_id uuid;
  v_project_type text;

  -- Phase/Task Template IDs
  v_phase_template_id uuid;
  v_phase_id uuid;
  v_task_template_id uuid;

  -- Counters
  i integer;

BEGIN
  -- Get current user and company
  SELECT next_auth.uid() INTO v_user_id;
  SELECT get_user_company_id(v_user_id) INTO v_company_id;

  IF v_user_id IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated and belong to a company';
  END IF;

  RAISE NOTICE 'Creating projects for user: % in company: %', v_user_id, v_company_id;

  -- Get Project Type Config IDs
  SELECT id INTO v_residential_config_id FROM public.project_type_configs
    WHERE company_id = v_company_id AND name = 'Residential';
  SELECT id INTO v_restaurant_config_id FROM public.project_type_configs
    WHERE company_id = v_company_id AND name = 'Restaurant/Cafe';
  SELECT id INTO v_commercial_config_id FROM public.project_type_configs
    WHERE company_id = v_company_id AND name = 'Commercial Office';
  SELECT id INTO v_industrial_config_id FROM public.project_type_configs
    WHERE company_id = v_company_id AND name = 'Industrial';

  -- Get Default 3D Model IDs
  SELECT id INTO v_residential_model_id FROM public.default_3d_models
    WHERE project_type = 'residential' AND is_active = true;
  SELECT id INTO v_restaurant_model_id FROM public.default_3d_models
    WHERE project_type = 'restaurant' AND is_active = true;
  SELECT id INTO v_cafe_model_id FROM public.default_3d_models
    WHERE project_type = 'cafe' AND is_active = true;
  SELECT id INTO v_commercial_model_id FROM public.default_3d_models
    WHERE project_type = 'commercial_office' AND is_active = true;
  SELECT id INTO v_industrial_model_id FROM public.default_3d_models
    WHERE project_type = 'industrial' AND is_active = true;

  -- ========================================
  -- CREATE 10 PROJECTS (2 per type)
  -- ========================================

  -- RESIDENTIAL PROJECTS (2)
  INSERT INTO public.projects (company_id, name, client_name, client_email, client_phone, address, city, state, zip_code, project_type, status, description, start_date, end_date, budget, actual_cost, health_score, completion_percentage, created_by)
  VALUES
    (v_company_id, 'Sunset Villa Residence', 'John & Sarah Martinez', 'john.martinez@email.com', '555-0101', '1245 Sunset Boulevard', 'Los Angeles', 'CA', '90028', 'residential', 'active', 'Luxury 2-story custom home with modern amenities and smart home integration', '2026-01-15', '2026-08-30', 850000.00, 325000.00, 88, 35, v_user_id),
    (v_company_id, 'Oakwood Family Home', 'Michael & Emma Chen', 'emma.chen@email.com', '555-0102', '789 Oakwood Drive', 'Portland', 'OR', '97201', 'residential', 'in_progress', 'Traditional 2-story family home with basement and attached garage', '2025-11-01', '2026-06-15', 620000.00, 480000.00, 92, 65, v_user_id)
  RETURNING id INTO v_project_id;
  v_project_ids := array_append(v_project_ids, v_project_id);

  -- RESTAURANT PROJECTS (2)
  INSERT INTO public.projects (company_id, name, client_name, client_email, client_phone, address, city, state, zip_code, project_type, status, description, start_date, end_date, budget, actual_cost, health_score, completion_percentage, created_by)
  VALUES
    (v_company_id, 'Downtown Bistro', 'Restaurant Group LLC', 'contact@restaurantgroup.com', '555-0201', '456 Main Street', 'Seattle', 'WA', '98101', 'restaurant', 'active', 'Upscale French bistro with open kitchen, bar, and dining for 80 guests', '2026-02-01', '2026-07-15', 720000.00, 280000.00, 85, 40, v_user_id),
    (v_company_id, 'Harbor View Seafood', 'Coast Dining Inc', 'info@coastdining.com', '555-0202', '2100 Waterfront Way', 'San Diego', 'CA', '92101', 'restaurant', 'in_progress', 'Waterfront seafood restaurant with outdoor patio and full bar', '2025-10-15', '2026-05-30', 980000.00, 720000.00, 78, 72, v_user_id)
  RETURNING id INTO v_project_id;
  v_project_ids := array_append(v_project_ids, v_project_id);

  -- CAFE PROJECTS (2)
  INSERT INTO public.projects (company_id, name, client_name, client_email, client_phone, address, city, state, zip_code, project_type, status, description, start_date, end_date, budget, actual_cost, health_score, completion_percentage, created_by)
  VALUES
    (v_company_id, 'Artisan Coffee Co', 'Emily Johnson', 'emily@artisancoffee.com', '555-0301', '123 Elm Street', 'Austin', 'TX', '78701', 'cafe', 'active', 'Boutique coffee shop with espresso bar, pastry display, and cozy seating', '2026-01-20', '2026-04-30', 185000.00, 92000.00, 90, 48, v_user_id),
    (v_company_id, 'Campus Corner Cafe', 'University Plaza LLC', 'leasing@universityplaza.com', '555-0302', '890 College Avenue', 'Berkeley', 'CA', '94704', 'cafe', 'planning', 'Student-focused cafe with study areas, WiFi, and grab-and-go options', '2026-03-01', '2026-06-15', 145000.00, 15000.00, 95, 12, v_user_id)
  RETURNING id INTO v_project_id;
  v_project_ids := array_append(v_project_ids, v_project_id);

  -- COMMERCIAL OFFICE PROJECTS (2)
  INSERT INTO public.projects (company_id, name, client_name, client_email, client_phone, address, city, state, zip_code, project_type, status, description, start_date, end_date, budget, actual_cost, health_score, completion_percentage, created_by)
  VALUES
    (v_company_id, 'Tech Hub Office Buildout', 'Innovate Tech Corp', 'facilities@innovatetech.com', '555-0401', '5000 Innovation Drive', 'San Francisco', 'CA', '94105', 'commercial_office', 'active', 'Modern 3-floor tech office with open workspace, conference rooms, and amenities', '2026-01-05', '2026-09-20', 1250000.00, 580000.00, 82, 45, v_user_id),
    (v_company_id, 'Financial District Suite', 'Capital Advisors Group', 'ops@capitaladvisors.com', '555-0402', '1200 Wall Street', 'New York', 'NY', '10005', 'commercial_office', 'in_progress', 'Executive office suite with private offices, reception, and client meeting spaces', '2025-12-01', '2026-05-15', 875000.00, 680000.00, 88, 76, v_user_id)
  RETURNING id INTO v_project_id;
  v_project_ids := array_append(v_project_ids, v_project_id);

  -- INDUSTRIAL PROJECTS (2)
  INSERT INTO public.projects (company_id, name, client_name, client_email, client_phone, address, city, state, zip_code, project_type, status, description, start_date, end_date, budget, actual_cost, health_score, completion_percentage, created_by)
  VALUES
    (v_company_id, 'Riverside Distribution Center', 'Logistics Solutions Inc', 'pm@logisticssolutions.com', '555-0501', '7500 Industrial Parkway', 'Houston', 'TX', '77032', 'industrial', 'active', 'Large warehouse facility with loading docks, machinery area, and office section', '2026-02-15', '2026-11-30', 2100000.00, 750000.00, 80, 35, v_user_id),
    (v_company_id, 'Metro Manufacturing Plant', 'Advanced Manufacturing LLC', 'construction@advmfg.com', '555-0502', '9200 Factory Road', 'Detroit', 'MI', '48201', 'industrial', 'in_progress', 'Manufacturing facility with production floor, quality control lab, and utilities', '2025-09-01', '2026-08-31', 3500000.00, 2800000.00, 75, 78, v_user_id)
  RETURNING id INTO v_project_id;
  v_project_ids := array_append(v_project_ids, v_project_id);

  RAISE NOTICE 'Created 10 projects';

  -- ========================================
  -- STEP 3: CREATE PHASES AND TASKS FOR EACH PROJECT
  -- ========================================

  FOR i IN 1..array_length(v_project_ids, 1) LOOP
    v_project_id := v_project_ids[i];

    -- Get project type
    SELECT project_type INTO v_project_type FROM public.projects WHERE id = v_project_id;

    RAISE NOTICE 'Creating phases and tasks for project: % (type: %)', v_project_id, v_project_type;

    -- Get appropriate config_id based on project type
    CASE v_project_type
      WHEN 'residential' THEN
        -- Create phases from templates
        FOR v_phase_template_id IN
          SELECT id FROM public.phase_templates
          WHERE project_type_config_id = v_residential_config_id
          ORDER BY order_index
        LOOP
          -- Create phase
          INSERT INTO public.project_phases (project_id, name, order_index, status, completion_percentage, description)
          SELECT v_project_id, name, order_index,
            CASE
              WHEN order_index = 0 THEN 'completed'::phase_status
              WHEN order_index = 1 THEN 'in_progress'::phase_status
              ELSE 'not_started'::phase_status
            END,
            CASE
              WHEN order_index = 0 THEN 100
              WHEN order_index = 1 THEN 45
              ELSE 0
            END,
            description
          FROM public.phase_templates WHERE id = v_phase_template_id
          RETURNING id INTO v_phase_id;

          -- Create tasks for this phase
          FOR v_task_template_id IN
            SELECT id FROM public.task_templates
            WHERE phase_template_id = v_phase_template_id
            ORDER BY order_index
          LOOP
            INSERT INTO public.tasks (project_id, phase_id, title, description, status, priority, assignee_id, due_date, order_index, created_by)
            SELECT v_project_id, v_phase_id, title, NULL,
              CASE
                WHEN order_index % 5 = 0 THEN 'completed'::task_status
                WHEN order_index % 5 = 1 THEN 'in_progress'::task_status
                WHEN order_index % 5 = 2 THEN 'blocked'::task_status
                ELSE 'todo'::task_status
              END,
              CASE
                WHEN order_index % 3 = 0 THEN 'high'::task_priority
                WHEN order_index % 3 = 1 THEN 'medium'::task_priority
                ELSE 'low'::task_priority
              END,
              v_user_id,
              CURRENT_DATE + (order_index * 3 || ' days')::interval,
              order_index,
              v_user_id
            FROM public.task_templates WHERE id = v_task_template_id;
          END LOOP;
        END LOOP;

      WHEN 'restaurant' THEN
        -- Similar logic for restaurant
        FOR v_phase_template_id IN
          SELECT id FROM public.phase_templates
          WHERE project_type_config_id = v_restaurant_config_id
          ORDER BY order_index
        LOOP
          INSERT INTO public.project_phases (project_id, name, order_index, status, completion_percentage, description)
          SELECT v_project_id, name, order_index,
            CASE
              WHEN order_index = 0 THEN 'completed'::phase_status
              WHEN order_index <= 2 THEN 'in_progress'::phase_status
              ELSE 'not_started'::phase_status
            END,
            CASE
              WHEN order_index = 0 THEN 100
              WHEN order_index = 1 THEN 70
              WHEN order_index = 2 THEN 30
              ELSE 0
            END,
            description
          FROM public.phase_templates WHERE id = v_phase_template_id
          RETURNING id INTO v_phase_id;

          FOR v_task_template_id IN
            SELECT id FROM public.task_templates
            WHERE phase_template_id = v_phase_template_id
            ORDER BY order_index
          LOOP
            INSERT INTO public.tasks (project_id, phase_id, title, status, priority, assignee_id, due_date, order_index, created_by)
            SELECT v_project_id, v_phase_id, title,
              CASE
                WHEN order_index % 4 = 0 THEN 'completed'::task_status
                WHEN order_index % 4 = 1 THEN 'in_progress'::task_status
                ELSE 'todo'::task_status
              END,
              CASE
                WHEN order_index % 2 = 0 THEN 'high'::task_priority
                ELSE 'medium'::task_priority
              END,
              v_user_id,
              CURRENT_DATE + (order_index * 4 || ' days')::interval,
              order_index,
              v_user_id
            FROM public.task_templates WHERE id = v_task_template_id;
          END LOOP;
        END LOOP;

      WHEN 'cafe' THEN
        -- Similar logic for cafe (using restaurant config)
        FOR v_phase_template_id IN
          SELECT id FROM public.phase_templates
          WHERE project_type_config_id = v_restaurant_config_id
          ORDER BY order_index
        LOOP
          INSERT INTO public.project_phases (project_id, name, order_index, status, completion_percentage, description)
          SELECT v_project_id, name, order_index,
            CASE
              WHEN order_index = 0 THEN 'completed'::phase_status
              WHEN order_index = 1 THEN 'in_progress'::phase_status
              ELSE 'not_started'::phase_status
            END,
            CASE
              WHEN order_index = 0 THEN 100
              WHEN order_index = 1 THEN 50
              ELSE 0
            END,
            description
          FROM public.phase_templates WHERE id = v_phase_template_id
          RETURNING id INTO v_phase_id;

          FOR v_task_template_id IN
            SELECT id FROM public.task_templates
            WHERE phase_template_id = v_phase_template_id
            ORDER BY order_index
          LOOP
            INSERT INTO public.tasks (project_id, phase_id, title, status, priority, assignee_id, due_date, order_index, created_by)
            SELECT v_project_id, v_phase_id, title,
              CASE
                WHEN order_index % 3 = 0 THEN 'completed'::task_status
                WHEN order_index % 3 = 1 THEN 'in_progress'::task_status
                ELSE 'todo'::task_status
              END,
              'medium'::task_priority,
              v_user_id,
              CURRENT_DATE + (order_index * 2 || ' days')::interval,
              order_index,
              v_user_id
            FROM public.task_templates WHERE id = v_task_template_id;
          END LOOP;
        END LOOP;

      WHEN 'commercial_office' THEN
        -- Commercial office logic
        FOR v_phase_template_id IN
          SELECT id FROM public.phase_templates
          WHERE project_type_config_id = v_commercial_config_id
          ORDER BY order_index
        LOOP
          INSERT INTO public.project_phases (project_id, name, order_index, status, completion_percentage, description)
          SELECT v_project_id, name, order_index,
            CASE
              WHEN order_index <= 1 THEN 'completed'::phase_status
              WHEN order_index = 2 THEN 'in_progress'::phase_status
              ELSE 'not_started'::phase_status
            END,
            CASE
              WHEN order_index = 0 THEN 100
              WHEN order_index = 1 THEN 100
              WHEN order_index = 2 THEN 60
              ELSE 0
            END,
            description
          FROM public.phase_templates WHERE id = v_phase_template_id
          RETURNING id INTO v_phase_id;

          FOR v_task_template_id IN
            SELECT id FROM public.task_templates
            WHERE phase_template_id = v_phase_template_id
            ORDER BY order_index
          LOOP
            INSERT INTO public.tasks (project_id, phase_id, title, status, priority, assignee_id, due_date, order_index, created_by)
            SELECT v_project_id, v_phase_id, title,
              CASE
                WHEN order_index % 4 = 0 THEN 'completed'::task_status
                WHEN order_index % 4 = 1 THEN 'in_progress'::task_status
                WHEN order_index % 4 = 2 THEN 'review'::task_status
                ELSE 'todo'::task_status
              END,
              CASE
                WHEN order_index % 3 = 0 THEN 'high'::task_priority
                WHEN order_index % 3 = 1 THEN 'medium'::task_priority
                ELSE 'low'::task_priority
              END,
              v_user_id,
              CURRENT_DATE + (order_index * 5 || ' days')::interval,
              order_index,
              v_user_id
            FROM public.task_templates WHERE id = v_task_template_id;
          END LOOP;
        END LOOP;

      WHEN 'industrial' THEN
        -- Industrial logic
        FOR v_phase_template_id IN
          SELECT id FROM public.phase_templates
          WHERE project_type_config_id = v_industrial_config_id
          ORDER BY order_index
        LOOP
          INSERT INTO public.project_phases (project_id, name, order_index, status, completion_percentage, description)
          SELECT v_project_id, name, order_index,
            CASE
              WHEN order_index <= 2 THEN 'completed'::phase_status
              WHEN order_index = 3 THEN 'in_progress'::phase_status
              ELSE 'not_started'::phase_status
            END,
            CASE
              WHEN order_index = 0 THEN 100
              WHEN order_index = 1 THEN 100
              WHEN order_index = 2 THEN 100
              WHEN order_index = 3 THEN 50
              ELSE 0
            END,
            description
          FROM public.phase_templates WHERE id = v_phase_template_id
          RETURNING id INTO v_phase_id;

          FOR v_task_template_id IN
            SELECT id FROM public.task_templates
            WHERE phase_template_id = v_phase_template_id
            ORDER BY order_index
          LOOP
            INSERT INTO public.tasks (project_id, phase_id, title, status, priority, assignee_id, due_date, order_index, created_by)
            SELECT v_project_id, v_phase_id, title,
              CASE
                WHEN order_index % 5 = 0 THEN 'completed'::task_status
                WHEN order_index % 5 = 1 THEN 'in_progress'::task_status
                WHEN order_index % 5 = 2 THEN 'blocked'::task_status
                ELSE 'todo'::task_status
              END,
              'high'::task_priority,
              v_user_id,
              CURRENT_DATE + (order_index * 7 || ' days')::interval,
              order_index,
              v_user_id
            FROM public.task_templates WHERE id = v_task_template_id;
          END LOOP;
        END LOOP;
    END CASE;

  END LOOP;

  RAISE NOTICE 'Created phases and tasks for all projects';

  -- ========================================
  -- STEP 4: LINK PROJECTS TO DEFAULT 3D MODELS
  -- ========================================

  -- Link residential projects to residential default model
  INSERT INTO public.projects_3d_models (project_id, version, file_name, original_file_url, xkt_file_url, file_size_bytes, element_count, bounds, floors, is_active, processing_status)
  SELECT p.id, 1, 'Default Residential House',
    d.original_file_url, d.xkt_file_url, d.file_size_bytes, d.element_count, d.bounds, d.floors,
    true, 'ready'::spatial_processing_status
  FROM public.projects p
  JOIN public.default_3d_models d ON d.project_type = 'residential' AND d.is_active = true
  WHERE p.project_type = 'residential';

  -- Link restaurant projects
  INSERT INTO public.projects_3d_models (project_id, version, file_name, original_file_url, xkt_file_url, file_size_bytes, element_count, bounds, floors, is_active, processing_status)
  SELECT p.id, 1, 'Default Restaurant Layout',
    d.original_file_url, d.xkt_file_url, d.file_size_bytes, d.element_count, d.bounds, d.floors,
    true, 'ready'::spatial_processing_status
  FROM public.projects p
  JOIN public.default_3d_models d ON d.project_type = 'restaurant' AND d.is_active = true
  WHERE p.project_type = 'restaurant';

  -- Link cafe projects
  INSERT INTO public.projects_3d_models (project_id, version, file_name, original_file_url, xkt_file_url, file_size_bytes, element_count, bounds, floors, is_active, processing_status)
  SELECT p.id, 1, 'Default Cafe Layout',
    d.original_file_url, d.xkt_file_url, d.file_size_bytes, d.element_count, d.bounds, d.floors,
    true, 'ready'::spatial_processing_status
  FROM public.projects p
  JOIN public.default_3d_models d ON d.project_type = 'cafe' AND d.is_active = true
  WHERE p.project_type = 'cafe';

  -- Link commercial office projects
  INSERT INTO public.projects_3d_models (project_id, version, file_name, original_file_url, xkt_file_url, file_size_bytes, element_count, bounds, floors, is_active, processing_status)
  SELECT p.id, 1, 'Default Commercial Office',
    d.original_file_url, d.xkt_file_url, d.file_size_bytes, d.element_count, d.bounds, d.floors,
    true, 'ready'::spatial_processing_status
  FROM public.projects p
  JOIN public.default_3d_models d ON d.project_type = 'commercial_office' AND d.is_active = true
  WHERE p.project_type = 'commercial_office';

  -- Link industrial projects
  INSERT INTO public.projects_3d_models (project_id, version, file_name, original_file_url, xkt_file_url, file_size_bytes, element_count, bounds, floors, is_active, processing_status)
  SELECT p.id, 1, 'Default Industrial Warehouse',
    d.original_file_url, d.xkt_file_url, d.file_size_bytes, d.element_count, d.bounds, d.floors,
    true, 'ready'::spatial_processing_status
  FROM public.projects p
  JOIN public.default_3d_models d ON d.project_type = 'industrial' AND d.is_active = true
  WHERE p.project_type = 'industrial';

  RAISE NOTICE 'Linked all projects to default 3D models';

END $$;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA RESET AND SEED COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created 10 realistic construction projects:';
  RAISE NOTICE '  - 2 Residential projects';
  RAISE NOTICE '  - 2 Restaurant projects';
  RAISE NOTICE '  - 2 Cafe projects';
  RAISE NOTICE '  - 2 Commercial Office projects';
  RAISE NOTICE '  - 2 Industrial projects';
  RAISE NOTICE '';
  RAISE NOTICE 'Each project has:';
  RAISE NOTICE '  - Phases created from templates';
  RAISE NOTICE '  - Tasks created from templates';
  RAISE NOTICE '  - Linked to appropriate default 3D model';
  RAISE NOTICE '  - Realistic statuses, health scores, and progress';
  RAISE NOTICE '========================================';
END $$;
