# ProjectCard Component UI/UX Redesign Plan

## Overview
Complete redesign of the ProjectCard component to display the most critical information that General Contractors and Project Owners need at a glance. This card appears in the project list view and serves as the primary navigation entry point to project details.

## Research Findings

### What GCs/Owners Need at a Glance
Based on construction industry best practices and existing dashboard patterns:

1. **Project Health** - Overall status indicator (most critical)
2. **Budget Performance** - Planned vs actual spending
3. **Schedule Status** - On-time, at-risk, or delayed
4. **Progress** - Visual completion percentage
5. **Recent Activity** - What changed recently
6. **Team Status** - Who's assigned, crew size
7. **Phase Information** - Current construction phase
8. **Quick Metrics** - Task counts, material status, expenses
9. **Risk Indicators** - Blockers, overdue items, budget overruns
10. **Weather/Site Conditions** - (future consideration)

## Current Implementation Analysis

### What Exists Now (components/projects/ProjectCard.tsx)
- ✅ 3D tilt effect (Aceternity UI style)
- ✅ Project type icon with color coding
- ✅ Status badge (active, on_hold, completed, archived)
- ✅ Health score with circular progress (0-100)
- ✅ Completion percentage with progress bar
- ✅ Budget display
- ✅ Team member count
- ✅ Client name
- ✅ Start date
- ✅ Current phase indicator
- ✅ Construction-themed colors and icons
- ✅ Animated gradient top border
- ✅ Hover animations

### Strengths
- Clean, professional design
- Good use of construction theme colors
- Health score is prominently displayed
- Nice micro-interactions
- Mobile-responsive

### Opportunities for Enhancement
1. **Budget variance not shown** - Only shows total budget, not actual vs planned
2. **No recent activity** - Can't see what happened recently
3. **No schedule status** - Missing days remaining or behind/ahead indicator
4. **No risk indicators** - Blocked tasks, overdue items not visible
5. **Phase progress** - Only shows which phase, not phase completion
6. **No material/expense status** - Missing procurement insights
7. **Limited team info** - Only shows count, not key roles
8. **No quick actions** - Can't perform actions from card

## Enhanced Information Hierarchy

### Priority 1 (Must See First)
1. **Project Name** - Clear, large
2. **Health Score** - Visual ring with color coding
3. **Status Badge** - Active, on hold, completed
4. **Client Name** - Secondary to project name

### Priority 2 (Critical Metrics)
5. **Budget Performance** - Planned vs Actual with variance indicator
6. **Schedule Status** - Days remaining, on-time/delayed indicator
7. **Overall Progress** - % complete with visual progress bar
8. **Current Phase** - Which phase + phase progress

### Priority 3 (Supporting Information)
9. **Task Summary** - Total, completed, blocked, overdue counts
10. **Team Info** - Count + key roles (PM, Foreman)
11. **Recent Activity** - Last update timestamp or recent change
12. **Quick Metrics** - Materials needed, pending expenses

### Priority 4 (Optional/Hover)
13. **Project Type** - Icon/badge
14. **Start/End Dates** - Timeline
15. **Quick Actions** - Edit, archive, settings (on hover)

## Proposed Layout Design

### Card Structure (Vertical Layout)
```
┌─────────────────────────────────────────────────────────┐
│ [Animated Gradient Top Border - Project Type Color]     │
├─────────────────────────────────────────────────────────┤
│ HEADER (flex row)                                        │
│ [Type Icon] Project Name              [Status Badge]    │
│             Client Name                                  │
├─────────────────────────────────────────────────────────┤
│ HERO METRIC (centered, large)                           │
│ [Health Score Ring - 80pt diameter]                     │
│   80  SCORE                                              │
│   "On Track" label with icon                            │
├─────────────────────────────────────────────────────────┤
│ PROGRESS BAR (full width)                               │
│ "Overall Progress" label    65%                         │
│ [████████████░░░░░░░░░] with gradient                   │
│ Phase 3 of 5: Construction                              │
├─────────────────────────────────────────────────────────┤
│ TWO-COLUMN METRICS (grid 2 cols)                        │
│ ┌─────────────────┬─────────────────┐                  │
│ │ BUDGET          │ SCHEDULE        │                  │
│ │ Planned: $250K  │ 45 days left    │                  │
│ │ Actual:  $220K  │ ⚠ 3 days behind │                  │
│ │ ✓ Under $30K    │                 │                  │
│ └─────────────────┴─────────────────┘                  │
├─────────────────────────────────────────────────────────┤
│ TASKS SUMMARY (4-column grid - icon badges)            │
│ [✓ 24 Done] [⚠ 3 Blocked] [⏰ 2 Overdue] [📦 5 Todo]  │
├─────────────────────────────────────────────────────────┤
│ FOOTER (flex row, space-between)                        │
│ [👤 Team: 8] [🏗️ Materials: 3 needed]  [Updated: 2h]  │
│ [Quick Action Dots ... on hover]                        │
└─────────────────────────────────────────────────────────┘
```

