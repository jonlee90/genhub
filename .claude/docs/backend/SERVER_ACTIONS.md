# GenHub - Server Actions

> Patterns for Server Actions, authentication, and data flow.

---

## Authentication Flow

```
User → Middleware → NextAuth (Google/Magic Link)
     → SupabaseAdapter (stores in next_auth schema)
     → user_profiles + company_users (public schema)
```

---

## User Context Pattern

Standard helper for all Server Actions:

```typescript
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser, error } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (error || !companyUser) {
    return { error: 'No active company found' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}
```

---

## Server Action Template

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
// Use domain-specific types (NOT database.types.ts)
import type { TaskRow, TaskStatus } from '@/types/db/task';
// OR from table directly:
import type { TasksRow } from '@/types/db/tables/tasks';

// 1. Validation Schema
const createEntitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  project_id: z.string().uuid('Invalid project ID'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// 2. Server Action
export async function createEntity(input: z.infer<typeof createEntitySchema>) {
  // Get user context
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Validate input
  const validation = createEntitySchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Verify company ownership
  const { data: project } = await ctx.supabase
    .from('projects')
    .select('company_id')
    .eq('id', validation.data.project_id)
    .single();

  if (project?.company_id !== ctx.companyId) {
    return { error: 'Insufficient permissions' };
  }

  // Execute
  const { data, error } = await ctx.supabase
    .from('entities')
    .insert({
      ...validation.data,
      company_id: ctx.companyId,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Create entity error:', error);
    return { error: 'Failed to create entity' };
  }

  // Revalidate cache
  revalidatePath('/app/entities');
  return { data };
}
```

---

## CRUD Patterns

### Read (List)
```typescript
export async function getEntities() {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entities')
    .select('*')
    .eq('company_id', ctx.companyId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
```

### Read (Single)
```typescript
export async function getEntityById(id: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .single();

  if (error) return { error: error.message };
  return { data };
}
```

### Update
```typescript
export async function updateEntity(id: string, input: Partial<EntityInput>) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entities')
    .update(input)
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/app/entities');
  return { data };
}
```

### Delete
```typescript
export async function deleteEntity(id: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { error } = await ctx.supabase
    .from('entities')
    .delete()
    .eq('id', id)
    .eq('company_id', ctx.companyId);

  if (error) return { error: error.message };

  revalidatePath('/app/entities');
  return { success: true };
}
```

---

## Validation Patterns

### Basic Types
```typescript
const schema = z.object({
  // Strings
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),

  // UUIDs
  project_id: z.string().uuid('Invalid project ID'),

  // Enums
  status: z.enum(['todo', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),

  // Numbers
  amount: z.number().min(0),
  quantity: z.number().int().positive(),

  // Dates
  due_date: z.string().datetime().optional(),

  // Arrays
  tags: z.array(z.string()).optional(),
});
```

### Conditional Validation
```typescript
const schema = z.object({
  start_date: z.string().optional(),
  due_date: z.string().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.due_date) {
      return data.start_date <= data.due_date;
    }
    return true;
  },
  { message: 'Start date must be before due date' }
);
```

---

## Error Handling

```typescript
export async function action(input: Input) {
  try {
    const ctx = await getUserContext();
    if ('error' in ctx) return ctx;

    const { data, error } = await ctx.supabase
      .from('table')
      .insert(input);

    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to create record' };
    }

    return { data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

---

## Revalidation

```typescript
// Single path
revalidatePath('/app/entities');

// Dynamic path
revalidatePath(`/app/entities/${id}`);

// Multiple paths
revalidatePath('/app/entities');
revalidatePath('/app/dashboard');

// With layout
revalidatePath('/app/entities', 'layout');
```

---

## Advanced Patterns from Projects Module

### 1. FormData Processing Pattern

```typescript
export async function createProject(formData: FormData) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Convert FormData to object
  const input = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || '',
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    project_type: formData.get('project_type') as string,
    // ... more fields
  };

  // Validate with Zod
  const validation = createProjectSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors
    };
  }

  // Proceed with validated data
  const { data, error } = await ctx.supabase
    .from('projects')
    .insert(validation.data)
    .select()
    .single();

  if (error) return { error: 'Failed to create project' };

  revalidatePath('/app/projects');
  revalidatePath('/app/dashboard');
  revalidateTag('projects');

  return { success: true, data };
}
```

### 2. Multi-Level Revalidation Strategy

```typescript
// Revalidate: paths + tags for comprehensive cache clearing
revalidatePath('/app/projects');              // List page
revalidatePath(`/app/projects/${projectId}`); // Detail page
revalidateTag('projects');                    // List view data
revalidateTag(`project-${projectId}`);        // Detail view data
revalidateTag('dashboard');                   // Related aggregations
```

### 3. RPC Function Optimization

```typescript
// Instead of multiple queries:
// const { data: project } = await supabase.from('projects').select('*');
// const { data: tasks } = await supabase.from('tasks').select('*');
// const { data: stats } = await supabase.from('...').select('*');
// ... (4+ queries)

// Use RPC with server-side aggregation:
const { data } = await supabase.rpc('get_project_with_full_stats', {
  p_project_id: projectId,
  p_company_id: companyId
});

// Returns all data in 1 query with pre-computed aggregations
// ~1200ms → ~150ms (4 queries → 1 query)
```

### 4. Permission Verification Pattern (3-Level)

```typescript
export async function updateProject(projectId: string, input: UpdateInput) {
  // Level 1: User Context
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Level 2: Project Ownership
  const { data: project } = await ctx.supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (!project || project.company_id !== ctx.companyId) {
    return { error: 'Project not found or access denied' };
  }

  // Level 3: Role-Based Access
  if (ctx.role !== 'admin' && ctx.role !== 'project_manager') {
    return { error: 'Insufficient permissions' };
  }

  // Proceed with update...
}
```

### 5. Structured Error Handling with Logging

```typescript
export async function serverAction(input: Input) {
  try {
    const ctx = await getUserContext();
    if ('error' in ctx) return ctx;

    const { data, error } = await ctx.supabase
      .from('table')
      .insert(input)
      .select()
      .single();

    if (error) {
      // Development-only detailed logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Action Error]', {
          action: 'serverAction',
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }
      return { error: 'Operation failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Unexpected Error]', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

### 6. Optional Query Pattern

```typescript
// Only execute queries if data exists
const optionalQueries: Array<PromiseLike<any>> = [];

if (creatorId) {
  optionalQueries.push(
    supabase.from('user_profiles').select('*').eq('id', creatorId).single()
  );
}

if (teamUserIds.length > 0) {
  optionalQueries.push(
    supabase.from('user_profiles').select('*').in('id', teamUserIds)
  );
}

// Execute with Promise.allSettled (doesn't fail if one fails)
const optionalResults = await Promise.allSettled(optionalQueries);

// Safely extract results
const creator = optionalResults[0]?.status === 'fulfilled'
  ? optionalResults[0].value.data
  : null;
```

---

## API Routes (When Needed)

Use API routes only for:
- Webhooks (Stripe, external services)
- File uploads
- External integrations
- Long-running operations

```typescript
// app/api/webhook/stripe/route.ts
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  // Verify webhook signature...

  const supabase = createAdminClient(); // Pre-auth, no session

  // Process webhook...

  return new Response('OK', { status: 200 });
}
```

---

## Performance Best Practices from Tasks Module

### 1. React.cache() for getUserContext

**Problem:** getUserContext was called 3-5 times per page load, causing 150-750ms overhead.

**Solution:** Wrap with React.cache() to deduplicate calls within the same request.

```typescript
// lib/auth-context.ts
import { cache } from "react";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export const getUserContext = cache(async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();
  const { data: companyUser, error } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (error || !companyUser) {
    return { error: "No active company found" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
});
```

**Usage in all Server Actions:**

```typescript
// app/actions/tasks.ts
import { getUserContext } from '@/lib/auth-context';

export async function createTask(input: TaskInput) {
  const ctx = await getUserContext(); // Cached call
  if ('error' in ctx) return ctx;

  // Use ctx.userId, ctx.companyId, ctx.role, ctx.supabase
}
```

**Impact:** First call takes 100-150ms, subsequent calls return instantly (cached). Saves 100-750ms per page load.

**When to Apply:**
- Any helper function called multiple times per request
- Expensive auth/context queries
- Functions with deterministic results within request scope

---

### 2. Batch Database Operations

**Problem:** Creating notifications in a loop caused N+1 queries (500ms for 10 notifications).

**Solution:** Use `.map()` to build array, then single `.insert()`.

```typescript
// Before: N+1 pattern (slow)
for (const assigneeId of assigneeIds) {
  await supabase.from('notifications').insert({
    user_id: assigneeId,
    type: 'task_assigned',
    reference_id: taskId,
    message: `You were assigned to task: ${title}`,
  });
}
// Time: 10 assignees × 50ms = 500ms

// After: Batch insert (fast)
if (assigneeIds.length > 0) {
  const notifications = assigneeIds.map(assigneeId => ({
    user_id: assigneeId,
    type: 'task_assigned' as const,
    reference_id: taskId,
    message: `You were assigned to task: ${title}`,
    company_id: ctx.companyId,
  }));

  await supabase.from('notifications').insert(notifications);
}
// Time: 1 query = 50ms
```

**Impact:** 90% reduction (500ms → 50ms for 10 items).

**When to Apply:**
- Any loop with `await` inside
- Multiple inserts to same table
- Bulk operations (create, update, delete)

**Important:**
- Use `as const` for enum literals in arrays
- Include all required fields (company_id, etc.)
- Trade-off: Loses individual error handling

---

### 3. Parallel Async Operations with Promise.allSettled

**Problem:** Sequential awaits for independent operations wasted time (300ms total).

**Solution:** Use `Promise.allSettled()` to run in parallel.

```typescript
// Before: Sequential (slow)
await sendNotifications(taskId);    // 100ms
await logActivity(taskId);          // 50ms
await updateProjectStats(projectId); // 150ms
// Total: 100 + 50 + 150 = 300ms

// After: Parallel (fast)
const postCreationOps = await Promise.allSettled([
  sendNotifications(taskId),
  logActivity(taskId),
  updateProjectStats(projectId),
]);

// Log failures without blocking
postCreationOps.forEach((result, idx) => {
  if (result.status === 'rejected') {
    console.error(`Post-creation op ${idx} failed:`, result.reason);
  }
});
// Total: max(100, 50, 150) = 150ms
```

**Impact:** 50% reduction (300ms → 150ms).

**When to Apply:**
- Independent async operations (no data dependency)
- Post-creation/update side effects
- Non-critical operations (notifications, logging, stats)

**Use Promise.all() vs Promise.allSettled():**
- `Promise.all()`: Fails fast if any operation fails (use when all must succeed)
- `Promise.allSettled()`: Continues even if some fail (use for optional operations)

**Type Compatibility:**
If you get type errors, wrap Server Actions:

```typescript
await Promise.allSettled([
  Promise.resolve(serverAction1()),
  Promise.resolve(serverAction2()),
]);
```

---

### 4. File Organization Strategy

**Problem:** Single 2,671-line `tasks.ts` file was hard to navigate and maintain.

**Solution:** Split by domain into focused files.

```
Before:
app/actions/tasks.ts (2,671 lines, everything)

After:
app/actions/
├── tasks.ts              (800 lines, core CRUD)
├── tasks-status.ts       (300 lines, status transitions)
├── tasks-assignments.ts  (400 lines, assignee management)
├── tasks-dependencies.ts (350 lines, dependency graph)
├── tasks-activity.ts     (250 lines, activity logging)
├── tasks-spatial.ts      (200 lines, 3D markers)
├── tasks-analytics.ts    (300 lines, stats/reporting)
└── tasks-deferred.ts     (200 lines, lazy data)
```

**Organization Principles:**
1. **Core file** (`tasks.ts`): CRUD operations only
2. **Domain files** (`tasks-{domain}.ts`): Focused functionality
3. **Deferred file** (`tasks-deferred.ts`): Expensive/optional data
4. **Naming convention**: `{entity}-{domain}.ts`

**When to Split:**
- File exceeds 500-800 lines
- Multiple clear domain boundaries exist
- Team experiences frequent merge conflicts
- Actions are used by different parts of the app

**Benefits:**
- Easier navigation (find by domain)
- Fewer merge conflicts (team works in parallel)
- Better code splitting (import only needed)
- Clear separation of concerns

---

### 5. Error Handling Best Practices

**Pattern:** Always destructure `{ data, error }` and check error first.

```typescript
export async function serverAction(input: Input) {
  try {
    const ctx = await getUserContext();
    if ('error' in ctx) return ctx;

    // CRITICAL: Destructure both data and error
    const { data, error } = await ctx.supabase
      .from('table')
      .insert(input)
      .select()
      .single();

    // CRITICAL: Check error before accessing data
    if (error) {
      console.error('[serverAction] Database error:', error);
      return { error: 'Operation failed' };
    }

    // Safe to use data here
    return { success: true, data };
  } catch (error) {
    console.error('[serverAction] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

**For Deferred Actions (non-critical data):**

```typescript
export async function getDeferredData(id: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) {
    // Return safe defaults instead of error
    return { data: null, stats: { count: 0, total: 0 } };
  }

  try {
    const { data, error } = await ctx.supabase
      .rpc('expensive_query', { p_id: id });

    if (error) {
      console.error('[getDeferredData] RPC error:', error);
      // Return safe defaults, don't throw
      return { data: null, stats: { count: 0, total: 0 } };
    }

    // Type cast and null-check
    const result = data as { stats?: unknown } | null;
    const stats = result?.stats as Record<string, number> | undefined;

    return {
      data: result,
      stats: {
        count: stats?.count ?? 0,
        total: stats?.total ?? 0,
      },
    };
  } catch (error) {
    console.error('[getDeferredData] Error:', error);
    // Never throw - return safe defaults
    return { data: null, stats: { count: 0, total: 0 } };
  }
}
```

**Key Rules for Deferred Actions:**
1. Never throw errors (return safe defaults)
2. Type cast RPC responses
3. Null-check all nested data
4. Provide fallback values for all fields
5. Log errors with function name prefix
6. Match return type to component interface

---

### 6. Performance Measurement

Track action timings in development:

```typescript
export async function createTask(input: TaskInput) {
  const startTime = Date.now();

  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // ... operation logic

  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - startTime;
    console.log(`[createTask] Completed in ${duration}ms`);
  }

  return { success: true, data };
}
```

---

### Summary: Optimization Checklist

When creating or refactoring Server Actions:

**Performance:**
- [ ] Use React.cache() for repeated helpers
- [ ] Replace loops with batch operations
- [ ] Use Promise.allSettled for independent async ops
- [ ] Measure and log timings in development

**Organization:**
- [ ] Keep core CRUD in main file
- [ ] Split domain logic into separate files
- [ ] Put expensive queries in deferred files
- [ ] Use consistent naming convention

**Error Handling:**
- [ ] Always destructure { data, error }
- [ ] Check error before accessing data
- [ ] Return safe defaults for deferred actions
- [ ] Type cast and null-check RPC responses
- [ ] Log errors with function name prefix

**Type Safety:**
- [ ] Use domain types (not database.types.ts)
- [ ] Type cast unknown responses
- [ ] Use 'as const' for enum literals in arrays
- [ ] Provide proper TypeScript interfaces

---

## See Also

- Core rules: `core/RULES.md`
- Database schema: `backend/SCHEMA_CORE.md`
- Server Action skill: `skills/backend/server-action.md`
- Projects module reference: `domain/PROJECTS.md`
- Data fetching patterns: `lib/projects.ts` (Phase-based approach)
- Tasks Module migration guide: `/Users/jonathanlee/Desktop/genhub/docs/tasks-module-migration-guide.md`
- Performance report: `/Users/jonathanlee/Desktop/genhub/docs/tasks-module-performance-report.md`
