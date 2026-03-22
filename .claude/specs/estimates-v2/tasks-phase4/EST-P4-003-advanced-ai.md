# EST-P4-003: Advanced AI Features

**Parent Task:** `EST-P4-003` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~5 days
**Dependencies:** EST-P2-001 (AI Chat must be complete)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-003-A | Anomaly detector | backend-engineer | 1.0d | — |
| P4-003-B | Cost forecaster | backend-engineer | 1.0d | — |
| P4-003-C | Bid optimizer + AI analysis actions | backend-engineer | 1.0d | P4-003-A, P4-003-B |
| P4-003-D | AnomalyAlert component | frontend-engineer | 0.5d | P4-003-A |
| P4-003-E | BidOptimizer component | frontend-engineer | 0.5d | P4-003-C |
| P4-003-F | CSI auto-categorization | backend-engineer | 0.5d | — |

---

## P4-003-A: Anomaly Detector

**Agent:** backend-engineer
**Effort:** 1.0 days

**Files:**
- `lib/ai/anomaly-detector.ts` (new)

**Task:**
Statistical outlier detection using Z-score against historical company averages.

```typescript
export interface AnomalyResult {
  itemId: string
  field: 'quantity' | 'unit_cost'
  value: number
  historicalMean: number
  historicalStdDev: number
  zScore: number
  severity: 'warning' | 'error'  // warning: Z > 2.0, error: Z > 3.0
  message: string
}

export async function detectAnomalies(
  estimateId: string,
  companyId: string
): Promise<AnomalyResult[]>

// Called per-item for real-time inline alerts
export async function detectItemAnomaly(
  trade: string,
  category: string,
  field: 'quantity' | 'unit_cost',
  value: number,
  companyId: string
): Promise<AnomalyResult | null>
```

Historical data query:
```sql
SELECT AVG(unit_cost), STDDEV(unit_cost), COUNT(*)
FROM estimate_line_items eli
JOIN estimates e ON e.id = eli.estimate_id
WHERE e.company_id = $1
  AND eli.trade = $2
  AND eli.category = $3
  AND e.created_at > now() - INTERVAL '12 months'
```

Z-score: `(value - mean) / stddev`. Skip if sample size < 5 (insufficient data).

**Skills Applied:**
- `async-parallel` — parallel anomaly checks per item

**Acceptance Criteria:**
- [ ] Returns empty array when < 5 historical samples
- [ ] Z-score > 2.0 returns `'warning'`, > 3.0 returns `'error'`
- [ ] Message is human-readable: "Unit cost ($85) is 2.8x above your average ($30)"
- [ ] `detectItemAnomaly` runs in < 200ms

---

## P4-003-B: Cost Forecaster

**Agent:** backend-engineer
**Effort:** 1.0 days

**Files:**
- `lib/ai/cost-forecaster.ts` (new)

**Task:**
Linear regression on material catalog price history to predict future costs.

```typescript
export interface CostForecast {
  materialId: string
  currentPrice: number
  forecastedPrice: number      // 3 months out
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number      // e.g., 4.2 for +4.2%
  confidence: 'high' | 'medium' | 'low'
  dataPoints: number
}

export async function forecastMaterialCost(
  materialId: string,
  companyId: string,
  monthsAhead?: number         // default: 3
): Promise<CostForecast | null>

export async function forecastEstimateCosts(
  estimateId: string,
  companyId: string
): Promise<CostForecast[]>
```

Implementation:
- Query price history from `estimate_line_items` grouped by month (last 12 months)
- Simple linear regression: slope = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
- Extrapolate `monthsAhead` periods
- Confidence: `high` if R² > 0.7 and n ≥ 8, `medium` if R² > 0.4 and n ≥ 5, else `low`
- Use `simple-statistics` library for regression calculation

**Acceptance Criteria:**
- [ ] Returns `null` for materials with < 3 months of data
- [ ] Trend direction matches calculated slope sign
- [ ] `simple-statistics` used for regression (not manual calculation)
- [ ] Confidence levels follow R² thresholds

---

## P4-003-C: Bid Optimizer + AI Analysis Actions

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-003-A, P4-003-B

**Files:**
- `lib/ai/bid-optimizer.ts` (new)
- `app/actions/ai-analysis.ts` (new)

**Task:**

**`bid-optimizer.ts`:**
```typescript
export interface BidOptimization {
  recommendedMarkup: number        // percentage
  predictedWinProbability: number  // 0-100
  historicalWinRateAtMarkup: Record<number, number>  // { 15: 0.72, 20: 0.58 }
  recommendation: string
}

export async function optimizeBidMarkup(
  estimateId: string,
  currentMarkup: number,
  companyId: string
): Promise<BidOptimization>
```

Logic: query historical `estimates` where `bid_outcome IN ('won', 'lost')`, group by markup range (±2%), calculate win rate per bucket, return optimal markup as the highest-markup bucket with win rate ≥ 50%.

**`app/actions/ai-analysis.ts`:**
```typescript
export async function getEstimateAnomalies(estimateId: string): Promise<AnomalyResult[]>
export async function getCostForecasts(estimateId: string): Promise<CostForecast[]>
export async function getBidOptimization(estimateId: string, currentMarkup: number): Promise<BidOptimization>
export async function getSmartAssemblySuggestions(estimateId: string): Promise<AssemblySuggestion[]>
```

