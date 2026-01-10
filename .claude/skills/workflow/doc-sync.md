# Skill: Documentation Sync

> Keep documentation synchronized with code changes

## When to Use

- After any database migration
- After creating/modifying Server Actions
- After creating/modifying components
- After adding/changing routes
- After any implementation task

## Prerequisites

- Changes have been implemented
- Build passes successfully
- Know which categories were affected

---

## Quick Reference

### Index Files
```
.claude/docs/indexes/
├── tables.md      # Database tables
├── actions.md     # Server Actions
├── components.md  # React components
├── routes.md      # App routes
└── enums.md       # Database enums
```

### Update Triggers
| Change Type | Update Required |
|-------------|-----------------|
| CREATE TABLE | tables.md |
| Server Action added | actions.md |
| Component added | components.md |
| Page/route added | routes.md |
| Enum created | enums.md |

---

## Tables Index

### Format
```markdown
## Tables Index

### Table: table_name
- **Purpose:** What this table stores
- **RLS:** Policy type (company/project/user/public)
- **Key columns:** id, name, status, company_id
- **Foreign keys:** project_id → projects, user_id → users
- **Created:** YYYY-MM-DD

### Example Entry
### Table: task_comments
- **Purpose:** Comments on tasks
- **RLS:** project-scoped via task.project_id
- **Key columns:** id, task_id, user_id, content, created_at
- **Foreign keys:** task_id → tasks, user_id → users
- **Created:** 2024-01-15
```

### Update Process
```markdown
1. After migration deployed:
   mcp__supabase__list_tables

2. Add new table entry to tables.md

3. Include:
   - Table name
   - Purpose (1 sentence)
   - RLS type
   - Key columns (not all, just important ones)
   - Foreign key relationships
   - Creation date
```

---

## Actions Index

### Format
```markdown
## Server Actions Index

### File: app/actions/tasks.ts
| Action | Purpose | Auth | Returns |
|--------|---------|------|---------|
| getTasks | Fetch tasks with filters | user | Task[] |
| createTask | Create new task | user | Task |
| updateTask | Update task fields | user | Task |
| deleteTask | Soft delete task | user | void |

### Example Entry
### File: app/actions/comments.ts
| Action | Purpose | Auth | Returns |
|--------|---------|------|---------|
| getTaskComments | Get comments for task | user | Comment[] |
| createComment | Add comment to task | user | Comment |
| deleteComment | Delete own comment | owner | void |
```

### Update Process
```markdown
1. After Server Action created:
   - Check if file section exists
   - If not, create new file section
   - Add action row with:
     - Action name
     - Purpose (brief)
     - Auth level (user/admin/owner/none)
     - Return type
```

---

## Components Index

### Format
```markdown
## Components Index

### Directory: components/tasks/
| Component | Purpose | Props | Client |
|-----------|---------|-------|--------|
| TaskCard | Display task in list | task, onEdit | Yes |
| TaskBoard | Kanban view | tasks, onMove | Yes |
| TaskDetail | Full task view | taskId | No |

### Example Entry
### Directory: components/comments/
| Component | Purpose | Props | Client |
|-----------|---------|-------|--------|
| CommentList | Display comments | comments, taskId | Yes |
| CommentItem | Single comment | comment, onDelete | Yes |
| CommentInput | Add new comment | taskId, onSubmit | Yes |
```

### Update Process
```markdown
1. After component created:
   - Find or create directory section
   - Add row with:
     - Component name
     - Purpose (brief)
     - Key props
     - Client component? (Yes/No)
```

---

## Routes Index

### Format
```markdown
## Routes Index

### Section: /app/tasks
| Route | Page | Layout | Auth |
|-------|------|--------|------|
| /app/tasks | TasksPage | AppLayout | Required |
| /app/tasks/[id] | TaskDetailPage | AppLayout | Required |
| /app/tasks/[id]/edit | TaskEditPage | AppLayout | Required |

### Example Entry
### Section: /app/comments
| Route | Page | Layout | Auth |
|-------|------|--------|------|
| /app/tasks/[id]/comments | CommentsPage | TaskLayout | Required |
```

