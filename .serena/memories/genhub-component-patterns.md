# GenHub Component Patterns

## Critical Rules

### Never Supabase in Client
```typescript
// WRONG - causes build failure
'use client'
import { createClient } from '@supabase/supabase-js'

// CORRECT
import { getProjects } from '@/app/actions/projects'
```

### Always ResponsiveModal
```typescript
// ResponsiveModal auto-switches desktop (dialog) / mobile (bottom sheet)
<ResponsiveModal open={open} onOpenChange={setOpen} title="Edit" icon={Edit}>
  {children}
</ResponsiveModal>
```
> See full patterns: Serena memory `genhub-reuse-registry`

## Key Components (210+)

| Directory | Components |
|-----------|------------|
| ui/ | Button, Card, BaseModal, Input |
| dashboard/ | KPICard, TaskProgressWidget |
| tasks/ | TaskCard, TaskKanban, GanttView |
| projects/ | ProjectCard, PhaseTimeline |
| estimates/ | PlanViewer, CostEditor, EstimatesTabClient, CollaborationPresence, ActivityFeed |

## Props Patterns
```typescript
interface CardProps { entity: T; onEdit?: () => void }
interface FormProps { defaultValues?: T; onSuccess?: () => void }
interface ListProps { entities: T[]; onSelect?: (e: T) => void }
```

## Design
- Colors: `#001B51` primary, `#3C3C3C` accent
- Icons: Lucide only (w-4/w-5/w-6)
- Spacing: `p-4 md:p-6`

## Realtime Presence Hook Pattern (2026-02-16)

**When**: You need to show who else is viewing/editing the same resource.

**How**:
```typescript
// lib/collaboration/presence-tracker.ts
export function useEstimatePresence(estimateId: string): {
  users: PresenceUser[]
  updateCursor: (x: number, y: number) => void
  updateSection: (section: string | null) => void
}
```

Key implementation details:
- Use `createClient` from `@/utils/supabase/client` for the Realtime channel
- Throttle cursor updates: `useRef` timer, max every 200ms (never depend on state for throttling — use refs)
- Stable callbacks: `useCallback` + store mutable values in `useRef` to avoid resubscription
- Color: `hsl(hash(userId) % 360, 70%, 45%)` — deterministic, no import needed
- Cleanup: `channel.untrack()` + `supabase.removeChannel(channel)` on unmount
- Effect deps: Only `[estimateId, session?.user?.id]` — NOT name/email/image (those are captured at run-time)

```typescript
// Mount: track presence
channel.track({ userId, name, cursor: null, section: null })

// Cleanup: untrack + unsubscribe
return () => {
  channel.untrack()
  supabase.removeChannel(channel)
}
```

## Trade Lock Claim/Release Pattern (2026-02-16)

**When**: A user exclusively edits a trade section; others should see it locked.

**How** (in `CostEditor.tsx`):
```typescript
// On div wrapping trade section items:
onFocus={() => handleTradeFocus(trade)}
onBlur={() => handleTradeBlur(trade)}

// Focus handler — MUST await and check result
const handleTradeFocus = useCallback(async (trade: string) => {
  // Cancel pending release timer for this trade
  if (blurTimerRef.current[trade]) {
    clearTimeout(blurTimerRef.current[trade])
    delete blurTimerRef.current[trade]
  }
  const result = await claimTradeLock(estimateId, trade)
  if (!result.success && result.lockedBy) {
    // Surface conflict to user (toast or rely on TradeLockBanner)
  }
}, [estimateId])

// Blur handler — 500ms delay prevents releasing during focus transitions
const handleTradeBlur = useCallback((trade: string) => {
  blurTimerRef.current[trade] = setTimeout(() => {
    releaseTradeLock(estimateId, trade)
    delete blurTimerRef.current[trade]
  }, 500)
}, [estimateId])

// Cleanup ALL timers on unmount
return () => {
  Object.values(blurTimerRef.current).forEach(clearTimeout)
}
```

**Render locked section**:
```tsx
{isLockedByOther ? (
  <TradeLockBanner
    trade={trade}
    lockedByName={lock.locked_by_name ?? "Another user"}
    lockedByColor={deriveUserColor(lock.locked_by)}
  />
) : null}
<div className={isLockedByOther ? "pointer-events-none opacity-70" : ""}>
  {/* trade items */}
</div>
```

## Cross-References
- Reusable patterns: Serena memory `genhub-reuse-registry`
- Duplication hotspots: Serena memory `genhub-duplication-hotspots`
- Architecture: `.claude/docs/architecture-index.md`
