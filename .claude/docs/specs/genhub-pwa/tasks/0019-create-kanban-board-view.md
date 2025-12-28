# E3-T3: Create Kanban Board View

**Epic**: Tasks (Week 5-6)
**Effort**: Large
**References**: Req 10 (Kanban Board), Design Section 5.3

## Description

Create an interactive Kanban board with drag-and-drop functionality using @dnd-kit, showing tasks organized by status with optimistic updates.

## Subtasks

### 3.1 Create KanbanBoard component with drag-and-drop
- Create `components/tasks/KanbanBoard.tsx`
- Use @dnd-kit/core for drag-and-drop
- Create 5 columns: To Do, In Progress, Review, Blocked, Completed
- Show task count in column headers
- Handle drag end to update task status
- **Refs:** Req 10.2-10.3 (Kanban Columns, Drag), Design Section 5.3
- **Effort:** L
- **Files:** `components/tasks/KanbanBoard.tsx`

### 3.2 Create KanbanColumn component
- Create `components/tasks/KanbanColumn.tsx`
- Implement droppable area for @dnd-kit
- Display column header with title and count
- Render TaskCard components for each task
- Style blocked column with warning background
- **Refs:** Req 10.2 (Kanban Columns), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/KanbanColumn.tsx`

### 3.3 Create TaskCard component (draggable)
- Create `components/tasks/TaskCard.tsx`
- Display: title, assignee avatar, due date, priority badge
- Implement draggable for @dnd-kit
- Show material badge if task has materials
- Show overdue indicator (red) if past due date
- Show blocked icon with tooltip if blocked
- Make clickable to open task detail
- **Refs:** Req 10.6-10.8 (Task Display, Overdue, Blocked), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/TaskCard.tsx`

### 3.4 Implement optimistic updates for drag-and-drop
- Use useOptimistic hook for instant UI feedback
- Update task status optimistically on drag end
- Rollback on server error
- Show toast notification on success/error
- **Refs:** Req 10.3 (Immediate Update), Design Section 6.2
- **Effort:** M
- **Files:** `components/tasks/KanbanBoard.tsx`

## Acceptance Criteria

- [ ] Kanban board displays 5 status columns
- [ ] Drag-and-drop works smoothly between columns
- [ ] Status updates immediately with optimistic UI
- [ ] Task cards show all required information
- [ ] Overdue and blocked states visually distinct
- [ ] Error handling rolls back failed updates
- [ ] Board is responsive on desktop

## Files to Create/Modify

- `components/tasks/KanbanBoard.tsx`
- `components/tasks/KanbanColumn.tsx`
- `components/tasks/TaskCard.tsx`

## Dependencies to Install

- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
