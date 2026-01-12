# Spatial Viewer Redesign - Implementation Tasks

## References

- Requirements: `.claude/tasks/features/spatial-viewer-redesign/requirements.md`
- Design: `.claude/tasks/features/spatial-viewer-redesign/design.md`

---

## Overview

This implementation plan breaks down the mobile-first redesign of the Spatial Viewer into atomic tasks. All tasks are **frontend-only** - no backend or Server Action changes required.

**Total Tasks:** 11
**Estimated Sessions:** 6-8 (some tasks parallelizable)

---

## Phase 1: Foundation (Hooks & Utilities)

### Task 1.1: Verify and Document Responsive Hooks

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** None

**Description:**
Verify that the existing responsive hooks in `lib/hooks/useMediaQuery.ts` work correctly for all breakpoints. Document usage patterns for the spatial viewer context.

**Files:**
- **Verify:** `/Users/jonathanlee/Desktop/genhub/lib/hooks/useMediaQuery.ts`
- **Document:** Update inline JSDoc if needed

**Requirements:**
- Confirm `useIsMobile()` returns true for `< 768px`
- Confirm `useIsTablet()` returns true for `768-1023px`
- Confirm `useIsDesktop()` returns true for `>= 1024px`
- Test SSR hydration behavior (starts false, updates on mount)

**Acceptance Criteria:**
- [ ] All three hooks work correctly in browser
- [ ] No hydration mismatch errors
- [ ] Hooks respond to window resize
- [ ] Documented in task completion notes

---

## Phase 2: New Mobile Components

### Task 2.1: Create MarkerFilterSheet Component

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Medium
- **Dependencies:** Task 1.1

**Description:**
Create a new bottom sheet wrapper that wraps the existing `MarkerFilterPanel` content for mobile. Uses the existing `BottomSheetModal` component infrastructure.

**Files:**
- **Create:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MarkerFilterSheet.tsx`
- **Reference:** `/Users/jonathanlee/Desktop/genhub/components/mobile/BottomSheetModal/index.tsx`
- **Reference:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MarkerFilterPanel.tsx`

**Requirements:**
- Use existing `BottomSheetModal` as the wrapper
- Custom snap points: 30%, 60%, 90%
- Content structure from design doc (drag handle, header with Clear/Close, filter sections)
- 44px touch targets for all interactive elements
- Safe area padding at bottom
- Receives `MarkerFilters` state and `onFilterChange` callback as props
- Include marker counts display by type
- Clear all filters button
- Mobile-only rendering (hide on desktop via responsive check)

**Props Interface:**
```typescript
interface MarkerFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: MarkerFilters;
  onFilterChange: (filters: MarkerFilters) => void;
  markerCounts: { issue: number; note: number; safety: number; milestone: number };
  onClearFilters?: () => void;
}
```

**Acceptance Criteria:**
- [ ] Opens as bottom sheet on mobile
- [ ] Three snap points work (30%, 60%, 90%)
- [ ] Drag handle allows gesture control
- [ ] All filter options have 44px touch targets
- [ ] Clear button resets all filters
- [ ] Close button dismisses sheet
- [ ] Filter changes propagate to parent via callback
- [ ] No Supabase imports in client component

---

### Task 2.2: Create MarkerListSheet Component

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Medium
- **Dependencies:** Task 1.1

**Description:**
Create a bottom sheet for displaying the marker list on mobile with search and grouped sections.

**Files:**
- **Create:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MarkerListSheet.tsx`
- **Reference:** `/Users/jonathanlee/Desktop/genhub/components/mobile/BottomSheetModal/index.tsx`
- **Reference:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MarkerAnnotationPanel.tsx`

**Requirements:**
- Use existing `BottomSheetModal` as wrapper
- Custom snap points: 30%, 60%, 90%
- Sticky search input at top
- Group markers by type (Issues, Notes, Safety, Progress)
- Collapsible sections with count badges
- Each marker item: title, type icon, status indicator
- Tap marker navigates camera (via callback)
- Virtual scrolling consideration for 50+ markers (use CSS overflow-y-auto initially)
- Loading state skeleton
- Empty state message

**Props Interface:**
```typescript
interface MarkerListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  markers: SpatialMarker[];
  isLoading?: boolean;
  onMarkerClick: (marker: SpatialMarker) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  groupByType?: boolean;
}
```

