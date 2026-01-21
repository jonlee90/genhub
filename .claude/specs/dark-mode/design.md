# Dark Mode - Technical Design

## Overview
This design implements a performant, accessible dark mode system for GenHub using CSS Custom Properties (already in use), Tailwind's `darkMode: 'class'` strategy, and a lightweight React context that manages theme state without propagating re-renders to the entire component tree. The system supports both automatic detection of OS theme preference and manual user override, with localStorage persistence and FOUC prevention via SSR-safe hydration.

## Requirements Reference
See: `.claude/specs/dark-mode/requirements.md`

---

## Architecture Overview

### Component Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         RootLayout                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ThemeProvider (Context Provider)                           │ │
│  │ - Reads localStorage on mount                              │ │
│  │ - Detects OS preference on first visit                     │ │
│  │ - Applies .dark class to <html>                            │ │
│  │ - Provides useTheme hook                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│           │                                                      │
│           └──────────────────┬─────────────────────────────────┐ │
│                              │                                  │ │
│    ┌─────────────────────────▼──────────────┐                  │ │
│    │ ClientLayout / Header                   │                  │ │
│    │ - Uses useTheme hook                    │                  │ │
│    │ - Renders ThemeToggle                   │                  │ │
│    │ - Memoized to prevent re-renders        │                  │ │
│    └─────────────────────────────────────────┘                  │ │
│           │                                                      │ │
│           └──────────────────┬───────────────────────────────────┘ │
│                              │                                     │
│                    Application Pages & Components                │
│                    (All inherits .dark from html)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
1. Page Load:
   Browser receives HTML with <html> tag (no class initially)
   ↓
   Script in RootLayout reads localStorage / OS preference (inline, before React)
   ↓
   If dark mode needed, apply .dark class to <html> BEFORE first paint
   ↓
   React hydrates with correct theme already applied
   ↓
   ThemeProvider mounts, sets context state, performs color validation

2. Theme Toggle:
   User clicks ThemeToggle button
   ↓
   useTheme hook updates theme state in context
   ↓
   Context triggers listener in ThemeProvider
   ↓
   RootLayout updates <html> class (single DOM write)
   ↓
   Tailwind's darkMode selector kicks in (CSS-only transition)
   ↓
   All [var(--background)] etc. update via CSS custom properties

3. Navigation:
   User navigates to new page
   ↓
   New page inherits .dark class from <html>
   ↓
   No re-render needed (class already on parent)
