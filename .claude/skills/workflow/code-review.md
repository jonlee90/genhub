# Skill: Code Review

> Comprehensive code review patterns for GenHub

## When to Use

- After any implementation task
- Before merging changes
- When validating agent output
- Quality assurance checks

## Prerequisites

- Access to changed files
- Understanding of GenHub architecture
- Knowledge of CLAUDE.md rules

---

## Quick Reference

### Review Categories
```
1. Security     - Supabase isolation, RLS, input validation
2. Architecture - Agent boundaries, component structure
3. UI/UX        - Design system compliance, responsive
4. Performance  - Efficient queries, bundle size
5. Types        - TypeScript correctness, generated types
6. Documentation - Index updates, comments
```

---

## Security Review

### Critical Checks

```typescript
// CHECK 1: No Supabase in client components
// SEARCH for violations:
grep -r "import.*supabase" components/ --include="*.tsx"
grep -r "'use client'" -A 10 | grep -i supabase

// FAIL if found in any 'use client' file

// CHECK 2: RLS enabled on all tables
mcp__supabase__execute_sql
query: `
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
`
// FAIL if any table has rowsecurity = false

// CHECK 3: Input validation in Server Actions
// Every action should validate inputs:
export async function createItem(input: CreateItemInput) {
  const parsed = CreateItemSchema.safeParse(input)  // ✓ Required
  if (!parsed.success) return { error: 'Invalid input' }
  // ...
}
```

### Security Checklist
```markdown
- [ ] No Supabase imports in 'use client' files
- [ ] All tables have RLS enabled
- [ ] RLS policies use next_auth.uid() or company isolation
- [ ] Server Actions validate all inputs with Zod
- [ ] No raw SQL without parameterization
- [ ] Sensitive data not logged
- [ ] API routes check authentication
```

---

## Architecture Review

### Component Boundaries

```typescript
// CLIENT COMPONENTS - allowed:
'use client'
- useState, useEffect, event handlers
- Import from Server Actions
- Props from parent components
- Local state management

// CLIENT COMPONENTS - forbidden:
- Direct Supabase calls
- Auth session access (use props)
- Database queries

// SERVER COMPONENTS - allowed:
- Supabase queries via createClient()
- Auth session via auth()
- Data fetching
- Pass data as props to client

// SERVER ACTIONS - allowed:
- Database mutations
- Auth checks
- Validation
- Revalidation
```

### Architecture Checklist
```markdown
- [ ] Client/Server separation correct
- [ ] Mutations use Server Actions
- [ ] Data flows parent→child via props
- [ ] No duplicate data fetching
- [ ] Correct file locations per project structure
- [ ] Imports use @/ aliases
```

---

## UI/UX Review

### Design System Compliance

```tsx
// CORRECT: Using BaseModal
import { BaseModal } from '@/components/ui/BaseModal'
<BaseModal isOpen={open} onClose={onClose} title="Edit">

// WRONG: Using Dialog directly
import { Dialog } from '@/components/ui/dialog'  // ❌

// CORRECT: Lucide icons
import { Check, X, Plus } from 'lucide-react'

// WRONG: Other icon libraries
import { FaCheck } from 'react-icons/fa'  // ❌

// CORRECT: Construction theme colors
className="bg-[#001B51] text-white"
className="border-[#001B51]"

// WRONG: Off-brand colors
className="bg-purple-500"  // ❌
```

### UI Checklist
```markdown
- [ ] BaseModal used (not Dialog)
- [ ] Lucide icons only
- [ ] Primary color #001B51
- [ ] No riveted borders or hazard stripes
- [ ] Mobile responsive (test at 375px)
- [ ] Touch targets 44px minimum
- [ ] Loading states present
- [ ] Error states handled
- [ ] Empty states handled
```

---

## Performance Review

### Database Queries

```typescript
// CHECK: Proper query scoping
// GOOD: Select only needed columns
.select('id, title, status')

// BAD: Select all columns when not needed
.select('*')

// CHECK: Pagination for lists
.range(offset, offset + limit - 1)

// CHECK: Proper filtering
.eq('company_id', companyId)  // Filter at database level

// BAD: Filter in JavaScript after fetching all
data.filter(item => item.companyId === companyId)  // ❌
```

