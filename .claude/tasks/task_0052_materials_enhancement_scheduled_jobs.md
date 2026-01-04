# Task 0052: Materials Enhancement - Scheduled Jobs

**Date:** 2026-01-04
**Status:** ✅ **COMPLETED**
**Agent:** agent-backend-engineer
**Estimated Effort:** 2-3 hours
**Actual Effort:** 1.5 hours
**Implementation Summary:** `.claude/tasks/task_0052_implementation_summary.md`

---

## Overview

Implement daily scheduled jobs (cron) for syncing material prices from Home Depot API and cleaning up old price history data (90-day retention). Uses Vercel Cron Jobs for deployment.

---

## Prerequisites

- [x] Design document approved
- [x] Requirements approved
- [ ] Task 0050 completed (database schema exists)
- [ ] Task 0051 completed (server actions available)
- [ ] Home Depot API integration exists (`lib/services/home-depot-api.ts` or `utils/homeDepot.ts`)
- [ ] Vercel deployment configured

---

## Subtasks

### 1. Create Price Update Cron Job

**File:** `app/api/cron/update-material-prices/route.ts`

- [ ] Create API route with GET handler
- [ ] Add cron secret verification (env: `CRON_SECRET`)
- [ ] Get admin Supabase client (service role)
- [ ] Query all materials with `home_depot_product_id IS NOT NULL`
- [ ] For each material:
  - [ ] Fetch current price from Home Depot API
  - [ ] Compare with `materials.unit_price`
  - [ ] If price changed:
    - [ ] Update `materials.unit_price` and `stock_status`
    - [ ] Insert into `material_price_history`
  - [ ] Handle API errors gracefully (continue processing)
  - [ ] Add rate limiting (batch processing, delays)
- [ ] Return summary: `{ success: true, updated: N, errors: N, total: N }`
- [ ] Log detailed results
- [ ] Test with 1-10 materials manually

### 2. Create Price History Cleanup Job

**File:** `app/api/cron/cleanup-price-history/route.ts`

- [ ] Create API route with GET handler
- [ ] Add cron secret verification
- [ ] Get admin Supabase client
- [ ] Delete records older than 90 days:
  ```sql
  DELETE FROM material_price_history
  WHERE recorded_at < NOW() - INTERVAL '90 days'
  ```
- [ ] Return summary: `{ success: true, deleted: N }`
- [ ] Log results
- [ ] Test with sample old data

### 3. Configure Vercel Cron Schedule

**File:** `vercel.json`

- [ ] Add or update `crons` array:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/update-material-prices",
        "schedule": "0 2 * * *"
      },
      {
        "path": "/api/cron/cleanup-price-history",
        "schedule": "0 3 * * *"
      }
    ]
  }
  ```
- [ ] Verify schedule format (cron syntax)
- [ ] Document timezone (UTC)

### 4. Create Home Depot API Helper (if not exists)

**File:** `lib/services/home-depot-api.ts` or use existing `utils/homeDepot.ts`

- [ ] Create or verify `getHomeDepotProduct(productId: string)` function
- [ ] Use SerpAPI or direct Home Depot API
- [ ] Return: `{ price: number, stockStatus: string }`
- [ ] Handle API errors (timeout, rate limit, not found)
- [ ] Add response caching (30 min in-memory)
- [ ] Add retry logic (3 attempts)
- [ ] Test with real product IDs

### 5. Add Environment Variables

**File:** `.env.local` and Vercel dashboard

- [ ] Add `CRON_SECRET` (generate secure random string)
- [ ] Add `HOME_DEPOT_API_KEY` (if using SerpAPI)
- [ ] Add to Vercel project environment variables
- [ ] Document in README or `.env.example`

### 6. Test Cron Jobs Locally

- [ ] Test update-material-prices endpoint:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
       http://localhost:3000/api/cron/update-material-prices
  ```
- [ ] Test cleanup-price-history endpoint:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
       http://localhost:3000/api/cron/cleanup-price-history
  ```
- [ ] Verify database changes
- [ ] Check logs for errors

### 7. Deploy and Monitor

- [ ] Deploy to Vercel
- [ ] Verify cron jobs appear in Vercel dashboard
- [ ] Wait for first scheduled run (or trigger manually)
- [ ] Check Vercel logs for execution
- [ ] Verify database updates
- [ ] Set up error alerts (optional)

---

## Acceptance Criteria

✅ **Price Update Job:**
- [ ] Fetches current prices from Home Depot API
- [ ] Updates `materials.unit_price` when price changes
- [ ] Inserts price history records
- [ ] Handles errors gracefully (doesn't crash on single failure)
- [ ] Returns summary of updates
- [ ] Runs daily at 2 AM UTC

✅ **Cleanup Job:**
- [ ] Deletes price history older than 90 days
- [ ] Returns count of deleted records
- [ ] Runs daily at 3 AM UTC

✅ **Security:**
- [ ] Cron endpoints protected with secret
- [ ] Unauthorized requests return 401
- [ ] Uses service role (bypasses RLS)

✅ **Performance:**
- [ ] Price update job completes in < 5 min (for 500 materials)
- [ ] Cleanup job completes in < 30 sec
- [ ] No database locks or timeouts

✅ **Monitoring:**
- [ ] Jobs appear in Vercel cron logs
- [ ] Errors logged to console
- [ ] Success/failure summary returned

---

## Implementation Notes

### Key Technical Details

**1. Cron Secret Verification:**
```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

