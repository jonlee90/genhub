# Visual Regression Testing Guide - Owner Admin Pages

**Date**: 2026-01-23
**Scope**: Owner Admin Pages (Companies, Users, Invites)
**Purpose**: Establish baseline screenshots for visual regression testing

---

## Overview

This document provides instructions for capturing baseline screenshots and performing visual regression testing for the owner admin pages redesign.

---

## Test Matrix

| Page | Viewport | Mode | State | Total |
|------|----------|------|-------|-------|
| Companies | Desktop, Tablet, Mobile | Light, Dark | Loaded, Loading, Empty | 18 |
| Users | Desktop, Tablet, Mobile | Light, Dark | Loaded, Loading, Empty | 18 |
| Invites | Desktop, Tablet, Mobile | Light, Dark | Loaded, Loading, Empty, Form | 24 |
| **Total** | | | | **60 screenshots** |

---

## Viewport Sizes

### Desktop
- **Width**: 1920px
- **Height**: 1080px
- **Use Case**: Large monitors, desktop workflows

### Tablet
- **Width**: 768px
- **Height**: 1024px
- **Use Case**: iPad, tablet devices (breakpoint transition)

### Mobile
- **Width**: 375px
- **Height**: 667px
- **Use Case**: iPhone SE, small phones

---

## Manual Screenshot Capture

### Setup

```bash
# 1. Start development server
npm run dev

# 2. Open Chrome DevTools
# - Press F12
# - Click "Toggle Device Toolbar" (Ctrl+Shift+M / Cmd+Shift+M)
# - Select "Responsive" mode
```

### Dark Mode Toggle

**Option 1: Browser DevTools**
```
1. F12 → ⋮ (menu) → More tools → Rendering
2. Scroll to "Emulate CSS media feature prefers-color-scheme"
3. Select "prefers-color-scheme: dark"
```

**Option 2: System Settings**
```
macOS: System Settings → Appearance → Dark
Windows: Settings → Personalization → Colors → Dark
```

---

## Screenshot Naming Convention

```
{page}_{viewport}_{mode}_{state}.png

Examples:
- companies_desktop_light_loaded.png
- companies_desktop_dark_loaded.png
- companies_mobile_light_empty.png
- users_tablet_dark_loading.png
- invites_desktop_light_form-success.png
```

---

## Page-by-Page Instructions

### 1. Companies Page (`/app/owner/companies`)

#### States to Capture

**Loaded State** (default):
```
URL: http://localhost:3000/app/owner/companies
Description: Page with company data displayed
Elements: Header, Stats Grid, Search Input, Company Cards/Table
```

**Loading State**:
```
Simulate by adding: isLoading={true} prop to components
Description: Skeleton grid and table/card skeletons visible
Elements: Skeleton stats, skeleton cards/table
```

**Empty State**:
```
Simulate by: Setting companies array to []
Description: "No Companies Yet" empty state
Elements: Empty state icon, title, description
```

**Hover State** (Desktop only):
```
Description: Hover over company card
Expected: Slight scale transform, shadow change
```

**Search Active**:
```
Type "Acme" in search input
Description: Filtered results
Elements: Search input with text, filtered company list
```

#### Screenshot Checklist

**Desktop (1920x1080):**
- [ ] companies_desktop_light_loaded.png
- [ ] companies_desktop_dark_loaded.png
- [ ] companies_desktop_light_loading.png
- [ ] companies_desktop_dark_loading.png
- [ ] companies_desktop_light_empty.png
- [ ] companies_desktop_dark_empty.png
- [ ] companies_desktop_light_hover.png
- [ ] companies_desktop_light_search.png

**Tablet (768x1024):**
- [ ] companies_tablet_light_loaded.png
- [ ] companies_tablet_dark_loaded.png
- [ ] companies_tablet_light_loading.png
- [ ] companies_tablet_dark_loading.png

**Mobile (375x667):**
- [ ] companies_mobile_light_loaded.png
- [ ] companies_mobile_dark_loaded.png
- [ ] companies_mobile_light_loading.png
- [ ] companies_mobile_dark_loading.png
- [ ] companies_mobile_light_empty.png
- [ ] companies_mobile_dark_empty.png

---

### 2. Users Page (`/app/owner/users`)

