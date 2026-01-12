# Spatial Viewer Redesign - Requirements

## Overview

Redesign the 3D Spatial Viewer section and all related components in `components/projects/spatial/` to follow mobile-first PWA design principles. The current implementation is desktop-centric with poor mobile UX, fixed heights that ignore safe areas, small touch targets, and missing native mobile patterns like bottom sheets and FABs.

## Problem Statement

The current Spatial Viewer implementation suffers from critical mobile UX issues:

1. **Fixed Heights**: The viewer uses `h-[600px] md:h-[800px]` which ignores device safe areas and doesn't utilize full screen real estate on mobile devices
2. **Small Touch Targets**: Toolbar buttons and filter controls are under 44px, making them difficult to tap on mobile
3. **Missing Touch Feedback**: No `active:scale-[0.98]` or press state feedback on interactive elements
4. **Desktop-Only Patterns**: Absolute-positioned sidebars and toolbars overlap on smaller screens
5. **No Bottom Sheet**: Filter panels and marker lists use expandable cards instead of native bottom sheet patterns
6. **Poor Safe Area Handling**: No `env(safe-area-inset-*)` usage for notched devices
7. **No Mobile Optimization**: Viewer renders at 60 FPS on mobile (should throttle to 30 FPS)

## Personas

- **Primary**: **PM** (Project Manager) - Views and interacts with 3D models to track spatial issues, assign tasks to locations, and review progress markers
- **Primary**: **Foreman** - Uses mobile device on-site to view model, add issues/safety markers, and coordinate with field workers
- **Secondary**: **GC** (General Contractor) - Reviews project spatial data, approves changes, monitors overall spatial coordination
- **Secondary**: **Worker** (Field Worker) - Views assigned task locations in 3D, reports issues from the field

---

## User Stories

### US-1: Mobile-Optimized 3D Viewer Display

**As a** Foreman using my phone on the job site,
**I want** the 3D viewer to fill my entire screen properly,
**So that** I can see the maximum amount of the model while navigating the construction site.

**Acceptance Criteria (EARS):**
- WHEN the spatial viewer loads on a mobile device (< 768px) THE SYSTEM SHALL display the viewer using `100dvh` minus safe area insets
- WHEN the device has a notch or home indicator THE SYSTEM SHALL respect `env(safe-area-inset-bottom)` for all bottom-positioned elements
- WHEN the viewer is active THE SYSTEM SHALL hide any obstructing header/navigation elements to maximize viewing area
- IF the device orientation changes THEN THE SYSTEM SHALL resize the viewer within 300ms without requiring a refresh

**Priority:** Critical

---

### US-2: Touch-Friendly Toolbar Controls

**As a** PM interacting with the 3D model on my tablet,
**I want** all toolbar buttons to be easy to tap,
**So that** I can switch between pan, rotate, zoom, and measure modes without frustration.

**Acceptance Criteria (EARS):**
- WHEN displaying toolbar buttons THE SYSTEM SHALL render each button with a minimum touch target of 44px x 44px
- WHEN a user taps a toolbar button THE SYSTEM SHALL show `active:scale-[0.98]` feedback within 50ms
- WHEN on mobile (< 768px) THE SYSTEM SHALL display the toolbar as a compact bottom bar instead of a side panel
- WHEN on tablet (768px - 1024px) THE SYSTEM SHALL display the toolbar as a side panel with larger icons
- IF a toolbar action is in progress THEN THE SYSTEM SHALL show a loading indicator on the active button

**Priority:** Critical

---

### US-3: Bottom Sheet Filter Panel

**As a** Foreman filtering markers on my phone,
**I want** the filter options to appear in a native bottom sheet,
**So that** I can easily filter while still seeing the 3D model.

