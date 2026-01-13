---
name: nextjs-patterns
description: GenHub-specific Next.js backend conventions with security-first patterns. Use when
  creating Server Actions, working with Supabase queries, or ensuring consistency with project
  standards. Covers getUserContext pattern, company isolation (multi-tenancy security),
  input validation, secure error handling, return types, query conventions, revalidation.
---

# Skill: Next.js Backend Patterns

> Security-first GenHub conventions for Next.js backend work.

## When to Use

- Starting new Server Action file
- Reviewing backend code for security/consistency
- Troubleshooting common patterns
- Onboarding to GenHub backend conventions

## Prerequisites

- Familiarity with `backend/server-action.md` for CRUD patterns
- Understanding of Supabase client usage

---

## Security Principles

### 1. Never Trust Client Input

- Always validate with Zod BEFORE any database operation
- Never use client-provided `company_id` - derive from session
- Sanitize all string inputs (trim, limit length)

### 2. Multi-Tenancy Isolation (CRITICAL)

- EVERY query MUST filter by `company_id`
- Verify resource ownership before operations
- RLS is defense-in-depth, not primary protection

### 3. Principle of Least Privilege

- Use `createClient()` not `createAdminClient()` unless pre-auth
- Request only needed columns in SELECT
- Limit query results with pagination

### 4. Secure Error Handling

- Never expose raw database errors to clients
- Log full errors server-side, return generic messages
- Never leak schema/table names in errors

---

## Quick Reference

### getUserContext() Template

```typescript
// SECURITY: Always use this pattern - never skip auth verification
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // SECURITY: Verify user has active company membership
  const { data: companyUser, error } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle(); // Use maybeSingle for optional lookup

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

// Usage with type narrowing
const ctx = await getUserContext();
if ('error' in ctx) return ctx; // Early return on error
const { userId, companyId, role, supabase } = ctx;
```

### Input Validation Template

```typescript
// SECURITY: Always validate before any operation
const createEntitySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .transform(s => s.trim()), // Sanitize
  project_id: z.string().uuid('Invalid project ID'), // Validate UUIDs
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Usage
const validation = createEntitySchema.safeParse(input);
if (!validation.success) {
  return { error: validation.error.errors[0].message };
}
```

### Secure Query Pattern

```typescript
// SECURITY: Always filter by company_id, select only needed columns
const { data, error } = await supabase
  .from('projects')
  .select('id, name, status, budget') // Never SELECT *
  .eq('company_id', companyId) // ALWAYS filter by company
  .order('created_at', { ascending: false });

if (error) {
  console.error('[getProjects] Error:', error); // Log full error
  return { error: 'Failed to fetch projects' }; // Return safe message
}
return { data };
```

### Access Verification Helper

```typescript
// SECURITY: Verify ownership before any mutation
async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string
) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return { error: 'Project not found' };
  }

  // SECURITY: Verify company ownership
  if (project.company_id !== companyId) {
    return { error: 'Access denied' }; // Don't reveal why
  }

  return { project };
}
```

---

## Patterns

### 1. getUserContext() - The Universal Helper

Every Server Action MUST start with authentication and company context:

```typescript
'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

async function getUserContext() {
  // 1. Verify NextAuth session
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // 2. Create Supabase client (service role)
  const supabase = await createClient();

  // 3. Get user's active company membership
  const { data: companyUser, error } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !companyUser) {
    return { error: 'No active company found for user' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}
```

**Type Narrowing Pattern:**

```typescript
const ctx = await getUserContext();
if ('error' in ctx) {
  return ctx; // TypeScript narrows to { error: string }
}
// Now ctx is { userId, companyId, role, supabase }
const { userId, companyId, supabase } = ctx;
```

### 2. Company Isolation (Multi-Tenancy Security)

**WHY:** GenHub is multi-tenant. Without company isolation, users could access other companies' data.

**Rule:** EVERY query MUST include `.eq('company_id', companyId)`:

```typescript
// CORRECT: Always filter by company
const { data } = await supabase
  .from('tasks')
  .select('id, title, status')
  .eq('company_id', companyId)
  .eq('project_id', projectId);

// WRONG: Missing company filter - security vulnerability!
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId); // Could access other companies' tasks!
```

