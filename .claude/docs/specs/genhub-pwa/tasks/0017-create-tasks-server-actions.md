# E3-T1: Create Tasks Server Actions

**Epic**: Tasks (Week 5-6)
**Effort**: Medium
**References**: Req 9-11 (Tasks), Design Section 4.2

## Description

Create comprehensive server actions for task CRUD operations, status updates, dependency management, and activity logging.

## Subtasks

### 1.1 Create task creation server action
- Create `app/actions/tasks.ts`
- Implement createTask() with Zod validation
- Required: title, project_id; Optional: phase_id, description, assignee_id, due_date, priority, planned_cost
- Verify user has access to project
- Log creation in task_activity
- Create notification for assignee if assigned
- Revalidate task list and project detail
- **Refs:** Req 9.1-9.8 (Task Creation), Design Section 4.2
- **Effort:** M
- **Files:** `app/actions/tasks.ts`

### 1.2 Create task update server action
- Add updateTask() to `app/actions/tasks.ts`
- Support all editable fields
- Log changes in task_activity with old/new values
- Notify assignee on assignment change
- **Refs:** Req 11.3 (Task Update), Design Section 4.2
- **Effort:** M
- **Files:** `app/actions/tasks.ts`

### 1.3 Create task status update server action
- Add updateTaskStatus() to `app/actions/tasks.ts`
- Handle all status transitions
- Require blocker_reason when status = blocked
- Notify PM when task is blocked
- Log status change in activity
- Update phase/project completion percentages
- **Refs:** Req 10.3 (Drag Status Change), Req 11.8 (Blocked Reason), Design Section 4.2
- **Effort:** M
- **Files:** `app/actions/tasks.ts`

### 1.4 Create task dependency management actions
- Add addTaskDependency() and removeTaskDependency()
- Validate both tasks exist and are in same project
- Prevent circular dependencies
- Auto-block dependent tasks when prerequisite incomplete
- **Refs:** Req 9.9 (Dependencies), Req 11.11 (Dependent Display), Design Section 4.2
- **Effort:** M
- **Files:** `app/actions/tasks.ts`

### 1.5 Create task comment/activity server action
- Add addTaskComment() to `app/actions/tasks.ts`
- Log comment in task_activity
- Notify task participants
- **Refs:** Req 11.5-11.6 (Task Chatroom), Design Section 4.2
- **Effort:** S
- **Files:** `app/actions/tasks.ts`

## Acceptance Criteria

- [ ] All task actions use Zod validation
- [ ] Activity logging captures all changes
- [ ] Status changes update completion percentages
- [ ] Dependencies prevent circular references
- [ ] Notifications sent for assignments and blocks
- [ ] All actions respect RLS policies

## Files to Create/Modify

- `app/actions/tasks.ts`