All actions: validate auth, scope to company_id, handle errors.

**Acceptance Criteria:**
- [ ] All actions return typed results or `{ error: string }`
- [ ] `getBidOptimization` returns sensible result with < 10 historical bids (fallback: industry average 65% at 15%)
- [ ] Actions callable from client components
- [ ] No direct Supabase in any client component

---

## P4-003-D: AnomalyAlert Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-003-A

**Files:**
- `components/estimates/AnomalyAlert.tsx` (new)
- `components/estimates/CostEditor.tsx` (modified)

**Task:**

**`AnomalyAlert`:**
```typescript
interface AnomalyAlertProps {
  anomaly: AnomalyResult
  onDismiss: () => void
  onAccept: () => void  // "Keep my value" = dismiss
}
```

Display:
- Inline alert below flagged input field
- Warning: yellow border + AlertTriangle icon
- Error: red border + AlertCircle icon
- Message: "This unit cost is unusually high. Your average is $X."
- Two actions: "Dismiss" | "Use Average ($X)"
- "Use Average" fires `onAccept` with historical mean value

**`CostEditor.tsx` modifications:**
- On quantity/unit_cost blur: call `detectItemAnomaly` (debounced 500ms)
- If anomaly returned: show `<AnomalyAlert>` below that input
- "Use Average" replaces field value with `historicalMean`

**Skills Applied:**
- `rerender-memo` — memo AnomalyAlert to prevent re-renders
- `bundle-barrel-imports` — direct AlertTriangle, AlertCircle imports

**Mobile Checks:**
- [ ] Alert is visible below input (not clipped by keyboard)
- [ ] "Dismiss" and "Use Average" buttons are `min-h-[44px]`
- [ ] `dark:` variants on alert backgrounds

**Acceptance Criteria:**
- [ ] Alert appears after 500ms debounce on blur
- [ ] "Use Average" populates field with historical mean
- [ ] Dismissed alerts don't re-appear for same field unless value changes again
- [ ] No alert shown when < 5 historical samples

---

## P4-003-E: BidOptimizer Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-003-C

**Files:**
- `components/estimates/BidOptimizer.tsx` (new)
- `components/estimates/EstimateSummary.tsx` (modified)

**Task:**

**`BidOptimizer`:**
```typescript
interface BidOptimizerProps {
  estimateId: string
  currentMarkup: number
  onMarkupChange: (markup: number) => void
}
```

Layout:
- Card with "Bid Optimization" heading
- Current markup slider (0–50%)
- Predicted win probability badge: "~68% chance of winning"
- Bar chart (inline, not recharts): small horizontal bars showing win rate per markup bucket
- Recommendation text: "Based on 15 past bids, 15% markup yields the best balance of win rate and margin."
- "Apply Recommended Markup" button

**`EstimateSummary.tsx` modifications:**
- Add `<BidOptimizer>` section below totals
- Fetch optimization data via `getBidOptimization` server action on mount

**Mobile Checks:**
- [ ] Slider is touch-friendly (custom or native `<input type="range">` with `min-h-[44px]` thumb)
- [ ] "Apply" button is `min-h-[44px]`
- [ ] `active:scale-95` on button
- [ ] `dark:` on card bg

**Acceptance Criteria:**
- [ ] Slider updates win probability prediction on change
- [ ] "Apply Recommended" sets markup to optimizer's recommendation
- [ ] Shows "Not enough data" gracefully with < 5 historical bids
- [ ] Build passes with no TS errors

---

## P4-003-F: CSI Auto-Categorization

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `app/actions/ai-analysis.ts` (add to existing file)
- `lib/ai/csi-classifier.ts` (new)

**Task:**
Call Claude API to classify line item descriptions into CSI MasterFormat divisions.

```typescript
// csi-classifier.ts
export async function classifyCSIDivision(description: string): Promise<{
  division: string      // e.g., "03 - Concrete"
  subdivision: string   // e.g., "03 30 00 - Cast-in-Place Concrete"
  confidence: number    // 0-1
}>

// In ai-analysis.ts
export async function autoCategorizeLine Items(
  estimateId: string
): Promise<Array<{ itemId: string; csiDivision: string; csiSubdivision: string }>>
```

Claude call:
- Model: `claude-haiku-4-5-20251001` (fast + cheap for classification)
- System prompt: "Classify the following construction item description into a CSI MasterFormat division. Return JSON: { division, subdivision }"
- Batch: send up to 20 items per request to minimize API calls

**Acceptance Criteria:**
- [ ] Returns correct CSI division for common items (concrete, framing, electrical)
- [ ] Uses claude-haiku (not sonnet) for cost efficiency
- [ ] Batches requests (max 20 per call)
- [ ] Gracefully handles API errors without crashing

---

## Skills Tracking (All P4-003 Sub-tasks)

- `async-parallel` — parallel anomaly + forecast checks
- `bundle-dynamic-imports` — lazy load ML libs
- `rerender-memo` — memoized alert cards
- `bundle-barrel-imports` — direct Lucide imports
