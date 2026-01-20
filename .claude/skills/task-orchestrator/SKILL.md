---
name: task-orchestrator
description: Intelligent task delegation to specialized agents (frontend-engineer, backend-engineer, code-reviewer). Analyzes task requirements, determines optimal agent(s), and decides between sequential or parallel dispatch. Use when (1) Task involves coding work that could benefit from specialized agents, (2) Task spans multiple domains (backend + frontend), (3) Multiple independent subtasks exist, (4) Need to coordinate handoffs between agents. Triggers on "implement", "build", "create feature", "fix bug", "refactor", multi-domain tasks, or when orchestration would improve efficiency.
---

# Task Orchestrator Skill

> **Purpose:** Coordinate multi-agent work for complex features. Delegate to specialized agents, manage handoffs, decide parallel vs sequential execution.

---

## Quick Decision Flow

```
Task received
    │
    ├─ Multiple independent subtasks? ──────────────┐
    │                                               │
    │   YES: Dispatch parallel agents               │
    │   NO: Continue below                          ▼
    │                                    [PARALLEL DISPATCH]
    │
    ├─ Backend + Frontend needed?
    │   YES: Sequential orchestration (Backend → Frontend → Review)
    │   NO: Continue below
    │
    ├─ Backend only? → Delegate directly to backend-engineer
    │
    ├─ Frontend only? → Delegate directly to frontend-engineer
    │
    └─ Review/fix only? → Delegate directly to code-reviewer
```

---

## Agent Selection

| Agent | Domain | Authority | Tools |
|-------|--------|-----------|-------|
| **backend-engineer** | Database, Server Actions, API routes, RLS | NO UI changes | Supabase MCP, Bash |
| **frontend-engineer** | UI, components, styling, client state | NO database access | Read, Edit, Write |
| **code-reviewer** | Review, validation, testing, bug fixes | NO new features | Read, Grep, Bash |

### Domain Keywords

| Keywords | Agent |
|----------|-------|
| migration, table, RLS, policy, Server Action, database, query | backend-engineer |
| component, page, UI, form, modal, button, style, Tailwind | frontend-engineer |
| review, test, validate, bug, fix, check, audit | code-reviewer |

---

## Parallel vs Sequential

### When to Dispatch Parallel Agents

**Criteria (ALL must be true):**
- [ ] Tasks are independent (no shared state)
- [ ] Agents won't edit the same files
- [ ] No type/data dependencies between tasks
- [ ] Tasks can complete without context from each other

**Examples of parallel-safe tasks:**
- Multiple independent UI components
- Multiple code reviews
- Documentation tasks
- Different subsystems with no shared state

**Execution:**
```
# Send multiple Task calls in ONE message
Task(frontend-engineer, "Build ComponentA")
Task(frontend-engineer, "Build ComponentB")
# Both run concurrently
```

### When to Run Sequential

**Criteria (ANY triggers sequential):**
- Tasks share TypeScript types
- Tasks modify same files
- Build order dependency exists
- Backend creates something frontend consumes

**Common sequential patterns:**
- Migration → Type generation → Code using types
- Backend creates actions → Frontend consumes them
- Component → Tests for that component

**Execution:**
```
Task(backend-engineer, "Create actions") → wait for result
Task(frontend-engineer, "Build UI using actions")
```

---

## Standard Workflow (Multi-Domain)

### Phase 1: Analyze

1. Identify required domains: Database? Actions? UI? Review?
2. Determine dependencies between tasks
3. Plan: Sequential where dependent, parallel where safe

### Phase 2: Backend (if needed)

```
Task(
  subagent_type="backend-engineer",
  prompt="""
  ORCHESTRATED=true

  Feature: {name}
  Spec: {path or description}

  Tasks:
  - [ ] Migration (if needed)
  - [ ] Server Actions
  - [ ] Generate types (if schema changed)

  Return: status, files modified, function exports
  """
)
```

**Extract from result:** file paths, function signatures, types

### Phase 3: Frontend (if needed)

