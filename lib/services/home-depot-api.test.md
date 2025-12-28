# Home Depot API Service - Test Plan

## Manual Testing Guide

Use this guide to manually test the SerpAPI integration.

---

## Pre-Test Setup

### Option A: Test with Real API

1. Get SerpAPI API key from https://serpapi.com/
2. Add to `.env.local`:
   ```bash
   SERPAPI_API_KEY=your_actual_key_here
   ```
3. Restart dev server: `npm run dev`

### Option B: Test with Mock Data

1. Comment out API key in `.env.local`:
   ```bash
   # SERPAPI_API_KEY=your_key_here
   ```
2. Restart dev server: `npm run dev`

---

## Test Cases

### Test 1: Basic Product Search (Real API)

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `http://localhost:3000/app/materials`
2. In search box, type: "lumber"
3. Click search or press Enter

**Expected Results**:
- ✅ Console shows: `Fetching from SerpAPI: lumber`
- ✅ Multiple Home Depot products displayed
- ✅ Products have real prices (varying amounts)
- ✅ Products have images (Home Depot product images)
- ✅ SKU/model numbers are present
- ✅ Stock status badges show (in stock, low stock, etc.)
- ✅ Manufacturer/brand names displayed
- ✅ Product categories assigned

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 2: Category Filter

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "paint"
3. Select category filter: "Paint & Supplies"
4. Click search

**Expected Results**:
- ✅ Results filtered to paint category
- ✅ Products related to paint (primer, stain, etc.)
- ✅ Category badge shows "Paint"
- ✅ Non-paint products excluded

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 3: Price Range Filter

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "concrete"
3. Set price filter: Min $5, Max $10
4. Click search

**Expected Results**:
- ✅ All products priced between $5 and $10
- ✅ Products outside range excluded
- ✅ Price displayed correctly formatted

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 4: Stock Status Filter

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "drywall"
3. Enable "In Stock Only" filter
4. Click search

**Expected Results**:
- ✅ Only in-stock products shown
- ✅ Stock badge shows "In Stock"
- ✅ Out of stock products excluded

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 5: Pagination

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "electrical" (broad term)
3. Scroll to bottom
4. Click "Load More" or pagination buttons

**Expected Results**:
- ✅ Additional products loaded
- ✅ No duplicate products
- ✅ Page number increments
- ✅ Total results count shown

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 6: Cache Functionality

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "lumber"
3. Note console message: `Fetching from SerpAPI: lumber`
4. Clear search and search for "lumber" again (within 30 minutes)
5. Check console

**Expected Results**:
- ✅ First search: `Fetching from SerpAPI: lumber`
- ✅ Second search: `Returning cached Home Depot search results`
- ✅ Same products returned
- ✅ Faster response time on second search

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 7: Mock Data Fallback (No API Key)

**Prerequisites**: API key NOT configured (commented out)

**Steps**:
1. Remove/comment API key in `.env.local`
2. Restart dev server
3. Navigate to `/app/materials`
4. Search for: "lumber"

**Expected Results**:
- ✅ Console shows: `SERPAPI_API_KEY not configured, using mock data`
- ✅ Sample products displayed (12 mock products)
- ✅ Mock products have consistent data
- ✅ No API errors in console
- ✅ App continues to work normally

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 8: Error Handling (Invalid API Key)

**Prerequisites**: Invalid API key

**Steps**:
1. Set invalid API key in `.env.local`: `SERPAPI_API_KEY=invalid_key_123`
2. Restart dev server
3. Navigate to `/app/materials`
4. Search for: "concrete"

**Expected Results**:
- ✅ Console shows error: `SerpAPI request failed: ...` or `SerpAPI error: ...`
- ✅ Console shows: `Falling back to mock data`
- ✅ Mock products displayed
- ✅ App doesn't crash
- ✅ User can continue using app

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 9: Product Comparison

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "paint"
3. Click checkboxes on 2-4 products
4. Click "Compare Products" button
5. Review comparison modal

**Expected Results**:
- ✅ Comparison modal opens
- ✅ Products displayed side-by-side
- ✅ Prices highlighted (lowest/highest)
- ✅ Specifications shown
- ✅ Images displayed
- ✅ Can assign from comparison view

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 10: Material Assignment

