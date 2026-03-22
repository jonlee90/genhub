# GenHub Context Loading Strategy

> Minimal context selection for token-efficient assistance.
> Last updated: 2026-03-21

---

## Quick Reference: What to Load

| Task Type | Load First | Load If Needed | Skip |
|-----------|------------|----------------|------|
| **Add Feature** | architecture-index.md | reuse-registry memory | dependency-graph.md |
| **Fix Bug** | Specific file(s) only | domain Serena memory | All docs |
| **Refactor** | dependency-graph.md | find_symbol references | architecture-index.md |
| **Add Component** | reuse-registry memory | architecture-index.md | dependency-graph.md |
| **Modify Action** | dependency-graph.md | domain memory | architecture-index.md |
| **Answer Question** | Serena find_symbol | Explore agent | All docs |

---

## Decision Tree

```
What is the task?
│
├─ ADDING something new?
│  │
│  ├─ New feature (multiple files)?
│  │  └─ Load: architecture-index.md → reuse-registry
│  │
│  ├─ New component?
│  │  └─ Load: reuse-registry → check existing patterns
│  │
│  ├─ New Server Action?
│  │  └─ Load: architecture-index.md (domain mapping)
│  │
│  └─ New type/hook/util?
│     └─ Load: architecture-index.md (file placement)
│
├─ FIXING a bug?
│  │
│  └─ Read the specific file(s)
│     └─ Use Serena find_symbol for related code
│     └─ Skip all docs (unnecessary context)
│
├─ REFACTORING?
│  │
│  └─ Load: dependency-graph.md
│     └─ Use Serena find_referencing_symbols
│     └─ Map full impact before changing
│
├─ INVESTIGATING/UNDERSTANDING?
│  │
│  └─ Use Explore agent (subagent_type=Explore)
│     └─ Skip docs (let agent discover)
│
└─ MODIFYING critical function?
   │
   └─ Load: dependency-graph.md (impact analysis)
      └─ Check consumer count before changing
```

---

## Task-Specific Loading

### Adding a New Feature

**Goal**: Know where files go + what to reuse

1. Read `architecture-index.md` (file placement rules)
2. Load Serena memory: `genhub-reuse-registry`
3. Check if similar pattern exists before creating

**Skip**: dependency-graph.md (not modifying existing code)

### Fixing a Bug

**Goal**: Minimal context, fast fix

1. Read the specific file(s) with the bug
2. Use `find_symbol` if need to trace code
3. Load domain Serena memory only if unfamiliar

**Skip**: All docs (too much irrelevant context)

### Refactoring Code

**Goal**: Understand full impact

1. Load `dependency-graph.md` (critical paths)
2. Use Serena `find_referencing_symbols` for all references
3. Map all consumers before changing signatures

**Skip**: architecture-index.md (already know location)

### Adding a UI Component

**Goal**: Find existing patterns to extend

1. Load Serena memory: `genhub-reuse-registry`
2. Check components/ui/ for base components
3. Find similar domain component to copy patterns

**Skip**: dependency-graph.md (UI is leaf node)

### Modifying a Server Action

**Goal**: Know what depends on it

1. Load `dependency-graph.md` (check consumer count)
2. If high-impact function: trace all consumers
3. Update cache invalidation if needed

### Answering Architecture Questions

**Goal**: Fast lookup

1. Check `architecture-index.md` for structure questions
2. Use Serena `find_symbol` for code questions
3. Use Explore agent for open-ended investigation

---

## Serena Memory Loading Guide

| Memory Name | When to Load |
|-------------|--------------|
| `genhub-reuse-registry` | Adding UI components, creating patterns |
| `genhub-component-patterns` | Working with modals, forms, lists |
| `genhub-server-actions` | Adding/modifying actions |
| `genhub-database-schema` | DB operations, migrations |
| `genhub-duplication-hotspots` | Before creating new patterns |

**Rule**: Load max 2 memories per task. More = wasted tokens.

---

## Anti-Patterns (Don't Do)

| Bad Practice | Why | Better Approach |
|--------------|-----|-----------------|
| Load all docs for every task | Wastes 500+ tokens | Load by task type |
| Read entire file to find function | Slow, noisy | Use find_symbol |
| Skip dependency check before refactor | Breaks consumers | Always check graph |
| Create new pattern without checking | Duplication | Check reuse-registry first |
| Load memories "just in case" | Token waste | Load on demand |

---

## Token Budget Guidelines

| Context Type | Approximate Tokens | When Worth It |
|--------------|-------------------|---------------|
| architecture-index.md | ~400 | New features, file placement |
| dependency-graph.md | ~600 | Refactors, critical changes |
| context-strategy.md | ~200 | Never (meta-doc) |
| Serena memory (each) | ~300 | Specific domain work |
| Full file read | ~500-2000 | Bug fixes, deep changes |
| find_symbol result | ~50-200 | Quick lookups |

**Budget Rule**: Stay under 1500 tokens of context for simple tasks.

---

## Examples

### Example 1: "Add expense category filter"

```
Task analysis: Adding UI feature
├─ Load: architecture-index.md (where does filter go?)
├─ Load: genhub-reuse-registry (existing FilterBar pattern?)
└─ Find: components/expenses/ for similar filters
```

### Example 2: "Fix task status not updating"

```
Task analysis: Bug fix
├─ Read: app/actions/tasks-status.ts
├─ Trace: updateTaskStatus → logTaskActivity chain
└─ Skip: All docs (focused fix)
```

### Example 3: "Create new modal for approvals"

```
Task analysis: New component
├─ Load: genhub-reuse-registry (ResponsiveModal pattern)
├─ Find: Similar modal (TaskModal, CreateExpenseModal)
└─ Copy pattern, customize
```

### Example 4: "Refactor getUserContext"

```
Task analysis: Critical refactor
├─ Load: dependency-graph.md (29 consumers!)
├─ Use: find_referencing_symbols for full list
├─ Plan: Backward-compatible change or update all
└─ Test: Full auth flow
```

---

## Summary

**Golden Rule**: Load the minimum context needed for the specific task.

- New features → architecture-index.md + reuse-registry
- Bug fixes → Just the file(s)
- Refactors → dependency-graph.md + find_referencing_symbols
- Questions → Explore agent or find_symbol
