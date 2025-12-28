# E3-T4: Create List View

**Epic**: Tasks (Week 5-6)
**Effort**: Medium
**References**: Req 10 (Task Board), Design Section 5.3

## Description

Create a sortable list view for tasks displayed in table format with inline editing capabilities for quick status and priority changes.

## Subtasks

### 4.1 Create TaskList component
- Create `components/tasks/TaskList.tsx`
- Display tasks in sortable table format
- Columns: Title, Project, Phase, Assignee, Due Date, Priority, Status
- Support sorting by clicking column headers
- **Refs:** Req 10.4 (List View), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/TaskList.tsx`

### 4.2 Create TaskRow component with inline editing
- Create `components/tasks/TaskRow.tsx`
- Display all task info in row format
- Enable inline status change via dropdown
- Enable inline priority change via dropdown
- Make row clickable to open task detail
- **Refs:** Req 10.4 (Fast Editing), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/TaskRow.tsx`

## Acceptance Criteria

- [ ] List view displays all task information
- [ ] Columns are sortable (ascending/descending)
- [ ] Inline status changes work correctly
- [ ] Inline priority changes work correctly
- [ ] Row click navigates to task detail
- [ ] List is responsive and readable on mobile

## Files to Create/Modify

- `components/tasks/TaskList.tsx`
- `components/tasks/TaskRow.tsx`
