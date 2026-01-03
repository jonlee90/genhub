-- P4.2: Add spatial_marker_id to tasks table
-- Allows linking tasks to 3D spatial markers for spatial context

ALTER TABLE public.tasks
ADD COLUMN spatial_marker_id uuid REFERENCES public.spatial_markers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_tasks_spatial_marker ON public.tasks(spatial_marker_id) WHERE spatial_marker_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.tasks.spatial_marker_id IS 'Links task to a 3D spatial marker for location context';
