# GenHub PWA - System Architecture

> **Quick Reference** for architectural patterns. Read sections as needed.

## Core Rules

- **Auth**: NextAuth + Supabase adapter (`next_auth` schema)
- **Database**: Always use MCP Supabase (`mcp__supabase__*`)
- **Client Components**: Never import Supabase clients (causes build errors)
- **Data Flow**: Server Actions (preferred) or API routes
- **Validation**: Zod schemas for all user input
- **RLS**: Manual verification (server client bypasses RLS)

## Quick Navigation

- [Stack](#technology-stack) - Tech versions
- [Structure](#project-structure) - Folder organization
- [Auth](#authentication) - NextAuth + Supabase
- [Data Flow](#data-flow) - Server Actions pattern
- [Database](#database-access) - MCP Supabase usage
- [Security](#security) - RLS, validation, roles
- [Agents](#agent-workflow) - Which agent to use

---

## Quick Lookup by Task Type

| Working On | Read Sections | Key Info |
|------------|---------------|----------|
| **Auth Issues** | Authentication, Security | `auth()`, `getUserContext()`, role hierarchy |
| **Server Actions** | Data Flow, Error Handling | Zod validation, revalidatePath, try/catch |
| **Database Ops** | Database Access | MCP Supabase tools, client selection, RLS bypass |
| **API Routes** | Data Flow (API Routes) | Webhooks, external integrations, file uploads |
| **Client vs Server** | Database Access (Client Components) | Never import Supabase in 'use client' |
| **Roles/Permissions** | Security (Role Hierarchy) | gc_admin → client hierarchy |
| **Input Validation** | Security (Input Validation) | Zod schema patterns |
| **New Feature** | Quick Reference (New Feature Checklist) | Migration → Types → Action → Components → Pages |
| **Agent Selection** | Agent Workflow | frontend/backend/agent-code-reviewer workflows |
| **Project Layout** | Project Structure | Folder organization, file locations |
| **Environment Setup** | Environment Variables | Required env vars by service |

**Tip:** Most agents have embedded quick references - only read SYSTEM.md for complex patterns.

---

## Technology Stack

**Core**
- Next.js 15.5.9 (App Router, Server Components)
- React 19.0.0
- TypeScript 5.x
- Tailwind CSS 3.4.1

**Backend**
- Supabase (PostgreSQL + RLS + Realtime)
- NextAuth 5.0.0-beta.30
- @auth/supabase-adapter 1.7.4

**UI**
- Aceternity UI (modern components)
- Radix UI (accessible primitives)
- Lucide React (icons)
- Framer Motion (animations)

**Services**
- Stripe (payments, feature-flagged)
- Nodemailer/Resend (email)
- Vercel Blob (file storage)
- Zod (validation)
- SerpAPI (Home Depot search)
- FCM (push notifications)

---

## Project Structure

```
app/
├── app/                    # Protected routes
│   ├── layout.tsx          # App shell (Sidebar, Header)
│   ├── page.tsx            # Dashboard
│   ├── projects/           # Project management
│   ├── tasks/              # Kanban/List/Gantt
│   ├── materials/          # Materials + Home Depot
│   ├── expenses/           # Expense tracking
│   ├── team/               # Team management
│   ├── chat/               # Real-time messaging
│   └── settings/
│
├── actions/                # Server Actions (by feature)
│   ├── projects.ts         # Project CRUD
│   ├── tasks.ts            # Task CRUD
│   ├── materials.ts        # Material search/assignment
│   ├── expenses.ts         # Expense CRUD
│   ├── chat.ts             # Chat operations
│   └── ...
│
├── api/                    # API routes
│   ├── auth/[...nextauth]/ # NextAuth
│   └── webhook/stripe/     # Webhooks
│
├── layout.tsx              # Root layout
└── page.tsx                # Public landing

components/
├── app/                    # App shell (Sidebar, Header)
├── projects/               # Project components
├── tasks/                  # Task board, Kanban
├── materials/              # Material search/cards
├── chat/                   # Chat UI
├── ui/                     # Base components
│   ├── button.tsx
│   ├── card.tsx
│   └── aceternity/         # Aceternity UI
└── user/

lib/
├── auth.ts                 # NextAuth config
├── hooks/                  # React hooks
│   ├── useChatRooms.ts
│   ├── useMessages.ts
│   └── usePushNotifications.ts
└── utils.ts

utils/supabase/
├── client.ts               # ❌ DO NOT use in client components
├── server.ts               # ✅ Server Actions, API routes
└── user.ts

types/
├── database.types.ts       # Supabase types
└── next-auth.d.ts          # Session extensions
```

---

## Authentication

### Flow
```
User → Middleware → NextAuth (Google/Magic Link)
     → SupabaseAdapter (stores in next_auth schema)
     → user_profiles + company_users (public schema)
```

### Get User in Server Actions
```typescript
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  return { userId: session.user.id, companyId: companyUser.company_id, role: companyUser.role, supabase };
}
```

---

## Data Flow

### Server Action Pattern (Preferred)
```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

// 1. Schema
const schema = z.object({
  title: z.string().min(1).max(500),
  project_id: z.string().uuid(),
});

// 2. Server Action
export async function createTask(formData: FormData) {
  // Get user context
  const { userId, companyId, supabase } = await getUserContext();
  if (!supabase) return { error: 'Not authenticated' };

  // Validate
  const validation = schema.safeParse(Object.fromEntries(formData));
  if (!validation.success) return { error: 'Validation failed' };

  // Verify company ownership
  const { data: project } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', validation.data.project_id)
    .single();

  if (project?.company_id !== companyId) {
    return { error: 'Insufficient permissions' };
  }

  // Execute
  const { data, error } = await supabase.from('tasks').insert({
    ...validation.data,
    created_by: userId,
  }).select().single();

  if (error) return { error: 'Failed to create task' };

  // Revalidate
  revalidatePath('/app/tasks');
  return { success: true, task: data };
}
```

### API Routes (Only When Needed)
Use for:
- Webhooks (Stripe)
- External integrations
- File uploads

---

## Database Access

### ⚠️ CRITICAL: MCP Supabase

**ALWAYS use MCP Supabase for database operations:**

```bash
mcp__supabase__list_tables                    # List tables
mcp__supabase__execute_sql                    # Run queries
mcp__supabase__apply_migration                # Apply DDL
mcp__supabase__get_advisors type:"security"   # Security check
mcp__supabase__get_logs service:"postgres"    # Debug
mcp__supabase__generate_typescript_types      # Update types
```

### Supabase Client Selection

| Use Case | Client | File | RLS |
|----------|--------|------|-----|
| Server Actions | `createClient()` | server.ts | Bypassed |
| Pre-auth ops | `createAdminClient()` | server.ts | Bypassed |
| User-scoped | `createUserClient()` | server.ts | Bypassed (TODO) |

### ⚠️ Client Components

**DO NOT import ANY Supabase client in client components (`'use client'`).**

❌ **Wrong:**
```typescript
'use client';
import { createClient } from '@/utils/supabase/client'; // Build error!
```

✅ **Correct:**
```typescript
// Server Component (parent)
async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('tasks').select('*');
  return <ClientComponent tasks={data} />;
}

// Client Component (child)
'use client';
export function ClientComponent({ tasks }) {
  // Use Server Action for mutations
  const handleCreate = async () => {
    await createTask(formData);
  };
}
```

### Manual Authorization (RLS Bypassed)

Always verify:
1. User authenticated
2. User belongs to company
3. Resource belongs to user's company

```typescript
if (resource.company_id !== userContext.companyId) {
  return { error: 'Insufficient permissions' };
}
```

---

## Security

### RLS Helpers
```sql
next_auth.uid() -> uuid                           -- Current user
get_user_company_id(user_id) -> uuid              -- User's company
is_user_gc_admin(user_id) -> boolean              -- Check admin
```

### Role Hierarchy
```
gc_admin         -> Full company access
project_manager  -> Manage projects/tasks/team
foreman          -> Manage assigned tasks/workers
field_worker     -> View/update assigned tasks
subcontractor    -> Limited to assigned work
client           -> Read-only project visibility
```

### Input Validation
```typescript
const schema = z.object({
  title: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().date().optional(),
});

const result = schema.safeParse(input);
if (!result.success) {
  return { error: 'Validation failed', fieldErrors: result.error.flatten() };
}
```

---

## Agent Workflow

### Primary Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **agent-frontend-engineer** | UI work (all stages) | Research → Plan → Implement. Uses `frontend-design` plugin. |
| **agent-backend-engineer** | Database + Server | Database, Server Actions, API. ALWAYS uses MCP Supabase. |
| **agent-code-reviewer** | Review + debug | After implementations. Fast, focused reviews. |

### Workflow

```
Complex UI:
1. agent-frontend-engineer → Plans + implements with plugin
2. agent-code-reviewer → Reviews

Simple UI:
1. agent-frontend-engineer → Direct implementation
2. agent-code-reviewer → Quick review

Backend:
1. agent-backend-engineer → MCP Supabase implementation
2. agent-code-reviewer → Security audit
```

### Skills

| Skill | Purpose |
|-------|---------|
| `/kc:impl` | Implement from specs |
| `/kc:build` | Build verification |
| `/kc:db-check` | Database health |
| `/kc:review` | Code review |
| `/kc:bug-fix` | Debug & fix |

### Critical Rules

1. ✅ **Always use MCP Supabase** for database
2. ✅ **Always use frontend-design plugin** for UI
3. ✅ **Never import Supabase in client components**
4. ✅ **Run `/kc:build`** before completion
5. ✅ **Update session context files** after work

---

## Error Handling

### Server Action
```typescript
export async function action(formData: FormData) {
  try {
    const { data, error } = await supabase.from('table').insert(data);

    if (error) {
      console.error('Error:', error);
      return { error: 'Failed to create record' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner';

toast.success('Task created');
toast.error('Failed to create task');
```

---

## Code Organization

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Server Actions: `feature.ts` (e.g., `tasks.ts`)

### Import Order
```typescript
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 4. Types
import type { Task } from '@/types/database.types';
```

### Debug Comments
```typescript
// Debug: Kanban drag-and-drop initialization
// Debug: Form validation logic
// Debug: API call with error handling
```

---

## Environment Variables

<details>
<summary><strong>Required Variables</strong></summary>

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWT_SECRET=

# NextAuth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email (Gmail or Resend)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Stripe (optional)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Feature Flags
NEXT_PUBLIC_PAYMENTS_ENABLED=false

# SerpAPI (Home Depot)
SERPAPI_API_KEY=

# Firebase (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FCM_SERVER_KEY=
```
</details>

---

## Quick Reference

### New Feature Checklist

1. **Database**: `mcp__supabase__apply_migration`
2. **Types**: `mcp__supabase__generate_typescript_types`
3. **Server Action**: `app/actions/[feature].ts`
4. **Components**: `components/[feature]/`
5. **Pages**: `app/app/[feature]/`
6. **Test**: `/kc:build`

### Before Deployment

```bash
/kc:build      # Verify build passes
/kc:db-check   # Database security check
agent-code-reviewer  # Final review
```
