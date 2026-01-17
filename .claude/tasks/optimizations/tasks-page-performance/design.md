# Tasks Page Performance Optimization - Technical Design

## Overview

This document specifies the technical implementation approach for 12 performance optimizations targeting bundle size reduction, re-render optimization, and server-side caching for the Tasks page.

## Requirements Reference

See: `.claude/tasks/optimizations/tasks-page-performance/requirements.md`

---

## Architecture Overview

### Current Component Tree

```
TasksPage (Server Component)
    └── getTasksPageData() - lib/tasks.ts
    └── TasksPageClient (430 lines, 5 useMemo hooks)
            ├── TaskBoard (565 lines, 10+ useState)
            │       ├── KanbanBoard (dnd-kit, framer-motion)
            │       │       └── KanbanColumn (dnd-kit)
            │       │               └── TaskCard (dnd-kit, framer-motion)
            │       ├── TaskList (framer-motion)
            │       ├── TaskModal (1373 lines, dynamically import)
            │       └── GanttChart (already dynamic)
            └── TaskModal (duplicate render in mobile)
```

### Target Architecture

```
TasksPage (Server Component)
    └── getTasksPageData() - CACHED with React.cache()
    └── TasksPageClient (optimized filtering)
            ├── TaskBoard (split modal state)
            │       ├── KanbanBoardLazy (dynamic import)
            │       │       └── KanbanColumn (memoized)
            │       │               └── TaskCard (CSS animations)
            │       ├── TaskList (CSS animations)
            │       └── TaskModalLazy (dynamic import, lazy render)
            └── (modal removed - single instance in TaskBoard)
```

---

## Priority 1: Bundle Size Optimizations

### OPT-BUNDLE-1: Configure optimizePackageImports for lucide-react

**Requirement:** REQ-BUNDLE-1

**Approach:** Add lucide-react to Next.js `optimizePackageImports` experimental config. This enables automatic tree-shaking without changing import syntax.

**File:** `next.config.ts`

**Before:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useCache: true,
  },
  // ...
};
```

**After:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useCache: true,
    optimizePackageImports: ['lucide-react'],
  },
  // ...
};
```

**Risk:** LOW - This is a configuration change only; no code modifications required.

**Testing:**
1. Run `npm run build` and check for errors
2. Compare `.next/static` bundle sizes before/after
3. Verify icons render correctly on Tasks page

---

### OPT-BUNDLE-2: Replace Framer Motion with CSS Transitions in TaskCard

**Requirement:** REQ-BUNDLE-2

**Approach:** TaskCard uses framer-motion only for simple scale/opacity animations on badges. Replace with CSS transitions.

**File:** `components/tasks/TaskCard.tsx`

**Before (lines 98-114, 144-156, 181-186):**
```typescript
import { motion } from 'framer-motion';

<motion.div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  animate={isDragging ? false : (isSortableDragging ? {
    opacity: 0.5,
    scale: 0.95
  } : {
    scale: 1,
    rotate: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  })}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>

<motion.div
  className={cn("absolute top-2 right-2 z-10", ...)}
  initial={{ scale: 0, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
>
  <Badge>...</Badge>
</motion.div>
```

**After:**
```typescript
// Remove: import { motion } from 'framer-motion';

// Add CSS classes for animations
const cardAnimationClass = cn(
  'transition-all duration-200 ease-out',
  isSortableDragging && 'opacity-50 scale-95',
  !isSortableDragging && !isDragging && 'shadow-md hover:shadow-lg'
);

<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={cn("touch-manipulation", cardAnimationClass)}
>

// Badge with CSS animation
<div
  className={cn(
    "absolute top-2 right-2 z-10",
    "animate-badge-pop", // Custom CSS animation
    shouldShowEditIndicator && "group-hover:hidden"
  )}
>
  <Badge>...</Badge>
</div>
```

