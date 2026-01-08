-- Migration: Create file_audit_log table for immutable audit trail
-- Author: agent-backend-engineer
-- Date: 2026-01-06

CREATE TABLE public.file_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_id uuid,
  file_type text NOT NULL,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES next_auth.users(id),
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.file_audit_log IS 'Immutable audit trail for critical file operations';
COMMENT ON COLUMN public.file_audit_log.file_id IS 'References project_files.id OR project_photos.id';
COMMENT ON COLUMN public.file_audit_log.file_type IS 'Either "document" or "photo"';
COMMENT ON COLUMN public.file_audit_log.previous_state IS 'JSON snapshot before action (for rollback/audit)';
COMMENT ON COLUMN public.file_audit_log.new_state IS 'JSON snapshot after action';

-- Indexes for performance
CREATE INDEX idx_file_audit_log_file ON public.file_audit_log(file_id, file_type);
CREATE INDEX idx_file_audit_log_created ON public.file_audit_log(created_at DESC);
CREATE INDEX idx_file_audit_log_company ON public.file_audit_log(company_id);

-- Enable RLS
ALTER TABLE public.file_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "file_audit_log_select" ON public.file_audit_log
FOR SELECT
USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "file_audit_log_insert" ON public.file_audit_log
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(next_auth.uid())
  AND performed_by = next_auth.uid()
);
