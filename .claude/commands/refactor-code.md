---
allowed-tools: all
description: "Intelligently Refactor and Improve Code Quality"
---

# /refactor-code - Module Refactoring Orchestrator

> Analyze, plan, and execute refactoring for GenHub modules. Delegates to specialized agents, enforces architecture rules, and maintains code quality.

---

## CRITICAL: NEVER DO THIS (HARD FAIL)

### 1. NEVER Refactor Without Analysis First

```bash
# WRONG - Blindly start changing code
"Let me clean up this component..."
*starts editing without reading*

# CORRECT - Always analyze first
1. Load Serena memories for context
2. Grep/search for usage patterns
3. Understand dependencies
4. THEN plan refactoring
```

### 2. NEVER Delete Code Without Understanding Usage

```bash
# WRONG - Delete "unused" function
"This function looks unused, removing it..."

# CORRECT - Verify references first
1. mcp__plugin_serena_serena__find_referencing_symbols
2. Grep for dynamic imports/string references
3. Check if exported from index files
4. THEN decide on deletion
```

### 3. NEVER Break Architecture Rules

```tsx
// WRONG - Introduce Supabase in client during refactor
'use client'
import { createClient } from '@/utils/supabase/server'  // VIOLATION

// WRONG - Replace ResponsiveModal with Dialog
import { Dialog } from '@/components/ui/dialog'  // VIOLATION

// CORRECT - Maintain existing patterns
// If fixing violations, move Supabase to Server Action
// If standardizing modals, convert TO ResponsiveModal
```

### 4. NEVER Refactor Across Agent Boundaries Without Handoff

```bash
# WRONG - Backend engineer refactors component styles
# WRONG - Frontend engineer modifies Server Actions

# CORRECT - Delegate appropriately
Backend work (Server Actions, DB) -> backend-engineer
Frontend work (Components, UI) -> frontend-engineer
```

### 5. NEVER Refactor Without Tests Passing First

```bash
# WRONG - Start refactoring broken code
/refactor-code tasks  # Build already failing

# CORRECT - Ensure baseline first
1. Run /kc:build
2. Fix any existing errors
3. THEN proceed with refactoring
```

---

## YOUR AUTHORITY (What You CAN Do)

| Allowed | Examples |
|---------|----------|
| Analyze code structure | Find duplicates, identify patterns |
| Load context | Serena memories, skill files, indexes |
| Plan refactoring | Create actionable task breakdown |
| Delegate to agents | Task() calls to specialized agents |
| Coordinate handoffs | Sequential agent work |
| Validate results | Build verification, doc sync |

| NOT Allowed | Why |
|-------------|-----|
| Direct code changes | Delegate to agents |
| Skip analysis phase | Leads to broken refactors |
| Ignore architecture rules | Introduces violations |
| Parallel agents on same files | Causes conflicts |

---

## USAGE

```
/refactor-code [target] [--type=TYPE] [--scope=SCOPE]
```

### Target Formats

| Format | Example | Meaning |
|--------|---------|---------|
| Module name | `tasks` | All files in tasks domain |
| Domain | `expenses` | components/expenses + app/actions/expenses.ts |
| Component dir | `components/ui` | All files in directory |
| Action file | `app/actions/projects.ts` | Single Server Action file |
| Component file | `components/tasks/TaskCard.tsx` | Single component |
| Path pattern | `components/tasks/*.tsx` | Glob pattern |

### Type Flags

| Flag | Description | Primary Agent |
|------|-------------|---------------|
| `--type=cleanup` | Remove dead code, simplify logic | Auto-detect |
| `--type=consolidate` | Merge duplicates, extract utilities | Auto-detect |
| `--type=types` | Improve type safety, remove `any` | Both |
| `--type=architecture` | Fix violations (Supabase, Dialog, etc.) | Depends |
| `--type=performance` | Optimize queries, reduce re-renders | Both |
| `--type=mobile` | Improve touch targets, PWA patterns | frontend-engineer |
| (default) | Full analysis, recommend type | Auto |

### Scope Flags

| Flag | Description |
|------|-------------|
| `--scope=frontend` | Components only |
| `--scope=backend` | Server Actions only |
| `--scope=full` | Both (default) |

### Examples

