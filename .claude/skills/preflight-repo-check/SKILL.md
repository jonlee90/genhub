---
name: preflight-repo-check
description: "Pre-implementation verification for GenHub. Checks spec files exist, validates types, verifies MCP tools accessible, and confirms agent boundaries. Run before major implementations."
---

# Preflight Repository Check

Verify repository state before major implementations to prevent common failures.

## Trigger

- Before `/kc:impl` execution
- Before multi-file implementations
- User says "preflight check"
- Complex task with 3+ components

## Checks

### 1. Spec File Verification (if referenced)

```bash
# Check spec directory exists
ls -la .claude/specs/{feature}/

# Required files
[ -f requirements.md ] && echo "✓ requirements.md"
[ -f design.md ] && echo "✓ design.md"
[ -f tasks.md ] && echo "✓ tasks.md"
```

**Pass:** All required files exist
**Fail:** Missing files → Report which are missing

### 2. Type Conflict Check

```bash
# Check for conflicting type definitions
grep -r "type.*{EntityName}" types/ --include="*.ts"
grep -r "interface.*{EntityName}" types/ --include="*.ts"

# Check database types are current
ls -la types/supabase.ts
```

**Pass:** No conflicts, types up to date
**Fail:** Conflicts found → Report details

### 3. MCP Tool Accessibility

```
# Test Serena
read_memory("genhub-database-schema") → Should return content

# Test Supabase MCP
list_tables → Should return table list

# Test Memory MCP
read_graph() → Should return graph
```

**Pass:** All tools respond
**Fail:** Tool errors → Report which failed

### 4. Agent Boundary Validation

Analyze task and verify:

| Task Component | Required Agent | Boundary OK? |
|----------------|----------------|--------------|
| Database schema | backend-engineer | ✓ |
| Server Actions | backend-engineer | ✓ |
| UI Components | frontend-engineer | ✓ |
| Styling | frontend-engineer | ✓ |

**Pass:** All tasks map to appropriate agents
**Fail:** Cross-boundary task → Flag for splitting

### 5. Build State Check

```bash
# Quick build check
npm run build 2>&1 | grep -E "error|Error" | head -5
```

**Pass:** Build clean
**Fail:** Existing errors → Report and suggest fixing first

### 6. Git State Check

```bash
# Check for uncommitted changes
git status --short

# Check current branch
git branch --show-current
```

**Pass:** Clean state or expected changes
**Warn:** Uncommitted changes → Notify user

## Output Format

```
## Preflight Check Report

**Feature:** {feature name}
**Status:** ✓ READY | ⚠️ WARNINGS | ✗ BLOCKED

### Checks
| Check | Status | Details |
|-------|--------|---------|
| Spec Files | ✓ | All present |
| Type Conflicts | ✓ | None found |
| MCP Tools | ✓ | All accessible |
| Agent Boundaries | ✓ | Valid mapping |
| Build State | ✓ | Clean |
| Git State | ⚠️ | 2 uncommitted files |

### Warnings (if any)
- Uncommitted changes in `components/TaskForm.tsx`

### Blockers (if any)
- Missing `design.md` in spec directory
- Existing build error in `app/actions/projects.ts:45`

### Recommendation
**PROCEED** - All checks passed
**PROCEED WITH CAUTION** - Warnings noted
**STOP** - Resolve blockers before continuing
```

## Quick Mode

For simple checks, output minimal format:

```
Preflight: ✓ READY
- Specs: ✓
- Types: ✓
- MCP: ✓
- Build: ✓
```

## Integration

Run automatically at start of:
- `/kc:impl` command
- `kiro-orchestrator` agent
- `feature-implementation-kiro` skill

Can be skipped with `SKIP_PREFLIGHT=true` flag.
