# Session 8 Context - PWA UI Components

## Session Overview
Implementing E4-T7: Create PWA UI Components for GenHub PWA

## Current Task
**Epic 4, Task 0007**: Create UI components for PWA install prompt and offline status indicator

## Task Details
**File**: `.claude/docs/specs/Epic 4 - Team & PWA/tasks/0007-create-pwa-ui-components.md`

### Subtasks
1. **7.1**: Create InstallPrompt component (components/pwa/InstallPrompt.tsx)
2. **7.2**: Create OfflineBanner component (components/pwa/OfflineBanner.tsx)
3. **7.3**: Integrate PWA components into app layout

### Design System Requirements
- **Primary Color**: #001B51 (Navy Blue)
- **Accent Color**: #3C3C3C (Dark Gray)
- **Background**: #FFFFFF (White)
- **Industry**: Construction (professional, trustworthy)

## Implementation Plan

### Step 1: Create InstallPrompt Component
**File**: `components/pwa/InstallPrompt.tsx`

**Features**:
- Detect beforeinstallprompt event
- Show construction-themed install banner/button
- Handle install flow (prompt(), wait for user choice)
- Track installation state
- Hide after successful installation
- Dismissible by user
- Only show on supported devices/browsers

**UI Design**:
- Bottom banner with construction theme
- Navy blue (#001B51) accent
- Hard hat or building icon
- Clear CTA: "Install GenHub"
- Dismiss button (X)
- Smooth slide-up animation

### Step 2: Create OfflineBanner Component
**File**: `components/pwa/OfflineBanner.tsx`

**Features**:
- Detect online/offline status
- Show banner when offline
- Auto-hide when connection restored
- Network status indicator (WiFi icon)
- Construction-themed styling

**UI Design**:
- Top banner (fixed position)
- Yellow/orange background for warning (#F59E0B)
- Red for critical offline (#DC2626)
- WiFi-off icon
- Message: "You're offline. Some features may be limited."
- Auto-dismiss on reconnection

### Step 3: Integration
**File**: `app/app/layout.tsx` or root layout

**Integration Points**:
- Add InstallPrompt near bottom of layout
- Add OfflineBanner at top of layout
- Ensure components are client-side only
- Don't interfere with existing ServiceWorkerRegistration component

## Files to Create/Modify

1. **components/pwa/InstallPrompt.tsx** (NEW)
2. **components/pwa/OfflineBanner.tsx** (NEW)
3. **app/app/layout.tsx** (MODIFY - if app-specific layout exists) OR
4. **app/layout.tsx** (MODIFY - root layout if no app layout)

## Dependencies
- ✅ E4-T6: Service worker implementation (completed in session 7)
- ✅ ServiceWorkerRegistration component (exists)
- ✅ App layout structure (exists)

## Status
- [x] Create context session file
- [x] Create InstallPrompt component
- [x] Create OfflineBanner component
- [x] Integrate into app layout
- [x] Review implementation
- [x] Update task file

## TASK COMPLETE ✅

**Completion Date**: 2025-12-07
**Session**: 8
**Epic**: Epic 4 - Team & PWA
**Task**: E4-T7 - Create PWA UI Components

All acceptance criteria met. Components are production-ready with construction-themed design.

## Implementation Summary

### Completed Components

#### 1. InstallPrompt Component
**File**: `components/pwa/InstallPrompt.tsx`

**Features Implemented**:
- beforeinstallprompt event detection (Chrome/Edge)
- LocalStorage persistence for "don't show again"
- Graceful degradation for unsupported browsers
- Installation state tracking (standalone mode detection)
- Three-tier user control: Install Now, Later, Don't Show Again
- Construction-themed industrial design

**UI Design Details**:
- Position: Bottom fixed, mobile full-width, desktop max-w-md
- Colors: Navy blue (#001B51) left border, white background
- Icon: Hard hat with pulsing indicator animation
- CTA: "Install Now" with shimmer effect on hover
- Accent: Diagonal construction tape stripes (subtle opacity)
- Animation: Spring slide-up from bottom (stiffness: 260)
- Z-index: 40 (below offline banner, above content)

**Technical Implementation**:
- TypeScript interface for BeforeInstallPromptEvent
- Event listener cleanup in useEffect
- Console logging for debugging
- 2-second delay before showing (better UX)
- Browser compatibility note displayed

#### 2. OfflineBanner Component
**File**: `components/pwa/OfflineBanner.tsx`

**Features Implemented**:
- Real-time online/offline detection via navigator.onLine
- Event listeners for online/offline events
- Progressive warning states: offline → critical (after 30s)
- Reconnecting state with auto-hide (3s delay)
- Offline duration tracker with display
- Construction warning tape animation

**UI Design Details**:
- Position: Top fixed, full-width
- Colors:
  - Offline: Amber (#F59E0B) - construction warning
  - Critical: Red (#DC2626) - extended offline
  - Reconnecting: Green (#059669) - success state
- Icon: WifiOff (offline), Wifi (reconnecting), Loader2 (spinning)
- Pattern: Animated diagonal stripes (construction tape aesthetic)
- Animation: Spring slide-down from top (stiffness: 300)
- Z-index: 50 (highest priority)

**Technical Implementation**:
- TypeScript NetworkStatus type union
- Offline duration tracking with setInterval
- Critical state after 30 seconds offline
- Console logging for debugging
- Auto-hide with cascading setTimeout

#### 3. App Layout Integration
**File**: `app/app/layout.tsx`

**Integration Points**:
- OfflineBanner: Top of layout (before sidebar)
- ServiceWorkerRegistration: After Toaster (existing component)
- InstallPrompt: Bottom of layout (after ServiceWorkerRegistration)

**Z-Index Layering**:
- OfflineBanner: z-50 (top, high priority)
- ServiceWorkerRegistration: z-50 (bottom-right toast)
- InstallPrompt: z-40 (bottom banner)
- Toaster: Default position (top-right)

### Design System Applied

**Construction Industry Aesthetic - "Industrial Precision"**:
- Bold, uppercase typography for headings (industrial signage)
- Navy blue (#001B51) dominance with strategic accents
- Construction warning colors: amber (offline), red (critical)
- Diagonal stripe patterns (construction tape reference)
- Hard-edge shadows, geometric precision
- Purposeful animations (slide, not bounce)

**Typography**:
- Headings: font-black, uppercase, tracking-tight
- Body: font-medium/semibold, proper line-height
- Buttons: font-bold, uppercase, tracking-wide

**Motion Design**:
- Spring animations for enters/exits (confident, not playful)
- Pulsing indicators for status (2s duration)
- Shimmer effect on primary CTA
- Animated construction tape stripes
- Rotating loader for reconnecting state

**Color Usage**:
- Primary: #001B51 (Navy Blue) - trust, professionalism
- Accent: #3C3C3C (Dark Gray) - industrial strength
- Warning: #F59E0B (Amber) - construction site safety
- Error: #DC2626 (Red) - critical alerts
- Success: #059669 (Green) - positive feedback

### Browser Compatibility

**InstallPrompt**:
- Chrome/Edge: Full support (beforeinstallprompt)
- Safari/Firefox: Hidden (no event, graceful degradation)
- Detection: Checks for standalone mode, installed PWA state

**OfflineBanner**:
- All modern browsers: navigator.onLine support
- Universal: online/offline events

### Testing Recommendations

1. **InstallPrompt**:
   - Test on Chrome/Edge (desktop & mobile)
   - Verify localStorage persistence
   - Check "don't show again" functionality
   - Test install flow: prompt → accept/dismiss
   - Verify hiding after installation

2. **OfflineBanner**:
   - Toggle network in DevTools
   - Verify immediate offline detection
   - Check critical state after 30s offline
   - Test reconnecting flow with auto-hide
   - Verify duration counter display

3. **Integration**:
   - Check z-index layering (no overlaps)
   - Verify all components render correctly
   - Test mobile responsiveness
   - Check animation performance

## Technical Considerations

### beforeinstallprompt Event
- Only fires on Chrome/Edge (not Safari/Firefox)
- Must save event reference to call prompt() later
- Can only be triggered once per session
- Should handle gracefully on unsupported browsers

### Online/Offline Detection
- Use navigator.onLine for initial state
- Listen to online/offline events
- Consider ServiceWorker isOnline() utility (already exists)
- Handle edge cases (slow connection reporting as online)

### Component Positioning
- InstallPrompt: bottom (don't conflict with update toast)
- OfflineBanner: top (high priority visibility)
- Z-index management for layering
- Mobile responsiveness

## Notes
- Install prompts critical for desktop PWA adoption
- Offline banner crucial for construction field workers
- Components should be non-intrusive but visible
- Must work seamlessly with existing ServiceWorkerRegistration
