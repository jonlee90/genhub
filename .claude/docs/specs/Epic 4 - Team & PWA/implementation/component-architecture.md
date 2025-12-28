# PWA UI Components - Architecture & Visual Reference

## Component Hierarchy

```
app/app/layout.tsx
│
├─ OfflineBanner (z-50, top)
│  └─ Network status monitoring
│
├─ Sidebar (desktop)
│
├─ Main Content Area
│  ├─ Header (mobile)
│  └─ Page Content
│
├─ Toaster (top-right)
│
├─ ServiceWorkerRegistration (z-50, bottom-right)
│  └─ Update notifications
│
└─ InstallPrompt (z-40, bottom)
   └─ PWA installation
```

## Visual Layout

```
┌────────────────────────────────────────────────────┐
│  OfflineBanner (z-50)                              │
│  [!] You're offline. Some features may be limited. │
└────────────────────────────────────────────────────┘

┌──────┬─────────────────────────────────────┐
│      │                                     │
│  S   │        Main Content                 │
│  I   │                                     │
│  D   │                                     │
│  E   │                                     │
│  B   │                                     │
│  A   │                                     │
│  R   │                                     │
│      │                                     │
│      │                                     │
└──────┴─────────────────────────────────────┘

                    ┌──────────────────────┐
                    │ ServiceWorkerReg    │
                    │ (Update Available)  │
                    └──────────────────────┘

┌────────────────────────────────────────────────────┐
│  InstallPrompt (z-40)                              │
│  [Hard Hat Icon] INSTALL GENHUB                    │
│  Access your construction projects offline...      │
│  [Install Now]  [Later]  [Don't Show Again]       │
└────────────────────────────────────────────────────┘
```

## State Diagrams

### InstallPrompt States

```
Start
  │
  ├─ beforeinstallprompt event? ──No──> Hidden
  │                                     (Safari/Firefox)
  ├─ Yes
  │
  ├─ Already installed? ──Yes──> Hidden
  │                              (standalone mode)
  ├─ No
  │
  ├─ Previously dismissed? ──Yes──> Hidden
  │                                 (localStorage)
  ├─ No
  │
  └─ Show Prompt (after 2s delay)
       │
       ├─ User clicks "Install Now"
       │  └─> Trigger native prompt
       │      └─> User accepts ──> Installed (Hidden)
       │      └─> User dismisses ──> Hidden (session)
       │
       ├─ User clicks "Later"
       │  └─> Hidden (session only)
       │
       └─ User clicks "Don't Show Again"
          └─> Hidden (localStorage = permanent)
```

### OfflineBanner States

```
Start (Online)
  │
  └─> Hidden
       │
       ├─ offline event ──────────────────┐
       │                                  │
       │                                  ▼
       │                          Offline State
       │                          (Amber banner)
       │                                  │
       │                          Duration > 30s?
       │                                  │
       │                                  ├─ Yes ──> Critical State
       │                                  │          (Red banner)
       │                                  │              │
       ├─ online event ◄──────────────────┴──────────────┘
       │
       └─> Reconnecting State
           (Green banner, spinner)
                   │
                   └─ Auto-hide after 3s ──> Hidden
```

## Component Interactions

### Z-Index Layering

```
Layer 50 (Highest)
├─ OfflineBanner (top, full-width)
└─ ServiceWorkerRegistration (bottom-right, toast)

Layer 40
└─ InstallPrompt (bottom, full-width on mobile)

Layer 30
└─ Toaster (top-right)

Layer 0-10 (Content)
├─ Sidebar
├─ Header
└─ Main Content
```

### Event Flow

```
Browser Events
    │
    ├─ beforeinstallprompt ──> InstallPrompt
    │                          │
    │                          └─> Store event reference
    │                               └─> Show prompt (delayed 2s)
    │                                    └─> User action
    │
    ├─ appinstalled ──────────> InstallPrompt
    │                          │
    │                          └─> Hide prompt
    │                               └─> Clear state
    │
    ├─ offline ───────────────> OfflineBanner
    │                          │
    │                          └─> Show amber banner
    │                               └─> Start duration timer
    │                                    └─> Critical after 30s (red)
    │
    └─ online ────────────────> OfflineBanner
                               │
                               └─> Show reconnecting (green)
                                    └─> Auto-hide after 3s
```

