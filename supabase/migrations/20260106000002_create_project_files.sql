-- Migration: Create project_files table with versioning and audit trail
-- Author: agent-backend-engineer
-- Date: 2026-01-06

CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  category public.document_category NOT NULL DEFAULT 'general',
  tags text[],
  client_visible boolean DEFAULT false,
  version_number integer NOT NULL DEFAULT 1,
  parent_file_id uuid REFERENCES public.project_files(id),
  metadata jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_files IS 'Project documents with versioning and audit trail';
COMMENT ON COLUMN public.project_files.file_url IS 'Vercel Blob URL (signed URLs generated at runtime)';
COMMENT ON COLUMN public.project_files.parent_file_id IS 'Links to original file for version history';
COMMENT ON COLUMN public.project_files.metadata IS 'JSON object: { hash: "sha256...", custom: {...} }';
COMMENT ON COLUMN public.project_files.deleted_at IS 'Soft delete timestamp for 30-day recovery period';

-- Indexes for performance
CREATE INDEX idx_project_files_project ON public.project_files(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_files_category ON public.project_files(project_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_files_uploaded_by ON public.project_files(uploaded_by);
CREATE INDEX idx_project_files_parent ON public.project_files(parent_file_id) WHERE parent_file_id IS NOT NULL;
CREATE INDEX idx_project_files_company ON public.project_files(company_id);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "project_files_select" ON public.project_files
FOR SELECT
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);

CREATE POLICY "project_files_insert" ON public.project_files
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(next_auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.project_team
    WHERE project_id = project_files.project_id
    AND user_id = next_auth.uid()
  )
);

CREATE POLICY "project_files_update" ON public.project_files
FOR UPDATE
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR public.is_user_admin(next_auth.uid())
  )
);

CREATE POLICY "project_files_delete" ON public.project_files
FOR DELETE
USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR public.is_user_admin(next_auth.uid())
  )
);

-- Auto-update trigger
CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