**For nested resources, verify ownership chain:**

```typescript
// Before accessing a task, verify project belongs to company
const access = await verifyProjectAccess(supabase, projectId, companyId);
if ('error' in access) return access;

// Now safe to query tasks within verified project
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title')
  .eq('project_id', projectId);
```

### 3. Input Validation Best Practices

**Always validate with Zod before any database operation:**

```typescript
import { z } from 'zod';

const createTaskSchema = z.object({
  // String validation with sanitization
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title too long')
    .transform(s => s.trim()),

  // UUID validation for all IDs
  project_id: z.string().uuid('Invalid project ID'),
  phase_id: z.string().uuid('Invalid phase ID').optional().nullable(),

  // Enum validation
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),

  // Optional fields
  description: z.string().max(5000).optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),

  // Numeric validation
  planned_cost: z.number().min(0).max(999999999).optional().nullable(),
});

// Cross-field validation
const taskSchemaWithRefinement = createTaskSchema.refine(
  (data) => {
    if (data.start_date && data.due_date) {
      return data.start_date <= data.due_date;
    }
    return true;
  },
  { message: 'Start date must be before due date', path: ['start_date'] }
);
```

### 4. Return Type Conventions

**Standard return patterns:**

```typescript
// Pattern 1: { data?, error? } - Most common
export async function getProject(id: string): Promise<{
  data?: Project;
  error?: string;
}> {
  // ...
}

// Pattern 2: { success, data?, error? } - For mutations
export async function deleteTask(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // ...
  return { success: true };
}
```

**Type narrowing in consumers:**

```typescript
const result = await getProject(id);
if (result.error) {
  showError(result.error);
  return;
}
// TypeScript knows result.data exists
const project = result.data;
```

### 5. Supabase Query Conventions

**`.single()` vs `.maybeSingle()`:**

```typescript
// Use .single() when row MUST exist (throws if not found)
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();

// Use .maybeSingle() for optional lookups (returns null if not found)
const { data, error } = await supabase
  .from('company_users')
  .select('company_id')
  .eq('user_id', userId)
  .eq('status', 'active')
  .maybeSingle();
```

**Nested selects with type casting:**

```typescript
const { data: task } = await supabase
  .from('tasks')
  .select(`
    id,
    title,
    project:projects!inner (
      id,
      name,
      company_id
    )
  `)
  .eq('id', taskId)
  .single();

// Type cast for nested relations
const project = task.project as unknown as { id: string; name: string; company_id: string };
```

**Column selection (never SELECT *):**

```typescript
// CORRECT: Select only needed columns
.select('id, name, status, created_at')

// WRONG: Exposes unnecessary data
.select('*')
```

### 6. Secure Error Handling

**Log full errors, return safe messages:**

```typescript
export async function createTask(input: CreateTaskInput) {
  try {
    const ctx = await getUserContext();
    if ('error' in ctx) return ctx;

    const { data, error } = await ctx.supabase
      .from('tasks')
      .insert({ ...input, company_id: ctx.companyId })
      .select()
      .single();

    if (error) {
      // Log full error for debugging (server-side only)
      console.error('[createTask] Database error:', error);

      // Return safe message (no schema/table info)
      return { error: 'Failed to create task' };
    }

    revalidatePath('/app/tasks');
    return { data };
  } catch (error) {
    console.error('[createTask] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

**Logging convention:**

```typescript
console.error('[ACTION_NAME] Error type:', error);
// Examples:
console.error('[createTask] Insert error:', error);
console.error('[updateProject] Validation failed:', error);
console.error('[deleteExpense] Permission denied for user:', userId);
```

### 7. Revalidation Rules

**After mutations, revalidate affected paths:**

```typescript
// After creating/updating/deleting
revalidatePath('/app/projects');              // List page
revalidatePath(`/app/projects/${projectId}`); // Detail page
revalidatePath('/app/dashboard');             // If affects dashboard

