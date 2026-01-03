-- Migration 043: Extend Existing Tables for Default Models
-- Description: Add columns to projects_3d_models and spatial_markers to support default model tracking
-- Created: 2026-01-02

-- ============================================================================
-- EXTEND: projects_3d_models
-- Add columns to track if model is from default and which default
-- ============================================================================

ALTER TABLE public.projects_3d_models
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_model_id uuid REFERENCES public.default_3d_models(id) ON DELETE SET NULL;

-- Add index for default model queries
CREATE INDEX IF NOT EXISTS idx_projects_3d_models_default
  ON public.projects_3d_models(default_model_id)
  WHERE is_default = true;

-- Add comments
COMMENT ON COLUMN public.projects_3d_models.is_default IS 'True if this model was created from a default model';
COMMENT ON COLUMN public.projects_3d_models.default_model_id IS 'Reference to the default model this was created from';

-- ============================================================================
-- EXTEND: spatial_markers
-- Add column to track which marker config this marker was created from
-- ============================================================================

ALTER TABLE public.spatial_markers
  ADD COLUMN IF NOT EXISTS marker_config_id uuid REFERENCES public.default_marker_configs(id) ON DELETE SET NULL;

-- Add index for marker config queries
CREATE INDEX IF NOT EXISTS idx_spatial_markers_config
  ON public.spatial_markers(marker_config_id)
  WHERE marker_config_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.spatial_markers.marker_config_id IS 'Reference to the default marker config this was created from';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 043 completed: Extended projects_3d_models and spatial_markers tables';
END $$;
