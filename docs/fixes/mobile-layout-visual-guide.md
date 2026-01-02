# Mobile Layout Visual Guide - TaskTemplateManager

## Before Fix (Horizontal Overflow)

### iPhone SE @ 375px
```
┌─────────────────────────────────────────────┐
│ [Drag][#][Type Badge] Very Long Task Ti... │ ← Overflow!
└─────────────────────────────────────────────┴────→
                                              [Priority][Edit][Delete] ← Off screen
```

**Problem:**
- Elements stacked horizontally exceed 375px width
- Horizontal scroll required to see buttons
- Poor UX on mobile devices

---

## After Fix (Responsive Stacking)

### iPhone SE @ 375px (Mobile Layout)

```
┌─────────────────────────────────────────┐
│                                         │
│  [Drag Handle]  Very Long Task Title   │ ← Row 1: Drag + Title
│                 (truncated properly)    │
│                                         │
│      [#] [Work Badge] [High Priority]  │ ← Row 2: Badges
│                                         │
│      [Edit Button]  [Delete Button]    │ ← Row 3: Actions (44px tall)
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- No horizontal scroll
- All content visible
- Proper text truncation
- Touch-friendly 44px buttons

---

### iPad @ 768px (Small Desktop Layout)

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  [Drag] [#] [Work] Very Long Task Title [High] [Edit][Delete]│
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Features:**
- Single horizontal row
- Compact design
- Hover effects enabled

---

### Desktop @ 1024px+ (Full Desktop Layout)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [Drag] [#] [Work Badge] Task Title Here [Priority Badge] [Edit] [Delete]  │
│                          Description text shown below                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Spacious layout
- Description visible
- Optimal for mouse/keyboard

---

## Touch Target Comparison

### Before (Too Small)
```
Drag Handle: 32px × 32px ❌
Edit Button: 32px × 32px ❌
Delete Button: 32px × 32px ❌
```

### After (WCAG Compliant)
```
Mobile:
  Drag Handle: 44px × 44px ✅
  Edit Button: 44px × full width ✅
  Delete Button: 44px × full width ✅

Desktop:
  Drag Handle: 32px × 32px (mouse-friendly)
  Edit Button: 32px × auto (hover-friendly)
  Delete Button: 32px × auto (hover-friendly)
```

---

## Layout Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TaskTemplateManager                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── <640px (Mobile)
                            │    ↓
                            │    [Vertical Stack]
                            │    • Row 1: Drag + Title
                            │    • Row 2: Index + Badges
                            │    • Row 3: Buttons (full width)
                            │
                            └─── ≥640px (Desktop)
                                 ↓
                                 [Horizontal Row]
                                 • All elements in single row
                                 • Compact spacing
                                 • Hover effects
```

---

## Responsive Classes Used

| Element | Mobile (<640px) | Desktop (≥640px) |
|---------|----------------|------------------|
| Container | `flex flex-col` | `sm:flex-row` |
| Drag Handle | `p-3` (44px) | `sm:p-2` (32px) |
| Index Badge (Desktop) | `hidden` | `sm:flex` |
| Index Badge (Mobile) | `flex` | `sm:hidden` |
| Badges Row | `pl-11` (align) | `sm:pl-0` |
| Buttons Row | `pl-11` (align) | `sm:pl-0 sm:ml-auto` |
| Edit/Delete | `h-11 flex-1` | `sm:h-8 sm:flex-none` |

---

## CSS Classes Reference

### Mobile-First Stacking
```css
flex flex-col          /* Stack vertically by default */
sm:flex-row           /* Switch to horizontal on ≥640px */
sm:items-center       /* Center items vertically on desktop */
gap-2 sm:gap-3        /* Smaller gap on mobile, larger on desktop */
```

### Touch Optimization
```css
touch-manipulation    /* Prevent double-tap zoom delays */
p-3 sm:p-2           /* Larger padding on mobile */
h-11 sm:h-8          /* Taller buttons on mobile */
```

### Responsive Visibility
```css
hidden sm:flex       /* Hide on mobile, show on desktop */
flex sm:hidden       /* Show on mobile, hide on desktop */
```

### Layout Alignment
```css
pl-11 sm:pl-0        /* Left padding on mobile to align with drag handle */
flex-1 sm:flex-none  /* Full width on mobile, auto on desktop */
sm:ml-auto           /* Push to right on desktop */
```

---

## Testing Screenshots Checklist

When testing, verify at these exact widths:

1. **375px** - iPhone SE (smallest iPhone)
   - [ ] No horizontal scroll
   - [ ] All buttons visible
   - [ ] Drag handle easy to grab

2. **390px** - iPhone 12/13/14
   - [ ] Content fits comfortably
   - [ ] Proper spacing maintained

3. **414px** - iPhone Pro Max
   - [ ] Still stacked layout
   - [ ] No wasted space

4. **640px** - Breakpoint
   - [ ] Smooth transition to horizontal
   - [ ] No layout jump

5. **768px** - iPad Portrait
   - [ ] Full horizontal layout
   - [ ] Hover effects work

6. **1024px** - Desktop
   - [ ] Optimal spacing
   - [ ] All features visible

---

## Common Issues and Solutions

### Issue: Buttons still too small
**Solution:** Ensure `h-11` is applied on mobile (`sm:h-8` for desktop)

### Issue: Horizontal scroll at 375px
**Solution:** Check for:
- Fixed widths without responsive variants
- Missing `min-w-0` on flex children
- Oversized badges or padding

### Issue: Index badge shows twice
**Solution:** Check visibility classes:
- Desktop: `hidden sm:flex`
- Mobile: `flex sm:hidden`

### Issue: Buttons not aligned with title
**Solution:** Apply `pl-11` to rows 2 and 3 to match drag handle width

---

**For a live demo, test the component at:**
- `/app/settings` → Project Configuration → Task Templates
- Use browser DevTools responsive mode
- Test touch events with device emulation

