-- Add FK linking expense → the payment that created it (Flow A)
-- Also used by Flow B to link the auto-created payment back to this expense
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS subcontractor_payment_id UUID
  REFERENCES public.subcontractor_payments(id) ON DELETE SET NULL;

-- Add FK linking expense → a specific subcontractor (Flow B trigger)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS subcontractor_id UUID
  REFERENCES public.subcontractors(id) ON DELETE SET NULL;

-- Index for fast lookups by payment (checking for duplicates in Flow A)
CREATE INDEX IF NOT EXISTS idx_expenses_subcontractor_payment_id
  ON public.expenses(subcontractor_payment_id)
  WHERE subcontractor_payment_id IS NOT NULL;

-- Index for fast lookups by subcontractor
CREATE INDEX IF NOT EXISTS idx_expenses_subcontractor_id
  ON public.expenses(subcontractor_id)
  WHERE subcontractor_id IS NOT NULL;

-- Backfill expense for the existing $200 payment
INSERT INTO public.expenses (
  company_id, project_id, description, amount, category,
  expense_date, vendor_name, status, submitted_by, submitted_at,
  ocr_processed, subcontractor_payment_id, subcontractor_id
)
SELECT
  sc.company_id,
  sc.project_id,
  'Payment to ' || s.company_name AS description,
  sp.amount,
  'labor'::expense_category,
  sp.payment_date,
  s.company_name,
  'approved'::expense_status,
  sc.created_by,
  now(),
  false,
  sp.id,
  s.id
FROM public.subcontractor_payments sp
JOIN public.subcontractor_contracts sc ON sc.id = sp.contract_id
JOIN public.subcontractors s ON s.id = sc.subcontractor_id
WHERE sp.id = '131559a8-fa1a-4a6a-be52-7254746a3067'
  AND NOT EXISTS (
    SELECT 1 FROM public.expenses e WHERE e.subcontractor_payment_id = sp.id
  );
