# TypeScript Type Regeneration - Efficient Workflow

## Purpose
Minimize token usage when regenerating TypeScript types from Supabase schema after migrations.

## When to Use This Workflow

Use this **simple, token-efficient workflow** when:
- ✅ A database migration has been successfully deployed to Supabase
- ✅ You need to regenerate `types/database.types.ts` to sync with the new schema
- ✅ No code changes are needed (just type regeneration)
- ✅ You understand what the migration does (from context or recent work)

**Do NOT use** if:
- ❌ You need to understand how types are used in the codebase
- ❌ You're implementing new features that require type integration
- ❌ You're debugging type-related errors across multiple files

## Token-Efficient Workflow (3 steps)

### Step 1: Read the types file (MANDATORY)
```
Read types/database.types.ts
```
**Why:** The Write tool requires reading a file before writing to it.
**Token cost:** ~4-5k tokens (file is 2629 lines)

### Step 2: Regenerate types from Supabase
```
mcp__supabase__generate_typescript_types
```
**Why:** Gets latest schema from deployed database.
**Token cost:** ~3-4k tokens (includes schema fetch + generation)

### Step 3: Write updated types
```
Write types/database.types.ts
```
**Why:** Overwrites file with regenerated types.
**Token cost:** ~4-5k tokens (full file write)

**Total token cost:** ~12-14k tokens

---

## What NOT to Read (Token Savings)

### ❌ Skip Context Files
Do NOT read these unless specifically needed for debugging:
- Migration files (you already know what changed)
- Components using the types (unless debugging integration)
- Server actions (unless debugging queries)
- CLAUDE.md (unless unfamiliar with rules)
- Other documentation files

**Token savings:** 2-6k tokens per unnecessary file read

### ❌ Skip Multiple Migration Files
If you deployed the migration yourself, you don't need to re-read it.

**Token savings:** 1-2k tokens per migration file

---

## Example: Before vs After

### ❌ BEFORE (Inefficient - 18k tokens)
```
1. Read migration file (1.5k tokens)
2. Read CLAUDE.md (3k tokens)
3. Read TaskBoard.tsx (2k tokens)
4. Read tasks/page.tsx (1.5k tokens)
5. Read types/database.types.ts (4k tokens) ← MANDATORY
6. Generate types (3k tokens)
7. Write types (4k tokens)

Total: ~18k tokens
```

### ✅ AFTER (Efficient - 12k tokens)
```
1. Read types/database.types.ts (4k tokens) ← MANDATORY
2. Generate types (3k tokens)
3. Write types (4k tokens)

Total: ~12k tokens
Savings: 6k tokens (33% reduction)
```

---

## When to Read Additional Files

Read context files ONLY if:
1. **Error during type generation** → Read migration to debug
2. **Type integration questions** → Read components using the types
3. **Unfamiliar with rules** → Read CLAUDE.md
4. **Debugging type errors** → Read files with type errors

---

## Standard Response Pattern

When completing a simple type regeneration:

```markdown
✅ TypeScript types regenerated successfully

**Migration deployed:** [migration name]
**Types file updated:** types/database.types.ts (2629 lines)

**Key additions:**
- [List major new types, e.g., "get_task_analytics function"]

**Token efficiency:** Used minimal workflow (12k tokens vs 18k full context)

---

## 🧾 Agent Audit Report
[Include standard audit report]
```

---

## Integration with CLAUDE.md

This workflow follows CLAUDE.md token discipline rules:
- **Read Strategy:** "Grep/search first, then Read with offset+limit"
- **Budgets:** Backend agent 25k max - this workflow uses only 12k
- **Full file reads only for:** <200 lines, configs, **migrations** ← types file is exception due to Write requirement

---

## Checklist for Agents

Before regenerating types, verify:
- [ ] Migration successfully deployed to Supabase
- [ ] This is a simple type sync (no code changes needed)
- [ ] You understand what changed (from context or recent work)
- [ ] You will ONLY read `types/database.types.ts` before generating

If all checked → Use this efficient workflow
If any unchecked → Read additional context as needed
