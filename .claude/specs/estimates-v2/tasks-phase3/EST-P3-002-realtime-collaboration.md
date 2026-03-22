# EST-P3-002: Real-Time Collaboration

**Parent Task:** `EST-P3-002` in `tasks-phase3-phase4.md`
**Priority:** P2 - Future
**Total Effort:** ~5 days
**Dependencies:** None (uses Supabase Realtime, no upstream task deps)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P3-002-A | Database migrations | backend-engineer | 0.5d | — |
| P3-002-B | Server actions | backend-engineer | 0.5d | P3-002-A |
| P3-002-C | Presence tracker hook | frontend-engineer | 1.0d | P3-002-A |
| P3-002-D | Conflict resolver | frontend-engineer | 0.5d | — |
| P3-002-E | Presence + Cursor components | frontend-engineer | 1.0d | P3-002-C |
| P3-002-F | Activity feed + Trade lock banner | frontend-engineer | 0.5d | P3-002-B |
| P3-002-G | EstimatesTabClient + CostEditor wire-up | frontend-engineer | 0.5d | P3-002-E, P3-002-F |

---

## P3-002-A: Database Migrations

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_estimate_collaboration.sql`

**Task:**
Create two tables: `estimate_locks` (trade-level exclusive editing) and `estimate_activity` (audit log for activity feed).

```sql
CREATE TABLE public.estimate_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  locked_by UUID NOT NULL REFERENCES profiles(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  company_id UUID NOT NULL REFERENCES companies(id),
  UNIQUE(estimate_id, trade)
);

CREATE INDEX idx_estimate_locks_estimate ON estimate_locks(estimate_id);
CREATE INDEX idx_estimate_locks_expires ON estimate_locks(expires_at);

CREATE TABLE public.estimate_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'item_added', 'item_edited', 'item_deleted',
    'cost_updated', 'assembly_applied',
    'bulk_accepted', 'bulk_rejected'
  )),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimate_activity_estimate ON estimate_activity(estimate_id, created_at DESC);
```

Enable Realtime on both tables in Supabase dashboard (or via migration publication).

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] UNIQUE constraint on (estimate_id, trade) enforced
- [ ] RLS blocks cross-company access
- [ ] `npm run db:gen-types` produces updated types

---

## P3-002-B: Server Actions

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P3-002-A

**Files:**
- `app/actions/estimates.ts` (add to existing file)

**Signatures:**
```typescript
claimTradeLock(estimateId: string, trade: string): Promise<{ success: boolean; lockedBy?: string; error?: string }>
// Returns success=false + lockedBy name if trade already locked by someone else

releaseTradeLock(estimateId: string, trade: string): Promise<{ error: string | null }>

getActiveLocks(estimateId: string): Promise<{ data: TradeLock[]; error: string | null }>

logEstimateActivity(estimateId: string, actionType: ActivityType, details?: Record<string, unknown>): Promise<void>
// Called internally by other server actions (item CRUD, cost updates)

getEstimateActivity(estimateId: string, limit?: number): Promise<{ data: EstimateActivity[]; error: string | null }>
```

A cron or DB function should expire stale locks (where `expires_at < now()`). Add a cleanup function or pg_cron note in the migration comments.

**Acceptance Criteria:**
- [ ] `claimTradeLock` is idempotent for the same user
- [ ] Returns conflict error when different user holds lock
- [ ] `releaseTradeLock` only releases own lock
- [ ] `getEstimateActivity` returns newest first

---

## P3-002-C: Presence Tracker Hook

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-002-A

**Files:**
- `lib/collaboration/presence-tracker.ts` (new)

**Task:**
Custom React hook wrapping Supabase Realtime presence channel.

```typescript
interface PresenceUser {
  userId: string
  name: string
  avatarUrl?: string
  color: string           // HSL derived from userId hash
  cursor?: { x: number; y: number }
  section?: string        // trade section being edited
  lastSeen: number        // timestamp
}

export function useEstimatePresence(estimateId: string): {
  users: PresenceUser[]
  updateCursor: (x: number, y: number) => void
  updateSection: (section: string | null) => void
}
```

Implementation notes:
- `channel.track({ userId, name, cursor, section })` on mount
- Broadcast cursor position max every 200ms (throttled with `useRef` + `setTimeout`)
- Derive user color: `hsl(hash(userId) % 360, 70%, 45%)`
- Mark user offline after 1s of no presence heartbeat
- Untrack + unsubscribe on unmount

**Skills Applied:**
- `rerender-memo` — stable callback refs to avoid re-subscribing

**Acceptance Criteria:**
- [ ] Multiple browser tabs show distinct presence entries
- [ ] Cursor updates throttled to ≤200ms intervals
- [ ] Unmount cleans up channel subscription
- [ ] Color derivation is deterministic per userId

---

## P3-002-D: Conflict Resolver

**Agent:** frontend-engineer
**Effort:** 0.5 days

**Files:**
- `lib/collaboration/conflict-resolver.ts` (new)

**Task:**
Last-write-wins logic with user notification.

```typescript
export interface ConflictEvent {
  field: string
  ourValue: unknown
  theirValue: unknown
  theirUserName: string
  resolvedAt: number
}

