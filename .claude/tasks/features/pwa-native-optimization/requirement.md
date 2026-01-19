# PWA Native App Optimization - Requirements

## Overview

Transform GenHub PWA to deliver a native app-like experience for construction field teams operating on mobile devices with unreliable connectivity. This optimization focuses on instant loading, smooth navigation, offline resilience, and native-feel interactions to match or exceed native iOS/Android app experience.

## Personas

- **Primary**: Worker (Field Worker) - Needs fast, reliable access to tasks, materials, and daily logs while on job sites with poor connectivity
- **Primary**: Foreman - Requires quick task updates, photo capture, and team coordination during site walks
- **Secondary**: PM (Project Manager) - Reviews project status and approves changes from mobile while traveling between sites
- **Secondary**: Sub (Subcontractor) - Submits work completion, photos, and expense reports from field locations

---

## Current State Analysis

### Existing PWA Infrastructure (Strengths)
- Custom service worker (`public/sw.js`) with cache-first/network-first strategies
- IndexedDB storage layer (`lib/offline/indexeddb.ts`) for 3D models and markers
- Background sync manager (`lib/offline/sync-manager.ts`) with retry logic
- PullToRefresh component with native-feel gesture handling
- Haptic feedback hook (`useHapticFeedback`) already implemented
- Offline indicator and offline fallback page
- App shell caching for core routes
- Storage quota management

### Gaps Requiring Optimization
- No View Transitions API for smooth navigation
- Limited skeleton screen coverage (only Team, Expenses, Materials)
- No form data persistence during offline mutations
- No prefetching strategy for critical routes
- No navigation preload in service worker
- No stale-while-revalidate for user avatars and lists
- Image optimization not fully leveraging WebP/AVIF
- No comprehensive offline data access beyond 3D spatial data

---

## User Stories

### Epic 1: Instant Loading

#### US-1.1: App Shell Instant Load
**As a** Worker,
**I want** the app to load instantly on repeat visits,
**So that** I can quickly access my tasks without waiting.

**Acceptance Criteria (EARS):**
- WHEN user opens the PWA after initial visit THE SYSTEM SHALL display the app shell within 100ms from cache
- WHEN the app shell loads THE SYSTEM SHALL show skeleton screens for dynamic content while data fetches
- IF cached app shell is stale THE SYSTEM SHALL serve stale content immediately and update in background
- WHILE app shell loads THE SYSTEM SHALL display industrial-themed loading indicators matching GenHub design

**Priority:** Critical

#### US-1.2: Skeleton Screen Coverage
**As a** Foreman,
**I want** to see loading placeholders that match content layout,
**So that** I know content is loading and the app feels responsive.

**Acceptance Criteria (EARS):**
- WHEN navigating to any list page (Projects, Tasks, Materials, Expenses, Team) THE SYSTEM SHALL display skeleton screens matching the final content layout
- WHEN navigating to any detail page THE SYSTEM SHALL display skeleton placeholders for header, content sections, and action buttons
- WHEN loading 3D spatial viewer THE SYSTEM SHALL show a dedicated skeleton with model loading progress indicator
- WHEN skeleton displays THE SYSTEM SHALL use staggered animation delays (100ms increments) for visual polish

**Priority:** Critical

#### US-1.3: Critical Route Prefetching
**As a** PM,
**I want** frequently used pages to load instantly when I navigate,
**So that** I can quickly review project status without delays.

**Acceptance Criteria (EARS):**
- WHEN user hovers over navigation links for 200ms on desktop THE SYSTEM SHALL prefetch that route's data
- WHEN user focuses on navigation links on mobile THE SYSTEM SHALL prefetch that route's data
- WHEN dashboard loads THE SYSTEM SHALL prefetch Projects list route in background
- WHEN project detail loads THE SYSTEM SHALL prefetch Tasks and Spatial routes for that project

**Priority:** High

---

### Epic 2: Smooth Navigation

