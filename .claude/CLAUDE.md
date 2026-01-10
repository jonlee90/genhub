# CLAUDE.md - GenHub PWA Global Rules

> CRITICAL rules. Load BEFORE any work. Non-negotiable.

---

## SAFETY RULES (HARD FAIL)

### Supabase Client Isolation
- **NEVER** in `'use client'` files: import Supabase SDK, `createClient`, or `@/utils/supabase/*`
- **ALWAYS** use: Server Actions (`app/actions/*.ts`), API Routes, Server Components
- **Violation causes:** `Module not found: Can't resolve 'child_process'`

### Architecture Separation
- **Client** (`'use client'`): UI, interactions, local state only
- **Server**: ALL database, auth, mutations
- **No mixing**: Each file has ONE responsibility

### UI Rules
- Modals: `<BaseModal>` only - NEVER `<Dialog>`
- Icons: Lucide only

---

## PROJECT CONTEXT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 15, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness > Token efficiency > Consistency > Speed

---

## SKILL LOADING

Before ANY work: Load relevant skill from `.claude/skills/index.md`

See: `.claude/skills/index.md` for complete loading protocol and skill matrix

---

## SERENA MEMORY SYSTEM

Before ANY work, load relevant Serena memories for instant context:

| Memory | Use When |
|--------|----------|
| `genhub-project-overview` | Starting any task (project structure) |
| `genhub-database-schema` | Backend work (tables, relationships) |
| `genhub-server-actions` | Backend work (action signatures) |
| `genhub-component-patterns` | Frontend work (UI patterns) |
| `genhub-common-gotchas` | Any work (avoid common mistakes) |

**Load with:** `mcp__plugin_serena_serena__read_memory("memory-name")`
**List all:** `mcp__plugin_serena_serena__list_memories()`

---

## AGENT REFERENCE

| Agent | Authority | Budget |
|-------|-----------|--------|
| frontend-engineer | UI, styling, client state | 45k |
| backend-engineer | Database, APIs, Server Actions | 35k |
| code-reviewer | Review, testing, fixes | 15k |
| spec-writer | Requirements, design, planning | 60k |
| orchestrator | Multi-agent coordination | 20k |

**Boundaries are strict.** Task crosses boundary? Handoff explicitly.

---

## ORCHESTRATION FLAGS

| Flag | Agent Action |
|------|--------------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run `/kc:build` |
| `SKIP_SYNC=true` | Don't run `/kc:sync-docs` |

See: `.claude/agents/orchestrator.md` for full protocol

---

## QUICK LOOKUP

### Indexes
- **Tables**: `.claude/docs/indexes/tables.md`
- **Actions**: `.claude/docs/indexes/actions.md`
- **Components**: `.claude/docs/indexes/components.md`
- **Enums**: `.claude/docs/indexes/enums.md`
- **Routes**: `.claude/docs/indexes/routes.md`
- **Skills**: `.claude/skills/index.md`

### Reference Docs
- **Backend schema**: `.claude/docs/backend/SCHEMA_*.md`
- **Frontend design**: `.claude/docs/frontend/DESIGN_SYSTEM.md`
- **Domain features**: `.claude/docs/domain/{FEATURE}.md`

---

## COMMANDS

| Task | Command |
|------|---------|
| New feature requirements | `/kc:spec --mode=requirements` |
| Technical design | `/kc:spec --mode=design` |
| Task planning | `/kc:spec --mode=plan` |
| Full spec workflow | `/kc:spec --mode=full` |
| UI research | `/kc:research-ui [topic]` |
| AI SDK research | `/kc:research-ai-sdk [topic]` |
| Implement tasks | `/kc:impl [task-id]` |
| Sync documentation | `/kc:sync-docs` |
| Regenerate indexes | `/kc:gen-index` |

---

## DESIGN SYSTEM

### Colors
- **Primary**: `#001B51` (Navy) | **Accent**: `#3C3C3C` (Gray)
- **Success**: `#059669` | **Error**: `#DC2626` | **Warning**: `#F59E0B`

### Rules
- Icons: Lucide only
- Modals: `BaseModal` only (never `Dialog`)
- Fonts: System default
- Decoration: Minimal

See: `.claude/docs/frontend/DESIGN_SYSTEM.md` for full system

---

## TOKEN DISCIPLINE

### Read Strategy
1. Grep/search first, then Read with offset+limit
2. Batch multiple small reads in one tool call
3. Full file reads only for: <200 lines, configs
4. Build logs: `npm run build 2>&1 | grep -E "error|Error" -A 3`

### Budgets (hard caps)
- backend-engineer: 35k | frontend-engineer: 45k | code-reviewer: 15k

Stop early and request continuation if approaching cap.

---

## STOP CONDITIONS

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Design rules conflict
- Required context file missing
- Approaching token cap

---

## POST-CHANGE PROTOCOL

| Mode | Action |
|------|--------|
| `ORCHESTRATED=true` | CRITICAL checks only; return status, files, issues |
| Independent | Full checks; run `/kc:sync-docs` then `/kc:build` |

See: Agent files for detailed execution protocols

---

## AUDIT REPORTING

All agents produce audit report at task completion.

See: `.claude/docs/core/AUDIT.md` for format

---

## SEE ALSO

- `.claude/skills/` - Task-specific instructions (load before work)
- `.claude/skills/workflow/doc-sync.md` - Documentation sync protocol
- `.claude/docs/indexes/` - Quick lookups (auto-synced from code)
- `.claude/docs/{backend,frontend,domain}/` - Reference docs
- `.claude/agents/` - Agent configurations
- `.claude/commands/kc/` - Available commands
