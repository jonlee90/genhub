# E4-T7: Create PWA UI Components

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 28 (PWA Installation/Offline), Design Section 5.4

## Description

Create UI components for PWA installation prompts and offline status indicators, integrated into the app layout.

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

- [ ] Install prompt appears on installable browsers
- [ ] Install prompt hides after installation
- [ ] Offline banner displays when connection lost
- [ ] Banner auto-hides when back online
- [ ] Service worker registers on app load
- [ ] Components don't interfere with app functionality

## Files to Create/Modify

- `components/PWA/InstallPrompt.tsx`
- `components/PWA/OfflineBanner.tsx`
- `app/app/layout.tsx`
