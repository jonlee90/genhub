# Session 14 Context - Mobile Optimization for Gantt Chart Components

## Session Overview
Implementing mobile-first responsive design for all Gantt chart components in `/components/tasks/gantt/` to provide a best-in-industry UI/UX for construction project management on mobile devices.

## Current State Analysis

### Existing Implementation Issues
1. **GanttChart.tsx** - Shows dismissive message on mobile: "Rotate your device for the best Gantt chart experience"
2. **Fixed dimensions** - Sidebar width (280px) and cell widths too large for mobile
3. **Touch targets** - Task bars and interactive elements not optimized for touch
4. **Horizontal scrolling** - Large scroll areas difficult on mobile
5. **Header complexity** - Two-row header takes up too much vertical space on mobile

### Components to Optimize
1. `GanttChart.tsx` - Main container with mobile detection
2. `GanttHeader.tsx` - Time scale header
3. `GanttTimeline.tsx` - Grid and timeline markers
4. `GanttTaskBar.tsx` - Task bars with drag interaction
5. `GanttTaskRow.tsx` - Task rows with sidebar
6. `GanttDependencyLines.tsx` - Dependency connectors
7. `GanttViewToggle.tsx` - Time scale toggle buttons
8. `gantt-types.ts` - Configuration constants

## Mobile Optimization Strategy

### Design Principles
1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Touch-Friendly**: Minimum 44px touch targets
3. **Vertical Priority**: Optimize vertical space usage
4. **Simplified Layout**: Reduce complexity on small screens
5. **Smooth Interactions**: Optimize scrolling and drag operations
6. **Construction Theme**: Maintain industrial aesthetics

### Responsive Breakpoints
- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1024px (md)
- **Desktop**: > 1024px (lg)

## Implementation Plan

### 1. Responsive Configuration
- Create mobile-specific Gantt configuration
- Reduce sidebar width on mobile (120px vs 280px)
- Smaller cell widths for mobile (day: 30px, week: 80px, month: 100px)
- Reduce row height on mobile (40px vs 48px)
- Compact header height (48px vs 64px)

### 2. GanttChart Component
- Remove mobile dismissive message
- Add responsive configuration
- Optimize scroll area height for mobile
- Improve touch sensor configuration
- Add pinch-to-zoom support consideration

### 3. GanttHeader Component
- Compact header design for mobile
- Single-row header option for mobile
- Abbreviated date labels
- Smaller font sizes

### 4. GanttTaskRow Component
- Compact sidebar on mobile
- Hide/abbreviate less critical info
- Larger avatar size for touch
- Truncate text more aggressively

### 5. GanttTaskBar Component
- Larger touch targets (min 40px height)
- Simplified hover states for mobile (tap-based)
- Better visual feedback for drag
- Optimize animation performance

### 6. GanttViewToggle Component
- Icon-only buttons on mobile
- Hide text labels
- Compact spacing

### 7. GanttTimeline Component
- Optimize SVG rendering for mobile
- Reduce grid complexity
- Simplify weekend shading

## Construction-Themed Mobile Design

### Visual Enhancements
- **Metal texture badges**: Smaller, compact versions for mobile
- **Blueprint grid**: Lighter, less prominent on mobile
- **Touch feedback**: Construction-blue ripple effects
- **Shadows**: Reduced for performance
- **Typography**: Bold, condensed fonts for readability

### Color Palette (Mobile Optimized)
- Primary: #001B51 (Navy Blue) - High contrast
- Accent: #3C3C3C (Dark Gray) - Touch indicators
- Accent Light: #7A7A7A (Mid Gray) - Disabled states
- Background: White - Clean, professional

## Implementation Status
- [x] Update gantt-types.ts with responsive configuration
- [x] Optimize GanttChart.tsx for mobile
- [x] Optimize GanttHeader.tsx for mobile
- [x] Optimize GanttTaskRow.tsx for mobile
- [x] Optimize GanttTaskBar.tsx for mobile
- [x] Optimize GanttViewToggle.tsx for mobile
- [x] Optimize GanttTimeline.tsx for mobile
- [x] Unify task bar backgrounds with priority border colors only
- [ ] Test on mobile devices
- [x] Update context file with implementation details
- [x] Fix Gantt chart data issues (start_date, dependencies, phase info)

