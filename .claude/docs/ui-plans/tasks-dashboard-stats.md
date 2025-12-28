# Tasks Dashboard Stats Redesign - Implementation Plan

## Overview
Replace the current "Industrial Stats Dashboard" section in `/app/app/tasks/page.tsx` with a new comprehensive 8-metric dashboard that provides deeper insights into project health, team performance, and cost tracking.

## CRITICAL: Filter Reactivity Requirement
**The dashboard stats MUST update dynamically when the user changes the Project filter in TaskFilters.**
- When "All Projects" is selected: Show stats for all tasks
- When a specific project is selected: Show stats filtered to that project only
- Stats should recalculate client-side based on the filtered `displayedTasks` array

## Current State Analysis

### Existing Stats (5 metrics - lines 338-414)
1. **Total Tasks** - Simple count
2. **Active Tasks** - Tasks with status 'in_progress'
3. **Completed Tasks** - Tasks with status 'completed'
4. **Overdue Tasks** - Tasks past due_date and not completed
5. **Blocked Tasks** - Tasks with status 'blocked'

### Current Layout
- Grid: `grid-cols-1 md:grid-cols-5` (5 equal columns on desktop)
- Each stat card has:
  - Gradient background overlay
  - Icon with colored background
  - Numeric value (large, bold)
  - Label text
  - Hover effects with shadow transitions

## New Requirements (8 metrics)

### Metrics to Implement

| # | Metric | Data Source | Calculation |
|---|--------|-------------|-------------|
| 1 | **Total Tasks** | tasks table | COUNT(*) |
| 2 | **Total Active Projects** | projects table | COUNT(*) WHERE status = 'active' |
| 3 | **Top 5 Projects by Health** | projects + tasks | ORDER BY health_score DESC LIMIT 5 |
| 4 | **Top 5 Team Members** | tasks + user_profiles | GROUP BY assignee_id, COUNT completed tasks |
| 5 | **Tasks Past Due** | tasks table | WHERE due_date < NOW() AND status != 'completed' |
| 6 | **Blocked Tasks** | tasks table | WHERE status = 'blocked' |
| 7 | **Sum of Actual Cost** | tasks table | SUM(actual_cost) |
| 8 | **Sum of Planned Cost** | tasks table | SUM(planned_cost) |

## Component Architecture

### Data Flow
```
TasksPage (Server Component)
    ↓
  getTasks() + getDashboardStats() (for Top 5 lists)
    ↓
  TasksClientWrapper (Client Component - manages filters)
    ↓
  Filters tasks client-side (projectFilter, assigneeFilter, etc.)
    ↓
  Pass filteredTasks + projectFilter to DashboardStats
    ↓
  DashboardStats (Client Component)
    ↓
  Calculates stats from filteredTasks array
    ↓
  Render 8 stat cards + 2 list cards (Top 5)
```

### Filter Reactivity Strategy
```typescript
// In TasksClientWrapper or TasksPage client section:
// DashboardStats receives filteredTasks and recalculates on every filter change

<DashboardStats
  tasks={displayedTasks}  // Already filtered by project/assignee/priority
  projectFilter={projectFilter}  // To know if single project is selected
  topProjects={topProjects}  // From server (all projects)
  topTeamMembers={topTeamMembers}  // From server (all members)
/>

// Inside DashboardStats:
// - totalTasks = tasks.length
// - tasksPastDue = tasks.filter(t => isOverdue(t)).length
// - blockedTasks = tasks.filter(t => t.status === 'blocked').length
// - totalActualCost = tasks.reduce((sum, t) => sum + (t.actual_cost || 0), 0)
// - totalPlannedCost = tasks.reduce((sum, t) => sum + (t.planned_cost || 0), 0)
// - totalActiveProjects: if projectFilter === 'all', count unique project_ids; else 1
// - topProjects: filter to selected project if projectFilter !== 'all'
// - topTeamMembers: filter based on tasks' assignees if projectFilter !== 'all'
```

