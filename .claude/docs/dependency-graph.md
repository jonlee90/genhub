# GenHub Dependency Graph

> Critical paths, impact analysis, and cross-module dependencies.
> Last updated: 2026-03-21

---

## Critical Functions (High-Impact Changes)

### Tier 1: Maximum Impact (30+ consumers)

| Function | Location | Usage | Risk | If Changed... |
|----------|----------|-------|------|---------------|
| `getUserContext()` | `lib/auth-context.ts` | 35 action files | **CRITICAL** | Breaks all authenticated operations |
| `createClient()` | `utils/supabase/server.ts` | 53 files | **CRITICAL** | Breaks all DB access |

### Tier 2: High Impact (8-20 consumers)

| Function | Location | Usage | Risk | If Changed... |
|----------|----------|-------|------|---------------|
| `verifyTaskAccess()` | `lib/tasks-utils.ts` | 8 task action files | HIGH | Breaks task authorization |
| `verifyProjectAccess()` | `lib/tasks-utils.ts` | 8 files | HIGH | Breaks project authorization |
| `invalidateDashboardCache()` | `app/actions/dashboard.ts` | 3 callers | HIGH | Breaks cache invalidation |
| `logTaskActivity()` | `app/actions/tasks-activity.ts` | 4 task action files | MEDIUM | Breaks activity logging |

### Tier 3: Domain-Scoped (3-7 consumers)

| Function | Location | Usage | Risk |
|----------|----------|-------|------|
| `logTaskCompletionToMarker()` | `tasks-spatial.ts` | 2 files | LOW |
| `getTaskTypeConfig()` | `lib/config/task-type-fields.ts` | 5 components | MEDIUM |
| `cn()` | `lib/utils.ts` | 200+ files | LOW (stable API) |

---

## Task Update Chain (Tightly Coupled)

```
┌─────────────────────────────────────────────────────────────────┐
│                     TASK MUTATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

tasks.ts (Core)
│
├── createTask() / updateTask() / deleteTask()
│   │
│   ├──→ logTaskActivity() [tasks-activity.ts]
│   │    └── Logs: created, updated, deleted actions
│   │
│   ├──→ logTaskCompletionToMarker() [tasks-spatial.ts]
│   │    └── Updates spatial marker completion status
│   │
│   └──→ invalidateDashboardCache() [dashboard.ts]
│        └── Triggers dashboard data refresh
│
└── revalidatePath()
    ├── /app/tasks
    ├── /app/tasks/{id}
    └── /app/projects/{projectId}


tasks-status.ts (Status Updates)
│
├── updateTaskStatus()
│   │
│   ├──→ logTaskActivity() [tasks-activity.ts]
│   │
│   └──→ logTaskCompletionToMarker() [tasks-spatial.ts]
│        └── Only when status → completed
│
└── revalidatePath()
    ├── /app/tasks
    └── /app/projects/{projectId}


tasks-dependencies.ts (Relationships)
│
└── addTaskDependency() / removeTaskDependency()
    │
    └──→ logTaskActivity() [tasks-activity.ts]


tasks-spatial.ts (3D Linking)
│
└── linkTaskToMarker()
    │
    └──→ logTaskActivity() [tasks-activity.ts]
```

**Warning**: Status change triggers 2-3 downstream updates. Test full chain when modifying.

---

## Cross-Module Import Map

### Actions → Lib (Required Dependencies)

```
┌─────────────────┐     ┌─────────────────┐
│  app/actions/*  │────→│    lib/*.ts     │
└─────────────────┘     └─────────────────┘
        │                       │
        ├── getUserContext ─────┤ auth-context.ts
        ├── verifyTaskAccess ───┤ tasks-utils.ts
        ├── verifyProjectAccess ┤ tasks-utils.ts
        └── createClient ───────┤ ../utils/supabase/server.ts
```

### Components → Actions (UI Triggers)

| Component Directory | Primary Actions | Import Count |
|---------------------|-----------------|--------------|
| `components/tasks/` | `tasks.ts`, `tasks-status.ts` | 26+ |
| `components/projects/` | `projects.ts`, `phases.ts` | 18+ |
| `components/settings/` | `project-types.ts`, `task-types.ts` | 12+ |
| `components/team/` | `team.ts`, `subcontractors.ts` | 8+ |
| `components/chat/` | `chat.ts`, `chat-queries.ts` | 10+ |
| `components/estimates/` | `estimates.ts`, `estimate-chat.ts`, `assemblies.ts`, `revisions.ts` | 15+ |
| `components/expenses/` | `expenses.ts` | 5+ |

### Actions → Actions (None Direct)

**Important**: Action files do NOT import from other action files directly.
- Cross-action coordination happens via:
  1. Cache invalidation (`revalidatePath`, `revalidateTag`)
  2. Shared lib utilities
  3. Return values passed through components

---

## Cache Invalidation Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                   CACHE INVALIDATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

Task Mutations (tasks.ts)
│
├── createTask()
│   ├── revalidatePath("/app/tasks")
│   ├── revalidatePath("/app/projects/{projectId}")
│   └── invalidateDashboardCache({ companyId })
│
├── updateTask()
│   ├── revalidatePath("/app/tasks")
│   ├── revalidatePath("/app/projects/{projectId}")
│   └── invalidateDashboardCache({ companyId })
│
└── deleteTask()
    ├── revalidatePath("/app/tasks")
    ├── revalidatePath("/app/tasks/{id}")
    ├── revalidatePath("/app/projects/{projectId}")
    └── invalidateDashboardCache({ companyId })


Status Updates (tasks-status.ts)
│
└── updateTaskStatus()
    ├── revalidatePath("/app/tasks")
    ├── revalidatePath("/app/tasks/{taskId}")
    └── revalidatePath("/app/projects/{projectId}")
    ⚠️ NO dashboard cache invalidation


