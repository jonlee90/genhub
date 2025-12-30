# Task Modal Consistency Fix

## Issue
The edit task modal in the project detail page (`/app/projects/[id]`) did not behave identically to the edit task modal in the tasks page (`/app/tasks`).

Specifically, the `tasks` prop was not being passed to `TaskModal`, which meant:
- TaskExpensesSection could not show the task dropdown when creating expenses
- Any feature dependent on the tasks list would fail

## Root Cause
The `TaskBoard` component (used in both locations) was not passing the `tasks` prop to `TaskModal`.

### Code Flow:
1. **Tasks page** (`/app/tasks/page.tsx`):
   - Fetches tasks via `getTasks()`
   - Passes `initialTasks` to `TaskBoard`
   - TaskBoard did NOT pass tasks to TaskModal ❌

2. **Project detail page** (`/app/projects/[id]/page.tsx`):
   - Fetches project with tasks
   - Passes `project.tasks` as `initialTasks` to `TaskBoard`
   - TaskBoard did NOT pass tasks to TaskModal ❌

3. **TaskModal.tsx**:
   - Expects `tasks` prop (optional, defaults to `[]`)
   - Passes tasks to `TaskExpensesSection`

## Fix
Modified `TaskBoard.tsx` to pass `tasks={initialTasks}` to `TaskModal`.

### File Changed:
- `components/tasks/TaskBoard.tsx` (line 432)

### Change:
```tsx
// Before
<TaskModal
  isOpen={isModalOpen}
  onClose={handleModalClose}
  mode={modalMode}
  task={selectedTask}
  projects={projects}
  teamMembers={teamMembers}
  preselectedProjectId={projectId}
  onSuccess={handleModalSuccess}
/>

// After
<TaskModal
  isOpen={isModalOpen}
  onClose={handleModalClose}
  mode={modalMode}
  task={selectedTask}
  projects={projects}
  teamMembers={teamMembers}
  preselectedProjectId={projectId}
  onSuccess={handleModalSuccess}
  tasks={initialTasks}
/>
```

## Verification
Both locations now have identical behavior:
- ✅ TaskModal receives tasks list
- ✅ TaskExpensesSection can show task dropdown
- ✅ Priority-based theming works
- ✅ Task type badge shows in header
- ✅ CreatorBadge shows in footer
- ✅ All form fields are editable
- ✅ Save Changes button works correctly

## Impact
- **No breaking changes**: The tasks prop was already optional with a default value
- **Improved UX**: Both locations now have full feature parity
- **Future-proof**: Any features depending on tasks list will work in both locations

---
Date: 2025-12-30
Author: Claude Code (frontend-builder)
