# Dashboard Redesign - Technical Design

## Overview
This document specifies the technical implementation for the GenHub dashboard redesign, including data fetching strategy, component architecture, and UI specifications.

## Requirements Reference
See: `.claude/specs/dashboard-redesign/requirements.md`

---

## Architecture Overview

### Component Hierarchy
```
DashboardPage (Server Component)
├── Data Fetching (getDashboardData)
└── DashboardContent (Client Component)
    ├── DashboardHeader
    │   └── WelcomeSection (simplified from current)
    ├── KPICardsGrid
    │   ├── KPICard (Active Projects)
    │   ├── KPICard (Tasks This Week)
    │   ├── KPICard (Budget Health)
    │   ├── KPICard (Schedule Status)
    │   ├── KPICard (Pending Approvals)
    │   └── KPICard (Team Size)
    ├── WidgetsGrid
    │   ├── ProjectStatusWidget
    │   ├── TaskProgressWidget
    │   ├── BudgetSummaryWidget
    │   ├── ScheduleHealthWidget
    │   ├── TeamActivityWidget
    │   └── MaterialsStatusWidget
    └── QuickActionsSection (PRESERVED from current)
```

### Data Flow
```
[Page Load]
     │
     ▼
[Server Component: DashboardPage]
     │
     ├──► getDashboardData(companyId) ──► Supabase
     │         │
     │         ▼
     │    [Aggregated Dashboard Data]
     │         │
     ▼         ▼
[Pass data as props to DashboardContent]
     │
     ▼
[Client Component: DashboardContent]
     │
     ├──► KPICardsGrid (receives: kpis)
     ├──► WidgetsGrid (receives: widgets data)
     └──► QuickActionsSection (static)
```

---

## Data Model

### DashboardData Interface

```typescript
interface DashboardData {
  // KPI Section
  kpis: {
    activeProjects: number;
    totalProjects: number;
    projectsTrend: number; // % change from last month

    tasksThisWeek: number;
    tasksDueToday: number;
    tasksOverdue: number;

    budgetUtilization: number; // percentage (actual/planned * 100)
    totalPlannedBudget: number;
    totalActualSpend: number;

    scheduleOnTime: number;
    scheduleAtRisk: number;
    scheduleDelayed: number;

    pendingExpenses: number;
    pendingExpenseAmount: number;
    pendingApprovals: number; // tasks needing approval

    teamSize: number;
    unassignedTasks: number;
  };

  // Project Status Widget
  projectStatus: {
    active: number;
    onHold: number;
    completed: number;
    archived: number;
  };

  // Task Progress Widget
  taskProgress: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    blocked: number;
    overdue: number;
    completionRate: number;
    velocityTrend: number; // % change in tasks/day
  };

  // Budget Summary Widget
  budgetSummary: {
    totalPlanned: number;
    totalActual: number;
    variance: number; // positive = under budget
    utilizationPercent: number;
    pendingExpenses: {
      count: number;
      amount: number;
    };
    expensesByCategory: Array<{
      category: string;
      amount: number;
    }>;
  };

  // Schedule Health Widget
  scheduleHealth: {
    onTime: number;
    atRisk: number; // due within 3 days
    overdue: number;
    onTimePercent: number;
  };

  // Team Activity Widget
  teamActivity: {
    totalMembers: number;
    topAssignees: Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
      taskCount: number;
    }>;
    unassignedTasks: number;
  };

  // Materials Status Widget
  materialsStatus: {
    needed: number;
    ordered: number;
    delivered: number;
    total: number;
  };
}
```

### No New Database Tables Required
All data is aggregated from existing tables:
- `projects` - Project counts and statuses
- `tasks` - Task metrics, completion, schedule
- `expenses` - Budget and expense data
- `materials` - Material procurement status
- `company_users` + `user_profiles` - Team data
- `task_assignees` - Workload distribution

---

## Server Action

### `getDashboardData(companyId: string): Promise<DashboardDataResult>`

**Purpose:** Single optimized query to fetch all dashboard data
**Location:** `app/actions/dashboard.ts` (NEW FILE)

**Input:**
```typescript
// No complex input - uses authenticated user's company
```

**Output:**
```typescript
interface DashboardDataResult {
  data?: DashboardData;
  error?: string;
}
```