```
Task(
  subagent_type="frontend-engineer",
  prompt="""
  ORCHESTRATED=true

  Feature: {name}
  Spec: {path or description}

  Backend provides:
  - Actions: {file path from Phase 2}
  - Functions: {signatures}
  - Types: Import from types/db/{domain}.ts

  Tasks:
  - [ ] Components
  - [ ] Pages
  - [ ] Wire Server Actions
  - [ ] Loading/error states

  Return: status, files modified
  """
)
```

### Phase 4: Review

```
Task(
  subagent_type="code-reviewer",
  prompt="""
  Post-implementation review for {feature}

  Files:
  - Backend: {from Phase 2}
  - Frontend: {from Phase 3}

  Focus: acceptance criteria, integration, mobile (375px, 44px touch)

  Return: approved | needs-fixes (with details)
  """
)
```

### Phase 5: Build & Sync

```bash
/kc:sync-docs
/kc:build 2>&1 | grep -E "error|Error" -A 3
```

---

## Handoff Protocol

### Backend → Frontend

```
HANDOFF → frontend-engineer

Files: app/actions/{feature}.ts
Actions: {function names}
Types: Import from types/db/{domain}.ts
Task: {UI requirements}
Mobile: {yes/no}
```

### Frontend → Review

```
HANDOFF → code-reviewer

Files: {component and page paths}
Backend: {action file path}
Focus: integration, acceptance, mobile
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Build fail (TS in actions) | → backend-engineer |
| Build fail (TS in components) | → frontend-engineer |
| Build fail (lint) | → code author |
| Agent blocked | Clarify context, retry |
| Agent fails 2x | Report to user |

---

## ORCHESTRATED=true Mode

When delegating to agents in orchestrated mode:

**Agent behavior:**
- Skip `/kc:build` and `/kc:sync-docs`
- Return status summary only (no lengthy explanations)
- Focus on completing assigned tasks

**Orchestrator responsibilities:**
- Run final build/sync after all phases
- Coordinate handoffs with context
- Handle build errors by re-delegating

---

## Output Format

```markdown
## Implementation Complete

### Files
- Backend: {paths}
- Frontend: {paths}

### Spec Verification
- [x] Requirement 1
- [x] Requirement 2

### Build
✅ Pass | ❌ Fail (details)

### Next Steps
{follow-up items if any}
```

---

## Stop Conditions

Halt and request guidance:

- Spec unclear or missing
- Circular dependency detected
- Agent fails twice on same task
- Security concern identified
- Task requires Supabase in client component

---

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Skip orchestrator for multi-domain | Always orchestrate backend + frontend |
| Parallel with type dependencies | Run sequential |
| Skip review phase | Always run code-reviewer |
| Run build before review | Review → Build order |
| Too broad agent prompt | Specific scope per agent |
| No constraints | Add "Do NOT change..." limits |

---

## Quick Examples

### Full Feature (Backend + Frontend)

```
1. Task(backend-engineer, "ORCHESTRATED=true. Create Server Actions for {feature}")
   → Wait, extract: actions file, function signatures

2. Task(frontend-engineer, "ORCHESTRATED=true. Build UI for {feature}. Actions at {path}")
   → Wait, extract: component files

3. Task(code-reviewer, "Review {feature} integration. Files: {list}")
   → Wait for approval

4. Run /kc:build, /kc:sync-docs
```

### Independent Components (Parallel)

```
# Single message with multiple Task calls
Task(frontend-engineer, "ORCHESTRATED=true. Build TaskCard component")
Task(frontend-engineer, "ORCHESTRATED=true. Build TaskFilters component")
# Both run simultaneously
```

### Backend Only (Direct Delegation)

```
# Skip orchestrator entirely
Task(backend-engineer, "Create Server Actions for expense tracking")
```

---

## References

For detailed information, see:
- `references/delegation-matrix.md` - Full agent capabilities and boundaries
- `references/prompt-templates.md` - Complete prompt templates for each agent