**New CSS (add to globals.css):**
```css
@keyframes badge-pop {
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  70% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.animate-badge-pop {
  animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

**Risk:** MEDIUM - Visual changes; requires verification of animation feel.

**Testing:**
1. Verify badge pop animation matches previous behavior
2. Verify drag opacity/scale transitions work
3. Test on mobile for touch responsiveness
4. Measure bundle size reduction

---

### OPT-BUNDLE-3: Dynamic Import DND-Kit in KanbanBoard

**Requirement:** REQ-BUNDLE-3

**Approach:** Wrap KanbanBoard component with dynamic import. Users in list view won't load dnd-kit.

**File:** `components/tasks/TaskBoard.tsx`

**Before (lines 6-7):**
```typescript
import { KanbanBoard } from './KanbanBoard';
import { TaskList } from './TaskList';
```

**After:**
```typescript
import dynamic from 'next/dynamic';
import { TaskList } from './TaskList';

const KanbanBoard = dynamic(
  () => import('./KanbanBoard').then(mod => ({ default: mod.KanbanBoard })),
  {
    loading: () => (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-72 h-96 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    ),
    ssr: false,
  }
);
```

**Risk:** LOW - Kanban already renders client-side; this just defers loading.

**Testing:**
1. Load Tasks page in list view - verify dnd-kit not in network tab
2. Switch to kanban view - verify loading state appears briefly
3. Verify drag-drop still works correctly
4. Measure initial bundle size reduction

---

### OPT-BUNDLE-4: Dynamic Import TaskModal with Lazy Rendering

**Requirement:** REQ-BUNDLE-4

**Approach:**
1. Dynamic import TaskModal component
2. Only render when `isModalOpen` is true (not just hidden)
3. Remove duplicate TaskModal from TasksPageClient mobile view

**File:** `components/tasks/TaskBoard.tsx`

**Before (line 9):**
```typescript
import { TaskModal } from './TaskModal';
```

**After:**
```typescript
import dynamic from 'next/dynamic';

const TaskModal = dynamic(
  () => import('./TaskModal').then(mod => ({ default: mod.TaskModal })),
  { ssr: false }
);
```

**Before (lines 548-561):**
```typescript
{/* Task Modal */}
<TaskModal
  isOpen={isModalOpen}
  onClose={handleModalClose}
  ...
/>
```

**After:**
```typescript
{/* Task Modal - Only render when open */}
{isModalOpen && (
  <TaskModal
    isOpen={isModalOpen}
    onClose={handleModalClose}
    ...
  />
)}
```

**File:** `components/tasks/TasksPageClient.tsx`

**Before (lines 354-362):**
```typescript
{/* Create task modal */}
<TaskModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  ...
/>
```

**After:**
```typescript
{/* Remove duplicate modal - TaskBoard handles all modals */}
```

Also update mobile layout to use TaskBoard's modal by passing `onCreateClick` prop.

**Risk:** MEDIUM - Need to ensure modal state coordination works correctly.

**Testing:**
1. Verify task creation works on mobile
2. Verify task editing works on desktop
3. Check modal doesn't flash on open
4. Measure bundle size reduction

---

## Priority 2: Re-render Optimizations

### OPT-RERENDER-1: Single-Pass Task Filtering in TasksPageClient

**Requirement:** REQ-RERENDER-1

**Approach:** Combine 5 separate useMemo hooks into a single iteration that computes all derived values.

**File:** `components/tasks/TasksPageClient.tsx`

**Before (lines 117-200):**
```typescript
const filteredTasks = useMemo(() => {
  return tasks.filter((task) => { /* ... */ });
}, [tasks, searchQuery, statusFilter, projectFilter]);

const projectTaskCount = useMemo(() => {
  if (projectFilter === 'all') return tasks.length;
  return tasks.filter((task) => task.project_id === projectFilter).length;
}, [tasks, projectFilter]);

const projectTaskCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  tasks.forEach((task) => { /* ... */ });
  return counts;
}, [tasks]);

