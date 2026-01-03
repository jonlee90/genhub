-- Migration 044: Seed Default 3D Models and Marker Configs
-- Description: Insert placeholder default models for 5 project types and their marker configurations
-- Created: 2026-01-02
-- NOTE: File URLs are placeholders - actual IFC/XKT files to be uploaded later

-- ============================================================================
-- SEED: default_3d_models
-- System-wide default models for each project type
-- ============================================================================

-- Residential House (2-story)
INSERT INTO public.default_3d_models (
  project_type,
  name,
  description,
  original_file_url,
  xkt_file_url,
  file_size_bytes,
  element_count,
  bounds,
  floors,
  version,
  is_active
) VALUES (
  'residential',
  'Default Residential House',
  'Standard 2-story residential house with basement, main floor, and second floor',
  'defaults/residential-house.ifc',
  'defaults/residential-house.xkt',
  5000000, -- 5MB placeholder
  120,
  '{"minX": -10, "minY": 0, "minZ": -10, "maxX": 10, "maxY": 8, "maxZ": 10}'::jsonb,
  '[
    {"id": "ground", "name": "Ground Floor", "elevation": 0},
    {"id": "first", "name": "First Floor", "elevation": 2.5},
    {"id": "second", "name": "Second Floor", "elevation": 5.0}
  ]'::jsonb,
  1,
  true
) ON CONFLICT (project_type) WHERE is_active = true DO NOTHING;

-- Restaurant (Single-story)
INSERT INTO public.default_3d_models (
  project_type,
  name,
  description,
  original_file_url,
  xkt_file_url,
  file_size_bytes,
  element_count,
  bounds,
  floors,
  version,
  is_active
) VALUES (
  'restaurant',
  'Default Restaurant Layout',
  'Single-story restaurant with kitchen, dining area, bar, and restrooms',
  'defaults/restaurant-layout.ifc',
  'defaults/restaurant-layout.xkt',
  6000000, -- 6MB placeholder
  150,
  '{"minX": -12, "minY": 0, "minZ": -8, "maxX": 12, "maxY": 4, "maxZ": 8}'::jsonb,
  '[
    {"id": "slab", "name": "Slab Level", "elevation": 0},
    {"id": "main", "name": "Main Floor", "elevation": 1.5}
  ]'::jsonb,
  1,
  true
) ON CONFLICT (project_type) WHERE is_active = true DO NOTHING;

-- Cafe (Single-story)
INSERT INTO public.default_3d_models (
  project_type,
  name,
  description,
  original_file_url,
  xkt_file_url,
  file_size_bytes,
  element_count,
  bounds,
  floors,
  version,
  is_active
) VALUES (
  'cafe',
  'Default Cafe Layout',
  'Compact single-story cafe with coffee bar, seating area, and small kitchen',
  'defaults/cafe-layout.ifc',
  'defaults/cafe-layout.xkt',
  4000000, -- 4MB placeholder
  80,
  '{"minX": -6, "minY": 0, "minZ": -6, "maxX": 6, "maxY": 3.5, "maxZ": 6}'::jsonb,
  '[
    {"id": "main", "name": "Main Floor", "elevation": 1.2}
  ]'::jsonb,
  1,
  true
) ON CONFLICT (project_type) WHERE is_active = true DO NOTHING;

-- Commercial Office (Multi-floor)
INSERT INTO public.default_3d_models (
  project_type,
  name,
  description,
  original_file_url,
  xkt_file_url,
  file_size_bytes,
  element_count,
  bounds,
  floors,
  version,
  is_active
) VALUES (
  'commercial_office',
  'Default Commercial Office',
  'Multi-floor commercial office with open workspace, conference rooms, and utilities',
  'defaults/commercial-office.ifc',
  'defaults/commercial-office.xkt',
  8000000, -- 8MB placeholder
  200,
  '{"minX": -15, "minY": 0, "minZ": -12, "maxX": 15, "maxY": 10, "maxZ": 12}'::jsonb,
  '[
    {"id": "floor1", "name": "Floor 1", "elevation": 2.5},
    {"id": "floor2", "name": "Floor 2", "elevation": 5.0},
    {"id": "floor3", "name": "Floor 3", "elevation": 7.5}
  ]'::jsonb,
  1,
  true
) ON CONFLICT (project_type) WHERE is_active = true DO NOTHING;

