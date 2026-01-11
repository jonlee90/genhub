# Requirement: Materials Page Redesign

## Problem Statement

The `/app/materials` page currently has an inconsistent design compared to the recently redesigned `/app/tasks` and `/app/projects` pages. The materials page lacks:
- A unified `MaterialsPageClient` pattern with mobile/desktop responsive layouts
- Pull-to-refresh support on mobile
- A comprehensive Material Summary component matching the ProjectSummary design
- Consistent filter/search patterns with status tabs
- Bottom navigation integration for mobile

Users need a consistent, intuitive experience across all module pages in the GenHub PWA.

## User Stories

1. **As a general contractor**, I want the materials page to look and feel like the tasks and projects pages so that I have a consistent, predictable experience across the app.

2. **As a field worker on mobile**, I want pull-to-refresh functionality and mobile-optimized filters so that I can quickly access material information on job sites.

3. **As a project manager**, I want a Material Summary at the top of the page showing key analytics (total materials, total cost, price alerts, lead times, tracked count) so that I can quickly assess material procurement status.

4. **As a user**, I want mobile status tabs and search filters that work like the tasks page so that I can filter materials by procurement status efficiently.

## Acceptance Criteria

### Page Layout (EARS Format)

- **WHEN** the user visits `/app/materials` on desktop, **THE SYSTEM SHALL** display:
  - Industrial header with "MATERIALS" title and blueprint aesthetic
  - Material Summary component with portfolio-level analytics
  - Filters section (search, category, sort, status tabs)
  - Results count indicator
  - Materials grid/list with staggered animations

- **WHEN** the user visits `/app/materials` on mobile, **THE SYSTEM SHALL** display:
  - Pull-to-refresh wrapper
  - Collapsible fixed header (shows on scroll past results count)
  - Mobile status tabs for procurement status filtering
  - Filter bottom sheet for additional filters
  - Material cards optimized for mobile touch targets

### Material Summary Component

- **WHEN** the page loads, **THE SYSTEM SHALL** display a Material Summary card showing:
  - Total materials linked to tasks
  - Total estimated cost (formatted currency)
  - Price increases in last 7 days (alert indicator)
  - Average lead time (days)
  - Tracked materials count (X/10 watchlist)
  - Overall procurement health status badge
  - Progress bars for budget utilization and task coverage
  - Warning banner if price volatility detected

- **WHILE** viewing Material Summary, **THE SYSTEM SHALL** use the same visual design patterns as ProjectSummary:
  - Neutral gray backgrounds with color accent dots
  - Progress bars with status-based colors
  - Touch-friendly card layouts (min 44px targets)
  - Mobile-first responsive design

### Filters & Search

- **WHEN** the user types in search, **THE SYSTEM SHALL** filter materials by:
  - Product name
  - SKU
  - Manufacturer
  - Category

- **WHEN** the user selects a procurement status tab, **THE SYSTEM SHALL** filter materials by:
  - All (default)
  - Needed
  - Ordered
  - Delivered
  - Installed

- **WHEN** the user uses additional filters, **THE SYSTEM SHALL** support:
  - Category filter (lumber, electrical, plumbing, etc.)
  - Project filter (filter by linked project)
  - Sort options (newest, name, cost, lead time)

### Mobile Experience

- **WHEN** the user pulls down on mobile, **THE SYSTEM SHALL** trigger a page refresh
- **WHEN** the user scrolls past the results count, **THE SYSTEM SHALL** show the fixed header with search and status tabs
- **WHEN** the user taps the filter button, **THE SYSTEM SHALL** open a bottom sheet with filter options
- **WHILE** on mobile, **THE SYSTEM SHALL** hide the desktop header and use mobile-optimized layouts

## Scope

### In Scope
- Create `MaterialsPageClient` component following `ProjectsPageClient` pattern
- Redesign `MaterialSummary` component to match `ProjectSummary` design
- Create `MaterialFilters` component following `ProjectFilters` pattern
- Create `MaterialCard` responsive card component
- Add mobile pull-to-refresh and fixed header behavior
- Add status tabs for procurement status filtering
- Add bottom sheet filters for mobile
- Integrate with bottom navigation context

### Out of Scope
- Changes to Server Actions or database schema
- New data fetching patterns (reuse existing `getMaterialSummaryStats`)
- Home Depot API integration changes
- Material assignment/tracking modal changes
- Creating new materials (handled by existing MaterialsSearch)

## Constraints

- Must not introduce Supabase SDK in client components
- Must use existing Server Actions for data fetching
- Must follow GenHub design system (colors, fonts, BaseModal, Lucide icons)
- Must maintain existing functionality (search, tracked materials, assignments)
- Mobile-first responsive design required
- Must integrate with existing `BottomNavContext`

## Dependencies

- Existing `getMaterialSummaryStats` Server Action
- Existing `getTaskLinkedMaterials` Server Action
- Existing `getTrackedMaterials` Server Action
- `ProjectSummary` component (design reference)
- `ProjectsPageClient` component (pattern reference)
- `TasksPageClient` component (pattern reference)
- `PullToRefresh` component
- `BottomSheet` component
- `MobileStatusTabs` component
