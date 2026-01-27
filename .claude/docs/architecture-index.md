# GenHub Architecture Index

> Quick lookup for file placement, module boundaries, and domain mapping.
> Last updated: 2025-01-26

---

## Module Boundaries

```
/app/
├── actions/          → Server Actions (DB mutations, queries)
├── api/              → API routes (webhooks, file uploads, external integrations)
└── app/              → Authenticated routes (pages)

/components/
├── ui/               → Base primitives (Button, Input, FormField, etc.)
├── {domain}/         → Domain-specific components (tasks/, projects/, team/)
├── mobile/           → Mobile-specific (BottomSheetModal, etc.)
├── shared/           → Cross-domain shared components
└── skeletons/        → Loading state components

/lib/
├── config/           → Configuration (task-type-fields, modal-themes, colors)
├── validation/       → Zod schemas + RHF validation rules
├── services/         → External API integrations (Home Depot, Kakao)
├── pwa/              → Offline/PWA utilities
└── *.ts              → Business logic utilities

/hooks/               → Custom React hooks (forms, state, media queries)

/types/
├── db/tables/        → Database row types (auto-generated + extended)
├── db/enums.ts       → Status, Priority, Role enums
└── *.ts              → Feature-specific types
```

---

## File Placement Rules

| I need to... | Put it in... | Example | Notes |
|--------------|--------------|---------|-------|
| Add a Server Action | `app/actions/{domain}.ts` | `expenses.ts` | One file per domain |
| Add a task-related action | `app/actions/tasks-{feature}.ts` | `tasks-spatial.ts` | Use existing task-* pattern |
| Create a modal | `components/{domain}/` + ResponsiveModal | `CreateExpenseModal.tsx` | MUST use ResponsiveModal |
| Add a utility hook | `hooks/use-{name}.ts` | `useValidatedForm.ts` | Prefix with "use" |
| Add responsive hook | `lib/hooks/use{Name}.ts` | `useIsMobile.ts` | Media query hooks in lib |
| Add DB types | `types/db/tables/{entity}.ts` | `expenses.ts` | Match Supabase table name |
| Add enum types | `types/db/enums.ts` | TaskStatus | Single file for all enums |
| Add config | `lib/config/{feature}.ts` | `task-type-fields.ts` | Config-driven development |
| Add validation schema | `lib/validation/schemas.ts` | TaskSchema | Server-side Zod |
| Add client validation | `lib/validation/client-validation.ts` | requiredString | RHF rules |
| Add external service | `lib/services/{service}.ts` | `home-depot-api.ts` | API integrations |
| Add PWA feature | `lib/pwa/{feature}.ts` | `photo-compression.ts` | Offline/sync utilities |

---

## Domain → Directory Mapping

| Domain | Actions | Components | Hooks | Types |
|--------|---------|------------|-------|-------|
| **Tasks** | `tasks.ts`, `tasks-*.ts` (7 files) | `/tasks/` (60 files) | `useTaskFormState` | `db/tables/tasks.ts` |
| **Projects** | `projects.ts`, `project-*.ts` (4 files) | `/projects/` (96 files) | - | `db/tables/projects.ts` |
| **Team** | `team.ts`, `subcontractors.ts` | `/team/` (23 files) | - | `team.ts` |
| **Expenses** | `expenses.ts` | `/expenses/` (9 files) | - | `db/tables/expenses.ts` |
| **Materials** | `materials.ts` | `/materials/` (11 files) | - | `db/tables/materials.ts` |
| **Chat** | `chat.ts`, `chat-*.ts` (4 files) | `/chat/` (33 files) | - | `db/chat.ts` |
| **Spatial/3D** | `spatial.ts`, `tasks-spatial.ts` | `/projects/spatial/` (53 files) | - | `db/spatial.ts` |
| **Dashboard** | `dashboard.ts` | `/dashboard/` (12 files) | - | `dashboard.ts` |
| **Settings** | `project-types.ts`, `task-types.ts`, etc. | `/settings/` (11 files) | - | - |
| **Auth/Invite** | `accept-invite.ts`, `accept-admin-invite.ts` | `/auth/`, `/admin-invite/` | - | - |

