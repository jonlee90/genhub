# Dark Mode - Implementation Tasks

## References
- Requirements: `.claude/specs/dark-mode/requirements.md`
- Design: `.claude/specs/dark-mode/design.md`

---

## Phase 1: Foundation Setup

### Task 1.1: Derive Complete Dark Mode Color Palette & Document Contrast Ratios
- **Agent:** supabase-schema-architect (design authority)
- **Estimated Time:** 2-3 hours
- **Output:**
  - Color validation report (contrast ratios for all token pairs)
  - Spreadsheet/CSV with light/dark hex values and contrast scores
  - WCAG compliance checklist

**Requirements:**
- Compute contrast ratio (1-21 scale) for all CSS variable pairs in both light and dark modes
- Validate that all text elements meet or exceed WCAG AA (4.5:1) standard
- Ensure status colors (green, red, gray, blue) maintain semantic meaning in both modes
- Construction yellow (#FBBF24) must show 4.5:1+ contrast on dark background
- Document which color pairs exceed WCAG AAA (7:1) for premium accessibility
- Create reference table for implementation team

**Acceptance Criteria:**
- [ ] All 17 CSS variables have documented hex values for both light and dark modes
- [ ] Contrast ratio calculated for all 34 text/background combinations (17 variables x 2 modes)
- [ ] 100% of text pairs achieve minimum 4.5:1 contrast (WCAG AA)
- [ ] At least 80% of pairs achieve 7:1 contrast (WCAG AAA)
- [ ] Status colors validated: on-track green, delayed red, at-risk gray remain distinct in both modes
- [ ] Construction yellow validated for visibility on dark backgrounds
- [ ] Report includes color samples (visual comparison of light vs dark)
- [ ] Team can reference this as single source of truth for implementation

**Dependencies:** None

---

### Task 1.2: Update globals.css with Dark Mode CSS Variables
- **Agent:** frontend-engineer
- **Skill:** CSS fundamentals, CSS custom properties
- **Estimated Time:** 1-2 hours
- **Output:** Updated `/Users/jonathanlee/Desktop/genhub/app/globals.css`

**Requirements:**
- Add `:root.dark` selector to globals.css containing all dark mode variable overrides
- Keep light mode (`:root`) completely unchanged
- Include all 17 color tokens: background, foreground, primary, borders, construction colors, status colors, surface variants
- Add smooth transition rules (150ms) for theme-affected properties
- Ensure shadows adapt for dark mode (use darker rgba values)
- Respect `prefers-reduced-motion: reduce` media query for accessibility
- No breaking changes to existing light mode styles

**Acceptance Criteria:**
- [ ] `:root.dark` section added to globals.css with all dark mode colors
- [ ] Light mode `:root` section unchanged
- [ ] All color tokens override in dark mode
- [ ] Shadow definitions adapted for dark backgrounds
- [ ] `body` element includes smooth transition for background-color and color
- [ ] `@media (prefers-reduced-motion: reduce)` disables transitions when needed
- [ ] Build passes without errors
- [ ] No console warnings about CSS variables
- [ ] Light mode still works correctly (verify by toggling .dark class in DevTools)

**Dependencies:** Task 1.1 (color palette finalized)

---

### Task 1.3: Update tailwind.config.ts to Enable Dark Mode Support
- **Agent:** frontend-engineer
- **Skill:** Tailwind CSS configuration
- **Estimated Time:** 30 minutes
- **Output:** Updated `/Users/jonathanlee/Desktop/genhub/tailwind.config.ts`

**Requirements:**
- Add `darkMode: 'class'` configuration to tailwind.config.ts
- No changes to existing color definitions (they already use CSS variables)
- No changes to safelist or extend configurations
- Verify that `dark:` prefix utilities will work automatically

**Acceptance Criteria:**
- [ ] `darkMode: 'class'` added to export default config
- [ ] Build passes without errors
- [ ] Tailwind CLI recognizes dark: prefix in utilities
- [ ] Safelist remains unchanged
- [ ] No webpack/build warnings
- [ ] Can inspect build output and see dark: prefixed CSS rules

**Dependencies:** Task 1.2 (CSS variables defined first)

---

## Phase 2: Context & State Management

### Task 2.1: Create ThemeProvider Context + useTheme Hook
- **Agent:** frontend-engineer
- **Skill:** React context, hooks, localStorage, useLayoutEffect
- **Estimated Time:** 2-3 hours
- **Output:**
  - `/Users/jonathanlee/Desktop/genhub/lib/context/ThemeContext.tsx` (new file)
  - TypeScript interfaces: `ThemeContextType`, `ThemeState`

**Requirements:**
- Create `ThemeContext` using React.createContext
- Implement `ThemeProvider` component that:
  - Reads localStorage for saved preference on useLayoutEffect mount
  - Detects system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
  - Provides theme state and setter functions via context value
  - Applies/removes `.dark` class on `<html>` element
  - Uses useMemo to prevent unnecessary re-renders
- Implement `useTheme()` hook with error handling for usage outside provider
- Support three preference modes: 'light', 'dark', 'system'
- When preference='system', resolve to actual theme based on OS setting
- Persist preference to localStorage with timestamp

**Acceptance Criteria:**
- [ ] ThemeProvider wraps children properly
- [ ] useTheme hook returns correct interface
- [ ] useLayoutEffect runs before React paint (prevents FOUC on rehydration)
- [ ] localStorage reads/writes successfully
- [ ] .dark class applied to html element when dark mode active
- [ ] .dark class removed from html when light mode active
- [ ] System preference detection works (test by changing OS theme)
- [ ] useMemo applied to prevent re-renders of child components
- [ ] Error message thrown when useTheme used outside provider
- [ ] No console errors on mount/unmount
- [ ] TypeScript types are strict and complete

**Dependencies:** Tasks 1.1-1.3 (foundation complete)

---

### Task 2.2: Add FOUC Prevention Script to RootLayout
- **Agent:** frontend-engineer
- **Skill:** Next.js layout, inline scripts, browser timing
- **Estimated Time:** 1 hour
- **Output:** Updated `app/layout.tsx` with theme initialization script

**Requirements:**
- Add inline script to RootLayout that runs before CSS download
- Script must:
  - Read localStorage for saved theme preference
  - Safely parse JSON with error handling
  - Detect system preference via matchMedia
  - Apply .dark class to <html> if needed
  - Execute BEFORE React hydration
- Place script in `<head>` section, before other scripts
- Use hardcoded template literal (safe approach without dangerouslySetInnerHTML)
- Script must survive minification and tree-shaking

**Acceptance Criteria:**
- [ ] Script placed in RootLayout.tsx `<head>` section
- [ ] Script runs before CSS is loaded (verify via DevTools network)
- [ ] No FOUC on page load in dark mode (hard refresh test)
- [ ] Script handles localStorage errors gracefully
- [ ] Script handles matchMedia unavailable (fallback to light)
- [ ] .dark class correctly applied before first paint
- [ ] Works when JavaScript is disabled (inline script still runs)
- [ ] No TypeScript errors
- [ ] Build size increases less than 1KB

**Dependencies:** Task 2.1 (ThemeProvider logic finalized)

---

## Phase 3: UI Components

### Task 3.1: Create ThemeToggle Component
- **Agent:** frontend-engineer
- **Skill:** React components, Lucide icons, useCallback, memo
- **Estimated Time:** 1-2 hours
- **Output:** `/Users/jonathanlee/Desktop/genhub/components/theme/ThemeToggle.tsx` (new file)

**Requirements:**
- Create `ThemeToggle` component that:
  - Uses `useTheme()` hook to access theme state
  - Renders Moon icon when theme='light', Sun icon when theme='dark'
  - On click, cycles through: light → system → dark → light
  - Displays tooltip showing current preference
  - Uses Lucide React icons only (no custom SVGs)
  - Touch-friendly: 44px minimum tap target
  - Memoized to prevent re-renders on parent updates
  - Transitions between light/dark colors smoothly (150ms)
- Component must be SSR-safe (work on server and client)
- Accessible: aria-label, title attributes

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] Moon/Sun icons toggle correctly based on theme
- [ ] Clicking cycles through preference modes correctly
- [ ] Tooltip shows current preference value
- [ ] Button is 44px x 44px minimum for mobile
- [ ] Uses React.memo to prevent re-renders
- [ ] Colors transition smoothly (no jank)
- [ ] Accessible: aria-label and title present
- [ ] Works in both light and dark modes
- [ ] No console errors
- [ ] Mobile responsive

