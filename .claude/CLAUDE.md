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
| React best practices | Ignoring Vercel guidelines | Suboptimal performance, bundle bloat |

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

**Design Tokens:** Primary `#001B51` | Accent `#3C3C3C` | Touch 44px min | Viewport 375px baseline, `dvh` not `vh`

**Personas:** GC (company owner), PM (project manager), Foreman (site supervisor), Worker (field), Sub (subcontractor), Client

---

## MCP TOOLS

| Tool | Purpose | Primary Use |
|------|---------|-------------|
| **Serena** | Code knowledge | `find_symbol`, `read_memory`, `search_for_pattern` |
| **Memory MCP** | Session state | Decisions, active tasks, bug patterns |
| **Context7** | Library docs | `resolve-library-id` → `query-docs` |
| **Supabase MCP** | Database ops | `list_tables`, `execute_sql`, `apply_migration` |

**Serena Memories:** Always load `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`. Load by task: `genhub-common-gotchas`, `genhub-architectural-decisions`.

**React Code Standards:** Before modifying any React component, page, or hook → Check `vercel-react-best-practices` skill for relevant optimization patterns. Apply Vercel's guidelines for component rendering, memoization, hooks, data fetching, and Core Web Vitals.

**Session Workflow:**
- **START:** `mcp__memory__read_graph()` → Load Serena memories → `mcp__supabase__list_tables` (if DB work)
- **DURING:** Context7 before library code | Check `vercel-react-best-practices` for React changes | Update Memory MCP after decisions
- **END:** Update ActiveTask | Trigger learning check (if significant)

---

## WORKFLOW

**Feature Planning:** `/kc:spec {feature}` → Creates `.claude/specs/{feature}/` with requirements.md, design.md, tasks.md

**Task Implementation:** `/kc:impl {task-id}` (with spec) OR direct delegation to agents (without spec)

**Dispatch Logic:**
- Same domain → Single agent
- Mixed, independent → Parallel agents
- Mixed, dependent → Sequential agents
- Has spec file → `/kc:impl`

---

## AGENT SYSTEM

> Detailed configs in `.claude/agents/*.md`

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
| Performance issues | performance-engineer | Query tuning, Core Web Vitals |
| DB slow queries | db-optimization-agent | Read-only audit first |
| Complex UI planning | frontend-architect | Research before implementation |
| New feature design | spec-writer | Requirements → Design → Tasks |
| Codebase questions | Explore | Finding patterns, understanding code |

### Proactive Triggers

| Trigger | Agent |
|---------|-------|
| Major release | performance-auditor |
| Slow page | db-optimization-agent |
| Multi-step task done | learning-extractor |
| Complex UI feature | frontend-architect |
| New DB table | supabase-schema-architect |

---

## STANDARDIZED OUTPUT

All agents return:
```
## Task Complete
**Status:** ✓ completed | ✗ failed | ⚠️ partial (N/M)
**Tasks:** [x] completed [-] remaining
**Files Changed:** `path/file.ts` - description
**Build:** ✓ pass | ✗ fail
**Handoff:** → {agent}: {reason} (if needed)
```

**Verification:** `npm run build 2>&1 | grep -E "error|Error" -A 3` | `mcp__supabase__get_advisors("security"|"performance")`

---

## TOKEN DISCIPLINE

| Rule | Implementation |
|------|----------------|
| Search first | `find_symbol`, Grep/Glob before full reads |
| Targeted reads | `offset`+`limit` for files >200 lines |
| Skip verification | Don't re-read after Edit with unique `old_string` |
| Batch edits | Combine adjacent changes into single Edit |
| Parallel calls | Group independent reads/searches in one message |
| Delegate early | Use Explore/Plan/Core agents to offload work |

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

**Trigger for:** Multi-step implementations, error resolution after 2+ attempts, user corrections, architectural decisions, performance optimizations

**Skip for:** Typo fixes, single-line changes, simple renames, config tweaks

**Post-Task Actions:**
| Discovery | Action |
|-----------|--------|
| New gotcha | `write_memory('genhub-common-gotchas', ...)` |
| Reusable pattern | `write_memory('genhub-component-patterns', ...)` |
| Architectural decision | `add_observations('key-decisions', [...])` |
| Bug pattern | `create_entities({ entityType: "BugPattern" })` |

**Note:** CLAUDE.md updates are NEVER automatic. Suggest changes for manual review.

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

> Full patterns available via `genhub-patterns` skill or Serena memories

---

## COMMANDS

| Command | Purpose |
|---------|---------|
| `/kc:spec {feature}` | Create requirements → design → tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:build` | Build verification |
| `/kc:docs` | Documentation lookup |

> Skills available via Skill tool (task-orchestrator, refactor-code, a11y-pass, etc.)

---

## INITIALIZATION

1. Call `init` tool from next-devtools-mcp (automatic)
2. Load Serena memories: `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`
3. Check Memory MCP for `ActiveTask`
4. If new feature: suggest `/kc:spec` first
