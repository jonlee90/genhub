# CLAUDE.md - GenHub PWA

> Construction project management for general contractors | Mobile-first PWA

---

## HARD RULES (Build Failures)

| Rule | Violation | Consequence |
|------|-----------|-------------|
| No Supabase in `'use client'` | `createClient`/`@/utils/supabase/*` in client | `Module not found: 'child_process'` |
| ResponsiveModal only | `<Dialog` from Radix | Inconsistent mobile UX |
| Lucide icons only | `heroicons`/`fontawesome` | Bundle bloat |
| 44px touch targets | `min-h-[44px]` missing on interactive | Failed accessibility |
| Server Actions for DB | Direct DB in components | Security/architecture violation |

```
┌─────────────────────────────────────────────────────────────┐
│ Layer            │ DB Access │ Responsibilities             │
├─────────────────────────────────────────────────────────────┤
│ 'use client'     │ ❌ NEVER  │ UI, interactions, local state │
│ Server Actions   │ ✅ YES    │ Mutations, queries, auth      │
│ Server Components│ ✅ YES    │ Data fetching, SSR            │
└─────────────────────────────────────────────────────────────┘
```

---

## PROJECT

**App:** GenHub - Construction PWA for field workers and general contractors
**Stack:** Next.js 16, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities:** Correctness > Consistency > Token efficiency > Speed

### Design System

| Element | Value |
|---------|-------|
| Primary | `#001B51` |
| Accent | `#3C3C3C` |
| Icons | Lucide only |
| Modals | `ResponsiveModal` component |
| Touch targets | 44px minimum |
| Mobile viewport | 375px baseline, `dvh` not `vh` |

### Personas

| Persona | Role | Primary Goals |
|---------|------|---------------|
| **GC** | General Contractor | Manage company, projects, subs, finances |
| **PM** | Project Manager | Track phases, tasks, timelines, reports |
| **Foreman** | Site Supervisor | Coordinate crews, tasks, report issues |
| **Worker** | Field Worker | Complete tasks, log materials, expenses |
| **Sub** | Subcontractor | Submit bids, complete work, invoice |
| **Client** | Project Client | View progress, approve changes |

---

## MCP TOOLS

### Architecture

| Tool | Purpose | Primary Use |
|------|---------|-------------|
| **Serena** | Code knowledge | `find_symbol`, `read_memory`, `search_for_pattern` |
| **Memory MCP** | Session state | Decisions, active tasks, bug patterns |
| **Context7** | Library docs | `resolve-library-id` → `query-docs` |
| **Supabase MCP** | Database ops | `list_tables`, `execute_sql`, `apply_migration` |

### Serena Memories (Load by Context)

```
ALWAYS LOAD:
├── genhub-database-schema     # Table structures, relationships
├── genhub-server-actions      # Action patterns, signatures
└── genhub-component-patterns  # UI patterns, ResponsiveModal

LOAD BY TASK:
├── genhub-common-gotchas      # Known issues, workarounds
└── genhub-architectural-decisions  # Why decisions were made
```

### Session Workflow

```
START:
1. mcp__memory__read_graph() → Check ActiveTask
2. Load relevant Serena memories (see above)
3. mcp__supabase__list_tables (if DB work)

DURING:
- Context7 before external library code
- Update Memory MCP after decisions/bugs found

END:
- Update ActiveTask with progress
- Trigger learning check (if significant task)
```

---

## WORKFLOW: PLANNING VS IMPLEMENTATION

### Feature Planning → `/kc:spec`

```
/kc:spec {feature-name}

Output: .claude/specs/{feature}/
├── requirements.md   # User stories (EARS format)
├── design.md         # Schema, actions, components
└── tasks.md          # Agent assignments

Approval gates between each phase.
```

### Task Implementation → `/kc:impl` or Direct

```
WITH SPEC:
/kc:impl {task-id}  → Reads spec, delegates to agents

WITHOUT SPEC (direct task list):
1. Parse & categorize tasks
2. TodoWrite for tracking
3. Delegate to appropriate agent(s)
4. Verify build
```

---

## AGENT SYSTEM

### Core Agents

| Agent | Authority | Budget | Never |
|-------|-----------|--------|-------|
| `backend-engineer` | DB, Server Actions, API, RLS | 90k | UI components |
| `frontend-engineer` | Components, styling, forms | 90k | DB access |
| `code-reviewer` | Review, testing, bug fixes | 60k | New features |

### Planning Agents (No Implementation)

| Agent | Purpose |
|-------|---------|
| `spec-writer` | Requirements → Design → Tasks |
| `frontend-architect` | UI/UX planning, component architecture |
| `supabase-schema-architect` | Schema design, migration planning |
| `ai-sdk-v5-expert` | Vercel AI SDK integration guidance |

### Quick Decision Flow

| Task Type | Agent | Notes |
|-----------|-------|-------|
| UI component, styling, forms | frontend-engineer | Never DB |
| Server Action, API route | backend-engineer | Never UI |
| Schema change, migration, RLS | backend-engineer | Security review after |
| Bug fix in component | frontend-engineer | Unless needs DB |
| Bug fix in action/API | backend-engineer | |
| Review/validation/testing | code-reviewer | Post-implementation |
| Both UI + DB needed | Sequential: backend → frontend → review | |

### Orchestration Flags

| Flag | Effect |
|------|--------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run build step |

---

## TASK EXECUTION

### Multi-Task Processing

