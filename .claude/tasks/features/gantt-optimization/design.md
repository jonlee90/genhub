# Design: Gantt Chart Optimization

## Architecture Overview

The Gantt chart consists of 9 files that work together:

```
components/tasks/gantt/
├── GanttChart.tsx          # Main orchestrator component
├── GanttHeader.tsx         # Timeline header with date groups
├── GanttTimeline.tsx       # SVG grid background
├── GanttTaskRow.tsx        # Individual task row (sidebar + bar area)
├── GanttTaskBar.tsx        # Draggable task bar
├── GanttDependencyLines.tsx # SVG dependency arrows
├── GanttViewToggle.tsx     # Day/Week/Month toggle
├── gantt-types.ts          # TypeScript types and configs
└── gantt-utils.ts          # Utility functions
```

## Issue Analysis

### Mobile Drag Bug Root Cause

In `GanttChart.tsx` (lines 77-107), mouse drag handlers are attached to the ScrollArea:

```tsx
const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  // ... sets isDraggingScroll to true
}, []);

// These are also fired by touch events on mobile
<ScrollArea
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseLeave}
>
```

**Problem**: On mobile devices, touch events trigger mouse event handlers, causing the entire chart to drag when the user touches anywhere on the ScrollArea.

**Solution**: Disable mouse drag scrolling on mobile devices. The native touch scrolling on the ScrollArea is sufficient for mobile navigation.

## Technical Design

### Fix 1: Disable Mouse Drag on Mobile

**File**: `GanttChart.tsx`

**Change**: Conditionally apply mouse drag handlers only on desktop

```tsx
// Before (problematic)
<ScrollArea
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  ...
>

// After (fixed)
<ScrollArea
  onMouseDown={!isMobile ? handleMouseDown : undefined}
  onMouseMove={!isMobile ? handleMouseMove : undefined}
  onMouseUp={!isMobile ? handleMouseUp : undefined}
  onMouseLeave={!isMobile ? handleMouseLeave : undefined}
>
```

Also remove the `cursor-grab`/`cursor-grabbing` classes on mobile since drag scrolling won't be available.

### Fix 2: Vercel React Best Practices Optimizations

#### 2.1 GanttChart.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `bundle-barrel-imports` | Imports from lucide-react barrel | Already using direct component imports - OK |
| `rerender-lazy-state-init` | `useState(() => ({ x: 0, scrollLeft: 0 }))` | Already correct - OK |
| `rendering-conditional-render` | `isMobile ? "" : <div>` | Change to ternary with null |
| `rerender-memo` | sortedTasks recalculated correctly | Already uses useMemo - OK |

**Changes needed**:
```tsx
// Line 287-297: Fix conditional rendering
// Before:
{isMobile ? "" : <div>...</div>}

// After:
{isMobile ? null : <div>...</div>}
```

#### 2.2 GanttTimeline.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `rendering-hoist-jsx` | SVG defs are static | Hoist marker definition outside component |
| `rerender-memo` | Already uses React.memo | OK |

**Changes needed**:
```tsx
// Hoist static SVG marker outside component
const TodayArrowMarker = ({ isMobile }: { isMobile: boolean }) => (
  <marker ...>
    <polygon ... />
  </marker>
);
```

#### 2.3 GanttTaskBar.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `rerender-dependencies` | useCallback deps include objects | Already uses primitive deps - OK |
| `rerender-memo` | Already uses React.memo | OK |

**No changes needed** - already well optimized.

#### 2.4 GanttTaskRow.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `rendering-content-visibility` | Uses content-visibility | Already implemented - OK |
| `rerender-memo` | Already uses React.memo | OK |
| `rendering-conditional-render` | Uses `&&` for conditionals | Change to ternary |

**Changes needed**:
```tsx
// Line 77-84: Fix && conditional
// Before:
{task.assignee && !isMobile && (
  <Avatar>...</Avatar>
)}

// After:
{task.assignee && !isMobile ? (
  <Avatar>...</Avatar>
) : null}

// Line 118-125: Fix && conditional
// Before:
{task.project && (
  <span>...</span>
)}

// After:
{task.project ? (
  <span>...</span>
) : null}
```

#### 2.5 GanttHeader.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `rerender-memo` | Already uses React.memo | OK |
| `js-cache-property-access` | `cell.label.split(" ")` in render | Move split outside map or memoize |
| `rendering-conditional-render` | Uses `&&` pattern | Change to ternary |

**Changes needed**:
```tsx
// Line 82-88: Fix && conditional
// Before:
{!isMobile && (
  <span>...</span>
)}

// After:
{!isMobile ? (
  <span>...</span>
) : null}
```

#### 2.6 GanttDependencyLines.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `rerender-memo` | Already uses React.memo | OK |
| `rendering-hoist-jsx` | SVG defs markers are static | Could hoist but minimal impact |

**No changes needed** - already well optimized.

#### 2.7 GanttViewToggle.tsx

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `bundle-barrel-imports` | Multiple lucide imports | Combine into single import statement |
| `rerender-memo` | Already uses React.memo | OK |
| `rendering-hoist-jsx` | VIEW_OPTIONS is hoisted | Already correct - OK |

**Changes needed**:
```tsx
// Lines 4-6: Combine imports
// Before:
import { Calendar } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { CalendarRange } from "lucide-react";

// After:
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
```

#### 2.8 gantt-types.ts

No React components - already optimized with const exports.

#### 2.9 gantt-utils.ts

| Rule | Current Issue | Fix |
|------|--------------|-----|
| `js-early-exit` | Functions use early returns | Already correct - OK |

**No changes needed** - pure utility functions are already optimized.

## Summary of Changes

| File | Changes |
|------|---------|
| `GanttChart.tsx` | Disable mouse drag handlers on mobile; fix conditional render |
| `GanttTimeline.tsx` | No changes needed |
| `GanttTaskBar.tsx` | No changes needed |
| `GanttTaskRow.tsx` | Fix 2 conditional renders (use ternary) |
| `GanttHeader.tsx` | Fix 1 conditional render (use ternary) |
| `GanttDependencyLines.tsx` | No changes needed |
| `GanttViewToggle.tsx` | Combine lucide-react imports |
| `gantt-types.ts` | No changes needed |
| `gantt-utils.ts` | No changes needed |

## Testing Strategy

1. **Mobile Testing**: Test on actual mobile device or Chrome DevTools mobile emulation
   - Verify chart doesn't drag when touching the main area
   - Verify task bars can still be dragged to reschedule
   - Verify horizontal scrolling works via scrollbar/swipe

2. **Desktop Testing**: Verify drag-to-scroll still works on desktop
   - Verify cursor changes to grab/grabbing
   - Verify task dragging still works

3. **Build Verification**: Run `npm run build` to ensure no type errors
