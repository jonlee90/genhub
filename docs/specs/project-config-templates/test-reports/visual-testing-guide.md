# Visual Testing Guide - Responsive Layout Issues

**Purpose:** Visual reference for testing responsive behavior before and after fixes
**Use with:** Chrome DevTools Device Mode, Real Devices

---

## How to Test

### Using Chrome DevTools

1. **Open DevTools:** `Cmd+Opt+I` (Mac) or `F12` (Windows/Linux)
2. **Toggle Device Mode:** `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows/Linux)
3. **Select Device:** Choose from preset or custom dimensions
4. **Test Touch:** Enable "Show rulers" and "Add device frame"

### Custom Test Dimensions

```
Mobile Small:  320 × 568  (iPhone SE 1st gen)
Mobile Standard: 375 × 667  (iPhone SE 2nd/3rd gen)
Mobile Large:  390 × 844  (iPhone 12/13)
Tablet Small:  768 × 1024 (iPad Mini)
Tablet Large:  1024 × 1366 (iPad Pro)
Desktop:       1280 × 720  (Standard laptop)
```

---

## TaskTypeManager - ✅ PASS (Minor improvements recommended)

### Mobile (375px) - Grid Layout

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│ TASK TYPES                    [+ Add]│
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [🔨] Material Purchase         │ │
│  │      Track material costs...   │ │
│  │                                │ │
│  │                 [Edit] [Delete]│ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [📋] Site Inspection           │ │
│  │      Daily site checks...      │ │
│  │                                │ │
│  │                 [Edit] [Delete]│ │
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Cards stack in single column
- ✅ Card width fills container minus padding
- ✅ Badges don't wrap awkwardly
- ✅ Edit/Delete buttons are tappable (check with finger/cursor)
- ⚠️ Buttons slightly small for thumbs (32px) - recommended 44px

### Tablet (768px) - 2 Columns

**Expected Behavior:**
```
┌─────────────────────────────────────────────────────────────┐
│ TASK TYPES                                          [+ Add] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ [🔨] Material       │  │ [📋] Site Inspection│          │
│  │      Purchase       │  │      Daily checks..│          │
│  │                     │  │                     │          │
│  │      [Edit][Delete] │  │      [Edit][Delete] │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Test Points:**
- ✅ 2-column grid activates at 768px
- ✅ Cards have equal width
- ✅ Gap between cards is 24px
- ✅ Content doesn't overflow horizontally

### Desktop (1024px+) - 3 Columns

**Expected Behavior:**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ TASK TYPES                                                       [+ Add] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │ [🔨] Material │  │ [📋] Site     │  │ [✓] Final     │                │
│  │      Purchase │  │      Inspect  │  │      Approve  │                │
│  │               │  │               │  │               │                │
│  │  [Edit][Del]  │  │  [Edit][Del]  │  │  [Edit][Del]  │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Test Points:**
- ✅ 3-column grid at 1024px+
- ✅ Cards maintain aspect ratio
- ✅ Hover effects work (gradient glow, scale icon)

---

## PhaseTemplateManager - ⚠️ PASS with Recommendations (92/100)

### Mobile (375px) - Vertical List

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│ PHASE TEMPLATES                     │
│ [Project Type ▾]           [+ Add]  │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [≡] [>] [📊] Foundation       │ │
│  │              Pour concrete...  │ │
│  │              3 tasks           │ │
│  │                 [Edit] [Delete]│ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [≡] [>] [📊] Framing          │ │
│  │              Install studs...  │ │
│  │              5 tasks           │ │
│  │                 [Edit] [Delete]│ │
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Cards stack vertically
- ✅ Drag handles visible and tappable
- ⚠️ Drag handle touch target is 36px (recommended 44px) **FIX NEEDED**
- ✅ Expand/collapse button works
- ✅ Phase name truncates if too long
- ⚠️ On 320px: Layout very cramped **EDGE CASE**

### Mobile (375px) - Expanded Phase

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│  [≡] [v] [📊] Foundation           │
│              Pour concrete base     │
│              3 tasks                │
│              ─────────────────────  │
│              TASK TEMPLATES         │
│              ┌───────────────────┐  │
│              │[Work] Pour Concrete│  │
│              │      Mix and pour │  │
│              │               [High]│  │
│              └───────────────────┘  │
│              ┌───────────────────┐  │
│              │[Work] Install Rebar│  │
│              │      Place steel  │  │
│              │             [Medium]│  │
│              └───────────────────┘  │
│                 [Edit] [Delete]     │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Expansion animation smooth (framer-motion)
- ✅ Task templates list readable
- ✅ Task type badges display with icons
- ✅ Priority badges color-coded
- ✅ Scroll within expanded section works

