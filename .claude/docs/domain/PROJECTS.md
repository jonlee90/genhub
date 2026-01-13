# Projects Domain Reference

> Project management patterns for GenHub

Last updated: 2026-01-12

---

## Overview

Projects are the top-level organizational unit in GenHub. Each project belongs to a company and contains phases, tasks, materials, expenses, and spatial models.

---

## Data Model

### Project Table
```sql
projects (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  description text,
  status project_status DEFAULT 'active',
  current_phase project_phase DEFAULT 'initiation',
  health integer DEFAULT 100,  -- 0-100
  address text,
  start_date date,
  target_end_date date,
  budget decimal(12,2),
  created_at timestamptz,
  updated_at timestamptz
)
```

### Phase Table
```sql
phases (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  phase_type project_phase NOT NULL,
  name text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  progress integer DEFAULT 0,
  start_date date,
  end_date date,
  order_index integer DEFAULT 0
)
```

---

## Relationships

```
companies
  └── projects (1:N)
        ├── phases (1:N)
        │     └── tasks (1:N)
        ├── materials (1:N)
        ├── expenses (1:N)
        ├── ifc_models (1:N)
        └── daily_reports (1:N)
```

---

## Server Actions

### Location
`app/actions/projects.ts`

### Available Actions

| Action | Purpose | Auth |
|--------|---------|------|
| createProject | Create new project | admin |
| updateProject | Update project fields | admin |
| updateProjectStatus | Update project status | admin/pm |
| assignProjectTeamMember | Assign team member to project | admin/pm |
| addProjectTeamMember | Add team member to project | admin/pm |
| removeProjectTeamMember | Remove team member from project | admin/pm |
| addSubcontractorToProject | Add subcontractor to project team | admin/pm |
| removeSubcontractorFromProject | Remove subcontractor from project | admin/pm |
| getProjectsWithStats | List projects with statistics | user |
| getProjectWithStats | Get single project with stats | user |

### Key Patterns

```typescript
// Get projects with phase summary
export async function getProjects() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      phases:phases(id, phase_type, status, progress),
      task_count:tasks(count),
      open_tasks:tasks(count).eq('status', 'todo')
    `)
    .eq('company_id', await getCompanyId())
    .order('created_at', { ascending: false })

  return { data, error }
}
```

---

## UI Components

### Location
`components/projects/`

### Key Components

| Component | Purpose |
|-----------|---------|
| ProjectList | Grid/list of project cards |
| ProjectCard | Single project summary |
| ProjectDetail | Full project view with tabs |
| MetroStepper | Phase progress visualization |
| ProjectForm | Create/edit project form |

### Metro Journey View
The signature UI for project progress - horizontal stepper showing phases:

```tsx
<MetroStepper
  phases={project.phases}
  currentPhase={project.current_phase}
  onPhaseClick={(phase) => scrollToPhase(phase)}
/>
```

---

## Business Rules

### Project Status Flow
```
active → on_hold → active  (can toggle)
active → completed → archived
completed → active  (reopen)
```

### Health Score Calculation
```typescript
function calculateHealth(project: Project): number {
  let health = 100

  // Deduct for overdue tasks
  health -= overdueTaskCount * 5

  // Deduct for budget overrun
  if (actualSpend > budget) {
    health -= Math.min(30, (actualSpend - budget) / budget * 100)
  }

  // Deduct for schedule slip
  if (behindSchedule) {
    health -= daysLate * 2
  }

  return Math.max(0, Math.min(100, health))
}
```

### Phase Progression
1. Initiation → Planning: Requires project details complete
2. Planning → Execution: Requires phases defined
3. Execution → Monitoring: Automatic when tasks start
4. Monitoring → Closing: Requires all tasks complete
5. Closing → Complete: Requires final approval

---

## Access Control

### RLS Policy
```sql
-- Company isolation
CREATE POLICY "projects_company_access" ON projects
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()));
```

### Role Permissions

| Action | Owner | Admin | Manager | Member | Viewer |
|--------|-------|-------|---------|--------|--------|
| View | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create | ✓ | ✓ | - | - | - |
| Update | ✓ | ✓ | ✓ | - | - |
| Delete | ✓ | ✓ | - | - | - |

---

## See Also

- `skills/domain/project-crud.md` - Implementation patterns
- `docs/backend/SCHEMA_CORE.md` - Full schema
- `docs/indexes/tables.md` - Table quick reference
