# Session 2 Context: Epic 4 Task Split & Agent Enhancement

## Date
2025-12-06

## Session Overview
Continued from Session 1 (context exhausted). Completed two main tasks:
1. Split Epic 4: Team & PWA into individual task files
2. Enhanced the Supabase agent with comprehensive Next.js integration knowledge

## Prior Session Summary
- TaskModal Select fields fixed
- Date timezone issues fixed
- Priority-based theming implemented
- Critical priority removed from app
- Hydration mismatch fixed using useId()
- Documentation updated comprehensively

---

## Task 1: Epic 4 Task Split

### Action
Ran `/kc:split-task Epic 4: Team & PWA` command to split the master tasks.md into individual task files.

### Source File
`.claude/docs/specs/genhub-pwa/tasks.md` (Epic 4 at lines 723-977)

### Output Files Created
Directory: `.claude/docs/specs/Epic 4 - Team & PWA/tasks/`

| File | Task | Description | Effort |
|------|------|-------------|--------|
| `0001-create-team-server-actions.md` | E4-T1 | Team invitation, role updates, deactivation server actions | L |
| `0002-create-team-management-page.md` | E4-T2 | Team page, TeamMemberTable, InviteTeamMemberModal | L |
| `0003-create-subcontractor-server-actions.md` | E4-T3 | Subcontractor CRUD actions and document uploads | M |
| `0004-create-subcontractor-directory.md` | E4-T4 | SubcontractorList, SubcontractorCard, SubcontractorModal | L |
| `0005-configure-pwa-manifest-and-icons.md` | E4-T5 | PWA manifest.json, icons (192x192, 512x512), apple-touch-icon | S |
| `0006-create-service-worker-for-offline-support.md` | E4-T6 | Service worker with caching strategies, offline fallback | L |
| `0007-create-pwa-ui-components.md` | E4-T7 | InstallPrompt and OfflineBanner components | M |
| `0008-implement-mobile-responsive-design.md` | E4-T8 | Mobile responsive sidebar, Metro Journey, Kanban, forms | M |

---

## Task 2: Supabase Agent Enhancement

### Action
Updated `.claude/agents/supabase-realtime-optimizer.md` to become a comprehensive Supabase + Next.js expert.

### Changes Made

#### Renamed
- From: `supabase-realtime-optimizer`
- To: `supabase-nextjs-expert`

#### Added MCP Tools
```yaml
tools: Read, Edit, Bash, Grep, Write, mcp__supabase__*
```

#### 4 Core Expertise Areas Added

1. **Authentication & Session Management**
   - Cookie-based auth with `@supabase/ssr` package
   - Middleware session refresh patterns
   - Server Component and Client Component authentication
   - OAuth and social login integration
   - MFA implementation
   - Token refresh and session management

2. **Database Patterns & RLS**
   - Row Level Security (RLS) policy design
   - Performance-optimized RLS patterns (using `(SELECT auth.uid())`)
   - Database migrations and schema design
   - Triggers, functions, and stored procedures
   - Index optimization strategies
   - Multi-tenant database architecture

3. **Realtime Subscriptions**
   - WebSocket connection optimization
   - Channel and subscription management
   - Postgres Changes (INSERT, UPDATE, DELETE)
   - Presence and broadcast features
   - Connection stability and retry logic

4. **React Server Components Integration**
   - Server vs Client component patterns
   - Server Actions with Supabase
   - Route Handlers and API routes
   - Streaming and Suspense with Supabase data
   - Optimistic updates and revalidation

#### Key Code Examples Added

**Client Creation Patterns:**
```typescript
// Browser client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* ... */ },
      },
    }
  )
}
```

**Performance-Optimized RLS:**
```sql
-- GOOD: Caches auth.uid() result per-statement
CREATE POLICY "Users can view own data"
ON user_data FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

**Middleware Session Refresh:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Always use getUser() for security - never trust getSession() alone
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

#### Security Best Practices Added
- Always use `getUser()` on server, never trust `getSession()` alone
- Validate in Server Actions/Route Handlers
- Never expose service role key to client
- RLS security checklist included

#### Debugging Approaches Added
- Authentication issues troubleshooting
- RLS issues troubleshooting
- Realtime issues troubleshooting

---

## Files Modified/Created This Session

### Created
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0001-create-team-server-actions.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0002-create-team-management-page.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0003-create-subcontractor-server-actions.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0004-create-subcontractor-directory.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0005-configure-pwa-manifest-and-icons.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0006-create-service-worker-for-offline-support.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0007-create-pwa-ui-components.md`
- `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0008-implement-mobile-responsive-design.md`
- `.claude/tasks/context_session_2.md` (this file)

### Modified
- `.claude/agents/supabase-realtime-optimizer.md` (completely rewritten)

---

## Next Steps (Recommended)
1. Begin implementing Epic 4 tasks in order (E4-T1 through E4-T8)
2. Test the enhanced Supabase agent on authentication/database tasks
3. Consider splitting remaining Epics (1, 2, 3, 5) into individual task files if not already done
