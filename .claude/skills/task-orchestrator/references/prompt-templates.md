# Agent Prompt Templates

Complete prompt templates for delegating to specialized agents.

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{feature}` | Feature name | "expense tracking" |
| `{spec_path}` | Path to spec file | ".claude/tasks/features/expenses/spec.md" |
| `{description}` | Inline spec | "Add ability to track project expenses" |
| `{files}` | List of file paths | "app/actions/expenses.ts, components/expenses/" |
| `{signatures}` | Function signatures | "createExpense(data), getExpenses(projectId)" |
| `{types}` | Type imports | "Expense, ExpenseInsert from types/db/expenses" |

---

## Backend Engineer Templates

### Standard Backend Task

```markdown
ORCHESTRATED=true

Feature: {feature}
Spec: {spec_path or description}

Scope:
- [ ] Migration: {yes/no, table name if yes}
- [ ] Server Actions: {list of actions needed}
- [ ] Types: {regenerate if schema changed}

Constraints:
- Do NOT modify UI components
- Do NOT create client-side code
- Follow existing action patterns in app/actions/

Return: status, files modified, function exports, critical issues only
```

### Migration Task

```markdown
ORCHESTRATED=true

Task: Create migration for {feature}

Requirements:
- Table: {table_name}
- Columns: {column definitions}
- Relations: {foreign keys}
- RLS: {policy requirements}

Follow GenHub patterns:
- Use snake_case for columns
- Add created_at, updated_at timestamps
- Enable RLS with appropriate policies
- Reference existing tables: {related_tables}

Return: migration file path, table schema summary
```

### Server Action Task

```markdown
ORCHESTRATED=true

Task: Create Server Actions for {feature}

Actions needed:
- create{Entity}(data: {Type}Insert): Promise<{Type}>
- get{Entity}(id: string): Promise<{Type} | null>
- update{Entity}(id: string, data: Partial<{Type}>): Promise<{Type}>
- delete{Entity}(id: string): Promise<void>
- list{Entity}s(filters?: {FilterType}): Promise<{Type}[]>

Use patterns from: app/actions/{reference_action}.ts

Return: file path, exported function names with signatures
```

---

## Frontend Engineer Templates

### Standard Frontend Task

```markdown
ORCHESTRATED=true

Feature: {feature}
Spec: {spec_path or description}

Backend context:
- Actions: {file path from backend phase}
- Functions: {signatures}
- Types: Import from types/db/{domain}.ts

Scope:
- [ ] Components: {list}
- [ ] Pages: {routes}
- [ ] Mobile: {yes/no}

Constraints:
- Do NOT access Supabase directly
- Use Server Actions for all data operations
- Follow GenHub component patterns
- Mobile-first: 375px min, 44px touch targets

Return: status, files modified, critical issues only
```

### Component Task

```markdown
ORCHESTRATED=true

Task: Create {ComponentName} component

Requirements:
- Purpose: {what it does}
- Props: {expected props}
- State: {local state needs}
- Actions: {Server Actions to call}

Design:
- Mobile-first (375px)
- Touch targets: 44px minimum
- Loading states required
- Error handling required

Pattern reference: components/{similar_component}.tsx

Return: component file path, exported component name
```

### Page Task

```markdown
ORCHESTRATED=true

Task: Create page for {route}

Requirements:
- Route: app/{path}/page.tsx
- Data: {what data to fetch}
- Components: {components to use}
- Layout: {layout requirements}

Server Actions:
- Import from: {action file path}
- Functions: {function names}

Return: page file path, route confirmation
```

---

## Code Reviewer Templates

### Post-Implementation Review

```markdown
Post-implementation review for {feature}

Files to review:
- Backend: {backend file paths}
- Frontend: {frontend file paths}

Focus areas:
1. Acceptance criteria from spec
2. Type safety and integration
3. Mobile compatibility (375px, 44px touch)
4. Error handling
5. GenHub patterns

Skip: Full violation scan (agents did critical checks)

Return: approved | needs-fixes (with specific issues)
```

### Bug Fix Review

```markdown
Review bug fix for: {bug description}

Files changed:
- {list of modified files}

Verify:
1. Bug is actually fixed
2. No regressions introduced
3. Root cause addressed (not just symptoms)
4. Tests pass

Return: approved | needs-fixes (with specific issues)
```

### Security Review

```markdown
Security review for {feature}

Files to audit:
- {file paths}

Check for:
1. SQL injection vulnerabilities
2. XSS risks
3. RLS policy gaps
4. Exposed secrets
5. Input validation
6. Auth/authz issues

Return: secure | vulnerabilities-found (with details and severity)
```

---

## Handoff Templates

### Backend → Frontend Handoff

```markdown
HANDOFF → frontend-engineer

Backend phase complete for: {feature}

Files created/modified:
- {file paths}

Exported functions:
- {function signatures}

Types available:
- Import {TypeName} from "types/db/{domain}"

Your task:
- {UI requirements from spec}

Mobile requirements: {yes/no}
```

### Frontend → Review Handoff

```markdown
HANDOFF → code-reviewer

Implementation complete for: {feature}

Backend files:
- {backend file paths}

Frontend files:
- {frontend file paths}

Your task:
- Review integration
- Verify acceptance criteria
- Check mobile compatibility
```

---

## Parallel Dispatch Templates

### Multiple Independent Components

```markdown
# Dispatch in single message (parallel)

Task 1:
ORCHESTRATED=true
Build {ComponentA} component
Requirements: {requirements A}
Pattern: {reference component}
Return: file path, component name

Task 2:
ORCHESTRATED=true
Build {ComponentB} component
Requirements: {requirements B}
Pattern: {reference component}
Return: file path, component name
```

### Multiple Bug Investigations

```markdown
# Dispatch in single message (parallel)

Task 1:
Investigate failure in {test_file_1}
Errors: {error messages}
Return: root cause, proposed fix

Task 2:
Investigate failure in {test_file_2}
Errors: {error messages}
Return: root cause, proposed fix
```

---

## Error Recovery Templates

### Build Error Fix (TypeScript)

```markdown
ORCHESTRATED=true

Build failed with TypeScript error:

Error: {error message}
File: {file path}
Line: {line number}

Fix this error. Do not change other files.

Return: fixed | cannot-fix (with reason)
```

### Build Error Fix (Lint)

```markdown
ORCHESTRATED=true

Build failed with lint error:

Error: {lint rule}: {message}
File: {file path}
Line: {line number}

Fix this error following the lint rule.

Return: fixed | cannot-fix (with reason)
```

### Agent Retry (After Failure)

```markdown
ORCHESTRATED=true

Previous attempt failed. Retrying with clarification:

Original task: {original prompt}

Previous error/issue: {what went wrong}

Additional context:
- {clarifying information}
- {missing context}

Please try again with this additional information.

Return: status, what was different this time
```