### Responsive Considerations
- **Mobile (< 640px)**: Stack all sections vertically, reduce health ring to 60pt
- **Tablet (640-1024px)**: 2-column grid for cards
- **Desktop (> 1024px)**: 3-column grid, full card features

## Detailed Component Breakdown

### 1. Header Section
```tsx
<div className="flex items-start justify-between gap-3">
  {/* Left: Type Icon + Names */}
  <div className="flex items-start gap-3 flex-1 min-w-0">
    <motion.div className="p-2.5 rounded-xl border-2 [type-colors]">
      <TypeIcon className="h-6 w-6" />
    </motion.div>
    <div>
      <h3 className="font-bold text-lg line-clamp-1">{project.name}</h3>
      <p className="text-sm text-muted-foreground">{project.client_name}</p>
    </div>
  </div>

  {/* Right: Status Badge */}
  <Badge variant="secondary" className={statusConfig.color}>
    <StatusIcon />
    {statusConfig.label}
  </Badge>
</div>
```

### 2. Health Score Hero (Enhanced)
```tsx
<div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50">
  {/* Circular Progress Ring (existing, keep as-is) */}
  <div className="relative w-20 h-20">
    <svg>...</svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-2xl font-black">{healthScore}</span>
      <span className="text-[10px]">SCORE</span>
    </div>
  </div>

  {/* Health Info */}
  <div className="flex-1">
    <p className="text-xs font-semibold uppercase">Project Health</p>
    <div className="flex items-center gap-2">
      <Badge className={healthColors}>
        {getHealthScoreIcon(healthScore)}
        {healthColors.label}
      </Badge>
    </div>
    {/* NEW: Risk Indicators */}
    {hasRisks && (
      <div className="flex items-center gap-1 mt-1">
        <AlertTriangle className="h-3 w-3 text-construction-yellow" />
        <span className="text-xs text-construction-yellow">
          {blockedTasks} blocked, {overdueTasks} overdue
        </span>
      </div>
    )}
  </div>
</div>
```

### 3. Progress Section (Enhanced)
```tsx
<div className="space-y-2">
  {/* Progress Bar */}
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Overall Progress</span>
    <span className="text-sm font-bold">{completionPercentage}%</span>
  </div>
  <Progress value={completionPercentage} className="h-2.5" />

  {/* NEW: Phase Info with Phase Progress */}
  {currentPhase && (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-construction-blue" />
        Phase {currentPhaseIndex + 1} of {totalPhases}: {currentPhase.name}
      </span>
      <span className="font-semibold text-construction-blue">
        {currentPhase.completion_percentage}%
      </span>
    </div>
  )}
</div>
```

### 4. NEW: Budget & Schedule Grid
```tsx
<div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
  {/* Budget Column */}
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <DollarSign className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-bold uppercase text-gray-600">Budget</span>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Planned:</span>
        <span className="font-bold">${plannedBudget}K</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Actual:</span>
        <span className="font-bold">${actualSpent}K</span>
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold pt-1",
        isUnderBudget ? "text-construction-green" : "text-construction-red"
      )}>
        {isUnderBudget ? (
          <><TrendingDown className="h-3 w-3" /> Under ${variance}K</>
        ) : (
          <><TrendingUp className="h-3 w-3" /> Over ${variance}K</>
        )}
      </div>
    </div>
  </div>

  {/* Schedule Column */}
  <div className="border-l-2 border-gray-200 pl-3">
    <div className="flex items-center gap-1.5 mb-2">
      <Calendar className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-bold uppercase text-gray-600">Schedule</span>
    </div>
    <div className="space-y-1">
      {/* Days Remaining */}
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Remaining:</span>
        <span className="font-bold">{daysRemaining} days</span>
      </div>
      {/* Status Indicator */}
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold pt-2",
        scheduleStatus === 'on-time' && "text-construction-green",
        scheduleStatus === 'at-risk' && "text-construction-yellow",
        scheduleStatus === 'delayed' && "text-construction-red"
      )}>
        {scheduleStatus === 'on-time' && (
          <><CheckCircle2 className="h-3 w-3" /> On Track</>
        )}
        {scheduleStatus === 'at-risk' && (
          <><AlertCircle className="h-3 w-3" /> At Risk</>
        )}
        {scheduleStatus === 'delayed' && (
          <><Clock className="h-3 w-3" /> {daysBehind} days behind</>
        )}
      </div>
    </div>
  </div>
</div>
```

