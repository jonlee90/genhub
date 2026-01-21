# Dark Mode Implementation Guide

**Last Updated:** 2026-01-20
**Status:** APPROVED FOR PRODUCTION
**Audience:** Developers implementing dark mode support in new components

---

## Quick Start: Add Dark Mode to a New Component (1 Page)

### The Three-Step Pattern

**Step 1: Use CSS Variables Instead of Hardcoded Colors**

```tsx
// WRONG - hardcoded colors won't work in dark mode
<div className="bg-white text-black border border-gray-300">
  Content
</div>

// CORRECT - uses CSS variables that automatically adapt
<div className="bg-background text-foreground border border-border">
  Content
</div>
```

**Step 2: Add `dark:` Prefix for Every Color**

Even if light and dark use the same variable (which they do), include the `dark:` prefix explicitly for clarity:

```tsx
// CORRECT
<div className="
  bg-background dark:bg-background
  text-foreground dark:text-foreground
  border border-border dark:border-border
">
  Content
</div>
```

**Step 3: Test in Both Modes**

1. Open the app in light mode
2. Toggle theme in header
3. Verify colors are correct
4. Toggle again to verify transitions are smooth

### Copy-Paste Example: Simple Card

```tsx
import React from 'react'

export function MyCard() {
  return (
    <div className="
      p-4 rounded-lg
      bg-bg-subtle dark:bg-bg-subtle
      border border-border dark:border-border
      shadow-sm
    ">
      <h3 className="text-foreground dark:text-foreground font-semibold mb-2">
        Card Title
      </h3>
      <p className="text-construction-gray dark:text-construction-gray">
        Card description text
      </p>
    </div>
  )
}
```

---

## Using the useTheme() Hook

### When to Use

- **Access current theme preference** (e.g., to show a theme toggle button)
- **Conditional rendering** (rarely needed, usually styling is enough)
- **Reading the resolved theme** (what theme is actually active: 'light' or 'dark')

### Example: Reading Current Theme

```tsx
'use client'

import { useTheme } from '@/lib/context/ThemeContext'

export function ThemeStatus() {
  const { preference, resolvedTheme } = useTheme()

  return (
    <div>
      <p>Preference: {preference}</p>
      <p>Actual theme: {resolvedTheme}</p>
    </div>
  )
}
```

### API Reference

**`useTheme()` returns:**

```typescript
{
  preference: 'light' | 'dark' | 'system'  // User's saved setting
  resolvedTheme: 'light' | 'dark'         // Actual active theme
  setPreference: (p: ThemePreference) => void  // Change theme
}
```

**Preference Values:**

- `'light'`: Always show light mode
- `'dark'`: Always show dark mode
- `'system'`: Follow OS preference (macOS, Windows, iOS, Android)

**Resolved Theme:**

- `'light'`: Active theme is light (preference is 'light' OR preference is 'system' AND OS is light)
- `'dark'`: Active theme is dark (preference is 'dark' OR preference is 'system' AND OS is dark)

### Example: Theme Toggle Component

```tsx
'use client'

import { useTheme, type ThemePreference } from '@/lib/context/ThemeContext'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  const handleToggle = () => {
    const cycle: Record<ThemePreference, ThemePreference> = {
      light: 'system',
      system: 'dark',
      dark: 'light'
    }
    setPreference(cycle[preference])
  }

  const icons = {
    light: <Moon size={20} />,
    dark: <Sun size={20} />,
    system: <Monitor size={20} />
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      title={`Theme: ${preference}`}
    >
      {icons[preference]}
    </button>
  )
}
```

---

## CSS Variables Reference

### All 17 CSS Variables

Complete list of all variables available in both light and dark modes.

#### Background & Text

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--background` | `#ffffff` | `#0F0F0F` | Page background |
| `--foreground` | `#0A0A0A` | `#F5F5F5` | Primary text color |
| `--bg-subtle` | `#F9FAFB` | `#1A1A2E` | Subtle surface (cards) |
| `--bg-muted` | `#F3F4F6` | `#2D3748` | Muted surface (interactive) |

