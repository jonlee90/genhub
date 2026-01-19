# Configuration Domain Reference

> Data flow for project types, task types, and phase templates

---

## Overview

`ProjectConfigurationSection` is the central manager that lifts state for 4 child managers. Configuration data flows from this parent to consumers throughout the app.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              ProjectConfigurationSection                        │
│              (components/settings/)                             │
│                                                                 │
│  State:                                                         │
│  - projectTypes[]          ─┬─► ProjectTypeManager              │
│  - selectedProjectTypeId    │   PhaseTemplateManager            │
│  - phaseTemplates[]        ─┘   TaskTemplateManager             │
│  - selectedPhaseTemplateId ───► TaskTemplateManager             │
│  - taskTypes[]             ───► TaskTypeManager                 │
│                                 TaskTemplateManager             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Tables

| Table | Description |
|-------|-------------|
| `project_type_configs` | Project type definitions (name, icon, color, is_active) |
| `task_type_configs` | Task type definitions (name, icon, color, description) |
| `phase_templates` | Phase templates per project type |
| `task_templates` | Task templates per phase |

---

## Server Actions

| Action | File | Returns |
|--------|------|---------|
| `getProjectTypes()` | `app/actions/project-types.ts` | `ProjectTypeWithCount[]` |
| `getAllTaskTypes()` | `app/actions/task-types.ts` | `TaskTypeConfigsRow[]` |
| `getPhaseTemplates(projectTypeId)` | `app/actions/phase-templates.ts` | `PhaseTemplateWithTasks[]` |

---

## Manager Components (Settings)

| Component | Receives | Manages |
|-----------|----------|---------|
| `ProjectTypeManager` | projectTypes, isLoading, onRefresh | CRUD for project types |
| `TaskTypeManager` | taskTypes, isLoading, onRefresh | CRUD for task types |
| `PhaseTemplateManager` | projectTypes, selectedProjectTypeId, phaseTemplates | CRUD for phase templates |
| `TaskTemplateManager` | projectTypes, phaseTemplates, taskTypes, selectedIds | CRUD for task templates |

---

## Consumer Components

### Project Types

| Consumer | File | Usage |
|----------|------|-------|
| `CreateProjectForm` | `components/projects/CreateProjectForm.tsx` | Type selection in project creation |
| `ProjectTypeSelector` | `components/projects/form/ProjectTypeSelector.tsx` | Visual type picker |
| `lib/projects.ts` | `lib/projects.ts` | Project type utilities |
| `lib/dashboard.ts` | `lib/dashboard.ts` | Dashboard metrics by type |

### Task Types

| Consumer | File | Usage |
|----------|------|-------|
| `TasksPageClient` | `components/tasks/TasksPageClient.tsx` | Filter tabs by task type |
| `TaskTypeSelector` | `components/tasks/TaskTypeSelector.tsx` | Type picker in task forms |
| `CreateTaskForm` | `components/tasks/CreateTaskForm.tsx` | Task creation |
| `TaskModal` | `components/tasks/TaskModal.tsx` | Task editing |
| `TaskTypeSelectionStep` | `components/tasks/modal/TaskTypeSelectionStep.tsx` | Modal step UI |

### Phase Templates

| Consumer | File | Usage |
|----------|------|-------|
| `CreateProjectForm` | `components/projects/CreateProjectForm.tsx` | Auto-creates phases on project creation |

---

## Display Config Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `TASK_TYPE_ICON_MAP` | `lib/config/task-type-display.ts` | Maps icon_name → LucideIcon |
| `buildTaskTypeDisplay()` | `lib/config/task-type-display.ts` | Builds display config from DB row |
| `getTaskTypeIcon()` | `lib/config/task-type-display.ts` | Gets icon from name |
| `PROJECT_TYPE_ICON_MAP` | `lib/config/project-type-display.ts` | Maps icon_name → LucideIcon |

---

## Data Flow Diagram

```
Database Tables
     │
     ▼
Server Actions (app/actions/)
     │
     ├──► ProjectConfigurationSection (settings page)
     │         │
     │         ├──► ProjectTypeManager
     │         ├──► TaskTypeManager
     │         ├──► PhaseTemplateManager
     │         └──► TaskTemplateManager
     │
     ├──► CreateProjectForm (project creation)
     │         └── uses projectTypes + phaseTemplates
     │
     ├──► TasksPageClient (tasks list)
     │         └── uses taskTypes for filter tabs
     │
     └──► TaskModal / CreateTaskForm (task CRUD)
               └── uses taskTypes for type selection
```

---

## Key Props Interface

### ProjectTypeManager
```typescript
{
  projectTypes: ProjectTypeWithCount[];
  isLoading: boolean;
  onRefresh: () => void;
}
```

### TaskTypeManager
```typescript
{
  taskTypes: TaskTypeConfigsRow[];
  isLoading: boolean;
  onRefresh: () => void;
}
```

### PhaseTemplateManager
```typescript
{
  projectTypes: ProjectTypeWithCount[];
  selectedProjectTypeId: string;
  onProjectTypeChange: (id: string) => void;
  phaseTemplates: PhaseTemplateWithTasks[];
  isLoadingProjectTypes: boolean;
  isLoadingPhases: boolean;
  onRefreshPhases: () => void;
}
```

### TaskTemplateManager
```typescript
{
  projectTypes: ProjectTypeWithCount[];
  selectedProjectTypeId: string;
  onProjectTypeChange: (id: string) => void;
  phaseTemplates: PhaseTemplateWithTasks[];
  selectedPhaseTemplateId: string;
  onPhaseTemplateChange: (id: string) => void;
  taskTypes: TaskTypeConfigsRow[];
  isLoadingProjectTypes: boolean;
  isLoadingPhases: boolean;
  onRefreshPhases: () => void;
}
```

---

## Refresh Patterns

Parent provides refresh callbacks to children:
- `refreshProjectTypes()` → reloads project types
- `refreshPhaseTemplates()` → reloads phases for selected project type
- `refreshTaskTypes()` → reloads task types

Children call these after mutations to sync parent state.
