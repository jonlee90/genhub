# Premium Mobile Slide Menu - UI Implementation Plan

> **Status**: Ready for frontend-engineer implementation
> **Created**: 2026-01-19
> **Author**: frontend-architect agent

---

## Overview

Create a premium, native-feeling mobile slide menu for GenHub PWA that replaces the current `MoreMenu.tsx`. The new design should feel like a first-party iOS/Android app with buttery-smooth animations, intuitive gestures, and a construction-themed aesthetic that elevates the user experience.

### Key Design Goals

| Goal | Description |
|------|-------------|
| **Native Feel** | iOS Settings app / Linear app quality |
| **Field-Ready** | High contrast, 44px+ touch targets, glove-friendly |
| **Premium Polish** | Spring physics, micro-interactions, attention to detail |
| **Construction Identity** | Navy #001B51 brand, industrial confidence |

---

## Design Rationale

### Why Full-Screen Right-to-Left Slide?

After researching native patterns from iOS, Android, Linear, Notion, Slack, Discord, Airbnb, and Uber:

1. **Right-to-left slide** is the most natural gesture for "more options" accessed from the right side of a bottom nav
2. **Full-screen coverage** provides clear modal context and allows for rich content
3. **Swipe-to-close** gesture (left-to-right) matches the mental model of "going back"
4. **iOS Settings app pattern** is universally understood - clean list with icons

### Why NOT Bottom Sheet (Like Current)?

The current `MoreMenu.tsx` uses a bottom sheet pattern which:
- Feels like a temporary overlay rather than a proper navigation destination
- Limited space for content hierarchy
- Less premium than full-screen slide-over for navigation menus

---

## Component Architecture

```
SlideMenu/
  index.tsx                    # Main orchestrating component
  SlideMenuBackdrop.tsx       # Animated backdrop with blur
  SlideMenuPanel.tsx          # Main sliding panel container
  SlideMenuHeader.tsx         # User profile + branding section
  SlideMenuNav.tsx            # Navigation grid items
  SlideMenuFooter.tsx         # Sign out button
  types.ts                    # TypeScript interfaces
  animations.ts               # Framer Motion variants
```

### Component Hierarchy

```
<SlideMenu isOpen={isOpen} onClose={onClose} session={session}>
  <SlideMenuBackdrop />
  <SlideMenuPanel>
    <SlideMenuHeader user={session.user} />
    <SlideMenuNav items={navItems} onClose={onClose} />
    <SlideMenuFooter onSignOut={handleSignOut} />
  </SlideMenuPanel>
</SlideMenu>
```

---

## Animation Specification

### Panel Slide Animation

```typescript
// animations.ts
export const SLIDE_MENU_ANIMATIONS = {
  // Panel slides from right edge
  panel: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: {
      type: 'spring',
      stiffness: 400,    // Snappy but not jarring
      damping: 35,       // Controlled overshoot
      mass: 0.8,         // Slightly lighter for responsiveness
    },
  },

  // Backdrop fade with blur
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Header user card slide-in
  header: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      delay: 0.1,
    },
  },

  // Staggered nav items
  navItem: {
    initial: { opacity: 0, x: 30 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: 0.08 + i * 0.04,  // 40ms stagger
      },
    }),
  },

  // Footer slide up
  footer: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.25, duration: 0.2 },
  },
};
```

### Gesture Configuration

```typescript
// Swipe-to-close gesture
export const GESTURE_CONFIG = {
  // Drag constraints
  dragConstraints: { left: 0, right: 0 },
  dragElastic: { left: 0, right: 0.3 },

  // Dismiss thresholds
  dismissVelocity: 500,     // px/s - fast swipe always dismisses
  dismissDistance: 0.35,    // 35% of panel width

  // Spring back if not dismissed
  springBack: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
};
```

### Timing Summary

| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel enter | ~250ms | spring (400/35) |
| Panel exit | ~200ms | spring (400/35) |
| Backdrop | 200ms | ease-out |
| Nav item stagger | 40ms each | spring (300/24) |
| Touch feedback | 100ms | ease-out |

---

## Visual Specification

### Layout Structure

```
+------------------------------------------+
|  [Safe Area Top Padding]                 |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |  HEADER (User Profile Card)        |  |
|  |  - GenHub logo + status            |  |
|  |  - Avatar + name + email + role    |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  NAV SECTION                       |  |
|  |                                    |  |
|  |  Chat        Team        Subs      |  |
|  |  [icon]      [icon]      [icon]    |  |
|  |                                    |  |
|  |  Alerts      Settings              |  |
|  |  [icon]      [icon]                |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  [Spacer - flex-1]                       |
|                                          |
|  +------------------------------------+  |
|  |  FOOTER                            |  |
|  |  [Sign Out Button - Full Width]    |  |
|  +------------------------------------+  |
|                                          |
|  [Safe Area Bottom Padding]              |
+------------------------------------------+
```