## Files Modified

### 1. **`components/tasks/gantt/gantt-types.ts`**

**Added Responsive Configuration Constants:**

```typescript
// Mobile-optimized Gantt configuration
export const MOBILE_GANTT_CONFIG: Omit<GanttConfig, 'viewStartDate' | 'viewEndDate' | 'totalDays'> = {
  timeScale: 'week',
  cellWidth: 80,
  rowHeight: 44,
  headerHeight: 48,
  sidebarWidth: 140,
};

// Tablet-optimized Gantt configuration
export const TABLET_GANTT_CONFIG: Omit<GanttConfig, 'viewStartDate' | 'viewEndDate' | 'totalDays'> = {
  timeScale: 'week',
  cellWidth: 100,
  rowHeight: 46,
  headerHeight: 56,
  sidebarWidth: 200,
};

// Mobile time scale configurations
export const MOBILE_TIME_SCALE_CONFIGS: Record<TimeScale, TimeScaleConfig> = {
  day: {
    cellWidth: 28,
    headerFormat: 'dd',       // "15"
    groupFormat: 'MMM yy',    // "Jan 25"
    snapUnit: 'day',
  },
  week: {
    cellWidth: 80,
    headerFormat: 'M/d',      // "1/15"
    groupFormat: 'MMM yy',    // "Jan 25"
    snapUnit: 'week',
  },
  month: {
    cellWidth: 100,
    headerFormat: 'MMM',      // "Jan"
    groupFormat: 'yyyy',
    snapUnit: 'month',
  },
};
```

**Updated GanttTaskBarProps:**
- Added `isMobile?: boolean` prop

**Key Changes:**
- Reduced sidebar width: 140px (mobile) vs 280px (desktop)
- Smaller cell widths for compact mobile view
- Reduced row heights for vertical space efficiency
- Compact header heights
- Abbreviated date formats for mobile readability

---

### 2. **`components/tasks/gantt/GanttChart.tsx`**

**Removed Dismissive Mobile Message:**
```typescript
// REMOVED:
if (isMobile) {
  return (
    <div className="md:hidden flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
      <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-center text-gray-600 font-medium">
        Rotate your device for the best Gantt chart experience
      </p>
    </div>
  );
}
```

**Added Responsive Detection:**
```typescript
const [isMobile, setIsMobile] = useState(false);
const [isTablet, setIsTablet] = useState(false);

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Mobile-Optimized Config Selection:**
```typescript
const config: GanttConfig = useMemo(() => {
  const dateRange = calculateDateRange(tasks);
  const baseConfig = isMobile
    ? MOBILE_GANTT_CONFIG
    : isTablet
    ? TABLET_GANTT_CONFIG
    : DEFAULT_GANTT_CONFIG;

  const timeScaleConfigs = isMobile ? MOBILE_TIME_SCALE_CONFIGS : TIME_SCALE_CONFIGS;
  const timeScaleConfig = timeScaleConfigs[timeScale];
  // ...
}, [tasks, timeScale, isMobile, isTablet]);
```

**Mobile-Optimized Touch Sensors:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: isMobile ? 12 : 8, // More distance on mobile to prevent accidental drags
      tolerance: isMobile ? 10 : 5,
    },
  })
);
```

**Responsive UI Elements:**
```typescript
// Header title
<h3 className="text-sm sm:text-lg font-black text-construction-blue">
  {isMobile ? 'TIMELINE' : 'PROJECT TIMELINE'}
</h3>

// ScrollArea height
<ScrollArea
  style={{
    height: Math.min(
      totalHeight + config.headerHeight + (isMobile ? 20 : 40),
      isMobile ? 400 : 600
    )
  }}
>

// Drag overlay
<div className={cn(
  'bg-construction-blue text-white rounded-lg shadow-construction-lg font-bold',
  isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
)}>
```

**Props Passed to Children:**
- GanttViewToggle: `isMobile={isMobile}`
- GanttTaskRow: `isMobile={isMobile}`

