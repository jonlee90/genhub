# CLAUDE.md - GenHub PWA

> CRITICAL rules loaded BEFORE any work. Non-negotiable.

---

## CRITICAL RULES (HARD FAIL)

### Supabase Client Isolation
- **NEVER** in `'use client'` files: Supabase SDK, `createClient`, `@/utils/supabase/*`
- **ALWAYS** use: Server Actions (`app/actions/*.ts`), API Routes, Server Components
- Violation causes: `Module not found: Can't resolve 'child_process'`

### Architecture Separation
| Layer | Responsibilities | DB Access |
|-------|-----------------|-----------|
| Client (`'use client'`) | UI, interaction, local state | NEVER |
| Server (Actions/Components) | Mutations, queries, data | YES |

---

## PROJECT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 15, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness > Token efficiency > Consistency > Speed
**Details**: `.claude/docs/core/STACK.md`

---

## BEFORE YOU START

1. **Load Skills**: Check `.claude/skills/index.md` for task-specific patterns
2. **Load Serena Memories** (MCP runtime):
   ```
   mcp__plugin_serena_serena__read_memory("genhub-{topic}")
   ```
   Available: `project-overview`, `database-schema`, `server-actions`, `component-patterns`, `common-gotchas`

---

## AGENTS

| Agent | Authority | Budget |
|-------|-----------|--------|
| backend-engineer | Database, Server Actions, APIs | 35k |
| frontend-engineer | UI, styling, client state | 45k |
| code-reviewer | Review, testing, validation | 15k |
| spec-writer | Requirements, design, planning | 60k |
| orchestrator | Multi-agent coordination | 20k |
| frontend-architect | UI planning, Aceternity research | planning |
| performance-engineer | Query/bundle optimization | 30k |
| supabase-schema-architect | Schema/RLS design | planning |
| ai-sdk-v5-expert | AI SDK implementation | planning |
| technical-documentation-writer | Documentation creation | planning |

**Audit agents**: `.claude/agents/audit/` (7 specialists)
**Boundaries are strict.** Cross-boundary work requires explicit handoff.

---

## COMMANDS

| Command | Purpose |
|---------|---------|
| `/kc:spec --mode={requirements\|design\|plan\|full}` | Feature specification |
| `/kc:impl [task-id]` | Implement tasks from spec |
| `/kc:build` | TypeScript + ESLint + build |
| `/kc:sync-docs` | Sync documentation indexes |
| `/kc:gen-index` | Regenerate index files |
| `/kc:docs [target] [type]` | Create documentation |
| `/kc:research-ui [topic]` | Aceternity UI patterns |
| `/kc:research-ai-sdk [topic]` | AI SDK v5 patterns |
| `/kc:update-dependencies` | Maintain dependencies.json |
| `/refactor-code` | Intelligent code refactoring |

---

## DOCUMENTATION MAP

### Indexes (auto-synced)
`.claude/docs/indexes/` → `tables.md`, `actions.md`, `components.md`, `enums.md`, `routes.md`

### Core
| File | Content |
|------|---------|
| `core/RULES.md` | Safety rules reference |
| `core/STACK.md` | Technology details |
| `core/AUDIT.md` | Audit report format |

### Backend
`.claude/docs/backend/` → `SCHEMA_CORE.md`, `SCHEMA_ENUMS.md`, `SCHEMA_RLS.md`, `SCHEMA_SPATIAL.md`, `SERVER_ACTIONS.md`

### Frontend
`.claude/docs/frontend/` → `DESIGN_SYSTEM.md`, `LAYOUTS.md`, `RESPONSIVE.md`, `COMPONENTS.md`

### Domain
`.claude/docs/domain/` → `PROJECTS.md`, `TASKS.md`, `MATERIALS.md`, `SPATIAL.md`

---

## ORCHESTRATION

| Flag | Agent Action |
|------|--------------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run `/kc:build` |
| `SKIP_SYNC=true` | Don't run `/kc:sync-docs` |

**Protocol**: `.claude/agents/orchestrator.md`

---

## TOKEN DISCIPLINE

**Budgets**: backend: 35k | frontend: 45k | reviewer: 15k | orchestrator: 20k | perf: 30k
**Strategy**: Grep/search first → Read with offset+limit → Full file only if <200 lines
**Build logs**: `npm run build 2>&1 | grep -E "error|Error" -A 3`

---

## STOP CONDITIONS

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Required context file missing
- Approaching token cap

---

## SEE ALSO

- **Skills**: `.claude/skills/index.md`
- **Agents**: `.claude/agents/`
- **Commands**: `.claude/commands/kc/`
- **Design System**: `.claude/docs/frontend/DESIGN_SYSTEM.md`
- **Rules**: `.claude/docs/core/RULES.md`