```bash
# Refactor entire tasks module
/refactor-code tasks

# Clean up expense components only
/refactor-code expenses --scope=frontend --type=cleanup

# Fix architecture violations in projects
/refactor-code projects --type=architecture

# Improve mobile experience for task list
/refactor-code components/tasks --type=mobile

# Consolidate duplicate utilities
/refactor-code lib/utils --type=consolidate

# Type safety pass on Server Actions
/refactor-code app/actions --type=types
```

---

## REFACTORING TYPES (Detailed)

### cleanup - Remove Dead Code, Simplify Logic

**Targets:**
- Unused imports
- Unreachable code paths
- Overly complex conditionals
- Commented-out code blocks
- Redundant state

**Agent Selection:**
- `.tsx` files -> frontend-engineer
- `app/actions/*.ts` -> backend-engineer
- Mixed -> Sequential delegation

### consolidate - Merge Duplicates, Extract Utilities

**Targets:**
- Duplicate functions across files
- Similar components with minor variations
- Repeated inline logic
- Copy-pasted validation schemas

**Common Extractions:**
- Shared hooks -> `lib/hooks/`
- Shared utilities -> `lib/utils/`
- Shared types -> `types/`
- Shared components -> `components/ui/`

### types - Improve Type Safety

**Targets:**
- `any` type usage
- Missing return types
- Loose prop interfaces
- Implicit any in callbacks
- Missing generic constraints

**Priority Order:**
1. Server Actions (data integrity)
2. Shared utilities (wide impact)
3. Components (UI safety)

### architecture - Fix Violations

**Common Violations:**
| Violation | Fix | Agent |
|-----------|-----|-------|
| Supabase in client | Move to Server Action | backend-engineer |
| Dialog usage | Replace with ResponsiveModal | frontend-engineer |
| fetch() in client | Use Server Component/Action | backend-engineer |
| Non-Lucide icons | Replace with Lucide | frontend-engineer |
| Custom colors | Use design system | frontend-engineer |

### performance - Optimize

**Frontend:**
- Unnecessary re-renders
- Missing memoization
- Large component bundles
- Unoptimized images

**Backend:**
- N+1 queries
- Missing indexes (via MCP advisors)
- Overfetching data
- Missing select() specificity

### mobile - PWA Improvements

**Targets:**
- Touch targets < 44px
- Missing active: states
- vh instead of dvh
- Missing safe-area-inset
- Hover-only interactions

**Skill Required:** `mobile-pwa-design/SKILL.md` and  `refactor-code/SKILL.md`

---

## EXECUTION WORKFLOW

### Phase 1: Parse & Context (Orchestrator)

```
1. Parse target and type from arguments
2. Determine affected files:
   - Module name -> Resolve to component + action paths
   - Path -> Expand globs
   - File -> Single file

3. Load Serena memories:
   read_memory("genhub-common-gotchas")  // Always
   read_memory("genhub-component-patterns")  // If frontend
   read_memory("genhub-server-actions")  // If backend
   read_memory("genhub-domain-{module}")  // If domain-specific

4. Run baseline build check:
   /kc:build (must pass before refactoring)
```

### Phase 2: Analysis (Orchestrator)

```
1. Classify files by type:
   - Frontend: components/**/*.tsx, app/**/*Client.tsx
   - Backend: app/actions/*.ts, app/api/**/*.ts
   - Shared: lib/**, types/**, utils/**

2. Scan for issues based on --type:
   cleanup     -> Dead code, unused imports
   consolidate -> Duplicates, similar patterns
   types       -> any usage, missing types
   architecture-> Violation patterns (grep)
   performance -> Query patterns, memo usage
   mobile      -> Touch target patterns

3. Create refactoring plan:
   - Group by agent authority
   - Order by dependency (backend before frontend)
   - Estimate complexity
```

### Phase 3: Delegation (Orchestrator)

**Single-Agent Pattern (one authority):**

```
Task(
  subagent_type="frontend-engineer",
  prompt="Refactor components in $TARGET

  Type: $TYPE
  Issues found:
  1. [Issue from analysis]
  2. [Issue from analysis]

  Skills to load:
  - frontend/component-patterns.md
  - mobile-pwa-design/SKILL.md (if mobile)

  Context:
  - Serena memories loaded: genhub-component-patterns
  - Existing patterns in similar components

  Constraints:
  - Preserve all public interfaces
  - Maintain backward compatibility
  - Follow GenHub design system

  ORCHESTRATED=true"
)
```