**Prerequisites**: API key configured, logged in user

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "drywall"
3. Click "Assign to Task" on any product
4. Select project, phase, task
5. Enter quantity: 10
6. Select purchaser type
7. Click "Assign Material"

**Expected Results**:
- ✅ Assignment modal opens
- ✅ Material details populated from API
- ✅ Live price shown
- ✅ Total cost calculated (price × quantity)
- ✅ Assignment created successfully
- ✅ Material added to task
- ✅ Success message shown

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 11: Product Details Accuracy

**Prerequisites**: API key configured

**Steps**:
1. Navigate to `/app/materials`
2. Search for: "2x4 stud"
3. Examine first product result
4. Click product URL to view on Home Depot website
5. Compare data

**Expected Results**:
- ✅ Product name matches
- ✅ Price matches (or close - prices may fluctuate)
- ✅ Image matches
- ✅ SKU/model number matches
- ✅ Stock status matches
- ✅ Specifications match

**Pass/Fail**: _______

**Notes**: _______________________________________________

---

### Test 12: Multiple Searches (Rate Limit)

**Prerequisites**: API key configured (free tier)

**Steps**:
1. Navigate to `/app/materials`
2. Perform 10 different searches rapidly:
   - "lumber"
   - "concrete"
   - "electrical wire"
   - "plumbing pipe"
   - "drywall"
   - "paint"
   - "roofing shingle"
   - "flooring"
   - "insulation"
   - "hardware"

**Expected Results**:
- ✅ All searches return results
- ✅ No rate limit errors (under 100 searches)
- ✅ Cached results returned when applicable
- ✅ API calls counted correctly

**Pass/Fail**: _______

**API Calls Used**: _______ / 100

**Notes**: _______________________________________________

---

## Test Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Basic Search | ☐ Pass ☐ Fail | |
| 2. Category Filter | ☐ Pass ☐ Fail | |
| 3. Price Filter | ☐ Pass ☐ Fail | |
| 4. Stock Filter | ☐ Pass ☐ Fail | |
| 5. Pagination | ☐ Pass ☐ Fail | |
| 6. Cache | ☐ Pass ☐ Fail | |
| 7. Mock Fallback | ☐ Pass ☐ Fail | |
| 8. Error Handling | ☐ Pass ☐ Fail | |
| 9. Comparison | ☐ Pass ☐ Fail | |
| 10. Assignment | ☐ Pass ☐ Fail | |
| 11. Data Accuracy | ☐ Pass ☐ Fail | |
| 12. Rate Limits | ☐ Pass ☐ Fail | |

---

## Issues Found

Document any issues discovered during testing:

### Issue 1
**Description**: _______________________________________________
**Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low
**Steps to Reproduce**: _______________________________________________
**Expected**: _______________________________________________
**Actual**: _______________________________________________

### Issue 2
**Description**: _______________________________________________
**Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low
**Steps to Reproduce**: _______________________________________________
**Expected**: _______________________________________________
**Actual**: _______________________________________________

---

## Performance Notes

### Response Times
- First search (no cache): _______ ms
- Cached search: _______ ms
- API call latency: _______ ms

### API Usage
- Total API calls in test session: _______
- Cached responses: _______
- Failed requests: _______

---

## Browser Compatibility

Test in multiple browsers:

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | _______ | ☐ Pass ☐ Fail | |
| Firefox | _______ | ☐ Pass ☐ Fail | |
| Safari | _______ | ☐ Pass ☐ Fail | |
| Edge | _______ | ☐ Pass ☐ Fail | |

---

## Mobile Testing

Test on mobile devices:

| Device | OS | Status | Notes |
|--------|-----|--------|-------|
| iPhone | iOS __ | ☐ Pass ☐ Fail | |
| Android | ______ | ☐ Pass ☐ Fail | |
| iPad | iOS __ | ☐ Pass ☐ Fail | |

---

## Final Checklist

- ☐ All test cases passed
- ☐ No critical issues found
- ☐ Performance acceptable
- ☐ Browser compatibility verified
- ☐ Mobile experience tested
- ☐ Error handling works
- ☐ Cache functioning correctly
- ☐ Mock fallback works
- ☐ Documentation reviewed

---

## Sign-off

**Tester**: _______________________________________________
**Date**: _______________________________________________
**Overall Result**: ☐ Pass ☐ Fail ☐ Pass with Issues

**Comments**: _______________________________________________
_______________________________________________
_______________________________________________
