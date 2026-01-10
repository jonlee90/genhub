# GenHub Database Schema

## Key Tables (42 total)

| Table | Purpose |
|-------|---------|
| companies | Company accounts |
| projects | Project management |
| tasks | Task tracking |
| task_assignees | Multi-assignee junction |
| materials | Material catalog |
| expenses | Expense tracking |
| chat_rooms, messages | Real-time chat |
| spatial_markers | 3D markers |

## Hierarchy
```
companies
├── projects
│   ├── project_phases
│   ├── tasks → task_assignees, material_assignments
│   ├── expenses → expense_line_items
│   └── chat_rooms → messages
├── materials
└── subcontractors
```

## RLS Pattern
All data scoped by `company_id`:
```sql
company_id = public.get_user_company_id(next_auth.uid())
```

## Stats
- 42 tables, 100% RLS coverage
- Deep dive: `.claude/docs/indexes/tables.md`
