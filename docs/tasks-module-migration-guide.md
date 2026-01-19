# Tasks Module Migration Guide

## Overview

This guide documents the performance optimization patterns applied to the GenHub Tasks module. Use these patterns when refactoring other modules or maintaining the Tasks module.

**Results Summary:**
- 20-27% bundle size reduction
- 50-60% faster page load (3G)
- 67% faster task operations
- 87% fewer component re-renders
- 46-59% reduction in large component sizes
- 74% less duplicate code

---

## Pattern 1: React.cache() for getUserContext

**Problem:** Multiple Server Actions were calling `auth()` and querying `company_users` redundantly, causing 100-750ms overhead per page load.

### Before (Redundant Queries)

```typescript
// app/actions/tasks.ts (OLD)
'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    return { error: 'No active company found' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

export async function createTask(input: TaskInput) {
  const ctx = await getUserContext(); // Query 1
  // ...
}

export async function updateTask(id: string, input: TaskUpdate) {
  const ctx = await getUserContext(); // Query 2 (duplicate)
  // ...
}

export async function deleteTask(id: string) {
  const ctx = await getUserContext(); // Query 3 (duplicate)
  // ...
}
```

**Impact:** 3 actions × 50-150ms = 150-450ms wasted per page load.

### After (Cached with React.cache)

```typescript
// lib/auth-context.ts (NEW)
"use server";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * CRITICAL OPTIMIZATION (CRIT-001): Cached user context helper
 * Wrapped with React.cache to prevent redundant auth + DB queries
 * Estimated savings: 50-150ms per redundant call, 2-5 calls avoided per page load
 */
export const getUserContext = cache(async function getUserContext() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (companyError || !companyUser) {
    return { error: "No active company found for user" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
});
```

```typescript
// app/actions/tasks.ts (NEW)
'use server';

import { getUserContext } from '@/lib/auth-context'; // Import cached version

export async function createTask(input: TaskInput) {
  const ctx = await getUserContext(); // Cached call
  if ('error' in ctx) return ctx;
  // ...
}

export async function updateTask(id: string, input: TaskUpdate) {
  const ctx = await getUserContext(); // Returns cached result
  if ('error' in ctx) return ctx;
  // ...
}
```

**Impact:** First call: 100-150ms, subsequent calls: ~0ms (cached). **Total savings: 100-750ms per page load.**

### Files Modified
- **Created:** `/Users/jonathanlee/Desktop/genhub/lib/auth-context.ts`
- **Updated:**
  - `/Users/jonathanlee/Desktop/genhub/app/actions/tasks.ts`
  - `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-status.ts`
  - `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-assignments.ts`
  - `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-dependencies.ts`
  - All other task action files

### Key Takeaways
1. Use `React.cache()` for expensive functions called multiple times per request
2. Extract to separate file for reusability across modules
3. Document savings in comments for future reference
4. This pattern works for any Server Action helper (not just auth)

---

## Pattern 2: Batch Database Operations

**Problem:** Creating notifications in a loop caused N+1 queries, taking 500ms for 10 notifications.

### Before (Sequential N+1 Pattern)

```typescript
// app/actions/tasks.ts (OLD)
export async function createTask(input: TaskInput) {
  // ... create task

  // Send notifications to assignees (N+1 pattern)
  if (assigneeIds.length > 0) {
    for (const assigneeId of assigneeIds) {
      await supabase.from('notifications').insert({
        user_id: assigneeId,
        type: 'task_assigned',
        reference_id: newTask.id,
        message: `You were assigned to task: ${input.title}`,
      });
    }
  }

  return { success: true, task: newTask };
}
```

**Impact:** 10 assignees × 50ms per insert = 500ms overhead.

### After (Bulk Insert)

```typescript
// app/actions/tasks.ts (NEW)
export async function createTask(input: TaskInput) {
  // ... create task

  // Batch create notifications (single query)
  if (assigneeIds.length > 0) {
    const notifications = assigneeIds.map(assigneeId => ({
      user_id: assigneeId,
      type: 'task_assigned' as const,
      reference_id: newTask.id,
      message: `You were assigned to task: ${input.title}`,
      company_id: ctx.companyId,
    }));

    await supabase.from('notifications').insert(notifications);
  }

  return { success: true, task: newTask };
}
```

