# AI Plan Estimator - Integration Test Results

**Date:** 2026-02-08
**Tester:** AI Implementation
**Build:** Phase 1 Complete (17/25 tasks), Phase 2 Testing In Progress
**Environment:** Development (local)

---

## Test Flows

### ✅ Flow 1: Upload PDF → Processing → Ready

**Steps:**
1. Navigate to project → Estimates tab
2. Click "Upload Plan" button
3. Select PDF file (< 50MB)
4. Monitor upload progress
5. Wait for PDF to process
6. Verify "Ready" status appears

**Expected Results:**
- [ ] File uploads without errors
- [ ] Progress bar shows upload percentage
- [ ] PDF pages are converted to PNG images (300 DPI)
- [ ] `plan_uploads` record created with status "ready"
- [ ] `plan_pages` records created (one per page)
- [ ] "Parse with AI" button appears after ready status

**Status:** ⏳ PENDING (requires manual testing with dev server)

**Notes:**
- PDF conversion uses `pdfjs-dist` library
- Page images stored in Supabase Storage: `plan-files/{company_id}/projects/{project_id}/plans/pages/`
- Max file size: 50MB (validated client-side before upload)

---

### ✅ Flow 2: Parse with AI → Polling → Complete

**Steps:**
1. From ready plan, click "Parse with AI"
2. Monitor parsing progress overlay
3. Wait for AI to complete (GPT-4o Vision)
4. Verify takeoff items appear

**Expected Results:**
- [ ] Parsing overlay opens with progress indicator
- [ ] Per-page status updates (pending → parsing → parsed)
- [ ] API polls `/api/estimates/parse-status` every 2 seconds
- [ ] `takeoff_items` records created with confidence scores
- [ ] Source regions highlighted on plan viewer
- [ ] "Review Takeoff" button appears after completion

**Status:** ⏳ PENDING (requires OPENAI_API_KEY and dev server)

**Notes:**
- Uses GPT-4o vision model (`gpt-4o-2024-08-06`)
- Cost: ~$0.15-$0.30 per 5-10 page plan
- Extracts: quantity, unit, trade, category, source regions
- Confidence threshold: items < 0.5 marked `needs_review=true`

---

### ✅ Flow 3: Review Takeoff → Accept/Reject/Edit → Proceed

**Steps:**
1. Click "Review Takeoff" from parsed plan
2. View split layout (plan viewer + item list)
3. Click accept/reject/edit buttons per item
4. Verify region highlighting on plan
5. Review all items
6. Click "Proceed to Estimate"

**Expected Results:**
- [ ] Plan viewer loads with pan/zoom controls
- [ ] Takeoff items list loads grouped by page
- [ ] Accept: item gets green border, status → "accepted"
- [ ] Reject: item gets red border + strikethrough, status → "rejected"
- [ ] Edit: modal opens with pre-filled values
- [ ] Edit save: item gets blue border, status → "edited"
- [ ] Tapping item highlights region in viewer
- [ ] "Proceed" button disabled until all items reviewed
- [ ] "Proceed" button enables when review complete

**Status:** ⏳ PENDING (requires manual testing)

**Notes:**
- Filter/search by trade, confidence, review status
- Bulk actions: accept all, reject all
- Mobile: stacked layout (plan top, list bottom)
- Desktop: side-by-side (plan 60%, list 40%)

---

### ✅ Flow 4: Apply Costs → Template Application → Save Estimate

**Steps:**
1. From review screen, click "Proceed to Estimate"
2. Navigate to costing view
3. Edit material/labor/equipment costs
4. Apply pricing template (if exists)
5. Verify totals recalculate
6. Save estimate

**Expected Results:**
- [ ] Cost editor loads with line items from takeoff
- [ ] Inline editing for cost inputs (material, labor, equipment)
- [ ] Unit cost and subtotal calculate automatically
- [ ] Overhead % and markup % apply correctly
- [ ] Template application matches items by category/trade
- [ ] Grand total updates in real-time (debounced 100ms)
- [ ] "Save Estimate" creates `estimates` and `estimate_line_items` records
- [ ] Navigation to summary view after save

**Status:** ⏳ PENDING (requires manual testing)

**Notes:**
- Default overhead: 10%
- Default markup: 15%
- Formula: `subtotal + (subtotal × overhead) + (subtotal × markup) = grand_total`
- Templates save pricing per category/trade for reuse

---

### ✅ Flow 5: View Estimate → Approve → Create Materials/Expense

**Steps:**
1. From saved estimate, view summary
2. Review trade-grouped breakdown
3. Click "Approve" (admin/PM only)
4. Confirm approval in dialog
5. Click "Create Materials" to sync with Materials module
6. Click "Create Expense" to sync with Expenses module

**Expected Results:**
- [ ] Summary displays all line items grouped by trade
- [ ] Totals section shows subtotal, overhead, markup, grand total
- [ ] Approve button visible only for admin/PM roles
- [ ] Approval updates estimate status to "approved"
- [ ] "Create Materials" generates `materials` records from line items
- [ ] "Create Expense" generates `expenses` record with breakdown
- [ ] Toast confirms material/expense creation with count

