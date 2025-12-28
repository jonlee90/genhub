# Projects Module Documentation

**Last Updated**: 2025-12-06
**Module Path**: `app/app/projects/`, `components/projects/`
**Status**: Epic 2 Complete

## Overview

The Projects module manages construction projects from creation through completion. It provides project list views, detailed project pages with Metro Journey visualization, team management, and settings.

## Module Architecture

### Routes

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/app/projects` | `app/app/projects/page.tsx` | Server | Projects list with filters |
| `/app/projects/new` | `app/app/projects/new/page.tsx` | Server | Create new project |
| `/app/projects/[id]` | `app/app/projects/[id]/page.tsx` | Server | Project detail with tabs |

### Server Actions

**File**: `app/actions/projects.ts`

| Action | Purpose | Permissions |
|--------|---------|-------------|
| `createProject(formData)` | Create new project | gc_admin, project_manager |
| `updateProject(formData)` | Update project details | gc_admin, project_manager |
| `updateProjectStatus(formData)` | Change project status | gc_admin, project_manager |
| `assignProjectTeamMember(formData)` | Add team member | gc_admin, project_manager |
| `removeProjectTeamMember(formData)` | Remove team member | gc_admin, project_manager |

### Components

#### List & Filter Components

**ProjectList** (`components/projects/ProjectList.tsx`)
- Client component for displaying project grid
- Handles client-side filtering and sorting
- Staggered entrance animations
- Empty states (no projects, no results)

**ProjectCard** (`components/projects/ProjectCard.tsx`)
- Individual project card with gradient borders
- Health score visualization
- Project type icons (Home, Coffee, Building, Factory)
- Status badges with pulse animation
- Hover effects with shadow transitions

**ProjectFilters** (`components/projects/ProjectFilters.tsx`)
- Search bar with clear button
- Status dropdown filter
- Project type dropdown
- Sort order dropdown
- Clear all filters button

**ProjectListSkeleton** (`components/projects/ProjectListSkeleton.tsx`)
- Loading skeleton for projects list
- Shimmer animation effect

#### Creation Components

**CreateProjectForm** (`components/projects/CreateProjectForm.tsx`)
- Multi-section project creation form
- Project type selection with visual cards
- Template preview sidebar
- Budget and timeline inputs
- Address fields (address, city, state, ZIP)
- Form validation with Zod
- Success redirect to project detail

#### Detail & Visualization Components

**ProjectDetailContent** (`components/projects/ProjectDetailContent.tsx`)
- Tab navigation wrapper (Overview, Team, Tasks, Settings)
- Conditional stats dashboard (shows on all tabs except Tasks)
- Task-specific stats (shows only on Tasks tab)
- Breadcrumb navigation
- Status badge display

**ProjectOverview** (`components/projects/ProjectOverview.tsx`)
- Metro Journey visualization
- Project description card
- Key details sidebar (dates, budget, client)
- Project information display

**MetroJourney** (`components/projects/MetroJourney.tsx`)
- Subway-style phase visualization
- Horizontal scrolling timeline
- Color-coded track segments (completed, in-progress, pending)
- Phase selection for detail view
- Shimmer animation on in-progress tracks

**PhaseStation** (`components/projects/PhaseStation.tsx`)
- Individual phase circle/station
- Completion percentage ring
- Construction-themed icons per phase:
  - Initiation: Rocket
  - Pre-Construction: FileText (blueprint)
  - Procurement: ShoppingCart
  - Construction: HardHat
  - Post-Construction: CheckCircle2
- Warning indicators (blocked/overdue tasks)
- Active phase animation (pulse)
- Hover scale effect

**PhaseDetailPanel** (`components/projects/PhaseDetailPanel.tsx`)
- Expandable phase details
- Task list with status badges
- Warning banners (blockers, overdue)
- Progress stats
- Add Task and View All Tasks CTAs

#### Management Components

**ProjectTeam** (`components/projects/ProjectTeam.tsx`)
- Team member list with avatars
- Role badges (color-coded)
- Remove member functionality
- Empty state
- Add Member button (placeholder)

**ProjectSettings** (`components/projects/ProjectSettings.tsx`)
- Edit project details form
- Budget and date fields
- Status change dropdown
- Danger zone with archive button
- AlertDialog confirmation

---

## Data Flow

### 1. Projects List Page

```
app/app/projects/page.tsx (Server Component)
↓
Fetch projects from Supabase
↓
Pass to ProjectList (Client Component)
↓
ProjectFilters (user input) → Local filtering
↓
ProjectCard × N (render grid)
```

**Server Component** (`page.tsx`):
```typescript
const { data: projects } = await supabase
  .from('projects')
  .select(`
    *,
    project_phases!inner (
      id, name, status, completion_percentage, order_index
    )
  `)
  .eq('company_id', companyId)
  .order('created_at', { ascending: false });
