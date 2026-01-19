# Implementation Tasks: Gantt Chart Optimization

## Overview

5 atomic tasks to fix mobile drag and apply Vercel React Best Practices to Gantt chart components.

---

## Task 1: Fix Mobile Drag Scrolling in GanttChart.tsx

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Files**: `components/tasks/gantt/GanttChart.tsx`
- **Depends on**: None

### Description

Disable mouse drag handlers on mobile devices to prevent the entire chart from being draggable. The native ScrollArea touch scrolling is sufficient for mobile navigation.

### Changes

1. Conditionally apply mouse drag handlers only when `!isMobile`:

```tsx
// Line 308-322: Update ScrollArea props
<ScrollArea
  className={cn(
    "w-full select-none bg-white",
    // Only show grab cursor on desktop
    !isMobile && (isDraggingScroll ? "cursor-grabbing" : "cursor-grab")
  )}
  style={{...}}
  onMouseDown={!isMobile ? handleMouseDown : undefined}
  onMouseMove={!isMobile ? handleMouseMove : undefined}
  onMouseUp={!isMobile ? handleMouseUp : undefined}
  onMouseLeave={!isMobile ? handleMouseLeave : undefined}
>
```

2. Fix conditional render at line 287-297:

```tsx
// Before:
{isMobile ? "" : <div>...</div>}

// After:
{isMobile ? null : (
  <div className="flex items-center gap-2 sm:gap-3">
    <h3 className="text-sm sm:text-lg font-black text-construction-blue">
      PROJECT TIMELINE
    </h3>
    <span className="text-xs sm:text-sm text-gray-500">
      {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
    </span>
  </div>
)}
```

### Acceptance Criteria

- [ ] Mouse drag scrolling disabled on mobile (isMobile === true)
- [ ] Mouse drag scrolling still works on desktop
- [ ] Task bar dragging still works on both mobile and desktop
- [ ] No cursor-grab styling on mobile
- [ ] Conditional render uses null instead of empty string

---

## Task 2: Optimize GanttTaskRow.tsx Conditional Rendering

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Files**: `components/tasks/gantt/GanttTaskRow.tsx`
- **Depends on**: None

### Description

Apply `rendering-conditional-render` best practice by replacing `&&` patterns with ternary operators.

### Changes

1. Line 77-84 - Avatar conditional:

```tsx
// Before:
{task.assignee && !isMobile && (
  <Avatar className={cn(isMobile ? "h-6 w-6" : "h-7 w-7", "shrink-0")}>
    ...
  </Avatar>
)}

// After:
{task.assignee && !isMobile ? (
  <Avatar className={cn(isMobile ? "h-6 w-6" : "h-7 w-7", "shrink-0")}>
    ...
  </Avatar>
) : null}
```

2. Line 118-125 - Project name conditional:

```tsx
// Before:
{task.project && (
  <span className={cn(...)}>
    {task.project.name}
  </span>
)}

// After:
{task.project ? (
  <span className={cn(...)}>
    {task.project.name}
  </span>
) : null}
```

### Acceptance Criteria

- [ ] All `&&` conditional renders replaced with ternary
- [ ] No functional changes
- [ ] Component still renders correctly

---

## Task 3: Optimize GanttHeader.tsx Conditional Rendering

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Files**: `components/tasks/gantt/GanttHeader.tsx`
- **Depends on**: None

### Description

Apply `rendering-conditional-render` best practice by replacing `&&` pattern with ternary operator.

### Changes

Line 82-88 - Second label span conditional:

```tsx
// Before:
{!isMobile && (
  <span className={cn(
    "font-black",
    cell.isToday ? "text-construction-blue text-base" : "text-gray-800 text-sm"
  )}>
    {labelParts[1]}
  </span>
)}

// After:
{!isMobile ? (
  <span className={cn(
    "font-black",
    cell.isToday ? "text-construction-blue text-base" : "text-gray-800 text-sm"
  )}>
    {labelParts[1]}
  </span>
) : null}
```

### Acceptance Criteria

- [ ] `&&` conditional render replaced with ternary
- [ ] No functional changes
- [ ] Header still renders correctly on mobile and desktop

---

## Task 4: Combine Lucide Imports in GanttViewToggle.tsx

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Files**: `components/tasks/gantt/GanttViewToggle.tsx`
- **Depends on**: None

### Description

Apply `bundle-barrel-imports` best practice by combining multiple imports from the same module.

### Changes

Lines 4-6:

```tsx
// Before:
import { Calendar } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { CalendarRange } from "lucide-react";

// After:
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";
```

### Acceptance Criteria

- [ ] Single import statement for all lucide icons
- [ ] No functional changes
- [ ] Component renders correctly

---

## Task 5: Build Verification and Testing

- **Agent**: code-reviewer
- **Complexity**: Simple
- **Files**: All gantt files
- **Depends on**: Tasks 1, 2, 3, 4

### Description

Verify all changes build successfully and don't introduce regressions.

### Steps

1. Run `npm run build` and verify no errors
2. Review changes for consistency
3. Verify TypeScript types are correct

### Acceptance Criteria

- [ ] `npm run build` passes without errors
- [ ] No TypeScript errors
- [ ] All optimizations correctly applied

---

## Execution Order

```
Task 1 ─┐
Task 2 ─┼─→ Task 5 (Build Verification)
Task 3 ─┤
Task 4 ─┘
```

Tasks 1-4 are independent and can be executed in parallel.
Task 5 runs after all other tasks complete.

---

## Orchestrator Command

```
orchestrator: "Implement gantt-optimization feature per spec at .claude/tasks/features/gantt-optimization/"
```

The orchestrator should:
1. Delegate Tasks 1-4 to frontend-engineer (can run in parallel)
2. After all complete, delegate Task 5 to code-reviewer
3. Report final status
