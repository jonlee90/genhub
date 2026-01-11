# Requirement: Mobile PWA Optimization

> Transform GenHub frontend to look and feel like a native iOS mobile app

---

## Problem Statement

GenHub is a construction PWA for general contractors, primarily used by field workers on job sites. While the app has foundational mobile support (bottom navigation, responsive layouts), several key components still use desktop-centric patterns (tables, horizontal scrolling, desktop-sized inputs) that don't provide a native mobile app experience. Field workers need:

- **Touch-first interactions** with 44px+ tap targets everywhere
- **Native iOS patterns** (swipe actions, pull-to-refresh, bottom sheets)
- **60fps performance** with no perceptible lag
- **Offline-first reliability** for spotty job site connectivity
- **High contrast UI** for outdoor visibility

---

## User Stories

### US-1: Mobile Task Management
As a **field worker**, I want to **view and manage tasks on my phone with card-based UI and swipe gestures** so that **I can quickly update task status while on the job site without precise clicking**.

**Test Scenarios:**
- [ ] Given 50 tasks, render as card grid in <500ms
- [ ] Given swipe-left on task card, reveal red delete action
- [ ] Given swipe-right on task card, mark complete optimistically
- [ ] Given tap on task card, visual feedback visible within 50ms
- [ ] Given <768px viewport, table view NEVER renders

### US-2: Native Navigation Experience
As a **mobile user**, I want the app to **navigate like a native iOS app with smooth transitions and consistent patterns** so that **the app feels familiar and professional**.

**Test Scenarios:**
- [ ] Given navigation between tabs, animation completes in 200ms
- [ ] Given page with notch device, content respects safe-area-inset-bottom
- [ ] Given any page, 80px bottom padding maintained for navigation
- [ ] Given back gesture (swipe from edge), navigate to previous page

### US-3: Touch-Optimized Data Entry
As a **foreman entering expenses**, I want **large touch targets, native date pickers, and camera integration** so that **I can log expenses quickly while wearing work gloves**.

**Test Scenarios:**
- [ ] Given any form input, height is ≥56px
- [ ] Given text input focus, font-size is 16px (no iOS zoom)
- [ ] Given date field tap, native date picker opens
- [ ] Given phone field focus, numeric keyboard displays
- [ ] Given form with submit, button fixed to bottom viewport

### US-4: Offline Task Updates
As a **worker in areas with poor connectivity**, I want **optimistic UI updates with background sync** so that **my work is saved even without internet**.

**Test Scenarios:**
- [ ] Given offline mode, cached data displays with offline indicator
- [ ] Given mutation while offline, UI updates optimistically
- [ ] Given reconnection, queued mutations sync automatically
- [ ] Given sync failure after 3 retries, error surfaces with manual retry

### US-5: Performance
As a **user on a mid-range Android device**, I want **instant response to taps and 60fps animations** so that **the app doesn't feel sluggish compared to native apps**.

**Test Scenarios:**
- [ ] Given any tap, response within 100ms
- [ ] Given list loading, skeleton placeholders display immediately
- [ ] Given scroll on 100+ item list, maintains 60fps
- [ ] Given modal open/close, animation maintains 60fps
- [ ] Given image-heavy page, lazy loading with blur placeholders

---

## Acceptance Criteria (EARS Format)

### Navigation & Layout

| ID | Criteria |
|----|----------|
| AC-1 | WHEN on mobile (<768px) THE SYSTEM SHALL display bottom tab navigation with 5 tabs (Home, Projects, Tasks, Materials, More) |
| AC-2 | WHEN navigating between pages THE SYSTEM SHALL animate transitions with 200ms slide/fade |
| AC-3 | WHEN viewing any page THE SYSTEM SHALL maintain 80px bottom padding for navigation |
| AC-4 | WHEN on devices with notches THE SYSTEM SHALL respect safe-area-inset-bottom |
| AC-5 | WHILE viewing lists THE SYSTEM SHALL support pull-to-refresh gesture |

### Table → Card Conversion

| ID | Criteria |
|----|----------|
| AC-6 | WHEN on mobile THE SYSTEM SHALL display TaskList as card grid instead of table |
| AC-7 | WHEN on mobile THE SYSTEM SHALL display TeamMemberTable as card list instead of table |
| AC-8 | WHEN swiping left on a card THE SYSTEM SHALL reveal delete action with red background |
| AC-9 | WHEN swiping right on a task card THE SYSTEM SHALL reveal complete action with green background |
| AC-10 | WHEN tapping a card THE SYSTEM SHALL provide visual feedback (scale 0.98, bg change) within 50ms |

### Forms & Input

