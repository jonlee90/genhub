# EST-P3-004: Historical Cost Analytics

**Parent Task:** `EST-P3-004` in `tasks-phase3-phase4.md`
**Priority:** P2 - Future
**Total Effort:** ~3.5 days
**Dependencies:** None (analyzes existing estimates data)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P3-004-A | Database migration | backend-engineer | 0.5d | — |
| P3-004-B | Analytics server actions | backend-engineer | 0.5d | P3-004-A |
| P3-004-C | CostTrendChart + TradeComparisonChart | frontend-engineer | 1.0d | P3-004-B |
| P3-004-D | WinLossChart + PricePredictor | frontend-engineer | 1.0d | P3-004-B |
| P3-004-E | AnalyticsDashboard + tab integration | frontend-engineer | 0.5d | P3-004-C, P3-004-D |

---

## P3-004-A: Database Migration

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_add_bid_outcome_to_estimates.sql`

**Task:**
Add bid tracking columns to the existing `estimates` table.

```sql
ALTER TABLE public.estimates
ADD COLUMN IF NOT EXISTS bid_outcome TEXT
  CHECK (bid_outcome IN ('pending', 'won', 'lost', 'withdrawn')),
ADD COLUMN IF NOT EXISTS bid_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bid_amount NUMERIC(12,2);

CREATE INDEX idx_estimates_outcome ON estimates(bid_outcome, bid_submitted_at DESC);
CREATE INDEX idx_estimates_company_date ON estimates(company_id, created_at DESC);
```

**Acceptance Criteria:**
- [ ] Migration runs without errors on existing data
- [ ] `bid_outcome` defaults to NULL (not 'pending') — no backfill needed
- [ ] Index supports outcome filter + date sort queries
- [ ] `npm run db:gen-types` produces updated types with new optional columns

---

## P3-004-B: Analytics Server Actions

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P3-004-A

**Files:**
- `app/actions/analytics.ts` (new file)

**Signatures:**
```typescript
// Cost trend: total_cost / project.sq_ft grouped by month
getCostTrendData(filters: AnalyticsFilters): Promise<{
  data: Array<{ month: string; costPerSqFt: number; estimateCount: number }>
  error: string | null
}>

// Trade breakdown: avg unit cost per trade across filtered estimates
getTradeComparisonData(filters: AnalyticsFilters): Promise<{
  data: Array<{ trade: string; avgUnitCost: number; totalCost: number; estimateCount: number }>
  error: string | null
}>

// Win/loss: count grouped by bid_outcome
getWinLossData(filters: AnalyticsFilters): Promise<{
  data: Array<{ outcome: string; count: number; totalBidAmount: number }>
  error: string | null
}>

// Material price predictor: avg unit_cost for trade + category last 12 months
getPredictedUnitCost(trade: string, category: string, projectType?: string): Promise<{
  data: { predicted: number; sampleSize: number; confidence: 'high' | 'medium' | 'low' }
  error: string | null
}>

// Export: returns CSV string
exportAnalyticsReport(filters: AnalyticsFilters): Promise<{
  data: string  // CSV content
  filename: string
  error: string | null
}>

interface AnalyticsFilters {
  dateRange?: { from: string; to: string }
  projectType?: string
  bidOutcome?: string
  trades?: string[]
  companyId: string  // always scoped to company
}
```

All queries use `Promise.all` for parallel execution where independent.

**Skills Applied:**
- `async-parallel` — parallel fetch for chart data sets

**Acceptance Criteria:**
- [ ] All queries scoped to `company_id` from `auth()`
- [ ] `getCostTrendData` returns monthly buckets with no gaps
- [ ] `exportAnalyticsReport` returns valid CSV (header + data rows)
- [ ] Filters are applied correctly in SQL WHERE clauses

---

## P3-004-C: CostTrendChart + TradeComparisonChart

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-004-B

**Files:**
- `components/estimates/CostTrendChart.tsx` (new)
- `components/estimates/TradeComparisonChart.tsx` (new)

**Task:**
Use `recharts` loaded via `next/dynamic` (never imported directly at module level).

**`CostTrendChart`:**
- `<LineChart>` showing cost-per-sqft over time
- X-axis: month labels, Y-axis: $/sqft
- Tooltip: "March 2025: $42.50/sqft (3 estimates)"
- Empty state: "No data for selected period" (no chart rendered)

**`TradeComparisonChart`:**
- `<BarChart>` grouped by trade
- X-axis: trade names, Y-axis: avg unit cost
- Color: each trade gets a consistent color from design tokens
- Tooltip: trade name + avg cost + estimate count

Both components:
- Accept pre-fetched `data` prop (no fetching inside component)
- Show skeleton while `data === null`
- Responsive: `<ResponsiveContainer width="100%" height={240}>`

```typescript
interface CostTrendChartProps {
  data: CostTrendDataPoint[] | null
  isLoading?: boolean
}

