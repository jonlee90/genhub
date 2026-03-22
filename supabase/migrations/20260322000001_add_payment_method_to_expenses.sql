-- Migration: Add payment_method and store_account to expenses
-- Description: Support free-text payment method tracking (VISA 4516, ZELLE, CHK 2843)
-- Date: 2026-03-22

ALTER TABLE public.expenses ADD COLUMN payment_method TEXT;
ALTER TABLE public.expenses ADD COLUMN store_account TEXT;

-- Index for filtering expenses by payment method
CREATE INDEX idx_expenses_payment_method ON public.expenses(payment_method)
  WHERE payment_method IS NOT NULL;
