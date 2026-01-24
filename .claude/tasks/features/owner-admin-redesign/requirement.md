# Requirement: Owner Admin Pages Redesign

> Modernize platform admin pages with unified navigation, mobile-first design, and 2025 UI patterns

---

## Problem Statement

The owner admin section (`/app/owner/*`) currently lacks cohesive navigation and modern admin panel patterns. Platform owners managing multi-tenant operations need:

- **Unified navigation** between Companies/Users/Invites pages without returning to main sidebar
- **Consistent components** using GenHub's design system (KPICard, SearchInput, etc.)
- **Mobile-first tables** with card views and swipe actions on touch devices
- **Search and filtering** capabilities for managing large datasets
- **Modern 2025 patterns** from SaaS admin dashboards (tabbed navigation, role-based controls, metadata-driven UI)

**Current Issues:**
1. No dedicated navigation - must use main sidebar for page switching
2. Inconsistent stat cards - manual implementation vs. KPICard component
3. Desktop-only tables - not optimized for mobile PWA usage
4. No search/filter - difficult to find users/companies at scale
5. Missing skeleton states - no loading UI for data-heavy pages
6. Duplicated code - each page re-implements blueprint background, industrial header

---

## User Stories

### US-1: Platform Owner Navigation
As a **platform owner**, I want to **navigate between Companies, Users, and Invites pages without leaving the admin section** so that **I can manage multi-tenant operations efficiently**.

**Test Scenarios:**
- [ ] Given I'm on `/app/owner/companies`, I see tabbed navigation with Companies/Users/Invites
- [ ] Given I click "Users" tab, navigate to `/app/owner/users` with smooth transition
- [ ] Given pending invites exist, "Invites" tab shows badge count
- [ ] Given I'm on mobile, tabs use SegmentedControl pattern with haptic feedback
- [ ] Given I navigate between tabs, active tab is highlighted with construction-blue

### US-2: Mobile Company Management
As a **platform owner on mobile**, I want to **view companies as swipeable cards with touch-optimized actions** so that **I can manage companies from my phone at job sites**.

**Test Scenarios:**
- [ ] Given <768px viewport, companies display as card grid (not table)
- [ ] Given tap on company card, all touch targets are ≥44px
- [ ] Given company list, cards have contact info, user count, project count
- [ ] Given search input, filter companies by name/email in real-time
- [ ] Given loading state, skeleton cards match final card structure

### US-3: User Search and Filtering
As a **platform owner**, I want to **search and filter users by name, email, company, or role** so that **I can quickly find specific users across all tenants**.

**Test Scenarios:**
- [ ] Given search input with "john", users filtered by name/email instantly
- [ ] Given role filter "admin", only admin users displayed
- [ ] Given company filter "Acme", only Acme users displayed
- [ ] Given no results, empty state displays with clear message
- [ ] Given desktop view, table displays with sortable columns
- [ ] Given mobile view, users display as swipeable cards

### US-4: Invitation Management
As a **platform owner**, I want to **send and manage admin invitations with mobile-friendly controls** so that **I can onboard new company admins quickly**.

**Test Scenarios:**
- [ ] Given invitation form, inputs are 56px tall on mobile (work glove friendly)
- [ ] Given pending invitation, can swipe-right to copy link
- [ ] Given pending invitation, can swipe-left to revoke
- [ ] Given invitation sent, success alert shows with copy/open buttons
- [ ] Given expired invitation, displays with "EXPIRED" badge
- [ ] Given mobile keyboard, email input has type="email" for correct keyboard

### US-5: Consistent Design System
As a **developer**, I want **reusable owner admin components following GenHub patterns** so that **future admin features maintain consistency**.

**Test Scenarios:**
- [ ] Given any stat card, uses KPICard component with variant system
- [ ] Given any page header, uses OwnerPageHeader component
- [ ] Given any data table, uses OwnerDataTable with responsive card fallback
- [ ] Given any search, uses shared SearchInput component
- [ ] Given any loading state, uses skeleton components matching final UI

---

## Acceptance Criteria (EARS Format)

### Navigation & Layout

