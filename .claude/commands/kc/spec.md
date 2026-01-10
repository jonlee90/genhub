# Command: /kc:spec

> Create comprehensive feature specifications for GenHub

## Usage

```bash
/kc:spec {feature-name}                 # Full workflow (requirement → design → plan)
/kc:spec {feature-name} --mode=req      # Requirements only
/kc:spec {feature-name} --mode=design   # Design only (requires approved requirements)
/kc:spec {feature-name} --mode=plan     # Implementation plan only (requires approved design)
```

## Description

Launches the **spec-writer** agent to create structured, comprehensive specifications for new GenHub features. Produces requirement documents, technical designs, and implementation task breakdowns with explicit approval gates at each phase.

The spec-writer agent:
- Reads `.claude/CLAUDE.md` for critical rules and constraints
- Loads `.claude/skills/index.md` to understand patterns
- References `.claude/docs/{backend,frontend,domain}/` for architecture
- Creates EARS-formatted requirements and detailed technical specifications
- Breaks work into atomic tasks for agent delegation

---

## Workflow

### Phase 1: Requirements Document

**Command**: `/kc:spec {feature-name} --mode=req` (or auto-run as first phase)

**Output**: `.claude/tasks/features/{feature-name}/requirement.md`

**Contents**:
- Feature overview
- Problem statement
- User stories (role + capability + benefit)
- Acceptance criteria (EARS format: WHEN/THE SYSTEM SHALL/WHILE/etc)
- Scope (in-scope, out-of-scope)
- Constraints and dependencies

**Approval Gate**: "Does this requirement accurately describe what needs to be built? [yes/no]"

### Phase 2: Technical Design

**Command**: `/kc:spec {feature-name} --mode=design` (or auto-run if requirements approved)

**Requires**: `requirement.md` must be approved first

**Output**: `.claude/tasks/features/{feature-name}/design.md`

**Contents**:
- Architecture overview
- **Database schema**
  - New/modified tables
  - Columns, types, constraints
  - RLS policies
  - Indexes
  - Reference doc: `.claude/docs/backend/SCHEMA_CORE.md` or `.claude/docs/backend/SCHEMA_SPATIAL.md`
- **Server Actions**
  - Function signatures
  - Input/output types
  - Error handling
  - Reference doc: `.claude/docs/indexes/actions.md`
- **Components**
  - Component hierarchy
  - Props interfaces
  - State management
  - Reference doc: `.claude/docs/frontend/DESIGN_SYSTEM.md`
- **Integration points**
  - How components call Server Actions
  - How database changes affect frontend
  - Mobile responsiveness requirements

**Approval Gate**: "Does this design accurately implement the requirements? Any architectural concerns? [yes/no]"

### Phase 3: Implementation Plan

**Command**: `/kc:spec {feature-name} --mode=plan` (or auto-run if design approved)

**Requires**: `design.md` must be approved first

**Output**: `.claude/tasks/features/{feature-name}/tasks.md`

**Contents**:
- Atomic task breakdown
- Each task includes:
  - **Task name** and description
  - **Agent**: backend-engineer, frontend-engineer, or both
  - **Required skills**: References to `.claude/skills/{category}/{skill}.md`
  - **Dependencies**: Which tasks must complete first
  - **Files**: What will be created/modified
  - **Acceptance criteria**: How to verify completion
  - **Estimated complexity**: Simple/Medium/Complex
- Task sequence order (dependency graph)
- Database migration order (if multiple tables)

**Approval Gate**: "Is the task breakdown clear and correctly sequenced? Ready to implement? [yes/no]"

---

## Full Example: Task Comments Feature

```bash
User: /kc:spec task-comments

✅ Phase 1: Requirements
Created: .claude/tasks/features/task-comments/requirement.md

## Requirement Snapshot
- Users can add comments to tasks
- Comments are timestamped with author
- Comments support mentions and emoji
- Only task team members can view/comment

[Spec-writer prompts for approval]
User: yes

✅ Phase 2: Design
Created: .claude/tasks/features/task-comments/design.md

## Design Snapshot
Database: task_comments table
  - id, task_id, user_id, content, created_at
  - RLS: project-scoped (via task→project)
  - Index: task_id

Server Actions: app/actions/comments.ts
  - getTaskComments(taskId): Comment[]
  - createComment(taskId, content): Comment
  - deleteComment(commentId): void

Components: components/comments/
  - CommentList: displays all comments
  - CommentItem: single comment with delete
  - CommentInput: textarea + submit button

[Spec-writer prompts for approval]
User: yes

✅ Phase 3: Implementation Plan
Created: .claude/tasks/features/task-comments/tasks.md

## Tasks Snapshot
Task 1: Create task_comments table
  Agent: backend-engineer
  Skills: skills/database/create-migration.md
  Files: supabase/migrations/20250109_create_task_comments.sql

Task 2: Create comment Server Actions
  Agent: backend-engineer
  Skills: skills/backend/server-action.md
  Files: app/actions/comments.ts
  Depends on: Task 1

Task 3: Create comment components
  Agent: frontend-engineer
  Skills: skills/frontend/component-patterns.md
  Files: components/comments/*.tsx
  Depends on: Task 2

Task 4: Integrate into task detail page
  Agent: frontend-engineer
  Skills: skills/frontend/page-creation.md
  Files: app/app/tasks/[id]/page.tsx
  Depends on: Task 3

Task 5: Code review & build
  Agent: code-reviewer
  Skills: skills/workflow/code-review.md
  Depends on: Task 4

[Spec-writer prompts for final approval]
User: yes

📋 Full specification complete!

Next steps:
1. Review all three documents:
   - .claude/tasks/features/task-comments/requirement.md
   - .claude/tasks/features/task-comments/design.md
   - .claude/tasks/features/task-comments/tasks.md

2. Implement with orchestrator:
   orchestrator agent: "Implement task-comments feature per spec at .claude/tasks/features/task-comments/"
```

