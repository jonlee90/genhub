# E3-T6: Create Task Creation Flow

**Epic**: Tasks (Week 5-6)
**Effort**: Medium
**References**: Req 9 (Task Creation), Design Section 5.3

## Description

Create task creation form component and quick inline task creation for Kanban columns.

## Subtasks

### 6.1 Create CreateTaskForm component
- Create `components/tasks/CreateTaskForm.tsx`
- Use useActionState with createTask action
- Project selector (required)
- Phase selector (optional, filtered by project)
- All task fields with validation
- Show in modal or dedicated page
- **Refs:** Req 9.1-9.7 (Task Creation), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/CreateTaskForm.tsx`

### 6.2 Create quick task creation inline
- Add inline task creation to KanbanColumn
- Simple input field at bottom of column
- Creates task with default status matching column
- **Refs:** Req 9 (Task Creation), Design Section 5.3
- **Effort:** S
- **Files:** `components/tasks/QuickTaskInput.tsx`

## Acceptance Criteria

- [ ] Task creation form displays all required fields
- [ ] Phase selector filters by selected project
- [ ] Form validation works correctly
- [ ] Quick task input creates tasks inline
- [ ] Created tasks appear immediately in UI
- [ ] Form is accessible and keyboard navigable

## Files to Create/Modify

- `components/tasks/CreateTaskForm.tsx`
- `components/tasks/QuickTaskInput.tsx`
