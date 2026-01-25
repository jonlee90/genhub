-- Migration: Create project_photos table with EXIF metadata and thumbnails
-- Author: agent-backend-engineer
-- Date: 2026-01-06

CREATE TABLE public.project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  category public.photo_category NOT NULL DEFAULT 'general',
  tags text[],
  exif_data jsonb,
  client_visible boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_photos IS 'Project site photos with EXIF metadata and thumbnail support';
COMMENT ON COLUMN public.project_photos.photo_url IS 'Vercel Blob URL for full-resolution image';
COMMENT ON COLUMN public.project_photos.thumbnail_url IS '300x300px thumbnail for gallery display';
COMMENT ON COLUMN public.project_photos.exif_data IS 'JSON: { timestamp, camera: { make, model }, gps: { latitude, longitude }, exposure: { focalLength, fNumber, iso } }';

-- Indexes for performance
CREATE INDEX idx_project_photos_project ON public.project_photos(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_photos_category ON public.project_photos(project_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_photos_uploaded_by ON public.project_photos(uploaded_by);
CREATE INDEX idx_project_photos_company ON public.project_photos(company_id);

-- Enable RLS
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "project_photos_select" ON public.project_photos
FOR SELECT
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);

CREATE POLICY "project_photos_insert" ON public.project_photos
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(next_auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.project_team
    WHERE project_id = project_photos.project_id
    AND user_id = next_auth.uid()
  )
);

CREATE POLICY "project_photos_update" ON public.project_photos
FOR UPDATE
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR public.is_user_admin(next_auth.uid())
  )
);

CREATE POLICY "project_photos_delete" ON public.project_photos
FOR DELETE
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR public.is_user_admin(next_auth.uid())
  )
);