## Design Specifications

### InstallPrompt

**Desktop (>= 640px)**
```
Position: fixed bottom-6 right-6
Width: max-w-md (28rem)
Height: auto
Border-left: 8px solid #001B51
Shadow: shadow-construction-xl
Border-radius: rounded-lg
```

**Mobile (< 640px)**
```
Position: fixed bottom-0 left-0 right-0
Width: 100%
Height: auto
Border-left: 8px solid #001B51
Shadow: shadow-construction-xl
Border-radius: none (sharp corners)
```

**Animation**
```
Enter: slide-up + fade-in
  initial: { y: 100, opacity: 0 }
  animate: { y: 0, opacity: 1 }
  transition: spring (stiffness: 260, damping: 25)

Exit: slide-down + fade-out
  exit: { y: 100, opacity: 0 }
```

### OfflineBanner

**All Breakpoints**
```
Position: fixed top-0 left-0 right-0
Width: 100%
Height: auto (min 3rem)
Shadow: shadow-construction-lg
Border-radius: none
Z-index: 50
```

**Color States**
```
Offline:      bg-amber-500 (#F59E0B)
Critical:     bg-red-600 (#DC2626)
Reconnecting: bg-construction-green (#059669)
```

**Animation**
```
Enter: slide-down + fade-in
  initial: { y: -100, opacity: 0 }
  animate: { y: 0, opacity: 1 }
  transition: spring (stiffness: 300, damping: 30)

Exit: slide-up + fade-out
  exit: { y: -100, opacity: 0 }

Stripe Pattern:
  background: repeating-linear-gradient(45deg)
  animate: background-position (2s linear infinite)
```

## Typography Specifications

### InstallPrompt

```css
/* Title */
font-size: 1.25rem (20px)
font-weight: 900 (black)
text-transform: uppercase
letter-spacing: -0.025em (tight)
line-height: 1.2
color: #001B51

/* Description */
font-size: 0.875rem (14px)
font-weight: 500 (medium)
line-height: 1.625
color: #4B5563 (gray-600)

/* Primary Button */
font-size: 0.875rem (14px)
font-weight: 700 (bold)
text-transform: uppercase
letter-spacing: 0.05em (wide)
color: #FFFFFF

/* Secondary Buttons */
font-size: 0.75rem (12px)
font-weight: 600 (semibold)
text-transform: uppercase
letter-spacing: 0.05em (wide)
color: #374151 (gray-700)
```

### OfflineBanner

```css
/* Status Label (Offline/Critical) */
font-size: 0.875rem (14px)
font-weight: 700 (bold)
text-transform: uppercase
letter-spacing: 0.05em (wide)
color: #FFFFFF

/* Message */
font-size: 0.875rem (14px)
font-weight: 500 (medium)
color: #FFFFFF

/* Duration Counter */
font-size: 0.75rem (12px)
font-weight: 500 (medium)
opacity: 0.8
color: #FFFFFF
```

## Icon Specifications

### InstallPrompt
```
Hard Hat Icon (HardHat from lucide-react)
Size: w-7 h-7 (1.75rem)
Stroke Width: 2.5
Color: white
Background: Navy blue circle (w-14 h-14)
Animation: Pulsing outer ring (scale 1 → 1.3)

Download Icon (primary button)
Size: w-4 h-4 (1rem)
Stroke Width: 2
Color: white

X Icon (close button)
Size: w-4 h-4 (1rem)
Stroke Width: 2
Color: gray-500
```