```

**Client Component** (`ProjectList.tsx`):
- Manages filter state (search, status, type, sort)
- Applies filters to `initialProjects`
- Renders `ProjectCard` for each filtered project

### 2. Project Creation

```
app/app/projects/new/page.tsx (Server Component)
↓
CreateProjectForm (Client Component)
↓
User submits form
↓
createProject() Server Action
↓
Validate → Insert → Trigger creates phases
↓
Revalidate path → Redirect to /app/projects/[id]
```

**Server Action** (`app/actions/projects.ts`):
```typescript
export async function createProject(formData: FormData) {
  // 1. Validate with Zod
  const validated = createProjectSchema.safeParse(data);

  // 2. Get user context
  const { userId, companyId, role } = await getUserContext();

  // 3. Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions' };
  }

  // 4. Insert project
  const { data: project } = await supabase
    .from('projects')
    .insert({ ...validated.data, company_id: companyId, created_by: userId })
    .select()
    .single();

  // 5. Database trigger auto-creates 5 default phases

  // 6. Revalidate and redirect
  revalidatePath('/app/projects');
  redirect(`/app/projects/${project.id}`);
}
```

### 3. Project Detail Page

```
app/app/projects/[id]/page.tsx (Server Component)
↓
Fetch project + phases + team + tasks
↓
Pass to ProjectDetailContent (Client Component)
↓
Tab navigation (Overview | Team | Tasks | Settings)
↓
Render active tab content
```

**Data Fetching**:
```typescript
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    project_phases!inner (
      id, name, status, completion_percentage, started_at, completed_at, order_index, notes
    ),
    project_team (
      user_id,
      responsibility,
      user_profiles (id, name, email, avatar_url)
    ),
    tasks (
      id, title, status, priority, phase_id, due_date, assignee_id,
      assignee:user_profiles!tasks_assignee_id_fkey (id, name, email, avatar_url)
    )
  `)
  .eq('id', params.id)
  .single();
```

**Tab Content**:
- **Overview**: MetroJourney + Project description + Key details
- **Team**: ProjectTeam component
- **Tasks**: TaskBoard component (project context mode)
- **Settings**: ProjectSettings component

---

## Component Props & Integration

### ProjectList

```typescript
interface ProjectListProps {
  initialProjects: Array<{
    id: string;
    name: string;
    status: 'active' | 'on_hold' | 'completed' | 'cancelled';
    project_type: 'residential' | 'restaurant_cafe' | 'commercial_office' | 'industrial';
    health_score: number | null;
    completion_percentage: number | null;
    budget: number | null;
    project_phases: Array<{
      id: string;
      name: string;
      status: 'pending' | 'in_progress' | 'completed';
      completion_percentage: number | null;
    }>;
    project_team: Array<any>;
    client_name: string | null;
  }>;
}
```

**State**:
- `filteredProjects` - Computed from filters
- `searchQuery`, `statusFilter`, `typeFilter`, `sortBy` - Filter state

### ProjectCard

```typescript
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    project_type: string;
    health_score: number | null;
    completion_percentage: number | null;
    budget: number | null;
    project_phases?: Array<any>;
    project_team?: Array<any>;
    client_name: string | null;
  };
}
```

**Features**:
- Colored top border based on project type
- Health score with color-coded background
- Completion progress bar
- Status badge with icon and pulse
- Budget display (formatted as $XXk)
- Team size indicator

### MetroJourney

```typescript
interface MetroJourneyProps {
  phases: Array<{
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    completion_percentage: number | null;
    started_at: string | null;
    completed_at: string | null;
    order_index: number;
    notes: string | null;
  }>;
  tasks: Task[];
  phaseStats: PhaseStats[];
  projectId: string;
  projects?: Project[];
  teamMembers?: TeamMember[];
}
```

**State**:
- `selectedPhaseId` - Currently selected phase
- Expands PhaseDetailPanel when phase clicked

**Rendering**:
1. Sort phases by `order_index`
2. Render PhaseStation for each phase
3. Connect stations with colored track line
4. Show PhaseDetailPanel if phase selected

### PhaseStation

```typescript
interface PhaseStationProps {
  phase: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    completion_percentage: number | null;
  };
  isSelected: boolean;
  onClick: () => void;
  hasBlockers?: boolean;
  hasOverdue?: boolean;
}
```

**Visual States**:
- Pending: Gray circle, no percentage
- In Progress: Blue gradient, percentage display, pulse animation
- Completed: Green gradient, checkmark badge

---

## Project Templates

**File**: `lib/project-templates.ts`