**Acceptance Criteria (EARS):**
- WHEN on mobile (< 768px) THE SYSTEM SHALL display MarkerFilterPanel as a draggable bottom sheet
- WHEN the bottom sheet is open THE SYSTEM SHALL support snap points at 30%, 60%, and 90% of screen height
- WHEN the user drags the sheet down below the 30% threshold THE SYSTEM SHALL close the sheet with spring animation
- WHEN the user drags the sheet up THE SYSTEM SHALL expand to the next snap point
- WHILE the bottom sheet is open THE SYSTEM SHALL dim the 3D viewer background with 50% opacity overlay
- WHEN on tablet/desktop (>= 768px) THE SYSTEM SHALL display filters as a collapsible side panel

**Priority:** High

---

### US-4: Floating Action Button for Marker Creation

**As a** Foreman discovering an issue on-site,
**I want** a prominent button to add markers,
**So that** I can quickly document issues without hunting through menus.

**Acceptance Criteria (EARS):**
- WHEN on mobile (< 768px) THE SYSTEM SHALL display a FAB (Floating Action Button) in the bottom-right corner
- WHEN the FAB is tapped THE SYSTEM SHALL expand to show marker type options (Issue, Note, Safety, Progress)
- WHEN a marker type is selected THE SYSTEM SHALL enter placement mode with visual crosshairs on the 3D model
- WHEN the user taps on the model in placement mode THE SYSTEM SHALL create the marker at that 3D position
- WHEN the FAB is expanded THE SYSTEM SHALL animate options with staggered reveal (50ms delay per option)
- IF the user taps outside the expanded FAB THEN THE SYSTEM SHALL collapse the options

**Priority:** High

---

### US-5: Marker List Bottom Sheet

**As a** PM reviewing all markers in a project,
**I want** to see a scrollable list of markers in a bottom sheet,
**So that** I can quickly navigate to specific markers in the 3D model.

**Acceptance Criteria (EARS):**
- WHEN on mobile (< 768px) THE SYSTEM SHALL display MarkerAnnotationPanel as a bottom sheet (separate from filters)
- WHEN a marker in the list is tapped THE SYSTEM SHALL animate the camera to that marker's 3D position
- WHEN the marker list loads THE SYSTEM SHALL display markers grouped by type (Issues, Notes, Safety, Progress)
- WHEN the user searches THE SYSTEM SHALL filter the list in real-time (debounced 300ms)
- WHEN a marker has a linked task THE SYSTEM SHALL show a task badge with status color
- WHEN the list exceeds visible area THE SYSTEM SHALL enable smooth scrolling with momentum

**Priority:** High

---

### US-6: Model Statistics Mobile Display

**As a** GC reviewing a project on my phone,
**I want** to see model statistics in a compact format,
**So that** I can understand the model complexity without scrolling.

**Acceptance Criteria (EARS):**
- WHEN on mobile (< 768px) THE SYSTEM SHALL display ModelStatsDisplay as a compact horizontal card
- WHEN the card is tapped THE SYSTEM SHALL expand to show full statistics in a bottom sheet
- WHEN displaying statistics THE SYSTEM SHALL format large numbers (e.g., 1.2M triangles, 45K vertices)
- WHEN the model is loading THE SYSTEM SHALL show a skeleton state for each stat
- IF the model processing fails THEN THE SYSTEM SHALL show an error state with retry option

**Priority:** Medium

---

### US-7: Empty State Upload CTA

**As a** PM setting up a new project on my phone,
**I want** a clear upload prompt,
**So that** I can add the project's 3D model easily.

**Acceptance Criteria (EARS):**
- WHEN no model exists and on mobile THE SYSTEM SHALL display a simplified empty state with prominent upload button
- WHEN the upload button is tapped THE SYSTEM SHALL open the native file picker for .ifc files
- WHEN a file is selected THE SYSTEM SHALL show upload progress with percentage
- WHEN upload is in progress THE SYSTEM SHALL disable the upload button and show spinner
- IF upload fails THEN THE SYSTEM SHALL show error message with retry option

**Priority:** Medium

---

### US-8: Loading States with Progress

**As a** Foreman with poor cell signal on-site,
**I want** to see clear loading progress,
**So that** I know the model is loading and not stuck.

