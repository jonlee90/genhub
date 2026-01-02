-- Create enum for processing status
CREATE TYPE spatial_processing_status AS ENUM (
  'pending',
  'processing',
  'ready',
  'failed'
);

-- Create projects_3d_models table
CREATE TABLE public.projects_3d_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  file_name text NOT NULL,
  original_file_url text NOT NULL,
  xkt_file_url text,
  lod_medium_url text,
  lod_low_url text,
  thumbnail_url text,
  file_size_bytes bigint NOT NULL,
  element_count integer DEFAULT 0,
  bounds jsonb,
  floors jsonb,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  processing_status spatial_processing_status DEFAULT 'pending',
  processing_error text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT projects_3d_models_project_version_unique UNIQUE(project_id, version),
  CONSTRAINT projects_3d_models_bounds_format CHECK (
    bounds IS NULL OR (
      bounds ? 'minX' AND bounds ? 'minY' AND bounds ? 'minZ' AND
      bounds ? 'maxX' AND bounds ? 'maxY' AND bounds ? 'maxZ'
    )
  )
);

COMMENT ON TABLE public.projects_3d_models IS 'Stores 3D BIM/IFC models for projects with versioning and LOD support';
COMMENT ON COLUMN public.projects_3d_models.version IS 'Version number for model iterations (auto-increments per project)';
COMMENT ON COLUMN public.projects_3d_models.bounds IS 'JSONB with model bounding box: {minX, minY, minZ, maxX, maxY, maxZ}';
COMMENT ON COLUMN public.projects_3d_models.floors IS 'JSONB array of floors: [{id: string, name: string, elevation: number}]';
COMMENT ON COLUMN public.projects_3d_models.is_active IS 'Only one active model per project (set by user)';
COMMENT ON COLUMN public.projects_3d_models.processing_status IS 'Conversion status: pending, processing, ready, failed';

-- Create indexes for efficient queries
CREATE INDEX idx_projects_3d_models_project_active ON public.projects_3d_models(project_id, is_active) WHERE is_active = true;
CREATE INDEX idx_projects_3d_models_status ON public.projects_3d_models(processing_status) WHERE processing_status != 'ready';

-- Enable RLS
ALTER TABLE public.projects_3d_models ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View 3D models (company members can view models for their projects)
CREATE POLICY "Users can view 3D models for company projects"
ON public.projects_3d_models FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = projects_3d_models.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- RLS Policy: Manage 3D models (GC Admin and PM can create/update/delete)
CREATE POLICY "GC/PM can manage 3D models"
ON public.projects_3d_models FOR ALL
USING (
  is_user_gc_admin(next_auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = projects_3d_models.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
)
WITH CHECK (
  is_user_gc_admin(next_auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = projects_3d_models.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_3d_models_updated_at
  BEFORE UPDATE ON public.projects_3d_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