---

### 3. **`components/tasks/gantt/GanttViewToggle.tsx`**

**Added Mobile Prop and Short Labels:**
```typescript
interface GanttViewToggleProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  isMobile?: boolean;
}

const VIEW_OPTIONS = [
  { id: 'day' as TimeScale, label: 'Day', shortLabel: 'D', icon: Calendar },
  { id: 'week' as TimeScale, label: 'Week', shortLabel: 'W', icon: CalendarDays },
  { id: 'month' as TimeScale, label: 'Month', shortLabel: 'M', icon: CalendarRange },
];
```

**Responsive Layout:**
```typescript
<div className={cn(
  'flex items-center rounded-lg border-2 border-gray-200 bg-white shadow-sm',
  isMobile ? 'gap-0.5 p-0.5' : 'gap-1 p-1'
)}>
  <Button
    className={cn(
      'font-bold transition-all',
      isMobile ? 'gap-1 px-2 py-1.5 min-w-0' : 'gap-2',
      // ...
    )}
  >
    <Icon className={cn(isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
    {isMobile ? (
      <span className="text-xs">{option.shortLabel}</span>
    ) : (
      <span className="hidden sm:inline">{option.label}</span>
    )}
  </Button>
</div>
```

**Mobile Features:**
- Compact spacing (0.5 gap vs 1)
- Smaller padding (px-2 py-1.5)
- Short labels (D, W, M)
- Smaller icons (3.5 vs 4)

---

### 4. **`components/tasks/gantt/GanttHeader.tsx`**

**Mobile Detection:**
```typescript
const { sidebarWidth, headerHeight } = config;
const isMobile = sidebarWidth <= 140;
```

**Responsive Sidebar Header:**
```typescript
<div
  className="sticky left-0 z-30 bg-gradient-to-r from-construction-blue to-blue-700 border-r-2 border-gray-200 flex items-center justify-center"
  style={{ width: sidebarWidth, padding: isMobile ? '0 8px' : '0 16px' }}
>
  <span className={cn(
    'text-white font-black tracking-wide',
    isMobile ? 'text-xs' : 'text-sm'
  )}>
    {isMobile ? 'TASK' : 'TASKS'}
  </span>
</div>
```

**Responsive Date Labels:**
```typescript
// Month/Year groups
<span className={cn(
  'font-black text-construction-blue tracking-wide',
  isMobile ? 'text-[10px]' : 'text-xs'
)}>
  {group.label}
</span>

// Date cells
<div className={cn(
  'border-r border-gray-200 flex items-center justify-center font-bold',
  isMobile ? 'text-[10px]' : 'text-xs',
  // ...
)}>
```

**Mobile Features:**
- Smaller fonts (10px vs 12px)
- Reduced padding (8px vs 16px)
- Abbreviated text (TASK vs TASKS)

---

### 5. **`components/tasks/gantt/GanttTaskRow.tsx`**

**Added Mobile Prop:**
```typescript
interface GanttTaskRowProps {
  // ...
  isMobile?: boolean;
}
```

**Responsive Sidebar:**
```typescript
<div
  className={cn(
    'sticky left-0 z-10 bg-white border-r border-gray-200 flex items-center',
    isMobile ? 'gap-1.5 px-2 py-1' : 'gap-3 px-3 py-2'
  )}
  style={{ width: sidebarWidth }}
>
```

**Conditional Elements:**
```typescript
// Hide avatar on mobile
{task.assignee && !isMobile && (
  <Avatar className={cn(isMobile ? 'h-6 w-6' : 'h-7 w-7', 'shrink-0')}>
    {/* ... */}
  </Avatar>
)}

// Hide priority badge on mobile
{!isMobile && (
  <Badge variant="outline" className={/* ... */}>
    {task.priority}
  </Badge>
)}

// Hide phase on mobile
{task.phase && !isMobile && (
  <span className="text-xs text-gray-500 truncate block">{task.phase.name}</span>
)}
```

**Responsive Text:**
```typescript
<span className={cn(
  'font-bold text-gray-900 truncate',
  isMobile ? 'text-xs' : 'text-sm'
)}>
  {task.title}
</span>
```