**Dependencies:** Task 2.1 (useTheme hook exists)

---

### Task 3.2: Integrate ThemeToggle into Header Component
- **Agent:** frontend-engineer
- **Skill:** React component integration, layout
- **Estimated Time:** 1 hour
- **Output:** Updated `components/app/Header.tsx`

**Requirements:**
- Add ThemeToggle to Header component
- Position: Top-right area, near existing action buttons
- Maintain Header's existing layout and responsive behavior
- ThemeToggle should be visible on all screen sizes (desktop and mobile)
- Ensure no layout shift when theme changes
- Mobile consideration: Ensure button is reachable and doesn't break layout

**Acceptance Criteria:**
- [ ] ThemeToggle renders in Header
- [ ] Position doesn't conflict with existing buttons
- [ ] Mobile layout still works (no overflow)
- [ ] No layout shifts when toggling theme
- [ ] Header responsive behavior unchanged
- [ ] All existing Header functionality still works
- [ ] No console errors
- [ ] Build passes
- [ ] Looks good in light and dark modes

**Dependencies:** Tasks 2.1, 3.1 (ThemeProvider and ThemeToggle exist)

---

### Task 3.3: Update Component Dark Mode Support - Phase 1 (High Priority)
- **Agent:** frontend-engineer
- **Skill:** Tailwind dark: prefix, component styling
- **Estimated Time:** 3-4 hours
- **Output:** Updated component files with dark: variants

