# Skill: Project CRUD

> Project management patterns for GenHub

## When to Use

- Creating/editing/deleting projects
- Project list and detail views
- Project phases and milestones
- Project settings and configuration
- Project team management
- Project files and photos

## Prerequisites

- Check `.claude/docs/indexes/tables.md` for projects schema
- Check `.claude/docs/indexes/actions.md` for existing actions

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `projects` | Main projects (26 columns) |
| `project_phases` | Project phases/milestones |
| `project_team` | Team member assignments |
| `project_type_configs` | Custom project types |
| `project_files` | File uploads |
| `project_photos` | Photo uploads |

### Server Actions Files

| File | Purpose |
|------|---------|
| `projects.ts` | Core CRUD, team, stats |
| `project-files.ts` | File management |
| `project-photos.ts` | Photo management |
| `project-types.ts` | Project type configs |
| `project-deferred.ts` | Deferred/expensive queries |
| `phases.ts` | Phase management |

### Status Values
```typescript
type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
type PhaseStatus = 'pending' | 'active' | 'completed'
```

---

## Server Actions

### Key Actions (projects.ts)

| Action | Purpose |
|--------|---------|
| `createProject` | Create new project with phases |
| `updateProject` | Update project fields |
| `updateProjectStatus` | Change project status |
| `getProjectsWithStats` | List projects with computed stats |
| `getProjectWithStats` | Single project with stats |
| `addProjectTeamMember` | Add user to project team |
| `removeProjectTeamMember` | Remove user from team |
| `addSubcontractorToProject` | Add subcontractor |
| `removeSubcontractorFromProject` | Remove subcontractor |
| `getProjectTeamCostSummary` | Team cost breakdown |
| `getProjectsForModal` | Lightweight list for modals |
| `getTeamMembersForModal` | Team list for modals |
| `getModalData` | Combined modal data |

### Auth Pattern
```typescript
// Always use getUserContext for auth + company context
import { getUserContext } from "@/lib/auth/user-context";

export async function createProject(input: CreateProjectInput) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { supabase, companyId, userId } = ctx;
  // ... use supabase client with company context
}
```

### ProjectWithStats Type
```typescript
export interface ProjectWithStats extends Project {
  stats: {
    actualSpent: number;
    plannedCost: number;
    budgetVariance: number;
    isUnderBudget: boolean;
    taskCounts: TaskCounts;
    schedule: ScheduleStatus;
    materials: MaterialsStatus;
    teamSize: number;
    expenses: ExpenseStats;
  };
  project_phases?: Array<Phase>;
  primary_photo_url?: string;
}
```

### Deferred Data Pattern
```typescript
// For expensive queries, use project-deferred.ts
import { getProjectDeferredData } from "@/app/actions/project-deferred";

// Returns: expenseStats, teamCosts, taskDependencies
const deferred = await getProjectDeferredData(projectId);
```

---

## UI Components

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProjectCard` | `components/projects/` | Project list item with stats |
| `ProjectDetailContent` | `components/projects/` | Main detail view |
| `ProjectOverview` | `components/projects/` | Overview tab content |
| `ProjectSettings` | `components/projects/` | Settings/edit tab |
| `MetroJourney` | `components/projects/` | Phase visualization |
| `PhaseDetailPanel` | `components/projects/` | Phase details sidebar |

### Server Component Pattern
```tsx
// app/app/projects/[id]/page.tsx (Server Component)
import { getProjectWithStats } from "@/app/actions/projects";

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const result = await getProjectWithStats(id);

  if (result.error || !result.data) {
    notFound();
  }

  return <ProjectDetailContent initialData={result.data} />;
}
```

### Client Component with Deferred Loading
```tsx
// components/projects/ProjectOverview.tsx
'use client'

import { useDeferredData } from "@/hooks/use-deferred-data";
import { getProjectDeferredData } from "@/app/actions/project-deferred";

export function ProjectOverview({ project }: Props) {
  // Expensive data loads after initial render
  const { data: deferred, isLoading } = useDeferredData(
    () => getProjectDeferredData(project.id),
    [project.id]
  );

  return (
    <div>
      {/* Critical data renders immediately */}
      <ProjectHeader project={project} />

      {/* Deferred data with skeleton */}
      {isLoading ? <ExpensesSkeleton /> : <ExpensesPanel data={deferred} />}
    </div>
  );
}
```

---

## Phase Management

### Phase Actions (phases.ts)

| Action | Purpose |
|--------|---------|
| `getProjectPhases` | List phases for project |
| `createPhase` | Add new phase |
| `updatePhase` | Update phase details |
| `updatePhaseStatus` | Change phase status |
| `updatePhaseName` | Rename phase |
| `deletePhase` | Remove phase |
| `startNextPhase` | Start next pending phase |
| `completeCurrentPhase` | Mark current phase done |
| `applyTaskTemplates` | Apply task templates to phase |

### Phase Templates (phase-templates.ts)

| Action | Purpose |
|--------|---------|
| `getPhaseTemplates` | Get templates for project type |
| `createPhaseTemplate` | Create new template |
| `updatePhaseTemplate` | Update template |
| `deletePhaseTemplate` | Remove template |
| `reorderPhaseTemplates` | Change template order |

### Project Creation Flow
```typescript
// Project creation includes automatic phase setup
export async function createProject(input: CreateProjectInput) {
  // 1. Create project record
  // 2. If project_type specified, apply phase templates
  // 3. Phase templates include linked task templates
}
```

---

## Files & Photos

### File Actions (project-files.ts)

| Action | Purpose |
|--------|---------|
| `getProjectFiles` | List project files |
| `deleteProjectFile` | Delete file |
| `updateFileCategory` | Change file category |
| `getFileVersionHistory` | Get file versions |
| `bulkDeleteFiles` | Delete multiple files |

### Photo Actions (project-photos.ts)

| Action | Purpose |
|--------|---------|
| `getProjectPhotosWithReceipts` | Photos + receipt photos |
| `setProjectPrimaryPhoto` | Set primary photo |
| `deleteProjectPhoto` | Delete photo |

---

## Anti-Patterns

```typescript
// WRONG: Not using getUserContext
const supabase = await createClient()
// Missing company context and auth checks

// CORRECT: Always use getUserContext
const ctx = await getUserContext();
if ('error' in ctx) return ctx;

// WRONG: Fetching full project data for modal
const result = await getProjectWithStats(id);
// Too expensive for dropdown selection

// CORRECT: Use lightweight modal queries
const result = await getProjectsForModal();

// WRONG: Loading all data upfront
const [project, expenses, team] = await Promise.all([...]);
// Blocks initial render

// CORRECT: Defer expensive data
// Load critical data first, defer expensive queries
const project = await getProjectWithStats(id);
// Then use useDeferredData for expenses, team costs
```

---

## Checklist

- [ ] Company isolation via `getUserContext()`
- [ ] Phase templates applied for project type
- [ ] Task templates applied to phases
- [ ] Use `getProjectsWithStats` for lists (not raw queries)
- [ ] Use deferred loading for expensive data
- [ ] `revalidatePath` and `revalidateTag` called after mutations
- [ ] File uploads go to Supabase Storage
- [ ] Photo primary_url updated on photo changes
- [ ] Run `/kc:sync-docs` after adding new actions
