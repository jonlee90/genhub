# Task 0055: Materials Enhancement - Testing & Polish

**Date:** 2026-01-04
**Status:** 🔵 **PENDING**
**Agent:** agent-code-reviewer
**Estimated Effort:** 3-4 hours

---

## Overview

Comprehensive testing, quality assurance, and final polish for the Materials Page Enhancement feature. Includes pagination edge cases, tracking limits, price calculations, RLS policies, scheduled jobs, performance, and accessibility.

---

## Prerequisites

- [x] Design document approved
- [x] Requirements approved
- [ ] Task 0050 completed (database)
- [ ] Task 0051 completed (server actions)
- [ ] Task 0052 completed (scheduled jobs)
- [ ] Task 0053 completed (UI components)
- [ ] Task 0054 completed (page integration)

---

## Subtasks

### 1. Test Pagination Edge Cases

**Scenarios:**

- [ ] **0 materials:** Empty state shows, no pagination
- [ ] **11 materials:** Page 1 shows 11, no page 2, "Next" disabled
- [ ] **12 materials (exactly 1 page):** Shows 12, no pagination OR "Next" disabled
- [ ] **13 materials:** Page 1 shows 12, page 2 shows 1
- [ ] **24 materials (exactly 2 pages):** Page 1 shows 12, page 2 shows 12
- [ ] **25 materials:** Page 1-2 full, page 3 shows 1
- [ ] **Invalid page (999):** Redirects to last valid page OR shows empty
- [ ] **Negative page (-1):** Redirects to page 1
- [ ] **Page 0:** Redirects to page 1

**Verification:**

- [ ] Total count matches database
- [ ] No duplicate materials across pages
- [ ] Page X of Y display is accurate
- [ ] "Previous"/"Next" buttons enabled/disabled correctly

---

### 2. Test Tracking Limits

**Scenarios:**

- [ ] **Track 1st material:** Success, shows in carousel
- [ ] **Track 10th material:** Success, "Tracked Materials" card shows 10/10
- [ ] **Track 11th material:** Error toast: "Maximum 10 materials"
- [ ] **Track already-tracked material:** Error toast or silent ignore
- [ ] **Untrack material:** Success, removed from carousel
- [ ] **Track material in different company:** Blocked by RLS

**Verification:**

- [ ] Database trigger enforces 10-material limit
- [ ] Client-side shows appropriate error messages
- [ ] Optimistic UI rolls back on failure
- [ ] Carousel never shows > 10 materials

---

### 3. Test Price Change Calculations

**Test data setup:**

```sql
-- Material 1: Price increased
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES
  ('company-1', 'mat-1', 8.00, NOW() - INTERVAL '8 days'),
  ('company-1', 'mat-1', 10.00, NOW());

-- Material 2: Price decreased
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES
  ('company-1', 'mat-2', 12.00, NOW() - INTERVAL '8 days'),
  ('company-1', 'mat-2', 10.00, NOW());

-- Material 3: No change
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES
  ('company-1', 'mat-3', 10.00, NOW() - INTERVAL '8 days'),
  ('company-1', 'mat-3', 10.00, NOW());

-- Material 4: No previous price
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES
  ('company-1', 'mat-4', 10.00, NOW());
```

**Verification:**

- [ ] Material 1: Shows red ↑ +25.0%
- [ ] Material 2: Shows green ↓ -16.7%
- [ ] Material 3: Shows gray — "No change"
- [ ] Material 4: Shows gray — "No change" (or null)
- [ ] Calculation matches: `((current - previous) / previous) * 100`

---

### 4. Test RLS Policies

**Scenarios:**

- [ ] **User A tracks material in Company A:** Success
- [ ] **User A tries to track material in Company B:** Blocked
- [ ] **User A tries to view Company B's tracked materials:** Empty result
- [ ] **User A tries to view Company B's price history:** Empty result
- [ ] **Service role inserts price history:** Success
- [ ] **Regular user tries to insert price history:** Blocked

