# GenHub PWA - Project Structure

**Last Updated**: 2025-12-06
**Version**: MVP Phase 1 (Epics 1-3 Complete)

## Directory Structure

```
genhub/
├── app/                           # Next.js 15 App Router
│   ├── (login)/                   # Public authentication routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (marketing)/               # Public marketing pages
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/
│   │   └── terms/
│   ├── app/                       # Authenticated application routes
│   │   ├── layout.tsx            # Main app layout with Sidebar
│   │   ├── page.tsx              # Dashboard
│   │   ├── projects/             # Projects module
│   │   │   ├── page.tsx          # Projects list
│   │   │   ├── new/
│   │   │   │   ├── page.tsx      # Create project
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Project detail
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   └── error.tsx
│   │   ├── tasks/                # Tasks module
│   │   │   ├── page.tsx          # Tasks list (Kanban/List view)
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create task
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Task detail
│   │   ├── profile/
│   │   └── notes/
│   ├── actions/                   # Server Actions
│   │   ├── projects.ts           # Project CRUD operations
│   │   ├── phases.ts             # Phase management
│   │   ├── tasks.ts              # Task CRUD operations
│   │   ├── auth.ts               # Authentication helpers
│   │   └── stripe.ts             # Payment processing
│   ├── api/                       # API Routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   └── webhooks/             # Stripe webhooks
│   ├── layout.tsx                 # Root layout
│   └── globals.css               # Global styles with construction theme
├── components/
│   ├── app/                       # Core layout components
│   │   ├── Sidebar.tsx           # Navigation sidebar (glass morphism)
│   │   ├── Header.tsx            # Top header with notifications
│   │   └── UserMenu.tsx          # User dropdown menu
│   ├── projects/                  # Projects module components
│   │   ├── ProjectCard.tsx       # Project card with health score
│   │   ├── ProjectList.tsx       # Project grid with filters
│   │   ├── ProjectFilters.tsx    # Search and filter controls
│   │   ├── ProjectListSkeleton.tsx
│   │   ├── CreateProjectForm.tsx # Multi-step project creation
│   │   ├── MetroJourney.tsx      # Subway-style phase visualization
│   │   ├── PhaseStation.tsx      # Individual phase station
│   │   ├── PhaseDetailPanel.tsx  # Phase task list panel
│   │   ├── ProjectDetailContent.tsx # Tab navigation wrapper
│   │   ├── ProjectOverview.tsx   # Overview tab content
│   │   ├── ProjectTeam.tsx       # Team management
│   │   └── ProjectSettings.tsx   # Settings form
│   ├── tasks/                     # Tasks module components
│   │   ├── TaskBoard.tsx         # Unified board (Kanban/List toggle)
│   │   ├── TaskModal.tsx         # Create/Edit modal with priority theming
│   │   ├── TaskFormModal.tsx     # Legacy form (deprecated)
│   │   ├── TaskModalTrigger.tsx  # Modal trigger component
│   │   ├── KanbanBoard.tsx       # Drag-and-drop board (@dnd-kit)
│   │   ├── KanbanColumn.tsx      # Droppable column
│   │   ├── TaskCard.tsx          # Draggable task card
│   │   ├── TaskList.tsx          # Sortable table view
│   │   ├── TaskFilters.tsx       # Filter controls
│   │   ├── TaskDetail.tsx        # Task detail form
│   │   ├── TaskActivityLog.tsx   # Activity timeline
│   │   ├── TaskDependencies.tsx  # Dependencies manager
│   │   ├── BlockedReasonModal.tsx # Blocked reason input
│   │   └── CreateTaskForm.tsx    # Legacy create form (deprecated)
│   ├── ui/                       
│   │   ├── aceternity/           # Aceternity UI effects
│   │   │   ├── background-boxes.tsx
│   │   │   ├── hero-highlight.tsx
│   │   │   └── text-generate-effect.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   └── landing/                   # Marketing components
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── auth.config.ts             # Auth adapter and JWT setup
│   ├── project-templates.ts       # Project type templates
│   └── utils.ts                   # Utility functions
├── utils/
│   └── supabase/
│       ├── server.ts              # Server-side Supabase client
│       ├── front.ts               # Client-side Supabase client
│       └── middleware.ts          # Middleware helpers
├── types/
│   └── database.types.ts          # Generated Supabase types
├── supabase/
│   └── migrations/                # Database migrations
│       ├── 01_setup_and_auth.sql # Schemas and NextAuth tables
│       ├── 02_enums.sql          # All enum types
│       ├── 03_tables.sql         # Application tables
│       ├── 04_rls_policies.sql   # RLS policies
│       ├── 05_triggers.sql       # Database triggers
│       ├── 001_companies.sql     # Individual table migrations
│       ├── 002_user_profiles.sql
│       ├── 003_company_users.sql
│       ├── 004_subcontractors.sql
│       ├── 005_projects.sql
│       ├── 006_project_phases.sql
│       ├── 007_project_team.sql
│       ├── 008_tasks.sql
│       ├── 009_task_dependencies.sql
│       ├── 010_task_activity.sql
│       ├── 011_notifications.sql
│       ├── 012_attachments.sql
│       └── 013_triggers.sql
├── .claude/                       # Claude Code documentation
│   ├── README.md                  # Documentation index
│   ├── CLAUDE.md                  # Project instructions
│   ├── system/                    # System architecture docs
│   │   ├── project-structure.md  # This file
│   │   ├── database-schema.md
│   │   └── modules/
│   │       ├── projects-module.md
│   │       ├── tasks-module.md
│   │       └── phase-system.md
│   ├── tasks/                     # Implementation docs
│   │   ├── context_session_1.md
│   │   ├── aceternity_ui_migration_plan.md
│   │   └── task_modal_implementation.md
│   ├── rules/                     # Development rules
│   │   ├── frontend_mdc.md
│   │   ├── create_supabase_table.md
│   │   ├── supabase_use.md
│   │   └── ...
│   └── agents/                    # Sub-agent definitions
│       ├── nextjs-expert.md
│       ├── frontend-expert.md
│       └── ...
├── public/
│   ├── images/
│   └── fonts/
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Route Structure

### Public Routes (Unauthenticated)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/(marketing)/page.tsx` | Landing page |
| `/sign-in` | `app/(login)/sign-in/page.tsx` | Sign in |
| `/sign-up` | `app/(login)/sign-up/page.tsx` | Sign up |
| `/pricing` | `app/(marketing)/pricing/page.tsx` | Pricing page |

