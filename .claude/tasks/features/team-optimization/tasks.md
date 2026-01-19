# Implementation Tasks: Team Module Optimization

**Status: COMPLETE ✅**
**Implemented:** 2026-01-19
**Agent:** frontend-engineer + code-reviewer
**Result:** All 11 tasks completed, code review approved

---

# Implementation Tasks: Team Module Optimization (Archive)

## Task 1: Create Shared Types and Config

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Files**:
  - Create: `types/team.ts`
  - Create: `lib/team-config.ts`
- **Details**:
  1. Create `types/team.ts` with shared `TeamMember` and `TeamStats` interfaces
  2. Create `lib/team-config.ts` with shared `ROLE_CONFIG` and `STATUS_CONFIG`
  3. Use direct Lucide icon imports in config file
- **Acceptance**:
  - Types exported and importable
  - Config uses direct icon imports

---

## Task 2: Convert Lucide Icons to Direct Imports - Page Files

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Depends on**: None
- **Files**:
  - `app/app/team/page.tsx`
  - `app/app/team/subcontractors/page.tsx`
- **Details**:
  Convert:
  ```typescript
  // From
  import { Users, UserCog, HardHat, Hammer, UserPlus, Shield } from "lucide-react"

  // To
  import Users from "lucide-react/dist/esm/icons/users"
  import UserCog from "lucide-react/dist/esm/icons/user-cog"
  import HardHat from "lucide-react/dist/esm/icons/hard-hat"
  import Hammer from "lucide-react/dist/esm/icons/hammer"
  import UserPlus from "lucide-react/dist/esm/icons/user-plus"
  import Shield from "lucide-react/dist/esm/icons/shield"
  ```
- **Acceptance**:
  - All Lucide imports use direct paths
  - Page renders correctly
  - Build passes

---

## Task 3: Convert Lucide Icons to Direct Imports - Component Files

- **Agent**: frontend-engineer
- **Complexity**: Medium
- **Depends on**: Task 1
- **Files**:
  - `components/team/TeamPageClient.tsx`
  - `components/team/TeamMemberCard.tsx`
  - `components/team/TeamMemberTable.tsx`
  - `components/team/SubcontractorList.tsx`
  - `components/team/SubcontractorCard.tsx`
- **Details**:
  1. Convert all Lucide barrel imports to direct imports
  2. Update imports to use shared types from `types/team.ts`
  3. Update imports to use shared config from `lib/team-config.ts`
  4. Remove duplicate `ROLE_CONFIG` and `STATUS_CONFIG` definitions
- **Acceptance**:
  - No barrel imports from lucide-react
  - Using shared types and config
  - Components render correctly

---

## Task 4: Convert Lucide Icons to Direct Imports - Modal Files

- **Agent**: frontend-engineer
- **Complexity**: Medium
- **Depends on**: None
- **Files**:
  - `components/team/InviteTeamMemberModal.tsx`
  - `components/team/AddSubcontractorModal.tsx`
  - `components/team/EditSubcontractorModal.tsx`
- **Details**:
  Convert all Lucide barrel imports to direct imports
- **Acceptance**:
  - No barrel imports from lucide-react
  - Modals function correctly

---

## Task 5: Dynamic Import Heavy Modals

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Depends on**: Task 4
- **Files**:
  - `components/team/TeamPageClient.tsx`
  - `components/team/TeamMemberTable.tsx`
  - `components/team/SubcontractorList.tsx`
- **Details**:
  ```typescript
  // In TeamPageClient.tsx
  import dynamic from "next/dynamic"

  const InviteTeamMemberModal = dynamic(
    () => import("./InviteTeamMemberModal").then(m => m.InviteTeamMemberModal),
    { ssr: false }
  )

  // In TeamMemberTable.tsx (also imports InviteTeamMemberModal)
  // Same pattern

  // In SubcontractorList.tsx
  const AddSubcontractorModal = dynamic(
    () => import("./AddSubcontractorModal").then(m => m.AddSubcontractorModal),
    { ssr: false }
  )

  // In SubcontractorCard.tsx
  const EditSubcontractorModal = dynamic(
    () => import("./EditSubcontractorModal").then(m => m.EditSubcontractorModal),
    { ssr: false }
  )
  ```
- **Acceptance**:
  - Modals load on demand
  - No SSR errors
  - Build passes

---