**Verification:**

- [ ] RLS policies enforce company isolation
- [ ] Users cannot access other companies' data
- [ ] Service role bypasses RLS for scheduled jobs

---

### 5. Test Scheduled Jobs

**Test Price Update Job:**

```bash
# Trigger manually
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/update-material-prices

# Expected response:
{
  "success": true,
  "updated": N,
  "errors": 0,
  "total": M
}

# Verify in database:
SELECT * FROM material_price_history
WHERE source = 'home_depot_api'
ORDER BY recorded_at DESC
LIMIT 10;
```

- [ ] Job fetches prices from Home Depot API
- [ ] Updates `materials.unit_price` when changed
- [ ] Inserts price history records
- [ ] Handles API errors gracefully
- [ ] Returns accurate summary

**Test Cleanup Job:**

```bash
# Insert old test data
psql $DATABASE_URL -c "
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES ('test-company', 'test-mat', 10.00, NOW() - INTERVAL '100 days');
"

# Trigger cleanup
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/cleanup-price-history

# Expected response:
{
  "success": true,
  "deleted": 1
}

# Verify deletion
psql $DATABASE_URL -c "
SELECT COUNT(*) FROM material_price_history
WHERE recorded_at < NOW() - INTERVAL '90 days';
" # Should be 0
```

- [ ] Deletes records older than 90 days
- [ ] Returns accurate count
- [ ] Doesn't delete recent records

---

### 6. Test Performance

**Page Load Performance:**

- [ ] Initial page load < 2s (with 50+ materials)
- [ ] Summary stats query < 200ms
- [ ] Pagination query < 100ms
- [ ] Tracked materials query < 50ms

**Database Query Performance:**

```sql
-- Test aggregation query
EXPLAIN ANALYZE
SELECT m.*, SUM(ma.quantity) as total_quantity
FROM materials m
INNER JOIN material_assignments ma ON ma.material_id = m.id
WHERE m.company_id = 'company-1'
GROUP BY m.id
ORDER BY total_quantity DESC
LIMIT 12;

-- Verify: Uses index on material_assignments(material_id)
-- Expected: Execution time < 100ms
```

- [ ] Indexes are used (check EXPLAIN ANALYZE)
- [ ] No full table scans on large tables
- [ ] Pagination doesn't slow down on high page numbers

**UI Performance:**

- [ ] Carousel scrolling is smooth (60fps)
- [ ] Pagination navigation is instant
- [ ] Track/untrack button response < 500ms
- [ ] No layout shifts during loading

---

### 7. Test Accessibility

**Keyboard Navigation:**

- [ ] All buttons are keyboard accessible (Tab key)
- [ ] Enter key activates buttons
- [ ] Focus indicators visible
- [ ] Carousel can be scrolled with arrow keys (bonus)

**Screen Reader Support:**

- [ ] All images have alt text
- [ ] All buttons have aria-labels (if icon-only)
- [ ] Section headers have appropriate heading levels
- [ ] Empty states have descriptive text

**ARIA Attributes:**

- [ ] `aria-label` on icon-only buttons
- [ ] `aria-disabled` on disabled buttons
- [ ] `role="status"` on loading indicators
- [ ] `aria-live="polite"` on toast notifications (if using custom)

**Color Contrast:**

- [ ] Text meets WCAG AA contrast ratio (4.5:1)
- [ ] Price indicators distinguishable by icon (not just color)
- [ ] Disabled buttons clearly distinguishable

---

### 8. Test Error Handling

**Server Action Errors:**

- [ ] Network error during `toggleTracking()` → Error toast, rollback
- [ ] Database error during `getTaskLinkedMaterials()` → Empty state + error message
- [ ] Invalid input to server action → Validation error, not crash

**UI Errors:**