#### Primary Colors (Buttons, Links)

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--primary` | `#001B51` (Navy) | `#3B82F6` (Blue) | Primary CTA buttons |
| `--primary-hover` | `#00153d` | `#2563EB` | Primary button hover |

#### Borders & Dividers

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--border` | `#E5E7EB` | `#2D3748` | Card borders, dividers |
| `--border-hover` | `#D1D5DB` | `#4A5568` | Border on hover |

#### Status Colors

| Variable | Light Mode | Dark Mode | Meaning | Usage |
|----------|-----------|-----------|---------|-------|
| `--status-on-track` | `#059669` (Green) | `#10B981` (Bright Green) | Success, on track | Status badges |
| `--status-delayed` | `#DC2626` (Red) | `#EF4444` (Bright Red) | Error, delayed | Error badges |
| `--status-at-risk` | `#3C3C3C` (Dark Gray) | `#9CA3AF` (Light Gray) | Warning, at risk | Warning badges |
| `--status-completed` | `#001B51` (Navy) | `#3B82F6` (Blue) | Completed, done | Complete badges |

#### Construction Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--construction-yellow` | `#FBBF24` (Amber) | `#FCD34D` (Bright Amber) | CTA highlights, badges |
| `--construction-accent` | `#3C3C3C` (Gray) | `#D1D5DB` (Light Gray) | Secondary accents |
| `--construction-green` | `#059669` (Green) | `#10B981` (Bright Green) | Success indicators |
| `--construction-red` | `#DC2626` (Red) | `#EF4444` (Bright Red) | Error indicators |
| `--construction-gray` | `#64748B` (Slate) | `#9CA3AF` (Gray) | Secondary text |

### Usage Examples

**Primary Button**
```tsx
<button className="
  px-4 py-2 rounded-lg
  bg-primary dark:bg-primary
  text-white
  hover:bg-primary-hover dark:hover:bg-primary-hover
">
  Create Project
</button>
```

**Status Badge (On-Track)**
```tsx
<span className="
  px-3 py-1 rounded-md
  bg-status-on-track dark:bg-status-on-track
  text-white
  font-semibold
">
  On Track
</span>
```

**Card with Border**
```tsx
<div className="
  p-4 rounded-lg
  bg-bg-subtle dark:bg-bg-subtle
  border border-border dark:border-border
">
  Card content
</div>
```

**Secondary Text**
```tsx
<p className="
  text-construction-gray dark:text-construction-gray
">
  This is secondary text, less important than primary text
</p>
```

**Alert with Yellow CTA**
```tsx
<div className="
  p-4 rounded-lg
  bg-bg-muted dark:bg-bg-muted
  border-l-4 border-construction-yellow dark:border-construction-yellow
">
  <h4 className="text-foreground dark:text-foreground font-bold">Important</h4>
  <p className="text-construction-gray dark:text-construction-gray mt-1">
    This is important information.
  </p>
</div>
```

---

## Component Dark Mode Patterns

### Pattern 1: Simple Component (Button)

**BEFORE: No Dark Mode**

```tsx
function PrimaryButton({ children }) {
  return (
    <button className="
      px-4 py-2 rounded-lg
      bg-[#001B51] text-white
      hover:bg-[#00153d]
    ">
      {children}
    </button>
  )
}
```

**AFTER: With Dark Mode**

```tsx
function PrimaryButton({ children }) {
  return (
    <button className="
      px-4 py-2 rounded-lg
      bg-primary dark:bg-primary
      text-white
      hover:bg-primary-hover dark:hover:bg-primary-hover
      transition-colors duration-150
    ">
      {children}
    </button>
  )
}
```

**Changes:**
1. Replace hardcoded hex colors with CSS variables
2. Add `dark:` prefix to ensure consistency
3. Add `transition-colors` for smooth color changes

---

### Pattern 2: Container Component (Card)

**BEFORE: No Dark Mode**

