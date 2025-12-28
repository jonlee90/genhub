# E3-T5: Create Task Detail Panel

**Epic**: Tasks (Week 5-6)
**Effort**: Large
**References**: Req 11 (Task Detail), Design Section 5.1, 5.3

## Description

Create comprehensive task detail page with editable fields, activity timeline, dependencies management, and blocked reason modal.

## Subtasks

### 5.1 Create task detail page
- Create `app/app/tasks/[id]/page.tsx` as Server Component
- Fetch task with project, phase, assignee, activity
- Display TaskDetail component
- **Refs:** Req 10.5, 11.1 (Task Detail), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/tasks/[id]/page.tsx`

### 5.2 Create TaskDetail component
- Create `components/tasks/TaskDetail.tsx`
- Display all task fields in editable form
- Include: title, description, assignee selector, project/phase display, due date picker, priority selector, status selector, planned cost
- Save changes on blur or explicit save
- **Refs:** Req 11.2-11.3 (Task Fields), Design Section 5.3
- **Effort:** L
- **Files:** `components/tasks/TaskDetail.tsx`

### 5.3 Create TaskActivityLog component
- Create `components/tasks/TaskActivityLog.tsx`
- Display activity timeline with: timestamp, user, action, old/new values
- Show comments in timeline
- Add comment input at bottom
- **Refs:** Req 11.4-11.6 (Activity, Chatroom), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/TaskActivityLog.tsx`

### 5.4 Create TaskDependencies component
- Create `components/tasks/TaskDependencies.tsx`
- Display dependent tasks with status
- Display blocking tasks (tasks this one depends on)
- Allow adding/removing dependencies
- **Refs:** Req 11.11 (Dependent Tasks), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/TaskDependencies.tsx`

### 5.5 Create blocked reason modal
- Create `components/tasks/BlockedReasonModal.tsx`
- Open when status changed to "Blocked"
- Require reason text input
- Save reason with status update
- **Refs:** Req 11.8 (Blocked Reason), Design Section 5.3
- **Effort:** S
- **Files:** `components/tasks/BlockedReasonModal.tsx`

## Acceptance Criteria

- [ ] Task detail displays all task information
- [ ] All fields are editable (with permissions)
- [ ] Activity log shows complete task history
- [ ] Comments can be added to tasks
- [ ] Dependencies can be added/removed
- [ ] Blocked reason modal enforces reason entry
- [ ] Changes save correctly and update UI

## Files to Create/Modify

- `app/app/tasks/[id]/page.tsx`
- `components/tasks/TaskDetail.tsx`
- `components/tasks/TaskActivityLog.tsx`
- `components/tasks/TaskDependencies.tsx`
- `components/tasks/BlockedReasonModal.tsx`
