# Task 3.6: Create ProjectType Delete Confirmation

## Objective
Build delete confirmation dialog with usage check.

## References
- Requirements §1.6-1.7 (Delete project type)

## Files to Modify
- `components/settings/ProjectTypeManager.tsx`

## Dialog Features
- Check if type is in use
- Show warning if assigned to projects
- Disable delete if count > 0
- Cascading delete warning
- Toast notifications

## Acceptance Criteria
- ✅ Cannot delete types in use
- ✅ Warning shown about cascading delete
- ✅ Confirmation dialog displays
- ✅ Delete works correctly
- ✅ Reloads table on success