const statusCounts = useMemo(() => {
  const tasksForCounting = tasks.filter((task) => { /* ... */ });
  // ...
}, [tasks, projectFilter, searchQuery]);
```

**After:**
```typescript
// Single-pass computation of all task-derived values
const taskMetrics = useMemo(() => {
  // Initialize counters
  const projectCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {
    all: 0, todo: 0, in_progress: 0, review: 0, blocked: 0, completed: 0
  };
  const filtered: TaskWithRelations[] = [];
  let projectTaskCount = 0;

  const query = searchQuery?.toLowerCase();

  // Single iteration over all tasks
  for (const task of tasks) {
    // Always count by project (for dropdown)
    if (task.project_id) {
      projectCounts[task.project_id] = (projectCounts[task.project_id] || 0) + 1;
    }

    // Check project filter match
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
    if (matchesProject && projectFilter !== 'all') {
      projectTaskCount++;
    }

    // Check search match
    const matchesSearch = !query ||
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.project?.name.toLowerCase().includes(query) ||
      task.assignee?.name.toLowerCase().includes(query);

    // Count for status tabs (project + search filtered, not status filtered)
    if (matchesProject && matchesSearch) {
      statusCounts.all++;
      if (task.status in statusCounts) {
        statusCounts[task.status]++;
      }
    }

    // Check status filter for final filtered list
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    if (matchesProject && matchesSearch && matchesStatus) {
      filtered.push(task);
    }
  }

  return {
    filteredTasks: filtered,
    projectTaskCount: projectFilter === 'all' ? tasks.length : projectTaskCount,
    projectTaskCounts: projectCounts,
    statusCounts,
  };
}, [tasks, searchQuery, statusFilter, projectFilter]);

// Destructure for use
const { filteredTasks, projectTaskCount, projectTaskCounts, statusCounts } = taskMetrics;
```

**Risk:** LOW - Logic is equivalent, just combined.

**Testing:**
1. Verify all filter combinations work correctly
2. Verify status counts update correctly
3. Profile with React DevTools to confirm fewer re-renders

---

### OPT-RERENDER-2: Extract Modal State from TaskBoard

**Requirement:** REQ-RERENDER-2

**Approach:** Move modal-related state to a separate context or lift to parent to prevent TaskBoard re-renders when modal state changes.

**New File:** `components/tasks/TaskModalContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TaskWithRelations } from '@/types/db/task';

interface TaskModalContextType {
  isOpen: boolean;
  mode: 'create' | 'edit';
  selectedTask: TaskWithRelations | null;
  openCreate: () => void;
  openEdit: (task: TaskWithRelations) => void;
  close: () => void;
}

const TaskModalContext = createContext<TaskModalContextType | null>(null);

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setSelectedTask(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((task: TaskWithRelations) => {
    setMode('edit');
    setSelectedTask(task);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedTask(null);
  }, []);

  return (
    <TaskModalContext.Provider value={{ isOpen, mode, selectedTask, openCreate, openEdit, close }}>
      {children}
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal must be used within TaskModalProvider');
  }
  return context;
}
```

**File Changes:** `components/tasks/TaskBoard.tsx`

Remove modal state (lines 137-139):
```typescript
// REMOVE these useState hooks
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
```

Replace with context:
```typescript
import { useTaskModal } from './TaskModalContext';

