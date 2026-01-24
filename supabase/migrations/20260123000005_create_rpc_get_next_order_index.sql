-- Migration: Create RPC functions for atomic order_index calculation
-- Date: 2026-01-23
-- Task: HIGH-5 - Create RPC for atomic order_index inserts
--
-- Purpose: Eliminate race conditions when creating ordered items
-- Affected actions: project-types, phase-templates, task-templates

-- ============================================
-- RPC: Get Next Order Index for Project Types
-- ============================================
CREATE OR REPLACE FUNCTION get_next_project_type_order_index(
  p_company_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_order int;
BEGIN
  -- Get max order_index for this company
  SELECT COALESCE(MAX(order_index), -1)
  INTO v_max_order
  FROM project_type_configs
  WHERE company_id = p_company_id;

  -- Return next order index
  RETURN v_max_order + 1;
END;
$$;

-- ============================================
-- RPC: Get Next Order Index for Phase Templates
-- ============================================
CREATE OR REPLACE FUNCTION get_next_phase_template_order_index(
  p_company_id uuid,
  p_project_type_config_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_order int;
BEGIN
  -- Get max order_index for this project type
  SELECT COALESCE(MAX(order_index), -1)
  INTO v_max_order
  FROM phase_templates
  WHERE company_id = p_company_id
    AND project_type_config_id = p_project_type_config_id;

  -- Return next order index
  RETURN v_max_order + 1;
END;
$$;

-- ============================================
-- RPC: Get Next Order Index for Task Templates
-- ============================================
CREATE OR REPLACE FUNCTION get_next_task_template_order_index(
  p_company_id uuid,
  p_phase_template_id uuid
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_order int;
BEGIN
  -- Get max order_index for this phase template
  SELECT COALESCE(MAX(order_index), -1)
  INTO v_max_order
  FROM task_templates
  WHERE company_id = p_company_id
    AND phase_template_id = p_phase_template_id;

  -- Return next order index
  RETURN v_max_order + 1;
END;
$$;

-- ============================================
-- Grant Execute Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_next_project_type_order_index(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_phase_template_order_index(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_task_template_order_index(uuid, uuid) TO authenticated;

-- ============================================
-- Usage Example (from Server Actions)
-- ============================================
-- const { data: orderIndex } = await supabase
--   .rpc('get_next_project_type_order_index', { p_company_id: companyId })
--   .single();
--
-- const { data: projectType, error } = await supabase
--   .from('project_type_configs')
--   .insert({ company_id: companyId, ...data, order_index: orderIndex })
--   .select()
--   .single();

-- ============================================
-- Notes
-- ============================================
-- - RPC functions are SECURITY DEFINER (run with owner privileges)
-- - COALESCE handles empty tables (returns -1, so first item gets order_index 0)
-- - Race conditions eliminated by database-level atomicity
-- - Server Actions can optionally use these instead of manual queries
