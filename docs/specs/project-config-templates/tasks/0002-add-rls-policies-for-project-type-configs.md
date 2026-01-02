# Task 1.2: Add RLS policies for project_type_configs

## Objective
Create Row Level Security policies for project_type_configs table to enforce company-scoped access control.

## References
- Requirements §1.1-1.7 (Project Type Management)
- Design Migration 1

## Implementation Details

### Files to Modify
- `supabase/migrations/035_project_type_configs.sql` (same file from 1.1)

### RLS Policies

**Enable RLS:**
```sql
ALTER TABLE public.project_type_configs ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy:**
- Name: `project_type_configs_select_policy`
- Users can view their company's project types
- Use: `get_user_company_id()` helper function

**INSERT Policy:**
- Name: `project_type_configs_insert_policy`
- Only GC Admin can insert
- Use: `is_user_gc_admin()` helper function

**UPDATE Policy:**
- Name: `project_type_configs_update_policy`
- Only GC Admin can update their company's types
- Check: `is_user_gc_admin() AND company_id = get_user_company_id()`

**DELETE Policy:**
- Name: `project_type_configs_delete_policy`
- Only GC Admin can delete their company's types
- Check: `is_user_gc_admin() AND company_id = get_user_company_id()`

## Acceptance Criteria
- ✅ RLS enabled on table
- ✅ All 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- ✅ Non-admins cannot modify data (INSERT/UPDATE/DELETE blocked)
- ✅ Users can only view their company's data
- ✅ Policies tested with different user roles

## SQL Template

```sql
-- Enable RLS
ALTER TABLE public.project_type_configs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their company's project types
CREATE POLICY "project_type_configs_select_policy" ON public.project_type_configs
    FOR SELECT
    TO authenticated
    USING (company_id = get_user_company_id());

-- INSERT: GC Admin only
CREATE POLICY "project_type_configs_insert_policy" ON public.project_type_configs
    FOR INSERT
    TO authenticated
    WITH CHECK (is_user_gc_admin() AND company_id = get_user_company_id());

-- UPDATE: GC Admin only, own company
CREATE POLICY "project_type_configs_update_policy" ON public.project_type_configs
    FOR UPDATE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());

-- DELETE: GC Admin only, own company
CREATE POLICY "project_type_configs_delete_policy" ON public.project_type_configs
    FOR DELETE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());
```