```tsx
function TaskCard({ task }) {
  return (
    <div className="
      p-4 rounded-lg
      bg-white border border-gray-300
      shadow-sm
    ">
      <h3 className="text-black font-bold">{task.name}</h3>
      <p className="text-gray-500 text-sm mt-2">{task.description}</p>
      <div className="mt-4">
        <span className={`px-2 py-1 rounded-md text-white ${
          task.status === 'on-track' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  )
}
```

**AFTER: With Dark Mode**

```tsx
function TaskCard({ task }) {
  return (
    <div className="
      p-4 rounded-lg
      bg-bg-subtle dark:bg-bg-subtle
      border border-border dark:border-border
      shadow-sm
    ">
      <h3 className="
        text-foreground dark:text-foreground
        font-bold
      ">
        {task.name}
      </h3>
      <p className="
        text-construction-gray dark:text-construction-gray
        text-sm mt-2
      ">
        {task.description}
      </p>
      <div className="mt-4">
        <span className={`
          px-2 py-1 rounded-md text-white font-semibold
          ${task.status === 'on-track'
            ? 'bg-status-on-track dark:bg-status-on-track'
            : 'bg-status-delayed dark:bg-status-delayed'
          }
        `}>
          {task.status}
        </span>
      </div>
    </div>
  )
}
```

**Changes:**
1. Replace all hardcoded bg/text colors with CSS variables
2. Replace status color logic to use semantic variables
3. Add `dark:` variants for all color utilities
4. Status colors automatically adapt to both modes

---

### Pattern 3: Form Component (Input Field)

**BEFORE: No Dark Mode**

```tsx
function TaskInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Enter task name"
      className="
        w-full px-3 py-2
        border border-gray-300
        rounded-lg
        bg-white text-black
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    />
  )
}
```

**AFTER: With Dark Mode**

```tsx
function TaskInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Enter task name"
      className="
        w-full px-3 py-2
        border border-border dark:border-border
        rounded-lg
        bg-background dark:bg-background
        text-foreground dark:text-foreground
        placeholder-construction-gray dark:placeholder-construction-gray
        focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary
        transition-colors duration-150
      "
    />
  )
}
```

**Changes:**
1. Replace border color with `border-border dark:border-border`
2. Replace background/text with `bg-background dark:bg-background` and `text-foreground dark:text-foreground`
3. Replace placeholder color with `placeholder-construction-gray dark:placeholder-construction-gray`
4. Replace focus ring with `focus:ring-primary dark:focus:ring-primary`
5. Add transition for smooth color changes

---

## Common Mistakes & Fixes

### Mistake 1: Forgetting the `dark:` Prefix

```tsx
// WRONG - works in light mode, breaks in dark mode
<div className="bg-white text-black">

// CORRECT - works in both modes
<div className="bg-background dark:bg-background text-foreground dark:text-foreground">
```

**Why it matters:** Without `dark:`, Tailwind doesn't generate the dark mode CSS rule. The style won't apply in dark mode.

---

### Mistake 2: Mixing CSS Variables and Hardcoded Colors

```tsx
// WRONG - inconsistent
<div className="bg-primary dark:bg-[#0F0F0F] text-[#0A0A0A]">

// CORRECT - all CSS variables
<div className="bg-primary dark:bg-primary text-foreground dark:text-foreground">
```

**Why it matters:** Mixing approaches makes maintenance harder and defeats the purpose of the design system.

---

### Mistake 3: Using Wrong Color for Dark Mode

```tsx
// WRONG - Navy (#001B51) is unreadable on dark backgrounds
<div className="bg-primary dark:bg-primary">
  // Problem: bg-primary = #001B51 in BOTH modes (same variable!)
</div>

// CORRECT - CSS variables already have correct dark values
<div className="bg-primary dark:bg-primary">
  // Light mode: --primary = #001B51
  // Dark mode: --primary = #3B82F6
  // Automatic! No manual override needed.
</div>
```

**Why it matters:** The CSS variables in globals.css already define the correct colors for both modes. Don't try to manually override them.

---

### Mistake 4: Forgetting Hover States

```tsx
// WRONG - hover only defined for light mode
<button className="bg-primary hover:bg-primary-hover">

