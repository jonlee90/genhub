# Projects Domain Reference

> Project management patterns for GenHub

Last updated: 2026-01-18

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

### Action Patterns

All project server actions follow these patterns:

**1. User Context + Permission Check**
```typescript
export async function updateProject(projectId: string, input: UpdateInput) {
  // Get user context
  const context = await getUserContext();
  if ('error' in context) return context;

  // Verify project ownership (company isolation)
  const { data: project } = await context.supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (!project || project.company_id !== context.companyId) {
    return { error: 'Project not found or access denied' };
  }

  // Role-based access control
  if (context.role !== 'admin' && context.role !== 'project_manager') {
    return { error: 'Insufficient permissions' };
  }

  // Proceed with update...
}
```

**2. Validation with Zod**
```typescript
const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).optional(),
});

export async function updateProject(projectId: string, input: unknown) {
  // Validate input
  const validation = updateProjectSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: 'Invalid input',
      details: validation.error.flatten().fieldErrors
    };
  }

  // Use validated data
  const validatedInput = validation.data;
  // ...
}
```

**3. Multi-Level Cache Revalidation**
```typescript
// Revalidate all related views
revalidatePath('/app/projects');              // List page
revalidatePath(`/app/projects/${projectId}`); // Detail page
revalidateTag('projects');                    // List view data
revalidateTag(`project-${projectId}`);        // Detail view data
revalidateTag('dashboard');                   // Dashboard aggregations
```

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

### Optimized Data Fetching (Phase-Based Approach)

The projects module uses a 3-phase data fetching strategy for optimal performance:

**PHASE 1: Sequential Auth & Context**
```typescript
// Must be sequential - auth is blocking
const [supabase, session] = await Promise.all([createClient(), auth()]);

// Extract company context
const { data: companyUser } = await supabase
  .from('company_users')
  .select('company_id, role, status')
  .eq('user_id', session.user.id)
  .single();
```

**PHASE 2: Parallel Data Fetching**
```typescript
// Required queries (always run)
const requiredQueries = [
  getProjectFiles(id),
  getProjectPhotos(id),
  supabase.rpc('get_project_detail_with_stats', { p_project_id: id }),
];

// Optional queries (only if data exists)
const optionalQueries: Array<PromiseLike<any>> = [];

if (creatorId) {
  optionalQueries.push(
    supabase.from('user_profiles').select('*').eq('id', creatorId).single()
  );
}

if (teamUserIds.length > 0) {
  optionalQueries.push(
    supabase.from('user_profiles').select('*').in('id', teamUserIds)
  );
}

// Execute in parallel
const [requiredResults, optionalResults] = await Promise.all([
  Promise.all(requiredQueries),
  Promise.allSettled(optionalQueries),
]);
```

**PHASE 3: Synchronous Assembly**
```typescript
// Use Maps for O(1) lookups
const teamProfileMap = new Map(teamProfiles.map(p => [p.id, p]));
const phaseMap = new Map(phases.map(p => [p.id, p]));

// Attach related data
project.project_team?.forEach(member => {
  member.user_profiles = teamProfileMap.get(member.user_id) || null;
});

project.tasks?.forEach(task => {
  task.phase = phaseMap.get(task.phase_id) || null;
});
```

**Performance Impact:**
- Eliminates waterfalls (1200ms → 150ms)
- Enables parallel execution
- Conditional queries save unnecessary network calls
- O(1) lookups with Maps for assembly

---

### RPC Functions for Aggregation

Instead of multiple queries for statistics, use database-side aggregation:

```typescript
// ❌ OLD: Multiple queries (4+ queries, ~1200ms)
const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', id);
const { data: expenses } = await supabase.from('expenses').select('*').eq('project_id', id);
const { data: materials } = await supabase.from('materials').select('*').eq('project_id', id);
// ... manual aggregation in JavaScript

// ✅ NEW: Single RPC call (1 query, ~150ms)
const { data } = await supabase.rpc('get_project_with_full_stats', {
  p_project_id: id,
  p_company_id: companyId,
});
```

**Available RPC Functions:**
- `get_projects_with_stats()` - List view with task/expense counts
- `get_project_with_full_stats(p_project_id, p_company_id)` - Detail view with all aggregations
- `get_project_team_cost_summary(p_project_id)` - Team cost breakdown

---

### Lazy Loading for Modal Data

Non-critical data (projects list, team members) is lazy-loaded when modals open:

```typescript
// Hook: hooks/use-modal-data.ts
const { data, isLoading, fetchData } = useModalData();

// Component: Trigger fetch when modal opens
useEffect(() => {
  if (isModalOpen) {
    fetchData();
  }
}, [isModalOpen, fetchData]);

// Server Action: app/actions/projects.ts
export async function getModalData() {
  const context = await getUserContext();
  if ('error' in context) return context;

  const [projects, teamMembers] = await Promise.all([
    getProjectsForModal(context),
    getTeamMembersForModal(context),
  ]);

  return {
    data: {
      projects: projects.data || [],
      teamMembers: teamMembers.data || [],
    },
  };
}
```

**Benefits:**
- Reduces initial RSC payload by 40-50% (~80KB → ~30-50KB)
- Modal data only fetched when needed (~20-30KB on first open)
- 5-minute cache TTL prevents stale data in long-running PWA sessions

---

### Data Serialization Optimization

For list views, transform data before passing to client components:

```typescript
// Type: Minimal data for project cards (71% reduction)
export type ProjectCardData = Pick<
  ProjectsRow,
  | 'id' | 'name' | 'status' | 'project_type' | 'address'
  | 'completion_percentage' | 'budget' | 'image_url'
> & {
  stats: {
    schedule: { daysRemaining: number | null };
    teamSize: number;
  };
};

// Server Component: Transform before passing
export default async function ProjectsPage() {
  const { data: projects } = await getProjects();

  // Transform to minimal type
  const minimalProjects = projects.map(transformToProjectCardData);

  return <ProjectsList projects={minimalProjects} />;
}
```

**Impact:** ~2KB → ~600 bytes per project card

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

- Implementation patterns: `skills/domain/project-crud.md`
- Server action patterns: `docs/backend/SERVER_ACTIONS.md`
- Component patterns: `docs/frontend/COMPONENTS.md`
- Performance optimization: `docs/frontend/PERFORMANCE_OPTIMIZATIONS_GUIDE.md`
- Full schema: `docs/backend/SCHEMA_CORE.md`
- Table quick reference: `docs/indexes/tables.md`