**Acceptance Criteria:**
- [ ] Opens as bottom sheet on mobile
- [ ] Search filters markers in real-time
- [ ] Grouped sections with expand/collapse
- [ ] Tapping marker triggers callback
- [ ] Loading skeleton shows during fetch
- [ ] Empty state when no markers match
- [ ] Scrollable content within sheet
- [ ] No Supabase imports in client component

---

### Task 2.3: Create MarkerFAB Component

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Medium
- **Dependencies:** Task 1.1

**Description:**
Create a floating action button for quick marker creation on mobile. Expands to show marker type options.

**Files:**
- **Create:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MarkerFAB.tsx`

**Requirements:**
- Visible only on mobile (`< 768px`)
- Position: bottom-right, 16px from edge, above toolbar (80px from bottom)
- Collapsed state: 56x56px button with Plus icon
- Expanded state: Stacked options (Issue, Note, Safety, Progress) + Close
- Each option: 44px touch target, type-specific color accent, icon + label
- Animation: Staggered reveal (50ms per option using CSS or framer-motion)
- Click outside collapses
- Respects `canCreate` permission prop
- Safe area consideration for positioning

**Props Interface:**
```typescript
interface MarkerFABProps {
  isExpanded: boolean;
  onToggle: () => void;
  onSelectType: (type: 'issue' | 'note' | 'safety' | 'progress') => void;
  canCreate: boolean;
  bottomOffset?: number;
}
```

**Visual Reference (from design):**
```
COLLAPSED:      EXPANDED:
    +-------+       +-------+
    |  +    |       | Issue |
    +-------+       +-------+
                    | Note  |
                    +-------+
                    | Safety|
                    +-------+
                    | Prog  |
                    +-------+
                    |   X   |
                    +-------+
```

**Acceptance Criteria:**
- [ ] Hidden on tablet and desktop
- [ ] Collapsed shows single Plus button
- [ ] Tap expands with staggered animation
- [ ] Each option triggers type selection callback
- [ ] Close button or tap outside collapses
- [ ] Disabled state when `canCreate` is false
- [ ] Positioned above toolbar with safe area
- [ ] Uses Lucide icons only

---

### Task 2.4: Create WebGLFallback Component

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** None

**Description:**
Create a fallback component shown when WebGL is not supported by the browser.

**Files:**
- **Create:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/WebGLFallback.tsx`

**Requirements:**
- Clear message explaining WebGL requirement
- Suggestion to use modern browser (Chrome, Safari, Firefox, Edge)
- Optional button to view markers in list mode (non-3D)
- Mobile-friendly layout
- GenHub design system colors

**Props Interface:**
```typescript
interface WebGLFallbackProps {
  onViewMarkerList?: () => void;
  className?: string;
}
```

**Acceptance Criteria:**
- [ ] Clear, user-friendly message
- [ ] Button to view marker list (if callback provided)
- [ ] Mobile-responsive layout
- [ ] Uses GenHub color tokens
- [ ] Uses Lucide icons

---

## Phase 3: Component Updates (Mobile Optimization)

### Task 3.1: Update ViewerToolbar for Mobile-First Layout

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Medium
- **Dependencies:** Task 1.1

**Description:**
Refactor ViewerToolbar to render as a bottom bar on mobile and floating panel on desktop.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/ViewerToolbar.tsx`

**Requirements:**
- Use `useIsMobile()` hook for responsive behavior
- Mobile: Fixed bottom bar, horizontal button row, 44px touch targets
- Desktop: Keep existing floating panel behavior (top-right)
- All buttons: Icon + optional label on desktop, icon-only on mobile
- Active state feedback: `active:scale-[0.98]`, `active:bg-construction-blue/10`
- Keyboard shortcuts displayed on desktop only
- Safe area padding: `pb-[env(safe-area-inset-bottom)]` on mobile
- Z-index above canvas but below sheets

**Layout (Mobile):**
```
+----------------------------------------------------+
| [Pan] [Rotate] [Zoom] [Measure] [Section] [Camera] |
|  44px   44px    44px    44px      44px      44px   |
+----------------------------------------------------+
| Safe Area Padding                                   |
+----------------------------------------------------+
```

**Acceptance Criteria:**
- [ ] Mobile: Renders as fixed bottom bar
- [ ] Desktop: Renders as floating top-right panel
- [ ] All buttons have 44px touch targets on mobile
- [ ] Active state feedback on tap
- [ ] Safe area insets applied on mobile
- [ ] Keyboard shortcuts visible on desktop
- [ ] No layout shift on breakpoint change

---

### Task 3.2: Update Empty3DState for Mobile

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** Task 1.1

**Description:**
Simplify Empty3DState for mobile with a large, clear CTA button.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/Empty3DState.tsx`

