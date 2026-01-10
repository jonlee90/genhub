# Skill: Feature Lifecycle

> Full spec-to-implementation workflow for GenHub features

## When to Use

- New feature development
- Complex multi-file changes
- Features requiring both frontend and backend work
- Any task that benefits from structured planning

## Prerequisites

- Understand the feature requirements
- Have access to relevant law docs
- Know which agents will be involved

---

## Quick Reference

### Phase Overview
```
1. Requirements  → spec-writer creates requirement doc
2. Design        → spec-writer creates design doc
3. Planning      → spec-writer creates task breakdown
4. Implementation → orchestrator delegates to agents
5. Review        → code-reviewer validates
6. Build         → /kc:build verifies
7. Doc Sync      → Update all affected indexes
```

---

## Phase 1: Requirements

### Gather Context
```markdown
## Requirements Document Structure

### Feature: [Feature Name]

### Problem Statement
What problem does this solve?

### User Stories
- As a [role], I want [capability] so that [benefit]

### Acceptance Criteria (EARS format)
- WHEN [trigger] THE SYSTEM SHALL [response]
- WHILE [state] THE SYSTEM SHALL [behavior]

### Scope
- In scope: [list]
- Out of scope: [list]

### Dependencies
- Database tables needed
- Server Actions needed
- Components needed
```

### Save Location
```
.claude/tasks/features/{feature-name}/requirement.md
```

---

## Phase 2: Design

### Technical Design Structure
```markdown
## Technical Design: [Feature Name]

### Architecture Overview
[How it fits in the system]

### Database Schema
```sql
-- New/modified tables
```

### Server Actions
```typescript
// Action signatures with types
```

### Components
- Component hierarchy
- Props interfaces
- State management

### API Contracts
- Input types
- Output types
- Error types
```

### Save Location
```
.claude/tasks/features/{feature-name}/design.md
```

---

## Phase 3: Planning

### Task Breakdown Structure
```markdown
## Implementation Tasks: [Feature Name]

### Prerequisites
- [ ] Read relevant law docs
- [ ] Load required skills

### Task 1: Database Schema
- Agent: backend-engineer
- Skills: database/create-migration.md
- Files: supabase/migrations/YYYYMMDD_*.sql
- Acceptance: Tables created, RLS enabled

### Task 2: Server Actions
- Agent: backend-engineer
- Skills: backend/server-action.md
- Files: app/actions/{feature}.ts
- Acceptance: Actions work, types generated

### Task 3: UI Components
- Agent: frontend-engineer
- Skills: frontend/component-patterns.md
- Files: components/{feature}/*.tsx
- Acceptance: Components render correctly

### Task 4: Page Integration
- Agent: frontend-engineer
- Skills: frontend/page-creation.md
- Files: app/app/{feature}/page.tsx
- Acceptance: Page loads with data
```

### Save Location
```
.claude/tasks/features/{feature-name}/tasks.md
```

---

## Phase 4: Implementation

### Orchestrator Delegation
```
1. Read tasks.md
2. For each task:
   a. Spawn appropriate agent
   b. Provide task context
   c. Wait for completion
   d. Validate output
3. Track progress in tasks.md
4. Handle blockers/errors
```

### Agent Handoff Format
```markdown
## Task Assignment

**Agent:** backend-engineer
**Task:** Create material_orders table
**Skills to Load:**
- skills/database/create-migration.md
- skills/database/rls-patterns.md

**Context:**
[Relevant design excerpt]

**Acceptance Criteria:**
- [ ] Table created with proper columns
- [ ] RLS enabled with company isolation
- [ ] Indexes on foreign keys
- [ ] Types regenerated
```

---

## Phase 5: Review

### Code Review Checklist
```markdown
## Review: [Feature Name]

### Security
- [ ] No Supabase in client components
- [ ] RLS policies in place
- [ ] Input validation on actions

### Architecture
- [ ] Correct agent boundaries
- [ ] Server Actions for mutations
- [ ] Props passed correctly

### UI
- [ ] BaseModal used (not Dialog)
- [ ] Lucide icons only
- [ ] Mobile responsive
- [ ] Construction theme colors

### Documentation
- [ ] Indexes updated
- [ ] Types regenerated
- [ ] Comments where needed
```

---

## Phase 6: Build Verification

### Build Command
```bash
npm run build 2>&1 | grep -E "error|Error" -A 3
```

### Common Fixes
| Error | Fix |
|-------|-----|
| `Can't resolve 'child_process'` | Remove Supabase from client component |
| Type error | Regenerate types, fix imports |
| Missing export | Check component exports |

---

## Phase 7: Doc Sync

### Required Updates
```
After ANY feature implementation:

1. Database changes → docs/indexes/tables.md
2. Server Actions → docs/indexes/actions.md
3. Components → docs/indexes/components.md
4. Routes → docs/indexes/routes.md
5. Enums → docs/indexes/enums.md
```

### Sync Script
```bash
/kc:update-doc  # Runs doc sync skill
```

---

## Complete Workflow Example

### Feature: Task Comments

```
1. REQUIREMENTS
   spec-writer creates:
   .claude/tasks/features/task-comments/requirement.md

2. DESIGN
   spec-writer creates:
   .claude/tasks/features/task-comments/design.md

3. PLANNING
   spec-writer creates:
   .claude/tasks/features/task-comments/tasks.md

   Tasks:
   - Task 1: Create task_comments table (backend)
   - Task 2: Create comment Server Actions (backend)
   - Task 3: Create CommentList component (frontend)
   - Task 4: Add comments tab to task detail (frontend)

4. IMPLEMENTATION
   orchestrator delegates:
   - backend-engineer: Tasks 1, 2
   - frontend-engineer: Tasks 3, 4

5. REVIEW
   code-reviewer validates all changes

6. BUILD
   /kc:build runs npm run build

7. DOC SYNC
   Update indexes/tables.md with task_comments
   Update indexes/actions.md with comment actions
   Update indexes/components.md with CommentList
```

---

## Anti-Patterns

```markdown
# WRONG: Skip requirements
"Just code it, we'll figure out the design later"
→ Leads to rework, inconsistent architecture

# WRONG: One agent does everything
frontend-engineer creates database tables
→ Violates agent boundaries

# WRONG: Skip doc sync
Feature complete, forget to update indexes
→ Stale documentation, future confusion

# WRONG: No acceptance criteria
"Make a comments feature"
→ Ambiguous scope, unclear when done
```

---

## Checklist

- [ ] Requirements documented with acceptance criteria
- [ ] Design covers database, actions, components
- [ ] Tasks assigned to correct agents
- [ ] Each task references required skills
- [ ] Code review covers security, architecture, UI
- [ ] Build passes without errors
- [ ] All indexes updated
- [ ] Types regenerated if schema changed