**Multi-Agent Pattern (both authorities):**

```
# Step 1: Backend first (if modifying data layer)
Task(
  subagent_type="backend-engineer",
  prompt="Refactor Server Actions in app/actions/{module}.ts

  Type: $TYPE
  Changes needed:
  1. [Backend issue]

  Return: Modified interfaces for frontend handoff

  ORCHESTRATED=true"
)

# Step 2: Frontend uses updated backend
Task(
  subagent_type="frontend-engineer",
  prompt="Refactor components in components/{module}/

  Type: $TYPE
  Backend changes:
  - [Interfaces from step 1]

  ORCHESTRATED=true"
)
```

### Phase 4: Validation (Orchestrator)

```
1. Run /kc:build
2. If fails:
   - Analyze error
   - Delegate fix to appropriate agent
   - Re-validate (max 2 attempts)

3. If passes:
   - Run /kc:sync-docs
   - Generate summary
```

---

## AGENT REFERENCE

### Core Agents

| Agent | Authority | Refactoring Types |
|-------|-----------|-------------------|
| `backend-engineer` | Server Actions, queries, types | cleanup, consolidate, types, performance |
| `frontend-engineer` | Components, styling, client state | cleanup, consolidate, types, mobile, architecture (UI) |
| `code-reviewer` | Review changes, catch issues | Post-refactor validation |

### Agent Selection Matrix

| Target | Type | Agent |
|--------|------|-------|
| `app/actions/*.ts` | any | backend-engineer |
| `components/**/*.tsx` | any | frontend-engineer |
| `lib/hooks/*.ts` | any | frontend-engineer |
| `types/*.ts` | types | backend-engineer |
| Module (both) | any | backend-engineer THEN frontend-engineer |

---

## SKILL LOADING BY TYPE

| Refactoring Type | Skills to Load |
|------------------|----------------|
| cleanup (backend) | `backend/server-action.md`, `backend/nextjs-patterns.md` |
| cleanup (frontend) | `frontend/component-patterns.md` |
| consolidate | `backend/server-action.md` OR `frontend/component-patterns.md` |
| types | `backend/validation.md`, `backend/server-action.md` |
| architecture | Agent configs (for rules reference) |
| performance (backend) | `database/indexes.md`, MCP advisors |
| performance (frontend) | `frontend/component-patterns.md` |
| mobile | `mobile-pwa-design/SKILL.md`, `/frontend-design` |

---

## TOKEN BUDGET

**Orchestrator Cap: 25k tokens (typical: 10-20k)**

Budget allocation:
- Context loading: ~3k (memories, skill files)
- Analysis: ~5k (grep, pattern search)
- Delegation: ~2k per agent call
- Validation: ~3k (build, sync)

**Agent Budgets (from their configs):**
- backend-engineer: 35k
- frontend-engineer: 45k
- code-reviewer: 15k

### Efficiency Rules

1. Load Serena memories FIRST (instant context)
2. Use Grep before Read (find exact locations)
3. Delegate with FULL context (minimize agent re-reads)
4. Single agent session per scope
5. Pass file PATHS, not file CONTENTS

---

## OUTPUT FORMAT

```
## /refactor-code Execution Complete

### Target
Module: [module name or path]
Type: [refactoring type]
Scope: [frontend/backend/full]

### Analysis Summary
Files analyzed: [count]
Issues found: [count by category]

### Agent Execution
| Agent | Work Done | Files Modified | Status |
|-------|-----------|----------------|--------|
| backend-engineer | [summary] | [count] | [pass/skip] |
| frontend-engineer | [summary] | [count] | [pass/skip] |

### Changes Made
- `[path]`: [description of change]
- `[path]`: [description of change]

### Improvements
- [x] Removed N unused imports
- [x] Extracted M shared utilities
- [x] Fixed K type violations
- [x] Improved touch targets in L components

### Build Status
[pass/fail]

### Documentation Updated
- [x] components.md (if applicable)
- [x] actions.md (if applicable)

### Next Steps
[if any follow-up needed]
```

---

