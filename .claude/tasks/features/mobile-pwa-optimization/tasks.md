# Implementation Tasks: Mobile PWA Optimization

> Atomic task breakdown for transforming GenHub into a native-feel iOS mobile app

**Status**: Phase 3 - Implementation Plan
**Design**: [design.md](./design.md) - APPROVED
**Requirement**: [requirement.md](./requirement.md) - APPROVED

---

## Overview

| Priority | Tasks | Agent | Est. Complexity |
|----------|-------|-------|-----------------|
| P0 | 1-4 | frontend-engineer | Medium |
| P1 | 5-10 | frontend-engineer | Medium |
| P2 | 11-16 | frontend-engineer | Simple-Medium |
| P3 | 17-18 | frontend-engineer | Medium |
| Final | 19-20 | code-reviewer | Simple |

**Total Tasks**: 20
**Agent**: frontend-engineer (tasks 1-18), code-reviewer (tasks 19-20)
**Database Changes**: None
**Server Action Changes**: None

---

## Sprint 1: P0 - Core Mobile Primitives

### Task 1: Create SwipeableCard Component

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: None

**Description**: Create the foundational swipeable card component that enables left/right swipe gestures with action reveals.

**Files**:
- `components/mobile/SwipeableCard.tsx` (NEW)
- `components/mobile/index.ts` (NEW - barrel export)

**Implementation**:
```typescript
// Key features:
// - Native touch events (touchstart, touchmove, touchend)
// - Resistance curve at edges
// - Left action (swipe right) and right action (swipe left)
// - Haptic feedback via navigator.vibrate(10)
// - Priority: vertical scroll > horizontal swipe (AC-29)
```

**Acceptance Criteria**:
- [ ] Swipe left reveals right action (red delete)
- [ ] Swipe right reveals left action (green complete)
- [ ] Visual feedback within 50ms of touch
- [ ] Vertical scroll not blocked by swipe
- [ ] Action triggers when released past threshold (60px)
- [ ] Smooth snap-back animation (200ms ease-out)
- [ ] No TypeScript errors

**Skills**: `.claude/skills/frontend/mobile-pwa-design/SKILL.md`

---

### Task 2: Create TaskListMobile Component

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: Task 1

**Description**: Create mobile-optimized task list using card layout with swipe actions.

**Files**:
- `components/tasks/TaskListMobile.tsx` (NEW)
- `components/tasks/TaskList.tsx` (MODIFY - add mobile detection)

**Implementation**:
```typescript
// TaskListMobile features:
// - Uses SwipeableCard wrapper
// - Integrates with existing TaskCard
// - Swipe left: Delete action
// - Swipe right: Complete action
// - Calls existing server actions for mutations

// TaskList.tsx modification:
// - Add useIsMobile() detection
// - Conditional render: TaskListMobile (mobile) vs TaskListTable (desktop)
```

**Acceptance Criteria**:
- [ ] On mobile (<768px), renders card list instead of table
- [ ] Each task card has swipe-to-complete (right)
- [ ] Each task card has swipe-to-delete (left)
- [ ] Tapping card opens task modal (existing behavior preserved)
- [ ] Desktop view unchanged
- [ ] No TypeScript errors

**Skills**: `.claude/skills/frontend/mobile-pwa-design/SKILL.md`, `.claude/skills/frontend/component-patterns.md`

---

### Task 3: Create SkeletonCard Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create loading placeholder cards that match real card dimensions.

**Files**:
- `components/mobile/SkeletonCard.tsx` (NEW)
- `components/tasks/TaskListSkeleton.tsx` (NEW)

**Implementation**:
```typescript
// SkeletonCard variants:
// - task: Type badge, title (2 lines), date + assignee row
// - project: Image placeholder, title, progress bar
// - expense: Amount, vendor, date, status badge
// - material: Name, quantity, unit price
// - team: Avatar, name, role, status

// Use animate-pulse for shimmer effect
```

**Acceptance Criteria**:
- [ ] Skeleton matches exact dimensions of real TaskCard
- [ ] Shimmer animation plays smoothly
- [ ] All 5 variants implemented
- [ ] TaskListSkeleton renders 5 skeleton cards by default
- [ ] No TypeScript errors

**Skills**: `.claude/skills/frontend/component-patterns.md`

---

### Task 4: Integrate Skeletons into Tasks Page

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Task 2, Task 3

**Description**: Add skeleton loading states to the tasks page for mobile view.

**Files**:
- `app/app/tasks/page.tsx` (MODIFY)

**Implementation**:
```typescript
// Add loading state detection
// Show TaskListSkeleton while loading
// On mobile: skeleton cards
// On desktop: existing table skeleton or add one
```

**Acceptance Criteria**:
- [ ] Skeleton shows during initial load
- [ ] Skeleton shows during refresh/revalidation
- [ ] Smooth transition from skeleton to real data
- [ ] No layout shift (CLS < 0.1)
- [ ] No TypeScript errors