**Status:** ⏳ PENDING (requires manual testing)

**Notes:**
- Read-only for foreman/field_worker roles
- Version history shows superseded estimates
- Export to PDF feature (future enhancement)

---

### ✅ Flow 6: Budget Warning at 80% → Hard Stop at 100%

**Steps:**
1. Mock AI usage to 80%+ via `getAiUsage()`
2. Navigate to Estimates tab
3. Verify yellow warning banner appears
4. Mock AI usage to 100%+
5. Verify red exceeded banner appears
6. Verify "Parse with AI" button is disabled

**Expected Results:**
- [ ] 80-99% usage: yellow banner with warning text
- [ ] 100%+ usage: red banner with exceeded text
- [ ] Exceeded state disables AI parsing
- [ ] Banner is dismissible (sessionStorage)
- [ ] Banner reappears on next visit if not dismissed

**Status:** ⏳ PENDING (requires mock data)

**Notes:**
- Budget tracking is UI-only (not enforced server-side)
- Monthly reset handled by client logic
- Actual OpenAI billing is separate from UI budget display

---

## Error Cases

### ❌ File Too Large (> 50MB)

**Test:**
1. Attempt to upload 51MB PDF file

**Expected:**
- [ ] Client-side validation rejects upload
- [ ] Error toast: "File exceeds 50MB limit"
- [ ] File input resets without upload

**Status:** ⏳ PENDING

---

### ❌ Unsupported MIME Type

**Test:**
1. Attempt to upload .docx or .xlsx file

**Expected:**
- [ ] Client-side validation rejects upload
- [ ] Error toast: "Only PDF, JPG, and PNG files are accepted"
- [ ] File input resets without upload

**Status:** ⏳ PENDING

---

### ❌ PDF Conversion Failure

**Test:**
1. Upload corrupted PDF file
2. Monitor processing status

**Expected:**
- [ ] Upload succeeds but processing fails
- [ ] Status updates to "failed"
- [ ] Error message displays: "PDF conversion failed"
- [ ] Retry button appears (admin/PM only)

**Status:** ⏳ PENDING

**Notes:**
- Requires intentionally corrupted PDF for testing

---

### ❌ AI Parse Failure

**Test:**
1. Trigger AI parsing on valid plan
2. Mock OpenAI API error

**Expected:**
- [ ] Parsing status updates to "parse_failed"
- [ ] Error message displays OpenAI error
- [ ] Retry button appears
- [ ] Failed pages can be re-parsed individually

**Status:** ⏳ PENDING

**Notes:**
- Common causes: OpenAI rate limit, invalid API key, timeout

---

## Role Gates

### 🔒 Foreman Role Restrictions

**Test:**
1. Login as user with role "foreman"
2. Navigate to Estimates tab

**Expected:**
- [ ] "Upload Plan" button is NOT visible
- [ ] "Parse with AI" button is NOT visible
- [ ] "Approve" button is NOT visible on estimates
- [ ] Can view estimates (read-only)
- [ ] Can navigate between tabs

**Status:** ⏳ PENDING (requires test account with foreman role)

---

### 🔒 Field Worker Role Restrictions

**Test:**
1. Login as user with role "field_worker"
2. Navigate to Estimates tab

**Expected:**
- [ ] Same restrictions as foreman
- [ ] Read-only access only

**Status:** ⏳ PENDING

---

## Performance Tests

### ⚡ Plan Viewer Performance

**Test:**
1. Load plan with 10+ pages
2. Pan and zoom on mobile (iPhone SE simulator)
3. Monitor FPS in Chrome DevTools Performance tab

**Expected:**
- [ ] Initial load: < 1 second
- [ ] Pan gesture: 60fps (no dropped frames)
- [ ] Pinch-to-zoom: 60fps
- [ ] Page navigation: < 200ms transition

**Status:** ⏳ PENDING

**Tools:**
- Chrome DevTools → Performance → Start Recording
- Safari iOS Simulator for mobile testing

---

### ⚡ Cost Editor Recalculation

**Test:**
1. Load estimate with 50+ line items
2. Edit cost input
3. Monitor debounced total recalculation

**Expected:**
- [ ] Debounce delay: 100ms
- [ ] Total updates within 200ms of last keystroke
- [ ] No UI lag or jank during typing

**Status:** ⏳ PENDING

---

### ⚡ Large Takeoff Item List

**Test:**
1. Parse plan resulting in 200+ takeoff items
2. Scroll through item list
3. Monitor scroll performance

**Expected:**
- [ ] Render time: < 500ms
- [ ] Scroll performance: 60fps
- [ ] No virtualization needed (< 200 items)

**Status:** ⏳ PENDING

**Notes:**
- If performance degrades beyond 200 items, implement virtualization with `@tanstack/react-virtual`

---

## Server Action Tests

### ✅ `getPlanUploads(projectId)`

