-- GenHub PWA: Fix Subcontractor Schema Issues
-- Created: 2025-12-07
-- Purpose:
--   1. Rename contact_email → email, contact_phone → phone (consistency with TypeScript types)
--   2. Add UNIQUE constraint on (company_id, email) to prevent duplicates
--   3. Add dedicated document URL columns (license_document_url, insurance_document_url)
--   4. Improve data integrity and match code expectations

-- Step 1: Rename columns for consistency
ALTER TABLE public.subcontractors
  RENAME COLUMN contact_email TO email;

ALTER TABLE public.subcontractors
  RENAME COLUMN contact_phone TO phone;

-- Step 2: Add document URL columns
-- These replace the temporary hack of storing URLs in the notes field
ALTER TABLE public.subcontractors
  ADD COLUMN IF NOT EXISTS license_document_url text,
  ADD COLUMN IF NOT EXISTS insurance_document_url text;

-- Step 3: Add unique constraint to prevent duplicate emails within company
-- This enforces business rule: one subcontractor email per company
-- Note: NULL emails are allowed (unique constraint allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_company_email_unique
  ON public.subcontractors(company_id, email)
  WHERE email IS NOT NULL;

-- Step 4: Add comments for new columns
COMMENT ON COLUMN public.subcontractors.license_document_url IS 'URL to license document stored in Vercel Blob';
COMMENT ON COLUMN public.subcontractors.insurance_document_url IS 'URL to insurance document stored in Vercel Blob';

-- Step 5: Update table comment to reflect changes
COMMENT ON TABLE public.subcontractors IS 'Directory of subcontractors with trade specializations, licensing, insurance, and performance tracking. Isolated by company. Email uniqueness enforced per company.';
