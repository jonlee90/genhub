---
name: post-task-learning
description: "Extracts and stores learnings after significant tasks. Updates Serena memories and Memory MCP with patterns, gotchas, and decisions. Triggers automatically for complex tasks."
---

# Post-Task Learning

Extract learnings from completed tasks and update project knowledge.

## Trigger Conditions

**Run for:**
- Multi-step implementations (3+ files)
- Error resolution after 2+ attempts
- User corrections to approach
- New architectural decisions
- Performance optimizations

**Skip for:**
- Typo fixes
- Single-line changes
- Simple renames
- Config tweaks

## Learning Categories

### 1. Bug Patterns

Issues encountered and their solutions.

**Store:** Memory MCP (BugPattern entity)
**Format:**
```
{
  name: "BugPattern-{short-name}",
  entityType: "BugPattern",
  observations: [
    "Symptom: {what happened}",
    "Cause: {root cause}",
    "Solution: {fix applied}",
    "Prevention: {how to avoid}",
    "Date: {YYYY-MM-DD}"
  ]
}
```

### 2. Code Patterns

Reusable solutions and component patterns.

**Store:** Serena (`genhub-component-patterns`)
**Format:**
```markdown
## {Pattern Name} (YYYY-MM-DD)
**What:** Brief description
**When:** When to use this pattern
**Why:** Problem it solves
**How:**
\`\`\`typescript
// Example code
\`\`\`
**Source:** {task name}
```

### 3. Gotchas

Non-obvious issues and surprising behaviors.

**Store:** Serena (`genhub-common-gotchas`)
**Format:**
```markdown
## {Gotcha Name} (YYYY-MM-DD)
**Issue:** What goes wrong
**Cause:** Why it happens
**Solution:** How to fix/avoid
**Example:**
\`\`\`typescript
// Wrong
{bad code}

// Correct
{good code}
\`\`\`
```

### 4. Architectural Decisions

Design choices and trade-offs.

**Store:** Serena (`genhub-architectural-decisions`) + Memory MCP
**Format:**
```markdown
## ADR-{N}: {Title} (YYYY-MM-DD)
**Context:** Situation requiring decision
**Decision:** What was decided
**Rationale:** Why this approach
**Consequences:** Trade-offs accepted
```

## Workflow

### Step 1: Evaluate Task Significance

```
Questions:
- Files changed > 2?
- Errors resolved > 1?
- User provided corrections?
- Design decisions made?
- Optimizations discovered?

Score: Count YES answers
Threshold: Score >= 1 → Extract learnings
```

### Step 2: Identify Learnings

```
Analyze:
1. Errors encountered → Bug Pattern
2. Solutions created → Code Pattern
3. Surprises found → Gotcha
4. Decisions made → Architecture
```

### Step 3: Quality Check

Before storing, verify:
- [ ] Genuinely useful (not obvious)
- [ ] Specific to GenHub (not generic)
- [ ] Actionable (can be applied)
- [ ] Code examples correct

### Step 4: Store Learnings

```
FOR each learning:
  1. Format using appropriate template
  2. Write to correct store
  3. Verify write succeeded
```

### Step 5: Report

```
## Learning Extraction Report

**Task:** {description}
**Date:** {YYYY-MM-DD}

### Captured
| Type | Name | Store |
|------|------|-------|
| Bug Pattern | {name} | Memory MCP |
| Gotcha | {name} | Serena |

### Skipped
- {reason}

### CLAUDE.md Recommendation
{if applicable, suggest manual addition}
```

## Memory Targets

| Learning Type | Serena Memory | Memory MCP |
|---------------|---------------|------------|
| Bug Pattern | - | BugPattern entity |
| Code Pattern | genhub-component-patterns | - |
| Gotcha | genhub-common-gotchas | - |
| Architecture | genhub-architectural-decisions | key-decisions |
| Server Action | genhub-server-actions | - |
| Schema | genhub-database-schema | - |

## Important Rules

1. **Never auto-update CLAUDE.md** - Only recommend changes for manual review
2. **Be selective** - Only capture genuinely useful learnings
3. **Include examples** - Abstract descriptions are less useful
4. **Date everything** - Track when learnings were captured
5. **Link to source** - Reference the task that produced the learning

## Integration

Called by:
- `kiro-orchestrator` at end of feature implementation
- `learning-extractor` agent
- Manually after significant tasks

Can be skipped with `SKIP_LEARNING=true` flag.