// In component:
const { isOpen, mode, selectedTask, openEdit, close } = useTaskModal();
```

**Risk:** MEDIUM - Requires prop drilling or context changes across components.

**Testing:**
1. Verify modal opens/closes correctly
2. Verify TaskBoard doesn't re-render when modal opens
3. Profile with React DevTools

---

### OPT-RERENDER-3: Extract Utility Functions from TaskCard

**Requirement:** REQ-RERENDER-3

**Approach:** Move `getInitials` and `formatCurrency` functions outside the component. The `isOverdue` calculation is already memoized by React.memo on the task prop.

**File:** `components/tasks/TaskCard.tsx`

**Before (lines 71-85):**
```typescript
export const TaskCard = React.memo(function TaskCard({ ... }) {
  // ...

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };
```

**After:**
```typescript
// Move outside component - pure functions with no dependencies
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export const TaskCard = React.memo(function TaskCard({ ... }) {
  // Functions now referenced from module scope
```

**Risk:** LOW - Pure function extraction, no behavior change.

**Testing:**
1. Verify initials display correctly
2. Verify currency formatting works
3. No visible changes expected

---

### OPT-RERENDER-4: Single-Pass Task Grouping in KanbanBoard

**Requirement:** REQ-RERENDER-4

**Approach:** Replace filter-per-column approach with single-pass grouping using a Map.

**File:** `components/tasks/KanbanBoard.tsx`

**Before (lines 71-81):**
```typescript
const tasksByStatus = useMemo(() =>
  COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = optimisticTasks.filter((task) => task.status === column.id);
      return acc;
    },
    {} as Record<TaskStatus, TaskWithRelations[]>
  ),
  [optimisticTasks]
);
```

**After:**
```typescript
const tasksByStatus = useMemo(() => {
  // Initialize empty arrays for each status
  const grouped: Record<TaskStatus, TaskWithRelations[]> = {
    todo: [],
    in_progress: [],
    review: [],
    blocked: [],
    completed: [],
  };

  // Single iteration - O(n) instead of O(n * columns)
  for (const task of optimisticTasks) {
    if (task.status in grouped) {
      grouped[task.status].push(task);
    }
  }

  return grouped;
}, [optimisticTasks]);
```

**Risk:** LOW - Equivalent logic, more efficient.

**Testing:**
1. Verify all columns show correct tasks
2. Verify drag-drop still works
3. Profile with large task lists

---

## Priority 3: Server-Side Optimizations

### OPT-SERVER-1: Add React.cache() to getTasksPageData

**Requirement:** REQ-SERVER-1

**Approach:** Wrap data fetching functions with React.cache() for request-level deduplication.

**File:** `lib/tasks.ts`

**Before (line 7):**
```typescript
export async function getTasksPageData() {
```

**After:**
```typescript
import { cache } from 'react';

export const getTasksPageData = cache(async function getTasksPageData() {
  // ... existing implementation
});

export const getTaskDetailData = cache(async function getTaskDetailData(taskId: string) {
  // ... existing implementation
});
```

**Risk:** LOW - React.cache is designed for this use case.

**Testing:**
1. Verify data loads correctly
2. Add console.log to verify function called once per request
3. No visible changes expected

---

### OPT-SERVER-2: Slim Data Payload at RSC Boundary

**Requirement:** REQ-SERVER-2

**Approach:** Create a slim task type for list/kanban views. Full task data fetched on modal open via Server Action.

**Note:** This is a larger refactor. Implementing as a separate phase.

**New File:** `lib/tasks-slim.ts`

```typescript
import 'server-only';
import { cache } from 'react';

// Slim task type for list/kanban views
export interface SlimTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  due_date: string | null;
  project_id: string;
  phase_id: string | null;
  assignee_id: string | null;
  spatial_marker_id: string | null;
  // Derived data
  project_name: string;
  phase_name: string | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
  material_count: number;
  material_cost: number;
}

export const getSlimTasksPageData = cache(async function() {
  // Optimized query selecting only needed fields
  // Returns SlimTask[] instead of full TaskWithRelations[]
});
```

**Risk:** HIGH - Requires type changes across components. Defer to Phase 2.

**Deferred:** Yes - Implement after bundle optimizations are complete.

---

## Priority 4-5: Rendering Optimizations

### OPT-RENDER-1: Content-Visibility for Long Task Lists

**Requirement:** REQ-RENDER-1

**Approach:** Add CSS `content-visibility: auto` to task rows for virtualization-lite behavior.

**File:** `components/tasks/TaskList.tsx`

Add to TableRow styling:
```typescript
<TableRow
  key={task.id}
  className="content-visibility-auto contain-intrinsic-size-[auto_60px]"
  // ... rest of props
>
```

**New CSS (globals.css):**
```css
.content-visibility-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 60px;
}
```

**Risk:** LOW - CSS-only change, graceful degradation in older browsers.

**Testing:**
1. Scroll through 100+ task list
2. Verify smooth scrolling
3. Check browser DevTools for paint operations

---

### OPT-RENDER-2: CSS Animations for SVG Icons

**Requirement:** REQ-RENDER-2

**Approach:** Already addressed in OPT-BUNDLE-2. TaskCard badge animations moved to CSS.

**Status:** Covered by OPT-BUNDLE-2.

---

## Next.js Configuration Summary

**File:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useCache: true,
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      // ... existing patterns
    ],
  },
  webpack: (config, { isServer }) => {
    // ... existing webpack config
    return config;
  },
};

export default nextConfig;
```

