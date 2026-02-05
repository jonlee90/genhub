# /app/projects Page - Complete Documentation

> Comprehensive guide to the projects page architecture, components, and data flow in GenHub PWA

---

## Table of Contents
1. [Routing Structure](#1-routing-structure)
2. [Page Architecture](#2-page-architecture)
3. [Components Overview](#3-components-overview)
4. [Data Layer](#4-data-layer)
5. [Server Actions](#5-server-actions)
6. [Database Schema](#6-database-schema)
7. [Component Interaction Flow](#7-component-interaction-flow)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Security & Permissions](#9-security--permissions)
10. [Data Flow Diagrams](#10-data-flow-diagrams)

---

## 1. Routing Structure

```
/app/projects/
├── page.tsx                    # Projects List (main page)
├── loading.tsx                 # Loading skeleton for list
├── error.tsx                   # Error boundary for list
├── new/
│   ├── page.tsx               # Create new project page
│   ├── loading.tsx            # Loading skeleton for form
│   └── error.tsx              # Error boundary for form
└── [id]/
    ├── page.tsx               # Project detail page
    ├── loading.tsx            # Loading skeleton for detail
    └── error.tsx              # Error boundary for detail
```

**Routes:**
| Route | Purpose | Component Type |
|-------|---------|----------------|
| `/app/projects` | Projects list with filters | Server → Client |
| `/app/projects/new` | Create new project form | Client |
| `/app/projects/[id]` | Project detail with tabs | Server → Client |

---

## 2. Page Architecture

### 2.1 Projects List Page (`/app/projects/page.tsx`)

**Type:** Server Component
**Data Fetcher:** `getProjectsPageData()` from `lib/projects.ts`

**Data Flow:**
```
page.tsx (Server)
    ↓
getProjectsPageData()
    ├── auth() → session
    ├── getProjectsWithStats(companyId) → projects[]
    └── getProjectTypes() → projectTypes[]
    ↓
ProjectsPageClient (Client)
    ├── Props: projects, totalCount, role, companyId, projectTypes
    └── Renders: filters, grid, modals
```

**What it fetches:**
- Projects with aggregated stats (task counts, expenses, schedule status)
- User role for permission checks
- Company ID for data isolation
- Project types for creation modal

### 2.2 Project Detail Page (`/app/projects/[id]/page.tsx`)

**Type:** Server Component with dynamic params
**Data Fetcher:** `getProjectDetailData(id)` from `lib/projects.ts`

**Data Flow:**
```
page.tsx (Server)
    ↓
getProjectDetailData(projectId)
    ├── Phase 1: Project + phases + team + tasks
    ├── Phase 2: Parallel queries (files, photos, costs, stats)
    └── Phase 3: Data assembly
    ↓
ProjectDetailContent (Client)
    └── Tabs: Overview, Tasks, Team, Files, Settings
```

**What it fetches:**
- Full project details with all relations
- Phase task statistics
- Task dependencies
- Expense & task stats
- Project files & photos
- Team cost summaries
- Task types for creation

### 2.3 Create Project Page (`/app/projects/new/page.tsx`)

**Type:** Client Component
**Wrapper:** `CreateProjectForm` with `isModal={false}`

---

## 3. Components Overview

### 3.1 Main List Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProjectsPageClient` | `components/projects/` | Main list orchestrator |
| `ProjectFilters` | `components/projects/` | Search, status, type, sort controls |
| `ProjectCard` | `components/projects/` | Individual project card |
| `PortfolioSummary` | `components/shared/` | Portfolio statistics dashboard |
| `CreateProjectModal` | `components/projects/` | Modal wrapper for project creation |

### 3.2 Detail Page Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProjectDetailContent` | `components/projects/` | Detail page with tabs |
| `ProjectOverview` | `components/projects/` | Overview tab: stats, metro journey |
| `ProjectTeam` | `components/projects/` | Team tab: members & subcontractors |
| `TaskBoard` | `components/tasks/` | Tasks tab: Kanban view |
| `ProjectFilesTab` | `components/projects/files/` | Files tab: documents & photos |
| `ProjectSettings` | `components/projects/` | Settings tab: configuration |

### 3.3 Form Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CreateProjectForm` | `components/projects/` | Multi-step creation form |
| `ProjectTypeSelector` | `components/projects/form/` | Interactive type cards |
| `AddMemberModal` | `components/projects/` | Add team member |
| `AddSubcontractorModal` | `components/projects/` | Add subcontractor |
| `ManagePhasesModal` | `components/projects/` | Phase CRUD |

### 3.4 Component Hierarchy

```
ProjectsPageClient
├── ProjectFilters
│   ├── VanishingPlaceholderInput (search)
│   ├── FilterTabs / DesktopTabs (status)
│   └── Select dropdowns (type, sort)
├── PortfolioSummary
├── ProjectGrid
│   └── ProjectCard[] (memoized)
└── CreateProjectModal (dynamic import)
    └── CreateProjectForm
        └── ProjectTypeSelector

ProjectDetailContent
├── Hero Section (name, status, stats)
├── Tab Navigation
├── ProjectOverview
│   ├── MetroJourney (dynamic import)
│   ├── ProjectTaskSummary
│   ├── ProjectExpenseSummary
│   └── TeamCostSummaryCards
├── ProjectTeam
│   ├── AddMemberModal
│   └── AddSubcontractorModal
├── TaskBoard
│   └── TaskModal (dynamic import)
├── ProjectFilesTab
│   ├── PhotoGallerySection
│   └── DocumentsSection
└── ProjectSettings
```

---

## 4. Data Layer

### 4.1 Data Fetching Library (`lib/projects.ts`)

**`getProjectsPageData()`**
```typescript
// Returns for list page
{
  projects: ProjectWithStats[]
  totalCount: number
  role: string | null
  companyId: string
  projectTypes: ProjectTypeConfigsRow[]
}
```

**`getProjectDetailData(id)`**
```typescript
// Returns for detail page
{
  project: ProjectWithRelations
  phaseTaskStats: PhaseTaskStats[]
  taskDependencies: TaskDependency[]
  expenseStats: ExpenseStats
  taskStats: TaskStats
  projectFiles: ProjectFile[]
  projectPhotos: ProjectPhoto[]
  teamCostSummaries: TeamCostSummary[]
  taskTypes: TaskTypeConfig[]
}
```

### 4.2 Key Types

**ProjectWithStats:**
```typescript
ProjectsRow & {
  stats: {
    actualSpent: number
    schedule: { status: 'on-time' | 'at-risk' | 'delayed', daysRemaining: number }
    taskCounts: { total, completed, overdue }
    teamSize: number
  }
}
```

**ProjectTeamMember:**
```typescript
{
  id: string
  user_id?: string | null
  subcontractor_id?: string | null
  role: string
  user_profiles?: { id, name, email, avatar_url }
  subcontractors?: { id, company_name, contact_name, trade_specialization }
}
```

---

## 5. Server Actions

**File:** `app/actions/projects.ts`

### 5.1 Write Operations

| Action | Purpose | Revalidates |
|--------|---------|-------------|
| `createProject(formData)` | Create new project | `projects`, `dashboard` |
| `updateProject(formData)` | Update project fields | `/app/projects`, `/app/projects/[id]` |
| `updateProjectStatus(id, status)` | Change status | Dashboard KPIs |
| `addProjectTeamMember(projectId, userId, role)` | Add team member | Project detail |
| `addSubcontractorToProject(projectId, subcontractorId)` | Add subcontractor | Project detail |
| `removeProjectTeamMember(projectId, userId)` | Remove member | Project detail |
| `removeSubcontractorFromProject(projectId, subcontractorId)` | Remove subcontractor | Project detail |

### 5.2 Read Operations

| Action | Purpose | Optimization |
|--------|---------|--------------|
| `getProjectsWithStats(companyId, options)` | List with stats | RPC function (1 query vs 4) |
| `getProjectWithStats(projectId)` | Single project stats | RPC function |
| `getProjectTeamCostSummary(projectId)` | Team cost breakdown | RPC function |
| `getProjectsForModal()` | Minimal list for dropdowns | 500 bytes/project |
| `getTeamMembersForModal()` | Minimal team list | 100 bytes/member |
| `getModalData()` | Combined modal data | Parallel + cached |

---

## 6. Database Schema

### 6.1 Projects Table

```typescript
ProjectsRow = {
  id: string (UUID)
  company_id: string
  name: string
  client_name: string
  client_email?: string
  client_phone?: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  description?: string
  project_type: string
  project_type_config_id?: string
  status: 'active' | 'on_hold' | 'completed' | 'archived' | 'planning' | 'in_progress'
  budget?: number
  actual_cost?: number
  completion_percentage?: number
  health_score?: number
  start_date: string
  end_date?: string
  image_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}
```

### 6.2 Related Tables

| Table | Relationship | Purpose |
|-------|--------------|---------|
| `project_phases` | 1:many | Project milestones/phases |
| `project_team` | 1:many | Team member assignments |
| `project_files` | 1:many | Document attachments |
| `project_photos` | 1:many | Site photos |
| `tasks` | 1:many via phases | Project tasks |
| `project_type_configs` | many:1 | Project type definitions |

### 6.3 RLS Policies

All queries filtered by `company_id` using helper:
```sql
get_user_company_id(next_auth.uid())
```

---

## 7. Component Interaction Flow

### 7.1 Projects List Flow

```
User visits /app/projects
    ↓
Server: getProjectsPageData()
    ├── Fetch projects with stats (RPC)
    └── Fetch project types
    ↓
Client: ProjectsPageClient renders
    ↓
User interacts with filters
    ├── Search → filters projects by name/client/address
    ├── Status → filters by status + shows live counts
    ├── Type → filters by project type
    └── Sort → re-orders filtered results
    ↓
User clicks project card
    ↓
Navigate to /app/projects/[id]
```

### 7.2 Project Detail Flow

```
User visits /app/projects/[id]
    ↓
Server: getProjectDetailData(id)
    ├── Phase 1: Project + phases + team + tasks
    ├── Phase 2: 8-10 parallel queries
    └── Phase 3: Data assembly
    ↓
Client: ProjectDetailContent renders
    ├── Hero section with stats
    └── Tabs (lazy rendered)
    ↓
User clicks tab
    ↓
Tab content renders (only active tab mounted)
    ↓
User opens modal (task/member/etc.)
    ↓
Dynamic import loads modal component
```

### 7.3 Create Project Flow

```
User clicks "New Project" button
    ↓
CreateProjectModal opens (dynamic import)
    ↓
CreateProjectForm renders
    ├── Step 1: Select project type
    │   └── Loads phase templates for selected type
    ├── Step 2: Enter project details
    ├── Step 3: Enter location
    └── Step 4: Set timeline & budget
    ↓
User submits form
    ↓
Server Action: createProject()
    ├── Validates with Zod schema
    ├── Creates project record
    ├── Triggers phase/task auto-creation
    └── Refreshes dashboard KPIs
    ↓
router.refresh() → List reloads
```

---

## 8. Performance Optimizations

### 8.1 Code Splitting (Dynamic Imports)

| Component | Savings | When Loaded |
|-----------|---------|-------------|
| `CreateProjectModal` | ~40KB | When modal opens |
| `MetroJourney` | ~15KB | When overview tab active |
| `TaskModal` | ~25KB | When task modal opens |

### 8.2 Query Optimizations

| Pattern | Benefit |
|---------|---------|
| RPC functions | 4 queries → 1 (1200ms → 150ms) |
| Parallel queries (Phase 2) | 8 queries in ~300ms |
| React.cache() | Request deduplication |
| Conditional queries | Only fetch if IDs exist |
| Lazy modal data | 800ms delay, smaller payload |

### 8.3 Rendering Optimizations

| Pattern | Location | Benefit |
|---------|----------|---------|
| Memoized components | ProjectCard, NoResultsState | Prevent re-renders |
| CSS stagger animations | ProjectGrid | No per-item Framer Motion |
| Direct icon imports | All components | Avoid barrel file penalty |
| Lazy tab rendering | ProjectDetailContent | Only mount active tab |

### 8.4 Cache Strategy

| Data | Cache Life | Tags |
|------|------------|------|
| Projects list | 5 min | `projects`, `projects-{companyId}` |
| Project detail | 1 min | `project-{id}` |
| Modal data | Request-scoped | React.cache() |

---

## 9. Security & Permissions

### 9.1 Role-Based Access

| Action | Required Role |
|--------|---------------|
| Create project | admin, project_manager |
| Update project | admin, project_manager |
| Add team member | admin, project_manager |
| View project | Any authenticated user in company |

### 9.2 Data Isolation

- **RLS Policies:** All tables filtered by `company_id`
- **Server Actions:** Verify `company_id` before mutations
- **No client-side DB access:** All queries via Server Actions

### 9.3 Validation

| Layer | Technology | Purpose |
|-------|------------|---------|
| Client | React Hook Form | UX feedback |
| Server | Zod schemas | Security enforcement |
| Database | RLS policies | Data isolation |

---

## 10. Data Flow Diagrams

### 10.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │  ProjectsPage   │  │  ProjectDetail   │  │    CreateProjectForm        │ │
│  │    Client       │  │     Client       │  │        Client               │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┬──────────────┘ │
│           │                    │                           │                 │
└───────────┼────────────────────┼───────────────────────────┼─────────────────┘
            │ props              │ props                     │ Server Action
            │                    │                           │
┌───────────┼────────────────────┼───────────────────────────┼─────────────────┐
│           │                    │                           │    SERVER       │
│  ┌────────▼────────┐  ┌────────▼─────────┐  ┌──────────────▼──────────────┐ │
│  │  page.tsx       │  │  [id]/page.tsx   │  │     app/actions/            │ │
│  │  (Server)       │  │    (Server)      │  │     projects.ts             │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┬──────────────┘ │
│           │                    │                           │                 │
│  ┌────────▼────────────────────▼───────────────────────────▼──────────────┐ │
│  │                      lib/projects.ts                                    │ │
│  │              getProjectsPageData() | getProjectDetailData()             │ │
│  └────────────────────────────────┬───────────────────────────────────────┘ │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │ Supabase Client
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                                   ▼           SUPABASE                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           RLS Policies                                  │ │
│  │              company_id = get_user_company_id(auth.uid())              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
│  ┌────────────────┐  ┌────────────┴────────────┐  ┌─────────────────────┐   │
│  │   projects     │  │   RPC Functions         │  │  Related Tables     │   │
│  │   table        │◄─┤   get_projects_with_    │  │  - project_phases   │   │
│  │                │  │   stats()               │  │  - project_team     │   │
│  └────────────────┘  │   get_project_detail_   │  │  - tasks            │   │
│                      │   with_stats()          │  │  - project_files    │   │
│                      └─────────────────────────┘  │  - project_photos   │   │
│                                                   └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Tab Lazy Rendering Pattern

```
ProjectDetailContent
       │
       │  State: activeTab = 'overview'
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                              TAB BAR                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Overview │ │  Team    │ │  Tasks   │ │  Files   │ │ Settings ││
│  │ (active) │ │          │ │          │ │          │ │          ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
└──────────────────────────────────────────────────────────────────┘
       │
       │  Conditional Render:
       │  {activeTab === 'overview' && <ProjectOverview />}
       │  {activeTab === 'team'     && <ProjectTeam />}
       │  {activeTab === 'tasks'    && <TaskBoard />}
       │  {activeTab === 'files'    && <ProjectFilesTab />}
       │  {activeTab === 'settings' && <ProjectSettings />}
       │
       ▼
  Only active tab component is mounted
  Other tabs return null (not rendered)
```

### 10.3 Query Optimization (RPC vs Multiple Queries)

```
WITHOUT RPC (4 queries, ~1200ms)       WITH RPC (1 query, ~150ms)
─────────────────────────────          ───────────────────────────

Query 1: projects (200ms)              RPC: get_projects_with_stats()
         ↓                                   │
Query 2: task counts (300ms)                 │  Single query with CTEs:
         ↓                                   │  - projects base
Query 3: expense stats (400ms)               │  - task_stats CTE
         ↓                                   │  - expense_stats CTE
Query 4: team counts (300ms)                 │  - team_stats CTE
         ↓                                   │
JS: Combine results (100ms)                  ▼
                                       Returns JSONB with all stats
Total: ~1200ms                         Total: ~150ms (8x faster)
```

### 10.4 Form Validation Pipeline

```
User Input → Client Validation → Server Validation → Database
     │              │                   │                │
     │    React Hook Form        Zod schema.parse()  Constraints
     │    (UX feedback)          (Security)          + RLS
     │              │                   │                │
     ▼              ▼                   ▼                ▼
  Typing      Real-time          Server Action     INSERT with
  in form     error hints        safeParse()       company_id
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/app/projects/page.tsx` | Projects list page |
| `app/app/projects/[id]/page.tsx` | Project detail page |
| `app/app/projects/new/page.tsx` | Create project page |
| `components/projects/ProjectsPageClient.tsx` | List UI component |
| `components/projects/ProjectDetailContent.tsx` | Detail UI component |
| `components/projects/CreateProjectForm.tsx` | Creation form |
| `components/projects/ProjectCard.tsx` | Card component |
| `components/projects/ProjectFilters.tsx` | Filter controls |
| `lib/projects.ts` | Data fetching functions |
| `app/actions/projects.ts` | Server Actions |
| `types/db/tables/projects.ts` | Database types |
| `types/components/projects.ts` | Component types |
| `lib/validation/client-validation.ts` | Client validation rules |
| `lib/validation/schemas.ts` | Zod schemas |

---

## Summary

The `/app/projects` page is a comprehensive project management interface featuring:

1. **Three-route structure:** List, Detail, and Create pages
2. **Server-first architecture:** Data fetched on server, UI rendered on client
3. **Optimized queries:** RPC functions reduce 4 queries to 1
4. **Dynamic imports:** Heavy components loaded on-demand
5. **Company isolation:** RLS policies enforce data boundaries
6. **Multi-step form:** Project creation with phase template selection
7. **Tabbed detail view:** Overview, Tasks, Team, Files, Settings