---

## Sprint 2: P1 - Gestures & Modal Enhancements

### Task 5: Create PullToRefresh Component

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: None

**Description**: Create pull-to-refresh wrapper component for scrollable lists.

**Files**:
- `components/mobile/PullToRefresh.tsx` (NEW)

**Implementation**:
```typescript
// Key features:
// - Only activates when scrollTop === 0
// - Resistance curve: diff * 0.4
// - Visual states: idle → pulling → ready → refreshing
// - Arrow rotates during pull, flips at threshold
// - Spinner during refresh (Loader2 from lucide-react)
// - threshold: 80px, maxPull: 120px
```

**Acceptance Criteria**:
- [ ] Pull gesture detected only at top of scroll
- [ ] Visual indicator shows pull progress
- [ ] "Release to refresh" appears when ready
- [ ] Spinner shows during refresh
- [ ] Content snaps back after refresh completes
- [ ] No interference with normal scrolling
- [ ] No TypeScript errors

**Skills**: `.claude/skills/frontend/mobile-pwa-design/SKILL.md`

---

### Task 6: Integrate PullToRefresh into Tasks Page

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Task 5

**Description**: Add pull-to-refresh functionality to the tasks page.

**Files**:
- `app/app/tasks/page.tsx` (MODIFY)

**Implementation**:
```typescript
// Wrap task list in PullToRefresh
// onRefresh triggers revalidatePath or router.refresh()
// Only show on mobile
```

**Acceptance Criteria**:
- [ ] Pull-to-refresh works on tasks page (mobile only)
- [ ] Data refreshes after pull gesture
- [ ] Loading state shows during refresh
- [ ] Desktop view unchanged
- [ ] No TypeScript errors

---

### Task 7: Enhance BaseModal with Drag-to-Dismiss

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: None

**Description**: Add drag-to-dismiss gesture and spring animations to BaseModal on mobile.

**Files**:
- `components/ui/BaseModal/index.tsx` (MODIFY)
- `components/ui/BaseModal/types.ts` (MODIFY - add new props)

**Implementation**:
```typescript
// New props:
// - enableDragToDismiss?: boolean (default: true on mobile)
// - snapPoints?: number[] (default: [0.5, 0.9])

// Using framer-motion:
// - motion.div with drag="y" on mobile
// - dragConstraints={{ top: 0 }}
// - dragElastic={0.2}
// - Spring animation: stiffness: 400, damping: 35

// Dismiss logic:
// - velocity.y > 500px/s OR
// - dragged past 60% screen height
```

**Acceptance Criteria**:
- [ ] Drag handle visible on mobile bottom sheet
- [ ] Dragging down dismisses modal when past threshold
- [ ] Spring animation on snap back
- [ ] Fast swipe down dismisses regardless of position
- [ ] Sheet content scroll handled (AC-34)
- [ ] Desktop modal unchanged
- [ ] No TypeScript errors

**Skills**: `.claude/skills/frontend/mobile-pwa-design/SKILL.md`

---

### Task 8: Create useOnlineStatus Hook

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create hook to detect online/offline status for offline indicator.

**Files**:
- `lib/hooks/useOnlineStatus.ts` (NEW)

**Implementation**:
```typescript
// Returns: { isOnline, wasOffline, pendingCount }
// - Listen to online/offline events
// - Track wasOffline for "back online" message
// - Auto-hide "back online" after 3 seconds
```

**Acceptance Criteria**:
- [ ] Hook correctly detects online status
- [ ] wasOffline flag set after coming back online
- [ ] wasOffline auto-clears after 3 seconds
- [ ] No memory leaks (cleanup on unmount)
- [ ] SSR safe (no window access during SSR)
- [ ] No TypeScript errors

---

### Task 9: Create OfflineIndicator Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Task 8

**Description**: Create banner that shows when user is offline or recently came back online.

**Files**:
- `components/mobile/OfflineIndicator.tsx` (NEW)

**Implementation**:
```typescript
// Fixed to top of screen
// Red background when offline: "Offline - changes will sync later"
// Green background when back online: "Back online"
// Respects safe-area-inset-top
// Uses WifiOff, Wifi icons from lucide-react
```

**Acceptance Criteria**:
- [ ] Shows red banner when offline
- [ ] Shows green banner when back online
- [ ] Green banner auto-hides after 3 seconds
- [ ] Respects notch/safe area
- [ ] No layout shift when showing/hiding
- [ ] No TypeScript errors

---

### Task 10: Add OfflineIndicator to App Layout

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Task 9

**Description**: Add offline indicator to the main app layout.

**Files**:
- `app/app/layout.tsx` (MODIFY)

**Implementation**:
```typescript
// Add OfflineIndicator as first child in layout
// Should appear above all other content
```

