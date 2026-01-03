-- P4.5: Add spatial_marker_id to material_assignments table
-- Allows linking material assignments to 3D spatial markers for location tracking

ALTER TABLE public.material_assignments
ADD COLUMN spatial_marker_id uuid REFERENCES public.spatial_markers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_material_assignments_spatial_marker ON public.material_assignments(spatial_marker_id) WHERE spatial_marker_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.material_assignments.spatial_marker_id IS 'Links material assignment to a 3D spatial marker for location tracking';
