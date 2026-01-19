# Design: Team Module Optimization

## Architecture Overview

This design applies Vercel React best practices to optimize the team module for performance. Changes are organized by impact level per the Vercel guidelines.

---

## 1. Eliminating Waterfalls (CRITICAL)

### 1.1 Optimize `getTeamPageData()` in `lib/team.ts`

**Current Issue (lines 46-88):**
```typescript
// Sequential: waits for companyUser before starting team fetch
const { data: companyUser } = await supabase
  .from("company_users")
  .select("company_id, role, status")
  ...

// Only then starts parallel fetches
const [teamMembersResult, projectCountsResult] = await Promise.all([...])
```

**Optimization:** Already uses Promise.all for team data, but the initial auth check is necessary and cannot be parallelized.

### 1.2 Optimize `getSubcontractorsPageData()` in `lib/team.ts`

**Current Issue (lines 156-184):**
Same pattern - initial company check is necessary for security (RLS).

**Assessment:** Both functions follow correct patterns. No waterfall issues detected.

---

## 2. Bundle Size Optimization (CRITICAL)

### 2.1 Direct Icon Imports

**Current Issue:** All files import from barrel file
```typescript
import { Users, UserCog, HardHat, ... } from "lucide-react"
```

**Fix:** Use direct imports
```typescript
import Users from "lucide-react/dist/esm/icons/users"
import UserCog from "lucide-react/dist/esm/icons/user-cog"
// etc.
```

**Files to update:**
- `app/app/team/page.tsx` (6 icons)
- `app/app/team/subcontractors/page.tsx` (4 icons)
- `components/team/TeamPageClient.tsx` (3 icons)
- `components/team/TeamMemberCard.tsx` (6 icons)
- `components/team/TeamMemberTable.tsx` (13 icons)
- `components/team/InviteTeamMemberModal.tsx` (12 icons)
- `components/team/SubcontractorList.tsx` (3 icons)
- `components/team/SubcontractorCard.tsx` (12 icons)
- `components/team/AddSubcontractorModal.tsx` (13 icons)
- `components/team/EditSubcontractorModal.tsx` (12 icons)

### 2.2 Dynamic Import Heavy Modals

**Current Issue:** Modals bundled with main chunk
```typescript
import { InviteTeamMemberModal } from "./InviteTeamMemberModal"
```

**Fix:** Use next/dynamic
```typescript
import dynamic from "next/dynamic"

const InviteTeamMemberModal = dynamic(
  () => import("./InviteTeamMemberModal").then(m => m.InviteTeamMemberModal),
  { ssr: false }
)
```

**Components to lazy load:**
- `InviteTeamMemberModal` (large form with validation)
- `AddSubcontractorModal` (large form with file uploads)
- `EditSubcontractorModal` (large form)

---

## 3. Re-render Optimization (MEDIUM)

### 3.1 Functional setState in TeamMemberTable.tsx

**Current Issue (line 227-247):**
```typescript
const handleRoleChange = useCallback(
  async (userId: string, newRole: UserRole) => {
    const previousMembers = [...optimisticMembers] // Uses closure
    setOptimisticMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)),
    )
    // ...
  },
  [optimisticMembers], // Dependency on optimisticMembers causes recreation
)
```

**Fix:** Use functional setState for rollback too
```typescript
const handleRoleChange = useCallback(
  async (userId: string, newRole: UserRole) => {
    // Capture current state via ref or just rely on rollback from server
    setOptimisticMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)),
    )

    startTransition(async () => {
      const result = await updateTeamMemberRole(userId, newRole)
      if (result.error) {
        // Trigger refresh instead of manual rollback
        router.refresh()
        toast.error(result.error)
      } else {
        toast.success("Role updated successfully")
      }
    })
  },
  [], // No dependencies needed
)
```

### 3.2 Remove Console Logs

**Files with debug console.log statements:**
- `components/team/InviteTeamMemberModal.tsx` (5 occurrences)
- `components/team/SubcontractorCard.tsx` (1 occurrence)
- `components/team/EditSubcontractorModal.tsx` (4 occurrences)

**Fix:** Remove all console.log statements or replace with proper logging in development only.