**Impact:** 10 assignees = 1 query instead of 10. **Reduction: 90% (500ms → 50ms).**

### Files Modified
- **Updated:** `/Users/jonathanlee/Desktop/genhub/app/actions/tasks.ts` (lines 250-280)

### Key Takeaways
1. Always use `.map()` + single `.insert()` instead of loops with `await`
2. Use `as const` for enum literals in batch arrays
3. This pattern applies to any bulk operation (inserts, updates, deletes)
4. Trade-off: Loses individual error handling (use transactions if needed)

---

## Pattern 3: Parallel Async Operations

**Problem:** Sequential `await` calls for independent operations wasted time.

### Before (Sequential Awaits)

```typescript
// app/actions/tasks.ts (OLD)
export async function createTask(input: TaskInput) {
  // ... create task

  // Sequential operations (300ms total)
  await sendNotifications(newTask.id); // 100ms
  await logActivity(newTask.id, 'created'); // 50ms
  await updateProjectStats(input.project_id); // 150ms

  return { success: true, task: newTask };
}
```

**Impact:** Total time = sum of all operations (300ms).

### After (Parallel with Promise.allSettled)

```typescript
// app/actions/tasks.ts (NEW)
export async function createTask(input: TaskInput) {
  // ... create task

  // Run independent operations in parallel
  const postCreationOps = await Promise.allSettled([
    sendNotifications(newTask.id),
    logActivity(newTask.id, 'created'),
    updateProjectStats(input.project_id),
  ]);

  // Log failures without blocking
  postCreationOps.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(`Post-creation op ${idx} failed:`, result.reason);
    }
  });

  return { success: true, task: newTask };
}
```

**Impact:** Total time = max(100ms, 50ms, 150ms) = 150ms. **Reduction: 50% (300ms → 150ms).**

### Files Modified
- **Updated:** `/Users/jonathanlee/Desktop/genhub/app/actions/tasks.ts` (lines 300-350)

### Key Takeaways
1. Use `Promise.allSettled()` for independent async operations
2. Use `Promise.all()` only when all must succeed (fails fast)
3. Always log failures from `allSettled` for debugging
4. Only parallelize truly independent operations (no shared state)

---

## Pattern 4: React.memo with Custom Comparison

**Problem:** `TaskCard` re-rendered ~40 times per filter change despite props not changing.

### Before (No Memoization)

```typescript
// components/tasks/TaskCard.tsx (OLD)
export function TaskCard({ task, onTaskClick, phases }: TaskCardProps) {
  // ... render logic
  return <Card>...</Card>;
}
```

**Impact:** Re-renders every time parent state changes (filters, view mode, etc.).

### After (React.memo with Custom Comparator)

```typescript
// components/tasks/TaskCard.tsx (NEW)
import React from 'react';

export const TaskCard = React.memo(function TaskCard({
  task,
  isDragging = false,
  onTaskClick,
  phases,
  showEditIndicator,
  expenseStats,
}: TaskCardProps) {
  // ... render logic
  return <Card>...</Card>;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.due_date === nextProps.task.due_date &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.showEditIndicator === nextProps.showEditIndicator &&
    // Deep compare expense stats
    prevProps.expenseStats?.count === nextProps.expenseStats?.count &&
    prevProps.expenseStats?.totalAmount === nextProps.expenseStats?.totalAmount
  );
});
```

**Impact:** ~40 re-renders → ~5 re-renders per filter change. **Reduction: 87%.**

### Files Modified
- **Updated:** `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskCard.tsx` (lines 50-100)

### Key Takeaways
1. Use `React.memo()` for components rendered in lists
2. Provide custom comparator for complex props (objects, arrays)
3. Only compare props that affect rendering
4. Extract utility functions outside component to prevent re-creation
5. Use `useMemo()` for expensive computations inside memoized components

---

## Pattern 5: Lucide Import Optimization

**Problem:** Barrel imports from `lucide-react` bundled entire icon library (~200KB).

### Before (Barrel Imports)

```typescript
// components/tasks/TaskCard.tsx (OLD)
import {
  Calendar,
  AlertTriangle,
  Ban,
  Package,
  Pencil,
} from 'lucide-react';
```

