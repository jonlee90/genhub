# GenHub Server Actions (77+)

## By Domain

| Domain | File | Key Actions |
|--------|------|-------------|
| Dashboard | dashboard.ts | getDashboardData |
| Projects | projects.ts | getProjects, createProject, updateProject |
| Tasks | tasks.ts | createTask, updateTask, updateTaskStatus (20 actions) |
| Materials | materials.ts | getMaterials, assignMaterial |
| Expenses | expenses.ts | getExpenses, createExpense, updateExpenseStatus |
| Team | team.ts | getTeamMembers, inviteTeamMember |
| Chat | chat.ts | getChatRooms, sendMessage |
| Spatial | spatial.ts | getSpatialMarkers, createMarker |

## Common Pattern
```typescript
const ctx = await getUserContext();
if ('error' in ctx) return ctx;
// Use ctx.supabase, ctx.userId, ctx.companyId
```

## Return Type
```typescript
Promise<{ data?: T; error?: string }>
```

## Cross-References
- Critical paths: `.claude/docs/dependency-graph.md`
- File placement: `.claude/docs/architecture-index.md`
- Context strategy: `.claude/docs/context-strategy.md`