#### US-2.1: View Transitions
**As a** Worker,
**I want** smooth animated transitions between pages,
**So that** the app feels like a native mobile app.

**Acceptance Criteria (EARS):**
- WHEN navigating between pages THE SYSTEM SHALL animate the transition using View Transitions API
- IF View Transitions API is not supported THE SYSTEM SHALL fall back to instant navigation without animation
- WHEN navigating from list to detail THE SYSTEM SHALL animate the selected item expanding into the detail view
- WHEN navigating back THE SYSTEM SHALL animate the detail view collapsing back to list position
- WHEN navigating THE SYSTEM SHALL complete transition animations within 300ms

**Priority:** High

#### US-2.2: Navigation State Persistence
**As a** Foreman,
**I want** my scroll position and filter state to be preserved when navigating back,
**So that** I don't lose my place in long lists.

**Acceptance Criteria (EARS):**
- WHEN navigating from a list page to detail and back THE SYSTEM SHALL restore the previous scroll position
- WHEN navigating back to a filtered list THE SYSTEM SHALL restore the previous filter/search state
- WHEN using browser back button THE SYSTEM SHALL restore the exact previous view state
- WHILE navigating away from form THE SYSTEM SHALL preserve form draft data for 30 minutes

**Priority:** Medium

---

### Epic 3: Offline-First Data

#### US-3.1: Project Data Offline Access
**As a** Worker,
**I want** to access my assigned project data when offline,
**So that** I can continue working on job sites with no signal.

**Acceptance Criteria (EARS):**
- WHEN user views a project THE SYSTEM SHALL cache project data, phases, tasks, and team members in IndexedDB
- WHEN user is offline THE SYSTEM SHALL serve cached project data with "Offline" indicator badge
- WHEN user modifies data offline THE SYSTEM SHALL queue changes in sync queue with optimistic UI updates
- IF cached data is older than 24 hours THE SYSTEM SHALL display "Data may be outdated" warning

**Priority:** Critical

#### US-3.2: Form Data Persistence
**As a** Sub,
**I want** my form entries saved if I lose connection mid-submission,
**So that** I don't lose my work.

**Acceptance Criteria (EARS):**
- WHEN user enters data in any form THE SYSTEM SHALL auto-save draft to IndexedDB every 5 seconds
- WHEN user loses connection during form submission THE SYSTEM SHALL queue submission and show pending indicator
- WHEN connection restores THE SYSTEM SHALL automatically submit queued form data with progress notification
- IF form submission fails after 3 retries THE SYSTEM SHALL notify user and preserve form data for manual retry

**Priority:** Critical

#### US-3.3: Photo Capture Queue
**As a** Foreman,
**I want** to capture photos for tasks when offline,
**So that** I can document issues immediately during site walks.

**Acceptance Criteria (EARS):**
- WHEN user captures photo while offline THE SYSTEM SHALL store photo in IndexedDB with compression
- WHEN user captures photo THE SYSTEM SHALL show pending upload indicator (cloud icon with arrow)
- WHEN connection restores THE SYSTEM SHALL upload queued photos with background sync
- WHEN photo upload completes THE SYSTEM SHALL update indicator to show synced status
- WHILE photos pending upload THE SYSTEM SHALL display count badge on navigation

**Priority:** High

#### US-3.4: Background Sync Enhancement
**As a** Worker,
**I want** my offline changes to sync automatically when I get connection,
**So that** I don't have to manually submit everything.

**Acceptance Criteria (EARS):**
- WHEN connection restores THE SYSTEM SHALL automatically begin syncing queued changes
- WHILE syncing THE SYSTEM SHALL display progress indicator showing "Syncing X items..."
- IF sync item fails THE SYSTEM SHALL retry with exponential backoff (5s, 10s, 20s)
- WHEN all items synced THE SYSTEM SHALL show brief success toast "All changes synced"
- IF critical sync fails THE SYSTEM SHALL notify user with option to view failed items

