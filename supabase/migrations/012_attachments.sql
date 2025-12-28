-- GenHub PWA: Attachments Table
-- File storage metadata for tasks, projects, and profiles
-- Created: 2025-12-04

-- Entity type enum for polymorphic attachments
CREATE TYPE public.attachment_entity_type AS ENUM (
  'task',
  'project',
  'phase',
  'profile',
  'subcontractor',
  'daily_report'
);

-- Attachments table
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type public.attachment_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- MIME type
  file_size integer NOT NULL, -- bytes
  thumbnail_url text,
  uploaded_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.attachments IS 'File attachments stored in Vercel Blob. Polymorphic relationship to tasks, projects, phases, and profiles.';

-- Enable Row Level Security
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- RLS Policies
-- Access depends on the entity type
CREATE POLICY "Users can view attachments of accessible entities"
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    CASE entity_type
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE t.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'project' THEN EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE p.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'phase' THEN EXISTS (
        SELECT 1 FROM public.project_phases ph
        JOIN public.projects p ON p.id = ph.project_id
        JOIN public.company_users cu ON cu.company_id = p.company_id
        WHERE ph.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      WHEN 'profile' THEN (
        attachments.entity_id = next_auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_users cu1
          JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
          WHERE cu1.user_id = next_auth.uid()
          AND cu2.user_id = attachments.entity_id
          AND cu1.status = 'active'
        )
      )
      WHEN 'subcontractor' THEN EXISTS (
        SELECT 1 FROM public.subcontractors s
        JOIN public.company_users cu ON cu.company_id = s.company_id
        WHERE s.id = attachments.entity_id
        AND cu.user_id = next_auth.uid()
        AND cu.status = 'active'
      )
      ELSE false
    END
  );

-- Authenticated users can upload attachments
CREATE POLICY "Users can insert attachments"
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = next_auth.uid());

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (uploaded_by = next_auth.uid());
