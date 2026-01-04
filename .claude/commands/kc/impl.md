---
allowed-tools: all
description: "Implement task specifications with automated review and testing"
---

# /kc:impl - Task Specification Executor

> Orchestrator for GenHub task files. Reads specs, delegates to agents, validates results.

---

## CRITICAL: NEVER DO THIS (HARD FAIL)

### 1. NEVER Implement Code Yourself

```typescript
// WRONG - You are an orchestrator, not an implementer
export function TaskCard() { ... }     // NEVER write components
await supabase.from('tasks').insert()  // NEVER write queries
className="bg-[#001B51]"               // NEVER write styles

// CORRECT - Delegate to specialized agents
Task(subagent_type="agent-frontend-engineer", prompt="...")
Task(subagent_type="agent-backend-engineer", prompt="...")
```

### 2. NEVER Launch Multiple Agent Sessions for Same Task Set

```
# WRONG - Wastes tokens (context reload each session)
Task(agent-frontend-engineer, "P3.1-P3.4")
Resume(agent_id, "P3.5-P3.7")
Resume(agent_id, "P3.8-P3.9")

# CORRECT - Single session with all tasks
Task(agent-frontend-engineer, "Implement P3.1-P3.9: [full context]")
```

### 3. NEVER Run Backend + Frontend in Parallel for Same Feature

```
# WRONG - Creates type mismatches
Task(agent-backend-engineer, "Create API")
Task(agent-frontend-engineer, "Build form")  // Parallel = broken types

# CORRECT - Sequential with handoff
1. agent-backend-engineer → Server Action with types
2. agent-frontend-engineer → UI using those types
```

### 4. NEVER Skip Task File Validation

```
# WRONG
"Let me start implementing task 0001..."

# CORRECT
1. Verify file exists: ./docs/specs/{feature}/tasks/0001-*.md
2. Read task file completely
3. Then delegate
```

---

## YOUR AUTHORITY (What You CAN Do)

| Allowed | Examples |
|---------|----------|
| Read task specs | `./docs/specs/{feature}/tasks/*.md` |
| Analyze requirements | Categorize as backend/frontend/both |
| Delegate to agents | Task() calls to specialized agents |
| Coordinate handoffs | Pass Server Action paths to frontend |
| Validate completion | Check task requirements are met |
| Update task file | Mark checkboxes, add notes |

---

## USAGE

```
/kc:impl [task-reference]
```

### Supported Formats

| Format | Example | Meaning |
|--------|---------|---------|
| Task ID | `0001` | Single task file `./docs/specs/*/tasks/0001-*.md` |
| Task range | `0001-0005` | Tasks 0001 through 0005 |
| Task list | `0001,0003,0007` | Specific tasks |
| Phase ref | `P3.1` or `P3.1-P3.9` | Phase-numbered tasks |
| Path | `docs/specs/auth/tasks/` | All tasks in directory |
| Explicit | `phase 3 in docs/specs/feature/tasks.md` | Natural language |

---

## EXECUTION WORKFLOW

### Step 1: Find & Validate Task File

```
Location pattern: ./docs/specs/{feature-name}/tasks/
File pattern: {NNNN}-{slug}.md (e.g., 0001-redesign-card.md)

IF file not found:
  → List available specs: ls ./docs/specs/
  → Ask user to clarify
  → STOP

IF file empty or malformed:
  → Report issue
  → STOP
```

### Step 2: Categorize Work

Read the task file and classify each requirement:

```
Backend work (→ agent-backend-engineer):
- [ ] Database schema changes
- [ ] Server Actions (app/actions/*.ts)
- [ ] API routes (app/api/*.ts)
- [ ] RLS policies
- [ ] Auth logic

Frontend work (→ agent-frontend-engineer):
- [ ] UI components
- [ ] Styling/layout
- [ ] Client state
- [ ] Form handling

Review work (→ agent-code-reviewer):
- [ ] Security audit
- [ ] Type validation
- [ ] Build verification
```

### Step 3: Select Agent(s)

```
DECISION TREE:

Is this pure backend work?
├─ YES → agent-backend-engineer only
│        Then agent-code-reviewer
│
└─ NO → Is this pure frontend work?
        ├─ YES → agent-frontend-engineer only
        │        Then agent-code-reviewer
        │
        └─ NO → Full-stack feature
                 1. agent-backend-engineer (database + Server Actions)
                 2. agent-frontend-engineer (UI using backend types)
                 3. agent-code-reviewer (full review)
```