**Acceptance Criteria**:
- [ ] Offline indicator shows on all app pages
- [ ] Positioned above header/content
- [ ] Mobile only (hidden on desktop)
- [ ] No TypeScript errors

---

## Sprint 3: P2 - Form Components & Page Optimizations

### Task 11: Create TouchButton Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create standardized touch-optimized button with haptic feedback.

**Files**:
- `components/mobile/TouchButton.tsx` (NEW)

**Implementation**:
```typescript
// Variants: primary, secondary, ghost, danger
// Sizes: sm (44px), md (48px), lg (56px)
// Touch feedback: active:scale-[0.97], active:opacity-90
// Haptic: navigator.vibrate(10) on press
// Support icon left/right
// Loading state with spinner
```

**Acceptance Criteria**:
- [ ] All 4 variants styled correctly
- [ ] All 3 sizes render with correct heights
- [ ] Touch feedback visible on press
- [ ] Haptic feedback triggers (when supported)
- [ ] Loading state shows spinner
- [ ] Disabled state prevents interaction
- [ ] No TypeScript errors

---

### Task 12: Create MobileInput Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create standardized form input with proper mobile sizing and keyboard hints.

**Files**:
- `components/mobile/MobileInput.tsx` (NEW)

**Implementation**:
```typescript
// Height: 56px (h-14)
// Font size: 16px (text-base) - prevents iOS zoom
// inputMode prop for keyboard type
// enterKeyHint prop for return key label
// Label, error, hint support
// Focus ring with construction-blue
```

**Acceptance Criteria**:
- [ ] Input height is 56px
- [ ] Font size is 16px (no iOS zoom)
- [ ] inputMode shows correct keyboard
- [ ] enterKeyHint shows correct return key
- [ ] Error state shows red border + message
- [ ] Focus ring visible
- [ ] No TypeScript errors

---

### Task 13: Create StickySubmitButton Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Task 11

**Description**: Create fixed-bottom submit button for mobile forms.

**Files**:
- `components/mobile/StickySubmitButton.tsx` (NEW)

**Implementation**:
```typescript
// Fixed position: bottom-20 (above nav), left-4, right-4
// Gradient fade overlay above button
// Safe area inset padding
// Uses TouchButton internally
```

**Acceptance Criteria**:
- [ ] Button fixed above bottom nav
- [ ] Gradient fade visible above button
- [ ] Safe area respected on notched devices
- [ ] Works as form submit
- [ ] No TypeScript errors

---

### Task 14: Create FloatingActionButton Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create FAB for primary create actions on mobile.

**Files**:
- `components/mobile/FloatingActionButton.tsx` (NEW)

**Implementation**:
```typescript
// Position: fixed right-4 bottom-24 (above nav)
// Default icon: Plus
// Extended variant with label
// Touch feedback: active:scale-95
// Shadow for elevation
```

**Acceptance Criteria**:
- [ ] FAB positioned correctly above nav
- [ ] Default Plus icon renders
- [ ] Extended variant shows label
- [ ] Touch feedback on press
- [ ] Shadow provides visual elevation
- [ ] No TypeScript errors

---

### Task 15: Create SegmentedControl Component

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: None

**Description**: Create iOS-style segmented control for filtering.

**Files**:
- `components/mobile/SegmentedControl.tsx` (NEW)

**Implementation**:
```typescript
// Horizontal segments with selection indicator
// Active segment: white bg, shadow, navy text
// Inactive: gray text, transparent bg
// Smooth transition between states
```

**Acceptance Criteria**:
- [ ] Renders all segments
- [ ] Active segment highlighted
- [ ] Smooth transition on selection change
- [ ] Touch feedback on tap
- [ ] Accessible with aria attributes
- [ ] No TypeScript errors

---

### Task 16: Update Mobile Barrel Export

**Agent**: frontend-engineer
**Complexity**: Simple
**Dependencies**: Tasks 11-15

**Description**: Update the mobile components barrel export file.

**Files**:
- `components/mobile/index.ts` (MODIFY)

**Implementation**:
```typescript
// Export all mobile components
export * from './SwipeableCard'
export * from './PullToRefresh'
export * from './SkeletonCard'
export * from './TouchButton'
export * from './MobileInput'
export * from './StickySubmitButton'
export * from './FloatingActionButton'
export * from './SegmentedControl'
export * from './OfflineIndicator'
```

**Acceptance Criteria**:
- [ ] All components exported
- [ ] No circular dependency issues
- [ ] No TypeScript errors

---

## Sprint 4: P3 - Page Conversions & Polish

### Task 17: Optimize Tasks Page Mobile Layout

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: Tasks 1-6, 14, 15

**Description**: Full mobile optimization of tasks page with filters, FAB, and segmented control.

**Files**:
- `app/app/tasks/page.tsx` (MODIFY)