### Application Routes (Authenticated)

| Route | File | Purpose |
|-------|------|---------|
| `/app` | `app/app/page.tsx` | Dashboard |
| `/app/projects` | `app/app/projects/page.tsx` | Projects list |
| `/app/projects/new` | `app/app/projects/new/page.tsx` | Create project |
| `/app/projects/[id]` | `app/app/projects/[id]/page.tsx` | Project detail |
| `/app/tasks` | `app/app/tasks/page.tsx` | Tasks board |
| `/app/tasks/new` | `app/app/tasks/new/page.tsx` | Create task |
| `/app/tasks/[id]` | `app/app/tasks/[id]/page.tsx` | Task detail |
| `/app/profile` | `app/app/profile/page.tsx` | User profile |

## Component Organization Principles

### Server Components (Default)
- Page components that fetch initial data
- Layout components
- Components that don't need client interactivity

**Examples**:
- `app/app/projects/page.tsx` - Fetches projects from Supabase
- `app/app/tasks/page.tsx` - Fetches tasks and team members

### Client Components ('use client')
- Components with user interactions
- Components using React hooks (useState, useEffect, etc.)
- Components with animations (Framer Motion)
- Drag-and-drop components

**Examples**:
- `components/tasks/TaskBoard.tsx` - Filter state and view toggle
- `components/tasks/KanbanBoard.tsx` - Drag-and-drop with @dnd-kit
- `components/tasks/TaskModal.tsx` - Form state and transitions

## Server Actions

Located in `app/actions/`, server actions handle all data mutations:

### projects.ts
- `createProject(formData)` - Create new project
- `updateProject(formData)` - Update project details
- `updateProjectStatus(formData)` - Change project status
- `assignProjectTeamMember(formData)` - Add team member
- `removeProjectTeamMember(formData)` - Remove team member

### phases.ts
- `updatePhaseStatus(formData)` - Change phase status
- `updatePhase(formData)` - Update phase details
- `getProjectPhases(projectId)` - Fetch phases
- `startNextPhase(projectId)` - Start next pending phase
- `completeCurrentPhase(projectId)` - Complete active phase

### tasks.ts
- `createTask(state, formData)` - Create new task
- `updateTask(formData)` - Update task
- `updateTaskStatus(formData)` - Change task status
- `deleteTask(formData)` - Delete task
- `addTaskDependency(formData)` - Add dependency
- `removeTaskDependency(formData)` - Remove dependency
- `addTaskComment(formData)` - Add comment to activity log

## State Management Strategy

GenHub uses **server-driven state** instead of global state libraries:

1. **Server Components** fetch initial data and pass to Client Components as props
2. **Client Components** manage local UI state (filters, modals, etc.)
3. **Server Actions** perform mutations and revalidate server data
4. **Optimistic Updates** provide instant UI feedback (e.g., TaskBoard)
5. **URL State** for shareable filters and navigation

**No Redux, Zustand, or Context API needed** for application state.