// CORRECT - hover defined for both modes
<button className="
  bg-primary dark:bg-primary
  hover:bg-primary-hover dark:hover:bg-primary-hover
">
```

**Why it matters:** Users expect interactive elements to respond consistently in both modes.

---

### Mistake 5: Not Testing Color Contrast

```tsx
// RISKY - didn't verify contrast ratio
<div className="bg-status-yellow dark:bg-status-yellow text-gray-600">

// SAFE - verified contrast is 4.5:1+
<div className="
  bg-construction-yellow dark:bg-construction-yellow
  text-foreground dark:text-foreground
">
```

**Why it matters:** Poor contrast violates WCAG accessibility standards and harms users with low vision.

---

## Testing Checklist

### Before Submitting a Component

- [ ] **CSS Variables Only**: No hardcoded hex colors like `#ffffff`
- [ ] **All Color Properties Have `dark:` Variant**: `bg-primary dark:bg-primary`
- [ ] **Contrast Ratio Check**: Text has ≥4.5:1 contrast in both modes
- [ ] **Status Colors Correct**: Green=success, Red=error, Gray=warning, Blue=complete
- [ ] **Hover States**: Work in both light and dark modes
- [ ] **Focus States**: Visible and accessible in both modes (especially for form inputs)
- [ ] **Touch Targets**: ≥44×44px if interactive (mobile-friendly)
- [ ] **Tested Visually**: Toggled theme and verified appearance

### Quick Manual Testing

**Step 1: Light Mode**
```
1. Open app in light mode
2. Verify all colors match the light palette
3. Check text is readable (dark text on light backgrounds)
4. Check hover states work smoothly
```

**Step 2: Dark Mode**
```
1. Click theme toggle
2. Verify all colors changed to dark palette
3. Check text is readable (light text on dark backgrounds)
4. Check hover states work smoothly
5. Hard refresh (Cmd+Shift+R) and verify theme persists with no flash
```

**Step 3: Verify No FOUC**
```
1. Hard refresh with dark mode enabled
2. Should NOT see white flash before dark theme loads
3. Should show dark theme immediately
```

### Browser DevTools Testing

**Test contrast ratio:**
```javascript
// Copy and paste into browser console
const foreground = [245, 245, 245]  // Dark mode text
const background = [15, 15, 15]     // Dark mode background

const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const l1 = getLuminance(...foreground);
const l2 = getLuminance(...background);
const contrast = ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
console.log(`Contrast ratio: ${contrast}:1`);  // Should be ≥ 4.5
```

### Testing Accessibility

**Test with color blindness simulator:**

1. Go to https://www.colorblindcheck.com/
2. Take a screenshot of your component
3. Upload to the simulator
4. Select "Deuteranopia" (red-green colorblind)
5. Verify status colors are still distinguishable by lightness/brightness

**Verify with WCAG Contrast Checker:**

1. Go to https://webaim.org/resources/contrastchecker/
2. Enter your foreground color (RGB)
3. Enter your background color (RGB)
4. Should show ≥4.5:1 for WCAG AA
5. Ideally ≥7:1 for WCAG AAA

---

## Troubleshooting Guide

### Issue: Colors Don't Change When Theme Toggles

**Symptoms:**
- Clicked theme toggle button
- Colors didn't change
- Had to refresh page for changes to apply

**Causes & Fixes:**

**1. Missing `dark:` prefix**
```tsx
// WRONG
<div className="bg-white">

// CORRECT
<div className="bg-background dark:bg-background">
```

**2. Component not wrapped in ThemeProvider**
```tsx
// In app/layout.tsx, ensure ThemeProvider wraps your app
import { ThemeProvider } from '@/lib/context/ThemeContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**3. Using `useTheme()` outside provider**
```tsx
// WRONG - useTheme not available outside provider
export function MyComponent() {
  const { theme } = useTheme()  // ERROR!
}