- [ ] Component render error → Error boundary catches, shows fallback
- [ ] Missing prop → Graceful fallback (not white screen)

**Edge Cases:**

- [ ] Material deleted while tracking → Handle gracefully
- [ ] Concurrent track/untrack → No race condition
- [ ] Rapid pagination clicks → Debounce or queue requests

---

### 9. Test Responsive Layout

**Mobile (375px):**

- [ ] Summary cards stack vertically (1 column)
- [ ] Carousel scrolls horizontally
- [ ] Materials grid shows 1 column
- [ ] Pagination buttons fit on screen
- [ ] No horizontal overflow
- [ ] Touch scrolling works on carousel
- [ ] Buttons are min 44px tap target

**Tablet (768px):**

- [ ] Summary shows 2 columns
- [ ] Materials grid shows 2 columns
- [ ] Carousel shows 2-3 cards at once

**Desktop (1280px+):**

- [ ] Summary shows 5 columns
- [ ] Materials grid shows 3 columns
- [ ] Carousel shows 4-5 cards at once

**Cross-Browser Testing:**

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

---

### 10. Code Review Checklist

**Code Quality:**

- [ ] No console.log statements (or use console.error for errors only)
- [ ] No TODO comments left unresolved
- [ ] No unused imports or variables
- [ ] TypeScript: No `any` types (use proper types)
- [ ] Consistent naming conventions

**Security:**

- [ ] No sensitive data in client components
- [ ] RLS policies tested and verified
- [ ] Input validation on all server actions
- [ ] Cron endpoints protected with secret

**Best Practices:**

- [ ] Server components for data fetching
- [ ] Client components only where needed (`'use client'`)
- [ ] No Supabase client in client components
- [ ] Server actions use `revalidatePath()` after mutations

**GenHub Standards:**

- [ ] Lucide icons only (no other icon libraries)
- [ ] Standard card styling (`border-2 border-gray-200 shadow-construction`)
- [ ] No custom fonts or decorations
- [ ] Follows ProjectTaskSummary pattern for summary cards

---

### 11. Final Build & Deployment Check

**Build:**

```bash
npm run build

# Verify:
# - No TypeScript errors
# - No build errors
# - No warnings (or acceptable warnings documented)
```

- [ ] Build completes successfully
- [ ] No type errors
- [ ] Bundle size acceptable (no huge increase)

**Deployment to Vercel:**

```bash
vercel --prod

# Verify:
# - Deployment succeeds
# - Environment variables set (CRON_SECRET, HOME_DEPOT_API_KEY)
# - Cron jobs appear in dashboard
```

- [ ] Deployment successful
- [ ] Cron jobs scheduled correctly
- [ ] Environment variables configured
- [ ] Production URL accessible

**Post-Deployment Verification:**

- [ ] Navigate to production `/app/materials`
- [ ] Test full tracking flow
- [ ] Test pagination
- [ ] Wait for cron job run (or trigger manually)
- [ ] Verify price updates in database

---

## Acceptance Criteria

✅ **All Tests Passed:**
- [ ] Pagination edge cases handled correctly
- [ ] Tracking limits enforced (max 10)
- [ ] Price change calculations accurate
- [ ] RLS policies enforce company isolation
- [ ] Scheduled jobs run successfully
- [ ] Performance meets targets (< 2s page load)
- [ ] Accessibility standards met (WCAG AA)
- [ ] Error handling comprehensive
- [ ] Responsive on all screen sizes

✅ **Code Quality:**
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] No console warnings
- [ ] Code review checklist complete
- [ ] GenHub standards followed

✅ **Deployment:**
- [ ] Production build successful
- [ ] Cron jobs scheduled in Vercel
- [ ] Environment variables configured
- [ ] Post-deployment verification passed

---

## Implementation Notes

### Performance Testing Tools

**Lighthouse:**
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000/app/materials --view

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
```

**Database Query Profiling:**
```sql
-- Enable timing
\timing

