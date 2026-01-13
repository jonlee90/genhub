-- =============================================
-- Task 1.1: Add is_primary column to task_assignees
-- Purpose: Enable primary assignee designation for auto-expense vendor mapping
-- =============================================

-- 1. Add is_primary column with default false
ALTER TABLE public.task_assignees
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- 2. Create partial index for efficient primary assignee lookups
-- This index helps queries that find the primary assignee for a task
CREATE INDEX idx_task_assignees_primary
ON public.task_assignees(task_id)
WHERE is_primary = true;

-- 3. Create trigger function to enforce single primary assignee per task
CREATE OR REPLACE FUNCTION public.ensure_single_primary_assignee()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when setting is_primary to true
  IF NEW.is_primary = true THEN
    -- Clear any existing primary assignee for this task (except current row)
    UPDATE public.task_assignees
    SET is_primary = false
    WHERE task_id = NEW.task_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger that fires AFTER INSERT OR UPDATE
CREATE TRIGGER trg_single_primary_assignee
AFTER INSERT OR UPDATE OF is_primary
ON public.task_assignees
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_primary_assignee();

-- 5. Add comment for documentation
COMMENT ON COLUMN public.task_assignees.is_primary IS
'Indicates the primary assignee for vendor_name mapping in auto-expense creation. Only one assignee per task can be primary.';
