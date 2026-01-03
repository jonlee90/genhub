-- Migration 042: Create Default 3D Models Tables
-- Description: System-wide default 3D models for project types with company customization support
-- Created: 2026-01-02

-- ============================================================================
-- TABLE: default_3d_models
-- System-wide default models for each project type
-- ============================================================================

CREATE TABLE public.default_3d_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type text NOT NULL, -- Using text to support 'cafe' and 'restaurant' separately
  name text NOT NULL,
  description text,

  -- File URLs (Supabase Storage paths)
  original_file_url text NOT NULL, -- Original IFC file
  xkt_file_url text NOT NULL,      -- Converted XKT file
  lod_medium_url text,             -- LOD medium (optional)
  lod_low_url text,                -- LOD low (optional)
  thumbnail_url text,              -- Preview thumbnail

  -- Model metadata
  file_size_bytes bigint NOT NULL,
  element_count integer,
  bounds jsonb, -- { minX, minY, minZ, maxX, maxY, maxZ }
  floors jsonb, -- Array of floor definitions

  -- Version control
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add table comment
COMMENT ON TABLE public.default_3d_models IS 'System-wide default 3D models for each project type with pre-configured markers';

-- Partial unique index: Only one active model per project type
CREATE UNIQUE INDEX unique_active_default_model ON public.default_3d_models(project_type) WHERE is_active = true;

-- Indexes
CREATE INDEX idx_default_3d_models_project_type ON public.default_3d_models(project_type) WHERE is_active = true;
CREATE INDEX idx_default_3d_models_active ON public.default_3d_models(is_active);

-- Enable RLS
ALTER TABLE public.default_3d_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can view default models
CREATE POLICY "default_3d_models_select"
ON public.default_3d_models FOR SELECT
TO authenticated
USING (is_active = true);

-- Only system admins can insert/update (future implementation)
-- For now, insert via migrations only

-- Auto-update trigger
CREATE TRIGGER update_default_3d_models_updated_at
  BEFORE UPDATE ON public.default_3d_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TABLE: company_default_models
-- Company-level customization of default models
-- ============================================================================

CREATE TABLE public.company_default_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_type_config_id uuid NOT NULL REFERENCES public.project_type_configs(id) ON DELETE CASCADE,

  -- Reference to custom model uploaded by company (stored in projects_3d_models)
  model_id uuid NOT NULL REFERENCES public.projects_3d_models(id) ON DELETE CASCADE,

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add table comment
COMMENT ON TABLE public.company_default_models IS 'Company-level custom default 3D models that override system defaults';

-- Partial unique index: Only one active custom default per company per project type
CREATE UNIQUE INDEX unique_active_company_default ON public.company_default_models(company_id, project_type_config_id) WHERE is_active = true;

-- Indexes
CREATE INDEX idx_company_default_models_company ON public.company_default_models(company_id) WHERE is_active = true;
CREATE INDEX idx_company_default_models_type_config ON public.company_default_models(project_type_config_id) WHERE is_active = true;
CREATE INDEX idx_company_default_models_model ON public.company_default_models(model_id);

-- Enable RLS
ALTER TABLE public.company_default_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Company members can view their company's custom defaults
CREATE POLICY "company_default_models_select"
ON public.company_default_models FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = (SELECT next_auth.uid())
    AND status = 'active'
  )
);

-- GC admins can insert/update/delete company defaults
CREATE POLICY "company_default_models_insert"
ON public.company_default_models FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = (SELECT next_auth.uid())
    AND role = 'gc_admin'
    AND status = 'active'
  )
);

CREATE POLICY "company_default_models_update"
ON public.company_default_models FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = (SELECT next_auth.uid())
    AND role = 'gc_admin'
    AND status = 'active'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = (SELECT next_auth.uid())
    AND role = 'gc_admin'
    AND status = 'active'
  )
);

CREATE POLICY "company_default_models_delete"
ON public.company_default_models FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = (SELECT next_auth.uid())
    AND role = 'gc_admin'
    AND status = 'active'
  )
);

-- Auto-update trigger
CREATE TRIGGER update_company_default_models_updated_at
  BEFORE UPDATE ON public.company_default_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TABLE: default_marker_configs
-- Pre-configured marker positions for default models
-- ============================================================================

CREATE TABLE public.default_marker_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_model_id uuid NOT NULL REFERENCES public.default_3d_models(id) ON DELETE CASCADE,

  -- Spatial coordinates
  position_x double precision NOT NULL,
  position_y double precision NOT NULL,
  position_z double precision NOT NULL,
  normal_x double precision NOT NULL DEFAULT 0,
  normal_y double precision NOT NULL DEFAULT 1,
  normal_z double precision NOT NULL DEFAULT 0,

  -- Element reference (optional)
  floor_id text,
  floor_name text,
  element_id text,
  element_type text,

  -- Marker metadata
  title text NOT NULL,
  description text,
  type text NOT NULL, -- inspection, issue, note, photo, etc.

  -- Task template auto-linking
  task_template_title text, -- Match to task.title (case-insensitive)
  phase_name text,           -- Match to phase.name for additional filtering

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add table comment
COMMENT ON TABLE public.default_marker_configs IS 'Pre-configured spatial marker positions for default 3D models with task template auto-linking';

-- Indexes
CREATE INDEX idx_default_marker_configs_model ON public.default_marker_configs(default_model_id);
CREATE INDEX idx_default_marker_configs_task_template ON public.default_marker_configs(task_template_title) WHERE task_template_title IS NOT NULL;

-- Enable RLS
ALTER TABLE public.default_marker_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can view marker configs
CREATE POLICY "default_marker_configs_select"
ON public.default_marker_configs FOR SELECT
TO authenticated
USING (true); -- Accessible to all authenticated users

-- Auto-update trigger
CREATE TRIGGER update_default_marker_configs_updated_at
  BEFORE UPDATE ON public.default_marker_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 042 completed: Default 3D models tables created successfully';
END $$;