**Test:**
```typescript
const result = await getPlanUploads('test-project-id');
```

**Expected:**
- [ ] Returns `{ data: PlanUpload[], error: null }` on success
- [ ] Returns `{ data: [], error: string }` on failure
- [ ] RLS policy enforces company_id access
- [ ] Includes related plan_pages count

**Status:** ⏳ PENDING

---

### ✅ `getEstimates(projectId)`

**Test:**
```typescript
const result = await getEstimates('test-project-id');
```

**Expected:**
- [ ] Returns `{ data: Estimate[], error: null }` on success
- [ ] Returns `{ data: [], error: string }` on failure
- [ ] Sorted by created_at DESC
- [ ] Includes grand_total calculated field

**Status:** ⏳ PENDING

---

### ✅ `getTakeoffItems(planUploadId)`

**Test:**
```typescript
const result = await getTakeoffItems('test-plan-upload-id');
```

**Expected:**
- [ ] Returns `{ data: TakeoffItem[], error: null }` on success
- [ ] Grouped by page_number in client component
- [ ] Source regions parsed as JSON objects

**Status:** ⏳ PENDING

---

### ✅ `reviewTakeoffItem({ itemId, reviewStatus, editedValues })`

**Test:**
```typescript
const result = await reviewTakeoffItem({
  itemId: 'test-item-id',
  reviewStatus: 'accepted',
  editedValues: null,
});
```

**Expected:**
- [ ] Updates `takeoff_items.review_status`
- [ ] Stores edited values in `edited_*` columns if provided
- [ ] Returns updated item
- [ ] Optimistic UI update before server response

**Status:** ⏳ PENDING

---

### ✅ `createEstimate({ projectId, planUploadId, lineItems, overhead, markup })`

**Test:**
```typescript
const result = await createEstimate({
  projectId: 'test-project-id',
  planUploadId: 'test-plan-upload-id',
  lineItems: [...],
  overhead: 10,
  markup: 15,
});
```

**Expected:**
- [ ] Creates `estimates` record
- [ ] Creates `estimate_line_items` records (bulk insert)
- [ ] Calculates grand_total server-side
- [ ] Returns estimate ID

**Status:** ⏳ PENDING

---

### ✅ `applyPricingTemplate(templateId, estimateId)`

**Test:**
```typescript
const result = await applyPricingTemplate('template-id', 'estimate-id');
```

**Expected:**
- [ ] Matches template items to estimate line items by category/trade
- [ ] Updates cost fields (material, labor, equipment)
- [ ] Returns count of matched items
- [ ] Toast: "Applied to X items"

**Status:** ⏳ PENDING

---

## Cache Testing

### 🔄 Duplicate Plan Parsing

**Test:**
1. Parse same plan multiple times
2. Verify cached results are used

**Expected:**
- [ ] First parse: sends images to OpenAI, stores results
- [ ] Subsequent parses: retrieves cached results (no OpenAI call)
- [ ] Cache keyed by plan page file path
- [ ] Cache invalidation on page update

**Status:** ⏳ PENDING

**Notes:**
- Cache implementation reduces duplicate API costs
- Verify via server logs (no OpenAI request on cached parse)

---

## Build Validation

### ✅ TypeScript Build

```bash
npm run lint:ts
```

**Expected:**
- [ ] Zero TypeScript errors
- [ ] All type imports resolve correctly

**Status:** ⏳ PENDING

---

### ✅ ESLint

```bash
npm run lint
```

**Expected:**
- [ ] Zero ESLint errors
- [ ] Zero ESLint warnings

**Status:** ⏳ PENDING

---

### ✅ Production Build

```bash
npm run build
```

**Expected:**
- [ ] Build completes without errors
- [ ] Bundle size analysis shows no unexpected bloat
- [ ] All dynamic imports code-split correctly

**Status:** ⏳ PENDING

---

## Console Errors

**Test:**
1. Navigate through all sub-views
2. Monitor browser console

**Expected:**
- [ ] Zero console errors during normal flow
- [ ] Zero console warnings (except expected third-party)
- [ ] No hydration mismatches

**Status:** ⏳ PENDING

---

## Summary

**Total Tests:** 45
**Completed:** 0
**Pending Manual Testing:** 45

**Requires:**
- [ ] Dev server running (`npm run dev`)
- [ ] `OPENAI_API_KEY` configured
- [ ] Supabase storage bucket created (`plan-files`)
- [ ] Test account with admin role
- [ ] Test account with foreman role
- [ ] Test PDF files (valid, corrupted, >50MB)
- [ ] Test project seeded in database

**Next Steps:**
1. Run `npm run setup:estimates` to verify environment
2. Start dev server: `npm run dev`
3. Login as admin user
4. Navigate to test project
5. Execute each flow manually
6. Update test results status: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
7. Document any issues found in `.claude/tasks/features/ai-plan-estimator/issues.md`

---

**Status:** ⏳ PENDING MANUAL EXECUTION
**Last Updated:** 2026-02-08