Templates define suggested tasks per phase for each project type:

```typescript
export const PROJECT_TEMPLATES: Record<ProjectType, ProjectTemplate> = {
  residential: {
    label: 'Residential',
    icon: Home,
    suggestedBudget: [100000, 500000],
    estimatedDuration: { min: 6, max: 12 },
    phases: {
      initiation: ['Site survey', 'Permit applications', ...],
      pre_construction: ['Architectural drawings', 'Engineering plans', ...],
      procurement: ['Material ordering', 'Supplier contracts', ...],
      construction: ['Foundation work', 'Framing', ...],
      post_construction: ['Final inspection', 'Punch list', ...],
    },
  },
  // ... restaurant_cafe, commercial_office, industrial
};
```

Used in **CreateProjectForm** to show template preview in sidebar.

---

## Design Patterns

### Construction-Themed Colors

**Project Type Gradients**:
- Residential: `from-blue-50 to-blue-100/50`
- Restaurant/Cafe: `from-amber-50 to-amber-100/50`
- Commercial: `from-purple-50 to-purple-100/50`
- Industrial: `from-slate-50 to-slate-100/50`

**Status Colors**:
- Active: `construction-green` (#059669)
- On Hold: `construction-accent` (#3C3C3C)
- Completed: `construction-blue` (#001B51)
- Cancelled: Red (#DC2626)

**Health Score Thresholds**:
- 80-100: Green (construction-green)
- 60-79: Blue (construction-blue)
- 40-59: Gray (construction-accent #3C3C3C)
- 0-39: Red (construction-red)

### Animations

**Framer Motion** used throughout:
- Entrance animations: `fade-in` + `slide-up`
- Staggered children: 50ms delays
- Hover effects: `scale(1.02)` + shadow
- Active states: Pulse animation
- Transitions: 300ms with easeOut

**Shimmer Effects**:
- In-progress track segments
- Loading skeletons

### Empty States

**No Projects**:
- Large gradient circle with PlusCircle icon
- Animated plus badge
- 3-step guide
- CTA button to create project

**No Results** (filtered):
- Search icon in gradient circle
- Clear explanation
- "Clear All Filters" button

---

## Phase Integration

Projects and phases have a **parent-child relationship**:

1. **Project Created** → Trigger auto-creates 5 phases
2. **Tasks Assigned to Phases** → Phase completion auto-calculated
3. **Phase Completion Changes** → Project completion auto-updated

**Phase Names** (Universal):
1. Initiation
2. Pre-Construction
3. Procurement
4. Construction
5. Post-Construction

**Phase Flow**:
- `pending` → `in_progress` → `completed`
- Only one phase can be `in_progress` at a time (convention, not enforced)
- Phases displayed in `order_index` sequence

See [Phase System Documentation](phase-system.md) for details.

---

## Team Management

**Project Team Assignment**:
- Managed via `project_team` table
- Many-to-many: Users can be on multiple projects
- Displays in ProjectTeam component
- Add/remove via Server Actions

**Team Display**:
- Avatar + Name
- Role badge (from `company_users.role`)
- Responsibility field (optional)

**Permissions**:
- gc_admin and project_manager can assign/remove
- All company members can view team

---

## Health Score Calculation

**Current Implementation**: Placeholder field in database

**Future Implementation** (Epic 5):
- Factor 1: On-time completion (weight: 40%)
- Factor 2: Budget adherence (weight: 30%)
- Factor 3: Task blockers (weight: 20%)
- Factor 4: Team efficiency (weight: 10%)

**Display**:
- 0-100 numeric score
- Color-coded background
- Shown on ProjectCard and ProjectOverview

---

## Error Handling

**Error Boundaries**:
- `app/app/projects/error.tsx` - List page errors
- `app/app/projects/[id]/error.tsx` - Detail page errors
- `app/app/projects/new/error.tsx` - Creation page errors

**Loading States**:
- `app/app/projects/[id]/loading.tsx` - Detail page loading
- `app/app/projects/new/loading.tsx` - Creation page loading
- `ProjectListSkeleton` - List loading

**Validation**:
- Zod schemas in Server Actions
- Client-side required fields
- Error messages displayed in forms

---

## Future Enhancements

**Epic 4-5 Additions**:
- Project archival workflow
- Project duplication
- Project templates management
- Advanced health score calculation
- Project analytics dashboard
- Document management
- Change order tracking
- Client portal access control

---

## Related Documentation

- [Database Schema](../database-schema.md) - projects, project_phases, project_team tables
- [Phase System](phase-system.md) - Phase lifecycle and auto-calculations
- [Tasks Module](tasks-module.md) - TaskBoard integration in project detail
- [Project Structure](../project-structure.md) - File organization