-- Industrial Warehouse
INSERT INTO public.default_3d_models (
  project_type,
  name,
  description,
  original_file_url,
  xkt_file_url,
  file_size_bytes,
  element_count,
  bounds,
  floors,
  version,
  is_active
) VALUES (
  'industrial',
  'Default Industrial Warehouse',
  'Large warehouse facility with loading dock, machinery area, and office section',
  'defaults/industrial-warehouse.ifc',
  'defaults/industrial-warehouse.xkt',
  10000000, -- 10MB placeholder
  250,
  '{"minX": -20, "minY": 0, "minZ": -15, "maxX": 20, "maxY": 6, "maxZ": 15}'::jsonb,
  '[
    {"id": "ground", "name": "Ground Level", "elevation": 0.5},
    {"id": "slab", "name": "Slab Level", "elevation": 0.2},
    {"id": "main", "name": "Main Floor", "elevation": 1.5}
  ]'::jsonb,
  1,
  true
) ON CONFLICT (project_type) WHERE is_active = true DO NOTHING;

-- ============================================================================
-- SEED: default_marker_configs
-- Pre-configured markers for each default model
-- ============================================================================

-- Get default model IDs for insertion
DO $$
DECLARE
  v_residential_id uuid;
  v_restaurant_id uuid;
  v_cafe_id uuid;
  v_commercial_id uuid;
  v_industrial_id uuid;