### 5. NEW: Task Summary Badges
```tsx
<div className="flex flex-wrap gap-2">
  {/* Completed Tasks */}
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-construction-green/10 border border-construction-green/20"
  >
    <CheckCircle2 className="h-3.5 w-3.5 text-construction-green" />
    <span className="text-xs font-bold text-construction-green">
      {completedTasks} Done
    </span>
  </motion.div>

  {/* Blocked Tasks (only show if > 0) */}
  {blockedTasks > 0 && (
    <motion.div className="... bg-construction-yellow/10 ...">
      <AlertTriangle className="... text-construction-yellow" />
      <span className="... text-construction-yellow">{blockedTasks} Blocked</span>
    </motion.div>
  )}

  {/* Overdue Tasks */}
  {overdueTasks > 0 && (
    <motion.div className="... bg-construction-red/10 ...">
      <Clock className="... text-construction-red" />
      <span className="... text-construction-red">{overdueTasks} Overdue</span>
    </motion.div>
  )}

  {/* Todo Tasks */}
  <motion.div className="... bg-gray-100 ...">
    <Package className="... text-gray-600" />
    <span className="... text-gray-600">{todoTasks} Todo</span>
  </motion.div>
</div>
```

### 6. Enhanced Footer
```tsx
<div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
  {/* Left: Team & Materials */}
  <div className="flex items-center gap-3 text-xs">
    <div className="flex items-center gap-1.5">
      <Users className="h-3.5 w-3.5 text-gray-500" />
      <span className="font-semibold text-gray-700">
        {teamSize} team
      </span>
    </div>

    {/* NEW: Materials Status */}
    {materialsNeeded > 0 && (
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-construction-yellow" />
        <span className="font-semibold text-construction-yellow">
          {materialsNeeded} needed
        </span>
      </div>
    )}
  </div>

  {/* Right: Last Updated + Quick Actions (on hover) */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500">
      Updated {formatDistanceToNow(project.updated_at)}
    </span>

    {/* Quick Actions (show on hover) */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileHover={{ opacity: 1, scale: 1 }}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-construction-red">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  </div>
</div>
```

## Data Requirements

### Current Data (from DB schema)
- `project.name` ✅
- `project.client_name` ✅
- `project.project_type` ✅
- `project.status` ✅
- `project.health_score` ✅
- `project.completion_percentage` ✅
- `project.budget` ✅
- `project.start_date` ✅
- `project.end_date` ✅
- `project.updated_at` ✅
- `project.project_phases` ✅
- `project.project_team` (count) ✅

### NEW Data Needed
1. **Actual Spending** - Sum of approved expenses + material costs
   - Query: `SUM(tasks.actual_cost) WHERE project_id = ?`
   - Already available via task aggregation

2. **Task Summary Counts**
   - Total tasks: `COUNT(*) FROM tasks WHERE project_id = ?`
   - Completed: `COUNT(*) WHERE status = 'completed'`
   - Blocked: `COUNT(*) WHERE status = 'blocked'`
   - Overdue: `COUNT(*) WHERE due_date < NOW() AND status != 'completed'`
   - Todo: `COUNT(*) WHERE status = 'todo'`

3. **Schedule Status**
   - Days remaining: `DATEDIFF(end_date, NOW())`
   - Schedule variance: Compare health_score + phase progress
   - Days behind/ahead: Calculate from expected vs actual progress

4. **Materials Status**
   - Materials needed: `COUNT(*) FROM material_assignments WHERE procurement_status = 'needed' AND project_id = ?`
   - Materials ordered: `COUNT(*) WHERE procurement_status = 'ordered'`

5. **Current Phase Info**
   - Phase name ✅ (already in project_phases)
   - Phase completion % ✅ (already in project_phases)
   - Phase index (order_index) ✅

### Suggested Server Action Enhancement
```typescript
// app/actions/projects.ts
export async function getProjectsWithStats(companyId: string) {
  // Current query gets basic project data
  // ENHANCE to include:
  return {
    ...project,
    stats: {
      actualSpent: number,
      taskCounts: {
        total: number,
        completed: number,
        blocked: number,
        overdue: number,
        todo: number,
      },
      schedule: {
        daysRemaining: number,
        scheduleStatus: 'on-time' | 'at-risk' | 'delayed',
        daysBehind: number,
      },
      materials: {
        needed: number,
        ordered: number,
        delivered: number,
      },
    },
  };
}
```