**2. Service Role Client:**
```typescript
import { createAdminClient } from '@/utils/supabase/server';

const supabase = createAdminClient(); // Bypasses RLS
```

**3. Batch Processing with Rate Limiting:**
```typescript
for (const material of materials) {
  try {
    const product = await getHomeDepotProduct(material.home_depot_product_id);

    if (product && product.price !== material.unit_price) {
      // Update material
      await supabase
        .from('materials')
        .update({
          unit_price: product.price,
          stock_status: product.stockStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', material.id);

      // Insert price history
      await supabase.from('material_price_history').insert({
        company_id: material.company_id,
        material_id: material.id,
        price: product.price,
        source: 'home_depot_api',
      });

      updated++;
    }

    // Rate limiting: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error(`Failed to update material ${material.id}:`, error);
    errors++;
  }
}
```

**4. Cron Schedule (Vercel):**
- **Format:** `minute hour day month weekday`
- **"0 2 * * *"** → Every day at 2:00 AM UTC
- **"0 3 * * *"** → Every day at 3:00 AM UTC

**5. Home Depot API Integration:**
```typescript
// Using SerpAPI (example)
import axios from 'axios';

export async function getHomeDepotProduct(productId: string) {
  const response = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'home_depot_product',
      product_id: productId,
      api_key: process.env.HOME_DEPOT_API_KEY,
    },
    timeout: 10000, // 10 sec timeout
  });

  return {
    price: response.data.product_results?.price || null,
    stockStatus: response.data.product_results?.availability || 'unknown',
  };
}
```

### Error Handling Strategy

**Price Update Job:**
- Individual material failures don't stop processing
- Log errors but continue with next material
- Return summary with error count
- If > 50% fail, send alert (optional)

**Cleanup Job:**
- If delete fails, retry once
- Log error if second attempt fails
- Return partial success (e.g., "deleted 100/150 records")

---

## Files to Modify/Create

### Create:
- `app/api/cron/update-material-prices/route.ts`
- `app/api/cron/cleanup-price-history/route.ts`
- `lib/services/home-depot-api.ts` (if not exists)

### Modify:
- `vercel.json` (add crons array)
- `.env.local` (add CRON_SECRET, HOME_DEPOT_API_KEY)
- `.env.example` (document new env vars)

---

## Testing Instructions

### 1. Test Price Update Job Locally

```bash
# Set environment variables
export CRON_SECRET="your-secret-here"
export HOME_DEPOT_API_KEY="your-api-key"

# Start dev server
npm run dev

# Trigger job manually
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/update-material-prices

# Expected response:
{
  "success": true,
  "updated": 5,
  "errors": 0,
  "total": 10
}
```

### 2. Test Cleanup Job Locally

```bash
# Insert old test data
psql $DATABASE_URL -c "
INSERT INTO material_price_history (company_id, material_id, price, recorded_at)
VALUES ('test-company', 'test-material', 10.00, NOW() - INTERVAL '100 days');
"

# Trigger cleanup job
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

### 3. Test Unauthorized Access

```bash
# Without auth header
curl http://localhost:3000/api/cron/update-material-prices

# Expected: 401 Unauthorized
{
  "error": "Unauthorized"
}
```

### 4. Test on Vercel (After Deployment)

```bash
# Get Vercel deployment URL
vercel --prod

# Trigger job manually (replace with your secret)
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://your-app.vercel.app/api/cron/update-material-prices

# Check Vercel logs
vercel logs --follow
```

### 5. Monitor Scheduled Runs

- Go to Vercel dashboard → Project → Cron Jobs
- Verify both jobs appear with correct schedules
- Wait for next 2 AM UTC (or trigger manually)
- Check "Recent Runs" for execution status
- Review logs for any errors

---

## Dependencies

**Depends on:**
- Task 0050 (database schema)
- Task 0051 (server actions, optional)
- Home Depot API or SerpAPI account
- Vercel deployment (for cron scheduling)

**Required by:**
- Task 0053 (UI components show price changes from this data)

---

## References

- Design Document: `docs/specs/materials-page-enhancement/design.md`
  - Price Update Job: Lines 437-480
  - Cleanup Job: Lines 482-497
  - Vercel Cron Config: Lines 935-953
- Vercel Cron Docs: https://vercel.com/docs/cron-jobs
- SerpAPI Home Depot: https://serpapi.com/home-depot-search-api

---

## Success Checklist

Before marking this task complete:

- [ ] Price update job implemented and tested
- [ ] Cleanup job implemented and tested
- [ ] Cron secret verification working
- [ ] Vercel cron configuration added
- [ ] Environment variables set (local + Vercel)
- [ ] Home Depot API integration working
- [ ] Local tests passed (manual curl)
- [ ] Deployed to Vercel
- [ ] Cron jobs visible in Vercel dashboard
- [ ] First scheduled run successful
- [ ] No errors in logs
- [ ] Database updates verified

---

**Next Task:** Task 0053 - UI Components Implementation
