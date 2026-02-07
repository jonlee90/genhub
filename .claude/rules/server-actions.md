---
paths:
  - "app/actions/**/*.ts"
  - "app/api/**/*.ts"
---

# Server Action & API Route Rules

## Blocking
- Load `postgres-best-practices:postgres-best-practices` skill BEFORE editing
- Always call `auth()` first for authentication
- Include `company_id` in all RLS-filtered queries

## Imports
```typescript
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
```

## Patterns
- One action file per domain: `app/actions/{domain}.ts`
- Task-related: use `tasks-{feature}.ts` naming
- Always validate inputs with Zod before DB calls
- Use parameterized queries -- never string interpolation