### Color Palette (GenHub Design System)

```typescript
const SLIDE_MENU_COLORS = {
  // Background
  panelBg: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.6)',

  // Primary brand
  primary: '#001B51',           // construction-blue
  primaryLight: '#002d7a',      // lighter navy for gradients
  primaryDark: '#001545',       // darker for depth

  // Header card gradient
  headerGradient: 'linear-gradient(135deg, #001B51 0%, #002d7a 50%, #001545 100%)',

  // Status
  statusActive: '#059669',      // construction-green
  statusDot: '#34D399',         // emerald-400 pulse

  // Nav items
  navItemBg: '#F3F4F6',         // gray-100
  navItemHover: '#E5E7EB',      // gray-200
  navItemActive: '#001B51',     // primary when selected
  navItemText: '#374151',       // gray-700
  navItemTextActive: '#FFFFFF',

  // Accent colors for nav icons (keep from current design)
  chatAccent: '#3B82F6',        // blue-500
  teamAccent: '#8B5CF6',        // violet-500
  subsAccent: '#F59E0B',        // amber-500
  alertsAccent: '#F43F5E',      // rose-500
  settingsAccent: '#64748B',    // slate-500

  // Footer
  signOutBg: '#F3F4F6',
  signOutText: '#374151',
};
```

### Typography

```typescript
const SLIDE_MENU_TYPOGRAPHY = {
  // Header
  brandName: 'text-xl font-black text-white tracking-tight',
  statusLabel: 'text-[11px] font-medium text-white/60 uppercase tracking-wider',
  userName: 'text-base font-bold text-white',
  userEmail: 'text-sm text-white/50 font-medium',
  userRole: 'text-[10px] font-bold text-emerald-400 uppercase tracking-wider',

  // Nav
  navLabel: 'text-sm font-semibold text-gray-700',
  navLabelActive: 'text-sm font-semibold text-white',

  // Footer
  signOutText: 'text-base font-semibold text-gray-700',
};
```

### Spacing & Sizing

```typescript
const SLIDE_MENU_SPACING = {
  // Panel
  panelWidth: '85%',            // 85vw - shows edge of underlying content
  panelMaxWidth: '360px',       // Cap for larger phones
  panelPadding: '20px',         // px-5

  // Header
  headerPadding: '20px',
  headerCardPadding: '16px',
  headerCardBorderRadius: '16px',
  avatarSize: '48px',           // 12 * 4 = 48px
  logoSize: '32px',

  // Nav grid
  navGridGap: '12px',
  navItemSize: 'aspect-square', // Square items
  navItemBorderRadius: '16px',
  navIconContainerSize: '44px', // Touch target
  navIconSize: '24px',

  // Footer
  footerPadding: '20px',
  signOutHeight: '56px',        // h-14
  signOutBorderRadius: '12px',

  // Safe areas
  safeAreaTop: 'env(safe-area-inset-top)',
  safeAreaBottom: 'env(safe-area-inset-bottom)',
};
```

### Touch Targets

All interactive elements meet 44px minimum:

| Element | Size | Implementation |
|---------|------|----------------|
| Close button | 44x44px | `p-2.5` + icon |
| Nav items | ~100x100px | `aspect-square` grid items |
| Sign out | 56px height | `h-14 w-full` |
| Swipe gesture | Full panel height | Drag handle area |

---

## Navigation Items

Remove items already in BottomNavigation (Home, Projects, Tasks, Materials, Expenses).

```typescript
// SlideMenuNav items
const SLIDE_MENU_NAV_ITEMS = [
  {
    id: 'chat',
    name: 'Chat',
    href: '/app/chat',
    icon: MessageSquare,
    accentColor: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/15',
    description: 'Team Messages',
  },
  {
    id: 'team',
    name: 'Team',
    href: '/app/team',
    icon: Users,
    accentColor: 'from-violet-500 to-violet-600',
    iconBg: 'bg-violet-500/15',
    description: 'Crew Members',
  },
  {
    id: 'subs',
    name: 'Subs',
    href: '/app/team/subcontractors',
    icon: HardHat,
    accentColor: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-500/15',
    description: 'Subcontractors',
  },
  {
    id: 'alerts',
    name: 'Alerts',
    href: '/app/notifications',
    icon: Bell,
    accentColor: 'from-rose-500 to-rose-600',
    iconBg: 'bg-rose-500/15',
    description: 'Notifications',
    // Optional: badge count for unread
  },
  {
    id: 'settings',
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    accentColor: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-500/15',
    description: 'Preferences',
  },
];
```