**Requirements:**
- Add `compact` prop for mobile mode
- Mobile (compact): Single large CTA button (56px height), simplified text
- Desktop: Keep existing feature grid layout
- Icon: Large 3D box icon
- Text: "Upload Your 3D Model" + brief description
- Button: Full-width, high contrast
- File type hint: "Supports .IFC - Max 500MB"

**Props Update:**
```typescript
interface Empty3DStateProps {
  onUploadClick?: () => void;
  className?: string;
  compact?: boolean;  // NEW
}
```

**Acceptance Criteria:**
- [ ] `compact={true}` shows simplified mobile layout
- [ ] Large, touch-friendly upload button (56px)
- [ ] Clear messaging about file types
- [ ] Desktop layout unchanged when `compact={false}`
- [ ] Uses Lucide icons

---

### Task 3.3: Update LoadingStates for Mobile

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** Task 1.1

**Description:**
Add compact loading overlay mode for mobile screens.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/LoadingStates.tsx`

**Requirements:**
- Add `compact` prop for mobile mode
- Mobile (compact): Top-center card overlay (not full modal)
- Show progress bar with percentage
- Cancel button if operation is cancellable
- Estimated time remaining display
- Desktop: Keep existing overlay behavior

**Props Update:**
```typescript
interface LoadingOverlayProps {
  state: LoadingState;
  onCancel?: () => void;
  compact?: boolean;  // NEW
  className?: string;
}
```

**Layout (Mobile Compact):**
```
+----------------------------------+
|  [Downloading Model...   45%]   |
|  [=====-----------] [Cancel]    |
+----------------------------------+
```

**Acceptance Criteria:**
- [ ] `compact={true}` shows top-center card
- [ ] Progress bar visible
- [ ] Cancel button shows when `onCancel` provided
- [ ] Desktop overlay unchanged when `compact={false}`

---

## Phase 4: Main Container Integration

### Task 4.1: Update SpatialViewer Main Container

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Complex
- **Dependencies:** Tasks 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3

**Description:**
Integrate all new mobile components into the main SpatialViewer container with responsive layout switching.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/SpatialViewer.tsx`

**Requirements:**

1. **Responsive Layout:**
   - Use `useIsMobile()`, `useIsTablet()`, `useIsDesktop()` hooks
   - Mobile: Full viewport height `100dvh` minus safe areas
   - Desktop: Keep existing fixed container height
   - Tablet: Hybrid layout

2. **State Management:**
   - Add `activeSheet` state: `'filters' | 'markers' | null`
   - Add `fabExpanded` state: `boolean`
   - Sheet and FAB are mutually exclusive (one closes the other)

3. **Component Integration:**
   - Render `MarkerFilterSheet` on mobile (instead of inline panel)
   - Render `MarkerListSheet` on mobile
   - Render `MarkerFAB` on mobile (when `canEditMarkers`)
   - Render `ViewerToolbar` with responsive behavior
   - Render `Empty3DState` with `compact` prop on mobile
   - Render loading states with `compact` prop on mobile
   - Render `WebGLFallback` when WebGL not supported

4. **Event Handling:**
   - `handleMarkerClick`: Navigate camera, close sheets, show details
   - `handleFABSelectType`: Close FAB, enter placement mode
   - Sheet open/close functions manage state correctly

5. **Layout Structure (Mobile):**
   ```
   +------------------------------------------+
   |  [Viewer Canvas - Full Screen]           |
   |                                          |
   |  +------+                    +--------+  |
   |  |Filter|                    | FAB    |  |
   |  |Btn   |                    | (+)    |  |
   |  +------+                    +--------+  |
   |                                          |
   |  [ViewerToolbar - Bottom Bar]            |
   +------------------------------------------+
   ```

6. **Props Additions:**
   ```typescript
   interface SpatialViewerProps {
     // ... existing props
     fullScreen?: boolean;          // NEW: Force full-screen mode
     initialSheetOpen?: 'filters' | 'markers' | null;  // NEW
   }
   ```

