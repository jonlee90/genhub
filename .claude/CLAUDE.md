# CLAUDE.md - GenHub PWA

> Construction project management for general contractors | Mobile-first PWA

---

## HARD RULES (Build Failures)

| Rule | Violation | Consequence |
|------|-----------|-------------|
| No Supabase in `'use client'` | `createClient` in client | `Module not found: 'child_process'` |
| ResponsiveModal only | `<Dialog` from Radix | Inconsistent mobile UX |
| Lucide icons only | heroicons/fontawesome | Bundle bloat |
| 44px touch targets | Missing on interactive | Failed accessibility |
| Server Actions for DB | Direct DB in components | Security violation |

```
'use client'     → ❌ NO DB  → UI, interactions, local state
Server Actions   → ✅ YES DB → Mutations, queries, auth
Server Components→ ✅ YES DB → Data fetching, SSR
```

---

## PROJECT

**Stack:** Next.js 16, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Design:** Primary `#001B51`, Accent `#3C3C3C`, 44px touch, `dvh` not `vh`, **dark mode always included**

---

## SKILLS (Auto-Loaded)

| Skill | Rules Applied |
|-------|---------------|
| `vercel-react-best-practices` | `async-*`, `bundle-*`, `server-*`, `rerender-*`, `rendering-*` |
| `postgres-best-practices` | `query-*`, `security-*`, `schema-*`, `data-*` |

**By File Pattern:**
```
*.tsx            → rendering-*, rerender-*, bundle-*
app/actions/*.ts → query-*, security-*, data-*
app/**/page.tsx  → async-*, server-*
hooks/**/*.ts    → rerender-*, advanced-*
```

---

## MCP TOOLS

| Tool | Purpose |
|------|---------|
| **Serena** | `find_symbol`, `read_memory`, `search_for_pattern` |
| **Memory MCP** | Decisions, active tasks, bug patterns |
| **Context7** | `resolve-library-id` → `query-docs` |
| **Supabase MCP** | `list_tables`, `execute_sql`, `apply_migration` |

**Session:** `mcp__memory__read_graph()` → Load Serena memories → Check `ActiveTask`

---

## AGENT DISPATCH

| Task Type | Agent |
|-----------|-------|
| Server Action, API, RLS | `backend-engineer` |
| Components, styling, forms | `frontend-engineer` |
| Post-implementation review | **OpenCode GPT-5.2** |

**Flow:** Parse → TodoWrite → Dispatch → Validate → Handoff → Report

**Dispatch:**
- Same domain → Single agent
- Mixed independent → Parallel agents
- Mixed dependent → Sequential: backend → frontend → OpenCode

**NO .md FILES:** Never create reports, audits, or documentation files unless explicitly requested (handoffs excluded)

---

## OPENCODE HANDOFF

**When:** New component, multi-file fix, refactoring
**Skip:** Single-line fix, config change, type-only

```
1. Validate: npx tsc --noEmit && npm run lint
2. Create: .claude/handoffs/claude-to-opencode-{YYYYMMDD-HHMM}.md
3. Notify user: "Handoff created for OpenCode review"
```

| Agent | Responsibilities |
|-------|------------------|
| `code-reviewer` | Validate, reusability scan, debug |
| `refactor-specialist` | Deep refactoring, pattern extraction |
| `component-scanner` | Module analysis |
| `tailwind-optimizer` | HTML/CSS cleanup |

---

## TOKEN DISCIPLINE

| Rule | How |
|------|-----|
| Search first | `find_symbol`, Grep/Glob before reads |
| Targeted reads | `offset`+`limit` for files >200 lines |
| Batch edits | Combine adjacent changes |
| Parallel calls | Group independent operations |

---

## TASK COMPLETION REPORT

**REQUIRED:** After every task completion, report:
```
✅ Task Complete

Tokens: {input}/{limit} ({percentage}%)
Agents: {agent-names or "None"}
Skills: {skill-names or "None"}
Context: {files-read-count} files, {symbols-count} symbols
```

---

## STOP CONDITIONS

- Agent boundary violation
- Context missing from Serena/Memory MCP
- Build fails 2x on same error
- Security advisor returns critical

---

## COMMANDS

| Command | Purpose |
|---------|---------|
| `/kc:spec {feature}` | Create requirements → design → tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:audit {module}` | Security, performance, quality audit |

---

## INITIALIZATION

1. Load Serena: `genhub-database-schema`, `genhub-server-actions`, `genhub-component-patterns`
2. Check Memory MCP for `ActiveTask`
3. If new feature: suggest `/kc:spec`
