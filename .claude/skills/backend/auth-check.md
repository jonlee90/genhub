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

### With Supabase Client
```typescript
import { createClient } from '@/utils/supabase/server'

export async function getProjects() {
  // createClient already handles auth - redirects if not authenticated
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
  // RLS ensures user only sees their company's projects
}
```

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

### Role Check Helper
```typescript
// lib/auth/roles.ts
import { createClient } from '@/utils/supabase/server'

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('company_users')
    .select('role')
    .eq('user_id', userId)
    .single()

  return data?.role ?? null
}

export async function isGcAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'gc_admin'
}

export async function canManageProject(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return ['gc_admin', 'project_manager'].includes(role ?? '')
}
```

### In Server Action
```typescript
export async function deleteProject(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Authentication required' }
  }

  // Check role
  const canDelete = await isGcAdmin(session.user.id)
  if (!canDelete) {
    return { error: 'Only administrators can delete projects' }
  }

  // Proceed with deletion
}
```

---

## Resource Authorization

### Project Access Check
```typescript
export async function hasProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  // RLS handles the filtering - if we get data, user has access
  return !!data
}
```

### Task Access Check
```typescript
export async function canAccessTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('id, assignee_id, project:projects(company_id)')
    .eq('id', taskId)
    .single()

  return !!data
}

export async function canEditTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data: task } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('id', taskId)
    .single()

  if (!task) return false

  // Assignee can edit
  if (task.assignee_id === userId) return true

  // Project manager can edit any task in their projects
  const canManage = await canManageProject(userId)
  return canManage
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
```typescript
export async function getCurrentCompany() {
  const session = await auth()
  if (!session?.user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('company_users')
    .select('company_id, role, company:companies(*)')
    .eq('user_id', session.user.id)
    .single()

  return data
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