**Priority:** High

---

### Epic 4: Native Interactions

#### US-4.1: Pull-to-Refresh Enhancement
**As a** PM,
**I want** to refresh data with a pull gesture like native apps,
**So that** I can quickly check for updates.

**Acceptance Criteria (EARS):**
- WHEN user pulls down from top of scrollable list THE SYSTEM SHALL show pull-to-refresh indicator
- WHEN user releases at threshold THE SYSTEM SHALL trigger haptic feedback and refresh data
- WHEN refresh completes THE SYSTEM SHALL animate indicator away and show updated data
- IF refresh fails THE SYSTEM SHALL show brief error toast and restore previous data
- WHILE refreshing THE SYSTEM SHALL disable additional pull gestures

**Priority:** Medium (Already partially implemented)

#### US-4.2: Haptic Feedback Enhancement
**As a** Worker,
**I want** tactile feedback for important actions,
**So that** I know my taps registered even when wearing gloves.

**Acceptance Criteria (EARS):**
- WHEN user taps primary action buttons THE SYSTEM SHALL trigger light haptic feedback (10ms)
- WHEN user completes task status change THE SYSTEM SHALL trigger medium haptic feedback (25ms)
- WHEN user encounters error THE SYSTEM SHALL trigger error haptic pattern (50ms)
- WHEN pull-to-refresh reaches threshold THE SYSTEM SHALL trigger medium haptic feedback
- IF haptic API unavailable THE SYSTEM SHALL continue without feedback (graceful degradation)

**Priority:** Medium (Partially implemented, needs expansion)

#### US-4.3: Touch Target Optimization
**As a** Worker wearing gloves,
**I want** large touch targets for all interactive elements,
**So that** I can accurately tap buttons on the job site.

**Acceptance Criteria (EARS):**
- WHEN rendering buttons THE SYSTEM SHALL ensure minimum 48px touch target (increased from 44px)
- WHEN rendering list items THE SYSTEM SHALL ensure minimum 56px row height
- WHEN rendering form inputs THE SYSTEM SHALL ensure minimum 48px height
- WHEN elements are smaller than 48px THE SYSTEM SHALL add invisible padding to meet touch target

**Priority:** High

---

### Epic 5: Performance Optimization

#### US-5.1: Image Optimization
**As a** PM,
**I want** images to load quickly without consuming excess data,
**So that** I can review project photos on cellular connections.

**Acceptance Criteria (EARS):**
- WHEN serving images THE SYSTEM SHALL use WebP format with AVIF fallback for supported browsers
- WHEN displaying images THE SYSTEM SHALL use responsive srcset with sizes for 375px, 768px, 1024px breakpoints
- WHEN images enter viewport THE SYSTEM SHALL lazy-load with blur placeholder
- WHEN loading project photos THE SYSTEM SHALL prioritize thumbnail loading before full-size
- WHEN caching images THE SYSTEM SHALL limit image cache to 50MB with LRU eviction

**Priority:** High

#### US-5.2: Bundle Size Optimization
**As a** Worker on slow connection,
**I want** the app to download minimal code,
**So that** I can start using it quickly.

**Acceptance Criteria (EARS):**
- WHEN building the app THE SYSTEM SHALL code-split by route with maximum 200KB per route chunk
- WHEN loading routes THE SYSTEM SHALL load only required chunks
- WHEN importing icons THE SYSTEM SHALL use tree-shaking to include only used icons
- WHEN loading 3D viewer THE SYSTEM SHALL defer xeokit bundle until user accesses spatial tab

**Priority:** High

#### US-5.3: Core Web Vitals Targets
**As a** user,
**I want** the app to meet Core Web Vitals thresholds,
**So that** I have a smooth, responsive experience.