export function resolveConflict(
  localUpdate: { value: unknown; timestamp: number },
  remoteUpdate: { value: unknown; timestamp: number; userName: string }
): { winner: 'local' | 'remote'; conflict?: ConflictEvent }
```

The resolved value is whichever has the higher timestamp. If remote wins, return a `ConflictEvent` for the toast notification: _"[Name] also edited this field. Their changes were kept."_

**Acceptance Criteria:**
- [ ] Higher timestamp wins
- [ ] Equal timestamps: local wins (no-op)
- [ ] Returns `ConflictEvent` only when remote wins
- [ ] Pure function with no side effects

---

## P3-002-E: CollaborationPresence + UserCursor Components

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-002-C

**Files:**
- `components/estimates/CollaborationPresence.tsx` (new)
- `components/estimates/UserCursor.tsx` (new)

**Task:**

**`CollaborationPresence`:** Avatar stack showing who is currently in the estimate.
- Show up to 4 avatars + "+N more" overflow
- Tooltip on hover: "Jane Doe — editing Framing"
- Only render when `users.length > 1` (ternary, not `&&`)
- "User X is viewing this estimate" banner when another user joins

```typescript
interface CollaborationPresenceProps {
  estimateId: string
}
```

**`UserCursor`:** Floating cursor label for remote users.
- SVG pointer icon in user's color
- Name label below cursor
- Absolute positioned inside plan viewer canvas
- Fades out after 2s of no cursor movement

**Skills Applied:**
- `rerender-memo` — memo UserCursor to avoid full re-render on every cursor update
- `rendering-conditional-render` — ternary for presence banner
- `bundle-barrel-imports` — direct Lucide imports

**Mobile Checks:**
- [ ] Avatar stack is `min-h-[44px]`
- [ ] `dark:` variants on avatar border + banner bg

**Acceptance Criteria:**
- [ ] Avatar stack renders correctly for 1, 4, and 7+ users
- [ ] Remote cursors render at correct position
- [ ] Cursors fade after 2s inactivity
- [ ] No render when only 1 user present

---

## P3-002-F: ActivityFeed + TradeLockBanner

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-002-B

**Files:**
- `components/estimates/ActivityFeed.tsx` (new)
- `components/estimates/TradeLockBanner.tsx` (new)

**Task:**

**`ActivityFeed`:**
- Realtime subscription to `estimate_activity` for current estimate
- Shows last 20 actions: "{User} added {item}" / "{User} updated cost for {trade}"
- Collapsible panel (default: collapsed on mobile, expanded on desktop)
- Timestamp: relative ("2 min ago")

**`TradeLockBanner`:**
- Shows inline in trade section header when locked by another user
- "Jane Doe is editing this section — editing disabled"
- Lock icon + user color dot
- Dismiss when lock expires or is released

**Mobile Checks:**
- [ ] ActivityFeed panel has `pb-[env(safe-area-inset-bottom)]`
- [ ] TradeLockBanner is `min-h-[44px]`
- [ ] `dark:` variants on both

**Acceptance Criteria:**
- [ ] ActivityFeed updates in real time without page refresh
- [ ] TradeLockBanner appears when `getActiveLocks` returns a lock for that trade
- [ ] Correct relative timestamps

---

## P3-002-G: EstimatesTabClient + CostEditor Wire-up

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-002-E, P3-002-F

**Files:**
- `components/estimates/EstimatesTabClient.tsx` (modified)
- `components/estimates/CostEditor.tsx` (modified)

**Task:**

**`EstimatesTabClient.tsx`:**
- Mount `<CollaborationPresence estimateId={id} />` in the tab header
- Initialize presence channel via `useEstimatePresence` hook
- Show "User X joined" toast via `conflict-resolver`

**`CostEditor.tsx`:**
- Per-trade section: show `<TradeLockBanner>` if trade is locked
- On focus of any trade section: call `claimTradeLock(estimateId, trade)`
- On blur/unmount: call `releaseTradeLock(estimateId, trade)`
- Typing indicator: broadcast `section` to presence channel on keydown, clear on blur after 3s

**Acceptance Criteria:**
- [ ] Lock claimed on section focus, released on blur
- [ ] Locked section shows `TradeLockBanner` and disables inputs
- [ ] Presence avatars visible in tab header
- [ ] Build passes with no TS errors