### New Components to Create

#### 1. `DashboardStats` Component
**Location**: `/components/tasks/DashboardStats.tsx`
**Type**: Client component ('use client')
**Purpose**: Render the 8 dashboard metrics with construction theme

**Props Interface**:
```typescript
interface DashboardStatsProps {
  // Filtered tasks array - stats calculated from this
  tasks: Task[];

  // Current project filter value ('all' or project_id)
  projectFilter: string;

  // Server-fetched data for Top 5 lists
  topProjects: Array<{
    id: string;
    name: string;
    health_score: number;
    completion_percentage: number;
  }>;
  topTeamMembers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    completed_tasks: number;
  }>;

  // List of all projects (for counting active when not filtered)
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

// Stats calculated INSIDE the component from tasks array:
// - totalTasks = tasks.length
// - tasksPastDue = tasks.filter(overdue logic).length
// - blockedTasks = tasks.filter(t => t.status === 'blocked').length
// - totalActualCost = tasks.reduce(sum actual_cost)
// - totalPlannedCost = tasks.reduce(sum planned_cost)
// - totalActiveProjects = projectFilter === 'all'
//     ? projects.filter(p => p.status === 'active').length
//     : 1
```

#### 2. `TopProjectsCard` Component (Optional Sub-component)
**Location**: `/components/tasks/TopProjectsCard.tsx`
**Purpose**: Display Top 5 Projects list with health scores

#### 3. `TopTeamMembersCard` Component (Optional Sub-component)
**Location**: `/components/tasks/TopTeamMembersCard.tsx`
**Purpose**: Display Top 5 Team Members with avatars and task counts

## Server-Side Queries

### New `getDashboardStats()` Function
**Location**: `/app/app/tasks/page.tsx` (add alongside `getTasks()`)

```typescript
async function getDashboardStats(companyId: string) {
  const supabase = await createClient();

  // 1. Total Active Projects
  const { count: totalActiveProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active');

  // 2. Top 5 Projects by Health Score
  const { data: topProjects } = await supabase
    .from('projects')
    .select('id, name, health_score, completion_percentage')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('health_score', { ascending: false })
    .limit(5);

  // 3. Top 5 Team Members (most completed tasks)
  const { data: topTeamMembers } = await supabase
    .rpc('get_top_team_members_by_completed_tasks', {
      p_company_id: companyId,
      limit_count: 5
    });

  // 4. Sum of Actual and Planned Costs
  const { data: costSummary } = await supabase
    .from('tasks')
    .select('actual_cost, planned_cost')
    .eq('project.company_id', companyId);

  const totalActualCost = costSummary?.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0) || 0;
  const totalPlannedCost = costSummary?.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0) || 0;

  return {
    totalActiveProjects: totalActiveProjects || 0,
    topProjects: topProjects || [],
    topTeamMembers: topTeamMembers || [],
    totalActualCost,
    totalPlannedCost,
  };
}
```

### Database Function Needed
**Function**: `get_top_team_members_by_completed_tasks`
**Purpose**: Return top 5 team members with most completed tasks
**SQL**:
```sql
CREATE OR REPLACE FUNCTION get_top_team_members_by_completed_tasks(
  p_company_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  completed_tasks bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.name,
    up.avatar_url,
    COUNT(t.id)::bigint as completed_tasks
  FROM user_profiles up
  INNER JOIN company_users cu ON cu.user_id = up.id
  INNER JOIN tasks t ON t.assignee_id = up.id
  WHERE cu.company_id = p_company_id
    AND cu.status = 'active'
    AND t.status = 'completed'
  GROUP BY up.id, up.name, up.avatar_url
  ORDER BY completed_tasks DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

## UI Layout Design

### Grid Layout
```
Desktop (lg): 4 columns (2 rows for simple stats, 2 full-width for lists)
Tablet (md): 2 columns
Mobile: 1 column
```

**Grid Class**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`