// For cached data with tags
revalidateTag('dashboard');
revalidateTag('project-stats');
```

### 8. Access Verification Helpers

**Create reusable verification helpers:**

```typescript
async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  companyId: string
) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      id,
      project:projects!inner (
        id,
        company_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (error || !task) {
    return { error: 'Task not found' };
  }

  const project = task.project as unknown as { id: string; company_id: string };

  if (project.company_id !== companyId) {
    return { error: 'Access denied' };
  }

  return { task };
}

// Usage: verify first, then operate
const access = await verifyTaskAccess(supabase, taskId, companyId);
if ('error' in access) return access;

// Now safe to mutate
await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
```

---

## Decision Matrix

| Scenario | Pattern to Use |
|----------|----------------|
| Optional lookup | `.maybeSingle()` |
| Expect exactly one row | `.single()` |
| After any mutation | `revalidatePath()` |
| Dashboard/cached data | `revalidateTag()` |
| Cross-table type | `as unknown as Type` |
| Any user input | Zod validate first |
| Before mutation | Verify ownership first |
| String input | Trim + max length |
| ID from client | Validate as UUID |

---

## Security Anti-Patterns (NEVER DO)

```typescript
// NEVER: Trust client-provided company_id
export async function getProjects(companyId: string) { // WRONG!
  // ...
}
// CORRECT: Derive from session
export async function getProjects() {
  const ctx = await getUserContext();
  // Use ctx.companyId
}

// NEVER: Skip input validation
const { data } = await supabase.from('tasks').insert(input); // WRONG!
// CORRECT: Always validate
const validated = schema.parse(input);
const { data } = await supabase.from('tasks').insert(validated);

// NEVER: Use .single() for optional lookups
.eq('user_id', userId).single(); // Crashes if not found!
// CORRECT: Use .maybeSingle() for optional
.eq('user_id', userId).maybeSingle();

// NEVER: Expose raw database errors
return { error: error.message }; // Leaks schema info!
// CORRECT: Return safe message
console.error('[action] Error:', error);
return { error: 'Operation failed' };

// NEVER: Use createAdminClient() in regular actions
import { createAdminClient } from '@/utils/supabase/server'; // Only for webhooks/pre-auth!
// CORRECT: Use createClient()
import { createClient } from '@/utils/supabase/server';

// NEVER: SELECT *
.select('*'); // Exposes unnecessary columns
// CORRECT: Select only needed columns
.select('id, name, status');

// NEVER: Import Supabase in client components
'use client';
import { createClient } from '@/utils/supabase/client'; // Build error!
// CORRECT: Use Server Actions from client components

// NEVER: Trust RLS alone without app-level checks
// RLS is defense-in-depth, not sole protection
// CORRECT: Always verify ownership in Server Actions
```

---

## General Anti-Patterns

```typescript
// NEVER: Skip revalidation after mutations
await supabase.from('tasks').update({ status }).eq('id', taskId);
return { success: true }; // Forgot revalidatePath!
// CORRECT: Always revalidate
revalidatePath('/app/tasks');
return { success: true };

// NEVER: Inconsistent return types
return data; // Wrong - should be { data }
return { success: true, data }; // Mixing patterns
// CORRECT: Pick one pattern per action
return { data };
// OR
return { success: true };

// NEVER: Missing logging context
console.error('Error:', error); // No context!
// CORRECT: Include action name
console.error('[updateTask] Error:', error);
```

---

## Security Checklist

- [ ] All inputs validated with Zod before database operations
- [ ] Company ID derived from session, never from client input
- [ ] Resource ownership verified before mutations (verifyXAccess)
- [ ] Error messages are user-safe (no schema/table leaks)
- [ ] Using `createClient()` not `createAdminClient()`
- [ ] No SELECT * - only needed columns selected
- [ ] UUIDs validated with `z.string().uuid()`
- [ ] String inputs sanitized (trim, max length)

---

## General Checklist

- [ ] `'use server'` at top of file
- [ ] `getUserContext()` helper used for auth
- [ ] Return type consistent (`{ data?, error? }`)
- [ ] `revalidatePath()` called after mutations
- [ ] Logging with action context `[ACTION_NAME]`
- [ ] Types imported from `@/types/db/{domain}` (NOT database.types.ts)
