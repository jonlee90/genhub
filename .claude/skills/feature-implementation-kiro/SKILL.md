---
name: feature-implementation-kiro
description: "Kiro-style feature implementation from spec files. Orchestrates backend-engineer, frontend-engineer, and code-reviewer agents in sequence. Use when implementing features from .claude/specs/ directory."
---

# Feature Implementation (Kiro Style)

Implement features from spec files using multi-agent orchestration.

## Trigger

- User references a spec file path
- User says "implement from spec"
- `/kc:impl {spec-path}` command

## Prerequisites

Spec directory must contain:
```
.claude/specs/{feature}/
├── requirements.md   # User stories, acceptance criteria
├── design.md         # Technical design, schema, components
└── tasks.md          # Implementation tasks with agent assignments
```

## Workflow

### Phase 1: Load & Parse Spec

```
1. Read requirements.md → Extract acceptance criteria
2. Read design.md → Extract architecture decisions
3. Read tasks.md → Extract task list with:
   - Task ID
   - Description
   - Assigned agent (backend-engineer | frontend-engineer)
   - Dependencies
   - Acceptance criteria
```

### Phase 2: Execute Backend Tasks

```
FOR each task where agent = "backend-engineer":
  1. TodoWrite: mark in_progress
  2. Dispatch Task with ORCHESTRATED=true
  3. Collect: migrations, actions, interfaces
  4. TodoWrite: mark completed
  5. Store interfaces for frontend
```

### Phase 3: Execute Frontend Tasks

```
FOR each task where agent = "frontend-engineer":
  1. TodoWrite: mark in_progress
  2. Include backend interfaces in prompt
  3. Dispatch Task with ORCHESTRATED=true
  4. Collect: components created
  5. TodoWrite: mark completed
```

### Phase 4: Refactor

```
1. Run /refactor-code on all changed files
2. Focuses on recently modified code only
3. Ensures quality before review
```

### Phase 5: Code Review

```
1. Dispatch code-reviewer with all changed files
2. If CRITICAL issues → dispatch fix to responsible agent
3. Collect review results
```

### Phase 6: QA Validation

```
1. Dispatch qa-auditor with spec path
2. Verify all acceptance criteria met
3. Run build verification
```

### Phase 7: Learning Extraction

```
1. Dispatch learning-extractor with task summary
2. Capture patterns, gotchas, decisions
```

## Dispatch Template

```
Task({
  subagent_type: "{agent}",
  prompt: `
ORCHESTRATED=true

## Task
{task description}

## Context
Spec: {spec path}
Design: {relevant design section}
Dependencies: {completed tasks and their outputs}

## Acceptance Criteria
{criteria from spec}

## Deliver
{expected output format}
`,
  model: "sonnet"
})
```

## Output Format

```
## Feature Implementation Complete

**Spec:** {feature name}
**Status:** ✓ SUCCESS | ⚠️ PARTIAL | ✗ FAILED

### Execution Summary
| Phase | Agent | Tasks | Status |
|-------|-------|-------|--------|
| Backend | backend-engineer | 2/2 | ✓ |
| Frontend | frontend-engineer | 3/3 | ✓ |
| Review | code-reviewer | 1/1 | ✓ |
| QA | qa-auditor | 1/1 | ✓ |

### Deliverables
- Migrations: {list}
- Server Actions: {list with signatures}
- Components: {list}

### Acceptance Criteria
- [x] AC1: {description}
- [x] AC2: {description}
- [x] AC3: {description}

### Build Verification
✓ TypeScript: No errors
✓ Build: Passed
✓ All tests: Passed
```

## Error Handling

| Error | Action |
|-------|--------|
| Spec files missing | STOP, request spec path |
| Agent returns error | Retry once, then report |
| Build fails | Dispatch fix to responsible agent |
| QA fails | Report issues, suggest fixes |

## Token Budget

- Orchestration: 50k max
- Per agent: Use ORCHESTRATED=true for efficiency
- Total feature: ~200k across all agents
