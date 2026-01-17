# GenHub Skills Index

> Task-specific instruction modules for agents. Load BEFORE executing work.

Last updated: 2026-01-10

---

## Quick Lookup

### By Task Type

| Task | Skill | Agent |
|------|-------|-------|
| New database table | `database/create-migration.md` | backend-engineer |
| Alter existing table | `database/modify-schema.md` | backend-engineer |
| Add RLS policy | `database/rls-patterns.md` | backend-engineer |
| Add enum type | `database/enums.md` | backend-engineer |
| Create Server Action | `backend/server-action.md` | backend-engineer |
| Backend security/patterns | `backend/nextjs-patterns.md` | backend-engineer, code-reviewer |
| Create API route | `backend/api-route.md` | backend-engineer |
| **UI creation/redesign** | **`/frontend-design`** | **frontend-engineer** |
| **Mobile PWA/native feel** | **`frontend/mobile-pwa-design/SKILL.md`** | **frontend-engineer** |
| New page | `frontend/page-creation.md` | frontend-engineer |
| Form with validation | `frontend/form-patterns.md` | frontend-engineer |
| Modal dialog | `frontend/modal-patterns.md` | frontend-engineer |
| List/Table/Kanban | `frontend/list-patterns.md` | frontend-engineer |
| Project CRUD | `domain/project-crud.md` | both |
| Task workflow | `domain/task-workflow.md` | both |
| Material tracking | `domain/material-tracking.md` | both |
| Expense workflow | `domain/expense-workflow.md` | both |
| Chat/realtime | `domain/chat-realtime.md` | both |
| 3D spatial markers | `domain/spatial-markers.md` | both |
| **Parallel task dispatch** | **`dispatching-parallel-agents/SKILL.md`** | **orchestrator** |
| **Refactor/deduplicate UI** | **`refactor-code/SKILL.md`** | **frontend-engineer** |

### By Agent

#### backend-engineer
- `database/create-migration.md` - New tables with RLS
- `database/modify-schema.md` - ALTER TABLE patterns
- `database/rls-patterns.md` - RLS cookbook
- `database/indexes.md` - Index optimization
- `database/enums.md` - Enum management
- `database/triggers.md` - Trigger patterns
- `backend/server-action.md` - CRUD action patterns
- `backend/nextjs-patterns.md` - Security-first GenHub conventions
- `backend/api-route.md` - Route handlers
- `backend/validation.md` - Zod patterns
- `backend/error-handling.md` - Error responses
- `backend/auth-check.md` - Auth verification

#### frontend-engineer
- **`/frontend-design` - Production-grade UI (ALWAYS use for new UI/redesign)**
- **`frontend/mobile-pwa-design/SKILL.md` - Native mobile feel, PWA optimization**
- **`refactor-code/SKILL.md` - Deduplicate similar components, extract base patterns**
- `frontend/page-creation.md` - New page setup
- `frontend/component-patterns.md` - Component architecture
- `frontend/form-patterns.md` - Forms with validation
- `frontend/modal-patterns.md` - BaseModal usage
- `frontend/list-patterns.md` - List/Table/Kanban
- `frontend/responsive.md` - Mobile-first patterns

#### Both Agents (Domain)
- `domain/project-crud.md` - Project management
- `domain/task-workflow.md` - Task state machine
- `domain/material-tracking.md` - Material assignment
- `domain/expense-workflow.md` - Expense approval
- `domain/chat-realtime.md` - Chat patterns
- `domain/spatial-markers.md` - 3D marker patterns

#### Integration
- `integration/supabase-mcp.md` - MCP tool usage
- `integration/vercel-ai-sdk.md` - AI SDK v5 patterns
- `integration/file-upload.md` - Vercel Blob
- `integration/push-notifications.md` - FCM patterns

#### code-reviewer
- `backend/nextjs-patterns.md` - Security-first backend conventions (for backend reviews)
- `workflow/code-review.md` - Review checklist

#### Workflow
- `workflow/feature-lifecycle.md` - Full spec→implement flow
- `workflow/code-review.md` - Review checklist
- `workflow/doc-sync.md` - Doc synchronization

#### Orchestration
- `dispatching-parallel-agents/SKILL.md` - Parallel agent dispatch for independent tasks

---

## Skill Loading Protocol

### For Agents

Before starting ANY work:

1. **Identify task type** from user request
2. **Check this index** for relevant skills
3. **Load skill file(s)** with Read tool
4. **Follow skill instructions** exactly
5. **Run doc sync** after completion (if skill specifies)

### Mandatory Loading Matrix

| Task Type | Required Skills | Optional Skills |
|-----------|-----------------|-----------------|
| Database schema change | `database/create-migration.md` OR `database/modify-schema.md` | `database/rls-patterns.md` |
| New Server Action | `backend/server-action.md` | `backend/nextjs-patterns.md` |
| **UI creation/redesign** | **`/frontend-design`** | Related frontend skills |
| New page | `/frontend-design` + `frontend/page-creation.md` | `frontend/responsive.md` |
| Form UI | `/frontend-design` + `frontend/form-patterns.md` | `frontend/modal-patterns.md` |
| Mobile native feel | `frontend/mobile-pwa-design/SKILL.md` | `frontend/responsive.md` |
| Refactor/deduplicate UI | `refactor-code/SKILL.md` | `frontend/component-patterns.md` |
| GenHub domain feature | `domain/{feature}.md` | Related backend/frontend skills |
| Multiple independent tasks | `dispatching-parallel-agents/SKILL.md` | - |

---

## Skill File Format

All skills follow this structure:

```markdown
# Skill: {Name}

## When to Use
[Trigger conditions]

## Prerequisites
[Required context]

---

## Quick Reference
[80% use case - copy-paste ready]

---

## Step-by-Step
[Detailed for complex cases]

---

## Examples
[Concrete code examples]

---

## Anti-Patterns
[What NOT to do]

---

## Affected Documentation
[What to update after using this skill]

---

## Checklist
[Verification steps]
```

---

## Stats

- **Total skills**: 31 (complete)
- **Database**: 6 skills ✓
- **Backend**: 6 skills ✓
- **Frontend**: 8 skills ✓ (includes mobile-pwa-design, refactor-code)
- **Domain**: 6 skills ✓
- **Integration**: 4 skills ✓
- **Workflow**: 3 skills ✓
- **Orchestration**: 1 skill ✓

---

## Adding New Skills

1. Create file in appropriate category directory
2. Follow the skill file format above
3. Add entry to this index
4. Update `dependencies.json` if skill affects docs

---

## See Also

- **Index files**: `.claude/docs/indexes/` - Quick lookup tables
- **Law docs**: `.claude/docs/law/` - Authoritative rules
- **Agent prompts**: `.claude/agents/` - Agent configurations
