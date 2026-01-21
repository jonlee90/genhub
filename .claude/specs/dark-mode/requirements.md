# Dark Mode - Requirements

## Overview
Implement a comprehensive dark mode feature for GenHub PWA that allows contractors working in varying outdoor lighting conditions (dusk, nighttime, overcast) to comfortably use the application. The feature preserves the Navy Blue brand identity while providing high-contrast, accessible alternatives to the current light theme. This improves usability in field conditions and reduces eye strain during extended use.

## Personas
- **Primary**: Field Workers & Foremen - Working in low-light outdoor environments, need legible interface during early mornings and evenings
- **Secondary**: General Contractors & PMs - Using GenHub in office with adjustable lighting, want flexibility for personal preference
- **Tertiary**: All Users - Nighttime use, accessibility needs, personal theme preference

---

## User Stories

### US-1: Worker Views Tasks in Low-Light Field Conditions
**As a** Field Worker,
**I want** to switch GenHub to dark mode so that I can read task details, submit time entries, and access information without eye strain when working before sunrise or after sunset on job sites.

**Acceptance Criteria (EARS):**
- WHEN user taps the theme toggle button in the header THE SYSTEM SHALL switch from light to dark mode within 150ms
- WHEN dark mode is active THE SYSTEM SHALL display all text with at least 4.5:1 contrast ratio on dark backgrounds
- WHEN user switches to dark mode THE SYSTEM SHALL save preference to localStorage with key "theme-preference"
- IF user closes and reopens the app THEN THE SYSTEM SHALL restore their saved theme preference on load
- IF user's device preference is dark mode THEN THE SYSTEM SHALL apply dark theme automatically on first visit (before any preference is saved)
- WHEN theme switches THE SYSTEM SHALL not cause any layout shift or horizontal scroll
- WHEN theme switches THE SYSTEM SHALL complete transition smoothly without "flash of unstyled content" (FOUC)

**Priority:** Critical

### US-2: Contractor Reviews Project Dashboard in Office with Personal Preference
**As a** General Contractor,
**I want** to set my preferred theme (light or dark) and have it applied across all pages so that I can work comfortably in my office lighting conditions.

**Acceptance Criteria (EARS):**
- WHEN user opens GenHub for the first time on a device THE SYSTEM SHALL detect device's `prefers-color-scheme` setting
- WHEN user manually selects a theme THE SYSTEM SHALL immediately apply it across all currently visible UI elements
- WHEN theme toggle is activated THE SYSTEM SHALL persist preference to localStorage and survive browser restart
- WHEN user views the dashboard with dark mode active THE SYSTEM SHALL display all status cards (on-track, delayed, at-risk) with correct semantic colors
- WHEN user navigates to a different page THE SYSTEM SHALL maintain the currently selected theme

**Priority:** Critical

### US-3: Status Colors Remain Semantically Meaningful in Dark Mode
**As a** Project Manager,
**I want** status indicators (on-track green, delayed red, at-risk gray, completed navy) to remain visually distinct and immediately recognizable in dark mode so that I can quickly assess project health without confusion.

