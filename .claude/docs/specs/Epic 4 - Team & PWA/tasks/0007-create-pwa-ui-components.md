# E4-T7: Create PWA UI Components

## Overview
Create UI components for PWA install prompt and offline status indicator.

## Subtasks

### 7.1 Create InstallPrompt component
- Create `components/PWA/InstallPrompt.tsx`
- Detect if app is installable (beforeinstallprompt event)
- Show install banner/button
- Handle install flow
- Hide after installation
- **Refs:** Req 28.1 (Install Prompt), Design Section 5.4
- **Effort:** M
- **Files:** `components/PWA/InstallPrompt.tsx`

### 7.2 Create OfflineBanner component
- Create `components/PWA/OfflineBanner.tsx`
- Detect online/offline status
- Show yellow/red banner when offline
- Auto-hide when back online
- **Refs:** Req 28.9 (Offline Indicator), Design Section 5.4
- **Effort:** S
- **Files:** `components/PWA/OfflineBanner.tsx`

### 7.3 Integrate PWA components into app layout
- Add InstallPrompt to app layout
- Add OfflineBanner to app layout
- Register service worker on mount
- **Refs:** Req 28 (PWA Integration), Design Section 5.4
- **Effort:** S
- **Files:** `app/app/layout.tsx`

## Acceptance Criteria
- [x] Install prompt appears on supported devices
- [x] Install prompt can be dismissed
- [x] Install flow completes successfully
- [x] Prompt hides after installation
- [x] Offline banner appears when connection is lost
- [x] Offline banner has appropriate styling
- [x] Banner disappears when connection is restored
- [x] Components are integrated into app layout
- [x] Service worker registers on app load (via ServiceWorkerRegistration component)

## Implementation Status
**Status**: ✅ COMPLETED
**Date**: 2025-12-07
**Session**: Session 8

### Code Review Results
**Score**: 9.0/10 - Excellent implementation
**Approval**: ✅ APPROVED FOR PRODUCTION
**Review Date**: 2025-12-07

**Strengths**:
- Excellent TypeScript typing with custom interfaces
- Proper React hooks usage and cleanup
- Graceful browser degradation (Chrome/Edge vs Safari/Firefox)
- Perfect construction-themed branding
- No security vulnerabilities
- Proper PWA event handling
- Clean component integration

**Recommendations** (Optional - 45 min total):
- Add ARIA roles for screen readers (role="alert", role="dialog")
- Add prefers-reduced-motion support for animations
- Consider unit tests for PWA event flows

**Production Readiness**: APPROVED (minor accessibility enhancements recommended but not blocking)

## Implementation Details

**Completed**: 2025-12-07 (Session 8)

### Files Created
1. `components/pwa/InstallPrompt.tsx` (330 lines)
   - beforeinstallprompt event detection (Chrome/Edge)
   - LocalStorage persistence for "Don't show again"
   - Graceful browser degradation
   - Construction-themed industrial design
   - Three-tier user controls (Install Now / Later / Don't Show Again)

2. `components/pwa/OfflineBanner.tsx` (220 lines)
   - Real-time online/offline detection
   - Progressive warning states (offline → critical after 30s)
   - Auto-hide after reconnection (3s delay)
   - Construction warning tape animation
   - Offline duration counter

### Files Modified
1. `app/app/layout.tsx`
   - Added OfflineBanner (top, z-50)
   - Added InstallPrompt (bottom, z-40)
   - Proper z-index layering with existing components

### Design System
- **Aesthetic**: "Industrial Precision" - construction industry theme
- **Colors**: Navy Blue (#001B51), Amber (#F59E0B), Red (#DC2626)
- **Typography**: Bold uppercase headings, industrial signage style
- **Motion**: Spring animations, pulsing indicators, construction tape stripes
- **Icons**: Hard hat (install), WifiOff/Wifi (network status)

### Documentation
- Implementation summary: `.claude/docs/specs/Epic 4 - Team & PWA/implementation/PWA-UI-Components-Summary.md`
- Session context: `.claude/tasks/context_session_8.md`

## Dependencies
- E4-T6: Service worker implementation
- E1-T8: App layout structure

## Related Requirements
- Req 28.1: Install Prompt
- Req 28.9: Offline Indicator