**Implementation Strategy:**
```typescript
// Use parallel queries for performance
const [
  projectStats,
  taskStats,
  expenseStats,
  materialStats,
  teamStats
] = await Promise.all([
  getProjectStats(supabase, companyId),
  getTaskStats(supabase, companyId),
  getExpenseStats(supabase, companyId),
  getMaterialStats(supabase, companyId),
  getTeamStats(supabase, companyId),
]);

// Aggregate into DashboardData structure
return { data: aggregateDashboardData(...) };
```

**Revalidation:** None (read-only, fresh on each page load)
**Cache:** Consider Next.js cache with 30-60 second revalidation

---

## UI Specification

### Layout Grid

```
┌─────────────────────────────────────────────────────────────────┐
│  WELCOME HEADER (simplified)                                     │
│  "Welcome back, [Name]. Here's your command center."            │
├─────────────────────────────────────────────────────────────────┤
│  KPI CARDS (6 cards in responsive grid)                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐│
│  │Active  │ │Tasks   │ │Budget  │ │Schedule│ │Pending │ │Team  ││
│  │Projects│ │This Wk │ │Health  │ │Status  │ │Approvals││Size  ││
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └──────┘│
├─────────────────────────────────────────────────────────────────┤
│  WIDGETS (2-column grid on desktop, stack on mobile)            │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  PROJECT STATUS      │  │  TASK PROGRESS       │             │
│  │  [Donut/Bar Chart]   │  │  [Progress Ring]     │             │
│  └──────────────────────┘  └──────────────────────┘             │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  BUDGET SUMMARY      │  │  SCHEDULE HEALTH     │             │
│  │  [Utilization Bar]   │  │  [Status Breakdown]  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  TEAM ACTIVITY       │  │  MATERIALS STATUS    │             │
│  │  [Assignee List]     │  │  [Procurement Flow]  │             │
│  └──────────────────────┘  └──────────────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS (PRESERVED - existing component)                  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ Create Project │ │ Add Task       │ │ Invite Team    │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | KPI Cards | Widgets | Quick Actions |
|------------|-----------|---------|---------------|
| Mobile (<640px) | 2 cols | 1 col | 1 col |
| Tablet (640-1024px) | 3 cols | 2 cols | 2 cols |
| Desktop (>1024px) | 6 cols | 2-3 cols | 3 cols |

---

## Component Specifications

### KPICard Component

**Purpose:** Display a single KPI metric with trend indicator
**Props:**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  variant: 'default' | 'success' | 'warning' | 'danger';
  href?: string; // Optional navigation on click
}
```

**Visual Design:**
```
┌─────────────────────────────────┐
│ [Icon]   Title        [Trend]  │
│          42                    │
│          Subtitle              │
└─────────────────────────────────┘
```

**Color Variants:**
- `default`: Gray border, construction-blue icon
- `success`: Green border/bg, green icon
- `warning`: Amber border/bg, amber icon
- `danger`: Red border/bg, red icon

---

### ProjectStatusWidget Component

**Purpose:** Show project distribution by status
**Props:**
```typescript
interface ProjectStatusWidgetProps {
  status: {
    active: number;
    onHold: number;
    completed: number;
    archived: number;
  };
}
```

**Visual Design:**
- Horizontal stacked bar showing proportions
- Legend below with clickable status labels
- Click navigates to /app/projects?status={status}

**Colors:**
- Active: construction-blue
- On Hold: construction-yellow
- Completed: construction-green
- Archived: gray-400

---

### TaskProgressWidget Component

**Purpose:** Show task completion metrics with visual progress
**Props:**
```typescript
interface TaskProgressWidgetProps {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completionRate: number;
  velocityTrend?: number;
}
```

**Visual Design:**
- Large progress ring/circle in center
- Completion percentage in center of ring
- Metrics list on the side:
  - Completed (green)
  - In Progress (blue)
  - Blocked (amber)
  - Overdue (red)
- Click navigates to /app/tasks

---

### BudgetSummaryWidget Component

**Purpose:** Show budget utilization and expense status
**Props:**
```typescript
interface BudgetSummaryWidgetProps {
  totalPlanned: number;
  totalActual: number;
  variance: number;
  utilizationPercent: number;
  pendingExpenses: {
    count: number;
    amount: number;
  };
}
```

**Visual Design:**
- Utilization progress bar (horizontal)
- Color changes based on utilization:
  - 0-80%: construction-green
  - 80-100%: construction-yellow
  - >100%: construction-red
- Planned vs Actual comparison
- Pending expenses with CTA button

