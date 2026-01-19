# Skill: Task Workflow

> GenHub task management patterns - statuses, transitions, dependencies.

## When to Use

- Implementing task-related features
- User says: "task status", "task board", "kanban", "task dependencies"
- Working with task data model
- Task assignment and reassignment
- Task templates and types

## Prerequisites

- Check `.claude/docs/indexes/tables.md` for task schema
- Check `.claude/docs/indexes/actions.md` for task actions

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

### Database Tables

| Table | Purpose |
|-------|---------|
| `tasks` | Main tasks (24 columns) |
| `task_assignees` | Many-to-many with users/subcontractors |
| `task_dependencies` | Task blocking relationships |
| `task_activity` | Audit log of changes |
| `task_type_configs` | Custom task types |
| `task_templates` | Templates for phases |

### Task Statuses

| Status | Color | Transitions |
|--------|-------|-------------|
| `todo` | Gray | → in_progress, blocked |
| `in_progress` | Blue | → todo, review, blocked, completed |
| `review` | Yellow | → in_progress, completed, blocked |
| `blocked` | Red | → todo, in_progress |
| `completed` | Green | → in_progress (reopen) |

### Task Types & Priorities
```typescript
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
type TaskType = 'work' | 'purchase' | 'approval' | 'admin'
```

---

## Data Model

### Task Assignees Pattern (IMPORTANT)

Tasks use **many-to-many** assignments with a **primary assignee** flag:

```sql
-- task_assignees table
task_assignees (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  user_id uuid REFERENCES user_profiles(id),  -- nullable
  subcontractor_id uuid REFERENCES subcontractors(id),  -- nullable
  is_primary boolean DEFAULT false,
  -- CHECK: Either user_id OR subcontractor_id (XOR)
)
```

### Query Pattern for Assignees
```typescript
// Get task with all assignees
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    task_assignees (
      id,
      is_primary,
      user:user_profiles (*),
      subcontractor:subcontractors (*)
    )
  `)
  .eq('id', taskId)
  .single()

// Get primary assignee
const primary = data.task_assignees.find(a => a.is_primary)
```

### Related Tables

- `task_dependencies` - Task blocking relationships (depends_on)
- `task_activity` - Audit log of changes
- `material_assignments` - Materials linked to task
- `expenses` - Expenses linked to task
- `spatial_markers` - 3D location markers

---

## Server Actions

### Key Actions (tasks.ts)

| Action | Purpose |
|--------|---------|
| `createTask` | Create new task |
| `updateTask` | Update task fields |
| `updateTaskStatus` | Change task status |
| `updateTaskDueDate` | Update due date |
| `updateTaskDates` | Update start/due dates |
| `deleteTask` | Delete task |
| `setPrimaryAssignee` | Set primary assignee |
| `updateTaskWithExpense` | Update task + create expense |
| `addTaskDependency` | Add dependency |
| `removeTaskDependency` | Remove dependency |
| `addTaskComment` | Add comment to activity |
| `updateApprovalStatus` | Set approval status |
| `getProjectTasks` | Get tasks for project |
| `getProjectAssignees` | Get team for task assignment |
| `getTaskDetails` | Full task details |
| `getTaskActivity` | Activity log |
| `getTaskAttachments` | Attached files |
| `getTaskDependencies` | Get dependencies |
| `getTaskAnalytics` | Task statistics |
| `linkTaskToMarker` | Link to spatial marker |
| `getTasksByMarker` | Tasks for marker |
| `logTaskCompletionToMarker` | Log completion to marker |

### Task Types & Templates

| File | Actions |
|------|---------|
| `task-types.ts` | `getTaskTypes`, `getAllTaskTypes`, `createTaskType`, `updateTaskType`, `deleteTaskType` |
| `task-templates.ts` | `getTaskTemplates`, `createTaskTemplate`, `updateTaskTemplate`, `deleteTaskTemplate`, `reorderTaskTemplates` |

### Status Update Pattern
```typescript
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

  // Update with blocked_reason handling
  const updateData = { status };
  if (status === 'blocked' && blockedReason) {
    updateData.blocked_reason = blockedReason;
  }

  // Log to task_activity
  await logTaskActivity(ctx.supabase, id, 'status_change', {
    from: task.status,
    to: status,
  });

  revalidatePath('/app/tasks');
  return { data };
}
```

### Assignment Pattern
```typescript
export async function setPrimaryAssignee(
  taskId: string,
  assigneeId: string,
  assigneeType: 'user' | 'subcontractor'
) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Clear existing primary
  await ctx.supabase
    .from('task_assignees')
    .update({ is_primary: false })
    .eq('task_id', taskId);

  // Set new primary
  const assigneeField = assigneeType === 'user'
    ? { user_id: assigneeId }
    : { subcontractor_id: assigneeId };

  await ctx.supabase
    .from('task_assignees')
    .upsert({
      task_id: taskId,
      ...assigneeField,
      is_primary: true,
    });
}
```

---

## UI Components

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TaskModal` | `components/tasks/` | View/edit task modal |
| `TaskModalTrigger` | `components/tasks/` | Trigger for task modal |
| `TaskBoard` | `components/tasks/` | Kanban-style board |
| `TaskCard` | `components/tasks/` | Task card in board |
| `StatusBadge` | `components/shared/` | Status indicator |
| `PriorityBadge` | `components/shared/` | Priority indicator |

### Status Config Pattern
```typescript
const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};
```

### Valid Transitions
```typescript
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['todo', 'review', 'blocked', 'completed'],
  review: ['in_progress', 'completed', 'blocked'],
  blocked: ['todo', 'in_progress'],
  completed: ['in_progress'], // Reopen only
};
```

---

## Anti-Patterns

```typescript
// WRONG: Using old single-assignee pattern
task.assignee_id = userId;
// Tasks now use many-to-many via task_assignees

// CORRECT: Use task_assignees table
await supabase.from('task_assignees').insert({
  task_id: taskId,
  user_id: userId,
  is_primary: true,
});

// WRONG: Not checking valid transitions
await updateTaskStatus(taskId, 'completed');
// Should validate transition is allowed

// WRONG: Forgetting blocked_reason
await updateTaskStatus(taskId, 'blocked');
// Should include reason: updateTaskStatus(taskId, 'blocked', reason)

// WRONG: Not logging activity
await supabase.from('tasks').update({ status });
// Should log to task_activity
```

---

## Checklist

- [ ] Status transition validated via `isValidTransition`
- [ ] Activity logged via `logTaskActivity`
- [ ] Blocked reason captured when blocking
- [ ] Assignees use `task_assignees` table (many-to-many)
- [ ] Primary assignee set with `is_primary: true`
- [ ] Dependencies checked via `task_dependencies`
- [ ] Use `getUserContext()` for auth
- [ ] `revalidatePath` called after mutations
- [ ] Task templates link to phases correctly
