# EST-P4-005: Machine Learning Quantity Refinement

**Parent Task:** `EST-P4-005` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~6 days
**Dependencies:** EST-P1-011 (Progressive Loading), EST-P2-002 (Assemblies)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-005-A | Database migrations | backend-engineer | 0.5d | — |
| P4-005-B | Training data collector | backend-engineer | 1.0d | P4-005-A |
| P4-005-C | Model fine-tuner + fine-tune API route | backend-engineer | 2.0d | P4-005-B |
| P4-005-D | Accuracy tracker | backend-engineer | 1.0d | P4-005-A |
| P4-005-E | AccuracyDashboard component | frontend-engineer | 1.0d | P4-005-D |
| P4-005-F | A/B split + data sharing opt-in | backend-engineer | 0.5d | P4-005-C |

---

## P4-005-A: Database Migrations

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_ml_tables.sql`

**Task:**
```sql
CREATE TABLE public.ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  estimate_id UUID NOT NULL REFERENCES estimates(id),
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  input_image_url TEXT,
  input_context JSONB,               -- trade, category, plan metadata
  ai_detected_value NUMERIC(12,2),
  user_corrected_value NUMERIC(12,2),
  correction_type TEXT CHECK (correction_type IN ('quantity', 'unit_cost', 'trade', 'description')),
  is_consented_to_share BOOLEAN DEFAULT false,  -- opt-in for global model
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  model_identifier TEXT NOT NULL,    -- e.g., 'ft:gpt-4o-mini:genhub:v3'
  base_model TEXT,                   -- 'gpt-4o-2024-08-06', 'claude-opus-4-6'
  training_samples_count INTEGER,
  accuracy_improvement NUMERIC(5,2), -- percentage improvement vs base
  is_active BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ml_training_company ON ml_training_data(company_id, created_at DESC);
CREATE INDEX idx_ml_training_type ON ml_training_data(company_id, correction_type);
CREATE INDEX idx_ml_models_company ON ml_model_versions(company_id, is_active);
```

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] RLS enforces company_id isolation
- [ ] `is_consented_to_share` defaults to false (explicit opt-in)
- [ ] `npm run db:gen-types` updated

---

## P4-005-B: Training Data Collector

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-005-A

**Files:**
- `lib/ml/training-data-collector.ts` (new)
- `app/actions/estimates.ts` (modified — add correction logging)

**Task:**

**`training-data-collector.ts`:**
```typescript
export interface CorrectionEvent {
  estimateId: string
  takeoffItemId?: string
  inputImageUrl?: string
  inputContext: {
    trade: string
    category: string
    planPageNumber?: number
    projectType?: string
  }
  aiDetectedValue: number
  userCorrectedValue: number
  correctionType: 'quantity' | 'unit_cost' | 'trade' | 'description'
}

export async function logCorrection(
  correction: CorrectionEvent,
  companyId: string
): Promise<void>

// Returns true if company has >= 3 corrections of same symbol type
// (triggers adding to custom symbol library)
export async function checkSymbolThreshold(
  correctionContext: CorrectionEvent['inputContext'],
  companyId: string
): Promise<boolean>

export async function getTrainingDataStats(companyId: string): Promise<{
  totalSamples: number
  byType: Record<string, number>
  readyToFineTune: boolean  // true if >= 50 samples
}>
```

**`app/actions/estimates.ts` modifications:**
- In `updateTakeoffItem`, `updateLineItemCost`: detect if value differs from AI original
- If differs: call `logCorrection` with before/after values
- This is a background logging call — fire-and-forget, don't block the main update

**Acceptance Criteria:**
- [ ] Corrections logged automatically when user changes AI-generated values
- [ ] `checkSymbolThreshold` correctly counts per-context corrections
- [ ] `getTrainingDataStats` returns accurate counts
- [ ] Logging never blocks or delays the main update action

---

## P4-005-C: Model Fine-Tuner + API Route

**Agent:** backend-engineer
**Effort:** 2.0 days
**Depends on:** P4-005-B

**Files:**
- `lib/ml/model-fine-tuner.ts` (new)
- `app/api/ml/fine-tune/route.ts` (new)

**Task:**

**`model-fine-tuner.ts`:**
```typescript
export interface FineTuneJob {
  jobId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  modelIdentifier?: string
  trainingSamples: number
}

export async function prepareTrainingData(
  companyId: string,
  correctionType?: string
): Promise<FineTuneJsonl>
// Formats training data as JSONL for OpenAI fine-tune API

export async function submitFineTuneJob(
  trainingDataPath: string,
  baseModel: string,
  companyId: string
): Promise<FineTuneJob>

export async function checkFineTuneStatus(jobId: string): Promise<FineTuneJob>