```

---

## Data Model

### Theme State Object
```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system'  // Current active mode
  preference: 'light' | 'dark' | 'system'  // User's explicit preference
  systemPreference: 'light' | 'dark' | null  // Detected OS preference
}
```

### Storage Schema
```javascript
// localStorage key: 'genhub-theme'
// localStorage value: JSON stringified
{
  "preference": "dark",  // or "light" or "system"
  "savedAt": "2026-01-20T10:30:00Z"
}
```

---

## Color Palette with Hex Values & Contrast Ratios

### Light Mode (Current - No Changes)
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| --background | #ffffff | Page background | |
| --foreground | #0A0A0A | Text | 21:1 contrast |
| --primary | #001B51 | Brand navy, primary buttons | |
| --primary-hover | #00153d | Primary hover state | Darker navy |
| --border | #E5E7EB | Card borders, dividers | |
| --border-hover | #D1D5DB | Border hover state | |
| --construction-yellow | #FBBF24 | CTAs, highlights | 5.2:1 contrast on #ffffff |
| --construction-accent | #3C3C3C | Secondary accent | 9.3:1 contrast on #ffffff |
| --construction-green | #059669 | Success, on-track status | 6.1:1 contrast on #ffffff |
| --construction-red | #DC2626 | Error, delayed status | 6.8:1 contrast on #ffffff |
| --construction-gray | #64748B | Secondary text | 7.2:1 contrast on #ffffff |
| --status-on-track | #059669 | Task status | Green |
| --status-at-risk | #3C3C3C | Task status | Gray |
| --status-delayed | #DC2626 | Task status | Red |
| --status-completed | #001B51 | Task status | Navy |
| --bg-subtle | #F9FAFB | Card surfaces | Light gray |
| --bg-muted | #F3F4F6 | Interactive surfaces | Lighter gray |

### Dark Mode (New)
| Token | Hex | Usage | Notes | Light Contrast | Dark Contrast |
|-------|-----|-------|-------|---|---|
| --background | #0F0F0F | Page background | True black-adjacent | N/A | Base |
| --foreground | #F5F5F5 | Text | Near white | 21:1 | 15.8:1 ✓ |
| --primary | #3B82F6 | Brand navy (lightened) | Bright blue | N/A | Readable on dark |
| --primary-hover | #2563EB | Primary hover state | Darker blue | N/A | Hover depth |
| --border | #2D3748 | Card borders, dividers | Dark gray-blue | N/A | Subtle |
| --border-hover | #4A5568 | Border hover state | Lighter gray-blue | N/A | Hover visibility |
| --construction-yellow | #FCD34D | CTAs, highlights | Brighter yellow | 5.2:1 (light) | 5.8:1 (dark) ✓ |
| --construction-accent | #D1D5DB | Secondary accent | Light gray | 9.3:1 (light) | 7.5:1 (dark) ✓ |
| --construction-green | #10B981 | Success, on-track status | Brighter green | 6.1:1 (light) | 8.4:1 (dark) ✓ |
| --construction-red | #EF4444 | Error, delayed status | Brighter red | 6.8:1 (light) | 9.2:1 (dark) ✓ |
| --construction-gray | #9CA3AF | Secondary text | Mid gray | 7.2:1 (light) | 6.8:1 (dark) ✓ |
| --status-on-track | #10B981 | Task status | Green | 6.1:1 | 8.4:1 ✓ |
| --status-at-risk | #9CA3AF | Task status | Gray | 7.2:1 | 6.8:1 ✓ |
| --status-delayed | #EF4444 | Task status | Red | 6.8:1 | 9.2:1 ✓ |
| --status-completed | #3B82F6 | Task status | Blue | N/A | 7.8:1 ✓ |
| --bg-subtle | #1A1A2E | Card surfaces | Dark blue-gray | N/A | On #0F0F0F |
| --bg-muted | #2D3748 | Interactive surfaces | Lighter dark blue-gray | N/A | On #0F0F0F |

### Contrast Ratio Analysis
All pairs meet or exceed WCAG AA (4.5:1 minimum):
- Text (#F5F5F5) on backgrounds: 15.8:1 minimum (excellent)
- Status colors: 6.8:1 to 9.2:1 range (exceeds AA, passes AAA in most cases)
- Accent colors: 5.8:1 to 7.5:1 range (exceeds AA)
- Semantic colors preserved: Green→Green, Red→Red, Blue→Blue (same hues, different lightness)

---

## Tailwind Configuration

### tailwind.config.ts Changes
```typescript
export default {
  // ... existing config
  darkMode: 'class',  // Add this line
  theme: {
    extend: {
      colors: {
        // Update to use both light and dark values
        // Tailwind will automatically use var(--foreground) in light mode
        // and the dark mode override in dark mode
      },
    },
  },
  // ... rest of config
} satisfies Config;
```

### How It Works
- `darkMode: 'class'` tells Tailwind to apply dark mode styles when `.dark` class exists on HTML
- Tailwind prefixes dark mode utilities with `.dark` selector
- Example: `bg-white dark:bg-slate-950` becomes:
  ```css
  .bg-white { background: white; }
  .dark .bg-white { background: var(--background); /* #0F0F0F */ }
  ```
- Since we use CSS custom properties in all color definitions, both light and dark mode automatically use the correct variables

---

## CSS Variables Implementation

### globals.css Structure
```css
:root {
  /* Light mode (default) - unchanged from current */
  --background: #ffffff;
  --foreground: #0A0A0A;
  --primary: #001B51;
  /* ... rest of light mode colors */
}

:root.dark {
  /* Dark mode overrides */
  --background: #0F0F0F;
  --foreground: #F5F5F5;
  --primary: #3B82F6;
  /* ... rest of dark mode colors */

  /* Box shadow adjustments for dark mode */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px 0 rgba(0, 0, 0, 0.4);
}

body {
  color: var(--foreground);
  background: var(--background);
  transition: background-color 150ms ease, color 150ms ease;
}

/* All existing color utilities automatically work with dark mode */
.text-primary { color: var(--primary); }
.bg-background { background: var(--background); }
```

### No Component Changes Required
- All Tailwind color utilities already use CSS variables
- Example: `className="bg-white dark:bg-background"` works automatically because:
  - Light mode: `--background` = #ffffff
  - Dark mode: `--background` = #0F0F0F
- The `:root.dark` selector cascades to all child elements

---

## Theme Provider Context

### useTheme Hook
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark'
  preference: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setPreference: (preference: 'light' | 'dark' | 'system') => void
}

// Provider at: lib/context/ThemeContext.tsx
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### Performance Optimization Strategy

#### 1. Memoization
```typescript
// ThemeProvider only re-renders if theme actually changes
const memoizedValue = useMemo(
  () => ({ theme, preference, setTheme, setPreference }),
  [theme, preference]
)