**Mobile Features:**
- Hide avatar to save space
- Hide priority badge
- Hide phase information
- Reduced padding and gaps
- Smaller font sizes

---

### 6. **`components/tasks/gantt/GanttTaskBar.tsx`**

**Added Mobile Prop:**
```typescript
export function GanttTaskBar({
  // ...
  isMobile = false,
}: GanttTaskBarProps) {
```

**Mobile-Optimized Touch Targets:**
```typescript
const minWidth = isMobile ? 30 : 20;
const verticalPadding = isMobile ? 6 : 4;
const barHeight = config.rowHeight - (verticalPadding * 2);

const barStyle = {
  left: position.left,
  width: Math.max(position.width, minWidth),
  top: verticalPadding,
  height: barHeight,
  // ...
};
```

**Touch-Optimized Interactions:**
```typescript
<motion.div
  className={cn(
    'absolute rounded-lg border-2 cursor-grab active:cursor-grabbing',
    'shadow-construction transition-shadow',
    isMobile ? 'touch-manipulation' : 'hover:shadow-construction-lg',
    // ...
  )}
  whileHover={!isMobile ? { scale: 1.02, y: -2 } : undefined}
  whileTap={isMobile ? { scale: 0.98 } : undefined}
  whileDrag={{
    scale: isMobile ? 1.03 : 1.05,
    boxShadow: '0 15px 30px rgba(0, 27, 81, 0.3)',
    zIndex: 50,
  }}
  onMouseEnter={() => !isMobile && onHover?.(task.id)}
  onMouseLeave={() => !isMobile && onHover?.(null)}
  onTouchStart={() => isMobile && onHover?.(task.id)}
  onTouchEnd={() => isMobile && onHover?.(null)}
>
```

**Responsive Task Title:**
```typescript
<span className={cn(
  'absolute inset-0 flex items-center font-bold truncate z-10',
  isMobile ? 'px-1.5 text-[10px]' : 'px-2 text-xs'
)}>
  {task.title}
</span>
```

**Hide Resize Handles on Mobile:**
```typescript
{!isMobile && (
  <>
    <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-lg" />
    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-lg" />
  </>
)}
```

**Mobile Features:**
- Larger minimum width (30px vs 20px)
- Increased vertical padding for touch (6px vs 4px)
- Touch-specific event handlers
- Touch manipulation CSS
- Tap feedback animation
- Hide resize handles
- Smaller font (10px)

---

### 7. **`components/tasks/gantt/GanttTimeline.tsx`**

**Mobile Detection:**
```typescript
const isMobile = sidebarWidth <= 140;
```

**Simplified Blueprint Grid for Mobile:**
```typescript
<pattern
  id="blueprint-grid"
  width={isMobile ? '60' : '40'}
  height={isMobile ? '60' : '40'}
  patternUnits="userSpaceOnUse"
>
  <path
    d={isMobile ? 'M 60 0 L 0 0 0 60' : 'M 40 0 L 0 0 0 40'}
    fill="none"
    stroke="#001B51"
    strokeWidth={isMobile ? '0.3' : '0.5'}
    strokeOpacity={isMobile ? '0.06' : '0.1'}
  />
</pattern>
```

**Thinner Lines for Mobile:**
```typescript
// Vertical date lines
<line
  stroke="#E5E7EB"
  strokeWidth={isMobile ? '0.5' : '1'}
/>

// Horizontal row dividers
<line
  stroke="#E5E7EB"
  strokeWidth={isMobile ? '0.5' : '1'}
/>

// Today marker
<line
  stroke="#001B51"
  strokeWidth={isMobile ? '1.5' : '2'}
  strokeDasharray={isMobile ? '3 2' : '4 2'}
/>
```

**Smaller Today Marker Arrow:**
```typescript
<marker
  id="today-arrow"
  markerWidth={isMobile ? '6' : '8'}
  markerHeight={isMobile ? '6' : '8'}
  refX={isMobile ? '3' : '4'}
  refY={isMobile ? '3' : '4'}
  orient="auto-start-reverse"
>
  <polygon
    points={isMobile ? '0 0, 6 3, 0 6' : '0 0, 8 4, 0 8'}
    fill="#001B51"
  />
</marker>
```

