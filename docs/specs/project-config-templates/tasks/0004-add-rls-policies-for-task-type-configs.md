# Task 1.4: Add RLS policies for task_type_configs

## Objective
Create Row Level Security policies for task_type_configs table to enforce company-scoped access control with soft delete support.

## References
- Requirements §2.1-2.7 (Task Type Management)
- Design Migration 2

## Implementation Details

### Files to Modify
- `supabase/migrations/036_task_type_configs.sql` (same file from 1.3)

### RLS Policies

**Enable RLS:**
```sql
ALTER TABLE public.task_type_configs ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy:**
- Name: `task_type_configs_select_policy`
- Users can view their company's active task types
- Filter: `is_active = true` (only show active types)

**INSERT Policy:**
- Name: `task_type_configs_insert_policy`
- Only GC Admin can insert

**UPDATE Policy:**
- Name: `task_type_configs_update_policy`
- Only GC Admin can update (including soft delete by setting `is_active = false`)

**DELETE Policy:**
- Name: `task_type_configs_delete_policy`
- Only GC Admin can delete (hard delete, but soft delete is preferred)

## Acceptance Criteria
- ✅ RLS enabled on table
- ✅ All 4 policies created
- ✅ SELECT filters out inactive types
- ✅ Non-admins cannot modify task types
- ✅ Soft delete functionality works (UPDATE sets is_active = false)
- ✅ Policies tested

## SQL Template

```sql
-- Enable RLS
ALTER TABLE public.task_type_configs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their company's active task types
CREATE POLICY "task_type_configs_select_policy" ON public.task_type_configs
    FOR SELECT
    TO authenticated
    USING (company_id = get_user_company_id() AND is_active = true);

-- INSERT: GC Admin only
CREATE POLICY "task_type_configs_insert_policy" ON public.task_type_configs
    FOR INSERT
    TO authenticated
    WITH CHECK (is_user_gc_admin() AND company_id = get_user_company_id());

-- UPDATE: GC Admin only (includes soft delete)
CREATE POLICY "task_type_configs_update_policy" ON public.task_type_configs
    FOR UPDATE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());

-- DELETE: GC Admin only
CREATE POLICY "task_type_configs_delete_policy" ON public.task_type_configs
    FOR DELETE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());
```
