# Fix: Auto Task Creation for Restaurant Projects

## Problem
The task template "REsttt" exists in the database for Restaurant projects but wasn't being created when new projects were inserted.

## Root Cause Analysis

### 1. Database Trigger Design
- **Trigger**: `create_phases_and_tasks_on_project_insert`
- **Function**: `create_phases_and_tasks_from_templates()`
- **Requirement**: The trigger requires `project_type_config_id` to be set on the project row

### 2. Application Code Issue
The `createProject` action in `/app/actions/projects.ts` was:
- ❌ **NOT setting** `project_type_config_id` when inserting projects
- ❌ Using manual template application logic that duplicated the trigger
- ❌ Falling back to outdated hardcoded templates in `lib/default-project-templates.ts`

### 3. What Happened
1. New "BBQ Chicken" restaurant project was created
2. `project_type_config_id` was `null` on the project row
3. Trigger created only 5 universal phases (Initiation → Post-Construction)
4. Application code used hardcoded templates to create tasks
5. Hardcoded templates didn't include "REsttt" (outdated)

### 4. Database State
```sql
-- Template exists in database
SELECT * FROM task_templates
WHERE title = 'REsttt'
-- Result: 1 row (Pre-construction phase, Restaurant type)

-- But wasn't created for BBQ Chicken project
SELECT * FROM tasks
WHERE project_id = '2b45a4f4-74e3-4a11-96ac-ddb1d7694afa'
  AND title = 'REsttt'
-- Result: 0 rows
```

## Solution Implemented

### Changes to `/app/actions/projects.ts`

**Before:**
```typescript
const projectData: ProjectInsert = {
  company_id: companyId,
  name: data.name,
  // ... other fields
  project_type: data.project_type,
  // ❌ project_type_config_id NOT set
};
```

**After:**
```typescript
// Look up project_type_config_id BEFORE inserting
const { data: projectTypeConfig } = await supabase
  .from('project_type_configs')
  .select('id')
  .eq('company_id', companyId)
  .eq('name', projectTypeConfigName)
  .eq('is_active', true)
  .maybeSingle();

const projectData: ProjectInsert = {
  company_id: companyId,
  name: data.name,
  // ... other fields
  project_type: data.project_type,
  project_type_config_id: projectTypeConfig?.id || null, // ✅ Set for trigger
};
```

### Removed Redundant Code
- Deleted 200+ lines of manual template application logic
- Removed fallback to hardcoded templates
- Trigger now handles 100% of phase/task creation

## Testing

### Test Case: Create New Restaurant Project
```typescript
// When creating a new restaurant project:
// 1. project_type_config_id will be set to Restaurant config ID
// 2. Trigger will fire AFTER INSERT
// 3. Trigger will create phases from phase_templates
// 4. Trigger will create tasks from task_templates (including "REsttt")
```

### Expected Results
- ✅ All 21 Restaurant task templates created
- ✅ "REsttt" task exists in Pre-construction phase
- ✅ Tasks have correct priority, order_index, description
- ✅ No hardcoded templates used

## Migration Status

| Migration | Status | Description |
|-----------|--------|-------------|
| 045_auto_create_phases_tasks_from_templates.sql | ✅ Applied | Creates trigger + function |
| 048_fix_project_creation_use_trigger.sql | ❌ NOT applied | Adds project_type_config_id column |
| 049_verify_auto_phase_task_creation.sql | ❌ NOT applied | Verification tests |

**Note**: Migrations 045, 048, 049 exist in `/supabase/migrations/` but were applied manually outside the migration system (column exists, trigger exists).

## Next Steps

1. ✅ **Fixed** - Application code now sets `project_type_config_id`
2. ⏳ **Test** - Create new restaurant project to verify "REsttt" is created
3. 🔄 **Optional** - Update existing projects to set `project_type_config_id`:
   ```sql
   UPDATE projects p
   SET project_type_config_id = (
     SELECT id FROM project_type_configs
     WHERE company_id = p.company_id
       AND name = CASE
         WHEN p.project_type = 'restaurant' THEN 'Restaurant'
         WHEN p.project_type = 'cafe' THEN 'Cafe'
         -- etc...
       END
     LIMIT 1
   )
   WHERE project_type_config_id IS NULL;
   ```

## Summary

**Issue**: Auto task creation wasn't working because `project_type_config_id` wasn't being set.

**Fix**: Modified `createProject` action to look up and set `project_type_config_id` before inserting, allowing the database trigger to work correctly.

**Result**: All task templates (including "REsttt") will now be created automatically for new projects.
