# Tasks Domain Reference

> Task management patterns for GenHub

Last updated: 2026-01-09

---

## Overview

Tasks are the core work units in GenHub. Each task belongs to a phase within a project and can have materials, expenses, and spatial markers linked to it.

---

## Data Model

### Task Table
```sql
tasks (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  phase_id uuid REFERENCES phases(id),

  -- Core fields
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',

  -- Assignment
  assignee_id uuid REFERENCES next_auth.users(id),
  created_by uuid REFERENCES next_auth.users(id),

  -- Scheduling
  start_date date,
  due_date date,
  completed_at timestamptz,
  estimated_hours decimal(6,2),
  actual_hours decimal(6,2),

  -- Dependencies
  parent_task_id uuid REFERENCES tasks(id),
  blocked_by uuid[],  -- Array of task IDs

  -- Metadata
  tags text[],
  order_index integer DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz
)
```

---

## Relationships

```
phases
  └── tasks (1:N)
        ├── materials (1:N)
        ├── expenses (1:N)
        ├── spatial_markers (1:N)
        ├── task_comments (1:N)
        ├── task_attachments (1:N)
        └── subtasks (1:N, self-reference)
```

---

## Server Actions

### Location
`app/actions/tasks.ts`

### Available Actions

| Action | Purpose | Auth |
|--------|---------|------|
| getTasks | List tasks with filters | user |
| getTask | Get single task with details | user |
| createTask | Create new task | user |
| updateTask | Update task fields | user |
| updateTaskStatus | Change status (workflow) | user |
| deleteTask | Soft delete task | owner |
| reorderTasks | Update order_index | user |
| assignTask | Assign to user | manager |

### Key Patterns

```typescript
// Get tasks for Kanban view
export async function getTasksByStatus(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!assignee_id(id, name, image),
      material_count:materials(count),
      marker_count:spatial_markers(count)
    `)
    .eq('project_id', projectId)
    .order('order_index')

  // Group by status for Kanban
  const grouped = {
    todo: data?.filter(t => t.status === 'todo') || [],
    in_progress: data?.filter(t => t.status === 'in_progress') || [],
    blocked: data?.filter(t => t.status === 'blocked') || [],
    done: data?.filter(t => t.status === 'done') || [],
  }

  return { data: grouped, error }
}
```

---

## UI Components

### Location
`components/tasks/`

### Key Components

| Component | Purpose |
|-----------|---------|
| TaskBoard | Kanban view with drag-drop |
| TaskList | Table/list view |
| TaskCard | Card in Kanban column |
| TaskDetail | Full task detail panel |
| TaskForm | Create/edit form |
| TaskFilters | Status/priority/assignee filters |

### Kanban Implementation
```tsx
// Uses @dnd-kit for drag-and-drop
import { DndContext, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
  {columns.map(column => (
    <KanbanColumn key={column.id} status={column.id}>
      <SortableContext items={column.tasks} strategy={verticalListSortingStrategy}>
        {column.tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </KanbanColumn>
  ))}
</DndContext>
```

---

## Business Rules

### Status Flow
```
todo → in_progress → done
todo → blocked → in_progress → done
in_progress → blocked → in_progress
done → in_progress  (reopen)
```

### Status Transitions
| From | To | Requires |
|------|-----|----------|
| todo | in_progress | - |
| todo | blocked | blocked_by set |
| in_progress | done | - |
| in_progress | blocked | blocked_by set |
| blocked | in_progress | blocked_by resolved |
| done | in_progress | - |

### Priority Rules
- **Critical**: Must complete today
- **High**: Complete this week
- **Medium**: Complete this phase
- **Low**: Nice to have

### Due Date Warnings
```typescript
function getDueDateStatus(dueDate: Date): 'overdue' | 'due_soon' | 'ok' {
  const today = new Date()
  const due = new Date(dueDate)
  const daysUntil = differenceInDays(due, today)

  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 2) return 'due_soon'
  return 'ok'
}
```

---

## Access Control

### RLS Policy
```sql
-- Project-scoped access
CREATE POLICY "tasks_company_access" ON tasks
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE company_id = get_user_company_id(next_auth.uid())
    )
  );
```

### Role Permissions

| Action | Owner | Admin | Manager | Member | Viewer |
|--------|-------|-------|---------|--------|--------|
| View | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | - |
| Update own | ✓ | ✓ | ✓ | ✓ | - |
| Update any | ✓ | ✓ | ✓ | - | - |
| Delete | ✓ | ✓ | ✓ | - | - |
| Assign | ✓ | ✓ | ✓ | - | - |

---

## See Also

- `skills/domain/task-workflow.md` - Task patterns
- `docs/backend/SCHEMA_CORE.md` - Full schema
- `docs/indexes/actions.md` - Action quick reference
