# GenHub - Core Rules

> Critical safety rules and architectural constraints. Read FIRST before any work.

---

## Critical Safety Rules (HARD FAIL)

### 1. Supabase Client Isolation

```
NEVER in 'use client' files:
  - import from '@/utils/supabase/*'
  - import { createClient } from '@supabase/supabase-js'
  - any direct Supabase SDK usage

ALWAYS use:
  - Server Actions (app/actions/*.ts)
  - API Routes (app/api/*)
  - Server Components for data fetching
```

**Violation causes build failure:**
```
Module not found: Can't resolve 'child_process'
Module not found: Can't resolve 'dns'
Module not found: Can't resolve 'fs'
```

### 2. Architecture Separation

| Component Type | Responsibilities | Database Access |
|---------------|------------------|-----------------|
| Client (`'use client'`) | UI, interaction, local state | NEVER |
| Server Actions | Mutations, queries | YES |
| Server Components | Initial data fetch, layout | YES |
| API Routes | Webhooks, external APIs | YES |

**No file may mix both responsibilities.**

### 3. Database via MCP Only

```bash
# ALWAYS use MCP Supabase for database operations
mcp__supabase__list_tables
mcp__supabase__execute_sql
mcp__supabase__apply_migration
mcp__supabase__get_advisors type:"security"

# For type generation, use Bash:
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

**NEVER use psql, CLI, or direct connections.**

### 4. Manual Authorization (RLS Bypassed)

Server client bypasses RLS. Always verify:
1. User authenticated (`auth()`)
2. User belongs to company (`company_users`)
3. Resource belongs to user's company (`company_id` match)

```typescript
if (resource.company_id !== userContext.companyId) {
  return { error: 'Insufficient permissions' };
}
```

---

## Role Hierarchy

```
gc_admin         → Full company access
project_manager  → Manage projects/tasks/team
foreman          → Manage assigned tasks/workers
field_worker     → View/update assigned tasks
subcontractor    → Limited to assigned work
client           → Read-only project visibility
```

---

## Supabase Client Selection

| Use Case | Client | File | Notes |
|----------|--------|------|-------|
| Server Actions | `createClient()` | server.ts | Standard use |
| Pre-auth ops | `createAdminClient()` | server.ts | Webhooks only |
| User-scoped | `createUserClient()` | server.ts | Redirects if no auth |

**All bypass RLS - manual auth required.**

---

## Cross-Schema Join Limitation

Tables with FKs to `next_auth.users` **cannot use PostgREST auto-join**:

```typescript
// ❌ WRONG - "Could not find relationship" error
.from('project_files')
.select(`*, uploader:uploaded_by (id, name)`)

// ✅ CORRECT - Fetch user details separately
.from('project_files')
.select('*')
// Then join user_profiles manually if needed
```

**Affected tables:** `project_files`, `project_photos`, `spatial_markers`, `marker_content`

---

## RLS Helper Functions

```sql
next_auth.uid() -> uuid                    -- Current user ID
get_user_company_id(user_id) -> uuid       -- User's company
is_user_gc_admin(user_id) -> boolean       -- Check if admin
```

---

## Stop Conditions

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Design rules conflict
- Required context file missing
- Approaching token budget cap

---

## See Also

- Stack & Structure: `core/STACK.md`
- Server Action patterns: `backend/SERVER_ACTIONS.md`
- Database schema: `docs/law/DB_SCHEMA.md`