**Impact:** Entire `lucide-react` library bundled = +192KB to bundle size.

### After (Direct Icon Imports)

```typescript
// components/tasks/TaskCard.tsx (NEW)
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Ban from 'lucide-react/dist/esm/icons/ban';
import Package from 'lucide-react/dist/esm/icons/package';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
```

**Impact:** Only icons used are bundled. **Reduction: 192KB (26.7% of total bundle).**

### Files Modified
- **Updated:** All 31 task component files (see file list in performance report)

### Migration Script

```bash
# Find all barrel imports
grep -r "from 'lucide-react'" components/tasks/

# Replace with direct imports (manual or with script)
# Pattern: import { IconName } from 'lucide-react'
# Replace: import IconName from 'lucide-react/dist/esm/icons/icon-name'
```

### Key Takeaways
1. **ALWAYS** use direct imports for Lucide icons
2. Icon name to file path: `IconName` → `icon-name` (kebab-case)
3. This is a **project-wide standard** (see `.claude/docs/CLAUDE.md`)
4. Applies to all new components going forward
5. Consider migration script for other icon libraries (Heroicons, etc.)

---

## Pattern 6: Component Splitting

**Problem:** Monolithic components (1,400+ lines) were hard to maintain and bloated bundles.

### Before (Monolithic TaskDetail)

```typescript
// components/tasks/TaskDetail.tsx (OLD - 1,404 lines)
'use client';

export function TaskDetail({ task, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  // ... 50+ more state variables

  const handleUpdateDescription = async () => {
    // ... 30 lines
  };

  const handleUpdatePriority = async () => {
    // ... 30 lines
  };

  // ... 20+ more handlers

  return (
    <div>
      {/* Basic Details Section (200 lines) */}
      <div>...</div>

      {/* Approval Section (150 lines) */}
      <div>...</div>

      {/* Dependencies Section (200 lines) */}
      <div>...</div>

      {/* Materials Section (300 lines) */}
      <div>...</div>

      {/* Activity Log (250 lines) */}
      <div>...</div>
    </div>
  );
}
```

**Impact:** 1,404 lines, hard to test, lots of duplicate logic.

### After (Orchestrator + Sections)

```typescript
// components/tasks/TaskDetail.tsx (NEW - 572 lines, 59% reduction)
'use client';

import { TaskDetailsSection } from './detail/TaskDetailsSection';
import { TaskApprovalSection } from './detail/TaskApprovalSection';
import { TaskDependenciesSection } from './detail/TaskDependenciesSection';
import { TaskMaterialsSection } from './detail/TaskMaterialsSection';
import { TaskActivityLog } from './TaskActivityLog';

export function TaskDetail({ task, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('details');
  const router = useRouter();

  return (
    <div>
      {/* Header with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <TaskDetailsSection task={task} />
          <TaskApprovalSection task={task} />
          <TaskDependenciesSection task={task} />
        </TabsContent>

        <TabsContent value="materials">
          <TaskMaterialsSection taskId={task.id} />
        </TabsContent>

        <TabsContent value="activity">
          <TaskActivityLog taskId={task.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

```typescript
// components/tasks/detail/TaskDetailsSection.tsx (NEW - 200 lines)
'use client';

import { useActionWithError } from '@/hooks/useActionWithError';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { updateTask } from '@/app/actions/tasks';

