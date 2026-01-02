# Task 1.10: Seed existing companies with templates

## Objective
Run the seeding function for all existing companies to populate them with default templates.

## References
- Requirements §1.8, 2.6, 3.9, 4.9 (Migration strategy)

## Implementation Details

### Files to Modify
- `supabase/migrations/039_seed_default_templates.sql` (same file from 1.9)

### Migration Block

Add a DO block at the end of the migration that:
1. Loops through all companies in the `companies` table
2. Calls `seed_company_templates(company_id)` for each company
3. Logs the number of companies seeded

## Acceptance Criteria
- ✅ All existing companies have default templates seeded
- ✅ No errors during seeding
- ✅ Each company has 4 project types, 4 task types, and associated phases/tasks
- ✅ Verify in database that templates exist for all companies

## SQL Template

```sql
-- Seed existing companies with default templates
DO $$
DECLARE
    company_record RECORD;
    company_count INTEGER := 0;
BEGIN
    FOR company_record IN SELECT id FROM public.companies LOOP
        PERFORM seed_company_templates(company_record.id);
        company_count := company_count + 1;
    END LOOP;

    RAISE NOTICE 'Seeded default templates for % companies', company_count;
END $$;
```
