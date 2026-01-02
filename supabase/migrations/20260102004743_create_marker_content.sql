-- Create enum for marker content types
CREATE TYPE marker_content_type AS ENUM (
  'photo',
  'file',
  'note',
  'activity'
);

-- Create marker_content table
CREATE TABLE public.marker_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid NOT NULL REFERENCES public.spatial_markers(id) ON DELETE CASCADE,
  type marker_content_type NOT NULL,

  -- Photo fields
  photo_url text,
  photo_thumbnail_url text,
  photo_width integer,
  photo_height integer,
  photo_exif jsonb,

  -- File fields
  file_url text,
  file_name text,
  file_size_bytes bigint,
  file_mime_type text,

  -- Note fields
  note_text text,
  note_format text DEFAULT 'plain',

  -- Activity fields
  activity_type text,
  activity_data jsonb,

  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Validation constraints
  CONSTRAINT marker_content_photo_check CHECK (
    type != 'photo' OR photo_url IS NOT NULL
  ),
  CONSTRAINT marker_content_file_check CHECK (
    type != 'file' OR (file_url IS NOT NULL AND file_name IS NOT NULL)
  ),
  CONSTRAINT marker_content_note_check CHECK (
    type != 'note' OR note_text IS NOT NULL
  )
);

COMMENT ON TABLE public.marker_content IS 'Polymorphic content (photos, files, notes, activity) attached to spatial markers';
COMMENT ON COLUMN public.marker_content.photo_exif IS 'EXIF metadata from photo (GPS, camera, timestamp, etc.)';
COMMENT ON COLUMN public.marker_content.note_format IS 'Format of note: plain, markdown, html';
COMMENT ON COLUMN public.marker_content.activity_type IS 'Activity type: status_change, assignment, mention, etc.';
COMMENT ON COLUMN public.marker_content.activity_data IS 'Activity-specific data (old/new values, user references, etc.)';

-- Create indexes
CREATE INDEX idx_marker_content_marker ON public.marker_content(marker_id);
CREATE INDEX idx_marker_content_type ON public.marker_content(type);
CREATE INDEX idx_marker_content_created_by ON public.marker_content(created_by);
CREATE INDEX idx_marker_content_created_at ON public.marker_content(marker_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.marker_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View content (company members)
CREATE POLICY "Users can view marker content for company projects"
ON public.marker_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spatial_markers sm
    JOIN public.projects p ON p.id = sm.project_id
    WHERE sm.id = marker_content.marker_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- RLS Policy: Create content (company members)
CREATE POLICY "Company members can create marker content"
ON public.marker_content FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spatial_markers sm
    JOIN public.projects p ON p.id = sm.project_id
    WHERE sm.id = marker_content.marker_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- RLS Policy: Update content (creator or GC/PM)
CREATE POLICY "Users can update own content or GC/PM can update all"
ON public.marker_content FOR UPDATE
USING (
  created_by = next_auth.uid() OR
  (
    is_user_gc_admin(next_auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.spatial_markers sm
      JOIN public.projects p ON p.id = sm.project_id
      WHERE sm.id = marker_content.marker_id
      AND p.company_id = get_user_company_id(next_auth.uid())
    )
  )
);

-- RLS Policy: Delete content (creator or GC admin)
CREATE POLICY "Users can delete own content or GC admin can delete all"
ON public.marker_content FOR DELETE
USING (
  created_by = next_auth.uid() OR
  (
    is_user_gc_admin(next_auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.spatial_markers sm
      JOIN public.projects p ON p.id = sm.project_id
      WHERE sm.id = marker_content.marker_id
      AND p.company_id = get_user_company_id(next_auth.uid())
    )
  )
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_marker_content_updated_at
  BEFORE UPDATE ON public.marker_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update spatial_markers.content_count and last_activity_at
CREATE OR REPLACE FUNCTION public.update_marker_content_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.spatial_markers
    SET content_count = content_count + 1,
        last_activity_at = NEW.created_at
    WHERE id = NEW.marker_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.spatial_markers
    SET content_count = GREATEST(content_count - 1, 0),
        last_activity_at = now()
    WHERE id = OLD.marker_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marker_content_count_on_insert
  AFTER INSERT ON public.marker_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marker_content_count();

CREATE TRIGGER update_marker_content_count_on_delete
  AFTER DELETE ON public.marker_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marker_content_count();