**Acceptance Criteria (EARS):**
- WHEN measuring LCP THE SYSTEM SHALL achieve < 2.5s on 4G connection
- WHEN measuring INP THE SYSTEM SHALL achieve < 200ms for all interactions
- WHEN measuring CLS THE SYSTEM SHALL achieve < 0.1 cumulative layout shift
- WHEN loading pages THE SYSTEM SHALL avoid layout shifts by reserving space for dynamic content

**Priority:** High

---

### Epic 6: Construction-Specific Offline

#### US-6.1: Daily Report Offline Creation
**As a** Foreman,
**I want** to create daily reports when offline,
**So that** I can document site progress at end of day regardless of connectivity.

**Acceptance Criteria (EARS):**
- WHEN user creates daily report offline THE SYSTEM SHALL store complete report data in IndexedDB
- WHEN user adds photos to offline report THE SYSTEM SHALL queue photos with report reference
- WHEN connection restores THE SYSTEM SHALL upload report and associated photos together
- WHEN offline report submitted THE SYSTEM SHALL show "Pending sync" badge on report card

**Priority:** High

#### US-6.2: Material Usage Logging Offline
**As a** Worker,
**I want** to log material usage when offline,
**So that** I can track consumption in real-time during work.

**Acceptance Criteria (EARS):**
- WHEN user logs material usage offline THE SYSTEM SHALL store entry with timestamp in IndexedDB
- WHEN displaying material list offline THE SYSTEM SHALL show cached inventory with pending adjustments
- WHEN connection restores THE SYSTEM SHALL sync material logs and update inventory totals
- IF material inventory conflicts on sync THE SYSTEM SHALL flag for PM review

**Priority:** Medium

#### US-6.3: Expense Receipt Capture Offline
**As a** Sub,
**I want** to capture expense receipts when offline,
**So that** I can submit expenses from job site immediately.

**Acceptance Criteria (EARS):**
- WHEN user photographs receipt offline THE SYSTEM SHALL store with expense data in IndexedDB
- WHEN creating expense offline THE SYSTEM SHALL auto-save form data every change
- WHEN connection restores THE SYSTEM SHALL upload receipt images and create expense records
- WHEN viewing expenses offline THE SYSTEM SHALL show pending uploads with sync indicator

**Priority:** Medium

---

## Out of Scope

- Push notification implementation (separate feature)
- Voice input/commands
- AR overlay features
- Bluetooth hardware integration
- Multi-language support (separate feature)
- PDF export while offline
- Real-time collaboration (requires connection)
- Biometric authentication (separate feature)

---

## Dependencies

### Existing Features Required
- Service Worker infrastructure (exists: `public/sw.js`)
- IndexedDB layer (exists: `lib/offline/indexeddb.ts`)
- Background sync manager (exists: `lib/offline/sync-manager.ts`)
- PullToRefresh component (exists: `components/mobile/PullToRefresh.tsx`)
- Haptic feedback hook (exists: `lib/hooks/useHapticFeedback.ts`)
- Offline indicator (exists: `components/mobile/OfflineIndicator.tsx`)

### New Dependencies
- View Transitions API polyfill (for Safari fallback)
- Navigation Preload API support in service worker

---

## Non-Functional Requirements

### Performance
- App shell load time: < 100ms from cache
- Time to Interactive: < 3s on 4G connection
- LCP: < 2.5s
- INP: < 200ms
- CLS: < 0.1
- Service Worker activation: < 1s

### Security
- All cached data encrypted at rest (IndexedDB encryption)
- Auth tokens not cached in service worker
- Sensitive data cleared on logout
- Offline data isolated by company_id

### Mobile Experience
- Minimum touch targets: 48px
- Support iOS Safari, Chrome, Samsung Internet
- Works in standalone PWA mode
- Respects reduced-motion preference
- Safe area insets for notch devices

### Storage
- Maximum IndexedDB usage: 500MB warning, 1GB hard limit
- Image cache: 50MB with LRU eviction
- Form draft storage: 30-minute TTL
- Sync queue: Unlimited (with count warning at 100 items)

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)