#### States to Capture

**Loaded State** (default):
```
URL: http://localhost:3000/app/owner/users
Description: Page with user data displayed
Desktop: Table view
Mobile: Card view
Elements: Header, Stats Grid, Search Input, Users Table/Cards
```

**Loading State**:
```
Description: Skeleton grid and user skeletons
Elements: Skeleton stats, skeleton table rows (desktop) / cards (mobile)
```

**Empty State**:
```
Description: "No Users Found" empty state
Elements: Empty state icon, title, description
```

**Table Hover** (Desktop only):
```
Description: Hover over table row
Expected: Background color change
```

**Search Active**:
```
Type "john@" in search input
Description: Filtered user results
Elements: Search input with text, filtered user list
```

#### Screenshot Checklist

**Desktop (1920x1080):**
- [ ] users_desktop_light_loaded.png
- [ ] users_desktop_dark_loaded.png
- [ ] users_desktop_light_loading.png
- [ ] users_desktop_dark_loading.png
- [ ] users_desktop_light_empty.png
- [ ] users_desktop_dark_empty.png
- [ ] users_desktop_light_hover.png
- [ ] users_desktop_light_search.png

**Tablet (768x1024):**
- [ ] users_tablet_light_loaded.png
- [ ] users_tablet_dark_loaded.png
- [ ] users_tablet_light_loading.png
- [ ] users_tablet_dark_loading.png

**Mobile (375x667):**
- [ ] users_mobile_light_loaded.png
- [ ] users_mobile_dark_loaded.png
- [ ] users_mobile_light_loading.png
- [ ] users_mobile_dark_loading.png
- [ ] users_mobile_light_empty.png
- [ ] users_mobile_dark_empty.png

---

### 3. Invites Page (`/app/owner/invites`)

#### States to Capture

**Loaded State** (default):
```
URL: http://localhost:3000/app/owner/invites
Description: Page with invitation form and pending invites list
Elements: Header, Stats Grid, Invite Form, Invitation Cards
```

**Loading State**:
```
Description: Skeleton grid and invitation skeletons
Elements: Skeleton stats, skeleton invitation cards
```

**Empty State**:
```
Description: No pending invitations
Elements: Form visible, empty invitation list message
```

**Form Success State**:
```
Simulate: Fill form and submit
Description: Success alert visible with invitation link
Elements: Form, success alert with copy button
```

**Form Error State**:
```
Simulate: Submit with invalid email
Description: Error message below email input
Elements: Form with validation error
```

**Swipe Action** (Mobile only):
```
Simulate: Swipe invitation card left/right
Description: Copy/Revoke action revealed
Elements: Card with swipe action visible
```

**Desktop Buttons**:
```
Description: Copy and Revoke buttons visible on cards
Elements: Invitation cards with visible action buttons
```

#### Screenshot Checklist

**Desktop (1920x1080):**
- [ ] invites_desktop_light_loaded.png
- [ ] invites_desktop_dark_loaded.png
- [ ] invites_desktop_light_loading.png
- [ ] invites_desktop_dark_loading.png
- [ ] invites_desktop_light_empty.png
- [ ] invites_desktop_dark_empty.png
- [ ] invites_desktop_light_form-success.png
- [ ] invites_desktop_light_form-error.png
- [ ] invites_desktop_light_buttons.png

**Tablet (768x1024):**
- [ ] invites_tablet_light_loaded.png
- [ ] invites_tablet_dark_loaded.png
- [ ] invites_tablet_light_loading.png
- [ ] invites_tablet_dark_loading.png

**Mobile (375x667):**
- [ ] invites_mobile_light_loaded.png
- [ ] invites_mobile_dark_loaded.png
- [ ] invites_mobile_light_loading.png
- [ ] invites_mobile_dark_loading.png
- [ ] invites_mobile_light_empty.png
- [ ] invites_mobile_dark_empty.png
- [ ] invites_mobile_light_swipe.png
- [ ] invites_mobile_light_form-success.png

---

## Tab Navigation States

Capture tab states on one representative page:

**Companies Tab Active** (default):
```
Location: /app/owner/companies
Description: Companies tab highlighted, others inactive
File: tabs_companies-active.png
```