**Acceptance Criteria:**
- [ ] Mobile: Full-screen canvas with bottom toolbar
- [ ] Mobile: FAB visible when user can edit
- [ ] Mobile: Filter/marker sheets open via buttons
- [ ] Mobile: Only one sheet open at a time
- [ ] Desktop: Layout unchanged (side panels, floating toolbar)
- [ ] Sheet state persists during interactions
- [ ] No Supabase imports in component
- [ ] Existing marker functionality preserved
- [ ] Camera navigation works from marker list
- [ ] Marker creation works from FAB
- [ ] Build passes without errors

---

### Task 4.2: Add Mobile Trigger Buttons

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** Task 4.1

**Description:**
Add floating trigger buttons for opening filter and marker list sheets on mobile.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/SpatialViewer.tsx`
- **Or Create:** `/Users/jonathanlee/Desktop/genhub/components/projects/spatial/MobileTriggerButtons.tsx`

**Requirements:**
- Filter button: Bottom-left corner, above toolbar
- Marker list button: Bottom-left, above filter button (or combined)
- 44px touch targets
- Badge showing active filter count
- Badge showing marker count
- Only visible on mobile
- Z-index below FAB, above canvas

**Visual:**
```
+------+
| [3]  |  <- Marker count badge
| List |
+------+
+------+
| [2]  |  <- Active filter count badge
|Filter|
+------+
```

**Acceptance Criteria:**
- [ ] Buttons visible only on mobile
- [ ] Correct z-index layering
- [ ] Badges show relevant counts
- [ ] Tap opens respective sheet
- [ ] 44px touch targets

---

## Phase 5: Page Integration

### Task 5.1: Update ProjectOverview 3D Section

- **Agent:** frontend-engineer
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Simple
- **Dependencies:** Task 4.1

**Description:**
Ensure the ProjectOverview page correctly passes mobile props to SpatialViewer.

**Files:**
- **Modify:** `/Users/jonathanlee/Desktop/genhub/components/projects/ProjectOverview.tsx` (or wherever SpatialViewer is rendered)

**Requirements:**
- Pass `fullScreen={true}` on mobile for immersive view
- Handle mobile-specific layout around the viewer
- Ensure proper container sizing
- Test responsive behavior

**Acceptance Criteria:**
- [ ] SpatialViewer renders correctly in project detail page
- [ ] Full-screen mode works on mobile
- [ ] No layout overflow issues
- [ ] Works with existing project data flow

---

## Phase 6: Testing & Verification

### Task 6.1: Integration Testing and Polish

- **Agent:** frontend-engineer (or code-reviewer)
- **Skill:** `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Complexity:** Medium
- **Dependencies:** All previous tasks

**Description:**
Comprehensive testing of all mobile features and polish pass.

**Testing Checklist:**

1. **Responsive Behavior:**
   - [ ] Mobile layout (< 768px) renders correctly
   - [ ] Tablet layout (768-1024px) renders correctly
   - [ ] Desktop layout (> 1024px) unchanged
   - [ ] Breakpoint transitions smooth (no flash)

2. **Bottom Sheets:**
   - [ ] Filter sheet opens/closes
   - [ ] Marker list sheet opens/closes
   - [ ] Drag gestures work (snap points)
   - [ ] Only one sheet open at a time
   - [ ] Backdrop dismisses sheet

3. **FAB:**
   - [ ] Expands with animation
   - [ ] Type selection works
   - [ ] Collapses on selection
   - [ ] Hidden when no edit permission

4. **Toolbar:**
   - [ ] Bottom bar on mobile
   - [ ] All tools accessible
   - [ ] Touch feedback on tap

5. **Marker Interactions:**
   - [ ] Tap marker in list navigates camera
   - [ ] Create marker from FAB works
   - [ ] Filter changes update marker display

6. **Performance:**
   - [ ] 30 FPS throttle on mobile
   - [ ] No jank during sheet animations
   - [ ] Smooth camera navigation

7. **Accessibility:**
   - [ ] All buttons have aria-labels
   - [ ] Focus management in sheets
   - [ ] Screen reader compatible

8. **Build:**
   - [ ] `npm run build` passes
   - [ ] No TypeScript errors
   - [ ] No console errors in dev

**Acceptance Criteria:**
- [ ] All checklist items verified
- [ ] Tested on Chrome mobile simulator
- [ ] Tested on real device (if available)
- [ ] No regressions to desktop experience
- [ ] Performance acceptable