## STOP CONDITIONS

Halt and request guidance if:

- Target not found or ambiguous
- Baseline build fails (fix first)
- Refactoring would break public interfaces
- Architecture violation requires design decision
- Changes affect >10 files (needs explicit approval)
- Cross-module dependencies unclear
- Agent reports handoff needed outside scope
- Approaching 25k tokens

---

## QUICK DECISION GUIDE

```
User says: /refactor-code tasks

You do:
1. Parse: target=tasks, type=auto, scope=full
2. Resolve paths:
   - components/tasks/**/*.tsx
   - app/actions/tasks.ts
3. Load memories: genhub-domain-tasks, genhub-common-gotchas
4. Run /kc:build (baseline)
5. Analyze: scan for all refactoring opportunities
6. Recommend type or use specified
7. Delegate:
   - backend-engineer for app/actions/tasks.ts
   - frontend-engineer for components/tasks/
8. Validate: /kc:build
9. Sync: /kc:sync-docs
10. Report results

Total budget: < 25k tokens (orchestration)
```

---

## COMMON REFACTORING SCENARIOS

### Scenario 1: Clean Up Task Components

```bash
/refactor-code tasks --type=cleanup --scope=frontend

Analysis finds:
- 12 unused imports in TaskList.tsx
- 3 unreachable code paths in TaskCard.tsx
- Commented-out debug code in TaskModal.tsx

Delegation:
Task(frontend-engineer, "Clean up components/tasks/...")

Result:
- 15 unused imports removed
- 3 dead code paths eliminated
- 127 lines of code removed
- Build passes
```

### Scenario 2: Fix Architecture Violations

```bash
/refactor-code expenses --type=architecture

Analysis finds:
- Dialog component in ExpenseModal.tsx (should be ResponsiveModal)
- Supabase import in ExpenseForm.tsx (client component!)
- Custom colors in ExpenseCard.tsx

Delegation:
1. Task(backend-engineer, "Extract Supabase logic to Server Action")
2. Task(frontend-engineer, "Replace Dialog with ResponsiveModal, fix colors")

Result:
- New Server Action: getExpenseDetails()
- ExpenseModal now uses BaseModal
- All colors from design system
- Build passes
```

### Scenario 3: Consolidate Duplicate Code

```bash
/refactor-code components/tasks --type=consolidate

Analysis finds:
- TaskCard and MobileTaskCard share 80% logic
- formatDate() duplicated in 4 files
- Similar loading states in 6 components

Delegation:
Task(frontend-engineer, "
1. Extract shared TaskCardBase component
2. Move formatDate to lib/utils/date.ts
3. Create LoadingState component
")

Result:
- New components: TaskCardBase, LoadingState
- New util: lib/utils/date.ts
- 340 lines of code consolidated
- Build passes
```

### Scenario 4: Improve Mobile Experience

```bash
/refactor-code tasks --type=mobile

Analysis finds:
- Touch targets 32px (need 44px)
- No active: states on buttons
- Using vh instead of dvh
- Missing safe-area-inset

Delegation:
Task(frontend-engineer, "
Load: mobile-pwa-design/SKILL.md

Fix mobile issues in components/tasks/:
- Increase touch targets to 44px
- Add active: states
- Replace vh with dvh
- Add safe-area-inset padding
")

Result:
- All touch targets >= 44px
- active: states on all interactive elements
- Mobile viewport handling corrected
- Build passes
```

---

## SERENA MEMORY QUICK REFERENCE

| Memory | Use Case |
|--------|----------|
| `genhub-common-gotchas` | ALWAYS - avoid common mistakes |
| `genhub-component-patterns` | Frontend refactoring |
| `genhub-server-actions` | Backend refactoring |
| `genhub-domain-tasks` | Tasks module |
| `genhub-domain-projects` | Projects module |
| `genhub-domain-expenses` | Expenses module |
| `genhub-domain-materials` | Materials module |
| `genhub-domain-spatial` | 3D/Spatial features |

---

## SEE ALSO

- `/kc:impl` - Implement from specification
- `/kc:spec` - Create feature specifications
- `/kc:build` - Build verification
- `/kc:sync-docs` - Documentation sync
- `.claude/agents/` - Agent configurations
- `.claude/skills/` - Skill files