// CORRECT - ensure component is inside ThemeProvider
export function MyComponent() {
  const { preference } = useTheme()  // Works!
}
```

---

### Issue: FOUC (Flash of Unstyled Content) on Page Load

**Symptoms:**
- Page loads with light theme briefly
- Then switches to dark theme (flash/flicker)
- Only happens on hard refresh or cold load

**Cause:** Theme isn't applied before React renders

**Fix:** Verify FOUC prevention script in layout is in place and working. The inline script should be in the head section before other content, executing before React hydration.

---

### Issue: Contrast Ratio Too Low

**Symptoms:**
- Text hard to read in light mode or dark mode
- Accessibility checker reports contrast < 4.5:1
- WCAG violation

**Solution:** Use darker/lighter color from palette

**Example:** You used `--construction-gray` (#64748B) for text on white background

```
Contrast: #64748B on #ffffff = 4.9:1 (passes, but barely)
Better: #0A0A0A on #ffffff = 21.0:1 (much better!)
```

**Rule:** Use `--foreground` (#0A0A0A) for primary text, `--construction-gray` for secondary text.

---

### Issue: Color Looks Different in Dark Mode Than Expected

**Symptoms:**
- Color looks washed out or too bright
- Doesn't match the design mockup
- Status colors appear inverted

**Solution:** Check the CSS variable in globals.css

```css
:root.dark {
  --primary: #3B82F6;         /* Navy changed to blue - correct! */
  --status-at-risk: #9CA3AF;  /* Dark gray changed to light gray - correct! */
}
```

The palette intentionally changes some colors in dark mode for readability and contrast. This is correct behavior.

---

### Issue: Performance - Page Feels Sluggish When Toggling Theme

**Symptoms:**
- Clicking theme toggle causes lag
- Smooth transitions feel janky
- Page stutters

**Solution:** Ensure transition duration is reasonable

```tsx
// In globals.css, keep transitions fast
body {
  transition: background-color 150ms ease, color 150ms ease;
}

// Don't use slow transitions
transition-all 3s  // Too slow!
transition-all 150ms  // Good
```

---

## Dark Mode Architecture

### Why CSS Variables?

CSS variables allow us to change many colors instantly without updating individual components:

```css
/* Change once in globals.css... */
:root.dark {
  --primary: #3B82F6;
  --background: #0F0F0F;
  /* ... 17 total */
}

/* ...all components update automatically */
<div className="bg-primary text-foreground">
  /* Instantly uses dark mode colors! */