BEGIN
  -- Fetch model IDs
  SELECT id INTO v_residential_id FROM public.default_3d_models WHERE project_type = 'residential' AND is_active = true;
  SELECT id INTO v_restaurant_id FROM public.default_3d_models WHERE project_type = 'restaurant' AND is_active = true;
  SELECT id INTO v_cafe_id FROM public.default_3d_models WHERE project_type = 'cafe' AND is_active = true;
  SELECT id INTO v_commercial_id FROM public.default_3d_models WHERE project_type = 'commercial_office' AND is_active = true;
  SELECT id INTO v_industrial_id FROM public.default_3d_models WHERE project_type = 'industrial' AND is_active = true;

  -- ========================================
  -- RESIDENTIAL MARKERS
  -- ========================================
  IF v_residential_id IS NOT NULL THEN
    INSERT INTO public.default_marker_configs (default_model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, floor_id, floor_name, title, description, type, task_template_title, phase_name)
    VALUES
      (v_residential_id, 0, 0.5, -5, 0, 1, 0, 'ground', 'Ground Floor', 'Foundation Inspection Point', 'Foundation inspection point for rebar placement and concrete pour', 'inspection', 'Foundation Inspection', 'Construction'),
      (v_residential_id, 0, 2.5, 0, 0, 1, 0, 'first', 'First Floor', 'Framing Walkthrough Location', 'Central location for client framing walkthrough', 'inspection', 'Framing Walkthrough with Client', 'Construction'),
      (v_residential_id, 3, 2.5, 3, 1, 0, 0, 'first', 'First Floor', 'Insulation & Drywall Check', 'Wall insulation and drywall inspection point', 'inspection', 'Insulation & Drywall Inspection', 'Construction'),
      (v_residential_id, -3, 2.5, -3, 0, 1, 0, 'first', 'First Floor', 'Quality Control Checkpoint', 'General quality control checkpoint', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_residential_id, 0, 2.5, 5, 0, 1, 0, 'first', 'First Floor', 'Inspection Coordination Hub', 'Central hub for coordinating inspections', 'inspection', 'Inspection Coordination', 'Construction'),
      (v_residential_id, -5, 0.5, 0, 0, 1, 0, 'ground', 'Ground Floor', 'Blue Tape Walkthrough Start', 'Entry point for blue tape punch list walkthrough', 'inspection', '"Blue Tape" Walkthrough', 'Post-construction'),
      (v_residential_id, 5, 2.5, 0, 0, 1, 0, 'first', 'First Floor', 'Final Cleaning Check', 'Final cleaning verification point', 'inspection', 'Final Cleaning', 'Post-construction'),
      (v_residential_id, 0, 0.5, 8, 0, 1, 0, 'ground', 'Ground Floor', 'Site Assessment Point', 'Initial site assessment and survey point', 'note', 'Site Assessment', 'Initiation')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- RESTAURANT MARKERS
  -- ========================================
  IF v_restaurant_id IS NOT NULL THEN
    INSERT INTO public.default_marker_configs (default_model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, floor_id, floor_name, title, description, type, task_template_title, phase_name)
    VALUES
      (v_restaurant_id, -4, 0.2, -3, 0, 1, 0, 'slab', 'Slab Level', 'Under-Slab Plumbing Point', 'Under-slab plumbing inspection before concrete pour', 'inspection', 'Under-Slab Plumbing Inspection', 'Construction'),
      (v_restaurant_id, -5, 1.5, 0, 1, 0, 0, 'main', 'Main Floor', 'Kitchen Wall Cover Check', 'Kitchen wall covering and tile inspection', 'inspection', 'Kitchen Wall Cover Inspection', 'Construction'),
      (v_restaurant_id, 0, 1.5, 0, 0, 1, 0, 'main', 'Main Floor', 'Quality Control Station', 'Central quality control checkpoint', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_restaurant_id, 3, 1.5, 3, 0, 1, 0, 'main', 'Main Floor', 'Inspection Coordination Point', 'Inspection scheduling and coordination hub', 'inspection', 'Inspection Coordination', 'Construction'),
      (v_restaurant_id, -6, 1.5, -2, 0, 1, 0, 'main', 'Main Floor', 'Kitchen Equipment Location', 'Kitchen equipment installation location', 'note', 'Kitchen Equipment', 'Procurement'),
      (v_restaurant_id, -5, 1.5, -3, 0, 1, 0, 'main', 'Main Floor', 'Equipment Commissioning Point', 'Kitchen equipment commissioning and testing', 'inspection', 'Equipment Commissioning', 'Post-construction'),
      (v_restaurant_id, -4, 1.5, 0, 0, 1, 0, 'main', 'Main Floor', 'Health Sign-off Location', 'Health department final inspection point', 'inspection', 'Health Sign-off', 'Post-construction'),
      (v_restaurant_id, 5, 1.5, 0, 0, 1, 0, 'main', 'Main Floor', 'Fire Inspection Point', 'Fire safety final inspection', 'inspection', 'Final Fire Inspection', 'Post-construction'),
      (v_restaurant_id, 4, 1.5, -4, 0, 1, 0, 'main', 'Main Floor', 'Dining Area Review', 'Dining area finishes quality check', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_restaurant_id, 3, 1.5, -5, 0, 1, 0, 'main', 'Main Floor', 'Bar Area Checkpoint', 'Bar area construction quality review', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_restaurant_id, 6, 1.5, 3, 0, 1, 0, 'main', 'Main Floor', 'Restroom Inspection', 'Restroom finishes and fixtures inspection', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_restaurant_id, 0, 1.5, 6, 0, 1, 0, 'main', 'Main Floor', 'Site Assessment', 'Initial site assessment location', 'note', 'Site Assessment', 'Initiation')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- CAFE MARKERS
  -- ========================================
  IF v_cafe_id IS NOT NULL THEN
    INSERT INTO public.default_marker_configs (default_model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, floor_id, floor_name, title, description, type, task_template_title, phase_name)
    VALUES
      (v_cafe_id, -3, 1.2, -2, 0, 1, 0, 'main', 'Main Floor', 'Kitchen Equipment Area', 'Espresso machine and kitchen equipment location', 'note', 'Kitchen Equipment', 'Procurement'),
      (v_cafe_id, -2, 1.2, 0, 0, 1, 0, 'main', 'Main Floor', 'Health Review Point', 'Health department review checkpoint', 'inspection', 'Health Dept Review', 'Pre-construction'),
      (v_cafe_id, 0, 1.2, 0, 0, 1, 0, 'main', 'Main Floor', 'Quality Control Hub', 'Central quality control checkpoint', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_cafe_id, 2, 1.2, 2, 0, 1, 0, 'main', 'Main Floor', 'Inspection Coordination', 'Inspection scheduling coordination point', 'inspection', 'Inspection Coordination', 'Construction'),
      (v_cafe_id, 3, 1.2, -3, 0, 1, 0, 'main', 'Main Floor', 'Seating Area Check', 'Seating area finishes quality check', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_cafe_id, -3, 1.2, -1, 0, 1, 0, 'main', 'Main Floor', 'Equipment Commissioning', 'Coffee equipment commissioning and testing', 'inspection', 'Equipment Commissioning', 'Post-construction'),
      (v_cafe_id, -2, 1.2, 1, 0, 1, 0, 'main', 'Main Floor', 'Health Final Inspection', 'Health department final sign-off point', 'inspection', 'Health Sign-off', 'Post-construction'),
      (v_cafe_id, 0, 1.2, 4, 0, 1, 0, 'main', 'Main Floor', 'Site Assessment', 'Initial site assessment location', 'note', 'Site Assessment', 'Initiation')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- COMMERCIAL OFFICE MARKERS
  -- ========================================
  IF v_commercial_id IS NOT NULL THEN
    INSERT INTO public.default_marker_configs (default_model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, floor_id, floor_name, title, description, type, task_template_title, phase_name)
    VALUES
      (v_commercial_id, -4, 2.5, 0, 1, 0, 0, 'floor1', 'Floor 1', 'Framing & Glazing Checkpoint', 'Framing and glazing installation inspection point', 'inspection', 'Framing & Glazing', 'Construction'),
      (v_commercial_id, 0, 2.8, 0, 0, 1, 0, 'floor1', 'Floor 1', 'MEP Modifications Hub', 'MEP systems modification inspection', 'inspection', 'MEP Modifications', 'Construction'),
      (v_commercial_id, 3, 2.5, 3, 0, 1, 0, 'floor1', 'Floor 1', 'Quality Control Station', 'General quality control checkpoint', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_commercial_id, -3, 2.5, -3, 0, 1, 0, 'floor1', 'Floor 1', 'Inspection Coordination', 'Inspection scheduling and coordination', 'inspection', 'Inspection Coordination', 'Construction'),
      (v_commercial_id, 4, 2.5, -4, 0, 1, 0, 'floor1', 'Floor 1', 'Conference Room Check', 'Conference room finishes inspection', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_commercial_id, -5, 2.5, 4, 0, 1, 0, 'floor1', 'Floor 1', 'Open Office Area', 'Open office area quality review', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_commercial_id, 0, 2.8, -3, 0, 1, 0, 'floor1', 'Floor 1', 'Equipment Commissioning', 'HVAC and equipment commissioning', 'inspection', 'Equipment Commissioning', 'Post-construction'),
      (v_commercial_id, 3, 2.5, 0, 0, 1, 0, 'floor1', 'Floor 1', 'Final Cleaning Check', 'Final cleaning verification', 'inspection', 'Final Cleaning', 'Post-construction'),
      (v_commercial_id, 0, 2.5, 5, 0, 1, 0, 'floor1', 'Floor 1', 'Site Assessment', 'Initial site assessment point', 'note', 'Site Assessment', 'Initiation')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ========================================
  -- INDUSTRIAL MARKERS
  -- ========================================
  IF v_industrial_id IS NOT NULL THEN
    INSERT INTO public.default_marker_configs (default_model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, floor_id, floor_name, title, description, type, task_template_title, phase_name)
    VALUES
      (v_industrial_id, 0, 0.5, -8, 0, 1, 0, 'ground', 'Ground Level', 'Mass Grading Point', 'Mass grading and excavation inspection point', 'inspection', 'Manage Mass Grading & Excavation', 'Construction'),
      (v_industrial_id, 0, 0.2, 0, 0, 1, 0, 'slab', 'Slab Level', 'Foundation/Slab Pour Point', 'Foundation and slab pour inspection', 'inspection', 'Foundation/Slab Pour', 'Construction'),
      (v_industrial_id, 5, 1.5, 5, 0, 1, 0, 'main', 'Main Floor', 'Quality Control Hub', 'Quality control checkpoint', 'inspection', 'Quality Control Checks', 'Construction'),
      (v_industrial_id, -5, 1.5, -5, 0, 1, 0, 'main', 'Main Floor', 'Inspection Coordination', 'Inspection coordination hub', 'inspection', 'Inspection Coordination', 'Construction'),
      (v_industrial_id, -10, 1.5, 0, 1, 0, 0, 'main', 'Main Floor', 'Loading Dock Area', 'Loading dock equipment location', 'note', 'Order Dock Equipment', 'Procurement'),
      (v_industrial_id, 0, 3.5, -6, 0, 1, 0, 'main', 'Main Floor', 'Fire Sprinkler System', 'Fire sprinkler system installation point', 'note', 'Order Fire Sprinkler Pump/System', 'Procurement'),
      (v_industrial_id, 0, 3.5, -5, 0, 1, 0, 'main', 'Main Floor', 'Fire Marshall Test Point', 'Fire safety system testing location', 'inspection', 'Fire Marshall System Test', 'Post-construction'),
      (v_industrial_id, 6, 1.5, 0, 0, 1, 0, 'main', 'Main Floor', 'Water Line Test Point', 'Water line pressure testing point', 'inspection', 'Flush & Pressure Test Water Lines', 'Post-construction'),
      (v_industrial_id, 8, 1.5, 8, 0, 1, 0, 'main', 'Main Floor', 'Final Cleaning Check', 'Final cleaning verification', 'inspection', 'Final Cleaning', 'Post-construction'),
      (v_industrial_id, 0, 0.5, 10, 0, 1, 0, 'ground', 'Ground Level', 'Site Assessment', 'Initial site assessment location', 'note', 'Site Assessment', 'Initiation')
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 044 completed: Seeded default 3D models and marker configurations';
  RAISE NOTICE '  - 5 default models created (residential, restaurant, cafe, commercial_office, industrial)';
  RAISE NOTICE '  - Marker configurations seeded for each model';
  RAISE NOTICE '  - NOTE: File URLs are placeholders - actual IFC/XKT files to be uploaded later';
END $$;