| ID | Criteria |
|----|----------|
| AC-1 | WHEN viewing any `/app/owner/*` page THE SYSTEM SHALL display tabbed navigation with Companies/Users/Invites tabs |
| AC-2 | WHEN navigating between owner pages THE SYSTEM SHALL animate tab transitions with 200ms spring animation |
| AC-3 | WHEN pending invitations exist THE SYSTEM SHALL display count badge on Invites tab |
| AC-4 | WHEN viewing owner pages THE SYSTEM SHALL display shared blueprint grid background once (not per-page) |
| AC-5 | WHEN active tab changes THE SYSTEM SHALL highlight with construction-blue color (#001B51) |

### Mobile Optimization

| ID | Criteria |
|----|----------|
| AC-6 | WHEN viewport <768px THE SYSTEM SHALL render companies/users as card grid (NOT table) |
| AC-7 | WHEN on mobile THE SYSTEM SHALL ensure all touch targets are ≥44px height/width |
| AC-8 | WHEN user swipes invitation card THE SYSTEM SHALL reveal copy/revoke actions |
| AC-9 | WHEN tap occurs on mobile THE SYSTEM SHALL trigger haptic feedback (if supported) |
| AC-10 | WHEN form displays on mobile THE SYSTEM SHALL use 56px input height minimum |

### Search & Filtering

| ID | Criteria |
|----|----------|
| AC-11 | WHEN search input changes THE SYSTEM SHALL filter results instantly (debounced 300ms) |
| AC-12 | WHEN no search results THE SYSTEM SHALL display empty state with icon and message |
| AC-13 | WHEN user clears search THE SYSTEM SHALL restore full dataset |
| AC-14 | WHEN searching users THE SYSTEM SHALL match against name, email, and company name |
| AC-15 | WHEN searching companies THE SYSTEM SHALL match against name, email, and address |

### Component Consistency

| ID | Criteria |
|----|----------|
| AC-16 | WHEN displaying stats THE SYSTEM SHALL use KPICard component with correct variant |
| AC-17 | WHEN loading data THE SYSTEM SHALL display skeleton matching final card/table structure |
| AC-18 | WHEN page header renders THE SYSTEM SHALL use OwnerPageHeader component |
| AC-19 | WHEN data table renders THE SYSTEM SHALL use OwnerDataTable with mobile card fallback |
| AC-20 | WHEN search input renders THE SYSTEM SHALL use SearchInput component from mobile/ |

### Accessibility

| ID | Criteria |
|----|----------|
| AC-21 | WHEN tabs render THE SYSTEM SHALL include role="tablist" and aria-selected attributes |
| AC-22 | WHEN data table renders THE SYSTEM SHALL use semantic table elements with proper headers |
| AC-23 | WHEN icon-only buttons render THE SYSTEM SHALL include aria-label for screen readers |
| AC-24 | WHEN focus moves to interactive element THE SYSTEM SHALL display focus ring (construction-blue) |
| AC-25 | WHEN color conveys status THE SYSTEM SHALL include text label (not color-only) |

---

## Out of Scope

- **User/Company CRUD operations** - This redesign focuses on UI/UX, not adding edit/delete capabilities
- **Analytics dashboards** - No charts or advanced analytics for platform owners
- **Billing integration** - No Stripe tenant billing UI
- **Audit logs** - No activity tracking UI for platform actions
- **Bulk operations** - No multi-select or batch actions
- **Export functionality** - No CSV/Excel export features
- **Advanced filtering** - No complex filter builders (just basic search)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tab navigation speed | <200ms | Chrome DevTools Performance |
| Search filter latency | <300ms | Input debounce + filter execution |
| Mobile tap response | <100ms | Active state visible |
| Skeleton load time | <50ms | Immediate display on mount |
| Component reuse | 100% | KPICard, SearchInput, OwnerDataTable usage |
| Accessibility score | 100/100 | Lighthouse Accessibility audit |
| Mobile viewport coverage | 100% | All pages responsive <768px |

---

## Design References

- [SaaSFrame Dashboard Examples](https://www.saasframe.io/categories/dashboard) - Card layouts, stat grids
- [CoreUI Admin Components](https://coreui.io/) - Table patterns, navigation
- [Admin Dashboard Best Practices 2025](https://medium.com/@CarlosSmith24/admin-dashboard-ui-ux-best-practices-for-2025-8bdc6090c57d) - Modern patterns
- [Multi-Tenant SaaS Templates](https://medium.com/@andreaschristoucy/5-best-multi-tenant-saas-templates-in-2025-df52f19a7eb3) - Tenant management UI
- [Aceternity UI Sidebar](https://ui.aceternity.com/components/sidebar) - Navigation patterns
- [React Sidebar Patterns](https://dev.to/cristiansifuentes/building-a-collapsible-admin-sidebar-with-react-router-uselocation-pro-patterns-7im) - Active route detection

---

## Approval

- [ ] Product Owner: ____________________
- [ ] Technical Lead: ____________________
- [ ] UX Designer: ____________________

**Date**: _____________