---

## Gesture & Interaction Specification

### Swipe-to-Close Gesture

```typescript
// Implemented on SlideMenuPanel
const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  // Only track horizontal movement to the right
  if (info.offset.x > 0) {
    // Apply resistance as user drags further
    const resistance = 0.6;
    const constrainedX = info.offset.x * resistance;
    // Update panel position
  }
};

const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  const panelWidth = panelRef.current?.offsetWidth || 300;
  const velocity = info.velocity.x;
  const offset = info.offset.x;

  // Dismiss if:
  // 1. Fast swipe to the right (> 500px/s)
  // 2. Dragged more than 35% of panel width
  const shouldDismiss =
    velocity > GESTURE_CONFIG.dismissVelocity ||
    offset > panelWidth * GESTURE_CONFIG.dismissDistance;

  if (shouldDismiss) {
    onClose();
  } else {
    // Spring back to open position
    // animate x to 0 with springBack config
  }
};
```

### Touch Feedback States

```css
/* Nav item touch feedback */
.nav-item {
  transition: all 150ms ease-out;
}

.nav-item:active {
  transform: scale(0.96);
  background-color: var(--nav-item-hover);
}

/* Sign out button */
.sign-out-btn:active {
  transform: scale(0.98);
  background-color: #E5E7EB; /* gray-200 */
}
```

### Edge Swipe Detection (Optional Enhancement)

For extra native feel, detect swipe from right screen edge when menu is closed:

```typescript
// In BottomNavigation or parent component
useEffect(() => {
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const edgeThreshold = 20; // 20px from right edge

    if (touch.clientX > screenWidth - edgeThreshold) {
      // Start tracking for edge swipe
      edgeSwipeStart.current = touch.clientX;
    }
  };

  // ... implement full edge swipe gesture
}, []);
```

---

## Responsive Design

### Mobile (Primary Target)

- Full implementation as described
- Panel width: 85vw (max 360px)
- All gestures enabled

### Tablet (768px+)

- Panel width: 320px fixed
- Backdrop click to close emphasized
- Gestures still work but less relied upon

### Desktop (1024px+)

- **Menu is HIDDEN** - desktop uses sidebar navigation
- `md:hidden` class on entire SlideMenu component

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/app/SlideMenu/index.tsx` | **Create** | Main orchestrating component with gesture handling |
| `components/app/SlideMenu/SlideMenuBackdrop.tsx` | **Create** | Animated backdrop with blur |
| `components/app/SlideMenu/SlideMenuPanel.tsx` | **Create** | Sliding panel container |
| `components/app/SlideMenu/SlideMenuHeader.tsx` | **Create** | User profile card section |
| `components/app/SlideMenu/SlideMenuNav.tsx` | **Create** | Navigation grid |
| `components/app/SlideMenu/SlideMenuFooter.tsx` | **Create** | Sign out section |
| `components/app/SlideMenu/types.ts` | **Create** | TypeScript interfaces |
| `components/app/SlideMenu/animations.ts` | **Create** | Framer Motion variants |
| `components/app/BottomNavigation.tsx` | **Modify** | Import SlideMenu instead of MoreMenu |
| `components/app/MoreMenu.tsx` | **Keep (deprecate)** | Keep for reference, mark deprecated |

---

## Implementation Steps

### Phase 1: Core Structure (Priority)

1. **Create type definitions** (`types.ts`)
   - Define `SlideMenuProps`, `SlideMenuNavItem`, etc.
   - Export animation config types

2. **Create animation constants** (`animations.ts`)
   - Define all Framer Motion variants
   - Export gesture configuration

3. **Build SlideMenuBackdrop**
   - Animated opacity backdrop
   - `backdrop-blur-sm` effect
   - Click handler for close

4. **Build SlideMenuPanel**
   - Right-to-left slide animation
   - Drag gesture handling with `motion.div`
   - Safe area insets
   - `useMotionValue` for drag position

### Phase 2: Content Components

5. **Build SlideMenuHeader**
   - GenHub logo with status indicator
   - User profile card with avatar
   - Gradient background matching current design
   - Close button (X) in top-right

6. **Build SlideMenuNav**
   - 2-column grid (or 3-column like current)
   - Staggered animation on open
   - Active state detection
   - Touch feedback

7. **Build SlideMenuFooter**
   - Sign out button
   - Safe area bottom padding

### Phase 3: Integration

8. **Assemble main component** (`index.tsx`)
   - Compose all sub-components
   - Handle body scroll lock
   - ESC key listener
   - AnimatePresence for enter/exit

9. **Update BottomNavigation.tsx**
   - Replace `MoreMenu` import with `SlideMenu`
   - Ensure same props are passed

### Phase 4: Polish

10. **Test on devices**
    - iOS Safari (notch handling)
    - Android Chrome
    - Various screen sizes

11. **Performance optimization**
    - Ensure 60fps animations
    - Use `will-change` sparingly
    - Test with React DevTools Profiler

---

## Dependencies

Already installed in GenHub:

| Package | Version | Usage |
|---------|---------|-------|
| `framer-motion` | ^11.x | Animations, gestures |
| `lucide-react` | ^0.x | Icons |
| `next-auth` | ^5.x | Session type |
| `clsx` + `tailwind-merge` | - | cn() utility |

**No new dependencies required.**

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus trap | Focus stays within menu when open |
| ESC to close | `useEffect` keyboard listener |
| Screen reader | `role="dialog"`, `aria-modal="true"`, `aria-label` |
| Reduced motion | Respect `prefers-reduced-motion` media query |
| Touch targets | 44px minimum on all interactive elements |

### Reduced Motion Support

```typescript
// In animations.ts
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const getAnimationVariants = () => {
  if (prefersReducedMotion) {
    return {
      panel: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      },
      // ... simplified variants
    };
  }
  return SLIDE_MENU_ANIMATIONS;
};
```

---

## Construction Theme Integration

### Header Card Design

The header maintains the industrial GenHub brand:

```tsx
// Premium gradient with subtle grid pattern overlay
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001B51] via-[#002d7a] to-[#001545]">
  {/* Subtle blueprint grid pattern */}
  <div
    className="absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage: `
        linear-gradient(to right, white 1px, transparent 1px),
        linear-gradient(to bottom, white 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }}
  />

  {/* Content */}