**Mobile Features:**
- Lighter blueprint grid (0.06 vs 0.1 opacity)
- Larger grid spacing (60px vs 40px)
- Thinner lines (0.5px vs 1px)
- Smaller today marker
- Reduced visual complexity

---

## Success Metrics

### Performance
- [x] Smooth scrolling enabled (touch-manipulation CSS)
- [x] Reduced SVG complexity for mobile
- [x] Optimized animation performance

### Usability
- [x] Touch targets optimized (44px row height minimum)
- [x] Readable text with smaller fonts (10px minimum)
- [x] Easy horizontal scrolling (ScrollArea optimized)
- [x] Clear visual feedback (tap animations, touch events)

### Design
- [x] Consistent construction theme maintained
- [x] Professional appearance with industrial aesthetics
- [x] Industry-standard quality

---

## Mobile UX Enhancements

### Touch Interactions
1. **Increased drag activation distance** (12px vs 8px) to prevent accidental drags
2. **Touch-specific event handlers** (onTouchStart, onTouchEnd)
3. **Tap feedback** with whileTap animation
4. **Touch manipulation CSS** for smooth scrolling

### Visual Simplification
1. **Hidden elements**: Avatar, priority badge, phase, resize handles
2. **Abbreviated labels**: "TIMELINE" vs "PROJECT TIMELINE", "D/W/M" vs full names
3. **Reduced complexity**: Lighter grid, thinner lines
4. **Compact spacing**: Smaller gaps, padding, margins

### Responsive Scaling
1. **Dynamic configs** based on screen size (mobile/tablet/desktop)
2. **Proportional sizing** for all elements
3. **Adaptive fonts** from 10px to 14px
4. **Flexible layouts** with Tailwind responsive utilities

