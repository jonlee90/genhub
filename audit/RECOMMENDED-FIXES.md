# Recommended Fixes - Gantt & Kanban Audit

Quick reference for implementing the 3 high-priority fixes from the audit.

---

## Fix 1: Replace Any Types with TaskTypeConfig (15 min)

### Step 1: Define the interface

**File:** `types/db/task.ts` (add to existing file)

```typescript
export interface TaskTypeConfig {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string | null;
}
```

### Step 2: Update gantt-types.ts

**File:** `components/tasks/gantt/gantt-types.ts`

```typescript
// Find line with taskTypes?: any[]
// Replace with:
import type { TaskTypeConfig } from "@/types/db/task";

export interface GanttChartProps {
  tasks: GanttTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: GanttTask) => void;
  onTaskDateChange?: (taskId: string, startDate: Date, dueDate: Date) => Promise<void>;
  className?: string;
  taskTypes?: TaskTypeConfig[];  // ✅ Fixed
}
```

### Step 3: Update GanttTaskRow.tsx

**File:** `components/tasks/gantt/GanttTaskRow.tsx`

```typescript
// Add import at top
import type { TaskTypeConfig } from "@/types/db/task";

// Update props interface
interface GanttTaskRowProps {
  task: GanttTask;
  config: GanttConfig;
  onClick: (task: GanttTask) => void;
  onHover?: (taskId: string | null) => void;
  isHovered?: boolean;
  position: TaskPosition;
  taskTypes?: TaskTypeConfig[];  // ✅ Fixed
}
```

### Step 4: Update KanbanBoard.tsx

**File:** `components/tasks/KanbanBoard.tsx`

```typescript
// Add import at top
import type { TaskTypeConfig } from "@/types/db/task";

// Update interface
interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  phases?: Phase[];
  taskTypes?: TaskTypeConfig[];  // ✅ Fixed
}
```

---

## Fix 2: Add useCallback to KanbanBoard Handlers (10 min)

**File:** `components/tasks/KanbanBoard.tsx`

### Current (lines 94-140)

```typescript
const handleDragStart = (event: DragStartEvent) => {
  const task = optimisticTasks.find((t) => t.id === event.active.id);
  setActiveTask(task || null);
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveTask(null);
  
  if (!over) return;
  
  const taskId = active.id as string;
  const overId = over.id as string;
  
  // ... rest of logic
};
```

### Fixed

```typescript
import { useState, useOptimistic, useTransition, useId, useMemo, useCallback } from "react";

// Add useCallback wrapper
const handleDragStart = useCallback((event: DragStartEvent) => {
  const task = optimisticTasks.find((t) => t.id === event.active.id);
  setActiveTask(task || null);
}, [optimisticTasks]);

const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  setActiveTask(null);
  
  if (!over) return;
  
  const taskId = active.id as string;
  const overId = over.id as string;
  
  let newStatus: TaskStatus;
  if (VALID_STATUSES.has(overId)) {
    newStatus = overId as TaskStatus;
  } else {
    const targetTask = optimisticTasks.find((t) => t.id === overId);
    if (!targetTask) return;
    newStatus = targetTask.status;
  }
  
  const task = optimisticTasks.find((t) => t.id === taskId);
  if (!task || task.status === newStatus) return;
  
  if (newStatus === "blocked") {
    const reason = window.prompt("Please enter a reason for blocking this task:");
    if (!reason) return;
    
    startTransition(async () => {
      setOptimisticTasks({ taskId, newStatus });
      await updateTaskStatus(taskId, newStatus, reason);
    });
  } else {
    startTransition(async () => {
      setOptimisticTasks({ taskId, newStatus });
      await updateTaskStatus(taskId, newStatus);
    });
  }
}, [optimisticTasks, setOptimisticTasks, startTransition]);
```

**Note:** Ensure `useCallback` is imported from React at the top of the file.

---

## Fix 3: Optimize Dependency Line Hover State (10 min)

**File:** `components/tasks/gantt/GanttChart.tsx`

### Current (lines 224-228)

```typescript
// Calculate dependency lines
const dependencyLines = useMemo(
  () => calculateDependencyLines(dependencies, taskPositions, hoveredTaskId),
  [dependencies, taskPositions, hoveredTaskId]  // ❌ hoveredTaskId triggers recalc
);
```

### Fixed

```typescript
// Calculate dependency lines (positions only - no hover state)
const dependencyLines = useMemo(
  () => calculateDependencyLines(dependencies, taskPositions),
  [dependencies, taskPositions]  // ✅ Removed hoveredTaskId
);
```

### Verify calculateDependencyLines signature

Check if `calculateDependencyLines` function needs to be updated:

**File:** `components/tasks/gantt/gantt-utils.ts`

```typescript
// If current signature includes hoveredTaskId parameter:
export function calculateDependencyLines(
  dependencies: TaskDependency[],
  taskPositions: Map<string, TaskPosition>,
  hoveredTaskId?: string | null  // ❌ Remove this parameter
): DependencyLine[] {
  // ... logic
}

// Change to:
export function calculateDependencyLines(
  dependencies: TaskDependency[],
  taskPositions: Map<string, TaskPosition>
): DependencyLine[] {
  // Remove any hover logic - highlighting is handled by DependencyPath component
  // Only calculate line positions (fromX, fromY, toX, toY)
  
  return dependencies.map((dep) => {
    // ... position calculation only
    return {
      id: `${dep.task_id}-${dep.depends_on_task_id}`,
      fromTaskId: dep.depends_on_task_id,
      toTaskId: dep.task_id,
      fromX: // ... calculated position
      fromY: // ... calculated position
      toX: // ... calculated position
      toY: // ... calculated position
      isHighlighted: false  // Default, will be computed in DependencyPath
    };
  });
}
```

**Note:** The `DependencyPath` component already correctly handles highlighting based on `hoveredTaskId` prop (lines 15-18 in GanttDependencyLines.tsx), so this change just prevents unnecessary recalculation of positions.

---

## Testing After Fixes

### 1. Type Safety
```bash
npx tsc --noEmit
# Should have 0 errors related to taskTypes
```

### 2. Performance
- Open React DevTools Profiler
- Drag tasks in KanbanBoard
- Verify KanbanColumn components don't re-render unnecessarily
- Hover over Gantt tasks with dependencies
- Verify dependency lines don't recalculate (check Profiler)

### 3. Functionality
- Test Gantt drag with dependencies - lines should still highlight correctly
- Test Kanban drag between columns - should work smoothly
- Test mobile touch interactions on both views

---

## Verification Checklist

- [ ] All TypeScript errors resolved
- [ ] `npm run build` succeeds
- [ ] Gantt hover highlighting still works
- [ ] Kanban drag-drop still works
- [ ] No console errors in browser
- [ ] React DevTools shows reduced re-renders

---

**Estimated Total Time:** 35 minutes  
**Risk Level:** Low (all changes are non-breaking optimizations)

