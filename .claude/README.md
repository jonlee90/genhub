# GenHub PWA - Documentation Index

**Last Updated**: 2025-12-06
**Project Version**: MVP Phase 1 (Epics 1-3 Complete)
**Primary Color**: #001B51 (Navy Blue - Construction Industry Theme)

## Quick Links

- **Tech Stack**: Next.js 15 + Supabase + Stripe + Aceternity UI + Tailwind CSS
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Authentication**: NextAuth with Supabase JWT integration
- **Design System**: Construction-themed with industrial aesthetics
- **Target Users**: General Contractors, Project Managers, Field Workers, Clients

---

## Documentation Structure

### System Documentation (`system/`)
Current state of the application architecture, database schema, and core modules.

| Document | Description | Last Updated |
|----------|-------------|--------------|
| [project-structure.md](system/project-structure.md) | File structure, routes, and organization | 2025-12-06 |
| [database-schema.md](system/database-schema.md) | Complete database schema with RLS policies | 2025-12-06 |
| [modules/projects-module.md](system/modules/projects-module.md) | Projects module architecture and components | 2025-12-06 |
| [modules/tasks-module.md](system/modules/tasks-module.md) | Tasks module architecture and components | 2025-12-06 |
| [modules/phase-system.md](system/modules/phase-system.md) | Project phases system documentation | 2025-12-06 |

### Standard Operating Procedures (`sop/`)
Step-by-step guides for common development tasks.

| SOP | Description |
|-----|-------------|
| Coming Soon | Adding new routes and pages |
| Coming Soon | Creating database migrations |
| Coming Soon | Adding new components |

### Tasks & Implementation (`tasks/`)
Feature specifications, implementation plans, and session context.

| Document | Description | Status |
|----------|-------------|--------|
| [context_session_1.md](tasks/context_session_1.md) | Complete session history and changes | Active |
| [aceternity_ui_migration_plan.md](tasks/aceternity_ui_migration_plan.md) | UI enhancement roadmap | Phase 3 Complete |
| [task_modal_implementation.md](tasks/task_modal_implementation.md) | TaskModal refactoring details | Complete |

### Project Rules (`rules/`)
Development guidelines and best practices.

| Rule File | Description |
|-----------|-------------|
| [add_new_files_project_structure_rules.md](rules/add_new_files_project_structure_rules.md) | Project structure conventions |
| [create_supabase_table.md](rules/create_supabase_table.md) | Database table creation guidelines |
| [frontend_mdc.md](rules/frontend_mdc.md) | Frontend component patterns |
| [set_database_and_state.md](rules/set_database_and_state.md) | State management guidelines |
| [supabase_types.md](rules/supabase_types.md) | TypeScript type generation |
| [supabase_use.md](rules/supabase_use.md) | Supabase client usage |
| [git.md](rules/git.md) | Git commit conventions |
| [project_requirements.md](rules/project_requirements.md) | Feature requirements |

---

## Current Implementation Status

### Completed Epics

#### Epic 1: Foundation (Weeks 1-2) - COMPLETE
- Database schema (13 tables with RLS)
- Authentication with NextAuth + Supabase
- Core layout (Sidebar, Header, Dashboard)
- TypeScript types generation
- Error handling patterns

#### Epic 2: Projects Module (Weeks 3-4) - COMPLETE
- Project CRUD operations
- Project list with filters
- Metro Journey visualization
- Phase management system
- Project team assignment
- Project settings and archival

#### Epic 3: Tasks Module (Weeks 5-6) - COMPLETE
- Task CRUD operations
- Kanban board with drag-and-drop
- List view with sorting
- Task detail panels
- Activity logging
- Dependencies management
- Priority-based theming

### Key Recent Changes (2025-12-05 - 2025-12-06)

1. **TaskBoard Refactoring**
   - Eliminated duplicate code between Tasks page and Project Tasks tab
   - Unified TaskBoard component supports both contexts
   - Smart context detection (project vs tasks page)

2. **TaskModal Enhancements**
   - Dynamic theming based on priority (edit mode)
   - Priority colors: Low (green), Medium (amber), High (red)
   - Removed "critical" priority level
   - Form state properly resets on task change

3. **Kanban Board Fixes**
   - Fixed hydration mismatch issues with @dnd-kit
   - Proper drag-and-drop functionality
   - Status transitions working correctly

4. **Phase Integration**
   - Phases fully integrated throughout task components
   - Phase filter in TaskBoard (project context)
   - Phase selection in TaskModal

---

## Architecture Overview

### Application Structure

```
app/
├── app/                    # Authenticated routes
│   ├── layout.tsx         # Main layout with Sidebar
│   ├── page.tsx           # Dashboard
│   ├── projects/          # Projects module
│   └── tasks/             # Tasks module
├── actions/               # Server Actions
│   ├── projects.ts
│   ├── phases.ts
│   └── tasks.ts
components/
├── app/                   # Layout components
│   ├── Sidebar.tsx
│   └── Header.tsx
├── projects/              # Project components
│   ├── ProjectCard.tsx
│   ├── MetroJourney.tsx
│   ├── PhaseStation.tsx
│   └── ...
└── tasks/                 # Task components
    ├── TaskBoard.tsx      # Unified board component
    ├── TaskModal.tsx      # Create/Edit modal
    ├── KanbanBoard.tsx
    └── ...
```

