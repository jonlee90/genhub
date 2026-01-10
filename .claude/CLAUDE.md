# CLAUDE.md - GenHub PWA Global Rules

> CRITICAL rules. Load BEFORE any work. Non-negotiable.

---

## SAFETY RULES (HARD FAIL)

### 1. Supabase Client Isolation
```
NEVER in 'use client' files:
  - import from '@/utils/supabase/*'
  - import { createClient } from '@supabase/supabase-js'
  - any Supabase SDK usage

ALWAYS use:
  - Server Actions (app/actions/*.ts)
  - API Routes (app/api/*)
  - Server Components for data fetching
```
**Violation causes:** `Module not found: Can't resolve 'child_process'`

### 2. Architecture Separation
- **Client components** (`'use client'`): UI, interactions, local state only
- **Server Actions/Routes**: ALL database, auth, mutations
- **No mixing**: Each file has ONE responsibility

### 3. BaseModal Only
- ✓ Use: `<BaseModal isOpen={} onClose={} />`
- ✗ Never: `<Dialog>` component

---

## PROJECT CONTEXT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 14+, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness → Token efficiency → Consistency → Speed

---

## AGENT LOADING STRATEGY

**BEFORE starting ANY task, execute in this order:**

```
1. ALWAYS load: .claude/CLAUDE.md (this file - core rules)
2. SCAN indexes (1-2 minutes): Find what exists
   → .claude/docs/indexes/tables.md (if backend)
   → .claude/docs/indexes/actions.md (if backend)
   → .claude/docs/indexes/components.md (if frontend)
   → .claude/docs/indexes/routes.md (if frontend)
3. LOAD skill on demand: Task-specific patterns
   → .claude/skills/index.md (find skill path)
   → .claude/skills/{category}/{skill}.md (read full)
4. GREP codebase: Find existing similar code
   → Verify patterns before reinventing
5. THEN implement: Execute skill instructions
```

---

## SKILL LOADING (MANDATORY)

Before **ANY** work:

1. **Identify task type** from user request
2. **Check index**: `.claude/skills/index.md`
3. **Load skill file(s)**: Read relevant skill
4. **Follow instructions**: Execute skill patterns
5. **Run doc sync**: After completion (if skill specifies)

### Quick Skill Matrix

| Task | Skill | Agent |
|------|-------|-------|
| New database table | `skills/database/create-migration.md` | backend |
| Alter table | `skills/database/modify-schema.md` | backend |
| Server Action | `skills/backend/server-action.md` | backend |
| New page | `skills/frontend/page-creation.md` | frontend |
| Form UI | `skills/frontend/form-patterns.md` | frontend |
| Modal | `skills/frontend/modal-patterns.md` | frontend |
| GenHub feature | `skills/domain/{feature}.md` | both |

---

## AGENT REFERENCE

| Agent | Authority | Budget | Tools |
|-------|-----------|--------|-------|
| **frontend-engineer** | UI, styling, client state | 45k | frontend-design |
| **backend-engineer** | Database, APIs, Server Actions | 35k | MCP Supabase |
| **code-reviewer** | Review, testing, fixes | 15k | Read, Grep, Bash |
| **spec-writer** | Requirements, design, planning | 60k | All |
| **orchestrator** | Multi-agent coordination | 20k | All |

**Boundaries are strict.** Task crosses boundary? Handoff explicitly.

---

## ORCHESTRATION SIGNALS (CRITICAL)

When orchestrator delegates work to specialized agents, it passes context flags. Agents MUST check these flags to avoid redundant work:

### Control Flags

| Flag | Value | Meaning | Agent Action |
|------|-------|---------|--------------|
| `ORCHESTRATED` | `true` | Called by orchestrator (not standalone) | Skip build, sync; return status only |
| `SKIP_BUILD` | `true` | Don't run `/kc:build` | Skip even if normally required |
| `SKIP_SYNC` | `true` | Don't run `/kc:sync-docs` | Skip; orchestrator handles consolidated sync |

### Example: Orchestrator Delegation

```
ORCHESTRATED=true SKIP_BUILD=true SKIP_SYNC=true

Task(subagent_type="backend-engineer", prompt="""
  ...implementation prompt...

  CONTEXT: ORCHESTRATED=true
  - Skip: /kc:build, /kc:sync-docs
  - Return: status, files modified, issues only
""")
```

### How Agents Use Flags

**In agent execution protocol, check at start:**

```
if (ORCHESTRATED) {
  // Called by orchestrator
  // Do: implementation + CRITICAL checks
  // Skip: build, sync
  // Return: status only
} else {
  // Independent execution
  // Do: full workflow including build + sync
}
```

---

## QUICK LOOKUP

### Index Files (scan first, load full doc on demand)
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

## QUICK REFERENCE

### When to Use What

| Task | Use |
|------|-----|
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
- **Primary**: `#001B51` (Navy)
- **Accent**: `#3C3C3C` (Gray)
- **Success**: `#059669`
- **Error**: `#DC2626`
- **Warning**: `#F59E0B`

