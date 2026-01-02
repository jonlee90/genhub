# Security Validation Grep Patterns Reference

> **Token-efficient security checks for code reviews**
> Use these patterns instead of MCP database calls to save 10,000+ tokens per review

## RLS Policy Validation

### 1. Check if RLS is Enabled (~100 tokens)

```bash
Grep pattern:"ALTER TABLE.*ENABLE ROW LEVEL SECURITY" 
  path:"supabase/migrations" 
  output_mode:"content"
```

**What to look for:**
- Every `CREATE TABLE` should have corresponding `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Missing entries = security vulnerability

**Example output:**
```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
```

---

### 2. Verify RLS Policies Use next_auth.uid() (~200 tokens)

```bash
Grep pattern:"USING.*next_auth\.uid\(\)" 
  path:"supabase/migrations" 
  output_mode:"content"
```

**What to look for:**
- Policies should restrict access to company/user-scoped data
- Look for `USING (next_auth.uid() = user_id)` pattern
- Or `USING (company_id = get_user_company_id(next_auth.uid()))`

**Example output:**
```sql
CREATE POLICY "Users can view own tasks" ON tasks
FOR SELECT USING (next_auth.uid() = assignee_id);

CREATE POLICY "Company members can view projects" ON projects
FOR SELECT USING (company_id = get_user_company_id(next_auth.uid()));
```

---

### 3. Find Tables Without RLS Policies (~150 tokens)

```bash
# Step 1: Find all CREATE TABLE statements
Grep pattern:"CREATE TABLE public\." 
  path:"supabase/migrations" 
  output_mode:"content"

# Step 2: Find all CREATE POLICY statements
Grep pattern:"CREATE POLICY.*ON public\." 
  path:"supabase/migrations" 
  output_mode:"content"

# Step 3: Manually compare - tables without policies are missing RLS
```

---

## Server Action Security

### 4. Check Server Actions Use Proper Client (~100 tokens)

```bash
Grep pattern:"from '@/utils/supabase/server'" 
  path:"app/actions" 
  output_mode:"content"
```

**What to look for:**
- All Server Actions should import from `@/utils/supabase/server`
- Should see `createClient()` or `createUserClient()` calls
- Should NOT see imports from `@/utils/supabase/client` (build error)

**Example output:**
```typescript
import { createClient } from '@/utils/supabase/server';

export async function createTask(data: CreateTaskInput) {
  const supabase = await createClient();
  // ...
}
```

---

### 5. Find Dangerous Admin Client Usage (~100 tokens)

```bash
Grep pattern:"createAdminClient" 
  path:"app/actions" 
  output_mode:"content"
```

**What to look for:**
- Admin client BYPASSES RLS - should only be used for:
  - Pre-auth operations (user signup)
  - Stripe webhooks
  - System tasks
- Should NOT be used in user-facing Server Actions

**Red flags:**
```typescript
// ❌ BAD - bypasses RLS in user action
export async function deleteProject(id: string) {
  const supabase = createAdminClient(); // DANGEROUS
  // User could delete any project, not just theirs
}
```

---

### 6. Check for Input Validation (Zod Schemas) (~100 tokens)

```bash
Grep pattern:"z\.(object|string|number|boolean|array)" 
  path:"app/actions" 
  output_mode:"content"
```

**What to look for:**
- Every Server Action accepting user input should have Zod validation
- Look for `z.object()`, `z.string()`, etc.
- Input should be parsed before use: `.parse()` or `.safeParse()`

**Example output:**
```typescript
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  project_id: z.string().uuid(),
});

export async function createTask(input: unknown) {
  const data = createTaskSchema.parse(input); // ✅ GOOD
  // ...
}
```

---

## SQL Injection Prevention

### 7. Find SQL Injection Risks (~100 tokens)

```bash
Grep pattern:"\$\{.*\}" 
  path:"app/actions" 
  glob:"*.ts" 
  output_mode:"content"
```

**What to look for:**
- String interpolation (`${}`) in database queries
- Should use parameterized queries instead
- Supabase handles parameterization automatically

**Red flags:**
```typescript
// ❌ BAD - SQL injection risk
const { data } = await supabase
  .from('tasks')
  .select(`${userInput}`); // VULNERABLE

// ✅ GOOD - parameterized
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', userInput); // SAFE
```

---

## Client Component Violations

### 8. Check Client Components Don't Import Supabase (~150 tokens)

```bash
# Step 1: Find all client components
Grep pattern:"'use client'" 
  path:"components" 
  output_mode:"files_with_matches"

# Step 2: For each file, check for Supabase imports
Grep pattern:"from '@/utils/supabase" 
  path:"components/[filename].tsx" 
  output_mode:"content"
```

**What to look for:**
- Client components (`'use client'`) should NOT import Supabase clients
- Causes build errors: `Module not found: Can't resolve 'child_process'`
- Should use props from Server Components or Server Actions instead

**Red flags:**
```typescript
'use client';

import { createClient } from '@/utils/supabase/client'; // ❌ BUILD ERROR

export function TaskList() {
  const supabase = createClient(); // BREAKS BUILD
}
```