## Animation & Micro-interactions

### Existing (Keep)
- ✅ 3D tilt effect on mouse move
- ✅ Scale on hover (1.02)
- ✅ Animated gradient top border
- ✅ Circular health score animation
- ✅ Shadow transitions

### NEW Additions
1. **Staggered Badge Animations** - Task summary badges fade in with delay
2. **Budget/Schedule Pulse** - Pulse animation on warning states
3. **Quick Actions Slide-in** - Slide from right on hover
4. **Risk Indicator Blink** - Subtle blink on critical issues
5. **Progress Bar Fill** - Animate from 0 to value on mount

```tsx
// Staggered badge animation
{taskSummary.map((badge, index) => (
  <motion.div
    key={badge.type}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    {badge}
  </motion.div>
))}

// Warning pulse
<motion.div
  animate={isOverBudget ? {
    scale: [1, 1.05, 1],
    backgroundColor: ['rgba(220, 38, 38, 0.1)', 'rgba(220, 38, 38, 0.2)', 'rgba(220, 38, 38, 0.1)']
  } : {}}
  transition={{ repeat: Infinity, duration: 2 }}
>
```

## Color Coding Strategy

### Health Score
- 80-100: Green (#059669) - "On Track"
- 50-79: Dark Gray (#3C3C3C) - "At Risk"
- 0-49: Red (#DC2626) - "Delayed"

### Budget Status
- Under Budget: Green (#059669)
- On Budget (±5%): Navy Blue (#001B51)
- Over Budget: Red (#DC2626)

### Schedule Status
- On Time: Green (#059669)
- At Risk (1-5 days behind): Yellow (#FBBF24)
- Delayed (>5 days behind): Red (#DC2626)

### Task Status Badges
- Completed: Green background
- Blocked: Yellow background
- Overdue: Red background
- Todo: Gray background

## Responsive Design

### Mobile (< 640px)
- Stack all sections vertically
- Health ring: 60pt diameter
- Budget/Schedule: Stack vertically (not 2-column grid)
- Task badges: 2-row wrap
- Hide quick actions menu (show in detail view)

### Tablet (640-1024px)
- 2-column card grid
- Health ring: 70pt diameter
- Budget/Schedule: Side-by-side
- All features visible

### Desktop (> 1024px)
- 3-column card grid
- Health ring: 80pt diameter
- All features + hover states
- Quick actions visible on hover

## Accessibility Considerations

1. **Semantic HTML** - Use proper heading hierarchy
2. **ARIA Labels** - Label all icons and interactive elements
3. **Color Contrast** - Ensure WCAG AA compliance
4. **Keyboard Navigation** - Tab through all interactive elements
5. **Screen Reader Text** - Hidden labels for icon-only elements
6. **Focus Indicators** - Clear focus states

```tsx
<Badge aria-label={`Project status: ${status}`}>
  <StatusIcon aria-hidden="true" />
  <span>{statusLabel}</span>
</Badge>

<Progress
  value={completionPercentage}
  aria-label={`Project completion: ${completionPercentage}%`}
/>
```

## Performance Optimizations

1. **Memo-ize Calculations** - Use `useMemo` for derived stats
2. **Lazy Load Icons** - Dynamic import for rarely-used icons
3. **Optimize Animations** - Use CSS transforms instead of layout properties
4. **Image Optimization** - Use Next.js Image for type icons if using images
5. **Avoid Re-renders** - React.memo for child components

```tsx
const taskStats = useMemo(() => ({
  completed: tasks.filter(t => t.status === 'completed').length,
  blocked: tasks.filter(t => t.status === 'blocked').length,
  overdue: tasks.filter(t => isOverdue(t)).length,
}), [tasks]);
```

## Implementation Steps

### Phase 1: Foundation (Keep Existing Structure)
1. ✅ Keep existing card structure
2. ✅ Maintain 3D tilt effect
3. ✅ Keep health score circular progress
4. ✅ Keep progress bar

### Phase 2: Add Budget & Schedule Grid
1. Create budget calculation logic
2. Add schedule calculation (days remaining)
3. Build 2-column grid component
4. Add variance indicators
5. Implement color coding

### Phase 3: Add Task Summary Badges
1. Query task counts by status
2. Build badge components
3. Add conditional rendering (only show if > 0)
4. Implement staggered animations

### Phase 4: Enhance Footer
1. Add materials status query
2. Format last updated timestamp
3. Build quick actions dropdown menu
4. Add hover reveal animation

### Phase 5: Data Integration
1. Update server action to fetch task stats
2. Add material counts query
3. Calculate schedule variance
4. Pass stats to ProjectCard component

### Phase 6: Polish & Testing
1. Test responsive layouts
2. Verify accessibility
3. Optimize animations
4. Add loading states
5. Test with real data

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/projects/ProjectCard.tsx` | **Modify** | Add budget/schedule grid, task badges, enhanced footer |
| `app/actions/projects.ts` | **Modify** | Enhance `getProjectsWithStats()` to include task counts, materials, schedule |
| `types/database.types.ts` | **Reference** | Use existing types, no changes needed |
| `lib/utils.ts` | **Add** | Helper functions: `calculateScheduleStatus()`, `formatDistanceToNow()` |

## Dependencies

### Existing (Already Installed)
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icons
- ✅ `tailwind-merge` - Class merging
- ✅ `@radix-ui/*` - UI components

### NEW (Need to Install)
- `date-fns` - For `formatDistanceToNow()` (alternative to moment.js)
  ```bash
  pnpm add date-fns
  ```

## Construction Theme Integration

### Colors
- Primary: #001B51 (Navy Blue) - Health score, primary accents
- Accent: #3C3C3C (Dark Gray) - Secondary metrics, borders
- Success: #059669 (Green) - On track, under budget
- Warning: #FBBF24 (Yellow) - At risk, blocked
- Error: #DC2626 (Red) - Delayed, over budget, overdue

### Icons (Lucide)
- `Building2` - Project type
- `CheckCircle2` - Completed, on track
- `AlertCircle` - At risk
- `Clock` - Overdue, time-based
- `DollarSign` - Budget
- `Calendar` - Schedule
- `Users` - Team
- `Package` - Materials
- `TrendingUp/Down` - Budget variance
- `AlertTriangle` - Blocked, warnings
- `MoreVertical` - Quick actions menu
- `Edit`, `Settings`, `Archive` - Actions

### Typography
- Bold weights (600-800) for metrics
- UPPERCASE for labels
- Mono font for IDs/codes
- Clear hierarchy: name > metrics > details

## Important Notes

### Data Source Priority
1. **Real-time calculations** - Task counts, actual spending (from queries)
2. **Cached values** - Health score, completion % (from DB)
3. **Derived metrics** - Schedule status, variance (calculated)

### Performance Considerations
- This card appears in lists (potentially 10-50 cards)
- Minimize query complexity - use aggregated stats from server action
- Use skeleton loading for card grids
- Lazy load images/complex calculations

### Future Enhancements (Post-MVP)
- Weather widget (current site weather)
- Photo thumbnail (latest site photo)
- AI insights ("Recommend checking blocked tasks")
- Trend indicators (↑ health improving)
- Comparison to similar projects

### Mobile-Specific Optimizations
- Reduce health ring size
- Stack budget/schedule vertically
- Limit task badges to 4 (show "...+2 more")
- Single-tap to open project (no hover actions)

## Success Metrics

### User Experience
- ✅ GC can identify at-risk projects in < 3 seconds
- ✅ Budget variance visible without clicking into project
- ✅ Task blockers immediately apparent
- ✅ Mobile-friendly for on-site use

### Technical
- ✅ < 200ms render time per card
- ✅ WCAG AA accessibility compliance
- ✅ Smooth animations (60fps)
- ✅ Works offline (shows cached data)

## Handoff Checklist

- [x] Research construction dashboard best practices
- [x] Analyze current implementation
- [x] Define information hierarchy
- [x] Design enhanced layout
- [x] Specify data requirements
- [x] Document animation strategy
- [x] Plan responsive behavior
- [x] List accessibility requirements
- [x] Identify dependencies
- [x] Create implementation phases

---

**Status**: Ready for `frontend-builder` to implement.

**Key Decisions**:
1. **Keep existing 3D tilt and health score** - Users like it, it's working well
2. **Add budget/schedule grid** - Most critical missing information
3. **Task summary badges** - Quick visual scan of blockers/overdues
4. **Progressive disclosure** - Show essentials, hide details until hover
5. **Mobile-first responsive** - Stack vertically on small screens

**Questions/Considerations**:
- Should we show project owner/PM name on card? (Currently not shown)
- Do we want a "favorite" or "pin" feature for important projects?
- Should overdue count include tasks with no due date?
- What's the threshold for "at risk" schedule status? (Currently: 1-5 days behind)