### Drag-and-Drop Testing (Touch)

**Test Steps:**
1. Open on real touch device (iPhone/iPad/Android)
2. Long-press drag handle (≡ icon)
3. Drag phase card up/down
4. Release to drop

**Expected Behavior:**
- ✅ Drag initiates after long press (~300ms)
- ✅ Visual feedback: Card lifts, opacity reduces
- ✅ Other cards shift to make space
- ✅ Drop snaps into position
- ✅ Order persists (backend save)

**Current Issues:**
- ⚠️ Drag handle small (36px) - harder to grab with thumb
- ✅ Otherwise works well on touch

---

## TaskTemplateManager - 🔴 FAIL (65/100) - CRITICAL FIX REQUIRED

### Mobile (375px) - 🔴 BROKEN LAYOUT

**Current Behavior (BEFORE FIX):**
```
┌─────────────────────────────────────┐
│ [≡][1][Work]Foundation...[M][Ed[Del]│ ← OVERFLOW!
└─────────────────────────────────────┘
```

**Visual Issues:**
- 🔴 Horizontal scrollbar appears
- 🔴 Task title cut off or invisible
- 🔴 Description never visible
- 🔴 Buttons partially off-screen

**Test to Reproduce:**
1. Open DevTools, set width to 375px
2. Navigate to Task Templates section
3. Select any project type and phase
4. Observe horizontal overflow

**Expected Behavior (AFTER FIX):**
```
┌─────────────────────────────────────┐
│  [≡] [1] Foundation Pour and Cure   │
│          Install waterproofing...   │
│                                     │
│  [Work] [Medium]    [Edit] [Delete] │
└─────────────────────────────────────┘
```

**After Fix Test Points:**
- ✅ No horizontal scroll
- ✅ Task title fully visible
- ✅ Description shows on second line
- ✅ All buttons accessible
- ✅ Badges and buttons on separate row

### Mobile (375px) - Fixed Layout Breakdown

```
Row 1: Drag + Index + Title (full width available)
┌────────────────────────────────────────┐
│ [≡]  [1]  Foundation Pour and Cure     │
│           Install waterproofing...     │
└────────────────────────────────────────┘
  44px 32px  ~275px remaining

Row 2: Badges + Buttons (space-between)
┌────────────────────────────────────────┐
│ [Work] [Medium]         [Edit] [Delete]│
└────────────────────────────────────────┘
  80px   60px           100px

Total height: ~80px (2 rows + padding)
```

### Tablet (768px+) - Horizontal Layout

**Expected Behavior (AFTER FIX):**
```
┌──────────────────────────────────────────────────────────────┐
│ [≡] [1] [Work] Foundation Pour and Cure [Med] [Edit][Delete] │
└──────────────────────────────────────────────────────────────┘
```

**Test Points:**
- ✅ Single horizontal row at 768px+
- ✅ All elements inline
- ✅ Button text visible ("Edit", "Delete")
- ✅ Task description truncates with ellipsis

### Drag-and-Drop Testing

**Test Steps:**
1. Ensure task templates loaded
2. Drag using handle (≡ icon)
3. Reorder tasks within phase

**Expected Behavior:**
- ✅ Drag handle large enough to grab (44px on mobile after fix)
- ✅ Visual feedback during drag
- ✅ Snap to grid positions
- ✅ Order index updates automatically

---

## ManagePhasesModal - ✅ PASS (95/100)

### Mobile (375px) - List Mode

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│ MANAGE PHASES                       │
│ Add, edit, or remove project phases │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [1] Foundation                 │ │
│  │     Pour concrete base         │ │
│  │                 [✏️] [🗑️]      │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [2] Framing                    │ │
│  │     Install wall studs         │ │
│  │                 [✏️] [🗑️]      │ │
│  └────────────────────────────────┘ │
│                                     │
│                                     │
│ [Back]                     [+ Add]  │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Cards stack properly
- ✅ Index badge visible (40px)
- ✅ Phase name wraps if long
- ✅ Description truncates (line-clamp-1)
- ⚠️ Edit/Delete buttons hidden until interaction **FIX NEEDED**

