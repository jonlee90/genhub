# Team Page Styling Update - Implementation Tasks

## References
- Requirements: `.claude/specs/team-page-styling-update/requirements.md`
- Design: `.claude/specs/team-page-styling-update/design.md`

---

## Phase 1: Core Layout Updates

### Task 1.1: Update TeamPage Server Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `app/app/team/page.tsx`
- **Requirements:**
  - Remove inline BLUEPRINT_BACKGROUND_STYLE constant
  - Simplify page structure to delegate to TeamPageClient
  - Match ProjectsPage pattern (minimal server component)
  - Preserve existing error handling logic
- **Acceptance:**
  - [ ] No blueprint background defined in server component
  - [ ] Server component only fetches data and delegates
  - [ ] Error states still render correctly
  - [ ] No console warnings

### Task 1.2: Refactor TeamPageClient Layout Structure
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Task 1.1
- **Requirements:**
  - Import BlueprintBackground component
  - Add desktop layout section (flex-1 space-y-4 md:space-y-6)
  - Add mobile layout section with PullToRefresh
  - Update header structure with construction-blue border
  - Add filter state management (searchQuery, roleFilter, statusFilter, sortBy)
  - Add useMemo for filteredMembers calculation
  - Implement clearFilters function
- **Acceptance:**
  - [ ] BlueprintBackground renders on both mobile/desktop
  - [ ] Header has 1px construction-blue top border
  - [ ] Title is "TEAM" in heavy typography (text-3xl md:text-5xl font-black)
  - [ ] Desktop uses flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6
  - [ ] Mobile uses PullToRefresh wrapper
  - [ ] Filter states initialized correctly
  - [ ] No TypeScript errors

### Task 1.3: Update Invite Button Styling
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Apply gradient background (from-construction-blue to-blue-700)
  - Add hover state (from-construction-blue/90 to-blue-700/90)
  - Include Plus icon with rotate animation on hover
  - Ensure 44px minimum height (h-11 md:h-14)
  - Add shadow-construction-lg class
  - Position in header next to title
  - Responsive text ("INVITE" on mobile, "INVITE TEAM MEMBER" on desktop)
- **Acceptance:**
  - [ ] Button has gradient background
  - [ ] Hover animation works smoothly
  - [ ] Plus icon rotates 90deg on hover
  - [ ] Touch target meets 44px minimum
  - [ ] Matches Projects "NEW PROJECT" button styling
  - [ ] Dark mode styling correct

---

## Phase 2: New Components

### Task 2.1: Create TeamSummary Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamSummary.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Create TeamSummaryStats interface
  - Match PortfolioSummary layout pattern
  - Header with Users icon in construction-blue badge
  - Stats grid using StatCard components
  - Role distribution section
  - Recent joins section (conditional)
  - Full dark mode support
  - Mobile-responsive grid (grid-cols-2/3 adaptive)
- **Acceptance:**
  - [ ] Component matches PortfolioSummary visual pattern
  - [ ] Header has construction-blue icon badge
  - [ ] Stats display in grid layout
  - [ ] Dark mode colors correct
  - [ ] Responsive on mobile (375px)
  - [ ] Uses StatCard component from shared/ui
  - [ ] No prop-types warnings

### Task 2.2: Create TeamFilters Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamFilters.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Match ProjectFilters component structure
  - Import FilterTabs and DesktopTabs
  - Import PlaceholdersVanishInput
  - Implement status tabs with counts (all, active, invited, inactive)
  - Add role filter dropdown (all, admin, PM, foreman, worker)
  - Add sort dropdown (name, email, role, joined)
  - Search input with placeholders
  - Calculate filter counts using useMemo
  - Mobile/desktop responsive tabs
- **Acceptance:**
  - [ ] Status tabs render with counts
  - [ ] Mobile uses FilterTabs, desktop uses DesktopTabs
  - [ ] PlaceholdersVanishInput works with search
  - [ ] Role and sort dropdowns functional
  - [ ] Filter counts update correctly
  - [ ] Construction-blue active states
  - [ ] Dark mode support complete

### Task 2.3: Integrate TeamSummary into TeamPageClient
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Tasks 1.2, 2.1
- **Requirements:**
  - Calculate teamSummaryStats using useMemo
  - Calculate role distribution from members array
  - Calculate recent joins (last 7 days)
  - Render TeamSummary below header
  - Add fade-in animation (animate-in fade-in slide-in-from-top-2 duration-300)
  - Conditional rendering (only if members exist)
- **Acceptance:**
  - [ ] TeamSummary renders with correct stats
  - [ ] Stats calculation in useMemo
  - [ ] Animation works smoothly
  - [ ] Only shows when members.length > 0
  - [ ] No performance issues with recalculation

### Task 2.4: Integrate TeamFilters into TeamPageClient
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Tasks 1.2, 2.2
- **Requirements:**
  - Import TeamFilters component
  - Pass all filter state props
  - Position below TeamSummary
  - Implement filteredMembers useMemo with all filters
  - Implement sort logic (name, email, role, joined)
  - Handle filter changes with callbacks