### Data Flow

1. **Server Components** fetch initial data from Supabase
2. **Client Components** handle user interactions
3. **Server Actions** perform mutations with RLS
4. **Optimistic Updates** for immediate UI feedback
5. **Revalidation** refreshes server data

### Design System

**Construction Industry Theme**:
- Primary Color: #001B51 (Navy Blue)
- Secondary: #F59E0B (Amber/Yellow)
- Success: #059669 (Green)
- Danger: #DC2626 (Red)
- Industrial typography (font-black, uppercase)
- Construction icons (HardHat, Wrench, etc.)

---

## Key Features

### Projects Module
- Project type templates (Residential, Restaurant, Commercial, Industrial)
- Metro Journey visualization (subway-style phases)
- Health score tracking
- Team management
- Budget and timeline tracking
- Status workflow (Active, On Hold, Completed, Cancelled)

### Tasks Module
- Dual view modes (Kanban, List)
- Drag-and-drop task management
- Priority levels (Low, Medium, High)
- Status workflow (Todo, In Progress, Review, Blocked, Completed)
- Task dependencies
- Activity logging
- Phase assignment
- Blocked reason tracking

### Phase System
- 5 universal phases per project:
  1. Initiation
  2. Pre-Construction
  3. Procurement
  4. Construction
  5. Post-Construction
- Auto-created on project creation
- Completion tracking
- Task aggregation

---

## Database Schema Highlights

### Core Tables
- `companies` - Multi-tenant company profiles
- `user_profiles` - Extended user data
- `company_users` - Membership with roles (gc_admin, project_manager, etc.)

### Projects
- `projects` - Project records with type, status, budget
- `project_phases` - Phase records with completion tracking
- `project_team` - Team assignments per project

### Tasks
- `tasks` - Task records with status, priority, dependencies
- `task_dependencies` - Prerequisite relationships
- `task_activity` - Audit log for changes

### Database Triggers
- Auto-update timestamps
- Auto-create default phases
- Auto-calculate phase completion
- Auto-calculate project completion

---

## Component Integration Patterns

### TaskBoard Component
**Purpose**: Unified component for task management in multiple contexts

**Props**:
- `initialTasks`: Tasks to display
- `projects`: Available projects for filters
- `teamMembers`: Available assignees
- `initialView`: 'kanban' | 'list'
- `projectId?`: When provided, enables project context mode
- `phases?`: Project phases for filtering
- `showNewTaskButton?`: Show/hide New Task button

**Contexts**:
1. **Tasks Page**: Full filters (project, assignee, priority), no phase filter
2. **Project Detail**: Phase filter only, pre-filtered to project tasks

### TaskModal Component
**Purpose**: Create and edit tasks with dynamic theming

**Features**:
- Create mode: Construction-blue theme
- Edit mode: Priority-based theming (green/amber/red)
- Form state resets properly via key-based remounting
- Supports preselected project/phase
- Validation with Zod

### KanbanBoard Component
**Purpose**: Drag-and-drop task board

**Features**:
- @dnd-kit integration
- Optimistic updates with useOptimistic
- Construction-themed columns
- Industrial grid background (BackgroundBoxes)
- Column glow effects on drag-over
- Hydration-safe with useId

---

## Development Workflow

### Sub-Agents Available
- `nextjs-expert` - Next.js + PWA optimization
- `aceternity-ui-expert` - UI component building
- `frontend-expert` - Frontend development
- `supabase-nextjs-expert` - Database optimization
- `agent-code-reviewer` - Code quality review
- `technical-documentation-writer` - Documentation creation
- `kiro-requirement` - Requirements analysis
- `kiro-design` - Technical design
- `kiro-plan` - Implementation planning
- `kiro-executor` - Task execution
- `vercel-ai-sdk-v5-expert` - AI SDK integration

### Commands
- `/kc:impl` - Implement task specifications
- `/kc:split-task` - Break down features
- `/kc:bug-fix` - Automated bug fixing
- `/kc:pr-list` - View open PRs

---

## Next Steps

### Epic 4: Team & PWA (Weeks 7-8) - PENDING
- Team member invitation
- Subcontractor directory
- PWA manifest and icons
- Service worker for offline
- Mobile responsive design

### Epic 5: Polish & Testing (Weeks 9-10) - PENDING
- Notification system
- Global search
- Company profile
- Unit tests
- Component tests
- E2E tests
- Performance optimization

---

## Additional Resources

- **Main Requirements**: `docs/specs/genhub-pwa/requirements.md`
- **Design Document**: `docs/specs/genhub-pwa/design.md`
- **Implementation Plan**: `docs/specs/genhub-pwa/tasks.md`
- **Database Migrations**: `supabase/migrations/`

---

For questions or clarifications, refer to [context_session_1.md](tasks/context_session_1.md) for complete session history.
