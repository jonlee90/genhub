# CLAUDE.md - GenHub PWA

## CRITICAL (HARD FAIL)

- **NEVER** Supabase SDK/`createClient`/`@/utils/supabase/*` in `'use client'` files
- **ALWAYS** use Server Actions (`app/actions/*.ts`), API Routes, or Server Components for DB
- Violation causes: `Module not found: Can't resolve 'child_process'`

| Layer | Access | Responsibilities |
|-------|--------|------------------|
| Client (`'use client'`) | NO DB | UI, interaction, local state |
| Server (Actions/Components) | YES DB | Mutations, queries, data |

---

## PROJECT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 15, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness > Token efficiency > Consistency > Speed

---

## BEFORE WORK

1. Load skills: `.claude/skills/index.md`
2. Load Serena memories: `genhub-{project-overview|database-schema|server-actions|component-patterns|common-gotchas}`
3. Use `dispatching-parallel-agents` skill when helpful

---

## AGENTS (strict boundaries)

**With budgets**: backend-engineer(70k), frontend-engineer(80k), code-reviewer(30k), orchestrator(30k), performance-engineer(50k)

**Planning-only**: frontend-architect, supabase-schema-architect, ai-sdk-v5-expert, technical-documentation-writer

**Audit agents**: `.claude/agents/audit/` (7 specialists)

---

## DOCS & COMMANDS

- **Indexes**: `.claude/docs/indexes/` (tables, actions, components, enums, routes)
- **Core/Backend/Frontend/Domain**: `.claude/docs/{core|backend|frontend|domain}/`
- **Commands**: `.claude/skills/index.md` for all `/kc:*` commands

---

## TOKEN DISCIPLINE

**Strategy**: Grep/search first → Read with offset+limit → Full file only if <200 lines
**Build logs**: `npm run build 2>&1 | grep -E "error|Error" -A 3`

---

## ORCHESTRATION FLAGS

| Flag | Effect |
|------|--------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run `/kc:build` |
| `SKIP_SYNC=true` | Don't run `/kc:sync-docs` |

---

## STOP CONDITIONS

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Required context file missing
- Approaching token cap
