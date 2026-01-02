-- Create model_elements table for IFC element metadata
CREATE TABLE public.model_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.projects_3d_models(id) ON DELETE CASCADE,

  -- IFC element identification
  element_guid text NOT NULL,
  element_type text NOT NULL,
  element_name text,

  -- Spatial hierarchy
  floor_id text,
  floor_name text,
  room_id text,
  room_name text,

  -- Element properties (IFC property sets)
  properties jsonb DEFAULT '{}',

  -- Bounding box for spatial queries
  bounds jsonb,

  -- Hierarchy (for nested elements)
  parent_element_id uuid REFERENCES public.model_elements(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT model_elements_model_guid_unique UNIQUE(model_id, element_guid),
  CONSTRAINT model_elements_bounds_format CHECK (
    bounds IS NULL OR (
      bounds ? 'minX' AND bounds ? 'minY' AND bounds ? 'minZ' AND
      bounds ? 'maxX' AND bounds ? 'maxY' AND bounds ? 'maxZ'
    )
  )
);

COMMENT ON TABLE public.model_elements IS 'IFC element metadata extracted from 3D models for spatial queries and marker attachment';
COMMENT ON COLUMN public.model_elements.element_guid IS 'IFC GlobalId (GUID) - unique identifier for element';
COMMENT ON COLUMN public.model_elements.element_type IS 'IFC entity type (IfcWall, IfcDoor, IfcWindow, etc.)';
COMMENT ON COLUMN public.model_elements.properties IS 'JSONB of IFC property sets (Pset_WallCommon, Qto_WallBaseQuantities, etc.)';
COMMENT ON COLUMN public.model_elements.bounds IS 'JSONB bounding box: {minX, minY, minZ, maxX, maxY, maxZ}';
COMMENT ON COLUMN public.model_elements.parent_element_id IS 'Parent element for hierarchical relationships (IfcBuildingStorey, IfcSpace, etc.)';

-- Create indexes for efficient queries
CREATE INDEX idx_model_elements_model ON public.model_elements(model_id);
CREATE INDEX idx_model_elements_element_guid ON public.model_elements(model_id, element_guid);
CREATE INDEX idx_model_elements_element_type ON public.model_elements(model_id, element_type);
CREATE INDEX idx_model_elements_floor_id ON public.model_elements(model_id, floor_id) WHERE floor_id IS NOT NULL;
CREATE INDEX idx_model_elements_properties ON public.model_elements USING gin(properties);

-- Enable RLS
ALTER TABLE public.model_elements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View model elements (company members can view elements for their project models)
CREATE POLICY "Users can view model elements for company projects"
ON public.model_elements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects_3d_models m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = model_elements.model_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);