</div>
```

### Why `dark:` Prefix?

Tailwind's `dark:` prefix enables class-based dark mode:

```css
/* Tailwind generates both light and dark variants */
.bg-primary { background: var(--primary); }        /* Light */
.dark .bg-primary { background: var(--primary); }  /* Dark */
```

When `.dark` class is on `<html>`, dark CSS rules apply.

### Why 150ms Transition?

- **Fast enough** to feel responsive (not laggy)
- **Slow enough** for smooth visual transition (not jarring)
- **WCAG compliant** (doesn't cause animation sickness)
- **Accessible** (respects `prefers-reduced-motion` media query)

### Why No Pure White/Black?

**Light mode uses off-white (#F5F5F5)** and **dark mode uses near-black (#0F0F0F)**:

- Reduces eye strain compared to pure white/black
- Prevents OLED burn-in on dark OLED displays
- Still provides sufficient contrast (15.8:1)
- More comfortable for extended use

---

## Performance Notes

### Lazy Loading Impact

**Zero impact.** All CSS variables are:
- Pre-rendered in globals.css
- Available instantly
- No JavaScript parsing needed

### JavaScript Bundle Size

**Minimal impact:**
- ThemeContext: ≈2KB gzipped
- ThemeToggle: ≈1KB gzipped
- Total: ≈3KB (less than a typical image)

### Rendering Performance

**No performance regression:**
- CSS variable changes don't trigger React re-renders (managed by CSS)
- Theme provider uses React.memo and useMemo to prevent unnecessary renders
- Transitions use CSS (GPU-accelerated), not JavaScript animations

---

## Quick Links

### Reference Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `QUICK_REFERENCE.md` | One-page developer cheat sheet | Before coding |
| `COLOR_IMPLEMENTATION_GUIDE.md` | Copy-paste color guide | During implementation |
| `COLOR_VALIDATION_REPORT.md` | Complete technical analysis | For contrast ratio details |
| `COLOR_PALETTE.csv` | Machine-readable colors | For design tools |
| `ACCESSIBILITY_TESTING_GUIDE.md` | QA procedures | Before submitting |

### Related Files

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS variable definitions |
| `lib/context/ThemeContext.tsx` | Theme provider & useTheme hook |
| `components/theme/ThemeToggle.tsx` | Theme toggle button |
| `tailwind.config.ts` | Tailwind dark mode config |

### Implementation Examples

- **Simple Button:** Pattern 1 in this guide
- **Card Component:** Pattern 2 in this guide
- **Form Input:** Pattern 3 in this guide
- **Real Implementation:** See `components/theme/ThemeToggle.tsx`

---

## Support & FAQs

### Q: Can I use custom colors outside the palette?

**A:** No. Use only the 17 CSS variables from the palette. Custom colors:
- Break the design system consistency
- May violate WCAG contrast standards
- Won't adapt when palette is updated
- Complicate maintenance

---

### Q: What if my component needs a color not in the palette?

**A:** Add it to the palette first. Update:
1. `globals.css` (both `:root` and `:root.dark`)
2. `QUICK_REFERENCE.md`
3. Color validation report
4. This implementation guide

Then use it in your component.

---

### Q: Can I disable dark mode for a specific component?

**A:** Yes, but rarely needed. Use CSS to override:

```tsx
// Force light mode appearance in dark theme
<div className="bg-white dark:bg-white text-black dark:text-black">
  Always light
</div>
```

Most components should adapt to both modes for consistency.

---

### Q: How do I test on a real device?

**A:** Deploy to preview environment or use mobile browser:

1. **iPhone:** Change Settings > Display & Brightness to Dark
2. **Android:** Change Settings > Display > Dark Theme to On
3. **Open your app** - should automatically detect and apply dark mode
4. **Toggle manually** via app theme button to override

---

### Q: Why does my color look different in dark mode?

**A:** The palette intentionally changes colors for accessibility:

- **Navy → Blue:** Navy (#001B51) has 1.2:1 contrast on dark (unreadable). Blue (#3B82F6) has 7.8:1 (perfect).
- **Dark Gray → Light Gray:** Gray (#3C3C3C) invisible on dark backgrounds. Light gray (#9CA3AF) visible and readable.
- **Bright Yellow:** Original yellow needs slight brightening (#FBBF24 → #FCD34D) for better CTA visibility.

This is correct and intentional.

---

### Q: Do I need to worry about FOUC?

**A:** No, it's handled automatically by the inline script in `app/layout.tsx`. Just verify:

1. Hard refresh page with dark mode preference saved
2. Should NOT see white flash before dark theme applies
3. Should show dark theme immediately

If you see a flash, the script isn't working - check the browser console.

---

### Q: What browsers are supported?

**A:** All modern browsers (last 2 years):
- Chrome 90+
- Safari 14+
- Firefox 85+
- Edge 90+
- Mobile browsers on iOS 14+ and Android 10+

CSS variables and `prefers-color-scheme` media query support varies but all modern browsers support both.

---

### Q: Can I use inline styles instead of Tailwind classes?

**A:** Not recommended. Use Tailwind classes instead:

```tsx
// Not recommended - hard to maintain
<div style={{ backgroundColor: 'var(--primary)' }}>

// Recommended - consistent and clean
<div className="bg-primary dark:bg-primary">
```

---

## Next Steps

1. **Read QUICK_REFERENCE.md** for a one-page cheat sheet
2. **Follow Pattern 1-3** for your component type
3. **Test in both modes** (light and dark)
4. **Verify contrast ratio** (≥4.5:1)
5. **Submit for review**

---

**Questions?** See the Support & FAQs section above.

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**Status:** Approved for Production