**Implementation**:
```typescript
// Mobile layout:
// - Sticky header with search
// - SegmentedControl for status filter
// - Filter button opens bottom sheet
// - PullToRefresh wrapper
// - TaskListMobile
// - FAB for create task
```

**Acceptance Criteria**:
- [ ] Sticky header with search input
- [ ] Segmented control for quick status filter
- [ ] Filter button shows active filter count
- [ ] Filters open in bottom sheet modal
- [ ] Pull-to-refresh works
- [ ] FAB opens create task modal
- [ ] All features work on iOS Safari
- [ ] Desktop view unchanged
- [ ] No TypeScript errors

---

### Task 18: Create TeamMemberCard and Optimize Team Page

**Agent**: frontend-engineer
**Complexity**: Medium
**Dependencies**: Task 1, Task 5

**Description**: Create mobile card for team members and optimize team page.

**Files**:
- `components/team/TeamMemberCard.tsx` (NEW)
- `components/team/TeamListSkeleton.tsx` (NEW)
- `app/app/team/page.tsx` (MODIFY)

**Implementation**:
```typescript
// TeamMemberCard: Avatar, name, role, status badge
// Wrap in SwipeableCard with remove action
// Add PullToRefresh to team page
// Skeleton loading state
```

**Acceptance Criteria**:
- [ ] TeamMemberCard renders member info
- [ ] Swipe left reveals remove action
- [ ] Pull-to-refresh works
- [ ] Skeleton shows during load
- [ ] Desktop table view unchanged
- [ ] No TypeScript errors

---

## Final Sprint: Review & Verification

### Task 19: Code Review & Build Verification

**Agent**: code-reviewer
**Complexity**: Simple
**Dependencies**: All previous tasks

**Description**: Review all mobile components, run build, verify no errors.

**Files**: All files created/modified in tasks 1-18

**Checks**:
- [ ] No TypeScript errors (`npm run build`)
- [ ] No Supabase SDK in client components
- [ ] All components use Lucide icons only
- [ ] All modals use ResponsiveModal only
- [ ] Touch targets ≥44px verified
- [ ] Animation durations ≤200ms for micro-interactions

**Acceptance Criteria**:
- [ ] Build passes without errors
- [ ] No ESLint warnings in new files
- [ ] All acceptance criteria from previous tasks verified

---

### Task 20: Lighthouse Audit & Documentation Sync

**Agent**: code-reviewer
**Complexity**: Simple
**Dependencies**: Task 19

**Description**: Run Lighthouse audit and sync documentation.

**Commands**:
```bash
# Run Lighthouse
npx lighthouse http://localhost:3000/app --only-categories=performance,pwa,accessibility --view

# Sync docs
/kc:sync-docs
```

**Checks**:
- [ ] Lighthouse Performance ≥90
- [ ] Lighthouse PWA = 100
- [ ] Lighthouse Accessibility ≥90
- [ ] Components added to `.claude/docs/indexes/components.md`

**Acceptance Criteria**:
- [ ] All Lighthouse scores meet targets
- [ ] Documentation synced
- [ ] No regression in existing functionality

---

## Dependency Graph

```
Sprint 1 (P0):
  Task 1 (SwipeableCard) ──┬──> Task 2 (TaskListMobile) ──┬──> Task 4 (Integration)
                          │                              │
  Task 3 (SkeletonCard) ──┴──────────────────────────────┘

Sprint 2 (P1):
  Task 5 (PullToRefresh) ──> Task 6 (PTR Integration)
  Task 7 (BaseModal Enhancement) [independent]
  Task 8 (useOnlineStatus) ──> Task 9 (OfflineIndicator) ──> Task 10 (Layout Integration)

Sprint 3 (P2):
  Tasks 11-15 are independent primitives
  Task 16 (Barrel Export) depends on Tasks 11-15

Sprint 4 (P3):
  Task 17 (Tasks Page) depends on: 1, 2, 5, 6, 14, 15
  Task 18 (Team Page) depends on: 1, 5

Final:
  Task 19 (Review) depends on: all previous
  Task 20 (Audit) depends on: 19
```

---

## Execution Summary

| Sprint | Tasks | Focus |
|--------|-------|-------|
| 1 | 1-4 | Core swipe + cards + skeletons |
| 2 | 5-10 | Pull-to-refresh + modal + offline |
| 3 | 11-16 | Form components + utilities |
| 4 | 17-18 | Page optimizations |
| Final | 19-20 | Review + audit |

---

## Status

**Phase 3: Implementation Plan** - ✅ APPROVED

---

## Next Steps

Upon approval:
```bash
# Implement with orchestrator
orchestrator: "Implement mobile-pwa-optimization feature per spec at .claude/tasks/features/mobile-pwa-optimization/"

# Or implement task-by-task
/kc:impl task-1
```
