# Skill: Auth Verification

> Authentication and authorization patterns for GenHub

## When to Use

- Server Actions requiring auth
- API routes with protected endpoints
- Role-based access control
- Company/project scoped operations

## Prerequisites

- Understand NextAuth session
- Know GenHub role hierarchy

---

## Quick Reference

### Basic Auth Check
```typescript
'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function getMyProjects() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // User is authenticated
  const userId = session.user.id
  // ...
}
```

### Auth Check Without Redirect
```typescript
export async function createTask(input: CreateTaskInput) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Authentication required' }
  }

  // Proceed with authenticated user
}
```

### With Centralized User Context (Recommended)
```typescript
import { getUserContext } from '@/lib/auth/user-context'

export async function getProjects() {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('*')
    .eq('company_id', ctx.companyId) // Explicit company isolation

  if (error) return { error: error.message }
  return { data }
}
```

---

## Three-Level Permission Pattern

GenHub uses a **3-level permission verification strategy** for secure data access:

### Level 1: User Context (Authentication)
```typescript
import { getUserContext } from '@/lib/auth/user-context'

const ctx = await getUserContext()
if ('error' in ctx) return ctx
// Now have: userId, companyId, role, supabase
```

**Purpose:** Verify user is authenticated and has an active company membership.

### Level 2: Resource Ownership (Authorization)
```typescript
import { verifyProjectAccess } from '@/lib/auth/user-context'

const verification = await verifyProjectAccess(ctx.supabase, projectId, ctx.companyId)
if ('error' in verification) return verification
// User's company owns this resource
```

**Purpose:** Verify the resource (project, task, etc.) belongs to user's company.

### Level 3: Role-Based Access Control (RBAC)
```typescript
if (ctx.role !== 'admin' && ctx.role !== 'project_manager') {
  return { error: 'Insufficient permissions' }
}
// User has required role
```

**Purpose:** Verify user has appropriate role for the operation.

---

## Role-Based Access

### GenHub Role Hierarchy
```
gc_admin         → Full company access
project_manager  → Project-level access
field_worker     → Task-level access (assigned only)
subcontractor    → Limited to assigned work
client           → Read-only project view
viewer           → Read-only
```

### Role-Based Permission Checks

Use `getUserContext()` which automatically includes the user's role:

```typescript
import { getUserContext, getAdminUserContext } from '@/lib/auth/user-context'

// Standard: Get user context with role
const ctx = await getUserContext()
if ('error' in ctx) return ctx

// Check role inline
if (ctx.role === 'admin') {
  // Admin-only operation
}

if (ctx.role === 'admin' || ctx.role === 'project_manager') {
  // Management operations
}

// Admin-only shortcut: Use getAdminUserContext
const adminCtx = await getAdminUserContext()
if ('error' in adminCtx) return adminCtx
// adminCtx.role is typed as 'admin' (guaranteed)
```

### Complete Example: 3-Level Verification
```typescript
import { getUserContext, verifyProjectAccess } from '@/lib/auth/user-context'

export async function deleteProject(projectId: string) {
  // Level 1: User Context
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  // Level 2: Resource Ownership
  const verification = await verifyProjectAccess(ctx.supabase, projectId, ctx.companyId)
  if ('error' in verification) return verification

  // Level 3: Role-Based Access
  if (ctx.role !== 'admin') {
    return { error: 'Only administrators can delete projects' }
  }

  // All checks passed - proceed with deletion
  const { error } = await ctx.supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: 'Failed to delete project' }

  revalidatePath('/app/projects')
  return { success: true }
}
```

---

## Resource Authorization

### Resource Access Verification

Use centralized verification helpers from `@/lib/auth/user-context`:

```typescript
import { getUserContext, verifyProjectAccess } from '@/lib/auth/user-context'

export async function updateProject(projectId: string, input: UpdateInput) {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  // Verify project ownership
  const verification = await verifyProjectAccess(ctx.supabase, projectId, ctx.companyId)
  if ('error' in verification) return verification

  // Proceed with update
  const { data, error } = await ctx.supabase
    .from('projects')
    .update(input)
    .eq('id', projectId)
    .select()
    .single()

  if (error) return { error: 'Failed to update project' }
  return { data }
}
```

### Custom Access Verification Helpers

Create domain-specific verification helpers when needed:

```typescript
import { getUserContext } from '@/lib/auth/user-context'
import { createClient } from '@/utils/supabase/server'

/**
 * Verify user has access to a task via company ownership
 */
async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  companyId: string
): Promise<{ error: string } | { task: { id: string; project_id: string } }> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      id,
      project_id,
      project:projects!inner(company_id)
    `)
    .eq('id', taskId)
    .single()

  if (error || !task) {
    return { error: 'Task not found' }
  }

  const project = task.project as unknown as { company_id: string }
  if (project.company_id !== companyId) {
    return { error: 'Access denied' }
  }

  return { task: { id: task.id, project_id: task.project_id } }
}

// Usage
export async function updateTask(taskId: string, input: UpdateInput) {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  const verification = await verifyTaskAccess(ctx.supabase, taskId, ctx.companyId)
  if ('error' in verification) return verification

  // Proceed with update...
}
```

---

## API Route Auth

### Protected API Route
```typescript
// app/api/projects/route.ts
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Authenticated - proceed
}
```

### Admin-Only Route
```typescript
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isGcAdmin(session.user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin operation
}
```

### Webhook Auth (External Services)
```typescript
// app/api/webhook/stripe/route.ts
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  // Verify webhook signature (not user auth)
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      await request.text(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    // Process event with admin client
    const supabase = createAdminClient()
    // ...
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
```

---

## Common Patterns

### Require Auth Wrapper
```typescript
// lib/auth/require-auth.ts
import { auth } from '@/lib/auth'

type AuthenticatedHandler<T, R> = (
  session: Session,
  input: T
) => Promise<R>

export function requireAuth<T, R>(
  handler: AuthenticatedHandler<T, R>
) {
  return async (input: T): Promise<R | { error: string }> => {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Authentication required' }
    }
    return handler(session, input)
  }
}

// Usage
export const createTask = requireAuth(async (session, input: CreateTaskInput) => {
  // session.user is guaranteed to exist
  const supabase = await createClient()
  // ...
})
```

### Role Guard Wrapper
```typescript
export function requireRole<T, R>(
  roles: string[],
  handler: AuthenticatedHandler<T, R>
) {
  return async (input: T): Promise<R | { error: string }> => {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Authentication required' }
    }

    const userRole = await getUserRole(session.user.id)
    if (!userRole || !roles.includes(userRole)) {
      return { error: 'Insufficient permissions' }
    }

    return handler(session, input)
  }
}

// Usage
export const deleteProject = requireRole(
  ['gc_admin'],
  async (session, projectId: string) => {
    // Only gc_admin can reach here
  }
)
```

---

## Anti-Patterns

```typescript
// WRONG: Trusting client-provided user ID
export async function getUser(userId: string) {
  // Anyone can query any user!
}

// CORRECT: Use session user ID
export async function getMyProfile() {
  const session = await auth()
  const userId = session?.user?.id  // Server-verified
}

// WRONG: Auth check in client component
'use client'
const session = useSession()
if (session) {
  // This runs client-side, can be bypassed!
}

// CORRECT: Auth check in Server Action/Route
'use server'
const session = await auth()

// WRONG: Skipping RLS by using admin client everywhere
const supabase = createAdminClient()  // Bypasses all security!

// CORRECT: Use regular client, rely on RLS
const supabase = await createClient()

// WRONG: Only checking auth, not authorization
if (session) {
  await deleteProject(anyProjectId)  // User might not own this project!
}
```

---

## Session Data

### Available Session Fields
```typescript
const session = await auth()

session?.user?.id        // UUID
session?.user?.email     // Email address
session?.user?.name      // Display name
session?.user?.image     // Avatar URL
session?.supabaseAccessToken  // For realtime (if enabled)
```

### Getting Company Context

Use `getUserContext()` which includes company info:

```typescript
import { getUserContext } from '@/lib/auth/user-context'

export async function getCompanyInfo() {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  // ctx already has companyId, fetch additional company details if needed
  const { data: company, error } = await ctx.supabase
    .from('companies')
    .select('*')
    .eq('id', ctx.companyId)
    .single()

  if (error) return { error: 'Company not found' }
  return { data: company }
}
```

---

## Affected Documentation

Auth patterns should be:
- Consistent across all protected endpoints
- Documented in SYSTEM.md auth flow section

---

## Checklist

- [ ] Auth check at start of Server Action/Route
- [ ] Using session user ID (not client-provided)
- [ ] Role check for admin operations
- [ ] Resource authorization for scoped operations
- [ ] Regular client (not admin) for user operations
- [ ] RLS policies backing up server checks
- [ ] Appropriate error messages (401 vs 403)
