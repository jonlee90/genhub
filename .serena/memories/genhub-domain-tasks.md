# GenHub Domain: Tasks

## Status Workflow
```
todo → in_progress → review → blocked → completed
```

## Enums
- **Priority**: low | medium | high | critical
- **Type**: work | purchase | approval | admin
- **Approval**: pending | approved | rejected | revision_requested

## Tables
- `tasks` - Primary task records (→ projects, phases)
- `task_assignees` - Junction (→ tasks, users, subcontractors)
- `task_dependencies` - Blocking (blocking_task_id → blocked_task_id)
- `task_activity` - Audit log

## Assignee Pattern
```typescript
// Supports BOTH users AND subcontractors
task_assignees: {
  task_id, user_id?, subcontractor_id?
}
// Multiple assignees per task allowed
```

## Key Actions (app/actions/tasks.ts)
| Action | Purpose |
|--------|---------|
| createTask | Create task |
| updateTask | Update fields |
| updateTaskStatus | Change status |
| deleteTask | Delete task |
| addTaskDependency | Add blocking |
| removeTaskDependency | Remove blocking |
| getProjectTasks | List by project |
| getTaskDetails | Full details |
| getTaskActivity | History log |
| updateApprovalStatus | Approval workflow |
| linkTaskToMarker | Spatial link |

## Common Patterns
- Check dependencies before status → completed
- Log all changes to task_activity
- Revalidate `/app/tasks` after mutations

## Gotchas
- Can't complete if blocking tasks unfinished
- assignee is junction table, not direct column
- Always use `getProjectAssignees()` for dropdown