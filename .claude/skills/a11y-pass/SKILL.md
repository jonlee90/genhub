---
name: a11y-pass
description: "Accessibility audit and fixes for GenHub PWA. Checks WCAG 2.1 AA compliance with focus on mobile touch targets, color contrast, and screen reader support."
---

# Accessibility Pass

Audit and fix accessibility issues in GenHub components.

## Trigger

- "accessibility audit"
- "a11y check"
- "fix accessibility"
- "WCAG compliance"
- Before major releases

## GenHub A11y Requirements

| Requirement | Standard | GenHub Rule |
|-------------|----------|-------------|
| Touch targets | WCAG 2.5.5 | 44px minimum |
| Color contrast | WCAG 1.4.3 | 4.5:1 text, 3:1 UI |
| Focus indicators | WCAG 2.4.7 | Visible focus ring |
| Screen reader | WCAG 4.1.2 | Proper ARIA labels |
| Motion | WCAG 2.3.3 | Respect prefers-reduced-motion |

## Audit Checklist

### 1. Touch Targets (Mobile Critical)

```bash
# Find buttons without proper sizing
grep -rn "<button" components/ --include="*.tsx" | \
  xargs grep -L "min-h-\[44px\]\|h-14\|h-12\|min-w-\[44px\]"
```

**Fix Pattern:**
```tsx
// ❌ Too small
<button className="p-2">Click</button>

// ✅ Proper size
<button className="min-h-[44px] min-w-[44px] p-2">Click</button>
```

### 2. Color Contrast

**Design System Colors (Pre-approved):**
| Color | On White | On Dark | Status |
|-------|----------|---------|--------|
| `#001B51` | 12.6:1 | - | ✓ |
| `#3C3C3C` | 10.1:1 | - | ✓ |
| `#059669` | 3.5:1 | - | ⚠️ Large text only |
| `#DC2626` | 4.0:1 | - | ⚠️ Large text only |

```bash
# Find custom colors that may fail contrast
grep -rn "#[0-9a-fA-F]\{6\}" components/ --include="*.tsx" | \
  grep -v "001B51\|3C3C3C\|059669\|DC2626\|F59E0B\|ffffff\|000000"
```

### 3. Focus Indicators

```bash
# Find interactive elements without focus styles
grep -rn "<button\|<a \|<input\|<select" components/ --include="*.tsx" | \
  xargs grep -L "focus:\|focus-visible:"
```

**Fix Pattern:**
```tsx
// ❌ No focus indicator
<button className="bg-blue-500">Submit</button>

// ✅ With focus indicator
<button className="bg-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-[#001B51]">
  Submit
</button>
```

### 4. ARIA Labels

```bash
# Find images without alt
grep -rn "<img" components/ --include="*.tsx" | xargs grep -L "alt="

# Find buttons with only icons
grep -rn "<button.*<.*Icon" components/ --include="*.tsx" | \
  xargs grep -L "aria-label\|sr-only"
```

**Fix Pattern:**
```tsx
// ❌ Icon-only button without label
<button><X className="w-5 h-5" /></button>

// ✅ With accessible label
<button aria-label="Close dialog">
  <X className="w-5 h-5" />
</button>

// ✅ Or with sr-only text
<button>
  <X className="w-5 h-5" />
  <span className="sr-only">Close dialog</span>
</button>
```

### 5. Form Labels

```bash
# Find inputs without labels
grep -rn "<input" components/ --include="*.tsx" | \
  xargs grep -L "aria-label\|aria-labelledby\|<label"
```

**Fix Pattern:**
```tsx
// ❌ Input without label
<input type="text" placeholder="Name" />

// ✅ With label
<label>
  <span className="sr-only">Name</span>
  <input type="text" placeholder="Name" />
</label>

// ✅ Or with aria-label
<input type="text" placeholder="Name" aria-label="Your name" />
```

### 6. Reduced Motion

```bash
# Find animations without motion preference check
grep -rn "animate-\|transition-" components/ --include="*.tsx" | \
  xargs grep -L "motion-reduce:\|prefers-reduced-motion"
```

**Fix Pattern:**
```tsx
// ❌ Always animates
<div className="animate-bounce">Loading</div>

// ✅ Respects preference
<div className="animate-bounce motion-reduce:animate-none">Loading</div>
```

## Workflow

### Phase 1: Automated Scan

Run all detection commands, collect issues.

### Phase 2: Severity Classification

| Severity | Issue Type |
|----------|------------|
| CRITICAL | Missing touch targets on primary actions |
| CRITICAL | No alt text on informational images |
| HIGH | Missing ARIA labels on icon buttons |
| HIGH | Form inputs without labels |
| MEDIUM | Missing focus indicators |
| LOW | Decorative images without alt="" |

### Phase 3: Fix Issues

For each issue:
1. Identify file and line
2. Apply fix pattern
3. Verify fix works

### Phase 4: Verification

```bash
# Build check
npm run build

# Optional: Run axe-core if available
npx axe components/
```

## Output Format

```
## Accessibility Audit Report

**Scope:** {files/components audited}
**Standard:** WCAG 2.1 AA

### Summary
| Category | Issues | Fixed |
|----------|--------|-------|
| Touch Targets | 3 | 3 |
| Color Contrast | 1 | 1 |
| ARIA Labels | 5 | 5 |
| Focus Indicators | 2 | 2 |
| Form Labels | 4 | 4 |

### Issues Found & Fixed

#### Critical
- `TaskCard.tsx:15` - Button 32px → 44px ✓ Fixed
- `IconButton.tsx:8` - Added aria-label ✓ Fixed

#### High
- `SearchInput.tsx:22` - Added label ✓ Fixed

#### Medium
- `NavLink.tsx:12` - Added focus:ring ✓ Fixed

### Remaining Issues
- None

### Recommendations
- Consider adding skip-to-main link
- Add aria-live regions for dynamic content

### Build Verification
✓ TypeScript: No errors
✓ Build: Passed
```

## GenHub-Specific Patterns

### Touch Button (Accessible)

```tsx
<button
  className="
    min-h-[44px] min-w-[44px] px-6
    bg-[#001B51] text-white font-semibold
    rounded-xl flex items-center justify-center gap-2
    active:scale-[0.98] motion-reduce:transform-none
    focus:ring-2 focus:ring-offset-2 focus:ring-[#001B51]
    disabled:opacity-50
  "
  aria-label={ariaLabel}
>
  <Check className="w-5 h-5" aria-hidden="true" />
  <span>Save</span>
</button>
```

### Icon Button (Accessible)

```tsx
<button
  className="
    min-h-[44px] min-w-[44px] p-2
    rounded-lg hover:bg-gray-100
    focus:ring-2 focus:ring-[#001B51]
  "
  aria-label="Close dialog"
>
  <X className="w-5 h-5" aria-hidden="true" />
</button>
```