---

### ScheduleHealthWidget Component

**Purpose:** Show on-time vs at-risk vs delayed breakdown
**Props:**
```typescript
interface ScheduleHealthWidgetProps {
  onTime: number;
  atRisk: number;
  overdue: number;
  onTimePercent: number;
}
```

**Visual Design:**
- Three status rows with counts
- Traffic light colors (green/amber/red)
- Overall on-time percentage highlighted
- Icon indicators for each status

---

### TeamActivityWidget Component

**Purpose:** Show team workload distribution
**Props:**
```typescript
interface TeamActivityWidgetProps {
  totalMembers: number;
  topAssignees: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    taskCount: number;
  }>;
  unassignedTasks: number;
}
```

**Visual Design:**
- Total team count header
- List of top 5 assignees with avatars and task counts
- Horizontal bars showing relative workload
- Unassigned tasks count (warning if >0)
- Click navigates to /app/team

---

### MaterialsStatusWidget Component

**Purpose:** Show material procurement pipeline
**Props:**
```typescript
interface MaterialsStatusWidgetProps {
  needed: number;
  ordered: number;
  delivered: number;
}
```

**Visual Design:**
- Three-stage flow visualization:
  ```
  Needed → Ordered → Delivered
   [12]     [8]       [25]
  ```
- Arrow or pipeline visual connecting stages
- Click navigates to /app/materials

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| Not authenticated | Redirect to login | - |
| No company | Redirect to onboarding | "Please set up your company" |
| Partial data failure | Show available data | Widget-specific error states |
| Complete failure | Error boundary | "Failed to load dashboard. Try again." |

---

## Loading States

### Skeleton Strategy
Each widget has a skeleton variant:

```typescript
// KPICard skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
  <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
  <div className="h-3 bg-gray-200 rounded w-24" />
</div>

// Widget skeleton
<div className="animate-pulse p-6">
  <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
  <div className="h-32 bg-gray-200 rounded" />
</div>
```

### Loading Flow
1. Page shell renders immediately (header, layout)
2. Suspense boundary shows skeletons
3. Data loads, components hydrate
4. Animations trigger on mount

---

## Security Considerations
- All data fetched server-side in Server Component
- Company isolation enforced via RLS
- No sensitive data passed to client unnecessarily
- Auth check in getDashboardData action

---

## Performance Considerations
- Single aggregated query vs. multiple round trips
- Parallel Promise.all for sub-queries
- Consider React cache() for repeated requests
- Skeleton loading prevents layout shift
- No client-side data fetching on initial load

---

## File Structure

```
app/
├── app/
│   └── page.tsx                    # Server Component (modified)
├── actions/
│   └── dashboard.ts                # NEW: getDashboardData action
components/
├── dashboard/                       # NEW directory
│   ├── DashboardContent.tsx        # Main client component
│   ├── DashboardHeader.tsx         # Welcome section
│   ├── KPICard.tsx                 # KPI card component
│   ├── KPICardsGrid.tsx            # Grid of KPI cards
│   ├── ProjectStatusWidget.tsx     # Project status widget
│   ├── TaskProgressWidget.tsx      # Task progress widget
│   ├── BudgetSummaryWidget.tsx     # Budget widget
│   ├── ScheduleHealthWidget.tsx    # Schedule widget
│   ├── TeamActivityWidget.tsx      # Team widget
│   ├── MaterialsStatusWidget.tsx   # Materials widget
│   ├── WidgetsGrid.tsx             # Widget container grid
│   └── index.ts                    # Exports
types/
└── dashboard.ts                     # NEW: DashboardData types
```

---

## Design System Compliance

### Colors (from DESIGN_SYSTEM.md)
- Primary: `#001B51` (construction-blue)
- Success: `#059669` (construction-green)
- Error: `#DC2626` (construction-red)
- Warning: `#FBBF24` (construction-yellow)
- Accent: `#3C3C3C`

### Icons (Lucide only)
- FolderKanban: Projects
- CheckSquare: Tasks
- DollarSign / Wallet: Budget
- Clock / Calendar: Schedule
- Users: Team
- Package: Materials
- TrendingUp / TrendingDown: Trends
- AlertCircle: Warnings

### Typography
- Widget titles: `text-lg font-semibold`
- KPI values: `text-3xl md:text-4xl font-bold`
- Subtitles: `text-sm text-gray-500`

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)