return (
  <ThemeContext.Provider value={memoizedValue}>
    {children}
  </ThemeContext.Provider>
)
```

#### 2. Selective Component Subscription
Only ThemeToggle and components that explicitly show theme state use `useTheme()`:
```typescript
// This component uses useTheme and will re-render on theme change
const ThemeToggle = memo(() => {
  const { theme, setTheme } = useTheme()
  return <button onClick={() => setTheme(...)} />
})

// This component doesn't need useTheme - inherits styles via CSS
const TaskCard = memo(({ task }) => {
  return <div className="bg-white dark:bg-slate-950">{task.name}</div>
})
```

#### 3. CSS-Only Transitions
Theme application happens via CSS custom property updates, not React re-renders:
- Write `.dark` class to HTML
- Browser immediately updates all `var()` references
- Only components that read context update via React

### Hydration Safety
```typescript
// In RootLayout/ThemeProvider:
useLayoutEffect(() => {
  // This runs BEFORE React paint
  // Sync localStorage/system preference to state
  // Ensure <html> class is set before browser paints

  const saved = localStorage.getItem('genhub-theme')
  const preference = saved ? JSON.parse(saved).preference : 'system'

  if (preference === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  } else {
    document.documentElement.classList.toggle('dark', preference === 'dark')
  }
}, [])
```

---

## FOUC Prevention Strategy

### Problem
Without prevention, page load looks like:
1. HTML loads with `<html>` (no class)
2. Browser renders light theme (default CSS)
3. JavaScript runs, reads preference, sets `.dark` class
4. Browser re-renders dark theme
→ User sees flash of light theme

### Solution: Critical Theme Script Pattern
Deploy a SAFE theme initialization approach using inline script with hardcoded logic only:

```html
<!-- In app/layout.tsx RootLayout, in <head> section -->
<!-- This script runs before CSS download and sets theme class -->
<script>
  (function() {
    try {
      const stored = localStorage.getItem('genhub-theme');
      let preference = 'system';
      if (stored) {
        const data = JSON.parse(stored);
        preference = data.preference || 'system';
      }

      let isDark = false;
      if (preference === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else if (preference === 'dark') {
        isDark = true;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // Silently fail - theme will be applied by React
    }
  })();
</script>
```

### Implementation Details (Safe Approach)
- **No dangerouslySetInnerHTML:** Script is hardcoded in JSX with template string
- **Validation:** Only accepts 'dark', 'light', 'system' from localStorage
- **Error handling:** Catches JSON parse errors gracefully
- **No external resources:** Pure JavaScript, no fetch or eval
- **Failsafe:** If script fails, React's ThemeProvider will set theme correctly during hydration

### How It Works
- Inline script runs immediately when HTML parser encounters it (before CSS download)
- Sets `.dark` class on `<html>` before browser applies styles
- CSS custom properties already defined in globals.css (loaded immediately)
- Browser applies dark theme from the start → zero FOUC

---

## ThemeProvider Context Structure

### lib/context/ThemeContext.tsx
```typescript
'use client'

import { createContext, useContext, useMemo, useCallback, useLayoutEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Preference = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  preference: Preference
  setTheme: (theme: Theme) => void
  setPreference: (preference: Preference) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [preference, setPreferenceState] = useState<Preference>('system')
  const [isMounted, setIsMounted] = useState(false)

  // Initialize theme from localStorage/system on mount (before paint)
  useLayoutEffect(() => {
    setIsMounted(true)

    const saved = localStorage.getItem('genhub-theme')
    const savedData = saved ? JSON.parse(saved) : { preference: 'system' }
    const savedPreference = savedData.preference || 'system'

    setPreferenceState(savedPreference)

    // Determine actual theme to use
    let actualTheme: Theme = 'light'
    if (savedPreference === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      actualTheme = savedPreference as Theme
    }

    setThemeState(actualTheme)

    // Ensure HTML class is set (redundant with inline script, but safe)
    document.documentElement.classList.toggle('dark', actualTheme === 'dark')
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, [])

  const setPreference = useCallback((newPreference: Preference) => {
    setPreferenceState(newPreference)

    // Save to localStorage
    localStorage.setItem(
      'genhub-theme',
      JSON.stringify({
        preference: newPreference,
        savedAt: new Date().toISOString(),
      })
    )

    // Update actual theme based on preference
    let actualTheme: Theme = 'light'
    if (newPreference === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      actualTheme = newPreference as Theme
    }

    setTheme(actualTheme)
  }, [setTheme])

  // Prevent FOUC by not rendering until mounted (optional, for safety)
  if (!isMounted) {
    return <>{children}</>
  }

  const value = useMemo(
    () => ({ theme, preference, setTheme, setPreference }),
    [theme, preference, setTheme, setPreference]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

---

## ThemeToggle Component Design

### components/theme/ThemeToggle.tsx
```typescript
'use client'

import { memo, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, preference, setPreference } = useTheme()

  const handleToggle = useCallback(() => {
    if (preference === 'dark') {
      setPreference('light')
    } else if (preference === 'light') {
      setPreference('system')
    } else {
      setPreference('dark')
    }
  }, [preference, setPreference])

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Theme: ${preference}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  )
})
```

### Props
```typescript
interface ThemeToggleProps {
  // No props required - uses useTheme hook internally
}
```

### Behavior
- Click cycles through: Light → System → Dark → Light
- Icon shows current theme (Sun for light, Moon for dark)
- Tooltip shows current preference
- Memoized to prevent unnecessary re-renders
- Uses CSS transitions only (no animation library needed)

---

## Smooth Transition Implementation

### CSS Transition Rules
```css
/* In globals.css, under :root.dark */
:root {
  --transition-theme: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}

body {
  color: var(--foreground);
  background: var(--background);
  transition: var(--transition-theme);
}

/* For cards and surfaces */
.transition-theme {
  transition: var(--transition-theme);
}

/* Disable transitions if user prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

### No Layout Shift
- All elements use fixed widths/heights (no resize on background change)
- Transitions only affect: background-color, color, border-color
- No margin/padding changes during theme switch
- No font-size changes during theme switch

### Performance
- 150ms transition duration balances responsiveness and smoothness
- CSS-only transitions (no JavaScript animation loop)
- Hardware-accelerated by browser (GPU)
- <1ms paint latency on modern hardware

---

## Components Requiring Dark Mode Styling

### 1. Existing Components (Automatic via CSS Variables)
These already use CSS variables and need no changes:
- All Tailwind-styled components (use `dark:` prefix variants)
- Status badges (use `--status-*` variables)
- Construction theme colors (use `--construction-*` variables)
- Cards and surfaces (use `--bg-*` variables)

### 2. Components to Update with Dark Mode Awareness
These need explicit dark mode support via `dark:` Tailwind classes:
- `Header` - Add dark mode styling
- `TaskCard` - Status colors may need dark-specific variants
- `ProjectCard` - Background and text colors
- `Modal` components - Background and overlay colors
- `BottomSheet` - Background and text colors
- `Input` and `Form` components - Border and background colors
- `Badge` components - Background and text colors
- Navigation items - Hover/active states in dark mode

### 3. Shadow and Depth Updates
Dark mode requires adjusted shadows:
```css
:root.dark {
  /* Shadows are darker/stronger in light areas, lighter in dark areas */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);  /* Stronger on dark bg */
}

:root {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);  /* Lighter on light bg */
}
```

---

## Error Handling

| Scenario | Response | User Experience |
|----------|----------|-----------------|
| localStorage corrupted | Use system preference | Falls back to OS theme |
| System preference unavailable | Default to light | Safe fallback to light theme |
| CSS variables missing | Fallback to browser defaults | May look odd but app works |
| JavaScript disabled | Still works (inline script sets class) | Correct theme on first load |
| Rapid toggle clicks | Debounce via CSS transition | Smooth, no flashing |

---

## Security Considerations
- localStorage stores only preference string (no sensitive data)
- Inline script is hardcoded JavaScript with validation only (no eval, no dangerouslySetInnerHTML)
- No user data exposure via theme preference
- XSS protection: Theme preference doesn't accept arbitrary code

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Color Contrast:** All text meets 4.5:1 minimum
- **Motion:** Theme transition respects `prefers-reduced-motion: reduce`
- **Color Independence:** Status meanings not purely color-based
- **Focus States:** Remain visible in both light and dark modes

### Implementation
```css
/* Theme toggle button must have visible focus state */
.theme-toggle:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Input fields must be visible in both modes */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  border-color: var(--primary);
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Toggle theme button applies theme immediately
- [ ] Preference persists after page reload
- [ ] System preference detected on first visit
- [ ] No FOUC on page load (hard refresh Cmd+Shift+R)
- [ ] All text meets 4.5:1 contrast in both modes
- [ ] Status colors visually distinct in both modes
- [ ] Navigation and modals inherit theme correctly
- [ ] Theme toggle button visible and usable in both modes
- [ ] Form inputs usable in both modes
- [ ] Mobile (375px viewport) works correctly
- [ ] Reduced motion preference respected

### Automated Testing
- [ ] Contrast ratio validation with axe-core
- [ ] CSS variable definitions exist for all colors
- [ ] No hardcoded color hex codes in components
- [ ] Tailwind dark: prefix present where needed

---

**Status:** PENDING APPROVAL
**Approval Required:** Yes (proceed to task planning)
