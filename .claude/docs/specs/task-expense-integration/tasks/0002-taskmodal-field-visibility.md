# Task 2: TaskModal Field Visibility Integration

## Status
✅ Completed

## Dependencies
- Task 1: Field Visibility Configuration (✅ Completed)

## Overview
Refactor TaskModal to use the field visibility configuration system, implementing conditional rendering based on task type and mode (create/edit).

## Subtasks

### 2.1 Import and Setup Field Visibility Config
**File:** `/components/tasks/TaskModal.tsx`

- Import `getTaskTypeConfig`, `isFieldVisible` from `/lib/config/task-type-fields`
- Get current task type from form state or existing task data
- Determine mode ('create' or 'edit') based on whether task prop exists
- Store config in component state/memo

**Reference:** Req 10.1

---

### 2.2 Conditional Rendering: Phase Field
- Wrap Phase select field with visibility check: `isFieldVisible(taskType, 'phase', mode)`
- Admin tasks should not show Phase field
- Test with admin task type

**Reference:** Req 4.2, Req 10.1

---

### 2.3 Conditional Rendering: Start Date Field
- Wrap Start Date field with visibility check: `isFieldVisible(taskType, 'startDate', mode)`
- Admin tasks should not show Start Date field
- When visible and creating, default to today's date
- Apply default in form initialization

**Reference:** Req 1.6, Req 2.7, Req 3.7, Req 4.2, Req 10.1

---

### 2.4 Conditional Rendering: Cost Fields
- Wrap Planned Cost field: `isFieldVisible(taskType, 'plannedCost', mode)`
- Wrap Actual Cost field: `isFieldVisible(taskType, 'actualCost', mode)`
- Approval and Admin tasks should not show cost fields
- Ensure actualCost only shows in edit mode

**Reference:** Req 3.2, Req 4.2, Req 10.1

---

### 2.5 Dynamic Cost Field Labels
- Get `config.labels.plannedCost` from task type config
- Display "Labor Cost" for work tasks
- Display "Budget" for purchase tasks
- Display "Planned Cost" as fallback
- Update label element dynamically

**Reference:** Req 1.5, Req 2.4, Req 10.2-10.3

---

### 2.6 Task Type Default Values
- When task type is 'admin', default priority to 'low'
- When creating work/purchase/approval tasks, default startDate to today
- Apply defaults in form initialization/reset logic
- Use `config.defaults` from task type config

**Reference:** Req 4.3, Req 10.5

---

### 2.7 Conditional Rendering: Materials Section
- Wrap TaskMaterialsManager with: `isFieldVisible(taskType, 'materialsSection', mode)`
- Only Purchase tasks should show Materials section
- Test visibility with different task types

**Reference:** Req 1.2, Req 2.1, Req 3.3, Req 10.1

---

### 2.8 Materials Section Emphasized Styling
- Get `config.styling.materialsEmphasized` from task type config
- When true, apply emerald/green border highlight (`border-emerald-200`)
- Add "Required for Purchase Tasks" indicator text
- Only apply to Purchase task type

**Reference:** Req 2.2-2.3

---

### 2.9 Conditional Rendering: Approval Workflow Section
- Wrap approval workflow components: `isFieldVisible(taskType, 'approvalWorkflow', mode)`
- Only Approval tasks should show workflow section
- Display Approve/Reject/Request Revision buttons in edit mode only
- Test with approval task type

**Reference:** Req 3.1, Req 3.5-3.6, Req 10.1

---

### 2.10 Approval Status Badge in Header
- Check `config.styling.headerBadge === 'approval_status'`
- Display badge with current approval_status value in task header
- Apply status-based colors (pending=yellow, approved=green, rejected=red)
- Only show for Approval task type

**Reference:** Req 10.4

---

## Testing Checklist
- [x] Admin task: Phase hidden, Start Date hidden, cost fields hidden, priority defaults to 'low'
- [x] Work task: Materials hidden, cost label = "Labor Cost", expenses section visible (edit)
- [x] Purchase task: Materials visible with green border, cost label = "Budget"
- [x] Approval task: Cost fields hidden, approval workflow visible, status badge in header
- [x] All task types: Correct fields visible in create vs edit mode

## Files Modified
- `/components/tasks/TaskModal.tsx` (major refactor)

## Estimated Complexity
🔴 High - Large component with many conditional branches