**Current Issue:**
- Phase cards use `opacity-0 group-hover:opacity-100` for buttons
- On touch devices, `group-hover` never triggers
- Buttons invisible unless tapped (accidental discovery)

**After Fix:**
- Buttons always visible on mobile (`opacity-100 sm:opacity-0`)
- Hover-reveal on desktop (`sm:group-hover:opacity-100`)

### Mobile (375px) - Create/Edit Mode

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│ CREATE NEW PHASE                    │
│ Add a new phase to your project     │
├─────────────────────────────────────┤
│                                     │
│  Phase Name *                       │
│  ┌────────────────────────────────┐ │
│  │ Foundation Work                │ │
│  └────────────────────────────────┘ │
│                                     │
│  Description                        │
│  ┌────────────────────────────────┐ │
│  │ Pour and cure concrete base    │ │
│  │                                │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                     │
│                                     │
│ [Back]              [Create Phase]  │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Input fields full width
- ✅ Labels readable
- ✅ Textarea adequate height (3 rows)
- ✅ Keyboard shows on focus (mobile)
- ✅ Submit button accessible

### Mobile (375px) - Delete Mode

**Expected Behavior:**
```
┌─────────────────────────────────────┐
│ DELETE PHASE                        │
│ Choose how to handle tasks          │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ Delete "Foundation"?            │
│     This cannot be undone.          │
│                                     │
│  Task Handling                      │
│  ┌────────────────────────────────┐ │
│  │ Move tasks to another phase ▾  │ │
│  └────────────────────────────────┘ │
│                                     │
│  Target Phase *                     │
│  ┌────────────────────────────────┐ │
│  │ Select a phase ▾               │ │
│  └────────────────────────────────┘ │
│                                     │
│                                     │
│ [Back]              [Delete Phase]  │
└─────────────────────────────────────┘
```

**Test Points:**
- ✅ Warning message visible
- ✅ Dropdowns functional
- ✅ Conditional target phase shows/hides smoothly
- ✅ Delete button clearly marked (red)

---

## Modal Responsiveness Testing

All modals use `BaseModal` component. Test each modal at these breakpoints:

### Mobile (375px)
- ✅ Modal fills screen with padding
- ✅ Header sticky at top
- ✅ Footer sticky at bottom
- ✅ Content scrollable
- ✅ Close button accessible (top-right)

### Tablet (768px)
- ✅ Modal centered with max-width
- ✅ Backdrop visible around modal
- ✅ Click outside to close works

### Desktop (1280px)
- ✅ Modal appropriate width (sm/md/lg/xl/2xl)
- ✅ Centered vertically and horizontally
- ✅ Content readable without scroll (if possible)

---

## Touch Target Testing

**WCAG 2.1 Level AAA:** 44px × 44px minimum

### How to Test

1. **Enable Touch Emulation** in DevTools
2. **Show Tap Highlights:** Settings → Devices → Show mobile touch cursors
3. **Measure Touch Targets:** Use DevTools "Select element" mode

### Components to Check

**TaskTypeManager:**
- Card Edit button: ~32px (should be 40-44px) ⚠️
- Card Delete button: ~32px (should be 40-44px) ⚠️

**PhaseTemplateManager:**
- Drag handle: ~36px (should be 44px) ⚠️ **FIX NEEDED**
- Edit/Delete buttons: ~32px (should be 40-44px) ⚠️

**TaskTemplateManager:**
- Drag handle: ~36px (should be 44px) ⚠️
- Edit button (mobile): 40px after fix ✅
- Delete button (mobile): 40px after fix ✅

**ManagePhasesModal:**
- Edit button: 32px → 40px after fix ✅
- Delete button: 32px → 40px after fix ✅

---

## Text Truncation Testing

### Test Cases

**Long Task Type Name (50 chars):**
```
"Material Purchase and Delivery Coordination"
```

**Expected:**
- Mobile: "Material Purchase and Deliv..."
- Desktop: Full name visible

**Very Long Phase Name (100 chars):**
```
"Foundation and Concrete Work Including Waterproofing and Structural Reinforcement"
```

**Expected:**
- Card title: Truncates with ellipsis
- Hover tooltip (future enhancement): Shows full text

**Long Description (200 chars):**
```
"This phase includes all foundation work such as excavation, formwork, rebar installation, concrete pouring, curing, and waterproofing membrane application. Ensure proper inspection before proceeding."
```

