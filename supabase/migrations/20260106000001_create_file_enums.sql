-- Migration: Create enum types for document and photo categories
-- Author: agent-backend-engineer
-- Date: 2026-01-06

-- Document categories enum
CREATE TYPE public.document_category AS ENUM (
  'contracts',
  'permits',
  'drawings',
  'reports',
  'financial',
  'safety',
  'meeting_notes',
  'specifications',
  'general'
);

COMMENT ON TYPE public.document_category IS 'Categories for construction documents following industry standards';

-- Photo categories enum
CREATE TYPE public.photo_category AS ENUM (
  'site_progress',
  'safety_documentation',
  'permits_approvals',
  'inspection_reports',
  'material_receipts',
  'change_orders',
  'defects_issues',
  'before_after',
  'task_receipts',
  'expense_receipts',
  'general'
);

COMMENT ON TYPE public.photo_category IS 'Categories for construction site photos with receipt integration';