## File Naming Conventions

### Components
- PascalCase for component files: `ProjectCard.tsx`
- Match component name to file name
- Co-locate related components in module folders

### Pages
- lowercase for route segments: `app/app/projects/page.tsx`
- Use `[id]` for dynamic routes
- Include `loading.tsx` and `error.tsx` siblings

### Server Actions
- lowercase with dashes: `app/actions/projects.ts`
- Group by domain (projects, tasks, phases)
- Export named functions

## Module Structure

Each major feature (Projects, Tasks) follows this structure:

```
app/app/{module}/
├── page.tsx           # List/index page (Server Component)
├── new/
│   └── page.tsx       # Create page
├── [id]/
│   └── page.tsx       # Detail page
└── error.tsx          # Error boundary

components/{module}/
├── {Module}Card.tsx    # Card component
├── {Module}List.tsx    # List container
├── {Module}Filters.tsx # Filter controls
├── Create{Module}Form.tsx # Creation form
└── ...                 # Other related components

app/actions/{module}.ts # Server actions
```

## Design System Files

### Global Styles
- `app/globals.css` - Construction-themed CSS variables, animations, utilities

**Key CSS Classes**:
- `.shadow-construction` - Industrial shadow
- `.bg-construction-blue` - Primary color (#001B51)
- `.font-black` - Heavy industrial font weight
- `.uppercase` - Industrial typography

### Tailwind Configuration
- `tailwind.config.ts` - Extended colors, shadows, animations

**Custom Colors**:
- `construction-blue: #001B51`
- `construction-accent: #3C3C3C`
- `construction-accent-light: #7A7A7A`
- `construction-green: #059669`
- `construction-red: #DC2626`
- `construction-yellow: #FFB627`

### Component Library
- **radix-ui** primitives components in `components/ui/`
- **Aceternity UI** effects in `components/ui/aceternity/`
- **Custom components** in module-specific folders

## Data Flow Patterns

### 1. Server Component Fetch Pattern
```typescript
// app/app/projects/page.tsx
export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId);

  return <ProjectList initialProjects={projects} />;
}
```

### 2. Client Component State Pattern
```typescript
// components/projects/ProjectList.tsx
'use client';

export function ProjectList({ initialProjects }) {
  const [filteredProjects, setFilteredProjects] = useState(initialProjects);

  // Local filtering, sorting, etc.
}
```

### 3. Server Action Mutation Pattern
```typescript
// app/actions/projects.ts
'use server';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const session = await auth();

  // Validate, insert, revalidate
  revalidatePath('/app/projects');
}
```

### 4. Optimistic Update Pattern
```typescript
// components/tasks/KanbanBoard.tsx
const [optimisticTasks, setOptimisticTasks] = useOptimistic(
  tasks,
  (state, { taskId, newStatus }) =>
    state.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )
);
```

## Integration Points

### Authentication
- NextAuth configuration: `lib/auth.ts`, `lib/auth.config.ts`
- Supabase JWT integration via SupabaseAdapter
- Session available via `auth()` server-side

### Database
- Supabase PostgreSQL with Row-Level Security
- Migrations in `supabase/migrations/`
- Types generated to `types/database.types.ts`

### Payments
- Stripe integration via `app/actions/stripe.ts`
- Webhooks at `app/api/webhooks/stripe/route.ts`

### UI Effects
- Framer Motion for animations
- Aceternity UI for advanced effects
- @dnd-kit for drag-and-drop

## Environment Variables

Required in `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Key Architectural Decisions

1. **Server Components First**: Leverage Next.js 15 Server Components for performance
2. **Server Actions over API Routes**: Simpler, type-safe mutations
3. **RLS for Security**: Database-level multi-tenant isolation
4. **Optimistic UI**: Instant feedback with server reconciliation
5. **No Global State**: Server-driven state eliminates complexity
6. **TypeScript Strict**: Full type safety with generated DB types
7. **Component Co-location**: Keep related files together by feature

## Performance Optimizations

- **Partial Prerendering**: Static + dynamic in same route
- **Streaming**: Suspense boundaries for incremental loading
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js App Router
- **Database Indexes**: Added for common queries
- **Optimistic Updates**: Perceived performance boost

## Future Structure Additions (Epics 4-5)

Coming in future phases:
- `app/app/team/` - Team management routes
- `app/app/subcontractors/` - Subcontractor directory
- `app/app/settings/` - Company settings
- `components/team/` - Team components
- PWA manifest and service worker
- `app/actions/team.ts` - Team server actions

---

For detailed module documentation, see:
- [Projects Module](modules/projects-module.md)
- [Tasks Module](modules/tasks-module.md)
- [Phase System](modules/phase-system.md)
- [Database Schema](database-schema.md)