export async function activateModel(modelVersionId: string, companyId: string): Promise<void>
// Sets is_active = true on this version, false on all others
```

JSONL format (OpenAI fine-tune):
```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "Plan image context: trade=framing..."}, {"role": "assistant", "content": "{\"quantity\": 45, \"unit\": \"lf\"}"}]}
```

**`app/api/ml/fine-tune/route.ts`:**
- POST: trigger fine-tune job (admin only — check user role)
- GET: check job status
- Protected: only company admins can trigger fine-tuning

**Acceptance Criteria:**
- [ ] JSONL output valid for OpenAI fine-tune API format
- [ ] Fine-tune only triggered if ≥ 50 training samples
- [ ] Status polling works correctly
- [ ] Role check prevents non-admins from triggering

---

## P4-005-D: Accuracy Tracker

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-005-A

**Files:**
- `lib/ml/accuracy-tracker.ts` (new)
- `app/actions/ai-analysis.ts` (add to existing)

**Task:**
Track model performance improvement over time.

```typescript
export interface AccuracyMetric {
  period: string              // e.g., "2026-01"
  trade?: string
  sampleCount: number
  meanAbsoluteError: number   // average |detected - corrected| / corrected
  accuracyPercentage: number  // (1 - MAE) * 100
  modelVersion?: string       // which model was active
}

export async function calculateAccuracyMetrics(
  companyId: string,
  groupBy?: 'month' | 'trade'
): Promise<AccuracyMetric[]>

// Called after each user correction to update running average
export async function recordAccuracyDataPoint(
  aiValue: number,
  correctedValue: number,
  trade: string,
  companyId: string
): Promise<void>
```

Formula:
- `accuracy = 1 - |ai_detected - user_corrected| / user_corrected`
- `MAE = AVG(|ai_detected - user_corrected| / user_corrected)` across samples

**Server action in `ai-analysis.ts`:**
```typescript
export async function getModelAccuracyReport(companyId: string): Promise<AccuracyMetric[]>
```

**Acceptance Criteria:**
- [ ] Accuracy percentage between 0 and 100
- [ ] Monthly grouping returns correct buckets
- [ ] Trade grouping returns per-trade breakdowns
- [ ] Handles division-by-zero when `user_corrected = 0`

---

## P4-005-E: AccuracyDashboard Component

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P4-005-D

**Files:**
- `components/estimates/AccuracyDashboard.tsx` (new)

**Task:**
Dashboard showing ML model improvement over time.

```typescript
interface AccuracyDashboardProps {
  companyId: string
}
```

Layout sections:
1. **Summary cards:** "AI Accuracy This Month: 87%" | "Total Corrections: 142" | "Model Version: v3 (fine-tuned)"
2. **Accuracy trend chart:** Line chart (recharts, dynamic import) — accuracy % by month, two lines: base model vs fine-tuned
3. **By-trade breakdown:** Bar chart — accuracy per trade
4. **Training data status:** "Ready to fine-tune: Yes (87 samples)" + "Request Fine-Tune" button (admin only)
5. **A/B test results:** Table showing base vs fine-tuned accuracy with p-value

**Skills Applied:**
- `bundle-dynamic-imports` — recharts loaded lazily
- `async-parallel` — parallel fetch accuracy metrics + training stats
- `rerender-memo` — memo chart components

**Mobile Checks:**
- [ ] Summary cards stack vertically on mobile
- [ ] Charts are horizontally scrollable on mobile
- [ ] "Request Fine-Tune" button is `min-h-[44px]`
- [ ] `dark:` variants on cards + charts

**Acceptance Criteria:**
- [ ] Accuracy trend chart shows both base and fine-tuned lines
- [ ] "Request Fine-Tune" button only visible to company admins
- [ ] Clicking it calls `/api/ml/fine-tune` POST
- [ ] Build passes with no TS errors

---

## P4-005-F: A/B Split + Data Sharing Opt-in

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P4-005-C

**Files:**
- `lib/ml/ab-test.ts` (new)
- `app/actions/estimates.ts` (modified — use active model based on A/B assignment)

**Task:**

**`ab-test.ts`:**
```typescript
// Deterministic assignment: hash(companyId + estimateId) % 2
export function getModelAssignment(
  companyId: string,
  estimateId: string
): 'base' | 'fine-tuned'

// Track which model was used for this estimate
export async function recordModelUsage(
  estimateId: string,
  modelVersion: 'base' | 'fine-tuned',
  companyId: string
): Promise<void>
```

**Data sharing opt-in:**
- Add `company_settings.ml_data_sharing_enabled` column (boolean, default false)
- Company admin can toggle in settings page
- When `ml_data_sharing_enabled = true`: anonymize and export training data to shared pool
- In `logCorrection`: check opt-in before setting `is_consented_to_share = true`

**Acceptance Criteria:**
- [ ] A/B assignment is deterministic (same estimate always gets same model)
- [ ] Model usage recorded per estimate
- [ ] Data sharing opt-in defaults to false
- [ ] Anonymization removes company_id and project names before sharing
