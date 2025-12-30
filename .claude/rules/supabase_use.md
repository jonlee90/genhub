---
description: Guidelines for writing Next.js apps with Supabase Auth
globs: "**/*.ts, **/*.tsx, **/*.js, **/*.jsx"
---

# Next.js app with Supabase

## DATABASE ACCESS — HARD RULE

For ANY database-related operation (including schema design, migrations, queries, inserts, updates, deletes, row-level security, policies, auth-linked data, relationships, or performance optimization):

✅ ALWAYS use the MCP Supabase integration:
→ `/mcp supabase`

---

## Supabase Client Architecture

### Available Clients

| Client | File | Purpose | RLS |
|--------|------|---------|-----|
| `createClient()` | server.ts | Server Actions, API routes | Bypassed |
| `createAdminClient()` | server.ts | Pre-auth operations, system tasks | Bypassed |
| `createUserClient()` | server.ts | User-scoped server operations | Bypassed (TODO: true RLS) |
| `createSupabaseClient()` | client.ts | Server-side with auth session | Bypassed |

### ⚠️ CRITICAL: Client Components

**DO NOT import any Supabase client in client components (`'use client'`).**

The `client.ts` file imports `auth` from `lib/auth`, which imports `nodemailer` (a server-only module). Using it in client components causes build errors:

```
Module not found: Can't resolve 'child_process'
Module not found: Can't resolve 'dns'
Module not found: Can't resolve 'fs'
Module not found: Can't resolve 'net'
```

### Correct Architecture for Client Components

**Pattern 1: Server Component fetches data, passes as props**
```tsx
// app/app/expenses/page.tsx (Server Component)
import { createClient } from '@/utils/supabase/server';

async function getExpensesData() {
  const supabase = await createClient();
  const { data: expenses } = await supabase.from('expenses').select('*');
  const { data: tasks } = await supabase.from('tasks').select('id, title, project_id');
  return { expenses, tasks };
}

export default async function ExpensesPage() {
  const { expenses, tasks } = await getExpensesData();

  // Pass data to client component as props
  return <ExpensesList expenses={expenses} tasks={tasks} />;
}
```

```tsx
// components/expenses/ExpensesList.tsx (Client Component)
'use client';

interface ExpensesListProps {
  expenses: Expense[];
  tasks: Task[];  // Tasks passed as props, NOT fetched client-side
}

export function ExpensesList({ expenses, tasks }: ExpensesListProps) {
  // Filter tasks client-side instead of fetching
  const filteredTasks = tasks.filter(t => t.project_id === selectedProject);

  return (/* ... */);
}
```

**Pattern 2: Server Actions for mutations**
```tsx
// app/actions/expenses.ts (Server Action)
'use server';

import { createClient } from '@/utils/supabase/server';

export async function createExpense(data: CreateExpenseInput) {
  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert(data)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/app/expenses');
  return { success: true, expense };
}
```

```tsx
// components/expenses/CreateExpenseModal.tsx (Client Component)
'use client';

import { createExpense } from '@/app/actions/expenses';

export function CreateExpenseModal({ tasks, onClose }) {
  const handleSubmit = async () => {
    const result = await createExpense({ /* data */ });
    if (result.success) onClose();
  };

  return (/* ... */);
}
```

---

## Server Client Implementation

The `/utils/supabase/server.ts` file provides multiple client functions:

```typescript
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'

/**
 * Create admin Supabase client with service role key (BYPASSES RLS)
 * Only use for operations that REQUIRE admin privileges.
 */
function createAdminClient() {
  return supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

/**
 * Create user-scoped Supabase client
 * Requires authenticated user, redirects to / if not authenticated.
 */
async function createUserClient() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }
  return createAdminClient()
}

// Alias for backwards compatibility
const createClient = async () => createUserClient()

export {
  createClient,
  createAdminClient,
  createUserClient
}
```

### Usage Examples

**Server Action:**
```typescript
import { createClient } from '@/utils/supabase/server';

export async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}
```

**Admin Operation (pre-auth, webhooks):**
```typescript
import { createAdminClient } from '@/utils/supabase/server';

// In Stripe webhook handler
const supabaseAdmin = createAdminClient();
await supabaseAdmin.from('stripe_customers').upsert({
  user_id: userId,
  stripe_customer_id: customerId,
});
```

---

## Summary

| Component Type | Data Fetching | Mutations |
|---------------|---------------|-----------|
| Server Component | Import from `server.ts` | N/A |
| Client Component | Props from parent | Server Actions |
| API Route | Import from `server.ts` | Import from `server.ts` |
| Webhook | `createAdminClient()` | `createAdminClient()` |

**Never import `client.ts` or any Supabase client in client components.**
