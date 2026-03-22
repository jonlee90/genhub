# GenHub Architecture Index

> Quick lookup for file placement, module boundaries, and domain mapping.
> Last updated: 2026-03-21

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
├── ai/               → AI utilities (parse-prompt, normalize-takeoff)
├── auth/             → Auth helpers (user-context)
├── cache/            → Cache utilities
├── clustering/       → Spatial clustering
├── collaboration/    → Real-time collaboration
├── config/           → Configuration (task-type-fields, modal-themes, colors)
├── constants/        → App-wide constants
├── context/          → React context providers
├── contexts/         → Additional context providers
├── default-models/   → AI model defaults
├── extraction/       → PDF/plan extraction utilities
├── feature-flags/    → Feature flag management
├── hooks/            → Responsive/media hooks (useIsMobile, etc.)
├── measurements/     → Plan measurement utilities
├── offline/          → Offline sync and conflict resolution
├── onboarding/       → User onboarding flows
├── pdf/              → PDF generation utilities
├── pwa/              → PWA utilities (photo-compression, etc.)
├── services/         → External API integrations (Home Depot, Kakao)
├── validation/       → Zod schemas + RHF validation rules
├── xeokit/           → 3D BIM viewer integration
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
| **Tasks** | `tasks.ts`, `tasks-*.ts` (8 files) | `/tasks/` (60 files) | `useTaskFormState` | `db/tables/tasks.ts` |
| **Projects** | `projects.ts`, `project-*.ts` (5 files) | `/projects/` (96 files) | - | `db/tables/projects.ts` |
| **Team** | `team.ts`, `subcontractors.ts` | `/team/` (24 files) | - | `team.ts` |
| **Expenses** | `expenses.ts` | `/expenses/` (9 files) | - | `db/tables/expenses.ts` |
| **Materials** | `materials.ts` | `/materials/` (11 files) | - | `db/tables/materials.ts` |
| **Chat** | `chat.ts`, `chat-*.ts` (3 files) | `/chat/` (33 files) | - | `db/chat.ts` |
| **Spatial/3D** | `spatial.ts`, `tasks-spatial.ts` | `/projects/spatial/` (53 files) | - | `db/spatial.ts` |
| **Estimates** | `estimates.ts`, `estimate-chat.ts`, `assemblies.ts`, `revisions.ts`, `budget-conversion.ts`, `templates.ts`, `material-suggestions.ts`, `ai-budget.ts`, `pricing-templates.ts` (9 files) | `/estimates/` (63 files) | - | `db/tables/estimates.ts` |
| **Dashboard** | `dashboard.ts` | `/dashboard/` (12 files) | - | `dashboard.ts` |
| **Settings** | `project-types.ts`, `task-types.ts`, etc. | `/settings/` (11 files) | - | - |
| **Auth/Invite** | `accept-invite.ts`, `accept-admin-invite.ts`, `invite-auth.ts` | `/auth/`, `/admin-invite/` | - | - |
| **Owner/Admin** | `owner.ts`, `seed-demo-data.ts` | `/owner/`, `/admin/` | - | - |
| **Notifications** | `push.ts`, `kakao.ts` | `/pwa/` | - | - |
| **Stripe** | `stripe.ts` | `/stripe/` | - | - |
| **Client Portal** | `client.ts` | `/app/` (layout) | - | - |

---

## Component Counts by Directory

| Directory | Files | Subdirectories | Notes |
|-----------|-------|----------------|-------|
| `components/ui/` | 59 | ResponsiveModal, BaseModal, aceternity | Base primitives |
| `components/projects/` | 22 | spatial(53), files(14), form(5) | Largest domain |
| `components/tasks/` | 42 | detail(8), gantt(9), modal(6) | Task management |
| `components/chat/` | 28 | previews(5) | Messaging UI |
| `components/team/` | 24 | subcontractor-modal(9) | Team management |
| `components/mobile/` | 13 | BottomSheetModal(4) | Mobile-specific |
| `components/dashboard/` | 12 | - | KPI widgets |
| `components/settings/` | 11 | - | Config management |

---

## Action File Organization

### Task Domain (8 files)
```
tasks.ts              → Core CRUD (79 KB) - createTask, updateTask, deleteTask
tasks-status.ts       → Status workflow (4.5 KB) - updateTaskStatus
tasks-activity.ts     → Activity logging (6.1 KB) - logTaskActivity, addComment
tasks-assignments.ts  → Multi-assignee (9.6 KB) - assignTask, getAssignees
tasks-dependencies.ts → Task relationships (5.4 KB) - addDependency
tasks-spatial.ts      → 3D linking (6.7 KB) - linkTaskToMarker
tasks-deferred.ts     → Lazy loading (13 KB) - getDeferredTaskData
tasks-analytics.ts    → Task analytics/reporting
```

### Other Domains
```
projects.ts          → Project CRUD
project-photos.ts    → Photo management
project-files.ts     → Document management
project-types.ts     → Project type configuration
project-deferred.ts  → Lazy loading project data
phases.ts            → Project phases
phase-templates.ts   → Phase template management
team.ts              → Team members
subcontractors.ts    → Vendor management
expenses.ts          → Cost tracking
materials.ts         → Inventory
chat.ts              → Messaging
chat-queries.ts      → Chat data fetching
chat-search.ts       → Chat search
dashboard.ts         → KPIs + cache invalidation
default-models.ts    → AI model configuration
spatial.ts           → 3D marker management
stripe.ts            → Stripe billing operations
push.ts              → Push notifications
kakao.ts             → KakaoTalk integration
owner.ts             → Admin/owner panel operations
client.ts            → Client portal actions
task-templates.ts    → Task template management
task-types.ts        → Task type configuration
team-email-helper.ts → Team email utilities
seed-demo-data.ts    → Demo data seeding
```

### Estimates Domain (9 files)
```
estimates.ts              → Estimate CRUD, plan upload, AI parsing (primary, 59KB)
estimate-chat.ts          → AI chat sidebar (PlanChatSidebar)
assemblies.ts             → Assembly system (AssemblyPicker, AssemblyEditor)
revisions.ts              → Revision comparison (RevisionDiffView)
budget-conversion.ts      → Estimate-to-budget conversion
templates.ts              → Pricing template management
material-suggestions.ts   → AI material suggestions for line items
ai-budget.ts              → AI budget analysis
pricing-templates.ts      → Pricing template configuration
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
├── estimates/            → (tab within projects/[id] via EstimatesTabClient)
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
| Component files | 466 |
| Server Action files | 47 |
| API routes | 33 |
| Custom hooks | 33 (17 in /hooks + 16 in /lib/hooks) |
| Type definition files | 31 |
| Component directories | 26 |