### 3.3 Stable Callbacks in TeamPageClient.tsx

**Current Issue (line 100-103):**
```typescript
const handleMemberTap = useCallback((member: TeamMember) => {
  console.log('[TeamPageClient] Member tapped:', member.user_profiles?.name)
}, [])
```

**Fix:** Remove the console.log, keep empty callback or remove if unused.

---

## 4. Code Deduplication

### 4.1 Extract Shared Types

**Issue:** `TeamMember` interface defined in 3 places:
- `lib/team.ts` (TeamMemberWithProfile)
- `components/team/TeamPageClient.tsx`
- `components/team/TeamMemberCard.tsx`
- `components/team/TeamMemberTable.tsx`

**Fix:** Create shared type in `types/team.ts`:
```typescript
import type { UserRole, MemberStatus } from "@/types/db/enums"

export interface TeamMember {
  id: string
  user_id: string
  role: UserRole
  status: MemberStatus
  activated_at: string | null
  invited_at: string | null
  user_profiles: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  } | null
  project_count: number
}

export interface TeamStats {
  total: number
  active: number
  invited: number
  admins: number
  projectManagers: number
  fieldWorkers: number
}
```

### 4.2 Extract Shared Config

**Issue:** `ROLE_CONFIG` and `STATUS_CONFIG` duplicated in:
- `components/team/TeamMemberCard.tsx`
- `components/team/TeamMemberTable.tsx`

**Fix:** Create shared config in `lib/team-config.ts`:
```typescript
import {
  Briefcase,
  Building2,
  HardHat,
  Hammer,
  Users,
  UserCheck,
} from "lucide-react/dist/esm/icons"

export const ROLE_CONFIG = { ... }
export const STATUS_CONFIG = { ... }
```

### 4.3 Extract StatCard Component

**Issue:** Stats grid cards repeated 6 times in `page.tsx` and 4 times in `subcontractors/page.tsx`

**Fix:** Create reusable `StatCard` component:
```typescript
// components/team/StatCard.tsx
interface StatCardProps {
  icon: LucideIcon
  label: string
  sublabel: string
  value: number
  colorClass: "blue" | "green" | "accent" | "yellow" | "red"
}

export function StatCard({ icon: Icon, label, sublabel, value, colorClass }: StatCardProps) {
  // Extract common stat card markup
}
```

---

## 5. Server-Side Performance (HIGH)

### 5.1 Minimize Serialization

**Current Issue:** Team page passes full member objects to client
```typescript
<TeamPageClient
  members={members}  // Full objects with all fields
  ...
/>
```

**Assessment:** The current implementation is acceptable because:
- `members` array is used for display (needs all fields for card/table)
- Stats are computed server-side before passing to client
- No unnecessary data is being serialized

**No changes needed for serialization.**

---

## 6. Rendering Performance (MEDIUM)

### 6.1 Content Visibility for Long Lists

**Fix in TeamMemberTable.tsx:**
```css
/* Add to global CSS or component */
.team-member-row {
  content-visibility: auto;
  contain-intrinsic-size: 0 60px;
}
```

### 6.2 Explicit Conditional Rendering

**Fix in SubcontractorCard.tsx (line 179):**
```typescript
// Current
{member.project_count > 0 && (...)}

// Better (already correct, no change needed)
{member.project_count > 0 ? (...) : null}
```

---

## Implementation Summary

| Priority | Category | Files | Changes |
|----------|----------|-------|---------|
| CRITICAL | Bundle Size - Icons | 10 files | Convert to direct imports |
| CRITICAL | Bundle Size - Modals | 3 files | Use next/dynamic |
| MEDIUM | Re-renders | 4 files | Remove console.logs, functional setState |
| MEDIUM | Code Dedup | 6 files | Extract shared types/config/components |
| LOW | Rendering | 2 files | CSS content-visibility |

---

## Testing Strategy

1. **Visual regression:** Verify team pages render identically
2. **Functionality:** Test invite, role change, deactivate flows
3. **Mobile:** Verify swipe actions still work
4. **Performance:** Compare bundle sizes before/after
5. **Build:** Ensure no TypeScript errors
