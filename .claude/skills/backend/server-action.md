# Skill: Create Server Action

> Create Server Actions for GenHub CRUD operations with proper patterns.

## When to Use

- Need to expose database operations to the frontend
- User says: "create action", "add API", "fetch data", "save data"
- Design doc specifies Server Actions

## Prerequisites

- Table exists in database
- Types regenerated in `types/database.types.ts`
- Understanding of the data flow

## Type Imports

**IMPORTANT**: Use domain-specific type files (NOT `types/database.types.ts`):
- `types/db/task.ts` - Task types (TaskRow, TaskStatus, TaskWithAssignees...)
- `types/db/expense.ts` - Expense types (ExpenseRow, ExpenseWithRelations...)
- `types/db/spatial.ts` - Spatial/3D types
- `types/db/chat.ts` - Chat types
- `types/db/enums.ts` - All enum types (small, ~100 lines)
- `types/db/tables/{table}.ts` - Individual table Row types

## Schema Documentation

For understanding tables and schema:
- **Quick lookup**: `.claude/docs/indexes/tables.md`
- **Core tables**: `.claude/docs/backend/SCHEMA_CORE.md`
- **Enums**: `.claude/docs/backend/SCHEMA_ENUMS.md`
- **Spatial tables**: `.claude/docs/backend/SCHEMA_SPATIAL.md`

---

## Quick Reference

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
// IMPORTANT: Import from domain-specific files (NOT database.types.ts)
import type { TaskRow, TaskStatus } from '@/types/db/task';
// OR from table directly:
import type { TasksRow } from '@/types/db/tables/tasks';

// Validation schema
const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... other fields
});

// Helper: Get user context
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    return { error: 'No active company' };
  }

  return { userId: session.user.id, companyId: companyUser.company_id, role: companyUser.role, supabase };
}

// CREATE
export async function createEntity(input: z.infer<typeof createEntitySchema>) {
  const validation = createEntitySchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entity_name')
    .insert({ ...validation.data, company_id: ctx.companyId })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/app/entities');
  return { data };
}

// READ (list)
export async function getEntities() {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entity_name')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

// READ (single)
export async function getEntityById(id: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entity_name')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

// UPDATE
export async function updateEntity(id: string, input: Partial<EntityInsert>) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('entity_name')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/app/entities');
  return { data };
}

// DELETE
export async function deleteEntity(id: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { error } = await ctx.supabase
    .from('entity_name')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/app/entities');
  return { success: true };
}
```

---

## Step-by-Step

### 1. Create File

Location: `app/actions/{entity}.ts`

Start with:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';
```

### 2. Define Types

Extract types from database:
```typescript
type Entity = Database['public']['Tables']['table_name']['Row'];
type EntityInsert = Database['public']['Tables']['table_name']['Insert'];
type EntityUpdate = Database['public']['Tables']['table_name']['Update'];

// For enums
type EntityStatus = Database['public']['Enums']['entity_status'];
```

### 3. Create Validation Schemas

Use Zod for input validation:
```typescript
const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  amount: z.number().min(0).optional(),
  date: z.string().datetime().optional(),
  project_id: z.string().uuid('Invalid project ID'),
});

const updateEntitySchema = createEntitySchema.partial().extend({
  id: z.string().uuid('Invalid ID'),
});
```

### 4. Create User Context Helper

Standard pattern for all actions:
```typescript
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

### 5. Implement CRUD Operations

Follow the patterns in Quick Reference above.

### 6. Add Revalidation

After mutations, revalidate affected paths:
```typescript
revalidatePath('/app/entities');           // List page
revalidatePath(`/app/entities/${id}`);     // Detail page
revalidatePath('/app/projects/[id]');      // Parent page if nested
```

---

## Examples

### Example 1: Project-Scoped Action

```typescript
export async function getProjectTasks(projectId: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Verify project access
  const { data: project } = await ctx.supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('company_id', ctx.companyId)
    .single();

  if (!project) {
    return { error: 'Project not found or access denied' };
  }

  const { data, error } = await ctx.supabase
    .from('tasks')
    .select(`
      *,
      assignee:user_profiles!tasks_assignee_id_fkey(id, display_name, avatar_url),
      phase:project_phases(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
```

### Example 2: Action with Related Data

```typescript
export async function createTaskWithMaterials(
  taskData: z.infer<typeof createTaskSchema>,
  materials: { material_id: string; quantity: number }[]
) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Start with task creation
  const { data: task, error: taskError } = await ctx.supabase
    .from('tasks')
    .insert({ ...taskData, company_id: ctx.companyId })
    .select()
    .single();

  if (taskError) return { error: taskError.message };

  // Add material assignments if provided
  if (materials.length > 0) {
    const assignments = materials.map(m => ({
      task_id: task.id,
      material_id: m.material_id,
      quantity_needed: m.quantity,
      company_id: ctx.companyId,
    }));

    const { error: matError } = await ctx.supabase
      .from('material_assignments')
      .insert(assignments);

    if (matError) {
      // Note: In production, consider transaction rollback
      console.error('Failed to add materials:', matError);
    }
  }

  revalidatePath('/app/tasks');
  return { data: task };
}
```

### Example 3: Bulk Operations

```typescript
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: TaskStatus
) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { data, error } = await ctx.supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', taskIds)
    .select();

  if (error) return { error: error.message };

  revalidatePath('/app/tasks');
  return { data, count: data.length };
}
```

---

## Anti-Patterns

- **Never** import Supabase client in client components
- **Never** skip validation - always use Zod schemas
- **Never** trust client-provided `company_id` - always get from session
- **Never** expose raw database errors - wrap in user-friendly messages
- **Never** forget `revalidatePath` after mutations
- **Never** use `createAdminClient` unless pre-auth (webhooks)

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/indexes/actions.md` | Add new action signatures |
| Related domain docs | Update if significant feature |

---

## Checklist

- [ ] File starts with `'use server'`
- [ ] Imports from `@/utils/supabase/server` (not client)
- [ ] Types imported from `@/types/database.types`
- [ ] Zod schema validates all inputs
- [ ] `getUserContext()` helper used for auth
- [ ] Company ID from session, not from client
- [ ] Proper error handling with user-friendly messages
- [ ] `revalidatePath` called after mutations
- [ ] Return type is `{ data }` or `{ error }`
