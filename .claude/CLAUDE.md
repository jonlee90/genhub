# CLAUDE.md - GenHub PWA

> Construction PWA for general contractors | Mobile-first | Next.js 16 + React 19 + Supabase

---

## BEFORE YOU CODE (Read Every Time)

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. WHAT am I changing?                                                │
│     └─ .tsx/.jsx file? → Load vercel-react-best-practices skill FIRST  │
│     └─ Server Action?  → Load postgres-best-practices:postgres-best-practices skill FIRST      │
│     └─ Database?       → Delegate to backend-engineer                  │
│                                                                        │
│  2. WHO should do this?                                                │
│     └─ UI only         → frontend-engineer                             │
│     └─ DB/Auth only    → backend-engineer                              │
│     └─ Both            → backend-engineer THEN frontend-engineer       │
│                                                                        │
│  3. WHAT must I report?                                                │
│     └─ Skills Applied: [list rules used]                               │
│     └─ Mobile Checks:  ✓ 44px | ✓ active | ✓ dark                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 BLOCKING RULES (Will Fail Build/Task)

| Rule | How To Detect | Result |
|------|---------------|--------|
| No Supabase in `'use client'` | `createClient` or `@/utils/supabase/*` in client component | Build error |
| Server Actions for DB | Direct DB calls in components | **REJECT** |
| ResponsiveModal only | `<Dialog` from Radix | **REJECT** |
| Lucide icons only | heroicons/fontawesome imports | **REJECT** |
| 44px touch targets | Missing `min-h-[44px]` on buttons/links | **FIX** |
| **Skills loaded** | React change without `vercel-react-best-practices` | **STOP** |

```
DB ACCESS RULES:
'use client'      → ❌ NEVER (UI only)
Server Actions    → ✅ YES (mutations, queries)
Server Components → ✅ YES (data fetching, SSR)
```

---

## SKILL → FILE MAPPING (Mandatory)

| File Pattern | Required Skill | Key Rules |
|--------------|----------------|-----------|
| `*.tsx`, `*.jsx` | `vercel-react-best-practices` | `bundle-*`, `rerender-*`, `rendering-*` |
| `app/actions/*.ts` | `postgres-best-practices:postgres-best-practices` | `query-*`, `security-*` |
| `components/**/*.tsx` | `vercel-react-best-practices` + `a11y-pass` | Touch, ARIA, contrast |
| `supabase/migrations/*` | `postgres-best-practices:postgres-best-practices` | `schema-*`, `security-*` |

**Before editing any file, check this table and load the required skill.**

---

## AGENT DISPATCH

| Task | Agent | Skill Required |
|------|-------|----------------|
| UI component, styling, forms | `frontend-engineer` | vercel-react-best-practices |
| Server Action, API route | `backend-engineer` | postgres-best-practices:postgres-best-practices |
| Schema, migration, RLS | `backend-engineer` | postgres-best-practices:postgres-best-practices |
| Review/testing | `code-reviewer` | By file pattern |
| UI + DB feature | `backend-engineer` → `frontend-engineer` → `code-reviewer` | Sequential |

---

## OUTPUT FORMAT (All Agents)

```markdown
## Task Complete

**Status:** ✓ completed | ✗ failed | ⚠️ partial (N/M)
**Files:** `path/file.ts` - description

**Skills Applied:** bundle-barrel-imports, rerender-memo, async-parallel
**Mobile Checks:** ✓ 44px | ✓ active states | ✓ dark mode | ✓ safe areas

**Build:** ✓ pass | ✗ fail
**Handoff:** → {agent}: {reason}
```

---

## DESIGN TOKENS

| Token | Value |
|-------|-------|
| Primary | `#001B51` |
| Accent | `#3C3C3C` |
| Touch target | 44px min (`min-h-[44px] min-w-[44px]`) |
| Viewport | `dvh` not `vh` |
| Safe area | `pb-[env(safe-area-inset-bottom)]` |
| Icons | Lucide only |
| Modals | `ResponsiveModal` only |

---

## MCP TOOLS

| Tool | When |
|------|------|
| **Serena** `read_memory` | Load `genhub-component-patterns`, `genhub-server-actions`, `genhub-database-schema` |
| **Serena** `find_symbol` | Find existing patterns before writing |
| **Context7** | External library docs |
| **Supabase MCP** | Schema ops (backend-engineer only) |
| **Memory MCP** | Track decisions, active tasks |

---

## STOP CONDITIONS

Halt and ask for guidance:
- Build fails 2x on same error
- Task crosses agent boundary (UI ↔ DB)
- Security advisor returns critical
- **React/TSX change without loading skill first**
- Token budget >70% (report progress)

---

## IMPORTS CHEAT SHEET

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
| `/kc:spec {feature}` | Create spec: requirements → design → tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:build` | Verify build passes |
