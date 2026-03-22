-- Migration: Create extraction_jobs table for Vector Extraction Engine
-- Description: Job queue table for distributed extraction pipeline with SKIP LOCKED concurrency
-- Tasks: VEC-013.1, VEC-013.2
-- Date: 2026-02-17

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE extraction_stage AS ENUM (
    'extract_vectors',
    'classify_sheet',
    'detect_scale',
    'detect_elements',
    'detect_rooms',
    'extract_schedules',
    'extract_mep',
    'calculate_quantities',
    'cross_page_reconcile',
    'generate_estimate'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'pending',
    'claimed',
    'processing',
    'completed',
    'failed',
    'dead_letter'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: extraction_jobs
-- ============================================

CREATE TABLE IF NOT EXISTS public.extraction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id uuid NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  stage extraction_stage NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  depends_on uuid[] DEFAULT '{}',
  result jsonb,
  error text,
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  claimed_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.extraction_jobs IS 'Job queue for the vector extraction pipeline; workers claim jobs using SKIP LOCKED';

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_extraction_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_extraction_jobs_updated_at
      BEFORE UPDATE ON public.extraction_jobs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_plan_upload_id ON public.extraction_jobs(plan_upload_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_pending ON public.extraction_jobs(status) WHERE status IN ('pending', 'claimed');
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_company ON public.extraction_jobs(company_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.extraction_jobs ENABLE ROW LEVEL SECURITY;

-- Company members can read their own extraction jobs (SELECT only)
-- INSERT/UPDATE/DELETE: service role only — workers use admin client
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'extraction_jobs'
      AND policyname = 'extraction_jobs_select'
  ) THEN
    CREATE POLICY "extraction_jobs_select" ON public.extraction_jobs
      FOR SELECT TO authenticated
      USING (
        public.get_user_company_id(next_auth.uid()) = company_id
      );
  END IF;
END $$;

-- ============================================
-- CLAIM FUNCTION (SKIP LOCKED)
-- ============================================

CREATE OR REPLACE FUNCTION public.claim_extraction_job(worker_id TEXT)
RETURNS extraction_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed_job extraction_jobs;
BEGIN
  UPDATE extraction_jobs
  SET status = 'claimed',
      claimed_at = now(),
      heartbeat_at = now()
  WHERE id = (
    SELECT id FROM extraction_jobs
    WHERE status = 'pending'
      AND (
        depends_on = '{}'
        OR NOT EXISTS (
          SELECT 1 FROM extraction_jobs dep
          WHERE dep.id = ANY(extraction_jobs.depends_on)
            AND dep.status != 'completed'
        )
      )
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_job;

  RETURN claimed_job;
END;
$$;

COMMENT ON FUNCTION public.claim_extraction_job(TEXT) IS 'Atomically claim one pending extraction job whose dependencies are all completed. Uses SKIP LOCKED for safe concurrent worker access.';