export function TaskDetailsSection({ task }: { task: Task }) {
  const { execute, error, success } = useActionWithError(updateTask);

  const handleUpdate = async (field: string, value: any) => {
    await execute(task.id, { [field]: value });
  };

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {/* Details fields */}
      <Input
        value={task.title}
        onChange={(e) => handleUpdate('title', e.target.value)}
      />
      {/* ... more fields */}
    </div>
  );
}
```

**Impact:**
- TaskDetail: 1,404 → 572 lines (59% reduction)
- TaskModal: 1,499 → 808 lines (46% reduction)
- Easier to test, maintain, and code-split

### Files Created
- `/Users/jonathanlee/Desktop/genhub/components/tasks/detail/TaskDetailsSection.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/detail/TaskApprovalSection.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/detail/TaskDependenciesSection.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/detail/TaskMaterialsSection.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/modal/TaskTypeSelectionStep.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/modal/TaskFormFieldsStep.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/modal/TaskAssigneeStep.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/modal/TaskMaterialsExtrasStep.tsx`

### Key Takeaways
1. Split components at >500 lines or when multiple responsibilities detected
2. Use **Orchestrator pattern**: Parent manages layout/tabs, children handle logic
3. Use **Step pattern** for multi-step forms (wizard-style)
4. Extract sections by responsibility (details, approval, materials, etc.)
5. Pass only required props to children (not entire parent state)
6. Each section manages its own state and actions

---

## Pattern 7: Shared Error Handling

**Problem:** Every component duplicated useState/useEffect for error handling (75+ lines).

### Before (Duplicate Error Handling)

```typescript
// components/tasks/TaskCard.tsx (OLD)
export function TaskCard({ task }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleUpdate = async () => {
    setError(null);
    try {
      const result = await updateTask(task.id, data);
      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-red-700">
          {error}
        </div>
      )}
      {/* ... rest of component */}
    </div>
  );
}
```

**Impact:** 15 lines × 8 components = 120 lines of duplicate code.

### After (Shared Hook + Banner Component)

```typescript
// hooks/useActionWithError.ts (NEW)
'use client';

import { useState, useCallback } from 'react';

export function useActionWithError<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setError(null);
      setSuccess(false);
      setIsLoading(true);

      try {
        const result = await action(...args);
        if (result && 'error' in result) {
          setError(result.error);
          return result;
        }
        setSuccess(true);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [action]
  );

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(false), []);

  return { execute, error, success, isLoading, clearError, clearSuccess };
}
```

```typescript
// components/shared/ErrorBanner.tsx (NEW)
'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss}>
          <X className="w-4 h-4 text-red-600" />
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-green-700">{message}</p>
    </div>
  );
}
```

```typescript
// components/tasks/TaskCard.tsx (NEW)
import { useActionWithError } from '@/hooks/useActionWithError';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { updateTask } from '@/app/actions/tasks';

export function TaskCard({ task }: Props) {
  const { execute, error, clearError } = useActionWithError(updateTask);

  const handleUpdate = async () => {
    await execute(task.id, data);
  };

  return (
    <div>
      <ErrorBanner message={error} onDismiss={clearError} />
      {/* ... rest of component */}
    </div>
  );
}
```

**Impact:** 120 lines → 45 lines shared. **Reduction: 74% duplicate code eliminated.**

### Files Created
- `/Users/jonathanlee/Desktop/genhub/hooks/useActionWithError.ts`
- `/Users/jonathanlee/Desktop/genhub/components/shared/ErrorBanner.tsx`

### Files Modified
- All 8 task detail/modal components now use shared pattern

### Key Takeaways
1. Extract common patterns into custom hooks
2. Create reusable UI components for error/success states
3. Use TypeScript generics for type-safe wrappers
4. Provide `clearError`/`clearSuccess` callbacks for manual control
5. This pattern applies to any repeated async logic (loading, toasts, etc.)

---

## Pattern 8: Server Action Organization

**Problem:** Single 2,671-line `tasks.ts` file was hard to navigate and maintain.

### Before (Monolithic File)

```typescript
// app/actions/tasks.ts (OLD - 2,671 lines)
'use server';

// 100+ imports

// Task CRUD (500 lines)
export async function createTask() { }
export async function updateTask() { }
export async function deleteTask() { }

// Status management (300 lines)
export async function updateTaskStatus() { }
export async function completeTask() { }
export async function blockTask() { }

// Assignments (400 lines)
export async function assignTask() { }
export async function reassignTask() { }
export async function removeAssignee() { }

// Dependencies (350 lines)
export async function addDependency() { }
export async function removeDependency() { }
export async function getDependencyChain() { }

// Activity logging (250 lines)
export async function logActivity() { }
export async function getTaskActivity() { }

// Spatial markers (200 lines)
export async function attachSpatialMarker() { }
export async function updateSpatialMarker() { }

// Analytics (300 lines)
export async function getTaskStats() { }
export async function getCompletionRate() { }