- **Acceptance:**
  - [ ] TeamFilters renders correctly
  - [ ] All filter state connected
  - [ ] filteredMembers updates on filter change
  - [ ] Sort logic works correctly
  - [ ] No re-render performance issues

---

## Phase 3: Empty States and Polish

### Task 3.1: Create Empty State Components
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Create NoResultsState component (desktop)
  - Create MobileNoResultsState component
  - Match Projects page empty state patterns
  - Construction-red themed with ShieldAlert icon
  - "CLEAR ALL FILTERS" button with rotate animation
  - Responsive layouts (mobile vs desktop)
  - Dark mode support
- **Acceptance:**
  - [ ] NoResultsState matches Projects pattern exactly
  - [ ] MobileNoResultsState is simplified version
  - [ ] ShieldAlert icon with animation
  - [ ] Clear filters button functional
  - [ ] Dark mode styling correct
  - [ ] Touch targets 44px+

### Task 3.2: Add Empty Team State
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Use EmptyStateCard component
  - Users icon (from lucide-react)
  - Title: "BUILD YOUR TEAM"
  - Description: "Invite team members to start collaborating on projects"
  - Button: "INVITE MEMBER" (only if admin)
  - Show when members.length === 0
- **Acceptance:**
  - [ ] EmptyStateCard renders when no members
  - [ ] Uses Users icon
  - [ ] Text matches spec
  - [ ] Button only shows for admins
  - [ ] Clicking button opens invite modal
  - [ ] Matches Projects empty state styling

### Task 3.3: Update TeamMemberCard Styling
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamMemberCard.tsx`
- **Dependencies:** None (independent)
- **Requirements:**
  - Ensure minimum 44px touch target (current p-4 should be sufficient)
  - Update badge colors to match design system
  - Add construction-blue accents for active states
  - Update avatar fallback background to construction-blue
  - Add subtle hover/active states
  - Verify dark mode contrast
- **Acceptance:**
  - [ ] Touch target meets 44px minimum
  - [ ] Avatar fallback is construction-blue
  - [ ] Badge colors consistent with design system
  - [ ] Hover/active states visible
  - [ ] Dark mode looks correct
  - [ ] No functionality changed (styling only)

### Task 3.4: Add Bottom Decorative Border
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/TeamPageClient.tsx`
- **Dependencies:** Task 1.2
- **Requirements:**
  - Add decorative gradient border at bottom of desktop layout
  - Match Projects pattern exactly
  - Class: "h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"
  - Position at end of desktop layout container
- **Acceptance:**
  - [ ] Border renders at bottom of desktop view
  - [ ] Gradient correct (transparent → gray → transparent)
  - [ ] Dark mode variant works
  - [ ] Does not appear on mobile

---

## Phase 4: Responsive and Accessibility

### Task 4.1: Mobile Touch Target Audit
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** All team components
- **Dependencies:** All Phase 1-3 tasks
- **Requirements:**
  - Verify all interactive elements meet 44px minimum
  - Test on iPhone SE (375px width)
  - Buttons: h-11 minimum
  - Cards: min-h-[60px] or p-4 ensuring 44px
  - Tabs: min-h-[44px]
  - Dropdowns: h-11
  - Document any issues found
- **Acceptance:**
  - [ ] All buttons meet 44px height
  - [ ] All cards meet 44px touch area
  - [ ] Tabs meet 44px height
  - [ ] No cramped spacing on 375px width
  - [ ] Report generated with findings

### Task 4.2: Dark Mode Verification
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Test report
- **Dependencies:** All Phase 1-3 tasks
- **Requirements:**
  - Test all components in dark mode
  - Verify construction-blue visibility
  - Check contrast ratios (WCAG AA)
  - Verify border colors (dark:border-gray-700)
  - Check text colors (dark:text-gray-100/300/400)
  - Test theme toggle transition smoothness
- **Acceptance:**
  - [ ] All components visible in dark mode
  - [ ] Construction-blue maintains visibility
  - [ ] Text contrast meets WCAG AA
  - [ ] Borders visible but subtle
  - [ ] Transitions smooth (no flashing)
  - [ ] Report documents any issues

### Task 4.3: Animation Performance Check
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Performance report
- **Dependencies:** All Phase 1-3 tasks
- **Requirements:**
  - Test animations on low-end device (throttle CPU 6x)
  - Verify 60fps performance
  - Check framer-motion usage (minimal)
  - Verify CSS animations used where possible
  - Test pull-to-refresh smoothness
  - Test filter transition performance
- **Acceptance:**
  - [ ] All animations 60fps on throttled CPU
  - [ ] No jank during pull-to-refresh
  - [ ] Filter updates smooth
  - [ ] CSS animations preferred over JS
  - [ ] Report documents performance metrics

---

## Phase 5: Integration Testing

### Task 5.1: Full Page Integration Test
- **Agent:** code-reviewer
- **Output:** Integration test report
- **Dependencies:** All Phase 1-4 tasks
- **Requirements:**
  - Test full user flow: navigate → filter → invite → refresh
  - Verify all filters work together correctly
  - Test pagination (if team > 25 members)
  - Test mobile/desktop responsiveness
  - Verify pull-to-refresh on mobile
  - Check all empty states
  - Verify role-based visibility (admin vs PM vs worker)