| ID | Criteria |
|----|----------|
| AC-11 | WHEN displaying form inputs THE SYSTEM SHALL use 56px height minimum |
| AC-12 | WHEN displaying text inputs THE SYSTEM SHALL use 16px font-size (prevents iOS zoom) |
| AC-13 | WHEN form has submit button THE SYSTEM SHALL fix it to bottom of viewport |
| AC-14 | WHEN selecting dates THE SYSTEM SHALL use native date picker on mobile |
| AC-15 | WHEN entering phone numbers THE SYSTEM SHALL show numeric keyboard |

### Modals & Sheets

| ID | Criteria |
|----|----------|
| AC-16 | WHEN opening modal on mobile THE SYSTEM SHALL display as bottom sheet (slide up) |
| AC-17 | WHEN bottom sheet is open THE SYSTEM SHALL support drag-to-dismiss gesture |
| AC-18 | WHEN bottom sheet is open THE SYSTEM SHALL show drag handle indicator |
| AC-19 | WHILE bottom sheet is animating THE SYSTEM SHALL maintain 60fps |

### Performance

| ID | Criteria |
|----|----------|
| AC-20 | WHEN tapping any interactive element THE SYSTEM SHALL respond within 100ms |
| AC-21 | WHEN loading list data THE SYSTEM SHALL show skeleton placeholders |
| AC-22 | WHEN scrolling lists THE SYSTEM SHALL maintain 60fps |
| AC-23 | WHEN offline THE SYSTEM SHALL display cached data with offline indicator |
| AC-24 | WHEN performing mutations offline THE SYSTEM SHALL queue and sync when online |

### Visual Design (iOS Native Feel)