**Acceptance Criteria (EARS):**
- WHEN the model is downloading THE SYSTEM SHALL show a progress bar with percentage
- WHEN the model is parsing THE SYSTEM SHALL show "Processing model..." with indeterminate progress
- WHEN the model is rendering THE SYSTEM SHALL show "Preparing view..." with indeterminate progress
- WHEN on mobile THE SYSTEM SHALL display loading state as a compact overlay (not full-screen modal)
- IF loading takes > 10 seconds THEN THE SYSTEM SHALL show estimated time remaining
- IF loading can be cancelled THEN THE SYSTEM SHALL show a cancel button

**Priority:** Medium

---

### US-9: Responsive Breakpoint Behavior

**As a** user switching between devices,
**I want** the viewer to adapt to my screen size,
**So that** I get the optimal experience on any device.

**Acceptance Criteria (EARS):**
- WHEN screen width is < 768px (mobile) THE SYSTEM SHALL use bottom sheet patterns and compact toolbar
- WHEN screen width is 768px - 1024px (tablet) THE SYSTEM SHALL use side panels with larger touch targets
- WHEN screen width is > 1024px (desktop) THE SYSTEM SHALL use the current layout with refined positioning
- WHEN the window is resized THE SYSTEM SHALL adjust layout within 150ms (debounced)
- WHEN transitioning between breakpoints THE SYSTEM SHALL maintain viewer state (camera position, active markers)

**Priority:** Medium

---

### US-10: WebGL Fallback on Unsupported Devices

**As a** Worker with an older phone,
**I want** to see a helpful message if my device doesn't support 3D,
**So that** I understand why the viewer isn't working.

**Acceptance Criteria (EARS):**
- WHEN WebGL is not supported THE SYSTEM SHALL display a mobile-friendly fallback message
- WHEN showing the fallback THE SYSTEM SHALL suggest using a modern browser
- WHEN showing the fallback THE SYSTEM SHALL still allow access to marker list (non-3D view)
- IF the device is iOS Safari THE SYSTEM SHALL check for WebGL2 support specifically

**Priority:** Low

---

## Out of Scope

- 3D rendering engine changes (xeokit-sdk internals remain unchanged)
- Database schema modifications
- Server Actions modifications
- ClientSpatialViewer.tsx (client portal component - separate codebase)
- Marker CRUD logic (only UI presentation changes)
- Camera animation algorithms (only UI controls change)
- Model upload backend logic

## Dependencies

- Existing SpatialViewer component and xeokit-sdk integration
- Existing Server Actions: `getMarkersByProject`, `updateMarker`, `createMarker`
- Existing marker types and database schema
- Mobile PWA design skill (`.claude/skills/frontend/mobile-pwa-design/SKILL.md`)
- GenHub design system (`.claude/docs/frontend/DESIGN_SYSTEM.md`)

## Non-Functional Requirements

### Performance
- 3D viewer MUST render at 30 FPS on mobile devices (throttled from 60 FPS)
- Touch interactions MUST respond within 100ms
- Layout transitions MUST complete within 150ms
- Marker list MUST virtualize when > 50 items

### Security
- All marker operations use existing RLS-protected Server Actions
- No new data exposure on mobile views

### Mobile / PWA
- All components MUST work in iOS Safari PWA mode
- All components MUST work in Chrome Android PWA mode
- Offline skeleton states for marker data
- Touch targets MUST be minimum 44px
- `dvh` units for full-screen layouts
- Safe area insets for notched devices

### Accessibility
- All interactive elements MUST have aria labels
- Focus states MUST be visible
- Screen reader support for marker counts

---

## Constraints

- MUST preserve Phase 3 marker functionality (create, link, filter, click-to-detail)
- MUST NOT modify xeokit-sdk usage patterns
- MUST NOT break ClientSpatialViewer.tsx (used in client portal)
- MUST use existing GenHub color tokens (#001B51, #059669, #DC2626, etc.)
- MUST use Lucide icons only
- MUST use BaseModal for any modal dialogs (never Dialog)

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)