Project Mutations (projects.ts)
│
├── createProject() / updateProject()
│   ├── revalidatePath("/app/projects")
│   └── revalidatePath("/app/projects/{id}")
│
└── deleteProject()
    └── revalidatePath("/app/projects")


Dashboard Cache (dashboard.ts)
│
└── invalidateDashboardCache({ companyId })
    └── revalidateTag(`dashboard-${companyId}`)
```

---

## Type Dependencies

### Core Type Hub

```
types/db/tables/index.ts (Re-exports all)
│
├── tasks.ts ──────→ TasksRow, TasksInsert, TasksUpdate
│                    TaskActivityRow, TaskAssigneesRow
│                    TaskDependenciesRow, TaskTemplatesRow
│
├── projects.ts ───→ ProjectsRow, ProjectsInsert, ProjectsUpdate
│                    ProjectPhasesRow, ProjectFilesRow
│
├── expenses.ts ───→ ExpensesRow, ExpensesInsert, ExpensesUpdate
│
├── materials.ts ──→ MaterialsRow, MaterialPriceHistoryRow
│
├── users.ts ──────→ UsersRow, UserRolesRow
│
├── companies.ts ──→ CompaniesRow, CompanyMembersRow
│
├── chat.ts ───────→ ChatRoomsRow, ChatMessagesRow
│
└── spatial.ts ────→ SpatialMarkersRow, MarkerContentRow
```

### Enum Dependencies

```
types/db/enums.ts
│
├── TaskStatus ────→ todo | in_progress | blocked | completed
├── TaskPriority ──→ low | medium | high | urgent
├── TaskType ──────→ general | material_purchase | inspection | etc.
├── ApprovalStatus → pending | approved | rejected
└── UserRole ──────→ owner | manager | worker | viewer
```

**Import Pattern**:
```typescript
// 21 action files import from types/db/tables
import type { TasksRow } from '@/types/db/tables/tasks'

// 96 components import from types/db/tables
import type { ProjectsRow } from '@/types/db/tables/projects'
```

---

## Domain Isolation Analysis

### Well-Isolated Domains (Low Risk)

| Domain | Reason | Change Impact |
|--------|--------|---------------|
| Materials | Self-contained, no cross-imports | Materials UI only |
| Expenses | Minimal dependencies | Expenses UI only |
| Settings | Config-driven, isolated | Settings pages only |

### Moderately Coupled (Medium Risk)

| Domain | Coupling Point | Change Impact |
|--------|----------------|---------------|
| Projects | Phases, Files, Spatial | Project detail + related |
| Team | Subcontractors, Invites | Team management UI |
| Chat | Entity previews | Chat + entity cards |

### Tightly Coupled (High Risk)

| Domain | Coupling Point | Change Impact |
|--------|----------------|---------------|
| Tasks | 7 action files, activity logging, spatial, dependencies | **All task-related UI** |
| Auth | getUserContext used by 29 files | **Entire app** |
| Dashboard | Cache invalidation from tasks | Dashboard + task pages |

---

## Fragile Dependency Edges

### Cross-File Imports in Task Domain

```
tasks-status.ts
├──→ tasks-activity.ts (logTaskActivity)
└──→ tasks-spatial.ts (logTaskCompletionToMarker)

tasks-dependencies.ts
└──→ tasks-activity.ts (logTaskActivity)

tasks-spatial.ts
└──→ tasks-activity.ts (logTaskActivity)
```

**Risk**: Changing `logTaskActivity()` signature breaks 4 files.

### Implicit Dependencies (Cache)

```
Component refreshes depend on:
├── revalidatePath() being called correctly
├── Correct path strings (typos = stale data)
└── invalidateDashboardCache() for dashboard
```

**Risk**: Missing cache invalidation = stale UI data.

---

## Change Impact Checklist

### Before Changing `getUserContext()`:
- [ ] Check all 29 action files that import it
- [ ] Verify auth session handling unchanged
- [ ] Test: Login flow, session refresh, logout

### Before Changing `verifyTaskAccess()`:
- [ ] Check 8 task action files
- [ ] Verify return type unchanged
- [ ] Test: Task CRUD, status update, assignment

### Before Changing Task Status Flow:
- [ ] Test `tasks-status.ts` → `tasks-activity.ts` chain
- [ ] Test `tasks-status.ts` → `tasks-spatial.ts` chain
- [ ] Verify cache invalidation paths
- [ ] Test dashboard updates correctly

### Before Changing Types:
- [ ] Check all action files importing the type
- [ ] Check all components using the type
- [ ] Regenerate types if schema changed (`supabase gen types`)

---

## Module Dependency Matrix

```
              │ auth │ tasks │ projects │ team │ chat │ dashboard │
──────────────┼──────┼───────┼──────────┼──────┼──────┼───────────┤
auth          │  -   │   →   │    →     │  →   │  →   │     →     │
tasks         │  ←   │   -   │    ↔     │  →   │  →   │     →     │
projects      │  ←   │   ↔   │    -     │  →   │      │     →     │
team          │  ←   │   ←   │    ←     │  -   │      │           │
chat          │  ←   │   ←   │          │      │  -   │           │
dashboard     │  ←   │   ←   │    ←     │      │      │     -     │
──────────────┴──────┴───────┴──────────┴──────┴──────┴───────────┘

Legend: → depends on, ← depended by, ↔ bidirectional
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Critical functions (30+ consumers) | 2 |
| High-impact functions (8-20) | 5 |
| Action files with cross-imports | 4 (task domain) |
| Cache invalidation paths | 5 |
| Type files shared across domains | 10 |
| Components importing from actions | 96 |
