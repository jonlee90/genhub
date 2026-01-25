# CLAUDE.md - GenHub PWA

> Construction project management for general contractors | Mobile-first PWA

---

## 🚨 TIER 1: BLOCKING RULES (Build/Task Failure)

These rules WILL fail builds or cause task rejection. No exceptions.

| Rule | Detection | Consequence |
|------|-----------|-------------|
| No Supabase in `'use client'` | `createClient`/`@/utils/supabase/*` | Build fails: `Module not found: 'child_process'` |
| Server Actions for DB | Direct DB in client components | **REJECT**: Security violation |
| ResponsiveModal only | `<Dialog` from Radix | **REJECT**: Use `ResponsiveModal` instead |
| Lucide icons only | `heroicons`/`fontawesome` | **REJECT**: Bundle bloat |
| 44px touch targets | Missing `min-h-[44px]` on interactive | **FIX BEFORE COMPLETING** |

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

## ⚠️ TIER 2: MANDATORY WORKFLOWS (Must Execute)

Skip these = incomplete task. Report violations in output.

| Trigger | Required Action | Report In Output |
|---------|-----------------|------------------|
| **Any React/TSX change** | Read & apply `vercel-react-best-practices` skill | `Skills: [rules applied]` |
| **Any component** | Verify 44px touch, active states, dark mode | `Mobile: ✓/✗` |
| **Session start** | Load Serena memories | `Context: ✓` |
| **Data fetching** | Use Server Components or Server Actions | Architecture check |

### React Changes Pre-Flight (MANDATORY)

Before writing/editing any `.tsx` file:
1. **LOAD**: Read `vercel-react-best-practices` skill
2. **IDENTIFY**: Which rules apply? (imports → `bundle-*`, state → `rerender-*`, async → `async-*`)
3. **APPLY**: Use patterns from skill during implementation
4. **REPORT**: List specific rules in output: `Skills Applied: bundle-barrel-imports, rerender-memo`

---

## PROJECT

**App:** GenHub - Construction PWA for field workers and GCs
**Stack:** Next.js 16, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities:** Correctness > Consistency > Token efficiency > Speed

**Design Tokens:** Primary `#001B51` | Accent `#3C3C3C` | Touch 44px min | Viewport 375px, `dvh` not `vh`

---

## MCP TOOLS

| Tool | Purpose | Use |
|------|---------|-----|
| **Serena** | Code knowledge | `find_symbol`, `read_memory`, `search_for_pattern` |
| **Memory MCP** | Session state | Decisions, active tasks |
| **Context7** | Library docs | `resolve-library-id` → `query-docs` |
| **Supabase MCP** | Database ops | `list_tables`, `execute_sql`, `apply_migration` |

**Serena Memories:** Always: `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`

**Session Flow:**
- **START:** `mcp__memory__read_graph()` → Load Serena memories
- **REACT CHANGES:** Load `vercel-react-best-practices` FIRST
- **END:** Update ActiveTask | Learning check (if significant)

---

## AGENT SYSTEM

> Configs in `.claude/agents/*.md`

| Task Type | Agent | Notes |
|-----------|-------|-------|
| UI component, styling, forms | frontend-engineer | Never DB |
| Server Action, API route | backend-engineer | Never UI |
| Schema change, migration, RLS | backend-engineer | Security review after |
| Review/validation/testing | code-reviewer | Post-implementation |
| Both UI + DB needed | Sequential: backend → frontend → review | |
| Performance issues | performance-engineer | |
| Complex UI planning | frontend-architect | Research before impl |
| New feature design | spec-writer | |
| Codebase questions | Explore | |

---

## STANDARDIZED OUTPUT

All agents return:
```
## Task Complete

**Status:** ✓ completed | ✗ failed | ⚠️ partial (N/M)
**Tasks:** [x] completed [-] remaining
**Files Changed:** `path/file.ts` - description

**Skills Applied:** [list specific rules from vercel-react-best-practices if React work]
**Mobile Checks:** ✓ 44px | ✓ active states | ✓ dark mode | ✓ safe areas

**Build:** ✓ pass | ✗ fail
**Handoff:** → {agent}: {reason} (if needed)
```

---

## TOKEN DISCIPLINE

| Rule | Implementation |
|------|----------------|
| Search first | `find_symbol`, Grep/Glob before full reads |
| Targeted reads | `offset`+`limit` for files >200 lines |
| Skip verification | Don't re-read after Edit with unique `old_string` |
| Batch edits | Combine adjacent changes into single Edit |
| Delegate early | Use Explore/Plan agents to offload work |

---

## STOP CONDITIONS

Halt and request guidance if:
- Task violates agent authority boundaries
- Required context missing from Serena/Memory MCP
- Build fails 2x on same error
- Security advisor returns critical
- Approaching token budget (report progress)
- **React/TSX change without loading `vercel-react-best-practices` skill first (BLOCKING)**

---

## QUICK REFERENCE

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

---

## COMMANDS

| Command | Purpose |
|---------|---------|
| `/kc:spec {feature}` | Create requirements → design → tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:build` | Build verification |

---

## INITIALIZATION

1. Load Serena memories: `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`
2. Check Memory MCP for `ActiveTask`
3. If React work: Load `vercel-react-best-practices` skill
4. If new feature: suggest `/kc:spec` first
