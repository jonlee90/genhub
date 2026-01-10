# Agent Audit Reporting

> Standard format for agent action logging. All agents produce this at task completion.

---

## Format

```md
## Agent Audit Report

**Agent:** frontend-engineer | backend-engineer | code-reviewer
**Task Type:** UI / Backend / Review
**Task Complexity:** Simple / Complex

### Actions Taken
- Planned before implementation: Yes / No
- Tools used: [list]
- Files read: [path - reason]
- Files modified: [path - reason]

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

## When to Generate

- After every implementation task
- After every review task
- After orchestrator coordination complete