### Card Layout Breakdown

#### Row 1: Simple Stats (4 cards)
1. **Total Tasks** (keep existing)
2. **Total Active Projects** (new)
3. **Tasks Past Due** (keep existing)
4. **Blocked Tasks** (keep existing)

#### Row 2: Cost Stats (2 cards)
5. **Sum of Actual Cost** (new)
6. **Sum of Planned Cost** (new)

#### Row 3: Lists (2 full-width cards)
7. **Top 5 Projects by Health** (new, spans 2 cols on lg)
8. **Top 5 Team Members** (new, spans 2 cols on lg)

### Updated Grid Class
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Row 1: 4 simple stat cards */}
  {/* Row 2: 2 cost stat cards (span 2 cols each on lg) */}
  {/* Row 3: 2 list cards (span 2 cols each on lg) */}
</div>
```

## Aceternity UI Components to Use

| Component | Purpose | Installation |
|-----------|---------|-------------|
| **Card** (shadcn/ui) | Base stat containers | Already installed |
| **Avatar** (Radix UI) | Team member avatars in Top 5 list | Already installed |
| **Progress** (Radix UI) | Health score bars in Top 5 Projects | Already installed |
| **motion.div** (Framer Motion) | Hover animations, list item animations | Already installed |

**Note**: All required components are already in the project. No new Aceternity components needed.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `/app/app/tasks/page.tsx` | **Modify** | Add `getDashboardStats()` function, update stats section |
| `/components/tasks/DashboardStats.tsx` | **Create** | New client component for 8-metric dashboard |
| `/components/tasks/TopProjectsCard.tsx` | **Create** | Sub-component for Top 5 Projects list |
| `/components/tasks/TopTeamMembersCard.tsx` | **Create** | Sub-component for Top 5 Team Members list |
| `supabase/migrations/[timestamp]_add_top_team_members_function.sql` | **Create** | Database function for Top 5 team members query |

## Implementation Steps

### Step 1: Create Database Function
1. Use MCP Supabase to create the `get_top_team_members_by_completed_tasks` function
2. Test the function with sample data
3. Save migration locally

### Step 2: Create `TopProjectsCard` Component
**File**: `/components/tasks/TopProjectsCard.tsx`
- Client component with construction theme
- Display list of 5 projects with:
  - Project name
  - Health score (numeric + color indicator)
  - Progress bar showing completion_percentage
  - Building2 icon for each project
- Use construction colors:
  - Health 80-100: construction-green
  - Health 50-79: construction-blue
  - Health 0-49: construction-red
- Hover effects on list items

### Step 3: Create `TopTeamMembersCard` Component
**File**: `/components/tasks/TopTeamMembersCard.tsx`
- Client component with construction theme
- Display list of 5 team members with:
  - Avatar (or HardHat icon fallback)
  - Team member name
  - Number of completed tasks
  - Trophy/Medal icon for top performer (#1)
- Animated list items (stagger on mount)
- Hover effects

### Step 4: Create `DashboardStats` Component
**File**: `/components/tasks/DashboardStats.tsx`
- Import all sub-components
- Render 8 stat cards in grid
- Use existing stat card pattern from current implementation
- Add new icons:
  - Building2 for Active Projects
  - DollarSign for cost metrics
  - Trophy for Top 5 lists
- Preserve existing hover animations and transitions

### Step 5: Modify `/app/app/tasks/page.tsx`
1. Add `getDashboardStats()` function (server-side)
2. Call it alongside `getTasks()`
3. Pass stats to `<DashboardStats />` component
4. **Delete** lines 337-415 (current stats section)
5. **Replace** with `<DashboardStats {...statsProps} />`

### Step 6: Update Stats Calculation Logic
- Keep: `totalTasks`, `tasksPastDue`, `blockedTasks` (calculated from tasks array)
- Add: Fetch from `getDashboardStats()`
- Remove: `activeTasks`, `completedTasks` (no longer needed in current stats)

## Construction Theme Integration

### Colors to Use
| Metric | Primary Color | Icon Color | Gradient |
|--------|---------------|------------|----------|
| Total Tasks | construction-blue | construction-blue | blue/5 to blue/10 |
| Active Projects | construction-blue | construction-blue | blue/5 to blue/10 |
| Tasks Past Due | construction-accent | construction-accent | accent/5 to accent/10 |
| Blocked Tasks | construction-red | construction-red | red/5 to red/10 |
| Actual Cost | construction-green | construction-green | green/5 to green/10 |
| Planned Cost | construction-blue | construction-blue | blue/5 to blue/10 |
| Top Projects | construction-blue | construction-blue | blue/5 to blue/10 |
| Top Team | construction-blue | construction-blue | blue/5 to blue/10 |

### Icons (Lucide React)
```typescript
import {
  CheckSquare,    // Total Tasks
  Building2,      // Active Projects, Top Projects
  Clock,          // Tasks Past Due
  Ban,            // Blocked Tasks
  DollarSign,     // Cost metrics
  HardHat,        // Team Members
  Trophy,         // Top performer badge
  TrendingUp,     // Health score indicator
} from 'lucide-react';
```

### Typography
- Metric values: `text-4xl font-black` (keep existing)
- Metric labels: `text-sm font-bold` (keep existing)
- List item names: `text-base font-semibold`
- List item stats: `text-sm font-medium text-gray-600`

## Responsive Design

### Breakpoint Behavior

**Mobile (< md)**:
- 1 column stack
- Simple stat cards: full width
- List cards: full width, max 3 items visible (scroll for more)

**Tablet (md - lg)**:
- 2 columns
- Simple stats: 2x2 grid
- Cost stats: 1 card per row
- List cards: 1 per row, full width

**Desktop (lg+)**:
- 4 columns
- Row 1: 4 simple stats side-by-side
- Row 2: 2 cost stats (each spans 2 cols)
- Row 3: 2 list cards (each spans 2 cols)

### Responsive Classes
```tsx
// Simple stat card (no span)
<div className="relative group">...</div>