### Update Process
```markdown
1. After page/route created:
   - Find or create section
   - Add row with:
     - Route pattern
     - Page component name
     - Layout used
     - Auth requirement
```

---

## Enums Index

### Format
```markdown
## Enums Index

### Enum: task_status
- **Values:** todo, in_progress, blocked, done
- **Used in:** tasks.status
- **Created:** 2024-01-10

### Example Entry
### Enum: comment_type
- **Values:** text, system, mention
- **Used in:** task_comments.type
- **Created:** 2024-01-15
```

### Update Process
```markdown
1. After enum created:
   - Add section with:
     - Enum name
     - All values
     - Tables/columns using it
     - Creation date
```

---

## Sync Workflow

### After Implementation

```markdown
## Doc Sync Checklist

### 1. Identify Changes
What was modified?
- [ ] Database tables
- [ ] Server Actions
- [ ] Components
- [ ] Routes
- [ ] Enums

### 2. Update Indexes
For each category, update the index file:

Tables changed:
→ Read .claude/docs/indexes/tables.md
→ Add/update entries
→ Write updated file

Actions changed:
→ Read .claude/docs/indexes/actions.md
→ Add/update entries
→ Write updated file

Components changed:
→ Read .claude/docs/indexes/components.md
→ Add/update entries
→ Write updated file

Routes changed:
→ Read .claude/docs/indexes/routes.md
→ Add/update entries
→ Write updated file

Enums changed:
→ Read .claude/docs/indexes/enums.md
→ Add/update entries
→ Write updated file

### 3. Verify Sync
- [ ] All new items documented
- [ ] No stale entries
- [ ] Format consistent
```

---

## Automated Sync Pattern

### Full Sync Script
```typescript
// Conceptual - run after major changes

async function syncDocs() {
  // 1. Get current database state
  const tables = await mcp__supabase__list_tables()

  // 2. Get current actions
  const actionFiles = await glob('app/actions/*.ts')

  // 3. Get current components
  const componentFiles = await glob('components/**/*.tsx')

  // 4. Get current routes
  const pageFiles = await glob('app/app/**/page.tsx')

  // 5. Compare with indexes
  // 6. Report differences
  // 7. Update indexes
}
```

---

## Stale Doc Detection

### Signs of Stale Docs
```markdown
Warning signs:
- Table in database not in tables.md
- Action file not in actions.md
- Component not in components.md
- Route not in routes.md
- Enum used in code not documented

Detection commands:
# Find tables not documented
mcp__supabase__list_tables
# Compare with tables.md entries

# Find undocumented actions
grep -r "export async function" app/actions/
# Compare with actions.md entries

# Find undocumented components
find components -name "*.tsx" -type f
# Compare with components.md entries
```

---

## Anti-Patterns

```markdown
# WRONG: Skip doc sync
"I'll update docs later"
→ Docs become stale, context lost

# WRONG: Over-document
Document every internal helper function
→ Noise, maintenance burden

# WRONG: Wrong format
Use different format than established
→ Inconsistency, harder to parse

# WRONG: No dates
Skip creation dates
→ Can't track when things changed

# CORRECT: Sync immediately
Update docs as part of implementation task
→ Always accurate, context fresh
```

---

## Integration with Agents

### In Agent Workflow
```markdown
## After Implementation

backend-engineer completes migration:
→ Update tables.md
→ Update enums.md (if applicable)

backend-engineer creates Server Action:
→ Update actions.md

frontend-engineer creates component:
→ Update components.md

frontend-engineer creates page:
→ Update routes.md
→ Update components.md
```

### Agent Handoff
```markdown
When delegating doc sync:

"Update documentation indexes:
- tables.md: Added task_comments table
- actions.md: Added getTaskComments, createComment, deleteComment
- components.md: Added CommentList, CommentItem, CommentInput
- routes.md: No new routes

Format per existing patterns in each index file."
```

---

## Checklist

- [ ] Identified all changes made
- [ ] Updated tables.md for database changes
- [ ] Updated actions.md for Server Actions
- [ ] Updated components.md for components
- [ ] Updated routes.md for pages/routes
- [ ] Updated enums.md for enums
- [ ] Format consistent with existing entries
- [ ] No stale entries remaining
- [ ] Dates included where required