**Components to Update (Priority Order):**
1. TaskCard (`components/tasks/TaskCard.tsx`)
2. ProjectCard (`components/projects/ProjectCard.tsx`)
3. Modal/Dialog components (`components/ui/Modal.tsx`, `components/ui/ResponsiveModal.tsx`)
4. Badge components (`components/ui/Badge.tsx`)
5. Form components (Input, Select, Textarea - `components/ui/form/`)

**Requirements:**
- Add `dark:` Tailwind prefix variants to all bg-, text-, and border- classes
- Status badges must show correct colors in dark mode (use tokens from Task 1.1)
- Hover states must be visible in dark mode
- Focus states (for accessibility) must work in both modes
- No hardcoded color hex codes - use only CSS variables and Tailwind tokens
- Ensure contrast ratios maintained (4.5:1 minimum)

**Acceptance Criteria:**
- [ ] All 5 component categories updated with dark: variants
- [ ] Status colors display correctly (green on-track, red delayed, etc.)
- [ ] Hover states visible in dark mode
- [ ] Focus states visible and accessible in dark mode
- [ ] No hardcoded hex colors (#ffffff, #000000, etc.)
- [ ] Build passes
- [ ] Components render correctly in both light and dark modes
- [ ] No console errors
- [ ] Mobile responsive maintained
- [ ] Contrast ratios verified for all text

**Dependencies:** Tasks 1.1-1.3, 2.1 (foundation complete)

---

### Task 3.4: Update Component Dark Mode Support - Phase 2 (Secondary)
- **Agent:** frontend-engineer
- **Skill:** Tailwind styling, component updates
- **Estimated Time:** 2-3 hours
- **Output:** Updated component files with dark: variants

**Components to Update (Priority Order):**
1. Alert/Alert Dialog components
2. Popover components
3. Dropdown Menu components
4. Sheet/Bottom Sheet components
5. Table components
6. Navigation/Menu items

**Requirements:**
- Add `dark:` Tailwind prefix variants
- Ensure background colors, text colors, borders all have dark variants
- Status and semantic colors properly applied
- Animations and transitions work in both modes
- No layout shifts when switching themes

**Acceptance Criteria:**
- [ ] All 6 component categories updated
- [ ] Dark mode looks polished (no white-on-white or dark-on-dark text)
- [ ] Contrast ratios maintained
- [ ] Build passes
- [ ] No console errors
- [ ] All components tested in both modes
- [ ] Mobile layout preserved

**Dependencies:** Task 3.3 (Phase 1 complete)

---

## Phase 4: Testing & Refinement

### Task 4.1: Contrast Ratio Validation & WCAG Compliance
- **Agent:** code-reviewer
- **Skill:** Accessibility testing, WCAG standards, axe-core
- **Estimated Time:** 2 hours
- **Output:** Accessibility report, console output from axe-core

**Requirements:**
- Run axe-core accessibility audit on all pages in both light and dark modes
- Verify all text elements meet 4.5:1 contrast minimum (WCAG AA)
- Check focus states are visible in both modes
- Validate that color changes don't break meaning (status colors still recognizable)
- Test with color blindness simulator
- Document any violations found

**Acceptance Criteria:**
- [ ] axe-core scan shows zero contrast violations on all pages
- [ ] All status colors distinguishable in color blindness mode
- [ ] Focus states visible with focus outline in both modes
- [ ] No deferred or warning-level issues
- [ ] Report generated and shared
- [ ] Any violations fixed before sign-off

**Dependencies:** Tasks 3.3-3.4 (components updated)

---

### Task 4.2: FOUC Prevention & Smooth Transitions Testing
- **Agent:** frontend-engineer
- **Skill:** Browser DevTools, performance testing
- **Estimated Time:** 1-2 hours
- **Output:** Performance report, test results

**Requirements:**
- Hard refresh (Cmd+Shift+R) page with dark mode saved preference
- Verify NO flash of light theme before dark theme applies
- Test on multiple browsers (Chrome, Safari, Firefox, Mobile Chrome)
- Verify theme toggle completes within 150-200ms
- Verify no layout shift during theme transition
- Test rapid consecutive theme toggles (ensure no jank)
- Measure performance: First Contentful Paint (FCP), Largest Contentful Paint (LCP)

**Acceptance Criteria:**
- [ ] Zero FOUC detected on hard refresh (all browsers)
- [ ] Theme toggle completes within 150-200ms
- [ ] No layout shifts during theme switch
- [ ] Rapid toggles don't cause jank
- [ ] FCP/LCP metrics acceptable (no regression)
- [ ] Mobile devices perform smoothly
- [ ] Report includes browser-specific notes
- [ ] All tests pass before moving to Phase 5

**Dependencies:** Tasks 2.2, 3.1-3.4 (all components integrated)

---

### Task 4.3: Mobile & Responsive Testing
- **Agent:** frontend-engineer
- **Skill:** Mobile testing, responsive design, accessibility
- **Estimated Time:** 2 hours
- **Output:** Test report, screenshots from mobile devices

**Requirements:**
- Test on real devices: iPhone 12, iPhone SE (small screen), Android phone
- Verify theme toggle button is accessible and properly sized (44px+)
- Check all pages render correctly in both modes on mobile
- Test landscape orientation in dark mode
- Verify form inputs are usable in dark mode
- Test touch interactions and gestures
- Check for layout issues on 375px (smallest standard viewport)

**Acceptance Criteria:**
- [ ] Theme toggle reachable on mobile (not hidden behind navigation)
- [ ] All text readable on small screens in both modes
- [ ] Form inputs usable and visible in dark mode
- [ ] Landscape orientation works correctly
- [ ] No layout breakage on 375px viewport
- [ ] Touch targets 44px minimum
- [ ] Screenshots taken and documented
- [ ] No regressions from light mode mobile experience

**Dependencies:** Tasks 3.3-3.4 (components complete)

---

### Task 4.4: Browser Compatibility & Edge Cases
- **Agent:** code-reviewer
- **Skill:** Browser testing, cross-browser compatibility
- **Estimated Time:** 1-2 hours
- **Output:** Compatibility report

**Requirements:**
- Test on Chrome 90+, Safari 14+, Firefox 85+
- Test on iOS Safari (iPhone 12)
- Test on Android Chrome
- Verify matchMedia API works (system preference detection)
- Test localStorage unavailable scenario (private browsing)
- Test with JavaScript disabled (inline script should still run)
- Test theme persistence across sessions and devices

**Acceptance Criteria:**
- [ ] All browsers show dark mode correctly
- [ ] System preference detection works on macOS/Windows/iOS/Android
- [ ] Fallback to light mode if localStorage unavailable
- [ ] Inline script runs even with JS disabled
- [ ] Theme persists across sessions
- [ ] No console errors across browsers
- [ ] Compatibility report generated

**Dependencies:** Tasks 2.1-3.4 (full implementation complete)

---

## Phase 5: Documentation & Sign-Off

### Task 5.1: Sync Documentation (Auto-Generated)
- **Agent:** backend-engineer
- **Skill:** Documentation sync tools
- **Estimated Time:** 30 minutes
- **Output:** Updated index files and reference docs

**Requirements:**
- Run `/kc:docs-sync` or equivalent documentation synchronization
- Update component index if new components created (ThemeToggle, ThemeProvider)
- Verify CSS variables are documented in globals.css reference
- Ensure context files are registered in documentation

**Acceptance Criteria:**
- [ ] Documentation sync completes without errors
- [ ] New files appear in relevant index files
- [ ] No stale references to deleted files
- [ ] Build passes after sync

**Dependencies:** All implementation tasks complete

---

### Task 5.2: Create Dark Mode Implementation Guide
- **Agent:** technical-documentation-writer
- **Skill:** Technical writing, markdown
- **Estimated Time:** 1-2 hours
- **Output:** `.claude/specs/dark-mode/IMPLEMENTATION_GUIDE.md`

**Requirements:**
- Document how to use `useTheme()` hook in new components
- Explain `dark:` Tailwind prefix pattern for component styling
- Show before/after examples of component updates
- List all CSS variables and their purpose
- Document FOUC prevention strategy
- Provide troubleshooting guide
- Include testing checklist for future dark mode features

**Acceptance Criteria:**
- [ ] Guide is clear and includes code examples
- [ ] Developers can add dark mode support to new components
- [ ] All CSS variables documented with hex values
- [ ] Troubleshooting section covers common issues
- [ ] Guide stored in `.claude/specs/dark-mode/`

**Dependencies:** All implementation complete

---

## Execution Order & Dependencies

### Sequential Order (Critical Path)
```
1.1 Color Palette Derivation
  down arrow
1.2 Update globals.css
  down arrow
1.3 Update tailwind.config.ts
  down arrow
2.1 Create ThemeProvider
  down arrow
2.2 Add FOUC Prevention Script
  down arrow
3.1 Create ThemeToggle
  down arrow
3.2 Integrate into Header
  down arrow
3.3 Component Updates Phase 1
  down arrow
3.4 Component Updates Phase 2
  down arrow
4.1 Accessibility Testing
  down arrow
4.2 FOUC and Transition Testing
  down arrow
4.3 Mobile Testing
  down arrow
4.4 Browser Compatibility
  down arrow
5.1 Documentation Sync
  down arrow
5.2 Implementation Guide
```

### Parallelizable Tasks (After Dependencies Met)
- Task 3.3 and 3.4 can run partially in parallel (after 2.1-2.2)
- Tasks 4.1-4.4 can run in parallel (after 3.4)
- Task 5.1 and 5.2 can run in parallel (after all implementation)

---

## Estimated Project Effort

| Phase | Task Count | Estimated Time | Agent |
|-------|-----------|-----------------|-------|
| **1: Foundation** | 3 | 5-6 hours | schema-architect (1.1), frontend-engineer (1.2-1.3) |
| **2: Context** | 2 | 3-4 hours | frontend-engineer |
| **3: Components** | 4 | 7-9 hours | frontend-engineer |
| **4: Testing** | 4 | 6-8 hours | frontend-engineer, code-reviewer |
| **5: Documentation** | 2 | 2-3 hours | backend-engineer, technical-writer |
| **TOTAL** | **15 tasks** | **23-30 hours** | Multiple agents |

---

## Rollback Plan

If critical issues discovered:
1. Remove `.dark` class from HTML element
2. Revert globals.css to light mode only
3. Disable ThemeToggle from Header
4. Keep `darkMode: 'class'` in tailwind.config (inert if no .dark class)
5. No database changes needed (all CSS-based)

---

**Status:** READY FOR IMPLEMENTATION

**Next Steps:**
1. Approve tasks specification
2. Assign agents to phases
3. Begin Task 1.1 (Color Palette Derivation)
4. Track progress through TDL or project management tool
