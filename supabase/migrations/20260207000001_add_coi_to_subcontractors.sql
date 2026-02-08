-- Migration: Add certificate_of_insurance column to subcontractors table
-- Description: Adds a nullable TEXT column to store Vercel Blob URL for Certificate of Insurance documents
-- Author: Claude Code
-- Date: 2026-02-07

-- Add certificate_of_insurance column
ALTER TABLE public.subcontractors
ADD COLUMN IF NOT EXISTS certificate_of_insurance TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.subcontractors.certificate_of_insurance IS 'URL to Certificate of Insurance document stored in Vercel Blob (optional)';