interface TradeComparisonChartProps {
  data: TradeComparisonDataPoint[] | null
  isLoading?: boolean
}
```

**Skills Applied:**
- `bundle-dynamic-imports` — lazy load recharts
- `rerender-memo` — memo chart to avoid re-render on parent state changes
- `rendering-conditional-render` — ternary for empty/loading/data states

**Mobile Checks:**
- [ ] Charts are touch-scrollable (no overflow clipping)
- [ ] Tooltip touch-friendly (large enough hit area)
- [ ] `dark:` text + grid line variants

**Acceptance Criteria:**
- [ ] recharts loaded dynamically (not in initial bundle)
- [ ] Charts render correctly with mock data
- [ ] Empty state shown when `data` is empty array
- [ ] Skeleton shown when `data === null`

---

## P3-004-D: WinLossChart + PricePredictor

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P3-004-B

**Files:**
- `components/estimates/WinLossChart.tsx` (new)
- `components/estimates/PricePredictor.tsx` (new)

**Task:**

**`WinLossChart`:**
- `<PieChart>` with segments: Won (green), Lost (red), Pending (yellow), Withdrawn (gray)
- Center label: "Win Rate: 68%"
- Legend below chart
- Empty state: "No bids tracked yet — add bid outcomes to estimates"
- Dynamic import (recharts)

**`PricePredictor`:**
- Form: select Trade + Category + optional Project Type
- On submit: calls `getPredictedUnitCost` server action
- Shows result: "$42.50 / unit (based on 12 estimates, high confidence)"
- Confidence badge: green (high, n≥10), yellow (medium, n≥5), red (low, n<5)
- "Use This Price" button: fires `onApplyPrice(value)` callback prop

```typescript
interface PricePredictorProps {
  onApplyPrice: (value: number) => void
  initialTrade?: string
  initialCategory?: string
}
```

**Skills Applied:**
- `bundle-dynamic-imports` — recharts for WinLossChart
- `rerender-memo` — memo PricePredictor form
- `async-defer-await` — defer prediction until form submitted

**Mobile Checks:**
- [ ] Select dropdowns are `min-h-[44px]`
- [ ] "Use This Price" button is `min-h-[44px]`
- [ ] `active:scale-95` on action buttons
- [ ] `dark:` variants on confidence badges

**Acceptance Criteria:**
- [ ] Pie chart segments sized correctly per outcome counts
- [ ] PricePredictor shows confidence level with correct color
- [ ] "Use This Price" triggers `onApplyPrice` with numeric value
- [ ] Loading state while prediction fetches

---

## P3-004-E: AnalyticsDashboard + Tab Integration

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-004-C, P3-004-D

**Files:**
- `components/estimates/AnalyticsDashboard.tsx` (new)
- `components/estimates/EstimatesTabClient.tsx` (modified — add Analytics tab)

**Task:**

**`AnalyticsDashboard`:**
- Wrapper fetching all chart data in parallel via `Promise.all`
- Filter bar: date range picker, project type select, bid outcome select, trade multi-select
- Layout: 2-column grid on desktop, single column on mobile
- Export button: calls `exportAnalyticsReport`, triggers CSV download via `URL.createObjectURL`
- Comparison view: "Compare Estimates" button opens `ResponsiveModal` for side-by-side (v2 — stub for now)

```typescript
interface AnalyticsDashboardProps {
  companyId: string
}
```

**`EstimatesTabClient.tsx`:**
- Add "Analytics" as a new tab option (after existing tabs)
- Lazy-load `AnalyticsDashboard` via `next/dynamic`
- Tab shows only when user has ≥5 estimates (show "Collect more data" placeholder otherwise)

**Skills Applied:**
- `async-parallel` — `Promise.all` for all 4 chart data fetches
- `bundle-dynamic-imports` — lazy load AnalyticsDashboard
- `rendering-content-visibility` — `content-visibility: auto` on scrollable chart sections

**Mobile Checks:**
- [ ] Filter bar scrolls horizontally on mobile
- [ ] Export button is `min-h-[44px]`
- [ ] Dashboard scrollable with `pb-[env(safe-area-inset-bottom)]`
- [ ] `dark:` variants on filter bar + chart backgrounds

**Acceptance Criteria:**
- [ ] All 4 charts load in parallel (check Network tab — no waterfall)
- [ ] Filter changes re-fetch and re-render charts
- [ ] CSV export downloads correctly named file
- [ ] Tab visible only with ≥5 estimates
- [ ] Build passes with no TS errors
