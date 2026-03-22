# Estimates V2 — Unimplemented Tasks

**Generated:** 2026-02-17 | **Based on:** `tasks-phase1-phase2.md` + `tasks-phase3-phase4.md`

---

## Summary

| Phase | Total Tasks | Implemented | Remaining |
|-------|-------------|-------------|-----------|
| Phase 1 (P0 Critical) | 11 | 11 ✅ | 0 |
| Phase 2 (P1 Important) | 8 | 8 ✅ | 0 |
| Phase 3 (P2 Future) | 4 | 3 ✅ | **1** |
| Phase 4 (P3 Advanced) | 6 | 0 | **6** |
| **Total** | **29** | **22** | **7** |

---

## Phase 3 — Partially Unimplemented

### EST-P3-004: Historical Cost Analytics ❌
**Priority:** P2 - Future | **Effort:** 5 days | **Ref:** `tasks-phase3-phase4.md` → P3.4

**What's missing:**
- `components/estimates/AnalyticsDashboard.tsx`
- `components/estimates/CostTrendChart.tsx`
- `components/estimates/TradeComparisonChart.tsx`
- `components/estimates/WinLossChart.tsx`
- `components/estimates/PricePredictor.tsx`
- `app/actions/analytics.ts` (`getEstimateAnalytics`, `exportAnalyticsReport`)
- DB migration: `ALTER TABLE estimates ADD COLUMN bid_outcome`, `bid_submitted_at`, `bid_amount`
- Wire-up: Add "Analytics" tab to `EstimatesTabClient.tsx`

**Description:** Analytics dashboard showing cost trends across past estimates — cost/SF trends, trade comparisons, win/loss analysis, material price trends, CSV/PDF export.

---

## Phase 4 — Fully Unimplemented

### EST-P4-001: 3D Model Takeoff (BIM Integration) ❌
**Priority:** P3 - Advanced | **Effort:** 15 days | **Ref:** `tasks-phase3-phase4.md` → P4.1
**Dependency:** EST-P3-001 (measurement tools — ✅ done)

**What's missing:**
- `components/estimates/BimViewer.tsx`
- `components/estimates/BimElementPicker.tsx`
- `lib/bim/ifc-parser.ts`
- `lib/bim/quantity-calculator.ts`
- `app/api/estimates/bim-upload/route.ts`
- DB migrations: `bim_models`, `bim_elements` tables
- Modified: `PlanUploadPanel.tsx` (add IFC upload option)
- NPM: `web-ifc` (~500KB), `three` (~600KB)

---

### EST-P4-002: Voice Input for Field Estimates ❌
**Priority:** P3 - Advanced | **Effort:** 4 days | **Ref:** `tasks-phase3-phase4.md` → P4.2

**What's missing:**
- `components/estimates/VoiceInputButton.tsx`
- `components/estimates/VoiceTranscription.tsx`
- `lib/voice/speech-parser.ts`
- Modified: `CostEditor.tsx` (voice input on quantity fields)
- Modified: `PlanUploadPanel.tsx` (voice notes)

---

### EST-P4-003: Advanced AI Features ❌
**Priority:** P3 - Advanced | **Effort:** 8 days | **Ref:** `tasks-phase3-phase4.md` → P4.3
**Dependency:** EST-P2-001 (AI Chat — ✅ done)

**What's missing:**
- `components/estimates/AnomalyAlert.tsx`
- `components/estimates/BidOptimizer.tsx`
- `lib/ai/anomaly-detector.ts`
- `lib/ai/cost-forecaster.ts`
- `lib/ai/bid-optimizer.ts`
- `app/actions/ai-analysis.ts`
- Modified: `CostEditor.tsx` (inline anomaly alerts)
- Modified: `EstimateSummary.tsx` (optimization recommendations)
- NPM: `simple-statistics` (~25KB)

---

### EST-P4-004: Supplier Integration & Automated Pricing ❌
**Priority:** P3 - Advanced | **Effort:** 10 days | **Ref:** `tasks-phase3-phase4.md` → P4.4
**Dependency:** EST-P2-008 (Material Catalog — ✅ done)

