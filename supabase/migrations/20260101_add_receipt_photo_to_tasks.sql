-- Add receipt_photo_url column to tasks table
-- This allows users to attach receipt photos when creating/editing tasks
-- Similar to expense receipts, useful for purchase-type tasks and documentation

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS receipt_photo_url text;

COMMENT ON COLUMN public.tasks.receipt_photo_url IS 'URL to receipt photo uploaded by user for task documentation (especially for purchase tasks)';