| ID | Criteria |
|----|----------|
| AC-25 | WHEN displaying primary buttons THE SYSTEM SHALL use rounded-xl (12px) corners |
| AC-26 | WHEN displaying cards THE SYSTEM SHALL use subtle shadows and rounded corners |
| AC-27 | WHEN user presses buttons THE SYSTEM SHALL show active state (scale + opacity) |
| AC-28 | WHEN displaying status colors THE SYSTEM SHALL use GenHub palette (Navy #001B51, Green #059669, Red #DC2626) |

### Error Handling & Edge Cases

| ID | Criteria |
|----|----------|
| AC-29 | WHEN swipe gesture conflicts with scroll THE SYSTEM SHALL prioritize vertical scroll |
| AC-30 | WHEN offline mutation queue exceeds 50 items THE SYSTEM SHALL warn user and pause queueing |
| AC-31 | WHEN sync fails after 3 retries THE SYSTEM SHALL surface error with manual retry option |
| AC-32 | WHEN virtual scroll list has <5 items THE SYSTEM SHALL disable virtualization |
| AC-33 | WHEN haptic feedback unavailable THE SYSTEM SHALL gracefully degrade to visual only |
| AC-34 | WHEN bottom sheet drag conflicts with inner scroll THE SYSTEM SHALL lock sheet until scroll at top |
| AC-35 | WHEN form submit fails offline THE SYSTEM SHALL queue mutation and show pending indicator |
| AC-36 | WHEN image fails to load THE SYSTEM SHALL show placeholder with retry option |

---

## Scope

### In Scope

#### Component Conversions (Priority Order)

| Priority | Component | Conversion | Rationale |
|----------|-----------|------------|-----------|
| P0 | **SwipeableCard** | New reusable component | Dependency for 4+ conversions |
| P0 | **TaskList** | Table → Card grid | Foundational pattern, blocks US-1 |
| P1 | **PullToRefresh** | New wrapper component | Required by AC-5, used by all lists |
| P1 | **TeamMemberTable** | Table → Card list | Depends on SwipeableCard |
| P1 | **BaseModal** | Enhance animations, haptic | Core UX improvement |
| P2 | **KanbanBoard** | Multi-column → Tab-based single | Complex conversion |
| P2 | **Dashboard Widgets** | Optimize KPICardsGrid, WidgetsGrid | Polish for mobile |
| P3 | **GanttChart** | Complex chart → Simplified timeline | Deferred complexity |
| P3 | **All Forms** | Apply MobileOptimizedForm patterns | Can be incremental |

#### Page Layout Optimizations
1. **Dashboard** (`app/app/page.tsx`) - Mobile-first widget layout
2. **Tasks Page** (`app/app/tasks/page.tsx`) - Card-based view, filters as bottom sheet
3. **Projects Page** (`app/app/projects/page.tsx`) - Card grid with quick actions
4. **Materials Page** (`app/app/materials/page.tsx`) - Searchable card list
5. **Expenses Page** (`app/app/expenses/page.tsx`) - Card list with swipe actions
6. **Team Page** (`app/app/team/page.tsx`) - Card list replacing table
7. **Chat Page** (`app/app/chat/page.tsx`) - Full-height mobile layout
8. **Settings Page** (`app/app/settings/page.tsx`) - iOS-style grouped settings

#### New Mobile Components
1. **SwipeableCard** - Reusable card with left/right swipe actions
2. **PullToRefresh** - Wrapper component for refreshable lists
3. **MobilePageTransition** - Animated page transitions
4. **SkeletonCard** - Loading placeholder cards
5. **StickySubmitButton** - Fixed bottom submit for forms

#### Refactoring for Code Reduction
1. **Unified Card Component** - Extract common card patterns from TaskCard, ExpenseCard, MaterialCard, SubcontractorCard
2. **ResponsiveTable** - Single component that renders table (desktop) or cards (mobile)
3. **TouchButton** - Standardized touch-optimized button with haptic feedback
4. **MobileInput** - Standardized form input with proper sizing/keyboard hints

#### Performance Optimizations
1. Skeleton loading states for all lists
2. Optimistic UI updates for mutations
3. Virtual scrolling for long lists (100+ items)
4. Image lazy loading with blur placeholders

### Out of Scope

1. **SpatialViewer/3D components** - Complex touch gestures deferred to future
2. **Push notifications** - Separate feature
3. **Biometric authentication** - Separate feature
4. **Dark mode** - Separate feature
5. **Tablet-specific layouts** - Focus on phone-first
6. **Desktop improvements** - Mobile-only scope

---

## Constraints

### Technical Constraints
- Must use Tailwind CSS (no external CSS frameworks)
- Must use Lucide icons only
- Must use BaseModal for all modal/sheet UI
- Cannot import Supabase SDK in client components
- Must maintain WCAG 2.1 AA accessibility

### Design Constraints
- Primary color: #001B51 (Navy)
- Minimum touch target: 44x44px
- Minimum text size: 16px for inputs
- Border radius: rounded-xl for buttons, rounded-lg for cards
- Animations: max 200ms duration, spring easing preferred

### Performance Constraints
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Interaction response: <100ms
- Animation frame rate: 60fps

---

## Dependencies

### Existing Components (Leverage)
- `components/ui/BaseModal/` - Already responsive bottom sheet
- `components/app/BottomNavigation.tsx` - Already mobile-optimized
- `components/forms/MobileOptimizedForm.tsx` - Reference implementation
- `components/tasks/TaskCard.tsx` - Card pattern to extend

### Skills Required
- `.claude/skills/frontend/mobile-pwa-design/` - Primary skill
- `.claude/skills/frontend/component-patterns.md` - Component architecture
- `.claude/skills/frontend/form-patterns.md` - Form patterns

---

## Components Inventory

### High Priority (Critical for Mobile UX)

| Current Component | Location | Issue | Conversion Target |
|-------------------|----------|-------|-------------------|
| TaskList (Table) | `components/tasks/TaskList.tsx` | Table with horizontal scroll | Card grid with TaskCard |
| TeamMemberTable | `components/team/TeamMemberTable.tsx` | Table with dropdown menus | Card list with swipe actions |
| KanbanBoard | `components/tasks/KanbanBoard.tsx` | Multi-column horizontal scroll | Tab-based single column |
| GanttChart | `components/tasks/gantt/GanttChart.tsx` | Complex horizontal scroll | Simplified timeline or list |
| KPICardsGrid | `components/dashboard/KPICardsGrid.tsx` | 2-col grid needs polish | Swipeable horizontal cards |
| WidgetsGrid | `components/dashboard/WidgetsGrid.tsx` | Static layout | Reorderable widget cards |
| BaseModal | `components/ui/BaseModal/` | Good but can improve | Enhanced animations, haptic |

### Page Layouts (Full Mobile Optimization)

| Page | Location | Mobile Enhancement |
|------|----------|-------------------|
| Dashboard | `app/app/page.tsx` | Widget-first layout, quick actions |
| Tasks | `app/app/tasks/page.tsx` | Card view default, filter bottom sheet |
| Projects | `app/app/projects/page.tsx` | Card grid, FAB for create |
| Materials | `app/app/materials/page.tsx` | Searchable cards, category tabs |
| Expenses | `app/app/expenses/page.tsx` | Swipe to approve/reject |
| Team | `app/app/team/page.tsx` | Card list, invite FAB |
| Chat | `app/app/chat/page.tsx` | Full-height, keyboard handling |
| Settings | `app/app/settings/page.tsx` | iOS grouped list style |

### Medium Priority (Enhance Mobile UX)

| Component | Location | Enhancement |
|-----------|----------|-------------|
| ProjectCard | `components/projects/ProjectCard.tsx` | Add swipe actions |
| ExpenseCard | `components/expenses/ExpenseCard.tsx` | Add swipe actions |
| CreateProjectForm | `components/projects/CreateProjectForm.tsx` | Mobile form patterns |
| CreateTaskForm | `components/tasks/CreateTaskForm.tsx` | Mobile form patterns |
| LoginForm | `components/auth/LoginForm.tsx` | Mobile form patterns |

### Already Mobile-Ready (No Changes Needed)

| Component | Location | Status |
|-----------|----------|--------|
| BottomNavigation | `components/app/BottomNavigation.tsx` | ✓ Touch-optimized |
| Header | `components/app/Header.tsx` | ✓ Mobile-only header |
| MobileOptimizedForm | `components/forms/MobileOptimizedForm.tsx` | ✓ Reference implementation |

---

## Success Metrics

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| Lighthouse Mobile Performance | _[Measure before sprint start]_ | ≥90 | Chrome DevTools Lighthouse |
| Lighthouse PWA Score | _[Measure before sprint start]_ | 100 | Chrome DevTools Lighthouse |
| Time to Interactive | _[Measure before sprint start]_ | <3s | Lighthouse TTI metric |
| User tap response time | _[Profile with Performance API]_ | <100ms | `performance.now()` delta |
| Animation frame rate | _[Profile with DevTools]_ | 60fps | Chrome Performance panel |
| First Contentful Paint | _[Measure before sprint start]_ | <1.5s | Core Web Vitals |
| Cumulative Layout Shift | _[Measure before sprint start]_ | <0.1 | Core Web Vitals |
| Mobile usability (field test) | N/A | Zero blocking issues | Manual QA on job site |

**Baseline Measurement Checklist:**
- [ ] Run Lighthouse audit on `/app` dashboard page
- [ ] Run Lighthouse audit on `/app/tasks` page
- [ ] Profile tap response on TaskCard component
- [ ] Record animation fps for modal open/close

---

## Implementation Notes (AI Agent Guidance)

### Patterns to Follow
- Extract `useMobileDetection()` hook for consistent breakpoint detection (SSR-safe)
- Use `framer-motion` for 60fps animations (already in project dependencies)
- Leverage existing `BaseModal` bottom-sheet mode - don't recreate
- Follow `TaskCard.tsx` pattern for new card components
- Use `MobileOptimizedForm.tsx` as reference for form conversions
- Implement swipe gestures with `@use-gesture/react` (add if needed)

### Anti-patterns to Avoid
- ❌ Don't use `window.innerWidth` directly (SSR incompatible)
- ❌ Don't create separate mobile/desktop components (use responsive single component)
- ❌ Don't add new CSS frameworks (Tailwind only per constraints)
- ❌ Don't import Supabase SDK in client components
- ❌ Don't use `<Dialog>` - use `<BaseModal>` only
- ❌ Don't add icons from libraries other than Lucide

### Code Organization
```
components/
├── mobile/                    # New mobile-specific primitives
│   ├── SwipeableCard.tsx     # P0: Reusable swipe card
│   ├── PullToRefresh.tsx     # P1: Refresh wrapper
│   ├── StickySubmitButton.tsx
│   └── SkeletonCard.tsx
├── shared/                    # Responsive components
│   └── ResponsiveTable.tsx   # Renders table (desktop) or cards (mobile)
```

### Testing Requirements
- Test on iOS Safari (primary target)
- Test on Chrome Android
- Test with slow 3G network throttling
- Test offline mode (DevTools → Network → Offline)

---

## Definition of Done

### Per-Component Checklist
- [ ] All relevant AC-* criteria pass manual testing
- [ ] Component works on iOS Safari and Chrome Android
- [ ] Touch targets ≥44x44px verified
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No Supabase SDK imports in client component
- [ ] 60fps animations verified in DevTools Performance panel
- [ ] Offline behavior tested (if applicable)

### Sprint Completion Checklist
- [ ] Lighthouse Mobile score ≥90 on key pages
- [ ] Lighthouse PWA score = 100
- [ ] All P0 and P1 components completed
- [ ] Components synced to `.claude/docs/indexes/components.md`
- [ ] Manual QA session on physical iOS device
- [ ] Manual QA session on physical Android device
- [ ] No regression in existing desktop functionality

---

## Status

**Phase 1: Requirements** - ✅ APPROVED

---

## Next Steps

1. **Phase 2: Technical Design** (`/kc:spec mobile-pwa-optimization --mode=design`)
   - Database changes: None required
   - Component architecture decisions
   - Animation/transition specifications
   - Performance optimization strategies

2. **Phase 3: Implementation Tasks** (`/kc:spec mobile-pwa-optimization --mode=plan`)
   - Atomic task breakdown
   - Agent assignments (frontend-engineer)
   - Dependency ordering
   - Acceptance criteria per task