### Step 4: Delegate with Full Context

**Single-Agent Pattern (most tasks):**

```
Task(
  subagent_type="agent-frontend-engineer",
  prompt="Implement tasks P3.1-P3.9 from spec at docs/specs/feature/tasks/0001.md

  Requirements:
  1. [Requirement from spec]
  2. [Requirement from spec]

  Context:
  - Server Action available at: app/actions/feature.ts
  - Use frontend-design plugin

  Complete ALL tasks in this single session."
)
```

**Multi-Agent Pattern (full-stack):**

```
# Step 1: Backend first
Task(
  subagent_type="agent-backend-engineer",
  prompt="Per spec at docs/specs/feature/tasks/0001.md, implement:
  1. Database migration for [table]
  2. Server Actions: [list specific actions]

  Return: File paths and function signatures for frontend handoff"
)

# Step 2: Frontend uses backend output
Task(
  subagent_type="agent-frontend-engineer",
  prompt="Per spec at docs/specs/feature/tasks/0001.md, implement:
  1. [UI requirement]
  2. [UI requirement]

  Backend provides:
  - Server Action: app/actions/feature.ts
  - Types: CreateFeatureInput, Feature

  Use frontend-design plugin."
)

# Step 3: Review
Task(
  subagent_type="agent-code-reviewer",
  prompt="Review implementation against spec at docs/specs/feature/tasks/0001.md

  Files changed:
  - [list from previous steps]

  Verify: Types match, build passes, spec requirements met"
)
```

### Step 5: Validate & Update Task File

```
After agent completion:
1. Verify build: /kc:build
2. Update task file:
   - [x] Mark completed items
   - Add "Implemented: [date]" note
   - Document any deviations
3. Report results
```

---

## AGENT REFERENCE

### Core Agents

| Agent | Authority | When to Use |
|-------|-----------|-------------|
| `agent-backend-engineer` | Database, Server Actions, API, Auth, RLS | Any data layer work |
| `agent-frontend-engineer` | UI components, styling, client state | Any presentation work |
| `agent-code-reviewer` | Review, testing, security, fixes | ALWAYS after implementation |

### Specialized Agents (Use Sparingly)

| Agent | Use When |
|-------|----------|
| `kiro-executor` | Ad-hoc spec docs NOT in `./docs/specs/*/tasks/` format |
| `ai-sdk-v5-expert` | Vercel AI SDK v5 integration specifically |
| `technical-documentation-writer` | User manuals, tutorials (not code docs) |

---

## TOKEN BUDGET

**Cap: 20k tokens (typical: 5-15k)**

Orchestration should be lightweight. Most tokens go to delegated agents.

### Efficiency Rules

1. Read task file ONCE, extract all requirements
2. Delegate with FULL context (minimize agent re-reads)
3. Single agent session per task set
4. Pass file PATHS, not file CONTENTS
5. Sequential agents, not parallel

### Resume ONLY When

- User explicitly requests to continue previous work
- Agent hit token limit mid-task (unexpected)
- Critical error requiring restart

---

## OUTPUT FORMAT

```
## /kc:impl Execution Complete

### Task Reference
Spec: [path to task file]
Tasks: [IDs implemented]

### Agent Execution
| Agent | Work Done | Status |
|-------|-----------|--------|
| agent-backend-engineer | [summary] | [pass/skip] |
| agent-frontend-engineer | [summary] | [pass/skip] |
| agent-code-reviewer | [summary] | [pass/fail] |

### Files Changed
- `[path]`: [description]
- `[path]`: [description]

### Task File Updated
- [x] [Requirement 1]
- [x] [Requirement 2]
- [ ] [Requirement 3] - Deferred: [reason]

### Build Status
[pass/fail]

### Next Steps
[if any follow-up needed]
```

---

## STOP CONDITIONS

Halt and request guidance if:

- Task file not found at expected path
- Task requirements are ambiguous or conflicting
- Backend/frontend boundary unclear for a requirement
- Agent reports handoff needed outside its authority
- Build fails after agent-code-reviewer pass
- Approaching 20k tokens

---

## QUICK DECISION GUIDE

```
User says: /kc:impl 0001

You do:
1. Find: ./docs/specs/*/tasks/0001-*.md
2. Read task file
3. Classify: backend? frontend? both?
4. Delegate (sequential if both)
5. Run agent-code-reviewer
6. Update task file
7. Report results

Total time: < 20k tokens
```
