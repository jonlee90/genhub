# Delegation Matrix

Detailed agent capabilities, boundaries, and authority for task orchestration.

---

## Agent Profiles

### backend-engineer

**Budget:** 70k tokens

**Authority:**
| ✅ Allowed | ❌ Never |
|------------|----------|
| Database migrations | UI components |
| Server Actions | Client state |
| RLS policies | Tailwind styling |
| Type generation | React hooks |
| API routes | Page layouts |
| Supabase queries | Form validation UI |

**Tools Access:**
- Supabase MCP (full access)
- Bash (for migrations, type generation)
- Read, Edit, Write (for action files)
- Grep, Glob (for searching)

**File Patterns:**
- `app/actions/*.ts` - Server Actions
- `types/db/*.ts` - Database types
- `supabase/migrations/*.sql` - Migrations
- `lib/services/*.ts` - Backend services

**Triggers:**
- "create migration"
- "add Server Action"
- "database query"
- "RLS policy"
- "backend", "API"

---

### frontend-engineer

**Budget:** 80k tokens

**Authority:**
| ✅ Allowed | ❌ Never |
|------------|----------|
| React components | Database access |
| Page layouts | Server Actions creation |
| Tailwind styling | Supabase client |
| Client state | Migrations |
| Forms & validation | RLS policies |
| Loading states | Direct queries |

**Tools Access:**
- Read, Edit, Write
- Grep, Glob
- Bash (for npm, testing)
- NO Supabase MCP

**File Patterns:**
- `components/**/*.tsx` - Components
- `app/**/page.tsx` - Pages
- `app/**/layout.tsx` - Layouts
- `hooks/*.ts` - Custom hooks

**Triggers:**
- "create component"
- "build UI"
- "add page"
- "style", "Tailwind"
- "form", "modal"

---

### code-reviewer

**Budget:** 30k tokens

**Authority:**
| ✅ Allowed | ❌ Never |
|------------|----------|
| Code review | New features |
| Bug fixes | Architecture changes |
| Test validation | Migrations |
| Quality checks | Major refactors |
| Security audit | New components |
| Pattern validation | Database changes |

**Tools Access:**
- Read, Grep, Glob
- Bash (for tests, linting)
- NO Edit, Write

**Focus Areas:**
- Type safety
- Security vulnerabilities
- GenHub patterns
- Mobile compatibility (375px, 44px touch)
- Integration correctness

**Triggers:**
- "review"
- "check code"
- "validate"
- "audit"
- "fix bug"

---

## Dependency Matrix

Which agent output feeds into another:

```
┌─────────────────┐
│ backend-engineer │
└────────┬────────┘
         │ exports: actions, types, file paths
         ▼
┌─────────────────┐
│frontend-engineer │
└────────┬────────┘
         │ exports: components, pages, file paths
         ▼
┌─────────────────┐
│  code-reviewer  │
└─────────────────┘
```

---

## Parallel Dispatch Safety Matrix

| Agent A | Agent B | Parallel Safe? | Notes |
|---------|---------|----------------|-------|
| frontend | frontend | ✅ YES | Different components only |
| backend | backend | ⚠️ MAYBE | Check for shared tables/types |
| reviewer | reviewer | ✅ YES | Read-only |
| backend | frontend | ❌ NO | Type dependencies |
| frontend | reviewer | ⚠️ MAYBE | If reviewing different files |
| backend | reviewer | ⚠️ MAYBE | If reviewing backend only |

---

## Task Categorization

### Category 1: Backend-Only Tasks

**Examples:**
- Add new database table
- Create Server Action
- Update RLS policy
- Add database index
- Create backend service

**Delegation:** Direct to backend-engineer (skip orchestrator)

---

### Category 2: Frontend-Only Tasks

**Examples:**
- Create new component
- Add page layout
- Style existing component
- Add client-side validation
- Create custom hook

**Delegation:** Direct to frontend-engineer (skip orchestrator)

---

### Category 3: Review-Only Tasks

**Examples:**
- Code review PR
- Validate implementation
- Security audit
- Test coverage check
- Bug investigation

**Delegation:** Direct to code-reviewer (skip orchestrator)

---

### Category 4: Multi-Domain Tasks

**Examples:**
- New feature (DB + UI)
- CRUD operations
- Form with backend persistence
- Dashboard with data fetch

**Delegation:** Use orchestrator (backend → frontend → review)

---

### Category 5: Independent Parallel Tasks

**Examples:**
- Multiple unrelated bug fixes
- Several independent components
- Multiple code reviews
- Documentation for different features

**Delegation:** Parallel dispatch

---

## Domain Keyword Mapping

| Keyword Pattern | Primary Agent | Secondary |
|-----------------|---------------|-----------|
| "database", "table", "migration" | backend-engineer | - |
| "Server Action", "action" | backend-engineer | - |
| "RLS", "policy", "security" | backend-engineer | code-reviewer |
| "Supabase", "query" | backend-engineer | - |
| "component", "UI", "page" | frontend-engineer | - |
| "modal", "form", "button" | frontend-engineer | - |
| "style", "Tailwind", "CSS" | frontend-engineer | - |
| "hook", "state", "effect" | frontend-engineer | - |
| "review", "audit", "check" | code-reviewer | - |
| "test", "validate", "fix bug" | code-reviewer | - |
| "implement feature" | orchestrator | multi-agent |
| "build", "create" | orchestrator | analyze first |

---

## Error Recovery Matrix

| Error Type | Responsible Agent | Recovery Action |
|------------|-------------------|-----------------|
| TypeScript error in actions | backend-engineer | Fix types |
| TypeScript error in components | frontend-engineer | Fix props/imports |
| Runtime DB error | backend-engineer | Fix query/policy |
| Runtime UI error | frontend-engineer | Fix component |
| Lint error | Original author | Fix style |
| Test failure | code-reviewer | Investigate |
| Build failure (unknown) | Analyze first | Check error source |