**What's missing:**
- `components/estimates/SupplierPricingModal.tsx`
- `components/estimates/QuoteComparisonTable.tsx`
- `components/estimates/PurchaseOrderPreview.tsx`
- `lib/suppliers/home-depot-api.ts`
- `lib/suppliers/ferguson-api.ts`
- `app/api/suppliers/quotes/route.ts`
- `app/actions/purchase-orders.ts`
- DB migrations: `supplier_connections`, `supplier_quotes`, `purchase_orders` tables
- Modified: `CostEditor.tsx` ("Get Quotes" button per row)

---

### EST-P4-005: Machine Learning Quantity Refinement ❌
**Priority:** P3 - Advanced | **Effort:** 12 days | **Ref:** `tasks-phase3-phase4.md` → P4.5
**Dependencies:** EST-P1-011 (Progressive Loading — ✅ done), EST-P2-002 (Assemblies — ✅ done)

**What's missing:**
- `components/estimates/AccuracyDashboard.tsx`
- `lib/ml/training-data-collector.ts`
- `lib/ml/model-fine-tuner.ts`
- `lib/ml/accuracy-tracker.ts`
- `app/api/ml/fine-tune/route.ts`
- DB migrations: `ml_training_data`, `ml_model_versions` tables
- Modified: `app/actions/estimates.ts` (log corrections as training data)

---

### EST-P4-006: Multi-Project Template Library ❌
**Priority:** P3 - Advanced | **Effort:** 4 days | **Ref:** `tasks-phase3-phase4.md` → P4.6
**Dependency:** EST-P2-007 (Template Management — ✅ done)

**What's missing:**
- `components/estimates/TemplateHierarchy.tsx`
- `components/estimates/TemplateMarketplace.tsx`
- `components/estimates/TemplateVersionControl.tsx`
- `lib/templates/inheritance-resolver.ts`
- `app/actions/template-marketplace.ts`
- DB migrations: `template_inheritance`, `template_versions`, `template_marketplace` tables
- Modified: `TemplateLibrary.tsx` (add hierarchy view)

---

## Already Implemented (for reference)

### Phase 1 ✅ (all 11 tasks)
- EST-P1-001: Wizard Stepper Component
- EST-P1-002: Confidence Summary + Bulk Accept
- EST-P1-003: Swipe Review Cards
- EST-P1-004: Camera Upload + HEIC + Multi-Capture
- EST-P1-005: Sticky Cost Totals Bar
- EST-P1-006: Trade Donut Chart
- EST-P1-007: Micro-Confirmation Cards
- EST-P1-008: Extraction Progress Grid
- EST-P1-009: Plan Color Overlays by Trade
- EST-P1-010: Construction Status Visual Treatment
- EST-P1-011: Progressive Result Loading

### Phase 2 ✅ (all 8 tasks)
- EST-P2-001: AI Plan Chat Sidebar
- EST-P2-002: Assemblies System
- EST-P2-003: Multi-Page Batch Operations
- EST-P2-004: Revision Comparison View
- EST-P2-005: PDF Export with Company Branding
- EST-P2-006: Estimate-to-Budget Conversion
- EST-P2-007: Template Management
- EST-P2-008: Material Catalog Integration

### Phase 3 — Partial ✅
- EST-P3-001: On-Plan Measurement Tools ✅
- EST-P3-002: Real-Time Collaboration ✅
- EST-P3-003: Offline Mode ✅
- EST-P3-004: Historical Cost Analytics ❌ (see above)

---

## Recommended Implementation Order

Priority tasks if continuing work:

1. **EST-P3-004** (Historical Cost Analytics) — P2, 5 days, no blockers, analytics value
2. **EST-P4-002** (Voice Input) — P3, 4 days, no blockers, quick win
3. **EST-P4-006** (Multi-Project Templates) — P3, 4 days, depends on P2-007 ✅
4. **EST-P4-003** (Advanced AI) — P3, 8 days, depends on P2-001 ✅
5. **EST-P4-001** (BIM Integration) — P3, 15 days, depends on P3-001 ✅
6. **EST-P4-004** (Supplier Integration) — P3, 10 days, depends on P2-008 ✅
7. **EST-P4-005** (ML Refinement) — P3, 12 days, complex infrastructure

**Total remaining effort:** ~58 days sequential / ~15 days with parallelization
