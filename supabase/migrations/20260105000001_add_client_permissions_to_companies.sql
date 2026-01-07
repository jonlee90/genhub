-- Migration: Add client permission fields to companies table
-- Purpose: Store company-level client portal permissions
-- Task: 5.4 - Client Portal Permissions

-- Add client_can_view_budget column to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS client_can_view_budget boolean DEFAULT false NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.companies.client_can_view_budget IS
'Controls whether clients can view budget information in the client portal. Default: false';

-- Future-proof columns (commented out for now)
-- ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_can_approve_change_orders boolean DEFAULT false NOT NULL;
-- ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_can_view_invoices boolean DEFAULT false NOT NULL;
