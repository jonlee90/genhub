# Cron Jobs - Materials Enhancement

This directory contains scheduled jobs for the Materials Enhancement feature.

## Jobs

### 1. Update Material Prices
**Path:** `/api/cron/update-material-prices`
**Schedule:** Daily at 2:00 AM UTC (`0 2 * * *`)
**Purpose:** Sync material prices from Home Depot API

**Process:**
1. Queries all materials with `home_depot_product_id IS NOT NULL`
2. Fetches current price from Home Depot API (via SerpAPI)
3. Updates `materials.unit_price` and `stock_status` if changed
4. Inserts price history record
5. Rate limits requests (100ms delay between materials)

**Response:**
```json
{
  "success": true,
  "updated": 15,
  "errors": 2,
  "total": 17,
  "errorDetails": [
    {
      "materialId": "uuid",
      "error": "Product not found in Home Depot API"
    }
  ]
}
```

### 2. Cleanup Price History
**Path:** `/api/cron/cleanup-price-history`
**Schedule:** Daily at 3:00 AM UTC (`0 3 * * *`)
**Purpose:** Delete price history records older than 90 days

**Process:**
1. Deletes records where `recorded_at < NOW() - INTERVAL '90 days'`

**Response:**
```json
{
  "success": true,
  "deleted": 234
}
```

## Environment Variables

### Required
- `CRON_SECRET` - Secure random string for protecting cron endpoints
- `SERPAPI_API_KEY` - SerpAPI key for Home Depot product data

### Setup
1. Generate a secure random string for `CRON_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env.local`:
   ```
   CRON_SECRET=your-secure-random-string
   SERPAPI_API_KEY=your-serpapi-key
   ```

3. Add to Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` (Production)
   - Add `SERPAPI_API_KEY` (Production, if not already set)

## Vercel Configuration

Cron schedules are defined in `vercel.json`:

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

**Schedule format:** `minute hour day month weekday` (UTC timezone)

## Testing

### Local Testing

```bash
# Start dev server
npm run dev

# Test price update (replace YOUR_SECRET)
curl -H "Authorization: Bearer YOUR_SECRET" \
     http://localhost:3000/api/cron/update-material-prices

# Test cleanup
curl -H "Authorization: Bearer YOUR_SECRET" \
     http://localhost:3000/api/cron/cleanup-price-history

# Test unauthorized (should return 401)
curl http://localhost:3000/api/cron/update-material-prices
```

### Vercel Testing

After deployment:

1. **Check Vercel Dashboard**
   - Go to Project → Settings → Cron Jobs
   - Verify both jobs appear with correct schedules

2. **Manual Trigger**
   - In Vercel dashboard, manually trigger a job
   - Review logs for errors

3. **Monitor Scheduled Runs**
   - Jobs run automatically at scheduled times
   - Check logs in Vercel dashboard → Deployments → Function Logs

## Monitoring

### Success Metrics
- `updated` count in price update job
- `deleted` count in cleanup job
- Low `errors` count

### Error Handling
- Price update job continues processing even if individual materials fail
- Error details included in response (limited to 10)
- All errors logged to console for Vercel log inspection

### Rate Limiting
- Price update job adds 100ms delay between API requests
- Home Depot API service has built-in retry logic (3 attempts)
- Exponential backoff for rate limit errors (429)

## Database Tables

### material_price_history
Created by price update job:
```sql
CREATE TABLE material_price_history (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  material_id uuid NOT NULL,
  price numeric(10,2) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'home_depot_api',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Cleaned by cleanup job (records > 90 days deleted).

## Security

- **Cron Secret:** Endpoints protected with `Authorization: Bearer {CRON_SECRET}`
- **Admin Client:** Uses `createAdminClient()` with service role (bypasses RLS)
- **Vercel Only:** Vercel automatically adds correct Authorization header to cron requests
- **No Public Access:** Unauthorized requests return 401

## Troubleshooting

### Cron job not running
1. Verify `vercel.json` is deployed
2. Check Vercel dashboard → Cron Jobs shows scheduled jobs
3. Ensure project is on Vercel Pro plan (required for cron)

### Price updates failing
1. Check `SERPAPI_API_KEY` is set in Vercel environment
2. Verify SerpAPI account has remaining credits
3. Review function logs for specific errors

### Cleanup job not deleting records
1. Verify `material_price_history` table exists
2. Check RLS policies allow service role access
3. Review function logs for database errors

## References
- Design doc: `docs/specs/materials-page-enhancement/design.md`
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Home Depot API: `lib/services/home-depot-api.ts`