```
Step 1: PARSE & CATEGORIZE
- Extract individual tasks from prompt
- Classify: backend | frontend | both | review
- Identify dependencies
- Flag cross-boundary tasks

Step 2: TRACK WITH TodoWrite
TodoWrite([
  { content: "Task 1", status: "pending", activeForm: "Working on Task 1" },
  { content: "Task 2", status: "pending", activeForm: "Working on Task 2" },
])

Step 3: DISPATCH
┌─────────────────────────────────────────┐
│ All same domain     → Single agent      │
│ Mixed, independent  → Parallel agents   │
│ Mixed, dependent    → Sequential agents │
│ Has spec file       → /kc:impl          │
└─────────────────────────────────────────┘

Step 4: VERIFY & REPORT
- Mark TodoWrite: in_progress → completed
- Run build verification
- Collect outputs, summarize for user
```

### Preflight Check (Complex Tasks)

Before major implementations, verify:
- [ ] Spec files exist at expected paths (if referenced)
- [ ] No type conflicts with existing schema
- [ ] Agent boundaries won't be violated
- [ ] MCP tools accessible (Serena, Supabase)

---

## STANDARDIZED OUTPUT

### Agent Audit Log Format

All agents must return this structure:

```
## Task Complete

**Status:** ✓ completed | ✗ failed | ⚠️ partial (N/M)

**Tasks:**
- [x] Task 1 description
- [x] Task 2 description
- [ ] Task 3 (remaining)

**Files Changed:**
- `path/to/file.ts` - Description
- `path/to/file.tsx` - Description

**Build:** ✓ pass | ✗ fail (details)

**Handoff:** (if needed)
→ {agent}: {reason}
Interface: { input: Type, output: { data?: T, error?: string } }
```

### Verification Checklist

| Check | Command |
|-------|---------|
| TypeScript | `npm run build 2>&1 \| grep -E "error\|Error" -A 3` |
| Security (new tables) | `mcp__supabase__get_advisors("security")` |
| Performance | `mcp__supabase__get_advisors("performance")` |

---

## TOKEN DISCIPLINE

| Rule | Implementation |
|------|----------------|
| Search first | `find_symbol`, Grep/Glob before full reads |
| Targeted reads | `offset`+`limit` for files >200 lines |
| Skip verification | Don't re-read after Edit with unique `old_string` |
| Batch edits | Combine adjacent changes into single Edit |
| Parallel calls | Group independent reads/searches in one message |
| No file creation | Use Serena memories, not new `.md` files |

---

## STOP CONDITIONS

Halt and request guidance if:
- Task violates agent authority boundaries
- Required context missing from Serena/Memory MCP
- Build fails 2x on same error
- Security advisor returns critical
- Approaching token budget (report progress)
- Spec files missing or ambiguous

---

## CONTINUOUS LEARNING

### Trigger Conditions

Run learning check for significant tasks only:
- ✅ Multi-step implementations
- ✅ Error resolution after 2+ attempts
- ✅ User corrections to approach
- ✅ New architectural decisions
- ✅ Performance optimizations

Skip for: Typo fixes, single-line changes, simple renames, config tweaks

### Post-Task Checklist

| Question | If Yes → Action |
|----------|-----------------|
| New gotcha discovered? | Serena: `write_memory('genhub-common-gotchas', ...)` |
| Reusable pattern found? | Serena: `write_memory('genhub-component-patterns', ...)` |
| Architectural decision made? | Memory: `add_observations('key-decisions', [...])` |
| Bug pattern encountered? | Memory: `create_entities({ entityType: "BugPattern" })` |
| User corrected approach? | Document in relevant memory |

### Learning Entry Format

```markdown
## [Pattern Name] (YYYY-MM-DD)
**What:** Clear description
**When:** Trigger conditions
**Why:** Problem prevented / value provided
**How:** Solution steps or code
**Source:** Task name
```

**Note:** CLAUDE.md updates are NEVER automatic. Suggest changes to user for manual review.

---

## QUICK REFERENCE

### Common Imports

```typescript
// Server Actions
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'

// Client Components
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { Check, X, Plus } from 'lucide-react'

// Types
import type { Task, Project } from '@/types/db/core'
```

### Server Action Pattern

```typescript
'use server'
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({ /* fields */ })

export async function createEntity(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.format() }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('table')
    .insert({ ...parsed.data, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/app/route')
  return { data }
}
```

### Touch Button Pattern

```tsx
<button className="
  w-full h-14 px-6 bg-[#001B51] text-white font-semibold
  rounded-xl flex items-center justify-center gap-2
  active:scale-[0.98] active:bg-[#001B51]/90
  transition-all duration-150 disabled:opacity-50
">
  <Check className="w-5 h-5" /> Save
</button>
```

### ResponsiveModal Usage

```tsx
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Title"
  rightActions={<Button>Confirm</Button>}
>
  {children}
</ResponsiveModal>
```

---

## SKILLS & COMMANDS

### Commands

| Command | Purpose |
|---------|---------|
| `/kc:spec {feature}` | Create requirements → design → tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:build` | Build verification |
| `/kc:docs` | Documentation lookup |

### Skills

| Skill | Trigger |
|-------|---------|
| `task-orchestrator` | Multi-agent coordination |
| `refactor-code` | Component consolidation |
| `vercel-react-best-practices` | React/Next.js patterns |
| `mobile-pwa-design` | Mobile-first patterns |

---

## INITIALIZATION

When starting work on this project:

1. Call `init` tool from next-devtools-mcp (automatic)
2. Load Serena memories: `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`
3. Check Memory MCP for `ActiveTask`
4. If new feature: suggest `/kc:spec` first
