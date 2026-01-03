-- Add is_client_visible column to spatial_markers table
-- Allows controlling which markers are visible to client users

ALTER TABLE public.spatial_markers
ADD COLUMN is_client_visible boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.spatial_markers.is_client_visible IS 'Whether this marker is visible to client users in the portal';

-- Create index for efficient client queries
CREATE INDEX idx_spatial_markers_client_visible
ON public.spatial_markers(project_id, is_client_visible)
WHERE is_client_visible = true;

-- Update RLS policy for client users
-- Clients can only see markers with is_client_visible = true
CREATE POLICY "Clients can view client-visible markers only"
ON public.spatial_markers FOR SELECT
TO authenticated
USING (
  is_client_visible = true AND
  EXISTS (
    SELECT 1 FROM public.company_users cu
    JOIN public.projects p ON p.company_id = cu.company_id
    WHERE cu.user_id = next_auth.uid()
    AND cu.role = 'client'
    AND p.id = spatial_markers.project_id
  )
);