### OfflineBanner
```
WifiOff Icon (offline/critical states)
Size: w-5 h-5 (1.25rem)
Stroke Width: 2.5
Color: white
Animation: Pulse scale on critical

Wifi Icon (reconnecting state)
Size: w-5 h-5 (1.25rem)
Stroke Width: 2.5
Color: white

Loader2 Icon (reconnecting spinner)
Size: w-5 h-5 (1.25rem)
Stroke Width: 2.5
Color: white
Animation: Rotate 360deg (1s linear infinite)
```

## Responsive Breakpoints

```css
/* Mobile First */
Default: Full-width banners, touch-optimized buttons

/* Small (sm: 640px+) */
InstallPrompt: Fixed bottom-right, max-w-md
OfflineBanner: Same (full-width)

/* Medium (md: 768px+) */
No significant changes

/* Large (lg: 1024px+) */
No significant changes

/* Extra Large (xl: 1280px+) */
No significant changes
```

## Performance Considerations

### InstallPrompt
- Lazy render: Only renders when `showPrompt === true`
- Event cleanup: Removes listeners on unmount
- LocalStorage read: Once on mount
- Animation: Framer Motion with hardware acceleration
- Asset loading: Icons loaded from bundle (no external requests)

### OfflineBanner
- Conditional render: Hidden when `showBanner === false`
- Event cleanup: Removes online/offline listeners on unmount
- Timer cleanup: Clears interval on unmount or state change
- Animation: CSS-based stripe animation (GPU accelerated)
- Minimal re-renders: State updates only on network changes

## Accessibility

### InstallPrompt
```html
<!-- ARIA Labels -->
<button aria-label="Dismiss install prompt">
  <X />
</button>

<!-- Semantic Structure -->
<h3>Install GenHub</h3>
<p>Access your construction projects offline...</p>

<!-- Keyboard Navigation -->
Tab order: Close → Install Now → Later → Don't Show Again
```

### OfflineBanner
```html
<!-- Role -->
<div role="alert" aria-live="assertive">
  Network status changes
</div>

<!-- Semantic Structure -->
<span>Offline</span>
<span>You're offline. Some features may be limited.</span>

<!-- Screen Reader -->
Announces immediately when appearing (aria-live="assertive")
```

## Testing Scenarios

### InstallPrompt
1. **First Visit (Chrome)**
   - Event fires → 2s delay → Prompt shows
   - Click "Install Now" → Native prompt → Accept
   - App installs → Prompt hides permanently

2. **Dismissed Session**
   - Event fires → 2s delay → Prompt shows
   - Click "Later" → Prompt hides
   - Refresh page → Prompt shows again (new session)

3. **Don't Show Again**
   - Event fires → 2s delay → Prompt shows
   - Click "Don't Show Again" → Prompt hides
   - localStorage set → Refresh → Prompt never shows

4. **Already Installed**
   - Standalone mode detected → Prompt never shows
   - Refresh → Still hidden

5. **Safari/Firefox**
   - No beforeinstallprompt event → Prompt never shows
   - Graceful degradation (no errors)

### OfflineBanner
1. **Go Offline**
   - Toggle DevTools network → Offline
   - Banner appears instantly (amber)
   - Message: "You're offline. Some features may be limited."

2. **Extended Offline (Critical)**
   - Stay offline 30+ seconds
   - Banner turns red
   - Duration counter shows: "1m 45s"
   - Message: "Extended offline period. Data sync paused."

3. **Reconnect**
   - Toggle network back online
   - Banner turns green
   - Spinner appears
   - Message: "Connection restored. Syncing data..."
   - Auto-hide after 3 seconds

4. **Rapid Toggle**
   - Toggle offline/online rapidly
   - Banner responds immediately
   - No lag or state conflicts
   - Timers reset properly

## Browser Compatibility Matrix

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| InstallPrompt (beforeinstallprompt) | ✅ Full | ✅ Full | ❌ Hidden | ❌ Hidden |
| OfflineBanner (navigator.onLine) | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Framer Motion Animations | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| LocalStorage | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Service Worker Integration | ✅ Full | ✅ Full | ✅ Limited | ✅ Full |

---

**Last Updated**: 2025-12-07
**Session**: 8
**Task**: E4-T7