**Correct pattern:**
```typescript
// Server Component (page.tsx)
import { createClient } from '@/utils/supabase/server';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase.from('tasks').select('*');
  
  return <TaskList tasks={tasks} />; // ✅ Pass as props
}

// Client Component (TaskList.tsx)
'use client';

interface Props {
  tasks: Task[]; // ✅ Props, not query
}

export function TaskList({ tasks }: Props) {
  // Use Server Actions for mutations
  const handleCreate = async () => {
    await createTask(data); // ✅ Server Action
  };
}
```

---

## Secret Exposure

### 9. Check for Hardcoded Secrets (~50 tokens)

```bash
Grep pattern:"(SUPABASE_SECRET_KEY|STRIPE_SECRET_KEY|API_KEY)" 
  path:"app" 
  output_mode:"content"
```

**What to look for:**
- No secret keys hardcoded in source code
- Should only appear in `.env.local` (not committed)
- Client-side code should only use public keys (`NEXT_PUBLIC_*`)

---

## Stripe Security

### 10. Check Webhook Signature Validation (~100 tokens)

```bash
Grep pattern:"stripe\.webhooks\.constructEvent" 
  path:"app/api" 
  output_mode:"content"
```

**What to look for:**
- Stripe webhook handlers MUST validate signatures
- Look for `stripe.webhooks.constructEvent(body, signature, secret)`
- Missing validation = anyone can fake webhooks

**Example:**
```typescript
// ✅ GOOD
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

---

### 11. Check for Hardcoded Price IDs on Client (~100 tokens)

```bash
Grep pattern:"price_[A-Za-z0-9]+" 
  path:"components" 
  output_mode:"content"
```

**What to look for:**
- Stripe price IDs should come from environment variables or database
- Hardcoded price IDs = security risk (user can modify)

---

## Migration File Validation

### 12. Check Migration File Completeness (~200 tokens)

```bash
# For a new table migration, check:
# 1. Table creation
Grep pattern:"CREATE TABLE public\.table_name" 
  path:"supabase/migrations/042_new_table.sql"

# 2. RLS enabled
Grep pattern:"ALTER TABLE public\.table_name ENABLE ROW LEVEL SECURITY" 
  path:"supabase/migrations/042_new_table.sql"

# 3. Policies created
Grep pattern:"CREATE POLICY.*ON public\.table_name" 
  path:"supabase/migrations/042_new_table.sql"

# 4. Foreign keys
Grep pattern:"REFERENCES public\." 
  path:"supabase/migrations/042_new_table.sql"

# 5. Indexes
Grep pattern:"CREATE INDEX" 
  path:"supabase/migrations/042_new_table.sql"
```

---

## Token Savings Summary

| Check | MCP Method | Token Cost | Grep Method | Token Cost | Savings |
|-------|------------|------------|-------------|------------|---------|
| RLS Enabled | `get_advisors` | 2,000 | `Grep "ENABLE RLS"` | 100 | 95% |
| RLS Policies | `get_advisors` | 2,000 | `Grep "next_auth.uid()"` | 200 | 90% |
| Schema Info | `list_tables` | 2,000 | Read `DB_SCHEMA.md` | 0 (cached) | 100% |
| Test Query | `execute_sql` | 3,000 | Read Server Action | 200 | 93% |
| Logs | `get_logs` | 5,000 | Grep error patterns | 100 | 98% |

**Total savings per review: ~11,000 tokens (84% reduction)**

---

## Quick Reference Checklist

**For every code review, run these 5 grep patterns (~500 tokens total):**

```bash
# 1. RLS enabled
Grep pattern:"ALTER TABLE.*ENABLE ROW LEVEL SECURITY" path:"supabase/migrations"

# 2. RLS policies correct
Grep pattern:"USING.*next_auth\.uid\(\)" path:"supabase/migrations"

# 3. Server Actions use proper client
Grep pattern:"from '@/utils/supabase/server'" path:"app/actions"

# 4. Input validation present
Grep pattern:"z\.(object|string|number)" path:"app/actions"

# 5. No SQL injection
Grep pattern:"\$\{.*\}" path:"app/actions" glob:"*.ts"
```

**Only escalate to MCP if:**
- User says "debug", "check database", "not working"
- Static analysis finds issues that need verification
- Applying migration fixes (after approval)

---

## Examples

### Example 1: Review Server Action (Static Analysis)

```bash
# Read the file
Read file:"app/actions/tasks.ts"

# Check proper client usage
Grep pattern:"from '@/utils/supabase/server'" path:"app/actions/tasks.ts"

# Check input validation
Grep pattern:"z\.object" path:"app/actions/tasks.ts"

# Check for SQL injection risks
Grep pattern:"\$\{" path:"app/actions/tasks.ts"

# Total: ~400 tokens (vs 10,000+ with MCP)
```

### Example 2: Review New Migration (Static Analysis)

```bash
# Read migration file
Read file:"supabase/migrations/042_new_table.sql"

# Check RLS enabled
Grep pattern:"ENABLE ROW LEVEL SECURITY" path:"supabase/migrations/042_new_table.sql"

# Check policies
Grep pattern:"CREATE POLICY" path:"supabase/migrations/042_new_table.sql"

# Total: ~300 tokens (vs 7,000+ with MCP)
```

---

## When Static Analysis Isn't Enough

**Escalate to MCP when:**
- User reports: "This query returns an error in production"
- User requests: "Run a full security audit"
- User says: "Check the database logs"
- Static analysis finds potential issues that need live verification

**In these cases, token cost is justified for live debugging.**