// Deferred operations (200 lines)
export async function getDeferredTaskData() { }
```

**Impact:** Hard to find functions, merge conflicts frequent, long load times in IDE.

### After (Domain-Based Organization)

```
app/actions/
├── tasks.ts                 (core CRUD, 800 lines)
├── tasks-status.ts          (status transitions, 300 lines)
├── tasks-assignments.ts     (assignee management, 400 lines)
├── tasks-dependencies.ts    (dependency graph, 350 lines)
├── tasks-activity.ts        (activity logging, 250 lines)
├── tasks-spatial.ts         (3D markers, 200 lines)
├── tasks-analytics.ts       (stats/reporting, 300 lines)
└── tasks-deferred.ts        (lazy-loaded data, 200 lines)
```

```typescript
// app/actions/tasks.ts (NEW - 800 lines)
'use server';

import { getUserContext } from '@/lib/auth-context';
// Only imports for core CRUD

// Core CRUD only
export async function createTask() { }
export async function updateTask() { }
export async function deleteTask() { }
export async function getTaskById() { }
export async function getTasksByProject() { }
```

```typescript
// app/actions/tasks-status.ts (NEW - 300 lines)
'use server';

import { getUserContext } from '@/lib/auth-context';
// Only imports for status management

// Status transitions only
export async function updateTaskStatus() { }
export async function completeTask() { }
export async function blockTask() { }
export async function unblockTask() { }
```

```typescript
// Usage in components
import { createTask, updateTask } from '@/app/actions/tasks';
import { updateTaskStatus, completeTask } from '@/app/actions/tasks-status';
import { assignTask, removeAssignee } from '@/app/actions/tasks-assignments';
```

**Impact:** Easier navigation, fewer merge conflicts, better code splitting.

### Files Created
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-status.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-assignments.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-dependencies.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-activity.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-spatial.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-analytics.ts`
- `/Users/jonathanlee/Desktop/genhub/app/actions/tasks-deferred.ts`

### Organization Principles
1. **Core file** (`tasks.ts`): CRUD operations only
2. **Domain files** (`tasks-{domain}.ts`): Focused functionality
3. **Deferred file** (`tasks-deferred.ts`): Expensive/optional data
4. **Naming convention**: `{entity}-{domain}.ts`
5. **Import pattern**: Import only what you need

### Key Takeaways
1. Split files at ~500-800 lines or by clear domain boundaries
2. Keep core CRUD in main file, specialized operations in domain files
3. Use consistent naming: `{entity}-{domain}.ts`
4. Update imports in all consuming components
5. Consider code splitting benefits (lazy-load analytics, deferred data, etc.)

---

## Summary: Migration Checklist

When applying these patterns to other modules:

### Backend (Server Actions)
- [ ] Extract `getUserContext` to `lib/auth-context.ts` with `React.cache()`
- [ ] Replace N+1 patterns with batch operations (`.map()` + single `.insert()`)
- [ ] Use `Promise.allSettled()` for independent async operations
- [ ] Split large action files (>800 lines) into domain-specific files
- [ ] Create deferred actions for expensive/optional data

### Frontend (Components)
- [ ] Add `React.memo()` to list item components with custom comparators
- [ ] Replace barrel icon imports with direct imports
- [ ] Split large components (>500 lines) into orchestrator + sections
- [ ] Extract shared error handling to hooks (`useActionWithError`)
- [ ] Create reusable error/success banner components
- [ ] Use `useMemo()` for expensive computations
- [ ] Use `useCallback()` for stable event handlers

### Verification
- [ ] Run `npm run build` to verify 0 errors
- [ ] Check bundle size reduction (target: 20%+)
- [ ] Test functionality manually (no regressions)
- [ ] Measure re-renders with React DevTools
- [ ] Document patterns used in PR description

---

## See Also

- **Performance Report:** `docs/tasks-module-performance-report.md`
- **Optimization Runbook:** `docs/module-optimization-runbook.md`
- **Performance Guide:** `.claude/docs/frontend/PERFORMANCE_OPTIMIZATIONS_GUIDE.md`
- **Server Actions Guide:** `.claude/docs/backend/SERVER_ACTIONS.md`
- **Component Patterns:** `.claude/docs/frontend/COMPONENTS.md`
