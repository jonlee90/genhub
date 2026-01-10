# Skill: Task Workflow

> GenHub task management patterns - statuses, transitions, dependencies.

## When to Use

- Implementing task-related features
- User says: "task status", "task board", "kanban", "task dependencies"
- Working with task data model

## Prerequisites

- Understanding of GenHub task states
- Access to task-related Server Actions

---

## Quick Reference

### Task Status Flow

```
┌─────────┐     ┌─────────────┐     ┌────────┐     ┌───────────┐
│  todo   │ ──► │ in_progress │ ──► │ review │ ──► │ completed │
└─────────┘     └─────────────┘     └────────┘     └───────────┘
     │                │                  │
     │                ▼                  │
     │          ┌─────────┐              │
     └────────► │ blocked │ ◄────────────┘
                └─────────┘
```

### Task Statuses

| Status | Description | Color | Can Transition To |
|--------|-------------|-------|-------------------|
| `todo` | Not started | Gray | in_progress, blocked |
| `in_progress` | Active work | Blue | todo, review, blocked, completed |
| `review` | Awaiting approval | Yellow | in_progress, completed, blocked |
| `blocked` | Cannot proceed | Red | todo, in_progress |
| `completed` | Done | Green | in_progress (reopen) |

### Task Types

| Type | Description | Icon |
|------|-------------|------|
| `work` | Standard task | Wrench |
| `purchase` | Material purchase | ShoppingCart |
| `approval` | Needs sign-off | CheckCircle |
| `admin` | Administrative | FileText |

### Task Priorities

| Priority | Description | Color |
|----------|-------------|-------|
| `low` | Can wait | Gray |
| `medium` | Normal priority | Blue |
| `high` | Urgent | Orange |
| `critical` | Emergency | Red |

---

## Data Model

### Task Table (Key Columns)

```typescript
interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  phase_id: string | null;
  assignee_id: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  task_type: 'work' | 'purchase' | 'approval' | 'admin';
  start_date: string | null;
  due_date: string | null;
  planned_cost: number | null;
  actual_cost: number | null;
  blocked_reason: string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | 'revision_requested' | null;
  created_at: string;
  updated_at: string;
}
```

### Related Tables

- `task_dependencies` - Task blocking relationships
- `task_activity` - Audit log of changes
- `material_assignments` - Materials linked to task
- `expenses` - Expenses linked to task

---

## Server Actions

### Status Update

```typescript
// app/actions/tasks.ts
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  blockedReason?: string
) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Validate transition
  const { data: task } = await ctx.supabase
    .from('tasks')
    .select('status')
    .eq('id', id)
    .single();

  if (!isValidTransition(task.status, status)) {
    return { error: `Cannot transition from ${task.status} to ${status}` };
  }

  const updateData: TaskUpdate = { status };
  if (status === 'blocked' && blockedReason) {
    updateData.blocked_reason = blockedReason;
  }
  if (status !== 'blocked') {
    updateData.blocked_reason = null;
  }

  const { data, error } = await ctx.supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  // Log activity
  await logTaskActivity(ctx.supabase, id, 'status_change', {
    from: task.status,
    to: status,
  });

  revalidatePath('/app/tasks');
  return { data };
}
```

### Transition Validation

```typescript
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['todo', 'review', 'blocked', 'completed'],
  review: ['in_progress', 'completed', 'blocked'],
  blocked: ['todo', 'in_progress'],
  completed: ['in_progress'], // Reopen
};

function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## UI Patterns

### Status Badge

```tsx
const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
```

### Kanban Board

```tsx
const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed'];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const tasksByStatus = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
        />
      ))}
    </div>
  );
}
```

### Task Card

```tsx
export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-2">{task.title}</h3>
        <TaskPriorityIcon priority={task.priority} />
      </div>

      {task.due_date && (
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <TaskStatusBadge status={task.status} />
        {task.assignee && (
          <Avatar src={task.assignee.avatar_url} size="sm" />
        )}
      </div>
    </div>
  );
}
```

---

## Examples

### Example 1: Status Dropdown

```tsx
export function TaskStatusSelect({ task, onUpdate }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleChange(newStatus: TaskStatus) {
    setIsUpdating(true);
    const result = await updateTaskStatus(task.id, newStatus);
    if (result.error) {
      toast.error(result.error);
    }
    setIsUpdating(false);
  }

  const validTransitions = VALID_TRANSITIONS[task.status];

  return (
    <select
      value={task.status}
      onChange={(e) => handleChange(e.target.value as TaskStatus)}
      disabled={isUpdating}
      className="..."
    >
      <option value={task.status}>{STATUS_CONFIG[task.status].label}</option>
      {validTransitions.map(status => (
        <option key={status} value={status}>
          {STATUS_CONFIG[status].label}
        </option>
      ))}
    </select>
  );
}
```

### Example 2: Block Task with Reason

```tsx
export function BlockTaskModal({ task, isOpen, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleBlock() {
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const result = await updateTaskStatus(task.id, 'blocked', reason);
    if (result.error) {
      toast.error(result.error);
    } else {
      onClose();
    }
    setIsSubmitting(false);
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Block Task">
      <div className="space-y-4">
        <p className="text-gray-600">
          Why is this task blocked?
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the blocker..."
          rows={3}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBlock}
            disabled={!reason.trim() || isSubmitting}
            className="bg-red-600"
          >
            {isSubmitting ? 'Blocking...' : 'Block Task'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
```

### Example 3: Task Dependencies

```typescript
// Check if task can be started (all dependencies completed)
export async function canStartTask(taskId: string) {
  const supabase = await createClient();

  const { data: dependencies } = await supabase
    .from('task_dependencies')
    .select(`
      depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(
        id, status
      )
    `)
    .eq('task_id', taskId);

  const blockers = dependencies?.filter(
    d => d.depends_on_task.status !== 'completed'
  );

  return {
    canStart: blockers?.length === 0,
    blockers: blockers?.map(b => b.depends_on_task),
  };
}
```

---

## Anti-Patterns

- **Never** allow invalid status transitions - always validate
- **Never** skip activity logging - audit trail is important
- **Never** forget blocked_reason when transitioning to blocked
- **Never** hardcode status colors - use STATUS_CONFIG
- **Never** show all statuses in Kanban - exclude 'blocked'

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/law/DB_SCHEMA.md` | Task schema reference |
| `docs/domain/TASKS.md` | Task workflow details |

---

## Checklist

- [ ] Status transition is validated
- [ ] Activity is logged on status change
- [ ] Blocked reason captured when blocking
- [ ] UI reflects all possible statuses
- [ ] Dependencies checked before starting
- [ ] Mobile-friendly task cards