// Cost stat card (span 2 on lg)
<div className="relative group lg:col-span-2">...</div>

// List card (span 2 on lg)
<div className="relative group lg:col-span-2">...</div>
```

## Important Notes

### Filter Reactivity Implementation
**CRITICAL**: Dashboard stats MUST update when TaskFilters project selection changes.

1. **DashboardStats receives `tasks` prop** (the already-filtered `displayedTasks` array)
2. **All numeric stats calculated client-side** from the `tasks` array using `useMemo`
3. **Top 5 lists filtering**:
   - When `projectFilter === 'all'`: Show top 5 from all data
   - When specific project selected: Filter Top Projects to show only that project, filter Top Team Members to only show members with tasks in that project
4. **No additional API calls needed** - stats recalculate instantly on filter change

```typescript
// Example implementation inside DashboardStats:
const stats = useMemo(() => {
  const totalTasks = tasks.length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const tasksPastDue = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  }).length;
  const totalActualCost = tasks.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0);
  const totalPlannedCost = tasks.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0);
  const totalActiveProjects = projectFilter === 'all'
    ? projects.filter(p => p.status === 'active').length
    : 1;

  return { totalTasks, blockedTasks, tasksPastDue, totalActualCost, totalPlannedCost, totalActiveProjects };
}, [tasks, projectFilter, projects]);
```

### Performance Considerations
1. **Server-side data fetching**: All stats calculated on server, no client-side aggregation
2. **Limit list results**: Always LIMIT 5 for Top Projects and Top Team Members
3. **Indexed queries**: Ensure indexes on:
   - `projects.company_id`
   - `projects.status`
   - `tasks.status`
   - `tasks.assignee_id`

### Edge Cases
1. **No completed tasks**: Show "No data yet" in Top Team Members
2. **No active projects**: Show 0, with muted styling
3. **Null costs**: Treat as 0 in SUM calculations
4. **Empty company**: All stats should gracefully show 0 or empty state

### Error Handling
- Wrap all Supabase queries in try/catch
- Return default values (0, []) on error
- Log errors to console for debugging
- Show fallback UI if stats fail to load

### Accessibility
- All stat cards have proper ARIA labels
- Color is not the only indicator (use icons + text)
- Keyboard navigation for list items
- Screen reader friendly number formatting

### Debug Comments
Add debug comments for:
- Each stat calculation
- Database query functions
- Component render logic
- Hover state management

## Testing Checklist

### Data Accuracy
- [ ] Total Tasks matches actual count
- [ ] Active Projects only includes status='active'
- [ ] Top Projects ordered by health_score DESC
- [ ] Top Team Members ordered by completed tasks DESC
- [ ] Costs sum correctly (handle nulls)
- [ ] Past due calculation correct (timezone aware)

### UI/UX
- [ ] Grid layout responsive on all breakpoints
- [ ] Icons match construction theme
- [ ] Colors follow design system
- [ ] Hover effects smooth and consistent
- [ ] List items animate on mount
- [ ] Empty states display properly

### Performance
- [ ] No unnecessary re-renders
- [ ] Server-side calculations complete in <500ms
- [ ] No client-side aggregation
- [ ] Queries use proper indexes

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces stats correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

## Example Code Snippets

### Simple Stat Card Pattern (Keep Existing)
```tsx
<div className="relative group">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
        <CheckSquare className="h-5 w-5 text-construction-blue" />
      </div>
      <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Total</div>
    </div>
    <div className="text-4xl font-black text-construction-blue leading-none mb-1">{totalTasks}</div>
    <div className="text-sm font-bold text-gray-600">Work Items</div>
  </div>