**Users Tab Active**:
```
Location: /app/owner/users
Description: Users tab highlighted
File: tabs_users-active.png
```

**Invites Tab Active with Badge**:
```
Location: /app/owner/invites
Description: Invites tab highlighted, badge visible if pending > 0
File: tabs_invites-active-badge.png
```

---

## Automated Screenshot Testing (Playwright)

### Installation

```bash
npm install -D @playwright/test
npx playwright install
```

### Test Script

Create `tests/owner-visual-regression.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

const modes = ['light', 'dark'];

test.describe('Owner Pages Visual Regression', () => {
  for (const viewport of viewports) {
    for (const mode of modes) {
      test.describe(`${viewport.name} - ${mode} mode`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          if (mode === 'dark') {
            await page.emulateMedia({ colorScheme: 'dark' });
          }
        });

        test('companies page - loaded state', async ({ page }) => {
          await page.goto('/app/owner/companies');
          await page.waitForLoadState('networkidle');

          await expect(page).toHaveScreenshot(
            `companies_${viewport.name}_${mode}_loaded.png`,
            { fullPage: true }
          );
        });

        test('users page - loaded state', async ({ page }) => {
          await page.goto('/app/owner/users');
          await page.waitForLoadState('networkidle');

          await expect(page).toHaveScreenshot(
            `users_${viewport.name}_${mode}_loaded.png`,
            { fullPage: true }
          );
        });

        test('invites page - loaded state', async ({ page }) => {
          await page.goto('/app/owner/invites');
          await page.waitForLoadState('networkidle');

          await expect(page).toHaveScreenshot(
            `invites_${viewport.name}_${mode}_loaded.png`,
            { fullPage: true }
          );
        });
      });
    }
  }
});
```

### Run Tests

```bash
# Generate baseline screenshots
npx playwright test tests/owner-visual-regression.spec.ts

# Compare against baseline (after changes)
npx playwright test tests/owner-visual-regression.spec.ts

# View report
npx playwright show-report
```

---

## Visual Checklist

### General UI Elements

**All Pages:**
- [ ] Blueprint background visible (light opacity)
- [ ] Platform Admin header with orange accent bar
- [ ] Tab navigation renders correctly
- [ ] Tab badge shows pending count (Invites tab)
- [ ] Page header with title and subtitle
- [ ] Stats grid with correct column count
- [ ] Search input (if applicable)
- [ ] Data table (desktop) or cards (mobile)

**Dark Mode:**
- [ ] Background color inverted correctly
- [ ] Text remains readable (high contrast)
- [ ] Icons visible
- [ ] Borders visible
- [ ] Blueprint background still visible
- [ ] Badge colors adjusted for dark mode

**Responsive:**
- [ ] Desktop: Table view, 4-column stats grid
- [ ] Tablet: Breakpoint transition smooth
- [ ] Mobile: Card view, 2-column stats grid
- [ ] No horizontal scroll
- [ ] No layout overflow

---

## Critical Visual Elements to Verify

### 1. Typography

- [ ] Headings: Bold, correct size hierarchy
- [ ] Body text: Readable, sufficient line height
- [ ] Labels: Uppercase, tracking-wider
- [ ] Code/mono: Mono font applied where needed

### 2. Colors

**Light Mode:**
- [ ] Construction blue (`#001B51`) visible
- [ ] Construction orange (`#3C3C3C`) on accent bar
- [ ] Gray text hierarchy (900, 600, 400)
- [ ] Badge colors correct (green, yellow, red)

**Dark Mode:**
- [ ] White text on dark backgrounds
- [ ] Blue/orange adjusted for dark mode
- [ ] Gray text hierarchy (100, 400, 600)
- [ ] Badge colors adjusted

### 3. Spacing

- [ ] Consistent padding: p-4 md:p-8
- [ ] Gap between elements: gap-3 md:gap-4
- [ ] Card spacing matches design spec
- [ ] No elements touching edges

### 4. Borders & Shadows

- [ ] 2px solid borders on cards
- [ ] Rounded corners (rounded-lg, rounded-xl)
- [ ] Shadow on KPI cards
- [ ] Active state borders visible

### 5. Icons