---

## Output Structure

All output is created in `.claude/tasks/features/{feature-name}/`:

```
.claude/tasks/features/task-comments/
├── requirement.md          # User stories, acceptance criteria
├── design.md              # Database, Server Actions, Components
└── tasks.md               # Atomic tasks for agent delegation
```

### requirement.md Format
```markdown
# Requirement: {Feature Name}

## Problem Statement
[Why is this needed?]

## User Stories
- As a {role}, I want {capability} so that {benefit}

## Acceptance Criteria
- WHEN {condition} THE SYSTEM SHALL {response}
- WHILE {state} THE SYSTEM SHALL {behavior}

## Scope
- In scope: [list]
- Out of scope: [list]

## Constraints
[Dependencies, limitations, security considerations]
```

### design.md Format
```markdown
# Design: {Feature Name}

## Architecture Overview
[System diagram or description]

## Database Schema
```sql
CREATE TABLE ...
```

## Server Actions
[Function signatures and types]

## Components
[Component hierarchy]

## Integration Points
[How frontend calls backend, etc]
```

### tasks.md Format
```markdown
# Implementation Tasks: {Feature Name}

## Task 1: {Task Name}
- **Agent**: backend-engineer | frontend-engineer | both
- **Skills**: skills/database/..., skills/backend/...
- **Files**: supabase/migrations/..., app/actions/...
- **Depends on**: [Task numbers]
- **Acceptance**: [Completion criteria]

## Task 2: {Task Name}
...
```

---

## Integration with Orchestrator

After spec is complete, implement with orchestrator:

```bash
# Option 1: Create spec, then implement
/kc:spec task-comments
orchestrator: "Implement task-comments feature per spec at .claude/tasks/features/task-comments/"

# Option 2: Directly invoke orchestrator with existing spec
orchestrator: "Execute tasks at .claude/tasks/features/task-comments/tasks.md"
```

The orchestrator will:
1. Read the design
2. Delegate Phase 1 to backend-engineer (database + Server Actions)
3. Wait for completion, then delegate Phase 2 to frontend-engineer (components)
4. Delegate Phase 3 to code-reviewer
5. Run build verification
6. Report completion

---

## Spec-Writer Context

The spec-writer agent will automatically:

**Load context from**:
- `.claude/CLAUDE.md` - Critical rules, design system, agent boundaries
- `.claude/skills/index.md` - Available patterns and skills
- `.claude/docs/backend/SCHEMA_CORE.md` - Database patterns (if DB work)
- `.claude/docs/frontend/DESIGN_SYSTEM.md` - UI/component patterns (if UI work)
- `.claude/docs/domain/{FEATURE}.md` - Domain-specific patterns (if existing)

**Reference for creation**:
- Skills: `.claude/skills/workflow/feature-lifecycle.md` - Full feature workflow
- Patterns: `.claude/skills/{database,backend,frontend,domain}/*.md` - Specific patterns
- Index: `.claude/docs/indexes/` - Quick lookups for existing implementations

---

## Approval Gates

Each phase requires explicit user approval:

```
Phase 1 Requirements → ✅ Approve or ❌ Request changes
      ↓
Phase 2 Design        → ✅ Approve or ❌ Request changes
      ↓
Phase 3 Tasks         → ✅ Ready to implement or ❌ Refine
      ↓
📋 Specification Complete → Ready for /kc:impl or orchestrator
```

If you request changes, spec-writer will revise and re-present for approval.

---

## Examples

### Simple Feature: Material Status Badge
```bash
/kc:spec material-status-badge

# Fast workflow - mostly frontend, no database
# Output: 3 files in ~5 minutes
# Ready for frontend-engineer to implement
```

### Medium Feature: Expense Approval Workflow
```bash
/kc:spec expense-approval

# Database: expense_approvals table + RLS
# Backend: Server Actions for approval/rejection
# Frontend: Approval modal + status updates
# Output: 3 comprehensive files
```

### Complex Feature: 3D Spatial Markers
```bash
/kc:spec spatial-markers

# Database: Multiple tables (ifc_models, spatial_markers, marker_photos, marker_comments)
# Backend: Complex Server Actions + Supabase Realtime
# Frontend: 3D viewer integration + marker UI
# Output: Detailed specification for multi-phase implementation
```

---

## See Also

- **Implementation**:
  - `/kc:impl` - Implement from specification
  - `orchestrator` agent - Coordinate multi-agent work

- **Documentation**:
  - `skills/workflow/feature-lifecycle.md` - Full feature lifecycle
  - `agents/spec-writer.md` - Spec-writer agent details
  - `.claude/CLAUDE.md` - Architecture and rules

- **Tools**:
  - `/kc:sync-docs` - Update documentation after implementation
  - `/kc:review` - Code review checklist
  - `/kc:build` - Build verification