</div>
```

### List Card Pattern (New)
```tsx
<div className="relative group lg:col-span-2">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
    <div className="flex items-center gap-2 mb-4">
      <Building2 className="h-5 w-5 text-construction-blue" />
      <h3 className="text-lg font-bold text-construction-blue">Top Projects by Health</h3>
    </div>
    <div className="space-y-3">
      {topProjects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-construction-blue/10 text-construction-blue font-bold">
              {index + 1}
            </div>
            <span className="font-semibold text-gray-900">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{project.health_score}%</span>
            <div className="w-24">
              <Progress value={project.completion_percentage} className="h-2" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</div>
```

## Dependencies
**All dependencies already installed:**
- framer-motion (animations)
- lucide-react (icons)
- @radix-ui/react-avatar (avatars)
- @radix-ui/react-progress (progress bars)
- clsx + tailwind-merge (cn utility)

**No new installations needed.**

## Handoff Instructions

### For backend-engineer:
1. Create database function `get_top_team_members_by_completed_tasks` using MCP Supabase
2. Test function with sample company_id
3. Save migration to `supabase/migrations/`

### For frontend-builder:
1. Implement `TopProjectsCard.tsx` component
2. Implement `TopTeamMembersCard.tsx` component
3. Implement `DashboardStats.tsx` component
4. Update `/app/app/tasks/page.tsx` with new stats logic
5. Use `frontend-design` plugin for all UI work

### For code-reviewer:
1. Verify data accuracy of all 8 metrics
2. Check responsive layout on all breakpoints
3. Test hover animations and transitions
4. Verify construction theme colors match design system
5. Check accessibility (keyboard nav, screen readers)
6. Review performance (server-side queries, no client aggregation)

---

**Plan Status**: Ready for implementation
**Estimated Complexity**: Medium (3-4 hours)
**Next Step**: backend-engineer creates database function, then frontend-builder implements UI components
