# GenHub Domain: Projects

## Status Workflow
```
active → on_hold → completed → archived
```

## Enums
- **Status**: active | on_hold | completed | archived
- **Phase Status**: not_started | in_progress | completed

## Tables
- `projects` - Primary (→ companies)
- `project_phases` - 5 default phases per project
- `project_team` - Member assignments (→ projects, users)
- `project_files` - Documents with versioning
- `project_photos` - Photos with categories

## Phase System
```typescript
// Default 5 phases auto-created on project creation
phases: ['Pre-Construction', 'Foundation', 'Framing', 'MEP', 'Finishing']
// Custom phases can be added
```

## Team Assignment
```typescript
// Junction table for project members
project_team: {
  project_id, user_id, role // role from user_role enum
}
```

## Key Actions (app/actions/projects.ts)
| Action | Purpose |
|--------|---------|
| createProject | Create project |
| updateProject | Update fields |
| deleteProject | Delete project |
| getProjects | List company projects |
| getProjectById | Get single project |
| getProjectSummary | Dashboard stats |

## Phase Actions (app/actions/phases.ts)
| Action | Purpose |
|--------|---------|
| getProjectPhases | List phases |
| updatePhase | Update phase |
| updatePhaseStatus | Change status |

## Budget Tracking
- `budget` field on projects table
- Compare with expense totals
- Alert on overrun via notifications

## Common Patterns
- All project data scoped by company_id
- Team access checked via project_team membership
- Revalidate `/app/projects/[id]` after mutations

## Gotchas
- Can't delete project with active tasks
- Primary photo set via `setProjectPrimaryPhoto`
- Phases ordered by `order_index`