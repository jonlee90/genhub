-- Create enums for spatial markers
CREATE TYPE spatial_marker_type AS ENUM (
  'issue',
  'note',
  'photo',
  'inspection',
  'rfi',
  'safety',
  'material',
  'progress'
);

CREATE TYPE spatial_marker_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

-- Create spatial_markers table
CREATE TABLE public.spatial_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  model_id uuid REFERENCES public.projects_3d_models(id) ON DELETE SET NULL,
  type spatial_marker_type NOT NULL DEFAULT 'note',
  status spatial_marker_status NOT NULL DEFAULT 'open',

  -- 3D position and orientation
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  position_z numeric NOT NULL,
  normal_x numeric,
  normal_y numeric,
  normal_z numeric,

  -- IFC element reference (if attached to model element)
  element_id text,
  element_type text,
  element_name text,

  -- Spatial hierarchy
  floor_id text,
  floor_name text,
  room_id text,
  room_name text,

  -- Marker metadata
  title text NOT NULL,
  description text,

  -- Relationships
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  cluster_id uuid,

  -- Activity tracking
  content_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),

  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.spatial_markers IS 'Spatial markers placed in 3D space with photos, files, and notes';
COMMENT ON COLUMN public.spatial_markers.position_x IS '3D X coordinate in model space';
COMMENT ON COLUMN public.spatial_markers.position_y IS '3D Y coordinate in model space';
COMMENT ON COLUMN public.spatial_markers.position_z IS '3D Z coordinate in model space';
COMMENT ON COLUMN public.spatial_markers.normal_x IS 'Surface normal X (for orientation)';
COMMENT ON COLUMN public.spatial_markers.element_id IS 'IFC element GUID if attached to element';
COMMENT ON COLUMN public.spatial_markers.cluster_id IS 'For grouping related markers (future use)';
COMMENT ON COLUMN public.spatial_markers.content_count IS 'Cached count of photos/files/notes';

-- Create indexes
CREATE INDEX idx_spatial_markers_project ON public.spatial_markers(project_id);
CREATE INDEX idx_spatial_markers_model ON public.spatial_markers(model_id) WHERE model_id IS NOT NULL;
CREATE INDEX idx_spatial_markers_position ON public.spatial_markers(position_x, position_y, position_z);
CREATE INDEX idx_spatial_markers_floor ON public.spatial_markers(floor_id) WHERE floor_id IS NOT NULL;
CREATE INDEX idx_spatial_markers_type_status ON public.spatial_markers(type, status);
CREATE INDEX idx_spatial_markers_task ON public.spatial_markers(task_id) WHERE task_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.spatial_markers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View markers (company members)
CREATE POLICY "Users can view spatial markers for company projects"
ON public.spatial_markers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = spatial_markers.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- RLS Policy: Create markers (company members)
CREATE POLICY "Company members can create spatial markers"
ON public.spatial_markers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = spatial_markers.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- RLS Policy: Update markers (creator or GC/PM)
CREATE POLICY "Users can update own markers or GC/PM can update all"
ON public.spatial_markers FOR UPDATE
USING (
  created_by = next_auth.uid() OR
  (
    is_user_gc_admin(next_auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = spatial_markers.project_id
      AND p.company_id = get_user_company_id(next_auth.uid())
    )
  )
);

-- RLS Policy: Delete markers (creator or GC admin)
CREATE POLICY "Users can delete own markers or GC admin can delete all"
ON public.spatial_markers FOR DELETE
USING (
  created_by = next_auth.uid() OR
  (
    is_user_gc_admin(next_auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = spatial_markers.project_id
      AND p.company_id = get_user_company_id(next_auth.uid())
    )
  )
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_spatial_markers_updated_at
  BEFORE UPDATE ON public.spatial_markers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
