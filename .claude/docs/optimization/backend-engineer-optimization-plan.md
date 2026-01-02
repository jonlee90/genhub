# Backend-Engineer Agent Optimization Plan

**Date:** 2026-01-02
**Current Token Usage:** ~145,000 tokens for Phase 1 (10 tasks)
**Target:** <50,000 tokens for Phase 1 (65% reduction)

---

## Problem Analysis

### Token-Burning Hotspots

| Issue | Tokens/Task | Frequency | Total Impact |
|-------|-------------|-----------|--------------|
| Reading SYSTEM.md (732 lines) | ~1,500 | Every task | High |
| Reading DB_SCHEMA.md (1,127 lines) | ~2,500 | Every task | **Critical** |
| MCP Supabase verbose output | ~1,000-5,000 | Multiple per task | **Critical** |
| Embedded code examples in agent | ~2,000 | Every task | Medium |
| **Total per task** | **~7,000-10,000** | - | **Unsustainable** |

---

## Optimization 1: Replace MCP Supabase with Direct SQL

### Problem with MCP Supabase
```
mcp__supabase__list_tables → Returns FULL schema for ALL tables
mcp__supabase__execute_sql → Includes verbose query plans
mcp__supabase__get_advisors → Returns long security reports

Each call: 1,000-5,000 tokens
Phase 1 used ~30 MCP calls = 45,000+ tokens just for database ops!
```

### Solution: Use Bash + psql for Database Operations

**Token Savings:** ~80% reduction (1,000 tokens → 200 tokens per operation)

#### Setup: Add psql Connection String to .env.local
```bash
# .env.local
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

#### Replace MCP Tools with Bash + psql

| Old (MCP Supabase) | New (Bash + psql) | Token Savings |
|-------------------|-------------------|---------------|
| `mcp__supabase__list_tables` | `psql -c "\dt public.*"` | 80% |
| `mcp__supabase__execute_sql` | `psql -c "SELECT ..."` | 75% |
| `mcp__supabase__apply_migration` | `psql -f migration.sql` | 70% |
| `mcp__supabase__get_advisors` | Manual RLS checks (scripted) | 90% |
| `mcp__supabase__generate_typescript_types` | `supabase gen types` CLI | 50% |

#### Example Migration Workflow (Old vs New)

**Old (MCP Supabase):**
```
1. mcp__supabase__list_tables (1,500 tokens - returns full schema)
2. mcp__supabase__apply_migration (2,000 tokens - verbose output)
3. mcp__supabase__get_advisors (3,000 tokens - full security report)
4. mcp__supabase__generate_typescript_types (1,500 tokens)
Total: 8,000 tokens
```

**New (Bash + psql):**
```bash
# 1. Check schema (200 tokens)
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# 2. Apply migration (300 tokens)
psql $DATABASE_URL -f supabase/migrations/001_create_table.sql

# 3. Check RLS (200 tokens)
psql $DATABASE_URL -c "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';"

# 4. Generate types (500 tokens)
npx supabase gen types typescript --project-id $PROJECT_REF > types/database.types.ts

Total: 1,200 tokens (85% reduction!)
```

---

## Optimization 2: Embed Essential Schema Reference

### Problem
DB_SCHEMA.md (1,127 lines) is read on EVERY task, even for simple updates.

### Solution
Embed a **compact schema summary** directly in agent config.

#### Schema Quick Reference (Embedded in Agent)

```markdown
## Database Quick Reference (No File Read Needed)

### Core Tables
| Table | Primary Use | Key Columns |
|-------|-------------|-------------|
| users | Auth users | id, email, name |
| projects | Projects | id, name, company_id, status |
| tasks | Project tasks | id, title, project_id, assignee_id, status |
| company_users | Team membership | user_id, company_id, role |
| spatial_markers | 3D markers | id, project_id, position_x/y/z, type |

### Common RLS Pattern (Copy-Paste)
```sql
-- Company isolation
CREATE POLICY "company_access"
ON table_name FOR ALL TO authenticated
USING (company_id IN (
  SELECT company_id FROM company_users
  WHERE user_id = (SELECT next_auth.uid())
));
```

### Auth Helpers
- `next_auth.uid()` - Current user ID
- `get_user_company_id(uuid)` - User's company
- `is_user_gc_admin(uuid)` - Is GC admin

**Read DB_SCHEMA.md ONLY when:**
- Creating new table with complex relationships
- Debugging RLS policy issues
- Need detailed column descriptions
```

**Token Savings:** 2,500 tokens → 200 tokens (92% reduction)

---

## Optimization 3: Compress Agent Config

### Problem
Agent config has 612 lines with:
- 8 full code examples (Server Actions, RLS patterns, Realtime hooks)
- Middleware boilerplate (50+ lines)
- Supabase client setup (100+ lines)

All loaded into context for EVERY task.

### Solution
Move detailed patterns to separate files, keep only quick reference.

#### Before (612 lines in agent):
```markdown
## Supabase Client Architecture

### Server Client (Server Components, Actions, Route Handlers)
[50 lines of code]

### Browser Client (Client Components)
[30 lines of code]

### Middleware Session Refresh
[70 lines of code]

[... continues for 612 lines]
```

#### After (150 lines in agent):
```markdown
## Quick Reference

### Database Operations
```bash
# List tables
psql $DATABASE_URL -c "\dt public.*"

# Apply migration
psql $DATABASE_URL -f migrations/001_name.sql

# Check RLS
psql $DATABASE_URL -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

### Server Action Template
```typescript
'use server'
import { createClient } from '@/utils/supabase/server'
export async function action(data: Type) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  // ...
}
```

**For detailed patterns, reference:**
- SYSTEM.md (auth, architecture)
- DB_SCHEMA.md (tables, RLS)
```

