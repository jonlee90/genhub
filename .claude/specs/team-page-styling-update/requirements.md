# Team Page Styling Update - Requirements

## Overview
Update the `/app/team` page to match the visual and structural patterns of the `/app/projects` page, ensuring consistent design language, component usage, layout structure, and responsive behavior across the GenHub PWA.

## Personas
- **Primary**: GC Admin - Manages team invitations, views team roster, controls access
- **Secondary**: PM/Foreman - Views team members, checks roles and project assignments
- **Tertiary**: Worker - Views team roster (read-only access)

---

## User Stories

### US-1: Consistent Page Layout
**As a** GC Admin,
**I want** the Team page to have the same visual structure as the Projects page,
**So that** the app feels cohesive and navigation is predictable.

**Acceptance Criteria (EARS):**
- WHEN user navigates to `/app/team` THE SYSTEM SHALL display BlueprintBackground component matching Projects page
- WHEN page loads THE SYSTEM SHALL render page container with identical spacing (flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6)
- WHEN user views header THE SYSTEM SHALL display construction-blue top border (1px height)
- WHEN user views title THE SYSTEM SHALL display "TEAM" in heavy industrial typography (text-3xl md:text-5xl font-black tracking-tighter)

**Priority:** Critical

### US-2: Consistent Action Button Styling
**As a** GC Admin,
**I want** the "Invite Team Member" button to match the Projects "NEW PROJECT" button styling,
**So that** primary actions are visually consistent across pages.

**Acceptance Criteria (EARS):**
- WHEN GC Admin views Team page THE SYSTEM SHALL display invite button with gradient background (from-construction-blue to-blue-700)
- WHEN user hovers over invite button THE SYSTEM SHALL display hover state (from-construction-blue/90 to-blue-700/90)
- WHEN user presses button THE SYSTEM SHALL ensure minimum 44px touch target height
- WHEN button renders THE SYSTEM SHALL include Lucide Plus icon with rotate animation on hover
- WHEN on mobile THE SYSTEM SHALL position button in header next to title

**Priority:** High

### US-3: Team Summary Dashboard
**As a** GC Admin,
**I want** a visual summary of team statistics similar to PortfolioSummary,
**So that** I can quickly assess team composition and status.

**Acceptance Criteria (EARS):**
- WHEN team members exist THE SYSTEM SHALL display team summary card below header
- WHEN summary renders THE SYSTEM SHALL show total members, active count, and role distribution
- WHEN summary displays THE SYSTEM SHALL use construction-blue theming consistent with portfolio summary
- WHEN on mobile THE SYSTEM SHALL adapt summary to mobile-optimized grid layout
- WHEN stats update THE SYSTEM SHALL animate transitions smoothly (duration-300)

**Priority:** High

### US-4: Mobile-First Responsive Design
**As a** PM using mobile device,
**I want** the Team page to adapt seamlessly to mobile screens,
**So that** I can manage team on-site from my phone.

**Acceptance Criteria (EARS):**
- WHEN viewport width < 768px THE SYSTEM SHALL display mobile layout with PullToRefresh
- WHEN user pulls down to refresh THE SYSTEM SHALL trigger data reload with router.refresh()
- WHEN on mobile THE SYSTEM SHALL use vertical stacking for all content sections
- WHEN on desktop THE SYSTEM SHALL use appropriate grid layouts for data presentation
- WHEN user interacts THE SYSTEM SHALL ensure all touch targets meet 44px minimum

**Priority:** Critical

### US-5: Consistent Filter/Search Patterns
**As a** GC Admin,
**I want** team filtering to match the Projects page filter patterns,
**So that** search behavior is consistent across the app.

**Acceptance Criteria (EARS):**
- WHEN user searches team THE SYSTEM SHALL use PlaceholdersVanishInput component matching Projects
- WHEN filters applied THE SYSTEM SHALL display filter tabs with construction-blue active state
- WHEN no results found THE SYSTEM SHALL show empty state matching Projects NoResultsState pattern
- WHEN user clears filters THE SYSTEM SHALL reset to "all" view immediately
- WHEN filtering THE SYSTEM SHALL update counts in real-time using useMemo

**Priority:** Medium

### US-6: Dark Mode Consistency
**As a** user with dark mode enabled,
**I want** the Team page dark mode to match Projects page styling,
**So that** visual consistency is maintained across themes.

**Acceptance Criteria (EARS):**
- WHEN dark mode active THE SYSTEM SHALL use dark:bg-gray-900 for cards
- WHEN dark mode active THE SYSTEM SHALL use dark:border-gray-700 for borders
- WHEN dark mode active THE SYSTEM SHALL use dark:text-gray-100 for primary text
- WHEN dark mode active THE SYSTEM SHALL maintain construction-blue brand color visibility
- WHEN user toggles theme THE SYSTEM SHALL transition colors smoothly

**Priority:** High

### US-7: Loading and Empty States
**As a** GC Admin,
**I want** loading and empty states to match Projects page patterns,
**So that** user feedback is consistent throughout the app.

**Acceptance Criteria (EARS):**
- WHEN no team members exist THE SYSTEM SHALL display EmptyStateCard with FolderKanban icon pattern
- WHEN loading data THE SYSTEM SHALL display skeleton states matching ProjectCardSkeleton pattern
- WHEN pull-to-refresh active THE SYSTEM SHALL show loading indicator
- WHEN pagination loading THE SYSTEM SHALL display "Loading team members..." text
- WHEN error occurs THE SYSTEM SHALL show construction-themed error state

**Priority:** Medium

### US-8: Pagination Consistency
**As a** GC Admin with large team,
**I want** team pagination to match Projects page pagination,
**So that** navigation behavior is predictable.

**Acceptance Criteria (EARS):**
- WHEN team members > 25 THE SYSTEM SHALL display pagination controls matching Projects pattern
- WHEN user changes page THE SYSTEM SHALL use startTransition for smooth updates
- WHEN pagination renders THE SYSTEM SHALL use construction-blue active page styling
- WHEN on mobile THE SYSTEM SHALL show abbreviated pagination (icons only for prev/next)
- WHEN navigating pages THE SYSTEM SHALL scroll to top smoothly

**Priority:** Medium

---

## Out of Scope
- Changes to team member data structure
- New team management features beyond styling updates
- Backend API modifications
- Database schema changes
- Subcontractor page styling (separate feature)
- Team member detail modal redesign (existing modal pattern maintained)

## Dependencies
- Existing BlueprintBackground component (`components/shared/BlueprintBackground.tsx`)
- Existing PortfolioSummary component pattern for TeamSummary inspiration
- Existing ProjectsPageClient component as styling reference
- Existing PlaceholdersVanishInput component
- Existing FilterTabs/DesktopTabs components
- Existing EmptyStateCard component
- Existing ResponsiveModal component (already used in InviteTeamMemberModal)

## Non-Functional Requirements
- **Performance**: Page load time < 1.5s, same as Projects page
- **Accessibility**: Maintain WCAG 2.1 AA compliance with 44px touch targets
- **Mobile**: Optimized for 375px viewport width (iPhone SE)
- **Dark Mode**: Full dark mode support matching Projects page
- **Bundle Size**: No increase > 5KB to total bundle (use existing components)
- **Animation**: Smooth 60fps transitions using CSS animations where possible

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to design)
