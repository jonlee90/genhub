# E3-T2: Create Task Board Page

**Epic**: Tasks (Week 5-6)
**Effort**: Medium
**References**: Req 10 (Task Board), Design Section 5.1-5.2

## Description

Create the task board page with server-side data fetching, view toggle between Kanban and List views, and task filtering.

## Subtasks

### 2.1 Create tasks page with view toggle
- Create `app/app/tasks/page.tsx` as Server Component
- Fetch all tasks for user's company
- Support URL param for view mode (kanban/list)
- Pass tasks to TaskBoard client component
- **Refs:** Req 10.1 (View Toggle), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/tasks/page.tsx`

### 2.2 Create TaskBoard container component
- Create `components/tasks/TaskBoard.tsx`
- Implement view toggle (Kanban/List buttons)
- Apply task filters (assignee, project, phase, priority)
- Persist view preference in URL and localStorage
- **Refs:** Req 10.1 (Toggle), Req 10.9 (Filters), Design Section 5.2
- **Effort:** M
- **Files:** `components/tasks/TaskBoard.tsx`

### 2.3 Create TaskFilters component
- Create `components/tasks/TaskFilters.tsx`
- Filter by: assignee, project, phase, priority
- Search by task title
- Store in URL params for shareability
- **Refs:** Req 10.9 (Task Filtering), Design Section 5.2
- **Effort:** M
- **Files:** `components/tasks/TaskFilters.tsx`

## Acceptance Criteria

- [ ] Tasks page displays all company tasks
- [ ] View toggle switches between Kanban and List
- [ ] View preference persists across sessions
- [ ] Filters work correctly and update URL
- [ ] Search filters by task title
- [ ] Empty states display appropriate messages

## Files to Create/Modify

- `app/app/tasks/page.tsx`
- `components/tasks/TaskBoard.tsx`
- `components/tasks/TaskFilters.tsx`