**Token Savings:** 2,000 tokens → 500 tokens (75% reduction)

---

## Optimization 4: Conditional Documentation Reads

### Current Behavior
```markdown
## MANDATORY: Reference Documentation First
Before starting ANY work, read:
- SYSTEM.md
- DB_SCHEMA.md
```

### Optimized Behavior
```markdown
## When to Reference Full Documentation

**Read SYSTEM.md ONLY when:**
- Setting up new auth flow
- Implementing new middleware pattern
- Complex architecture decision

**Read DB_SCHEMA.md ONLY when:**
- Creating new tables with complex relationships
- Debugging RLS policies
- Need detailed foreign key mappings

**For 80% of tasks, use Quick Reference instead.**
```

---

## Optimization 5: Batch MCP Operations (If Keeping MCP)

### Problem
Current workflow makes sequential MCP calls:
```
Task: Create new table
1. mcp__supabase__list_tables (check schema)
2. mcp__supabase__apply_migration (apply DDL)
3. mcp__supabase__get_advisors (security check)
4. mcp__supabase__generate_typescript_types (update types)

Total: 4 tool calls × 1,500 tokens avg = 6,000 tokens
```

### Solution
Create compound operations:
```
1. Apply migration with inline security check
2. Single call to generate types

Total: 2 tool calls × 1,000 tokens avg = 2,000 tokens
```

**Token Savings:** 66% reduction

---

## Complete Optimization Summary

| Optimization | Current | After | Savings |
|--------------|---------|-------|---------|
| 1. Replace MCP with psql | 45,000 | 9,000 | **80%** |
| 2. Embed schema reference | 25,000 | 2,000 | **92%** |
| 3. Compress agent config | 20,000 | 5,000 | **75%** |
| 4. Conditional doc reads | 15,000 | 3,000 | **80%** |
| 5. Batch operations | 6,000 | 2,000 | **66%** |
| **Total for Phase 1** | **145,000** | **38,000** | **74%** |

---

## Implementation Steps

### Step 1: Add psql to Backend-Engineer Tools
```markdown
---
tools: Read, Edit, Write, Glob, Grep, Bash
# Removed all mcp__supabase__* tools
---
```

### Step 2: Create Database Helper Scripts
```bash
# scripts/db-check-tables.sh
psql $DATABASE_URL -c "\dt public.*"

# scripts/db-check-rls.sh
psql $DATABASE_URL -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"

# scripts/db-apply-migration.sh
psql $DATABASE_URL -f "$1"
```

### Step 3: Update Agent with Quick Reference
- Embed core tables (5-10 most used)
- Embed RLS pattern template
- Embed auth helper functions
- Remove verbose code examples

### Step 4: Make Documentation Conditional
Change from "MANDATORY" to "ONLY when needed"

### Step 5: Test and Monitor
- Run 5 simple tasks (single table queries, simple migrations)
- Track token usage: Should be <5,000 tokens per task
- Verify code quality maintained

---

## Alternative: Keep MCP but Optimize Calls

If you want to keep MCP Supabase (for its convenience):

### Option A: Pre-cache Schema
```markdown
## Startup Optimization
On first database task of the session:
1. Cache full schema with mcp__supabase__list_tables
2. Store in agent memory
3. Subsequent tasks reuse cached schema

Token savings: 1,500 tokens saved per task after first
```

### Option B: Selective MCP Usage
```markdown
Use MCP for:
- Security advisors (hard to replicate)
- Type generation (official tooling)

Use psql for:
- Schema inspection (verbose in MCP)
- Migrations (faster, less verbose)
- Query execution (direct, no overhead)

Token savings: ~50%
```

---

## Recommended Approach

**Phase 1: Quick Wins (Today)**
1. ✅ Embed schema quick reference in agent (92% savings on DB_SCHEMA.md reads)
2. ✅ Make SYSTEM.md/DB_SCHEMA.md conditional (80% savings)
3. ✅ Compress agent config (75% savings)
Expected: **~60,000 tokens saved** for next Phase 1-equivalent work

**Phase 2: Infrastructure Change (This Week)**
1. Replace MCP Supabase with psql for migrations
2. Keep MCP for security advisors and type gen only
3. Create helper scripts for common operations
Expected: **Additional ~40,000 tokens saved**

**Phase 3: Long-term (Next Sprint)**
1. Build custom database CLI with concise output
2. Implement schema caching across sessions
3. Pre-compute common queries
Expected: **Additional ~20,000 tokens saved**

---

## Risk Assessment

### Risks of Replacing MCP Supabase

| Risk | Severity | Mitigation |
|------|----------|------------|
| Lose official Supabase tooling | Low | psql is standard PostgreSQL |
| Manual RLS checking error-prone | Medium | Create validation scripts |
| Type generation breaks | Low | Supabase CLI does this better anyway |
| Learning curve for agent | Low | psql is simpler than MCP API |

### Rollback Plan
```bash
# If psql approach doesn't work, restore MCP tools:
git checkout HEAD~1 .claude/agents/backend-engineer.md

# Or hybrid: Keep MCP for complex operations only
tools: ..., mcp__supabase__get_advisors, mcp__supabase__generate_typescript_types
```

---

## Success Metrics

Track over next 10 backend tasks:
- [ ] Token usage per task: <5,000 (down from ~14,500)
- [ ] Total tokens for Phase 1-equivalent: <40,000 (down from 145,000)
- [ ] Code quality: No regression in RLS policies, migrations
- [ ] Agent success rate: >90% (same as before)

---

**Optimization Status:** Ready to Implement
**Expected Impact:** 74% token reduction (~107,000 tokens saved for Phase 1 work)
**Risk Level:** Low (psql is standard, well-documented)