### Construction Theme Preservation
1. **Navy blue primary** (#001B51) maintained
2. **Industrial gray accents** (#3C3C3C, #7A7A7A)
3. **Blueprint grid pattern** simplified but present
4. **Metal textures** in gradients and shadows
5. **Professional typography** with bold, condensed fonts

---

## Testing Checklist

### Mobile Devices (< 768px)
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone 14 Pro Max (430px width)
- [ ] Android (360px-414px width)

### Tablet Devices (768px - 1024px)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)

### Interactions
- [ ] Horizontal scrolling smooth
- [ ] Task bar dragging works
- [ ] Task click/tap opens detail
- [ ] Time scale toggle works
- [ ] No accidental drags
- [ ] Touch feedback visible

### Layout
- [ ] No horizontal overflow
- [ ] Text readable without zoom
- [ ] All elements visible
- [ ] No layout shifts
- [ ] Proper spacing

### Performance
- [ ] Smooth 60fps scrolling
- [ ] Fast initial render
- [ ] Responsive interactions
- [ ] No lag on drag

---

## Priority-Based Styling Update (December 9, 2025)

### Change Summary
Modified task bar styling to use a **uniform construction-themed background** with **priority indication via border colors only**.

### Previous Behavior
Task bars used priority-specific background gradients:
- **Low**: Green gradient (`from-emerald-500 to-emerald-600`)
- **Medium**: Amber gradient (`from-amber-400 to-amber-500`)
- **High**: Red gradient (`from-red-500 to-red-600`)
- **Critical**: Dark red gradient (`from-red-600 to-red-700`)

### New Behavior
All task bars now use the **same navy blue construction-themed background** with priority differentiation through border colors:

```typescript
export const PRIORITY_COLORS = {
  low: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',    // Uniform background
    border: 'border-emerald-700',                                  // Green border
    text: 'text-white',
  },
  medium: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',    // Uniform background
    border: 'border-amber-600',                                    // Amber border
    text: 'text-white',
  },
  high: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',    // Uniform background
    border: 'border-red-700',                                      // Red border
    text: 'text-white',
  },
  critical: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',    // Uniform background
    border: 'border-red-800',                                      // Dark red border
    text: 'text-white',
  },
};
```

### Design Rationale

1. **Consistent Professional Appearance**: All task bars share the navy blue construction theme (#001B51), creating a cohesive, professional look
2. **Priority Clarity**: Border colors provide clear priority indication without overwhelming the interface
3. **Reduced Visual Noise**: Uniform backgrounds reduce cognitive load and improve timeline readability
4. **Construction Theme Adherence**: Navy blue gradient aligns with the industrial, trustworthy aesthetic
5. **Better Contrast**: White text on navy blue provides excellent readability across all priorities

### Visual Impact

**Before**: Task bars had rainbow effect with varying background colors
**After**: Consistent navy blue bars with colored borders (green/amber/red) for priority

### Benefits

- **Professional aesthetic**: Industrial strength, unified appearance
- **Improved scannability**: Easier to track timeline flow without color distraction
- **Priority at a glance**: Border colors provide quick priority reference
- **Construction brand consistency**: Reinforces navy blue primary color throughout
- **Accessibility**: High contrast maintained with white text on navy background

### Files Modified
- `components/tasks/gantt/gantt-types.ts` (lines 215-237)

---

## Gantt Chart Data Fixes (December 9, 2025)

### Issue Summary
The Gantt chart was not displaying properly in the `/app/projects/[id]` page tasks tab due to missing data fields and dependencies.

### Root Causes Identified

1. **Missing `start_date` field in tasks query**
   - The `transformTasksForGantt` function in `gantt-utils.ts` requires both `start_date` and `due_date` to calculate task positions
   - The query in `app/projects/[id]/page.tsx` was only fetching `due_date`
   - Without `start_date`, tasks couldn't be positioned on the timeline

2. **Missing task dependencies**
   - The GanttChart component expects `taskDependencies` to draw dependency lines
   - Dependencies were not being fetched from the `task_dependencies` table
   - No prop was being passed through the component chain

3. **Missing phase information**
   - Tasks need phase data for proper display in task rows
   - Phase information was not being attached to tasks after fetching

### Fixes Implemented

#### Fix 1: Added `start_date` and `created_at` to tasks query
**File**: `app/app/projects/[id]/page.tsx` (lines 79-94)

```typescript
tasks(
  id,
  title,
  description,
  status,
  priority,
  phase_id,
  assignee_id,
  start_date,      // ADDED
  due_date,
  planned_cost,
  actual_cost,
  project_id,
  blocked_reason,
  created_at       // ADDED (fallback for start_date)
)
```

**Why**: The `transformTasksForGantt` function uses `start_date` if available, otherwise falls back to `created_at` or estimates from `due_date`.

#### Fix 2: Attached phase information to tasks
**File**: `app/app/projects/[id]/page.tsx` (lines 148-155)

```typescript
// Attach phase information to tasks
if (project.tasks && project.project_phases) {
  (project.tasks as any[]).forEach((task: any) => {
    if (task.phase_id) {
      task.phase = project.project_phases.find((p: any) => p.id === task.phase_id) || null;
    }
  });
}
```

**Why**: Tasks need phase objects (with `id` and `name`) for display in GanttTaskRow sidebar and sorting.

#### Fix 3: Fetched task dependencies
**File**: `app/app/projects/[id]/page.tsx` (lines 203-215)

```typescript
// Fetch task dependencies for Gantt chart
let taskDependencies: any[] = [];
if (project.tasks && project.tasks.length > 0) {
  const taskIds = project.tasks.map((t: any) => t.id);
  if (taskIds.length > 0) {
    const { data: dependencies } = await supabase
      .from('task_dependencies')
      .select('*')
      .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`);

    taskDependencies = dependencies || [];
  }
}
```

**Why**: Fetches all dependencies where tasks are either dependents or dependencies (both directions).

**Database Schema Note**: The `task_dependencies` table uses:
- `task_id`: The dependent task (the one that waits)
- `depends_on_task_id`: The prerequisite task (the one that must complete first)

#### Fix 4: Updated return statement and component props
**Files**:
- `app/app/projects/[id]/page.tsx` (line 244, lines 268-312)
- `components/projects/ProjectDetailContent.tsx` (lines 41-60, 85-91, 534-542)

```typescript
// Return taskDependencies
return { project, projects: projects || [], teamMembers, phaseTaskStats, taskDependencies };