---

## Execution Order

```
Sequential Dependencies:
1.1 ──┬──> 2.1 ──┐
      ├──> 2.2 ──┤
      ├──> 2.3 ──┼──> 4.1 ──> 4.2 ──> 5.1 ──> 6.1
      └──> 3.1 ──┤
                 │
2.4 ────────────>┤
3.2 ────────────>┤
3.3 ────────────>┘

Parallelizable Groups:
- Group A (after 1.1): Tasks 2.1, 2.2, 2.3, 3.1, 3.2, 3.3
- Task 2.4 has no dependencies (can start anytime)
- Task 4.1 requires all of Group A
```

**Recommended Order:**
1. Task 1.1 (Foundation)
2. Tasks 2.1 + 2.2 + 2.3 + 2.4 in parallel (New Components)
3. Tasks 3.1 + 3.2 + 3.3 in parallel (Component Updates)
4. Task 4.1 (Main Integration)
5. Task 4.2 (Trigger Buttons)
6. Task 5.1 (Page Integration)
7. Task 6.1 (Testing)

---

## Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1: Foundation | 1 | Simple |
| Phase 2: New Components | 4 | 3 Medium, 1 Simple |
| Phase 3: Updates | 3 | 1 Medium, 2 Simple |
| Phase 4: Integration | 2 | 1 Complex, 1 Simple |
| Phase 5: Page Integration | 1 | Simple |
| Phase 6: Testing | 1 | Medium |
| **Total** | **12** | ~6-8 agent sessions |

---

## Critical Notes

1. **All tasks are frontend-engineer only** - no backend work required
2. **No Server Action changes** - use existing `getMarkersByProject`, `updateMarker`, `createMarker`
3. **No Supabase imports** in any client component
4. **Preserve backward compatibility** - `ClientSpatialViewer.tsx` unchanged
5. **Use existing `BottomSheetModal`** - do not create new bottom sheet implementation
6. **Use existing hooks** - `useIsMobile()`, `useIsTablet()`, `useIsDesktop()` from `lib/hooks/useMediaQuery.ts`
7. **Reference mobile PWA skill** for all touch targets, safe areas, animations

---

## Files Summary

### New Files (4)
- `components/projects/spatial/MarkerFilterSheet.tsx`
- `components/projects/spatial/MarkerListSheet.tsx`
- `components/projects/spatial/MarkerFAB.tsx`
- `components/projects/spatial/WebGLFallback.tsx`

### Modified Files (5)
- `components/projects/spatial/ViewerToolbar.tsx`
- `components/projects/spatial/Empty3DState.tsx`
- `components/projects/spatial/LoadingStates.tsx`
- `components/projects/spatial/SpatialViewer.tsx`
- `components/projects/ProjectOverview.tsx` (or relevant page)

### Unchanged Files (Preserved)
- `components/projects/spatial/3DViewerCanvas.tsx`
- `components/projects/spatial/ModelLoader.tsx`
- `components/projects/spatial/CameraControls.tsx`
- `components/projects/spatial/LODManager.tsx`
- `components/projects/spatial/InteractionLayer.tsx`
- `components/projects/spatial/SpatialMarkerPin.tsx`
- `components/projects/spatial/SpatialMarkerContextMenu.tsx`
- `components/projects/spatial/TaskLinker.tsx`
- `components/projects/spatial/MarkerCreationModal.tsx`
- `components/projects/spatial/ClientSpatialViewer.tsx`

---

**Status:** READY FOR IMPLEMENTATION

**Implementation Command:**
```bash
# Start with foundation
/kc:impl spatial-viewer-redesign/1.1

# Then parallel new components
/kc:impl spatial-viewer-redesign/2.1
/kc:impl spatial-viewer-redesign/2.2
/kc:impl spatial-viewer-redesign/2.3
/kc:impl spatial-viewer-redesign/2.4

# Then parallel updates
/kc:impl spatial-viewer-redesign/3.1
/kc:impl spatial-viewer-redesign/3.2
/kc:impl spatial-viewer-redesign/3.3

# Then integration
/kc:impl spatial-viewer-redesign/4.1
/kc:impl spatial-viewer-redesign/4.2
/kc:impl spatial-viewer-redesign/5.1
/kc:impl spatial-viewer-redesign/6.1
```