-- Run query
EXPLAIN ANALYZE
SELECT ... FROM materials ... ;

-- Look for:
# Seq Scan (bad) vs Index Scan (good)
# Execution Time < 100ms
```

### Accessibility Testing Tools

**axe DevTools (Browser Extension):**
- Install axe DevTools for Chrome/Firefox
- Run scan on `/app/materials` page
- Fix all critical and serious issues

**Manual Keyboard Testing:**
- Unplug mouse
- Navigate entire page with Tab/Shift+Tab/Enter/Space
- Verify all actions accessible

### Load Testing (Optional)

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js <<EOF
import http from 'k6/http';
export default function() {
  http.get('http://localhost:3000/app/materials');
}
EOF

# Run test (100 virtual users, 30 seconds)
k6 run --vus 100 --duration 30s load-test.js

# Target: P95 response time < 2s
```

---

## Files to Review

### Database:
- `supabase/migrations/20260104000001_create_tracked_materials.sql`
- `supabase/migrations/20260104000002_create_material_price_history.sql`
- `supabase/migrations/20260104000003_add_material_indexes.sql`

### Server Actions:
- `app/actions/materials.ts` (5 new functions)

### Scheduled Jobs:
- `app/api/cron/update-material-prices/route.ts`
- `app/api/cron/cleanup-price-history/route.ts`

### UI Components:
- `components/materials/MaterialSummary.tsx`
- `components/materials/TrackedMaterialsCarousel.tsx`
- `components/materials/PriceChangeIndicator.tsx`
- `components/materials/MaterialCard.tsx`
- `components/materials/MaterialsList.tsx`

### Page:
- `app/app/materials/page.tsx`

---

## Testing Instructions

### Comprehensive Test Flow

```
1. Load page → Verify all sections render
2. Track material → Verify carousel updates
3. Track 9 more → Verify 10/10 limit
4. Try to track 11th → Verify error
5. Untrack material → Verify removal
6. Paginate → Verify page 2 loads
7. Check price indicators → Verify colors/arrows
8. Mobile test → Verify responsive
9. Keyboard test → Verify all accessible
10. Build test → Verify no errors
11. Deploy → Verify production works
```

---

## Dependencies

**Depends on:**
- All previous tasks (0050-0054)
- Vercel account for deployment
- Home Depot API key (if using)

**Required by:**
- None (final task in this feature)

---

## References

- Design Document: `docs/specs/materials-page-enhancement/design.md`
  - Testing Strategy: Lines 1472-1501
  - Performance Considerations: Lines 1447-1470
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Next.js Performance: https://nextjs.org/docs/app/building-your-application/optimizing

---

## Success Checklist

Before marking this task complete:

- [ ] All pagination edge cases tested
- [ ] All tracking limit scenarios tested
- [ ] Price calculations verified
- [ ] RLS policies tested
- [ ] Scheduled jobs tested (manually triggered)
- [ ] Performance targets met
- [ ] Accessibility audit passed
- [ ] Error handling verified
- [ ] Responsive layout tested
- [ ] Code review checklist complete
- [ ] Build successful
- [ ] Deployed to production
- [ ] Post-deployment verification passed
- [ ] No critical bugs remaining

---

## Post-Testing Actions

### If Issues Found:

- [ ] Document bugs in GitHub Issues or task tracker
- [ ] Prioritize by severity (critical, high, medium, low)
- [ ] Fix critical issues before marking complete
- [ ] Schedule non-critical fixes for future iteration

### If Tests Passed:

- [ ] Mark all tasks 0050-0055 as COMPLETE
- [ ] Update design document status to IMPLEMENTED
- [ ] Update requirements document with "Delivered: 2026-01-04"
- [ ] Create summary document for stakeholders
- [ ] Schedule demo/walkthrough with team

---

**Feature Complete!**
After this task, the Materials Page Enhancement feature is ready for production use.