### Performance Checklist
```markdown
- [ ] Queries select only needed columns
- [ ] Lists have pagination
- [ ] Filters applied at database level
- [ ] No N+1 query patterns
- [ ] Heavy components lazy loaded
- [ ] Images optimized with next/image
- [ ] No unnecessary re-renders
```

---

## Types Review

### TypeScript Correctness

```typescript
// CHECK: Types match database schema
// After migration, types should be regenerated:
// Run: npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts

// CHECK: Props interfaces defined
interface TaskCardProps {
  task: Task
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

// CHECK: Server Action return types
export async function createTask(input: CreateTaskInput): Promise<{
  data?: Task
  error?: string
}> {
  // ...
}

// CHECK: No 'any' types
const data: any = await fetch(...)  // ❌
```

### Types Checklist
```markdown
- [ ] database.types.ts regenerated after schema changes (but imports from types/db/*)
- [ ] Types imported from types/db/{domain}.ts (NOT database.types.ts)
- [ ] Props interfaces for all components
- [ ] Server Action return types explicit
- [ ] No 'any' types
- [ ] Enums from types/db/enums.ts used correctly
- [ ] Nullable fields handled
```

---

## Documentation Review

### Index Updates

```markdown
After changes, verify indexes updated:

| Change | Index File |
|--------|------------|
| New table | docs/indexes/tables.md |
| New action | docs/indexes/actions.md |
| New component | docs/indexes/components.md |
| New route | docs/indexes/routes.md |
| New enum | docs/indexes/enums.md |
```

### Documentation Checklist
```markdown
- [ ] Relevant index files updated
- [ ] Complex logic has comments
- [ ] Public functions have JSDoc
- [ ] README updated if needed
- [ ] Migration files have description
```

---

## Review Process

### Step 1: Gather Changes
```bash
# List changed files
git status

# Show diffs
git diff --name-only HEAD~1

# Check specific file
git diff path/to/file.tsx
```

### Step 2: Categorize Changes
```markdown
Database changes:
- [ ] supabase/migrations/...

Server Actions:
- [ ] app/actions/...

Components:
- [ ] components/...

Pages:
- [ ] app/app/...
```

### Step 3: Run Checklists
Apply relevant checklists from above based on change types.

### Step 4: Verify Build
```bash
npm run build 2>&1 | grep -E "error|Error" -A 3
```

### Step 5: Document Findings
```markdown
## Review Summary

### Issues Found
- [ ] [Critical] Description
- [ ] [Warning] Description
- [ ] [Suggestion] Description

### Passed Checks
- [x] Security: RLS enabled
- [x] Architecture: Correct boundaries
- [x] UI: Design system compliant

### Required Fixes
1. Fix description
2. Fix description
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Supabase in client | Move to Server Action |
| Missing RLS | Add policy in migration |
| Dialog used | Replace with BaseModal |
| Non-Lucide icon | Replace with Lucide equivalent |
| Missing types | Run npx supabase gen types... |
| Stale index | Update relevant index file |
| No validation | Add Zod schema |
| Any type | Define proper interface |

---

## Anti-Patterns

```markdown
# WRONG: Skip security review
"It works, ship it"
→ Potential data leaks, RLS bypasses

# WRONG: Ignore type errors
// @ts-ignore
→ Runtime errors, maintenance burden

# WRONG: No build verification
"Worked in dev"
→ Production build failures

# WRONG: Leave docs stale
"Documentation can wait"
→ Lost context, repeated mistakes
```

---

## Checklist Summary

```markdown
## Code Review Checklist

### Security
- [ ] No Supabase in client components
- [ ] RLS enabled on all tables
- [ ] Input validation with Zod
- [ ] Auth checks in place

### Architecture
- [ ] Client/Server separation correct
- [ ] Server Actions for mutations
- [ ] Correct file locations

### UI/UX
- [ ] BaseModal (not Dialog)
- [ ] Lucide icons only
- [ ] Mobile responsive
- [ ] Construction theme

### Performance
- [ ] Efficient queries
- [ ] Pagination present
- [ ] No N+1 patterns

### Types
- [ ] Types regenerated
- [ ] No 'any' types
- [ ] Interfaces defined

### Documentation
- [ ] Indexes updated
- [ ] Comments where needed

### Verification
- [ ] npm run build passes
- [ ] No console errors
```
