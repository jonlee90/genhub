# GenHub Common Gotchas

## HARD FAIL Issues

### 1. Supabase in Client Component
```
Error: Module not found: Can't resolve 'child_process'
```
**Fix**: Never import Supabase in `'use client'` - use Server Actions

### 2. Using Dialog Instead of BaseModal
**Fix**: Always use `<BaseModal>` - never `<Dialog>`

### 3. Forgetting RLS on New Tables
**Fix**: Every table needs RLS. Use `skills/database/rls-patterns.md`

## Common Mistakes

### 4. Direct Database Mutations in Components
**Wrong**: Calling Supabase directly in onClick
**Right**: Call Server Action, which calls Supabase

### 5. Missing Revalidation
**Wrong**: Mutation without `revalidatePath()`
**Right**: Always revalidate affected routes

### 6. Wrong Icon Library
**Wrong**: Using react-icons, heroicons, etc.
**Right**: Only Lucide React

### 7. Ignoring Token Budget
**Symptom**: Agent stops mid-task
**Fix**: backend-engineer 35k, frontend-engineer 45k max

### 8. Redefining Server Action Types Locally (TS2719) (2026-02-16)
**Issue**: Defining `type TradeLock = { ... }` locally in a component when `TradeLock` is already returned by a server action causes TS2719: "Two different types with this name exist, but they are unrelated." setState calls will fail even though both types have the same shape.

**Cause**: TypeScript treats types in different modules as distinct even if structurally identical.

**Solution**: Export the type from the server action file; import it in the component.

```typescript
// WRONG — local redeclaration causes TS2719
type TradeLock = { id: string; trade: string; ... }
const [locks, setLocks] = useState<TradeLock[]>([])
const { data } = await getActiveLocks(estimateId) // returns server action's TradeLock
setLocks(data) // TS2345 error!

// CORRECT — export from server action, import everywhere
// In app/actions/estimates.ts:
export type TradeLock = { id: string; trade: string; ... }
// In component:
import type { TradeLock } from '@/app/actions/estimates'
```

### 9. NextAuth + Supabase Realtime JWT Bridge (2026-02-16)
**Issue**: `getBrowserClient()` (anon key) does not pass the NextAuth session JWT to Supabase Realtime. For RLS-protected tables, `postgres_changes` subscriptions may silently fail to deliver events because the anon user has no `next_auth.uid()`.

**Cause**: The app uses NextAuth (not Supabase Auth), so the browser Supabase client is not automatically authenticated with the user's session.

**Solution (pending)**: Call `supabase.realtime.setAuth(session.access_token)` after getting the NextAuth session, OR use Supabase-native auth. Until resolved, Realtime on RLS-protected tables may not work for all users.

**Affected files**: `utils/supabase/browser.ts`, `components/estimates/ActivityFeed.tsx`, `components/estimates/CostEditor.tsx`

### 10. Rules of Hooks: Hook Called After Early Return (2026-02-16)
**Issue**: `React has detected a change in the order of Hooks called by {Component}. Previous render: undefined, Next render: useMemo` — hook count changes between renders.

**Cause**: A `useMemo`, `useCallback`, or other hook is declared **after** a conditional `return` statement. On renders where the condition is true, React bails out early and never reaches that hook. On renders where the condition is false, React reaches it — the order changes.

**Solution**: Move ALL hooks above ALL conditional returns. Hooks must always be called unconditionally.

```typescript
// WRONG — useMemo after early return
if (showSummary && hasPendingItems) {
  return <ConfidenceSummary />  // ← early return
}
const swipeItems = useMemo(() => items.filter(...), [items])  // ← NEVER reached on some renders

// CORRECT — hook before early return
const swipeItems = useMemo(() => items.filter(...), [items])  // ← always called
if (showSummary && hasPendingItems) {
  return <ConfidenceSummary />
}
```

### 11. `motion` Component Inside `LazyMotion strict` Context (2026-02-16)
**Issue**: `Error: You have rendered a 'motion' component within a 'LazyMotion' component. This will break tree shaking. Import and render a 'm' component instead.`

**Cause**: The app's `MotionProvider` wraps the entire tree with `<LazyMotion features={domAnimation} strict>`. In `strict` mode, using `motion.div` / `motion.p` etc. (which bundle all animation features inline) throws an invariant error.

**Solution**: Always import `m` (not `motion`) from `framer-motion`. Use `m.div`, `m.p`, `m.span` etc.

```typescript
// WRONG — breaks LazyMotion tree-shaking, throws in strict mode
import { motion, AnimatePresence } from 'framer-motion'
<motion.div animate={{ opacity: 1 }} />

// CORRECT
import { m, AnimatePresence } from 'framer-motion'
<m.div animate={{ opacity: 1 }} />
```

**Affected**: Any component under `app/` or `components/` (all are wrapped by MotionProvider).
**Note**: Also documented in `.claude/hooks/critical-rules.txt`.

## Quick Fixes

| Problem | Solution |
|---------|----------|
| Build fails with child_process | Move Supabase to Server Action |
| Modal won't close | Check BaseModal isOpen/onClose props |
| Data not updating | Add revalidatePath() to action |
| RLS blocking queries | Check company_id in policy |
| TS2719 "two types with same name" | Export type from server action, remove local redeclaration |