- **Acceptance:**
  - [ ] All user flows work end-to-end
  - [ ] Filters combine correctly
  - [ ] Mobile experience smooth
  - [ ] Desktop layout correct
  - [ ] Role visibility rules enforced
  - [ ] No console errors or warnings

### Task 5.2: Visual Consistency Check
- **Agent:** code-reviewer
- **Output:** Visual comparison report
- **Dependencies:** All Phase 1-4 tasks
- **Requirements:**
  - Compare Team page to Projects page side-by-side
  - Verify identical header styling
  - Verify identical button styling
  - Verify identical filter styling
  - Verify identical empty state styling
  - Verify identical spacing/padding
  - Document any remaining differences
- **Acceptance:**
  - [ ] Header visually identical to Projects
  - [ ] Buttons match Projects style
  - [ ] Filters match Projects style
  - [ ] Empty states match Projects style
  - [ ] Spacing matches Projects
  - [ ] Report confirms visual consistency

### Task 5.3: Accessibility Audit
- **Agent:** code-reviewer
- **Output:** Accessibility report
- **Dependencies:** All Phase 1-4 tasks
- **Requirements:**
  - Run axe DevTools audit
  - Test keyboard navigation
  - Test screen reader (VoiceOver/NVDA)
  - Verify ARIA labels
  - Check color contrast ratios
  - Verify focus indicators visible
- **Acceptance:**
  - [ ] No critical axe violations
  - [ ] Keyboard navigation works fully
  - [ ] Screen reader announces correctly
  - [ ] All interactive elements have ARIA labels
  - [ ] Contrast meets WCAG AA
  - [ ] Focus indicators visible

---

## Phase 6: Documentation and Cleanup

### Task 6.1: Update Component Documentation
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** JSDoc comments in components
- **Dependencies:** All Phase 1-5 tasks
- **Requirements:**
  - Add JSDoc to TeamSummary component
  - Add JSDoc to TeamFilters component
  - Update TeamPageClient JSDoc
  - Document props interfaces
  - Document key behaviors
  - Add usage examples
- **Acceptance:**
  - [ ] All new components have JSDoc
  - [ ] Props documented with @param
  - [ ] Examples provided for complex components
  - [ ] No outdated comments

### Task 6.2: Run Build and Type Check
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Build verification report
- **Dependencies:** All Phase 1-5 tasks
- **Requirements:**
  - Run `npm run build`
  - Fix any TypeScript errors
  - Fix any build warnings
  - Verify no bundle size increase > 5KB
  - Check for unused imports
  - Remove console.logs
- **Acceptance:**
  - [ ] Build completes successfully
  - [ ] No TypeScript errors
  - [ ] No build warnings
  - [ ] Bundle size acceptable (<5KB increase)
  - [ ] No unused imports
  - [ ] No debug logs

### Task 6.3: Create Migration Guide
- **Agent:** frontend-engineer
- **Output:** `.claude/specs/team-page-styling-update/MIGRATION.md`
- **Dependencies:** All Phase 1-5 tasks
- **Requirements:**
  - Document all component changes
  - List new components created
  - Document breaking changes (if any)
  - Provide before/after screenshots
  - Document new dependencies
  - Note any behavior changes
- **Acceptance:**
  - [ ] Migration guide complete
  - [ ] All changes documented
  - [ ] Screenshots included
  - [ ] Clear and accurate

---

## Execution Order

```
Sequential Dependencies:
1.1 → 1.2 → 1.3
      ↓
2.1, 2.2 (parallel)
      ↓
2.3, 2.4 (after 2.1, 2.2)
      ↓
3.1, 3.2, 3.3, 3.4 (parallel)
      ↓
4.1, 4.2, 4.3 (parallel)
      ↓
5.1 → 5.2 → 5.3
      ↓
6.1, 6.2 (parallel) → 6.3
```

**Parallelizable:**
- Tasks 2.1 and 2.2 can run in parallel
- Tasks 3.1-3.4 can run in parallel
- Tasks 4.1-4.3 can run in parallel
- Tasks 6.1 and 6.2 can run in parallel

---

## Estimated Effort
- **Phase 1 (Core Layout):** 3 tasks (~2-3 hours)
- **Phase 2 (New Components):** 4 tasks (~3-4 hours)
- **Phase 3 (Polish):** 4 tasks (~2-3 hours)
- **Phase 4 (Responsive/A11y):** 3 tasks (~2 hours)
- **Phase 5 (Testing):** 3 tasks (~2 hours)
- **Phase 6 (Documentation):** 3 tasks (~1 hour)
- **Total:** 20 tasks (~12-15 hours)

---

## Success Criteria
- [ ] Team page visually indistinguishable from Projects page styling
- [ ] All touch targets meet 44px minimum
- [ ] Dark mode fully functional
- [ ] Mobile experience smooth (60fps animations)
- [ ] No build errors or warnings
- [ ] No accessibility violations
- [ ] Bundle size increase < 5KB
- [ ] Code passes review

---

**Status:** READY FOR IMPLEMENTATION