---

## Integration Points

### Dependency Order

```
OPT-BUNDLE-1 (lucide config) ──────────────────────────┐
                                                        │
OPT-BUNDLE-2 (TaskCard CSS) ───┬─→ OPT-BUNDLE-3 (KanbanBoard dynamic) ──┐
                               │                                         │
OPT-BUNDLE-4 (TaskModal dynamic) ──────────────────────────────────────┤
                                                                        │
OPT-RERENDER-1 (single-pass filter) ───────────────────────────────────┤
                                                                        │
OPT-RERENDER-2 (modal context) ────────────────────────────────────────┤
                                                                        │
OPT-RERENDER-3 (utility extraction) ───────────────────────────────────┤
                                                                        │
OPT-RERENDER-4 (single-pass grouping) ─────────────────────────────────┤
                                                                        │
OPT-SERVER-1 (React.cache) ────────────────────────────────────────────┤
                                                                        │
OPT-RENDER-1 (content-visibility) ─────────────────────────────────────┘

                                                   → Integration Testing
```

### Parallelizable Groups

**Group A (Independent):**
- OPT-BUNDLE-1 (next.config.ts)
- OPT-SERVER-1 (lib/tasks.ts)
- OPT-RERENDER-3 (TaskCard utilities)
- OPT-RERENDER-4 (KanbanBoard grouping)

**Group B (TaskCard Dependencies):**
- OPT-BUNDLE-2 (TaskCard CSS) - must complete before OPT-BUNDLE-3

**Group C (Sequential):**
- OPT-BUNDLE-3 (KanbanBoard dynamic) - after OPT-BUNDLE-2
- OPT-BUNDLE-4 (TaskModal dynamic) - can run with Group B
- OPT-RERENDER-2 (modal context) - after OPT-BUNDLE-4

**Group D (Final):**
- OPT-RERENDER-1 (single-pass filter) - after Group C
- OPT-RENDER-1 (content-visibility) - independent

---

## Risk Assessment Summary

| Optimization | Risk | Mitigation |
|--------------|------|------------|
| OPT-BUNDLE-1 | LOW | Config-only change |
| OPT-BUNDLE-2 | MEDIUM | Visual testing, animation comparison |
| OPT-BUNDLE-3 | LOW | Loading state handles delay |
| OPT-BUNDLE-4 | MEDIUM | Test modal coordination |
| OPT-RERENDER-1 | LOW | Logic equivalence |
| OPT-RERENDER-2 | MEDIUM | Context integration testing |
| OPT-RERENDER-3 | LOW | Pure function extraction |
| OPT-RERENDER-4 | LOW | Logic equivalence |
| OPT-SERVER-1 | LOW | React.cache is stable |
| OPT-RENDER-1 | LOW | CSS-only, graceful degradation |

---

## Estimated Impact

| Category | Metric | Expected Improvement |
|----------|--------|---------------------|
| Bundle Size | Initial JS | -80KB to -120KB |
| Bundle Size | lucide-react | -200KB (tree-shaking) |
| Cold Start | TTI | -200ms to -400ms |
| Re-renders | Filter change | 50% fewer renders |
| Server | Request dedup | Eliminates duplicate fetches |

---

## Security Considerations

- No changes to authentication flow
- RLS policies unchanged
- No new API endpoints
- All changes are client-side optimization or caching

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)

**Next Step:**
Design complete. Do you approve to proceed to task planning? [yes/no]
