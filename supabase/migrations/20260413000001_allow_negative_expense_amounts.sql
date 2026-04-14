-- Allow negative expense amounts (refunds, credits, returns) while still blocking zero.
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS check_expense_amount_positive;
ALTER TABLE public.expenses ADD CONSTRAINT check_expense_amount_nonzero CHECK (amount <> 0);
