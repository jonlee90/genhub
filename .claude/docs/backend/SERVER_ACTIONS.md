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

## See Also

- Core rules: `core/RULES.md`
- Database schema: `docs/law/DB_SCHEMA.md`
- Skill reference: `skills/backend/server-action.md`