**Acceptance Criteria (EARS):**
- WHEN viewing task cards in dark mode THE SYSTEM SHALL display "on-track" status with recognizable green (#10b981)
- WHEN viewing task cards in dark mode THE SYSTEM SHALL display "delayed" status with recognizable red (#ef4444)
- WHEN viewing task cards in dark mode THE SYSTEM SHALL display "at-risk" status with distinct gray (#9ca3af)
- WHEN viewing task cards in dark mode THE SYSTEM SHALL display "completed" status with recognizable navy blue (#3b82f6)
- WHEN comparing light and dark modes THEN THE SYSTEM SHALL maintain the same semantic meaning for all color-coded elements

**Priority:** High

### US-4: Construction Yellow Accent Remains Visible and Non-Fatiguing in Dark Mode
**As a** Any User,
**I want** the construction yellow accent color (#FBBF24) used for CTAs and important UI elements to remain visible but non-fatiguing when viewing dark mode so that I can easily spot action buttons and highlights without eye strain.

**Acceptance Criteria (EARS):**
- WHEN viewing CTA buttons in dark mode THE SYSTEM SHALL display construction yellow (#FBBF24) with minimum 4.5:1 contrast against dark background
- WHEN viewing important alerts or highlights in dark mode THE SYSTEM SHALL use construction yellow without causing visual harshness or flicker
- WHEN comparing button visibility between light and dark modes THEN THE SYSTEM SHALL maintain equal prominence for action buttons

**Priority:** High

### US-5: Theme Switch Performs Smoothly Without Jank or Layout Issues
**As a** Any User,
**I want** switching themes to be instant and smooth without causing layout shifts, re-renders of unrelated elements, or visual jank so that the experience feels responsive and professional.

**Acceptance Criteria (EARS):**
- WHEN user toggles theme THE SYSTEM SHALL complete transition within 150-200ms
- WHEN theme toggles THE SYSTEM SHALL not cause any element repositioning or layout recalculation
- IF 100+ DOM elements exist on page THEN THE SYSTEM SHALL re-render only theme-affected elements
- WHEN theme switches THE SYSTEM SHALL emit zero console warnings or errors
- WHEN viewport is resized during theme transition THEN THE SYSTEM SHALL complete theme application before reflow

**Priority:** High

### US-6: No Flash of Unstyled Content on Page Load
**As a** Any User,
**I want** the app to immediately load with the correct theme applied so that I don't see a flash of the wrong theme before it switches.

**Acceptance Criteria (EARS):**
- WHEN page first loads THE SYSTEM SHALL apply saved theme preference before first paint
- IF no preference exists THEN THE SYSTEM SHALL apply device's `prefers-color-scheme` before first paint
- WHEN measuring First Contentful Paint (FCP) THE SYSTEM SHALL NOT show FOUC (flash of light background when dark mode expected)
- WHEN examining browser Inspector THE SYSTEM SHALL show correct theme color in HTML tag before React hydration

**Priority:** High

### US-7: Dark Mode Works Across All Application Pages and Components
**As a** Any User,
**I want** the dark mode theme to apply consistently to every page, modal, component, and overlay so that I have a unified experience throughout the application.

**Acceptance Criteria (EARS):**
- WHEN viewing any page in dark mode THE SYSTEM SHALL apply dark background and light text
- WHEN opening modals or bottom sheets in dark mode THE SYSTEM SHALL render them with dark theme colors
- WHEN viewing status badges, alerts, or status indicators in dark mode THEN THE SYSTEM SHALL maintain semantic color meanings
- WHEN using form inputs (text, select, checkbox) in dark mode THE SYSTEM SHALL display them with sufficient contrast for interaction
- WHEN viewing status cards and project cards in dark mode THEN THE SYSTEM SHALL display all content legibly

**Priority:** High

---

## Out of Scope
- Theme customization (user-selectable color palettes) - future enhancement
- Per-component theme overrides - use CSS variables only
- Auto-switching based on time of day - future enhancement
- Theme sync across multiple devices/accounts - future enhancement
- Per-page theme preferences - single app-wide preference only

## Dependencies
- Next.js 16+ (has built-in CSS-in-JS support)
- Tailwind CSS 3.4+ (supports darkMode configuration)
- CSS Custom Properties (already in use in globals.css)
- localStorage API (standard, no external deps)
- React 19 (useLayoutEffect support for FOUC prevention)

## Non-Functional Requirements

### Performance
- **Theme Toggle Latency:** < 150ms from button click to complete visual transition
- **FOUC Prevention:** No visible light/dark flash on initial page load
- **Re-render Optimization:** Only theme-affected elements re-render when theme changes (target: <50 affected components)
- **Bundle Size Impact:** < 5KB additional CSS and JS code
- **Memory:** localStorage usage < 100 bytes (just theme preference)

### Accessibility (WCAG 2.1 AA)
- **Contrast Ratio:** All text must maintain minimum 4.5:1 contrast on backgrounds
- **Status Colors:** Semantic meaning doesn't rely on color alone (secondary indicators recommended but not required)
- **Color Blindness:** Status colors chosen for color-blind visibility (red #ef4444, green #10b981 work for red-green blindness)
- **Motion:** Transition respects `prefers-reduced-motion: reduce` setting

### Browser Support
- Chrome/Edge 90+
- Safari 14+ (CSS custom properties)
- Firefox 85+
- iOS Safari 14.5+
- Mobile Chrome (Android 10+)

### Mobile Considerations
- Theme toggle must be touch-friendly (44px minimum tap target)
- Transition must not cause layout thrashing on low-end devices
- Performance on iPhone 6s equivalent (1GB RAM) must be acceptable
- Dark mode must improve readability in outdoor sunlight conditions

---

## Success Metrics
- [ ] All text elements pass WCAG AA contrast ratio requirements in both modes
- [ ] Theme preference persists across sessions for 95%+ of users
- [ ] Theme toggle interaction measures < 200ms latency
- [ ] Zero FOUC incidents reported by users
- [ ] All 7 user stories verified and accepted
- [ ] No additional console errors in both light and dark modes
- [ ] Build size increases by less than 5KB
- [ ] Mobile performance remains >90 Lighthouse score

---

**Status:** PENDING APPROVAL
**Approval Required:** Yes (proceed to design phase)
