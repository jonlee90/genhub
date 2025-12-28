# ProjectCard Clean Redesign Plan

## Overview
Create a clean, minimal, professional redesign of the ProjectCard component that removes visual clutter while maintaining all essential project information. This redesign focuses on scannable information hierarchy with a construction industry aesthetic.

## Current Issues to Address

### Elements to REMOVE
1. **Phase Status Section** (lines 230-242) - "Phase X of Y" creates redundancy with progress bar
2. **Health Score Colored Background** (lines 245-272) - Colored background box is too prominent and breaks clean aesthetic

### Problems with Current Design
- Too many competing visual elements
- Colored background sections dominate the card
- Information hierarchy not immediately clear
- Visual noise distracts from key metrics

## Design Principles

### Core Values
1. **Clean & Minimal** - Generous whitespace, not crowded
2. **Professional** - Construction industry trustworthiness
3. **Scannable** - Quick visual parsing of status
4. **Focused** - Clear information hierarchy

### Visual Strategy
- Use construction blue (#001B51) border for cohesive identity
- Construction Industry Theme
- Strategic color use (only for status indicators)
- Subtle hover effects for premium feel

## Component Structure

```
ProjectCard
├── Card Container (1.5px construction blue border, white bg, 3D tilt)
│   │
│   ├── Header Section
│   │   ├── Icon + Project Name + Client Name
│   │   └── Status Badge
│   │
│   ├── Meta Row
│   │   ├── Project Type + Icon
│   │   └── Start Date + Icon
│   │
│   ├── Progress Section (Clean, Horizontal)
│   │   ├── Progress Bar (flex-1)
│   │   └── Large Percentage (right aligned)
│   │   └── Small label below
│   │
│   ├── Key Metrics Grid (2 Columns)
│   │   ├── Budget Column
│   │   │   ├── Planned
│   │   │   └── Actual (color-coded)
│   │   │
│   │   └── Schedule Column
│   │       ├── Days Remaining
│   │       └── Status (color-coded)
│   │
│   ├── Task Summary (Horizontal Pills)
│   │   ├── Done (green pill)
│   │   ├── Todo (gray pill)
│   │   ├── Blocked (yellow pill, conditional)
│   │   └── Overdue (red pill, conditional)
│   │
│   └── Footer
│       └── Team Size
```

## Information Hierarchy

### Level 1 - Primary (Immediate Recognition)
- **Project Name** - Bold, `text-lg`, construction blue on hover
- **Status Badge** - Color-coded, top-right
- **Completion Percentage** - Large `text-xl`, bold, construction blue

### Level 2 - Secondary (Supporting Context)
- **Client Name** - Smaller gray text below name
- **Progress Bar** - Visual completion indicator
- **Budget & Schedule** - Equal prominence in grid

### Level 3 - Tertiary (Additional Details)
- **Project Type & Start Date** - Small, subtle meta row
- **Task Counts** - Compact pills
- **Team Size** - Footer element

## Detailed Layout Specifications

### Card Container
```tsx
<Link href={`/app/projects/${project.id}`}>
  <motion.div
    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    className={cn(
      "group relative cursor-pointer h-full rounded-lg",
      "bg-white border-[1.5px] border-construction-blue",
      "hover:border-construction-blue hover:shadow-lg",
      "transition-all duration-200",
      "overflow-hidden"
    )}
    whileHover={{ scale: 1.01 }}
  >
    {/* Single content container */}
    <div className="p-5 space-y-4">
      {/* All content sections */}
    </div>
  </motion.div>
</Link>
```

**Key Specs:**
- Border: `border-[1.5px] border-construction-blue`
- Background: `bg-white`
- Padding: `p-5` (20px all sides)
- Spacing: `space-y-4` (16px between sections)
- Hover: `scale: 1.01`, `shadow-lg`
- Border Radius: `rounded-lg` (8px)

### Header Section
```tsx
<div className="flex items-start justify-between gap-3">
  {/* Left: Icon + Name/Client */}
  <div className="flex items-start gap-3 flex-1 min-w-0">
    {/* Project Type Icon Container */}
    <div className="p-2 rounded-md bg-construction-blue/5 border border-construction-blue/20 shrink-0">
      <TypeIcon className="h-5 w-5 text-construction-blue" />
    </div>

    {/* Project Name & Client */}
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-lg line-clamp-1 text-gray-900 group-hover:text-construction-blue transition-colors">
        {project.name}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
        {project.client_name}
      </p>
    </div>
  </div>

  {/* Right: Status Badge */}
  <Badge variant="outline" className={cn(
    "flex items-center gap-1.5 px-2 py-0.5 shrink-0 font-medium",
    statusConfig.color
  )}>
    <StatusIcon className="h-3 w-3" />
    <span className="text-xs">{statusConfig.label}</span>
  </Badge>
</div>
```

**Typography:**
- Project Name: `text-lg font-semibold text-gray-900`
- Client Name: `text-sm text-gray-600`
- Status Badge: `text-xs font-medium`

**Spacing:**
- Gap between icon and text: `gap-3` (12px)
- Margin top for client: `mt-1` (4px)
- Section margin bottom: `mb-4` (included in space-y-4)

### Meta Row
```tsx
<div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100">
  {/* Project Type */}
  <span className="flex items-center gap-1.5">
    <TypeIcon className="h-3.5 w-3.5" />
    <span>{typeConfig.label}</span>
  </span>

  {/* Start Date */}
  <span className="flex items-center gap-1.5">
    <Calendar className="h-3.5 w-3.5" />
    <span>{formattedStartDate}</span>
  </span>
</div>
```

**Styling:**
- Font size: `text-xs`
- Color: `text-gray-500`
- Icon size: `h-3.5 w-3.5` (14px)
- Bottom border: `border-b border-gray-100`
- Padding bottom: `pb-3`

### Progress Section (NEW LAYOUT)
```tsx
<div className="space-y-2">
  {/* Progress Bar + Percentage (Horizontal Layout) */}
  <div className="flex items-center gap-3">
    <Progress
      value={completionPercentage}
      className="flex-1 h-2 bg-gray-100"
    />
    <span className="text-xl font-bold text-construction-blue shrink-0 min-w-[3.5rem] text-right">
      {completionPercentage}%
    </span>
  </div>

  {/* Small Label */}
  <p className="text-xs text-gray-500">Overall Progress</p>
</div>
```

**Key Changes:**
- Percentage MOVES to right of progress bar (not below)
- Percentage size: `text-xl font-bold` (20px, prominent)
- Progress bar: `flex-1` (takes remaining space)
- Label: Small, below the bar, subtle

**NO Phase Status Below** - This section is completely removed

### Key Metrics Grid
```tsx
<div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
  {/* Budget Column */}
  <div className="space-y-2">
    {/* Section Header */}
    <div className="flex items-center gap-1.5 mb-2">
      <DollarSign className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Budget
      </span>
    </div>

    {/* Budget Values */}
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Planned</span>
        <span className="font-semibold text-gray-900">
          {formatBudget(project.budget)}
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Actual</span>
        <span className={cn(
          "font-bold",
          isUnderBudget ? "text-construction-green" : "text-construction-red"
        )}>
          {formatBudget(actualSpent)}
        </span>
      </div>
    </div>
  </div>

  {/* Schedule Column */}
  <div className="space-y-2">
    {/* Section Header */}
    <div className="flex items-center gap-1.5 mb-2">
      <Clock className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Schedule
      </span>
    </div>

    {/* Schedule Values */}
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Days Left</span>
        <span className="font-semibold text-construction-blue">
          {daysRemaining}d
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Status</span>
        <span className={cn(
          "font-bold",
          scheduleStatus === 'on-time' && "text-construction-green",
          scheduleStatus === 'at-risk' && "text-yellow-600",
          scheduleStatus === 'delayed' && "text-construction-red"
        )}>
          {scheduleStatusLabel}
        </span>
      </div>
    </div>
  </div>
</div>
```

**Styling:**
- Grid: `grid-cols-2 gap-4`
- Section headers: `text-xs font-semibold uppercase tracking-wide`
- Icon: `h-4 w-4 text-construction-accent`
- Values: `text-xs`
- Labels: `text-gray-500`
- Values: `font-semibold` or `font-bold` (for status)
- Bottom border: `border-b border-gray-100`

**NO Colored Background** - Clean white background, color only in text

### Task Summary (Horizontal Pills)
```tsx
<div className="flex items-center gap-2.5 flex-wrap pb-3 border-b border-gray-100">
  {/* Completed Tasks */}
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-construction-green/10">
    <CheckCircle2 className="h-3.5 w-3.5 text-construction-green" />
    <span className="text-xs font-medium text-construction-green">
      {completed}
    </span>
  </div>

  {/* Todo Tasks */}
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100">
    <Package className="h-3.5 w-3.5 text-gray-600" />
    <span className="text-xs font-medium text-gray-600">
      {todo}
    </span>
  </div>

  {/* Blocked Tasks (conditional - only if > 0) */}
  {blocked > 0 && (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50">
      <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
      <span className="text-xs font-medium text-yellow-600">
        {blocked}
      </span>
    </div>
  )}

  {/* Overdue Tasks (conditional - only if > 0) */}
  {overdue > 0 && (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50">
      <Clock className="h-3.5 w-3.5 text-construction-red" />
      <span className="text-xs font-medium text-construction-red">
        {overdue}
      </span>
    </div>
  )}
</div>
```

**Pill Styling:**
- Shape: `rounded-full`
- Padding: `px-2.5 py-1` (10px horizontal, 4px vertical)
- Icon: `h-3.5 w-3.5` (14px)
- Text: `text-xs font-medium`
- Gap between icon and text: `gap-1.5` (6px)
- Gap between pills: `gap-2.5` (10px)

**Color Coding:**
- Done: `bg-construction-green/10`, `text-construction-green`
- Todo: `bg-gray-100`, `text-gray-600`
- Blocked: `bg-yellow-50`, `text-yellow-600`
- Overdue: `bg-red-50`, `text-construction-red`

### Footer
```tsx
<div className="flex items-center text-xs text-gray-500">
  <Users className="h-3.5 w-3.5 mr-1.5" />
  <span className="font-medium">{teamSize} team members</span>
</div>
```

**Styling:**
- Font: `text-xs font-medium`
- Color: `text-gray-500`
- Icon: `h-3.5 w-3.5`
- Gap: `mr-1.5` (6px)

## Color Usage Strategy

### Construction Theme Colors

#### Primary Brand Color
- **Construction Blue (#001B51)**
  - Card border (1.5px solid)
  - Project name on hover
  - Completion percentage
  - Schedule days remaining
  - Section icons (when primary action)

#### Accent Colors
- **Construction Accent (#3C3C3C)** - Section header icons (Budget, Schedule)
- **Construction Accent Light (#7A7A7A)** - Not heavily used, available for future

#### Status Colors (Strategic Use Only)
- **Construction Green (#059669)**
  - Completed task pills
  - Under budget indicator
  - On-time schedule status

- **Construction Red (#DC2626)**
  - Over budget indicator
  - Delayed schedule status
  - Overdue task pills

- **Yellow (#FBBF24, #D97706)**
  - At-risk schedule status
  - Blocked task pills

#### Neutral Grays (Primary Text Colors)
- **Gray 900** - Primary text (project name)
- **Gray 700** - Section headings
- **Gray 600** - Secondary text (client name)
- **Gray 500** - Tertiary text (labels, meta info)
- **Gray 100-200** - Borders, subtle backgrounds

### Where NOT to Use Color
- NO colored background sections/boxes
- NO gradient fills
- NO colored borders except main card border
- NO multiple competing brand colors
- Color is used ONLY for:
  - Main card border (construction blue)
  - Status indicators (text/icons only)
  - Hover states (subtle)

## Responsive Design

### Mobile (< 768px)
- Single column card layout
- All sections stack vertically
- Font sizes remain readable (no reduction)
- Task pills wrap to multiple rows if needed
- Progress bar + percentage side-by-side (maintained)
- Grid remains 2 columns (Budget | Schedule)
- Touch targets minimum 44px

### Tablet (768px - 1024px)
- Card grid: 2 columns
- All elements scale proportionally
- Spacing increases slightly
- Full feature set visible

### Desktop (> 1024px)
- Card grid: 3 columns
- Maximum card width to prevent over-stretching
- 3D tilt effect active
- Hover effects fully functional

### Responsive Classes
```tsx
// Grid layout (page level, not card level)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <ProjectCard />
</div>

// Spacing (if needed)
<div className="p-4 md:p-5">
```

## Elements to Remove (Detailed)

### 1. REMOVE: Phase Status Section (Lines 230-242)

**Current Code:**
```tsx
{currentPhase && (
  <div className="flex items-center justify-between text-xs text-gray-500">
    <span>
      Phase {project.project_phases?.findIndex((p) => p.id === currentPhase.id) + 1} of{' '}
      {project.project_phases?.length || 0}
    </span>
    {currentPhase.completion_percentage !== null && currentPhase.completion_percentage !== undefined && (
      <span className="font-medium text-construction-blue">
        {currentPhase.completion_percentage}%
      </span>
    )}
  </div>
)}
```

**Reason for Removal:**
- Redundant with overall progress bar
- Creates visual clutter
- Phase information is secondary to overall project progress
- Not critical for card-level view (can see in detail view)

**What to Do:**
- Delete entire block from component
- NO replacement needed
- Overall progress bar is sufficient

### 2. REMOVE: Health Score Colored Background Section (Lines 245-272)

**Current Code:**
```tsx
<div className={cn(
  "flex items-center justify-between p-3 rounded-md border",
  healthColors.bgColor,
  healthColors.borderColor
)}>
  <div className="flex items-center gap-2">
    <div className={cn("flex items-center gap-1.5", healthColors.textColor)}>
      {getHealthScoreIcon(healthScore)}
      <span className="text-sm font-semibold">{healthColors.label}</span>
    </div>
    <span className="text-xs text-gray-400">·</span>
    <span className={cn("text-lg font-bold", healthColors.textColor)}>{healthScore}</span>
  </div>

  {/* Risk Indicators */}
  {'stats' in project && project.stats &&
   (project.stats.taskCounts.blocked > 0 || project.stats.taskCounts.overdue > 0) && (
    <div className="flex items-center gap-1.5">
      <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
      <span className="text-xs font-medium text-gray-700">
        {project.stats.taskCounts.blocked > 0 && `${project.stats.taskCounts.blocked} blocked`}
        {project.stats.taskCounts.blocked > 0 && project.stats.taskCounts.overdue > 0 && ', '}
        {project.stats.taskCounts.overdue > 0 && `${project.stats.taskCounts.overdue} overdue`}
      </span>
    </div>
  )}
</div>
```

**Reason for Removal:**
- Colored background is too prominent
- Breaks clean, minimal aesthetic
- Creates visual noise
- Competes with other important information
- Risk indicators belong in task summary pills

**What to Do:**
- Delete entire health score section
- Risk indicators (blocked, overdue) already shown in task pills
- Health score can be shown elsewhere (project detail page) or as small indicator if needed later

## Implementation Steps

### Step 1: Simplify Card Structure
1. Keep existing 3D tilt effect (motion values, handlers)
2. Keep existing border styling (`border-[1.5px] border-construction-blue`)
3. Consolidate content into single `space-y-4` container
4. Remove all colored background sections

### Step 2: Update Header Section
1. Increase project name to `text-lg`
2. Add hover color transition to construction blue
3. Ensure status badge stays top-right
4. Verify icon container styling

### Step 3: Create Clean Meta Row
1. Add `border-b border-gray-100` separator
2. Use `text-xs text-gray-500`
3. Icon size `h-3.5 w-3.5`
4. Ensure even spacing with `justify-between`

### Step 4: Redesign Progress Section
1. **CRITICAL**: Move percentage to RIGHT of progress bar
2. Use flexbox: `<div className="flex items-center gap-3">`
3. Progress bar: `flex-1`
4. Percentage: `text-xl font-bold text-construction-blue`
5. Add small label below: "Overall Progress"
6. **REMOVE** phase status section entirely

### Step 5: Build Metrics Grid
1. Create 2-column grid: `grid grid-cols-2 gap-4`
2. Add section headers with icons
3. Implement label/value rows
4. Color-code values (green/red for status)
5. **NO colored backgrounds** - keep white
6. Add bottom border: `border-b border-gray-100`

### Step 6: Create Task Summary Pills
1. Use `flex items-center gap-2.5 flex-wrap`
2. Style pills with `rounded-full`, subtle backgrounds
3. Color-code: green/gray/yellow/red
4. Show only when count > 0 (except done/todo always show)
5. Add bottom border

### Step 7: Simplify Footer
1. Single line with team size
2. Icon + text, small font
3. Minimal styling

### Step 8: Remove Clutter
1. **DELETE** phase status section (lines 230-242)
2. **DELETE** health score background section (lines 245-272)
3. Verify no visual gaps from removals
4. Ensure spacing flows naturally

### Step 9: Polish & Test
1. Verify all spacing is consistent
2. Check color contrast (WCAG AA)
3. Test hover states
4. Test 3D tilt still works
5. Test responsive breakpoints

### Step 10: Verify with Data
1. Test with stats (ProjectWithStats)
2. Test without stats (fallback)
3. Test edge cases (0 tasks, very high budgets, etc.)
4. Test on mobile device
5. Verify accessibility

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/projects/ProjectCard.tsx` | **Modify** | Remove phase status & health background sections, redesign progress layout, add clean metrics grid, create task pills |
| `lib/utils.ts` | **Reference** | Use existing utility functions (formatBudget, cn, etc.) |
| `types/database.types.ts` | **Reference** | Use existing types |

## Dependencies

### Already Installed (Use These)
- `framer-motion` - 3D tilt effect, hover animations
- `lucide-react` - All icons
- `tailwind-merge` - cn() utility
- `@radix-ui/*` - Badge, Progress components

### NO New Dependencies Needed
All required functionality exists in current stack.

## Construction Theme Integration

### Colors (Strategic Use)
- **Primary (#001B51)**: Card border, project name hover, completion %, schedule days
- **Accent (#3C3C3C)**: Section icons (Budget, Schedule)
- **Green (#059669)**: Done, under budget, on-time
- **Red (#DC2626)**: Over budget, delayed, overdue
- **Yellow (#FBBF24)**: At-risk, blocked

### Icons (Lucide React)
- `Building2`, `Home`, `UtensilsCrossed`, `Factory` - Project types
- `Clock`, `CheckCircle2`, `AlertCircle`, `XCircle` - Status
- `DollarSign` - Budget
- `Calendar` - Schedule, dates
- `Users` - Team
- `Package` - Tasks, materials
- `AlertTriangle` - Blocked, warnings

### Typography
- Project name: Bold `text-lg`
- Section headers: Semibold `text-xs uppercase tracking-wide`
- Values: Semibold or bold `text-xs`
- Labels: Regular `text-xs text-gray-500`

## Important Notes

### Accessibility
- All icons have associated text labels
- Color is not sole indicator (icons + text)
- WCAG AA contrast ratios maintained
- Touch targets meet 44px minimum
- Keyboard navigation supported (Link wrapper)

### Performance
- Keep existing 3D tilt (already optimized with useSpring)
- No new heavy animations
- Component renders efficiently
- No unnecessary re-renders

### Maintenance
- Keep existing type interfaces
- Maintain compatibility with stats and non-stats projects
- Keep utility functions (even if unused now, for consistency)
- Document any helper functions used

### Future Considerations
- Health score could return as small icon indicator (not colored box)
- Consider project thumbnail/image in future
- Consider "favorite" or "pin" feature
- Possible "View Project" button on hover (desktop)

## Visual Mockup Description

```
┌────────────────────────────────────────────────────────┐
│ [Icon] Large Project Name          [Active Badge]     │
│        Client Name                                     │
│                                                        │
│ [Type Icon] Residential      [Cal Icon] Jan 15, 2025  │
│ ──────────────────────────────────────────────────────│
│                                                        │
│ [══════════════════════════════] 75%                   │
│ Overall Progress                                       │
│                                                        │
│ ──────────────────────────────────────────────────────│
│ [$] BUDGET              [Clock] SCHEDULE               │
│ Planned    $500K        Days Left      45d             │
│ Actual     $475K        Status    On Track             │
│ ──────────────────────────────────────────────────────│
│                                                        │
│ [✓ 12] [○ 8] [⚠ 2] [⏰ 1]                            │
│ ──────────────────────────────────────────────────────│
│                                                        │
│ [👥] 6 team members                                    │
└────────────────────────────────────────────────────────┘
```

**Clean, professional, easy to scan, not cluttered.**

## Success Criteria

The redesigned ProjectCard is successful when:

1. ✅ Information hierarchy is immediately clear
2. ✅ Most important info (name, status, progress) stands out
3. ✅ NO colored background sections
4. ✅ Clean, minimal, professional aesthetic
5. ✅ Easy to scan in grid view
6. ✅ Responsive on all devices
7. ✅ All essential information retained
8. ✅ Less visual clutter than current design
9. ✅ Construction blue border creates cohesive identity
10. ✅ 3D tilt effect maintains premium feel

## Key Design Decisions

### Why Move Percentage to Right of Progress Bar?
- Creates horizontal visual flow
- Makes percentage more prominent
- Reduces vertical space usage
- Percentage is key metric, deserves prominence

### Why Remove Phase Status?
- Redundant with overall progress
- Not critical at card level (detail view is better place)
- Reduces visual clutter
- Simplifies information hierarchy

### Why Remove Health Score Background?
- Colored backgrounds dominate visual hierarchy
- Breaks clean, minimal aesthetic
- Information can be conveyed other ways
- Focus on actionable metrics (budget, schedule, tasks)

### Why Keep 3D Tilt Effect?
- Premium feel
- Differentiates from generic dashboards
- Already implemented and optimized
- Users expect modern interactions

### Why Task Pills?
- Quick visual scan
- Color-coded status
- Compact layout
- Only show problems (blocked/overdue conditional)

---

## Ready for Implementation

**Status**: Complete design specification ready for `frontend-builder`

**Implementation Complexity**: Medium
- Structural changes to layout
- Element removals
- New pill components
- Progress section redesign

**Estimated Time**: 2-3 hours
- 1 hour: Layout restructuring, removals
- 1 hour: Metrics grid, task pills
- 30 min: Polish, testing, responsive

**Testing Focus**:
- Visual hierarchy clear
- Spacing consistent
- Colors strategic, not overwhelming
- Responsive behavior
- 3D tilt still works
- Accessibility maintained

