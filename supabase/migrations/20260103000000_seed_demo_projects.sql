-- Migration: Seed 10 Demo Projects with Phases and Tasks
-- Date: 2026-01-03
-- Description: Deletes existing projects and creates 10 realistic demo projects (2 per type)

-- Step 1: Delete all existing projects (cascades to phases, tasks, etc.)
DELETE FROM public.projects;

-- Step 2: Get the current user's company_id (will be injected by the script)
DO $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;

  -- Project IDs
  p_sunset_villa uuid;
  p_oakwood_home uuid;
  p_downtown_bistro uuid;
  p_harbor_seafood uuid;
  p_artisan_coffee uuid;
  p_campus_cafe uuid;
  p_tech_hub uuid;
  p_financial_suite uuid;
  p_riverside_dist uuid;
  p_metro_mfg uuid;

  -- Default model IDs
  m_residential uuid;
  m_restaurant uuid;
  m_cafe uuid;
  m_commercial uuid;
  m_industrial uuid;

BEGIN
  -- Get current user and company
  SELECT next_auth.uid() INTO v_user_id;
  SELECT company_id INTO v_company_id FROM public.company_users WHERE user_id = v_user_id LIMIT 1;

  -- Get default model IDs
  SELECT id INTO m_residential FROM public.default_3d_models WHERE project_type = 'residential' AND is_active = true LIMIT 1;
  SELECT id INTO m_restaurant FROM public.default_3d_models WHERE project_type = 'restaurant' AND is_active = true LIMIT 1;
  SELECT id INTO m_cafe FROM public.default_3d_models WHERE project_type = 'cafe' AND is_active = true LIMIT 1;
  SELECT id INTO m_commercial FROM public.default_3d_models WHERE project_type = 'commercial_office' AND is_active = true LIMIT 1;
  SELECT id INTO m_industrial FROM public.default_3d_models WHERE project_type = 'industrial' AND is_active = true LIMIT 1;

  -- ============================================================
  -- RESIDENTIAL PROJECTS (2)
  -- ============================================================

  -- 1. Sunset Villa Residence (Los Angeles)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Sunset Villa Residence',
    'Michael & Sarah Chen',
    '1234 Pacific Coast Highway',
    'Los Angeles',
    'CA',
    '90210',
    'USA',
    'residential',
    'active',
    2500000,
    92,
    65,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '120 days',
    CURRENT_DATE + INTERVAL '60 days',
    m_residential
  ) RETURNING id INTO p_sunset_villa;

  -- 2. Oakwood Family Home (Portland)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Oakwood Family Home',
    'Jennifer & Robert Martinez',
    '5678 Forest Grove Lane',
    'Portland',
    'OR',
    '97204',
    'USA',
    'residential',
    'active',
    1800000,
    88,
    45,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '80 days',
    CURRENT_DATE + INTERVAL '100 days',
    m_residential
  ) RETURNING id INTO p_oakwood_home;

  -- ============================================================
  -- RESTAURANT PROJECTS (2)
  -- ============================================================

  -- 3. Downtown Bistro (Seattle)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Downtown Bistro',
    'Culinary Ventures LLC',
    '789 Pike Street',
    'Seattle',
    'WA',
    '98101',
    'USA',
    'restaurant',
    'active',
    950000,
    85,
    70,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE + INTERVAL '30 days',
    m_restaurant
  ) RETURNING id INTO p_downtown_bistro;

  -- 4. Harbor View Seafood (San Diego)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Harbor View Seafood',
    'Pacific Dining Group',
    '321 Harbor Drive',
    'San Diego',
    'CA',
    '92101',
    'USA',
    'restaurant',
    'active',
    1200000,
    78,
    35,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '50 days',
    CURRENT_DATE + INTERVAL '110 days',
    m_restaurant
  ) RETURNING id INTO p_harbor_seafood;

  -- ============================================================
  -- CAFE PROJECTS (2)
  -- ============================================================

  -- 5. Artisan Coffee Co (Austin)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Artisan Coffee Co',
    'Local Brew Partners',
    '456 Congress Avenue',
    'Austin',
    'TX',
    '78701',
    'USA',
    'cafe',
    'active',
    450000,
    95,
    80,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '100 days',
    CURRENT_DATE + INTERVAL '20 days',
    m_cafe
  ) RETURNING id INTO p_artisan_coffee;

  -- 6. Campus Corner Cafe (Berkeley)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Campus Corner Cafe',
    'Student Union Hospitality',
    '2500 Telegraph Avenue',
    'Berkeley',
    'CA',
    '94704',
    'USA',
    'cafe',
    'active',
    380000,
    82,
    55,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '70 days',
    CURRENT_DATE + INTERVAL '50 days',
    m_cafe
  ) RETURNING id INTO p_campus_cafe;

  -- ============================================================
  -- COMMERCIAL OFFICE PROJECTS (2)
  -- ============================================================

  -- 7. Tech Hub Office Buildout (San Francisco)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Tech Hub Office Buildout',
    'InnovateTech Inc',
    '100 Market Street, Floor 5',
    'San Francisco',
    'CA',
    '94105',
    'USA',
    'commercial_office',
    'active',
    3200000,
    90,
    60,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '110 days',
    CURRENT_DATE + INTERVAL '70 days',
    m_commercial
  ) RETURNING id INTO p_tech_hub;

  -- 8. Financial District Suite (New York)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Financial District Suite',
    'Wall Street Capital Partners',
    '75 Wall Street, Floor 12',
    'New York',
    'NY',
    '10005',
    'USA',
    'commercial_office',
    'active',
    4500000,
    75,
    25,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '40 days',
    CURRENT_DATE + INTERVAL '140 days',
    m_commercial
  ) RETURNING id INTO p_financial_suite;

  -- ============================================================
  -- INDUSTRIAL PROJECTS (2)
  -- ============================================================

  -- 9. Riverside Distribution Center (Houston)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Riverside Distribution Center',
    'Logistics Solutions Corp',
    '8900 East Freeway',
    'Houston',
    'TX',
    '77029',
    'USA',
    'industrial',
    'active',
    8500000,
    87,
    50,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '150 days',
    CURRENT_DATE + INTERVAL '150 days',
    m_industrial
  ) RETURNING id INTO p_riverside_dist;

  -- 10. Metro Manufacturing Plant (Detroit)
  INSERT INTO public.projects (
    name, client_name, address, city, state, zip_code, country,
    project_type, status, budget, health, completion_percentage,
    company_id, created_by, start_date, end_date, default_model_id
  ) VALUES (
    'Metro Manufacturing Plant',
    'American Auto Parts Inc',
    '1500 Industrial Parkway',
    'Detroit',
    'MI',
    '48201',
    'USA',
    'industrial',
    'active',
    12000000,
    79,
    20,
    v_company_id,
    v_user_id,
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '240 days',
    m_industrial
  ) RETURNING id INTO p_metro_mfg;

  -- ============================================================
  -- CREATE PHASES FOR EACH PROJECT
  -- ============================================================
  -- Standard 5 phases: Initiation, Planning, Execution, Monitoring, Closeout

  -- Helper function to create phases
  CREATE TEMP TABLE temp_projects (
    project_id uuid,
    project_name text,
    completion_pct integer
  );

  INSERT INTO temp_projects VALUES
    (p_sunset_villa, 'Sunset Villa Residence', 65),
    (p_oakwood_home, 'Oakwood Family Home', 45),
    (p_downtown_bistro, 'Downtown Bistro', 70),
    (p_harbor_seafood, 'Harbor View Seafood', 35),
    (p_artisan_coffee, 'Artisan Coffee Co', 80),
    (p_campus_cafe, 'Campus Corner Cafe', 55),
    (p_tech_hub, 'Tech Hub Office Buildout', 60),
    (p_financial_suite, 'Financial District Suite', 25),
    (p_riverside_dist, 'Riverside Distribution Center', 50),
    (p_metro_mfg, 'Metro Manufacturing Plant', 20);

  -- Create phases for each project
  FOR project_rec IN SELECT * FROM temp_projects LOOP
    -- Phase 1: Initiation (always completed)
    INSERT INTO public.project_phases (project_id, name, phase_order, status, start_date, end_date)
    VALUES (
      project_rec.project_id,
      'Initiation',
      1,
      'completed',
      CURRENT_DATE - INTERVAL '180 days',
      CURRENT_DATE - INTERVAL '160 days'
    );

    -- Phase 2: Planning
    INSERT INTO public.project_phases (project_id, name, phase_order, status, start_date, end_date)
    VALUES (
      project_rec.project_id,
      'Planning',
      2,
      CASE WHEN project_rec.completion_pct >= 20 THEN 'completed' ELSE 'in_progress' END,
      CURRENT_DATE - INTERVAL '160 days',
      CURRENT_DATE - INTERVAL '120 days'
    );

    -- Phase 3: Execution
    INSERT INTO public.project_phases (project_id, name, phase_order, status, start_date, end_date)
    VALUES (
      project_rec.project_id,
      'Execution',
      3,
      CASE
        WHEN project_rec.completion_pct >= 60 THEN 'completed'
        WHEN project_rec.completion_pct >= 30 THEN 'in_progress'
        ELSE 'not_started'
      END,
      CURRENT_DATE - INTERVAL '120 days',
      CURRENT_DATE + INTERVAL '30 days'
    );

    -- Phase 4: Monitoring & Control
    INSERT INTO public.project_phases (project_id, name, phase_order, status, start_date, end_date)
    VALUES (
      project_rec.project_id,
      'Monitoring & Control',
      4,
      CASE
        WHEN project_rec.completion_pct >= 80 THEN 'completed'
        WHEN project_rec.completion_pct >= 50 THEN 'in_progress'
        ELSE 'not_started'
      END,
      CURRENT_DATE - INTERVAL '90 days',
      CURRENT_DATE + INTERVAL '60 days'
    );

    -- Phase 5: Closeout
    INSERT INTO public.project_phases (project_id, name, phase_order, status, start_date, end_date)
    VALUES (
      project_rec.project_id,
      'Closeout',
      5,
      CASE
        WHEN project_rec.completion_pct >= 90 THEN 'in_progress'
        ELSE 'not_started'
      END,
      CURRENT_DATE + INTERVAL '60 days',
      CURRENT_DATE + INTERVAL '90 days'
    );
  END LOOP;

  -- ============================================================
  -- CREATE SAMPLE TASKS FOR EACH PROJECT
  -- ============================================================

  -- For each project, create tasks based on phases
  FOR project_rec IN SELECT * FROM temp_projects LOOP
    DECLARE
      phase_initiation_id uuid;
      phase_planning_id uuid;
      phase_execution_id uuid;
    BEGIN
      -- Get phase IDs
      SELECT id INTO phase_initiation_id FROM public.project_phases
      WHERE project_id = project_rec.project_id AND name = 'Initiation';

      SELECT id INTO phase_planning_id FROM public.project_phases
      WHERE project_id = project_rec.project_id AND name = 'Planning';

      SELECT id INTO phase_execution_id FROM public.project_phases
      WHERE project_id = project_rec.project_id AND name = 'Execution';

      -- Initiation Phase Tasks (completed)
      INSERT INTO public.tasks (project_id, phase_id, title, description, status, priority, due_date, created_by, company_id)
      VALUES
        (project_rec.project_id, phase_initiation_id, 'Initial Site Survey', 'Complete site assessment and measurements', 'done', 'high', CURRENT_DATE - INTERVAL '175 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_initiation_id, 'Client Kickoff Meeting', 'Review project scope and timeline with client', 'done', 'high', CURRENT_DATE - INTERVAL '170 days', v_user_id, v_company_id);

      -- Planning Phase Tasks
      INSERT INTO public.tasks (project_id, phase_id, title, description, status, priority, due_date, created_by, company_id)
      VALUES
        (project_rec.project_id, phase_planning_id, 'Finalize Architectural Plans', 'Complete and approve all architectural drawings',
         CASE WHEN project_rec.completion_pct >= 30 THEN 'done' ELSE 'in_progress' END, 'high', CURRENT_DATE - INTERVAL '150 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_planning_id, 'Submit Permit Applications', 'File all required building permits',
         CASE WHEN project_rec.completion_pct >= 25 THEN 'done' ELSE 'todo' END, 'high', CURRENT_DATE - INTERVAL '140 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_planning_id, 'Material Procurement Planning', 'Identify and order long-lead materials',
         CASE WHEN project_rec.completion_pct >= 35 THEN 'done' ELSE 'in_progress' END, 'medium', CURRENT_DATE - INTERVAL '130 days', v_user_id, v_company_id);

      -- Execution Phase Tasks
      INSERT INTO public.tasks (project_id, phase_id, title, description, status, priority, due_date, created_by, company_id)
      VALUES
        (project_rec.project_id, phase_execution_id, 'Site Preparation', 'Clear and grade construction site',
         CASE WHEN project_rec.completion_pct >= 40 THEN 'done' WHEN project_rec.completion_pct >= 30 THEN 'in_progress' ELSE 'todo' END, 'high', CURRENT_DATE - INTERVAL '100 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_execution_id, 'Foundation Work', 'Pour foundation and allow curing',
         CASE WHEN project_rec.completion_pct >= 50 THEN 'done' WHEN project_rec.completion_pct >= 40 THEN 'in_progress' ELSE 'todo' END, 'high', CURRENT_DATE - INTERVAL '80 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_execution_id, 'Framing', 'Complete structural framing',
         CASE WHEN project_rec.completion_pct >= 60 THEN 'done' WHEN project_rec.completion_pct >= 50 THEN 'in_progress' ELSE 'todo' END, 'high', CURRENT_DATE - INTERVAL '60 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_execution_id, 'MEP Installation', 'Install mechanical, electrical, and plumbing systems',
         CASE WHEN project_rec.completion_pct >= 70 THEN 'done' WHEN project_rec.completion_pct >= 60 THEN 'in_progress' ELSE 'todo' END, 'high', CURRENT_DATE - INTERVAL '40 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_execution_id, 'Interior Finishes', 'Complete drywall, painting, and flooring',
         CASE WHEN project_rec.completion_pct >= 80 THEN 'in_progress' ELSE 'todo' END, 'medium', CURRENT_DATE - INTERVAL '20 days', v_user_id, v_company_id),
        (project_rec.project_id, phase_execution_id, 'Final Inspections', 'Schedule and pass all required inspections',
         CASE WHEN project_rec.completion_pct >= 85 THEN 'in_progress' ELSE 'todo' END, 'high', CURRENT_DATE + INTERVAL '10 days', v_user_id, v_company_id);
    END;
  END LOOP;

  DROP TABLE temp_projects;

  RAISE NOTICE 'Successfully created 10 demo projects with phases and tasks';
END $$;