</div>
```

### Status Indicators

Match current design's status system:

- Green dot pulse for "Online" / "System Active"
- Shield icon for authenticated user
- Zap icon for system status

### Icon Consistency

Use Lucide icons from design system:

- `MessageSquare` - Chat
- `Users` - Team
- `HardHat` - Subcontractors (construction context)
- `Bell` - Alerts
- `Settings` - Settings
- `LogOut` - Sign Out

---

## Important Notes

### Performance Considerations

1. **Use `transform` only** for animations (GPU accelerated)
2. **Avoid layout thrashing** - don't animate `width`, `height`, `top`, `left`
3. **Lazy load content** if menu has dynamic data
4. **Debounce gesture handlers** if needed

### iOS Safari Gotchas

1. **Safe area insets** - use `env(safe-area-inset-*)`
2. **Overscroll behavior** - add `overscroll-behavior: contain`
3. **Backdrop blur** - may cause repaint issues on older devices
4. **Body scroll lock** - use the position:fixed technique from BottomSheetModal

### Testing Checklist

- [ ] Smooth 60fps slide animation
- [ ] Swipe-to-close works naturally
- [ ] Backdrop blur renders correctly
- [ ] Safe area padding on notched devices
- [ ] Body scroll locked when open
- [ ] ESC key closes menu
- [ ] Active route highlighted
- [ ] Sign out works
- [ ] No content jump when opening/closing
- [ ] Works with screen reader

---

## Comparison: Current vs New

| Aspect | Current (MoreMenu) | New (SlideMenu) |
|--------|-------------------|-----------------|
| Pattern | Bottom sheet | Right-to-left slide |
| Entry animation | Slide up | Slide from right |
| Dismiss gesture | Drag down | Swipe right |
| Visual style | Good | Premium native feel |
| Nav layout | 3-column grid | 2-column grid (larger targets) |
| User profile | Excellent | Keep same |
| Brand presence | Strong | Maintain |

---

## Summary

This plan creates a premium, native-feeling slide menu that:

1. **Feels like iOS/Android** - Right-to-left slide with spring physics
2. **Field-ready** - Large touch targets, high contrast
3. **On-brand** - Navy #001B51 construction theme throughout
4. **Performant** - 60fps animations, efficient gesture handling
5. **Accessible** - Focus trap, keyboard support, screen reader friendly

The implementation builds on GenHub's existing patterns (BottomSheetModal spring physics, design tokens) while elevating the menu to a premium experience.

---

**Plan created at**: `/Users/jonathanlee/Desktop/genhub/.claude/docs/ui-plans/premium-mobile-slide-menu.md`

**Ready for**: frontend-engineer to implement