### UI Rules
- Icons: Lucide only
- Modals: `BaseModal` only (never `Dialog`)
- Fonts: System default
- Decoration: Minimal (no riveted borders, hazard stripes, gradients)

---

## POST-CHANGE PROTOCOL (Context-Aware)

### When ORCHESTRATED=true (Called by Orchestrator)

Agents skip individual build/sync because orchestrator will run consolidated build/sync at end.

```
1. Complete implementation
2. Run CRITICAL violation checks only:
   - Stop immediately if any CRITICAL issue found
   - Fix in place, don't continue
3. Return to orchestrator:
   - Status: success/failure
   - Files modified: [list]
   - Any CRITICAL issues: [list]
4. Skip: /kc:build, /kc:sync-docs
```

**Return format:**
```
Status: ✓ completed | ✗ failed
Files: [paths modified]
Issues: [CRITICAL issues if any]
```

### When Independent Mode (Normal)

```
1. Complete implementation
2. Run all checks (CRITICAL, HIGH, MEDIUM)
   - Fix issues before proceeding
3. Update documentation:
   /kc:sync-docs --source=path/to/change
4. Verify build:
   /kc:build
5. Report results: Show sync output and build status
```

**For agent-specific protocols, see:**
- frontend-engineer.md → EXECUTION PROTOCOL (now includes mode detection)
- backend-engineer.md → EXECUTION PROTOCOL (now includes mode detection)
- code-reviewer.md → PHASE 0 CONTEXT CHECK (determines review scope)

---

## TOKEN DISCIPLINE

### Read Strategy
1. Grep/search first, then Read with offset+limit
2. Batch multiple small reads in one tool call
3. Full file reads only for: <200 lines, configs
4. Build logs: `npm run build 2>&1 | grep -E "error|Error" -A 3`

### Budgets (hard caps)
- backend-engineer: 35k max
- frontend-engineer: 45k max
- code-reviewer: 15k max

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

## AGENT ACTION LOGGING & AUDIT REPORTING

All agents MUST log actions and produce an **Audit Report** at end of task.

### Audit Report Format

```md
## 🧾 Agent Audit Report

**Agent:** frontend-engineer | backend-engineer | code-reviewer
**Task Type:** UI / Backend / Review
**Task Complexity:** Simple / Complex

### Actions Taken
- Planned before implementation: Yes / No
- Tools used: [list]
- Files read: [path – reason]
- Files modified: [path – reason]

### Decisions & Reasoning
- Key decisions
- Tradeoffs considered
- Rules relied upon

### Issues Encountered
- Ambiguities
- Missing docs
- Conflicting rules

### Token & Efficiency Notes
- Estimated usage
- Unnecessary reads
- Improvement suggestions
```

---

## DOCUMENTATION SYNC SYSTEM

Prevent documentation drift by tracking dependencies and auto-updating affected docs.

### Dependency Graph

**File**: `.claude/docs/dependencies.json`

Maps code sources to docs that depend on them:
```
database/tasks → docs/indexes/tables.md
              → docs/backend/SCHEMA_CORE.md
              → docs/indexes/enums.md

actions/tasks.ts → docs/indexes/actions.md
                → docs/domain/TASKS.md

components/tasks/** → docs/indexes/components.md
```

### Auto-Sync Triggers

After **ANY** code change, update affected indexes:

| Change Type | Auto-Sync Index | Manual Review Docs |
|-------------|-----------------|-------------------|
| Table add/modify | `docs/indexes/tables.md` | `docs/backend/SCHEMA_*.md` |
| Server Action | `docs/indexes/actions.md` | `docs/domain/{FEATURE}.md` |
| Component add/change | `docs/indexes/components.md` | `docs/frontend/COMPONENTS.md` |
| Route add/change | `docs/indexes/routes.md` | `docs/frontend/LAYOUTS.md` |

### Sync Workflow

**After database migration:**
```
1. mcp__supabase__generate_typescript_types
2. Update docs/indexes/tables.md
3. Update docs/indexes/enums.md
4. Review docs/backend/SCHEMA_*.md for changes
5. /kc:build
```

**After Server Action:**
```
1. Update docs/indexes/actions.md
2. Review docs/domain/{FEATURE}.md
3. /kc:build
```

**After component:**
```
1. Update docs/indexes/components.md
2. Review docs/frontend/COMPONENTS.md
3. /kc:build
```

**After route:**
```
1. Update docs/indexes/routes.md
2. Review docs/frontend/LAYOUTS.md
3. /kc:build
```

### Quick Command

```bash
/kc:sync-docs    # Auto-update all indexes + manual review checklist
```

---

## SEE ALSO

- `.claude/skills/` — Task-specific instructions (load before work)
- `.claude/docs/indexes/` — Quick lookups (auto-synced from code)
- `.claude/docs/{backend,frontend,domain}/` — Reference docs (manual sync)
- `.claude/docs/dependencies.json` — Dependency graph for sync automation
- `.claude/agents/` — Agent configurations
- `.claude/commands/kc/` — Available commands