---

## Component Counts by Directory

| Directory | Files | Subdirectories | Notes |
|-----------|-------|----------------|-------|
| `components/ui/` | 59 | ResponsiveModal, BaseModal, aceternity | Base primitives |
| `components/projects/` | 22 | spatial(53), files(14), form(5) | Largest domain |
| `components/tasks/` | 42 | detail(8), gantt(9), modal(6) | Task management |
| `components/chat/` | 28 | previews(5) | Messaging UI |
| `components/team/` | 14 | subcontractor-modal(8) | Team management |
| `components/mobile/` | 13 | BottomSheetModal(4) | Mobile-specific |
| `components/dashboard/` | 12 | - | KPI widgets |
| `components/settings/` | 11 | - | Config management |

---

## Action File Organization

### Task Domain (7 files, 117 KB total)
```
tasks.ts              → Core CRUD (79 KB) - createTask, updateTask, deleteTask
tasks-status.ts       → Status workflow (4.5 KB) - updateTaskStatus
tasks-activity.ts     → Activity logging (6.1 KB) - logTaskActivity, addComment
tasks-assignments.ts  → Multi-assignee (9.6 KB) - assignTask, getAssignees
tasks-dependencies.ts → Task relationships (5.4 KB) - addDependency
tasks-spatial.ts      → 3D linking (6.7 KB) - linkTaskToMarker
tasks-deferred.ts     → Lazy loading (13 KB) - getDeferredTaskData
```

### Other Domains
```
projects.ts          → Project CRUD
project-photos.ts    → Photo management
project-files.ts     → Document management
phases.ts            → Project phases
team.ts              → Team members
subcontractors.ts    → Vendor management
expenses.ts          → Cost tracking
materials.ts         → Inventory
chat.ts              → Messaging
dashboard.ts         → KPIs + cache invalidation
```

---

## Route Structure

### Authenticated Routes (`/app/app/`)
```
/app/app/
├── page.tsx              → Dashboard
├── tasks/                → Task list + detail
├── projects/             → Project list + detail
├── expenses/             → Expense management
├── materials/            → Material inventory
├── chat/                 → Messaging
├── team/                 → Team + subcontractors
├── settings/             → Config management
├── profile/              → User profile
└── owner/                → Admin panel (admin only)
```

### Public Routes
```
/login, /signup           → Authentication
/accept-invite/           → Team invite flow
/admin-invite/            → Admin invite flow
```

---

## Import Patterns

### Server Actions
```typescript
import { createTask, updateTask } from '@/app/actions/tasks'
import { getUserContext } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/server'
```

### Client Components
```typescript
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { Button } from '@/components/ui/button'
import { Check, X, Plus } from 'lucide-react'
```

### Types
```typescript
import type { TasksRow, TasksInsert } from '@/types/db/tables/tasks'
import { TaskStatus, TaskPriority } from '@/types/db/enums'
```

### Hooks
```typescript
import { useValidatedForm } from '@/hooks/useValidatedForm'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
```

---

## Quick Decision Tree

```
Need to add code?
│
├─ Is it a DB operation?
│  └─ YES → app/actions/{domain}.ts (Server Action)
│
├─ Is it a UI component?
│  ├─ Reusable primitive? → components/ui/
│  ├─ Domain-specific? → components/{domain}/
│  └─ Mobile-only? → components/mobile/
│
├─ Is it a hook?
│  ├─ Form-related? → hooks/
│  └─ Responsive/media? → lib/hooks/
│
├─ Is it a type?
│  ├─ DB table? → types/db/tables/
│  ├─ Enum? → types/db/enums.ts
│  └─ Feature-specific? → types/{feature}.ts
│
└─ Is it a utility?
   ├─ Config? → lib/config/
   ├─ Validation? → lib/validation/
   ├─ External API? → lib/services/
   └─ PWA? → lib/pwa/
```

---

## Statistics

| Category | Count |
|----------|-------|
| Total TypeScript/TSX files | 600+ |
| Component files | 397 |
| Server Action files | 37 |
| API routes | 22 |
| Custom hooks | 27 |
| Type definition files | 30 |
| Utility files | 94 |