## Task 6: Remove Console.log Statements

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Depends on**: None
- **Files**:
  - `components/team/InviteTeamMemberModal.tsx`
  - `components/team/SubcontractorCard.tsx`
  - `components/team/EditSubcontractorModal.tsx`
  - `components/team/TeamPageClient.tsx`
- **Details**:
  Remove all `console.log` statements used for debugging
- **Acceptance**:
  - No console.log statements in team components
  - Functionality preserved

---

## Task 7: Optimize TeamMemberTable Callbacks

- **Agent**: frontend-engineer
- **Complexity**: Medium
- **Depends on**: Task 3
- **Files**:
  - `components/team/TeamMemberTable.tsx`
- **Details**:
  1. Update `handleRoleChange` to use functional setState without optimisticMembers dependency
  2. Update `handleDeactivate` to use router.refresh() for state sync
  3. Remove dependency on `optimisticMembers` from callbacks
- **Acceptance**:
  - Callbacks have minimal dependencies
  - Role change and deactivate still work
  - No stale closure bugs

---

## Task 8: Extract StatCard Component

- **Agent**: frontend-engineer
- **Complexity**: Medium
- **Depends on**: Task 2
- **Files**:
  - Create: `components/team/StatCard.tsx`
  - Update: `app/app/team/page.tsx`
  - Update: `app/app/team/subcontractors/page.tsx`
- **Details**:
  1. Create reusable `StatCard` component
  2. Accept props: icon, label, sublabel, value, colorClass
  3. Replace 6 stat cards in team page with component
  4. Replace 4 stat cards in subcontractors page with component
- **Acceptance**:
  - StatCard component created with direct icon imports
  - Both pages use StatCard component
  - Visual appearance unchanged

---

## Task 9: Add CSS Content Visibility

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Depends on**: Task 3
- **Files**:
  - `components/team/TeamMemberTable.tsx`
  - `app/globals.css` (or component CSS)
- **Details**:
  Add content-visibility optimization for table rows:
  ```css
  .team-member-row {
    content-visibility: auto;
    contain-intrinsic-size: 0 60px;
  }
  ```
- **Acceptance**:
  - CSS applied to table rows
  - Performance improvement for long lists

---

## Task 10: Update lib/team.ts Exports

- **Agent**: frontend-engineer
- **Complexity**: Simple
- **Depends on**: Task 1
- **Files**:
  - `lib/team.ts`
- **Details**:
  1. Import and re-export types from `types/team.ts`
  2. Update return types to use shared interfaces
- **Acceptance**:
  - Types imported from shared location
  - No duplicate type definitions

---

## Task 11: Code Review and Build Verification

- **Agent**: code-reviewer
- **Complexity**: Simple
- **Depends on**: Tasks 1-10
- **Files**: All modified files
- **Details**:
  1. Run `npm run build`
  2. Verify no TypeScript errors
  3. Check for any remaining console.log statements
  4. Verify no barrel imports from lucide-react
  5. Test team page functionality
  6. Test subcontractors page functionality
- **Acceptance**:
  - Build passes without errors
  - All team features work correctly
  - No performance regressions

---

## Execution Order

```
Phase 1 (Foundations):
  Task 1: Create Shared Types and Config

Phase 2 (Bundle Optimization - can run in parallel):
  Task 2: Convert Icons - Page Files
  Task 3: Convert Icons - Component Files
  Task 4: Convert Icons - Modal Files
  Task 6: Remove Console.logs

Phase 3 (Dynamic Imports):
  Task 5: Dynamic Import Heavy Modals

Phase 4 (Re-render Optimization):
  Task 7: Optimize TeamMemberTable Callbacks

Phase 5 (Code Deduplication):
  Task 8: Extract StatCard Component
  Task 10: Update lib/team.ts Exports

Phase 6 (Rendering Performance):
  Task 9: Add CSS Content Visibility

Phase 7 (Verification):
  Task 11: Code Review and Build Verification
```

---

## Estimated Impact

| Optimization | Expected Improvement |
|-------------|---------------------|
| Direct icon imports | 15-30% faster dev boot, smaller bundle |
| Dynamic modal imports | ~50-100KB off initial bundle |
| Removed console.logs | Cleaner production code |
| Stable callbacks | Fewer unnecessary re-renders |
| Content visibility | Faster render for large teams |
| Code deduplication | Better maintainability |