- [ ] Lucide icons render correctly
- [ ] Icon size consistent (w-4 h-4, w-5 h-5)
- [ ] Icon color matches design
- [ ] Icons visible in dark mode

### 6. Interactive States

**Desktop:**
- [ ] Hover states change background/shadow
- [ ] Focus rings visible (construction-blue)
- [ ] Active states darken background

**Mobile:**
- [ ] Touch targets ≥44px
- [ ] Active states visible
- [ ] No hover states leaking to mobile

---

## Pixel-Perfect Comparison

### Tools

**Option 1: Manual Comparison**
- Open baseline screenshot in one window
- Open current page in another window
- Alt+Tab between them to spot differences

**Option 2: Diff Tool**
```bash
# Install ImageMagick
brew install imagemagick

# Compare screenshots
compare -metric AE \
  baseline.png \
  current.png \
  diff.png
```

**Option 3: Online Diff Tools**
- https://www.diffchecker.com/image-diff/
- Upload baseline and current screenshots
- View highlighted differences

---

## Regression Testing Workflow

### 1. Establish Baseline (First Time)

```bash
# Capture all 60 baseline screenshots
# Store in __screenshots__/owner/baseline/

# Naming convention:
# baseline/{page}_{viewport}_{mode}_{state}.png
```

### 2. After Code Changes

```bash
# Capture new screenshots
# Store in __screenshots__/owner/current/

# Compare with baseline
# Any differences = regression

# Review each diff:
# - Expected change → Update baseline
# - Unexpected change → Fix code
```

### 3. Update Baseline

```bash
# After approving changes
cp __screenshots__/owner/current/*.png \
   __screenshots__/owner/baseline/

# Commit updated baselines
git add __screenshots__/owner/baseline/
git commit -m "chore: update visual regression baselines"
```

---

## CI/CD Integration (Optional)

### GitHub Actions Workflow

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
    paths:
      - 'components/owner/**'
      - 'app/app/owner/**'

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Start server
        run: npm run start &

      - name: Run Playwright tests
        run: npx playwright test tests/owner-visual-regression.spec.ts

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-regression-diff
          path: test-results/
```

---

## Troubleshooting

### Issue: Screenshots inconsistent between machines

**Solution**: Use Playwright with Docker for consistent rendering
```bash
docker run -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy \
  npx playwright test
```

### Issue: Dark mode not toggling

**Solution**: Clear browser cache, use incognito mode
```bash
# Or force dark mode via DevTools Rendering panel
```

### Issue: Blueprint background not visible in screenshots

**Solution**: Increase opacity temporarily for screenshot
```tsx
// Temporarily change opacity from 0.03 to 0.15 for screenshot
className="fixed inset-0 pointer-events-none opacity-[0.15] z-0"
```

---

## Deliverables

### Screenshot Archive Structure

```
__screenshots__/owner/
├── VISUAL_REGRESSION_TESTING.md (this file)
├── baseline/
│   ├── companies_desktop_light_loaded.png
│   ├── companies_desktop_dark_loaded.png
│   ├── companies_mobile_light_loaded.png
│   ├── ... (60 total baseline screenshots)
├── current/
│   └── (latest test run screenshots)
└── diffs/
    └── (difference images if regressions found)
```

### Test Report Template

```markdown
## Visual Regression Test Report

**Date**: 2026-01-23
**Tester**: [Name]
**Pages Tested**: Companies, Users, Invites
**Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
**Modes**: Light, Dark

### Results

**Total Screenshots**: 60
**Passed**: X
**Failed**: Y
**Regressions**: Z

### Regressions Found

1. **companies_mobile_dark_loaded.png**
   - Description: Card shadow missing in dark mode
   - Severity: Low
   - Status: Fixed

2. **users_desktop_light_hover.png**
   - Description: Hover state background color incorrect
   - Severity: Medium
   - Status: In Progress

### Screenshots Captured

- [x] Companies: 18/18
- [x] Users: 18/18
- [x] Invites: 24/24

### Sign-off

Baseline screenshots captured and archived.
Visual regression testing framework established.
Ready for production deployment.

**Approved by**: [Name]
**Date**: 2026-01-23
```

---

**Report Generated**: 2026-01-23
**Next Review**: After any UI component changes
**Baseline Location**: `__screenshots__/owner/baseline/`
