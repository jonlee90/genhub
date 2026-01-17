-- Migration: Add data validation constraints
-- Priority: HIGH
-- Impact: Prevents invalid data entry (percentages >100, invalid date ranges)
-- Estimated execution time: <30 seconds
-- Date: 2026-01-16

-- Constraint 1: Project health score must be 0-100
ALTER TABLE public.projects
  ADD CONSTRAINT check_health_score_range
  CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));

COMMENT ON CONSTRAINT check_health_score_range ON public.projects IS 'Health score must be between 0 and 100';

-- Constraint 2: Project completion percentage must be 0-100
ALTER TABLE public.projects
  ADD CONSTRAINT check_completion_percentage_range
  CHECK (completion_percentage IS NULL OR (completion_percentage >= 0 AND completion_percentage <= 100));

COMMENT ON CONSTRAINT check_completion_percentage_range ON public.projects IS 'Completion percentage must be between 0 and 100';

-- Constraint 3: Project end date must be after start date
ALTER TABLE public.projects
  ADD CONSTRAINT check_project_date_range
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

COMMENT ON CONSTRAINT check_project_date_range ON public.projects IS 'End date must be on or after start date';

-- Constraint 4: Phase completion percentage must be 0-100
ALTER TABLE public.project_phases
  ADD CONSTRAINT check_phase_completion_percentage_range
  CHECK (completion_percentage IS NULL OR (completion_percentage >= 0 AND completion_percentage <= 100));

COMMENT ON CONSTRAINT check_phase_completion_percentage_range ON public.project_phases IS 'Phase completion percentage must be between 0 and 100';

-- Constraint 5: Phase end date must be after start date
ALTER TABLE public.project_phases
  ADD CONSTRAINT check_phase_date_range
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

COMMENT ON CONSTRAINT check_phase_date_range ON public.project_phases IS 'Phase end date must be on or after start date';

-- Constraint 6: Task due date should be after start date
ALTER TABLE public.tasks
  ADD CONSTRAINT check_task_date_range
  CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date);

COMMENT ON CONSTRAINT check_task_date_range ON public.tasks IS 'Task due date must be on or after start date';

-- Constraint 7: Expense amount must be positive
ALTER TABLE public.expenses
  ADD CONSTRAINT check_expense_amount_positive
  CHECK (amount > 0);

COMMENT ON CONSTRAINT check_expense_amount_positive ON public.expenses IS 'Expense amount must be positive';

-- Constraint 8: Material quantity must be positive
ALTER TABLE public.material_assignments
  ADD CONSTRAINT check_quantity_positive
  CHECK (quantity > 0);

COMMENT ON CONSTRAINT check_quantity_positive ON public.material_assignments IS 'Material quantity must be positive';

-- Constraint 9: OCR confidence score must be 0-1
ALTER TABLE public.expenses
  ADD CONSTRAINT check_ocr_confidence_range
  CHECK (ocr_confidence_score IS NULL OR (ocr_confidence_score >= 0 AND ocr_confidence_score <= 1));

COMMENT ON CONSTRAINT check_ocr_confidence_range ON public.expenses IS 'OCR confidence score must be between 0 and 1';

-- Verify constraints were created
DO $$
BEGIN
  RAISE NOTICE 'Data validation constraints created successfully';
  RAISE NOTICE 'Tables now protected against invalid data entry';
END $$;