**Expected:**
- Card description: Shows 1-2 lines with `line-clamp-1` or `line-clamp-2`
- Modal full description: Shows all text, wraps naturally

---

## Animation Testing

### Animations to Test

**Framer Motion Animations:**
1. Card entrance (stagger effect)
2. Phase expansion/collapse
3. Modal transitions (slide in/out)
4. Drag-drop hover effects

**Test Steps:**
1. **Reduce Motion:** Check `prefers-reduced-motion` media query
2. **Performance:** No janky animations on 60Hz displays
3. **Touch:** Animations don't block touch interactions

**Expected:**
- ✅ Smooth 60fps on modern devices
- ✅ Respects `prefers-reduced-motion: reduce`
- ✅ No animation during SSR (Next.js)

---

## Accessibility Testing Checklist

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus visible (blue outline)
- [ ] Enter activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists (future enhancement)

### Screen Reader
- [ ] VoiceOver announces component names
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Drag-drop operations described

### Color Contrast
- [ ] Text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Badges readable on background
- [ ] Focus indicators visible
- [ ] Disabled state obvious

### Touch Gestures
- [ ] No hover-only interactions
- [ ] Swipe gestures work (if applicable)
- [ ] Long-press for context menu
- [ ] Pinch-zoom not blocked

---

## Browser Testing Matrix

| Browser | Version | Mobile | Tablet | Desktop | Status |
|---------|---------|--------|--------|---------|--------|
| Safari iOS | 16+ | ✅ | ✅ | N/A | Test on real device |
| Chrome Android | Latest | ✅ | ✅ | N/A | Test on real device |
| Chrome Desktop | Latest | N/A | ✅ | ✅ | Dev mode |
| Firefox Desktop | Latest | N/A | ✅ | ✅ | Dev mode |
| Safari macOS | Latest | N/A | ✅ | ✅ | Dev mode |
| Edge | Latest | N/A | ✅ | ✅ | Optional |

---

## Real Device Testing Protocol

### Before Testing
1. ✅ Clear browser cache
2. ✅ Disable browser extensions
3. ✅ Use private/incognito mode
4. ✅ Test with real data (not lorem ipsum)

### During Testing
1. ✅ Try with one hand (thumb reach)
2. ✅ Test in portrait and landscape
3. ✅ Test with screen rotation locked
4. ✅ Test with large text size (accessibility settings)
5. ✅ Test with poor network (throttle to 3G)

### What to Look For
- 🔴 Layout breaking or horizontal scroll
- ⚠️ Buttons too small to tap reliably
- ⚠️ Text too small to read
- ⚠️ Actions requiring precise taps
- ⚠️ Animations causing jank or lag

---

## Issue Reporting Template

When you find an issue:

```markdown
### Issue: [Brief Description]

**Component:** TaskTemplateManager / PhaseTemplateManager / TaskTypeManager / ManagePhasesModal
**Screen Size:** 375px mobile / 768px tablet / 1280px desktop
**Browser:** Safari iOS 16 / Chrome Android / Desktop
**Severity:** 🔴 Critical / ⚠️ Moderate / ✅ Minor

**Description:**
[What's wrong? What did you expect?]

**Steps to Reproduce:**
1. Navigate to...
2. Select...
3. Observe...

**Screenshot:**
[Attach screenshot if possible]

**Recommended Fix:**
[Optional: Your suggestion]
```

---

## Post-Fix Verification

After implementing fixes from `responsive-fixes-required.md`:

### TaskTemplateManager
- [ ] No horizontal scroll on 375px
- [ ] Task titles fully visible
- [ ] Descriptions show on mobile
- [ ] Buttons tappable (44px touch target)
- [ ] Drag handles easy to grab (44px)
- [ ] Layout switches to horizontal at 768px

### PhaseTemplateManager
- [ ] Drag handles 44px on mobile
- [ ] Phase cards work on 320px (edge case)
- [ ] Buttons tappable
- [ ] Expansion smooth

### ManagePhasesModal
- [ ] Edit/Delete buttons always visible on mobile
- [ ] Buttons 40px minimum
- [ ] Hover-reveal works on desktop

### All Components
- [ ] No layout shift during loading
- [ ] Smooth animations (60fps)
- [ ] Touch interactions work
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

**Next Step:** Implement fixes and re-test using this guide!