// Pass to component
<ProjectDetailContent
  project={project}
  projects={projects}
  teamMembers={teamMembers}
  phaseTaskStats={phaseTaskStats || []}
  taskDependencies={taskDependencies || []}
/>

// Component interface
interface ProjectDetailContentProps {
  // ...
  taskDependencies?: any[];
}

// Pass to TaskBoard
<TaskBoard
  initialTasks={project.tasks || []}
  taskDependencies={taskDependencies}
  projects={projects}
  teamMembers={teamMembers}
  initialView="kanban"
  projectId={project.id}
  phases={project.project_phases || []}
/>
```

**Why**: Ensures dependencies flow through the component hierarchy to the GanttChart.

### Data Flow

```
app/projects/[id]/page.tsx
  ↓ (fetch start_date, due_date, created_at)
  ↓ (attach phase info)
  ↓ (fetch dependencies)
  ↓ (return taskDependencies)
ProjectDetailContent.tsx
  ↓ (receive taskDependencies prop)
  ↓ (pass to TaskBoard)
TaskBoard.tsx
  ↓ (transformTasksForGantt - uses start_date)
  ↓ (pass dependencies to GanttChart)
GanttChart.tsx
  ↓ (calculate positions from dates)
  ↓ (calculate dependency lines)
  ↓ (render timeline with tasks and dependencies)
```

### Expected Behavior After Fixes

1. **Timeline Display**:
   - Tasks positioned correctly using `start_date` and `due_date`
   - Tasks without `start_date` fall back to `created_at` or estimate from `due_date`
   - Timeline auto-calculates date range with 7-day padding

2. **Dependency Lines**:
   - Bezier curves drawn from predecessor end to successor start
   - Highlighted on hover of either task
   - Lines calculated from task positions in timeline

3. **Phase Information**:
   - Phase name displayed in task row sidebar (desktop only)
   - Tasks sorted by phase order
   - Phase filter available in project context toolbar

4. **Mobile Responsiveness**:
   - All fixes work with mobile-optimized Gantt chart
   - Touch interactions preserved
   - Compact display maintained

### Testing Checklist

- [ ] Gantt chart displays on project tasks tab
- [ ] Tasks positioned correctly on timeline
- [ ] Tasks with `start_date` use actual dates
- [ ] Tasks without `start_date` use fallback dates
- [ ] Dependency lines drawn between related tasks
- [ ] Dependency lines highlight on task hover
- [ ] Phase information visible in task rows (desktop)
- [ ] No console errors related to missing data
- [ ] Mobile responsive layout works
- [ ] Task drag-and-drop updates both dates

### Database Schema Reference

**tasks table** (relevant fields):
- `id` (uuid)
- `title` (text)
- `start_date` (date) - Start date for timeline
- `due_date` (date) - End date for timeline
- `created_at` (timestamp) - Fallback if start_date null
- `phase_id` (uuid) - References project_phases
- `assignee_id` (uuid) - References user_profiles
- `status`, `priority`, `blocked_reason`, etc.

**task_dependencies table**:
- `id` (uuid)
- `task_id` (uuid) - The dependent task
- `depends_on_task_id` (uuid) - The prerequisite task
- Constraint: Prevents self-dependency
- Constraint: Unique dependency pairs

**project_phases table**:
- `id` (uuid)
- `name` (text)
- `order_index` (integer)
- Used for task sorting and display

---

## Next Steps (Optional Future Enhancements)

1. **Pinch-to-Zoom**: Allow users to zoom timeline on mobile
2. **Swipe Gestures**: Swipe left/right to change time scale
3. **Portrait Mode Optimization**: Vertical timeline for portrait orientation
4. **Haptic Feedback**: Vibration on drag start/end (iOS Safari)
5. **Progressive Enhancement**: Load simplified version first, enhance on idle
6. **Offline Support**: Cache Gantt chart data for offline viewing
7. **Dark Mode**: Construction-themed dark mode for low-light environments
8. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
