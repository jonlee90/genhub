-- Migration: Create AI Plan Estimator - Core Tables and Enums
-- Description: Creates foundational schema for AI-assisted plan takeoff estimation
-- Tasks: 1.1 - Enums and 5 core tables (plan_uploads, plan_pages, plan_parse_results, takeoff_items, estimates)
-- Date: 2026-02-08

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE plan_upload_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
CREATE TYPE plan_page_parse_status AS ENUM ('pending', 'parsing', 'parsed', 'parse_failed');
CREATE TYPE estimate_status AS ENUM ('draft', 'reviewed', 'approved', 'superseded');
CREATE TYPE takeoff_category AS ENUM ('structural', 'architectural', 'mechanical', 'electrical', 'plumbing', 'painting', 'site', 'general');
CREATE TYPE extraction_method AS ENUM ('labeled', 'calculated', 'inferred', 'manual');
CREATE TYPE review_status AS ENUM ('pending', 'accepted', 'rejected', 'edited');

-- ============================================
-- CORE TABLES
-- ============================================

-- Plan Uploads Table
CREATE TABLE public.plan_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,

  -- File metadata
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  file_path TEXT NOT NULL, -- storage path
  mime_type TEXT NOT NULL,

  -- Processing status
  status plan_upload_status NOT NULL DEFAULT 'uploading',
  total_pages INT,
  error_message TEXT,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plan_uploads IS 'Uploaded construction plan files (PDFs or images)';

-- Plan Pages Table
CREATE TABLE public.plan_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,

  -- Page metadata
  page_number INT NOT NULL,
  image_path TEXT NOT NULL, -- storage path to PNG
  image_width INT NOT NULL,
  image_height INT NOT NULL,
  file_size BIGINT NOT NULL, -- bytes

  -- Parse status
  parse_status plan_page_parse_status NOT NULL DEFAULT 'pending',
  image_hash_sha256 TEXT, -- for caching

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.plan_pages IS 'Individual pages extracted from plan uploads';

-- Plan Parse Results Table
CREATE TABLE public.plan_parse_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_page_id UUID NOT NULL REFERENCES public.plan_pages(id) ON DELETE CASCADE,

  -- AI response data
  raw_response JSONB NOT NULL,
  page_type TEXT,

  -- Token tracking
  model TEXT NOT NULL, -- e.g., 'gpt-4o'
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  cost NUMERIC(10,6) NOT NULL, -- USD
  cached BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plan_parse_results IS 'Raw AI parsing results from GPT-4o vision API';

-- Takeoff Items Table
CREATE TABLE public.takeoff_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_page_id UUID NOT NULL REFERENCES public.plan_pages(id) ON DELETE CASCADE,
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,

  -- Item identification
  ai_item_id TEXT, -- from AI response
  category takeoff_category NOT NULL,
  trade TEXT NOT NULL, -- e.g., 'framing', 'drywall', 'electrical'
  sub_type TEXT NOT NULL, -- e.g., '2x4 studs', '5/8" drywall'

  -- Quantity data
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL, -- e.g., 'LF', 'SF', 'EA'
  waste_factor NUMERIC(5,4) NOT NULL DEFAULT 0, -- e.g., 0.10 for 10%
  adjusted_quantity NUMERIC(12,2) NOT NULL, -- quantity * (1 + waste_factor)

  -- AI metadata
  extraction_method extraction_method NOT NULL,
  confidence NUMERIC(3,2) NOT NULL, -- 0.00 to 1.00
  source_region JSONB, -- bounding box {x, y, width, height}

  -- Review workflow
  needs_review BOOLEAN NOT NULL DEFAULT false,
  review_status review_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES next_auth.users(id),
  reviewed_at TIMESTAMPTZ,
  edit_history JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.takeoff_items IS 'Normalized takeoff quantities extracted from plans by AI';

-- Estimates Table
CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plan_upload_id UUID REFERENCES public.plan_uploads(id) ON DELETE SET NULL,

  -- Estimate metadata
  name TEXT NOT NULL,
  description TEXT,
  status estimate_status NOT NULL DEFAULT 'draft',

  -- Cost calculations
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  overhead_pct NUMERIC(5,2) NOT NULL DEFAULT 0, -- e.g., 10.00 for 10%
  overhead_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  markup_pct NUMERIC(5,2) NOT NULL DEFAULT 0, -- e.g., 15.00 for 15%
  markup_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Versioning
  superseded_by UUID REFERENCES public.estimates(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES next_auth.users(id),
  approved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.estimates IS 'Cost estimates derived from takeoff items';

-- ============================================
-- INDEXES
-- ============================================

-- plan_uploads indexes
CREATE INDEX idx_plan_uploads_company ON public.plan_uploads(company_id);
CREATE INDEX idx_plan_uploads_project ON public.plan_uploads(project_id);
CREATE INDEX idx_plan_uploads_status ON public.plan_uploads(status);
CREATE INDEX idx_plan_uploads_created_at ON public.plan_uploads(created_at DESC);

-- plan_pages indexes
CREATE INDEX idx_plan_pages_company ON public.plan_pages(company_id);
CREATE INDEX idx_plan_pages_upload ON public.plan_pages(plan_upload_id);
CREATE INDEX idx_plan_pages_parse_status ON public.plan_pages(parse_status);
CREATE INDEX idx_plan_pages_hash ON public.plan_pages(image_hash_sha256) WHERE image_hash_sha256 IS NOT NULL;

-- plan_parse_results indexes
CREATE INDEX idx_parse_results_company ON public.plan_parse_results(company_id);
CREATE INDEX idx_parse_results_page ON public.plan_parse_results(plan_page_id);
CREATE INDEX idx_parse_results_created_at ON public.plan_parse_results(created_at DESC);

-- takeoff_items indexes
CREATE INDEX idx_takeoff_items_company ON public.takeoff_items(company_id);
CREATE INDEX idx_takeoff_items_page ON public.takeoff_items(plan_page_id);
CREATE INDEX idx_takeoff_items_upload ON public.takeoff_items(plan_upload_id);
CREATE INDEX idx_takeoff_items_category ON public.takeoff_items(category);
CREATE INDEX idx_takeoff_items_trade ON public.takeoff_items(trade);
CREATE INDEX idx_takeoff_items_review_status ON public.takeoff_items(review_status);
CREATE INDEX idx_takeoff_items_needs_review ON public.takeoff_items(needs_review) WHERE needs_review = true;

-- estimates indexes
CREATE INDEX idx_estimates_company ON public.estimates(company_id);
CREATE INDEX idx_estimates_project ON public.estimates(project_id);
CREATE INDEX idx_estimates_status ON public.estimates(status);
CREATE INDEX idx_estimates_created_at ON public.estimates(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for plan_uploads
CREATE TRIGGER update_plan_uploads_updated_at
  BEFORE UPDATE ON public.plan_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for takeoff_items
CREATE TRIGGER update_takeoff_items_updated_at
  BEFORE UPDATE ON public.takeoff_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for estimates
CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
