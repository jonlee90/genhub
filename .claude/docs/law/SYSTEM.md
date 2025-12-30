# GenHub PWA - System Architecture Rules

> **CRITICAL**: This document is the authoritative source for all architectural decisions. All agents MUST follow these rules exactly.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Routing Conventions](#routing-conventions)
4. [Authentication Architecture](#authentication-architecture)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Database Access Patterns](#database-access-patterns)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Security Patterns](#security-patterns)
10. [Agent Workflow Rules](#agent-workflow-rules)
11. [Code Organization Best Practices](#code-organization-best-practices)

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.9 | App Router, Server Components, Server Actions |
| React | 19.0.0 | UI Framework |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 3.4.1 | Styling |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL Database, RLS, Real-time |
| NextAuth | 5.0.0-beta.30 | Authentication |
| @auth/supabase-adapter | 1.7.4 | NextAuth Supabase Integration |

### UI Libraries
| Library | Purpose |
|---------|---------|
| Aceternity UI | Modern UI components with animations |
| Radix UI | Accessible primitives (Dialog, Dropdown, etc.) |
| Lucide React | Icon library (construction-themed) |
| Framer Motion | Animations |
| class-variance-authority | Component variants |
| tailwind-merge | Class merging utilities |

### Additional Services
| Service | Purpose |
|---------|---------|
| Stripe | Payments (optional, feature-flagged) |
| Nodemailer/Resend | Email delivery |
| Vercel Blob | File storage |
| Zod | Schema validation |

---

## Project Structure

```
next-saas-starter/
├── app/
│   ├── app/                    # Authenticated routes (protected by middleware)
│   │   ├── layout.tsx          # App shell: Sidebar, Header, PWA components
│   │   ├── page.tsx            # Dashboard
│   │   ├── projects/           # Project management
│   │   ├── tasks/              # Task management (Kanban/List/Gantt)
│   │   ├── materials/          # Materials management
│   │   ├── expenses/           # Expense tracking
│   │   ├── team/               # Team & subcontractor management
│   │   ├── reports/            # Daily site reports
│   │   ├── analytics/          # Dashboards & charts
│   │   ├── settings/           # User/company settings
│   │   └── profile/            # User profile
│   │
│   ├── actions/                # Server Actions (grouped by feature)
│   │   ├── auth.ts             # Authentication actions
│   │   ├── projects.ts         # Project CRUD + addProjectTeamMember
│   │   ├── tasks.ts            # Task CRUD
│   │   ├── materials.ts        # Material search, assignment, CRUD
│   │   │   └── getTaskMaterials, addProductToTask, removeMaterialFromTask, updateMaterialQuantity
│   │   ├── expenses.ts         # Expense CRUD
│   │   ├── team.ts             # Team management
│   │   ├── subcontractors.ts   # Subcontractor CRUD
│   │   ├── phases.ts           # Phase management
│   │   ├── accept-invite.ts    # Invitation acceptance
│   │   └── stripe.ts           # Stripe payment actions
│   │
│   ├── api/                    # API routes
│   │   ├── auth/[...nextauth]/ # NextAuth handlers
│   │   ├── profile/            # Profile API
│   │   ├── webhook/stripe/     # Stripe webhooks
│   │   ├── (payment)/          # Payment routes
│   │   └── companies/[companyId]/users/ # Company users for team management
│   │
│   ├── accept-invite/          # Public invitation flow
│   ├── success/                # Payment success page
│   ├── ~offline/               # PWA offline page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page (public)
│   └── globals.css             # Global styles & CSS variables
│
├── components/
│   ├── app/                    # App shell components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── profile/
│   │
│   ├── projects/               # Project components
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetailContent.tsx # Project detail with tabs
│   │   ├── ProjectTeam.tsx     # Team management tab
│   │   ├── AddMemberModal.tsx  # Add team member modal with search
│   │   ├── MetroJourney.tsx    # Phase visualization
│   │   └── ...
│   │
│   ├── tasks/                  # Task components
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskBoard.tsx       # Main task board with filters, views, stats
│   │   ├── TaskFilters.tsx     # Task filtering UI
│   │   ├── TaskModal.tsx       # Create/Edit task modal with materials section
│   │   ├── TaskMaterialsManager.tsx # Tabbed interface for task materials
│   │   ├── TaskMaterialSearch.tsx   # Home Depot product search for tasks
│   │   ├── TaskMaterialsList.tsx    # Assigned materials list with CRUD
│   │   ├── DashboardStats.tsx  # Stats cards (totals, budget, variance)
│   │   ├── TopProjectsCard.tsx # Top projects by task completion
│   │   ├── TopTeamMembersCard.tsx # Top team members by completed tasks
│   │   ├── KanbanColumn.tsx    # Individual kanban column (no height limit)
│   │   ├── gantt/              # Gantt chart components
│   │   └── ...
│   │
│   ├── team/                   # Team management
│   ├── materials/              # Materials management
│   ├── expenses/               # Expense management
│   ├── pwa/                    # PWA components
│   ├── stripe/                 # Stripe components
│   │
│   ├── ui/                     # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   ├── bottom-sheet.tsx     # Mobile bottom sheet
│   │   ├── CreatorBadge.tsx     # Metadata display component
│   │   └── aceternity/         # Aceternity UI components
│   │       ├── sidebar.tsx
│   │       ├── tabs.tsx
│   │       ├── stepper.tsx
│   │       └── ...
│   │
│   └── user/                   # User components
│
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── auth.config.ts          # Auth providers config
│   ├── hooks/                  # Custom React hooks
│   ├── utils.ts                # Utility functions (cn, etc.)
│   └── mail.ts                 # Email utilities
│
├── types/
│   ├── database.types.ts       # Supabase generated types
│   └── next-auth.d.ts          # NextAuth type extensions
│
├── utils/
│   └── supabase/
│       ├── client.ts           # Server-side client with auth (NOT for client components!)
│       ├── server.ts           # Admin clients (bypasses RLS)
│       └── user.ts             # User utilities
│
├── supabase/
│   └── migrations/             # Database migrations
│
├── public/                     # Static assets, PWA manifest
├── middleware.ts               # Auth middleware
├── config.ts                   # App configuration
├── tailwind.config.ts          # Tailwind configuration
└── package.json
```

---

## Routing Conventions

### Route Groups
- `app/app/*` - Protected authenticated routes
- `app/api/*` - API routes
- `app/(payment)/*` - Grouped payment routes

### Dynamic Routes
```
/app/projects/[id]      # Project detail
/app/tasks/[id]         # Task detail
/app/team/subcontractors # Nested route
```

### Middleware Protection
```typescript
// middleware.ts - Protects /app/* routes
export const config = {
  matcher: ["/app/:path*"],
};
```

### Loading & Error States
Every route should have:
- `loading.tsx` - Loading skeleton
- `error.tsx` - Error boundary

---

## Authentication Architecture

### NextAuth + Supabase Integration

```
User Request
    │
    ▼
┌─────────────┐
│  Middleware │ ─── Checks auth, redirects if needed
└─────────────┘
    │
    ▼
┌─────────────┐
│  NextAuth   │ ─── Google OAuth / Magic Link (Nodemailer/Resend)
└─────────────┘
    │
    ▼
┌─────────────┐
│  Supabase   │ ─── SupabaseAdapter stores sessions in next_auth schema
│  Adapter    │
└─────────────┘
    │
    ▼
┌─────────────┐
│  User Data  │ ─── user_profiles, company_users in public schema
└─────────────┘
```

### Auth Configuration (`lib/auth.config.ts`)
```typescript
// Providers: Google OAuth, Nodemailer (Magic Link)
// Adapter: SupabaseAdapter with schema: 'next_auth'
// Callbacks: session callback adds user.id
```

### Getting User in Server Actions
```typescript
import { auth } from '@/lib/auth';

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Get company and role from company_users
  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  return { userId: session.user.id, companyId, role, supabase };
}
```

### Session Type Extension
```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string
    user: {
      address: string
    } & DefaultSession["user"]
  }
}
```

---

## Data Flow Patterns

### Server Actions (Preferred)
```typescript
// app/actions/tasks.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// 1. Schema validation
const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  project_id: z.string().uuid(),
  // ...
});

// 2. Server Action
export async function createTask(prevState: any, formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  // Validate input
  const validation = createTaskSchema.safeParse(rawData);
  if (!validation.success) return { error: 'Validation failed' };

  // Verify access (company ownership)
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Perform operation
  const { data, error } = await supabase.from('tasks').insert(...);

  // Revalidate cache
  revalidatePath('/app/tasks');

  return { success: true, task };
}
```

### API Routes (When Needed)
Use for:
- Webhooks (Stripe)
- External integrations
- File uploads

### Client-Side Data Fetching
- Use Server Components for initial data
- Use `useSession` from next-auth/react for client auth state

---

## Database Access Patterns

### CRITICAL: MCP Supabase Integration

**ALWAYS use MCP Supabase for database operations:**

```bash
# List tables
mcp__supabase__list_tables

# Execute queries (SELECT, INSERT, UPDATE, DELETE)
mcp__supabase__execute_sql

# Apply migrations (DDL: CREATE TABLE, ALTER TABLE, etc.)
mcp__supabase__apply_migration

# Security/performance checks
mcp__supabase__get_advisors

# Debug issues
mcp__supabase__get_logs

# Update TypeScript types
mcp__supabase__generate_typescript_types
```

### Supabase Client Selection

| Client | File | Use Case | RLS |
|--------|------|----------|-----|
| `createClient()` | server.ts | Server Actions, API routes (DEPRECATED) | Bypassed |
| `createAdminClient()` | server.ts | Pre-auth operations, webhooks, system tasks | Bypassed |
| `createUserClient()` | server.ts | User-scoped server operations (PREFERRED) | Bypassed (TODO: true RLS) |
| `getSupabaseClient()` | server.ts | Legacy (DEPRECATED) | Bypassed |

> **⚠️ CRITICAL: Client Components**
>
> **DO NOT import any Supabase client in client components (`'use client'`).**
>
> - `client.ts` imports `auth` from `lib/auth`, which imports `nodemailer` (server-only)
> - Using `client.ts` in client components causes build errors (missing `child_process`, `dns`, `fs`, `net`)
>
> **Instead:**
> - Server Components: Fetch data server-side, pass as props
> - Client Components: Use Server Actions for all database operations

### Server-Side Pattern
```typescript
import { createClient } from '@/utils/supabase/server';

// In Server Actions
const supabase = await createClient();
const { data, error } = await supabase
  .from('tasks')
  .select('*, assignee:user_profiles(*)')
  .eq('project_id', projectId);
```

### Authorization Pattern (Manual)
Since server client bypasses RLS, manually verify:
1. User is authenticated
2. User belongs to company
3. Resource belongs to user's company

```typescript
// Always verify company ownership
if (project.company_id !== userContext.companyId) {
  return { error: 'Insufficient permissions' };
}
```

---

## State Management

### Server State (Primary)
- Server Components for data fetching
- Server Actions for mutations
- `revalidatePath()` / `revalidateTag()` for cache invalidation

### Client State (Minimal)
- React `useState` for UI state (modals, filters)
- `usePathname()` for navigation state
- Form state with React 19 `useFormState`

### URL State
- Search params for shareable filters
- Dynamic route segments for resource IDs

---

## Error Handling

### Server Action Pattern
```typescript
export async function createTask(formData: FormData) {
  try {
    // ... operation
    if (insertError) {
      console.error('Error creating task:', insertError);
      return { error: 'Failed to create task. Please try again.' };
    }
    return { success: true, task };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

### Error Boundaries
```typescript
// app/app/projects/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner';

// Success
toast.success('Task created successfully');

// Error
toast.error('Failed to create task');
```

---

## Security Patterns

### Row Level Security (RLS)
All tables have RLS enabled with policies based on:
- `next_auth.uid()` - Current user's UUID
- Company membership via `company_users` table
- Role-based access (`gc_admin`, `project_manager`, etc.)

### Helper Functions
```sql
-- Get user's company ID
get_user_company_id(p_user_id uuid) -> uuid

-- Check if user is GC Admin
is_user_gc_admin(p_user_id uuid) -> boolean
```

### Role Hierarchy
```
gc_admin         -> Full access to company data
project_manager  -> Manage projects, tasks, team
foreman          -> Manage assigned tasks, workers
field_worker     -> View/update assigned tasks
subcontractor    -> Limited access to assigned work
client           -> Read-only project visibility
```

### Input Validation
Always use Zod schemas:
```typescript
const schema = z.object({
  title: z.string().min(1).max(500),
  project_id: z.string().uuid(),
});

const validation = schema.safeParse(input);
if (!validation.success) {
  return { error: 'Validation failed', fieldErrors: validation.error.flatten() };
}
```

### CSRF Protection
- Server Actions have built-in CSRF protection
- API routes should validate origin headers for webhooks

---

## Agent Workflow Rules

### Primary Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **frontend-architect** | UI planning, Aceternity research | Before complex UI. Creates plans, does NOT implement. |
| **frontend-builder** | UI implementation | Implements with `frontend-design` plugin. Use after architect. |
| **backend-engineer** | Supabase + Next.js server | Database, Server Actions, API. ALWAYS uses MCP Supabase. |
| **code-reviewer** | Review, debug, test | After implementations. |

### Agent Workflow

```
Complex UI Feature:
1. frontend-architect -> Creates plan in .claude/docs/ui-plans/
2. frontend-builder -> Implements using frontend-design plugin
3. code-reviewer -> Reviews and fixes issues

Simple UI Change:
1. frontend-builder -> Direct implementation
2. code-reviewer -> Quick review

Backend Work:
1. backend-engineer -> Implements with MCP Supabase
2. code-reviewer -> Security audit
```

### Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| `/kc:nextjs` | Next.js optimization, PWA |
| `/kc:impl` | Implement from specs |
| `/kc:build` | Build and verify |
| `/kc:db-check` | Database health check |
| `/kc:review` | Quick code review |
| `/kc:bug-fix` | Debug and fix bugs |

### CRITICAL Rules

1. **Always use MCP Supabase** for database operations
2. **Always use frontend-design plugin** for UI work
3. **Check session context files** before starting work
4. **Update session files** after completing work
5. **Run `/kc:build`** before considering work complete

---

## Code Organization Best Practices

### File Naming
- Components: PascalCase (`TaskCard.tsx`)
- Utilities: camelCase (`utils.ts`)
- Server Actions: feature-grouped (`actions/tasks.ts`)

### Component Structure
```typescript
'use client'; // Only if needed

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Debug: Component description
interface Props {
  // ...
}

export function ComponentName({ prop }: Props) {
  // Debug: State management
  const [state, setState] = useState();

  // Debug: Event handlers
  const handleClick = () => {
    console.log('Debug: Click handler triggered');
  };

  return (
    <div className={cn('base-classes', conditionalClasses)}>
      {/* Debug: Render content */}
    </div>
  );
}
```

### Import Order
```typescript
// 1. React/Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal - absolute imports
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 4. Types
import type { Task } from '@/types/database.types';
```

### Debug Comments
Always add debug comments for major features:
```typescript
// Debug: Kanban drag-and-drop initialization
// Debug: Form validation logic
// Debug: API call with error handling
```

---

## Quick Reference

### Creating New Features

1. **Database**: Use `mcp__supabase__apply_migration`
2. **Types**: Run `mcp__supabase__generate_typescript_types`
3. **Server Action**: Create in `app/actions/`
4. **Components**: Create in `components/[feature]/`
5. **Pages**: Create in `app/app/[feature]/`
6. **Tests**: Run `/kc:build` to verify

### Before Deployment

```bash
/kc:build      # Verify build
/kc:db-check   # Database security
code-reviewer  # Final review
```

### Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

# NextAuth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Stripe (optional)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```
