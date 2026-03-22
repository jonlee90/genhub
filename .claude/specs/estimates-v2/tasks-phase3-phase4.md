# Estimates V3 - Implementation Tasks (Phase 3 + Phase 4)

**Project:** GenHub PWA - Estimates Module V3
**Date:** 2026-02-14 | **Version:** 1.0 | **Status:** DRAFT
**Based on:** `requirements-ux.md` v3.0, `design.md` v2.4

---

## Task Organization

**Phase 3 (P2):** Future features for competitive parity (REQ-UX-015 through REQ-UX-018)
**Phase 4 (P3):** Advanced features and optimizations

Each task includes:
- **ID:** Unique identifier
- **Component:** What gets built
- **Dependencies:** What must complete first
- **Effort:** Days estimate
- **Skills Applied:** React/performance rules
- **Files:** New/modified files

---

## PHASE 3: P2 FUTURE FEATURES

### P3.1: On-Plan Measurement Tools (REQ-UX-015)

**ID:** `EST-P3-001`
**Priority:** P2 - Future
**Effort:** 5 days
**Dependencies:** EST-P1-009 (PlanOverlayLayer)

**Description:** Manual measurement tools for area, linear, and count takeoffs directly on the plan viewer to verify or supplement AI-detected quantities.

**Acceptance Criteria:**
- Area tool: Draw polygon on plan, auto-calculates square footage
- Linear tool: Draw polyline, calculates linear footage
- Count tool: Tap to place numbered markers
- Scale calibration wizard: 3-step process to set plan scale from known dimension
- Measurements persist and display on plan view
- Measurement auto-creates or updates takeoff item
- Undo/redo support for measurement edits
- Touch-optimized: two-finger zoom does not trigger measurement mode
- Tool selector: toggle between select/area/linear/count modes

**New Files:**
- `components/estimates/PlanMeasurementTools.tsx` (client)
- `components/estimates/AreaMeasurementTool.tsx` (client)
- `components/estimates/LinearMeasurementTool.tsx` (client)
- `components/estimates/CountMeasurementTool.tsx` (client)
- `components/estimates/ScaleCalibrationWizard.tsx` (client)
- `lib/measurements/plan-scale.ts` (scale calculation utilities)
- `lib/measurements/geometry.ts` (area/perimeter calculations)

**Modified Files:**
- `components/estimates/PlanViewer.tsx` (add measurement mode, tool selection UI)
- `app/actions/estimates.ts` (add saveMeasurement, calibratePlanScale)
- Database: `plan_measurements` table (migration needed)

**Skills Applied:**
- `bundle-barrel-imports` - direct Lucide imports for tool icons
- `rerender-memo` - memoize measurement SVG paths
- `rendering-hoist-jsx` - static tool selector UI outside render
- `async-defer-await` - defer save until measurement complete

**Implementation Notes:**
```typescript
// Tool modes: 'select' | 'area' | 'linear' | 'count'
// Area tool: SVG <polygon> with point array, calculated via shoelace formula
// Linear tool: SVG <polyline> with point array, sum of segment lengths
// Count tool: SVG <circle> markers with auto-incrementing numbers
// Scale calibration: User draws line, enters real length, system calculates pixels-per-foot ratio
// Measurement data: { type, points[], scale, result: { value, unit } }
// Touch handling: Distinguish single-tap (place point) vs two-finger (zoom) via @use-gesture/react
// Tool selector: Fixed bottom-left FAB that opens tool palette
// Icons: Ruler (area), Minus (linear), Hash (count), Move (select)
```

**Database Migration:**
```sql
CREATE TABLE public.plan_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id UUID NOT NULL REFERENCES plan_uploads(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('area', 'linear', 'count')),
  points JSONB NOT NULL, -- [{ x, y }]
  scale_ratio NUMERIC(10,4), -- pixels per foot
  result_value NUMERIC(12,2),
  result_unit TEXT,
  takeoff_item_id UUID REFERENCES takeoff_items(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_measurements_upload ON plan_measurements(plan_upload_id);
CREATE INDEX idx_plan_measurements_page ON plan_measurements(plan_upload_id, page_number);
```

---

### P3.2: Real-Time Collaboration (REQ-UX-016)

**ID:** `EST-P3-002`
**Priority:** P2 - Future
**Effort:** 6 days
**Dependencies:** None (uses Supabase Realtime)

**Description:** Multi-user collaboration on the same estimate with presence indicators, cursor positions, trade-level locking, and activity feed.

**Acceptance Criteria:**
- Presence indicators showing who is viewing/editing (avatars + status)
- Cursor positions visible to other users (color-coded by user)
- Real-time updates when other users edit items
- Trade-level locking: claim a trade section for exclusive editing
- Conflict resolution: last-write-wins with toast notification
- Activity feed showing recent changes by team members
- User color coding: consistent color per user across cursors, avatars, highlights
- Typing indicators for item edits
- "User X is viewing this estimate" banner

**New Files:**
- `components/estimates/CollaborationPresence.tsx` (client)
- `components/estimates/UserCursor.tsx` (client)
- `components/estimates/ActivityFeed.tsx` (client)
- `components/estimates/TradeLockBanner.tsx` (client)
- `lib/collaboration/presence-tracker.ts` (Realtime presence hook)
- `lib/collaboration/conflict-resolver.ts` (last-write-wins logic)

**Modified Files:**
- `components/estimates/EstimatesTabClient.tsx` (initialize presence channel)
- `components/estimates/CostEditor.tsx` (lock trades, show typing indicators)
- `app/actions/estimates.ts` (add claimTradeLock, releaseTradeLock, getEstimateActivity)
- Database: `estimate_locks`, `estimate_activity` tables

**Skills Applied:**
- `async-suspense-boundaries` - Suspense for Realtime subscriptions
- `rerender-memo` - memoize cursor components
- `rendering-conditional-render` - show presence only when >1 user

**Implementation Notes:**
```typescript
// Supabase Realtime presence: channel.track({ user, cursor, section })
// Presence broadcast every 200ms (throttled), expires after 1s of inactivity
// User colors: hash userId to HSL color (fixed saturation/lightness, vary hue)
// Cursor: SVG pointer with user name label, color border
// Trade lock: claim via server action, auto-release on navigate away or after 30min timeout
// Activity feed: Realtime subscription to estimate_activity table
// Conflict modal: "User X also edited this item. Your changes were saved, theirs were discarded."
// Typing indicator: broadcast on keydown, clear on blur or 3s timeout
```

**Database Migrations:**
```sql
CREATE TABLE public.estimate_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  locked_by UUID NOT NULL REFERENCES profiles(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  company_id UUID NOT NULL REFERENCES companies(id),
  UNIQUE(estimate_id, trade)
);

CREATE INDEX idx_estimate_locks_estimate ON estimate_locks(estimate_id);
CREATE INDEX idx_estimate_locks_expires ON estimate_locks(expires_at);

CREATE TABLE public.estimate_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('item_added', 'item_edited', 'item_deleted', 'cost_updated', 'assembly_applied', 'bulk_accepted', 'bulk_rejected')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimate_activity_estimate ON estimate_activity(estimate_id, created_at DESC);
```

---

### P3.3: Offline Mode (REQ-UX-017)

**ID:** `EST-P3-003`
**Priority:** P2 - Future
**Effort:** 7 days
**Dependencies:** None (PWA infrastructure)

**Description:** Service worker-based offline support for field use with poor connectivity. Queue uploads, cache estimate data, sync on reconnect.

**Acceptance Criteria:**
- Service worker caches active estimate data
- Upload queue for photos taken offline
- Read-only access to last-synced estimate data while offline
- Visual indicator: "Offline - changes will sync" banner
- Edit queue: local edits saved to IndexedDB, sync on reconnect
- Conflict resolution: timestamp-based, newer wins
- Automatic sync when connection restored (online event)
- Manual "Sync Now" button
- Offline indicator: persistent banner, gray icon in status bar
- Background sync API for uploads (if supported)

**New Files:**
- `public/sw.js` (service worker)
- `lib/offline/sync-manager.ts` (sync queue management)
- `lib/offline/conflict-resolver.ts` (timestamp-based resolution)
- `components/estimates/OfflineBanner.tsx` (client)
- `components/estimates/SyncStatus.tsx` (client)

**Modified Files:**
- `app/layout.tsx` (register service worker)
- `components/estimates/EstimatesTabClient.tsx` (offline detection, sync trigger)
- `app/actions/estimates.ts` (add syncOfflineChanges)
- Database: No changes (uses IndexedDB client-side)

**Skills Applied:**
- `async-parallel` - parallel sync of queued changes
- `rendering-conditional-render` - offline banner ternary
- No React-specific rules (service worker is vanilla JS)

**Implementation Notes:**
```typescript
// Service Worker: Cache estimate JSON, plan images, static assets
// Cache strategy: Network-first for API, cache-first for images/static
// IndexedDB schema: { edits: [], uploads: [], deletions: [] }
// Sync on online event: window.addEventListener('online', syncChanges)
// Background Sync API: navigator.serviceWorker.ready.then(reg => reg.sync.register('upload-plans'))
// Conflict resolution: each edit has timestamp, compare on sync, newer wins
// Upload queue: blob storage in IndexedDB, upload via FormData on sync
// Offline banner: fixed top, yellow bg, "You're offline. Changes will sync when connected."
// Sync button: "Sync Now" in banner, triggers manual sync attempt
```

---

### P3.4: Historical Cost Analytics (REQ-UX-018)

**ID:** `EST-P3-004`
**Priority:** P2 - Future
**Effort:** 5 days
**Dependencies:** None (analyzes existing estimates)

**Description:** Analytics dashboard showing cost trends across past estimates to identify pricing patterns and improve future bids.

**Acceptance Criteria:**
- Cost per square foot trends over time (line chart)
- Trade cost comparison across projects (grouped bar chart)
- Win/loss analysis for bids (if bid outcome tracked)
- Material price trend charts (from linked catalog items)
- Export analytics as CSV/PDF report
- Filter by: date range, project type, GC, trade
- Comparison view: select 2-5 estimates for side-by-side comparison
- Cost benchmarking: show project vs company average vs industry average (if available)
- Predictive pricing: suggest unit costs based on historical averages

**New Files:**
- `components/estimates/AnalyticsDashboard.tsx` (client)
- `components/estimates/CostTrendChart.tsx` (client)
- `components/estimates/TradeComparisonChart.tsx` (client)
- `components/estimates/WinLossChart.tsx` (client)
- `components/estimates/PricePredictor.tsx` (client)
- `app/actions/analytics.ts` (getEstimateAnalytics, exportAnalyticsReport)

**Modified Files:**
- `components/estimates/EstimatesTabClient.tsx` (add "Analytics" tab)
- Database: `estimates.bid_outcome` column (won/lost/pending)

**Skills Applied:**
- `bundle-dynamic-imports` - lazy load recharts
- `async-parallel` - parallel fetch for multiple chart data
- `rerender-memo` - memoize chart components
- `rendering-content-visibility` - virtual scroll for estimate list

**Implementation Notes:**
```typescript
// Analytics queries: aggregate estimates.total_cost, group by month/trade/project_type
// Cost per SF: total_cost / project.square_footage
// Trade comparison: SELECT trade, AVG(unit_cost) FROM estimate_line_items GROUP BY trade
// Win/loss: COUNT grouped by bid_outcome
// Material trends: SELECT material_id, AVG(unit_cost), date FROM estimate_line_items WHERE material_id IS NOT NULL GROUP BY material_id, DATE_TRUNC('month', created_at)
// Prediction: AVG(unit_cost) for matching trade + category + project_type from last 12 months
// Export: generate CSV via Papa Parse or PDF via jsPDF
// Charts: recharts <LineChart>, <BarChart>, <PieChart>
```

**Database Migration:**
```sql
ALTER TABLE public.estimates
ADD COLUMN IF NOT EXISTS bid_outcome TEXT CHECK (bid_outcome IN ('pending', 'won', 'lost', 'withdrawn')),
ADD COLUMN IF NOT EXISTS bid_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bid_amount NUMERIC(12,2);

CREATE INDEX idx_estimates_outcome ON estimates(bid_outcome, bid_submitted_at DESC);
```

---

## PHASE 4: P3 ADVANCED FEATURES

### P4.1: 3D Model Takeoff (BIM Integration)

**ID:** `EST-P4-001`
**Priority:** P3 - Advanced
**Effort:** 15 days
**Dependencies:** EST-P3-001 (measurement tools)

**Description:** Extract quantities from 3D BIM models (IFC, Revit) in addition to 2D plans. Parse model elements, calculate volumes, link to takeoff items.

**Acceptance Criteria:**
- Upload IFC or Revit file (.ifc, .rvt via converter)
- 3D viewer with orbit, pan, zoom controls
- Element selection: click model element to create takeoff item
- Auto-quantity extraction: walls (area), slabs (volume), doors/windows (count)
- Material extraction from BIM metadata
- Clash detection: highlight overlapping elements
- 2D/3D sync: link 2D plan annotations to 3D elements
- Export to BCF (BIM Collaboration Format) for issues

**New Files:**
- `components/estimates/BimViewer.tsx` (client)
- `components/estimates/BimElementPicker.tsx` (client)
- `lib/bim/ifc-parser.ts` (IFC parsing via web-ifc)
- `lib/bim/quantity-calculator.ts` (volume/area calculations)
- `app/api/estimates/bim-upload/route.ts` (BIM upload handler)

**Modified Files:**
- `components/estimates/PlanUploadPanel.tsx` (add IFC upload)
- Database: `bim_models`, `bim_elements` tables

**Skills Applied:**
- `bundle-dynamic-imports` - lazy load Three.js and web-ifc
- `async-parallel` - parallel parse of IFC elements
- `rendering-content-visibility` - virtual scroll for element tree

**Implementation Notes:**
```typescript
// Library: web-ifc (~500KB) for IFC parsing, Three.js (~600KB) for 3D rendering
// Viewer: THREE.Scene with OrbitControls, raycaster for element picking
// IFC parsing: extract IfcWall, IfcSlab, IfcDoor, IfcWindow, IfcSpace
// Quantity: wall area = length * height, slab volume = area * thickness
// Material: extract from IfcMaterial, link to materials catalog
// Upload: convert Revit to IFC server-side via Autodesk Forge API (requires API key)
// Storage: Store IFC file in Supabase Storage, parse on demand
```

---

### P4.2: Voice Input for Field Estimates

**ID:** `EST-P4-002`
**Priority:** P3 - Advanced
**Effort:** 4 days
**Dependencies:** None

**Description:** Voice-to-text for hands-free quantity input and notes while on site. Speak measurements, item descriptions, or notes.

**Acceptance Criteria:**
- Microphone button on upload, review, cost screens
- Speech recognition for quantity input: "Twenty linear feet of two-by-four"
- Parse natural language to structured data (trade, quantity, unit)
- Voice notes: "Note: Need to verify ceiling height with architect"
- Multi-language support (English, Spanish)
- Offline voice recognition (if supported)
- Visual feedback: waveform animation while recording
- Edit mode: tap to correct transcription errors

**New Files:**
- `components/estimates/VoiceInputButton.tsx` (client)
- `components/estimates/VoiceTranscription.tsx` (client)
- `lib/voice/speech-parser.ts` (NLP parsing)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (add voice input to quantity fields)
- `components/estimates/PlanUploadPanel.tsx` (voice notes)

**Skills Applied:**
- `bundle-barrel-imports` - direct Mic icon import
- `async-defer-await` - defer processing until speech complete
- `rendering-conditional-render` - show waveform only when recording

**Implementation Notes:**
```typescript
// Web Speech API: const recognition = new webkitSpeechRecognition()
// Transcription: recognition.onresult = (event) => { transcript = event.results[0][0].transcript }
// NLP parsing: regex for "X [unit] of [material]" patterns
// Supported units: linear feet, square feet, cubic yards, each, dozen
// Voice notes: stored as estimate_line_items.notes or estimate.notes
// Waveform: Canvas visualization of audio input, use Web Audio API analyser
// Browser support: Chrome/Edge (webkitSpeechRecognition), Safari (SpeechRecognition), Firefox (limited)
```

---

### P4.3: Advanced AI Features

**ID:** `EST-P4-003`
**Priority:** P3 - Advanced
**Effort:** 8 days
**Dependencies:** EST-P2-001 (AI Chat)

**Description:** Enhanced AI capabilities including predictive cost adjustments, anomaly detection, and automated bid optimization.

**Acceptance Criteria:**
- Predictive pricing: suggest cost adjustments based on market trends
- Anomaly detection: flag items with unusual quantities or unit costs
- Bid optimization: recommend overhead/markup based on win probability
- Smart assemblies: AI suggests relevant assemblies for detected items
- Cost forecasting: predict material price changes based on trends
- Risk scoring: estimate likelihood of cost overruns per trade
- Auto-categorization: AI assigns CSI divisions to line items
- Intelligent rounding: round quantities to standard material sizes

**New Files:**
- `components/estimates/AnomalyAlert.tsx` (client)
- `components/estimates/BidOptimizer.tsx` (client)
- `lib/ai/anomaly-detector.ts` (statistical outlier detection)
- `lib/ai/cost-forecaster.ts` (time series prediction)
- `lib/ai/bid-optimizer.ts` (probability-based optimization)
- `app/actions/ai-analysis.ts` (AI analysis server actions)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (show anomaly alerts inline)
- `components/estimates/EstimateSummary.tsx` (show optimization recommendations)

**Skills Applied:**
- `async-parallel` - parallel AI analysis requests
- `bundle-dynamic-imports` - lazy load ML libraries
- `rerender-memo` - memoize anomaly cards

**Implementation Notes:**
```typescript
// Anomaly detection: Z-score > 2.5 for quantity or unit_cost vs historical avg
// Predictive pricing: linear regression on material catalog price history
// Bid optimization: logistic regression on historical bid_outcome vs markup %
// Smart assemblies: cosine similarity between item description and assembly descriptions
// Cost forecasting: ARIMA model on material price time series (via simple-statistics)
// Risk scoring: variance analysis on trade costs across similar projects
// CSI categorization: GPT-4o mini classify item description to CSI division
// Intelligent rounding: round to nearest standard pack size (e.g., drywall sheets, 2x4s)
```

---

### P4.4: Supplier Integration & Automated Pricing

**ID:** `EST-P4-004`
**Priority:** P3 - Advanced
**Effort:** 10 days
**Dependencies:** EST-P2-008 (Material Catalog)

**Description:** Direct integration with supplier APIs for real-time pricing, availability, and automated purchase orders.

**Acceptance Criteria:**
- Connect supplier accounts (Home Depot Pro, Ferguson, local suppliers)
- Real-time price lookups via supplier APIs
- Availability checking: in-stock, lead time, minimum order quantity
- Automated quote requests: send material list to multiple suppliers
- Quote comparison table: side-by-side pricing from 3+ suppliers
- One-click purchase order creation from approved estimate
- Order tracking: link PO to estimate, track delivery status
- Supplier catalog sync: import supplier SKUs to materials catalog

**New Files:**
- `components/estimates/SupplierPricingModal.tsx` (client)
- `components/estimates/QuoteComparisonTable.tsx` (client)
- `components/estimates/PurchaseOrderPreview.tsx` (client)
- `lib/suppliers/home-depot-api.ts` (Home Depot Pro API client)
- `lib/suppliers/ferguson-api.ts` (Ferguson API client)
- `app/api/suppliers/quotes/route.ts` (supplier quote aggregation)
- `app/actions/purchase-orders.ts` (PO creation and tracking)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (add "Get Quotes" button per item)
- Database: `supplier_connections`, `purchase_orders`, `supplier_quotes` tables

**Skills Applied:**
- `async-parallel` - parallel supplier API calls
- `bundle-dynamic-imports` - lazy load quote modal
- `rerender-memo` - memoize quote comparison rows

**Implementation Notes:**
```typescript
// Supplier APIs: REST endpoints with OAuth2 authentication
// Home Depot Pro: GET /products/search?sku=XXX, returns price, availability, lead_time
// Ferguson: POST /quotes, send material list, receive quote PDF + structured data
// Quote comparison: normalize responses to common format { supplier, sku, price, qty_available, lead_time }
// PO creation: map estimate_line_items to PO line items, include delivery address, project reference
// Order tracking: webhook from supplier on status change, update PO status
// Catalog sync: periodic job to import supplier SKUs, match to existing materials via description fuzzy match
```

**Database Migrations:**
```sql
CREATE TABLE public.supplier_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_name TEXT NOT NULL,
  api_credentials JSONB NOT NULL, -- encrypted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_id UUID NOT NULL REFERENCES supplier_connections(id),
  line_items JSONB NOT NULL,
  total_amount NUMERIC(12,2),
  valid_until TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'received', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_quote_id UUID REFERENCES supplier_quotes(id),
  po_number TEXT UNIQUE NOT NULL,
  line_items JSONB NOT NULL,
  total_amount NUMERIC(12,2),
  delivery_address TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### P4.5: Machine Learning Quantity Refinement

**ID:** `EST-P4-005`
**Priority:** P3 - Advanced
**Effort:** 12 days
**Dependencies:** EST-P1-011 (Progressive Loading), EST-P2-002 (Assemblies)

**Description:** Train custom ML models on company-specific data to improve quantity detection accuracy over time. Learn from user corrections to refine future estimates.

**Acceptance Criteria:**
- User corrections are logged and used as training data
- Company-specific model fine-tuning on GPT-4o or Claude
- Pattern recognition: identify company-specific drawing conventions
- Custom symbol library: learn project-specific symbols
- Continuous learning: model improves with each estimate
- Accuracy reporting: track improvement over time (e.g., "Accuracy improved 5% this month")
- Opt-in data sharing: company controls whether to contribute anonymized data to global model
- A/B testing: compare base model vs fine-tuned model performance

**New Files:**
- `lib/ml/training-data-collector.ts` (collect user corrections)
- `lib/ml/model-fine-tuner.ts` (fine-tuning pipeline)
- `lib/ml/accuracy-tracker.ts` (track model performance)
- `components/estimates/AccuracyDashboard.tsx` (client)
- `app/api/ml/fine-tune/route.ts` (trigger fine-tuning job)

**Modified Files:**
- `app/actions/estimates.ts` (log corrections as training data)
- Database: `ml_training_data`, `ml_model_versions` tables

**Skills Applied:**
- `async-parallel` - parallel collection of training samples
- No React-specific rules (ML pipeline is server-side)

**Implementation Notes:**
```typescript
// Training data: { input: plan_image + context, expected: corrected_quantity, actual: ai_detected_quantity }
// Fine-tuning: OpenAI fine-tuning API or Anthropic Claude custom models (requires API access)
// Pattern recognition: cluster corrections by project_type, identify common errors
// Custom symbols: if user corrects same symbol 3+ times, add to company symbol library
// Accuracy metric: (1 - abs(detected - corrected) / corrected) averaged across all corrections
// Dashboard: line chart of accuracy over time, grouped by trade
// Data sharing: anonymize company/project names, share with Anthropic/OpenAI for global model improvement
// A/B test: 50/50 split of new estimates, compare accuracy of base vs fine-tuned
```

**Database Migrations:**
```sql
CREATE TABLE public.ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  estimate_id UUID NOT NULL REFERENCES estimates(id),
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  input_image_url TEXT,
  input_context JSONB,
  ai_detected_value NUMERIC(12,2),
  user_corrected_value NUMERIC(12,2),
  correction_type TEXT, -- 'quantity', 'unit_cost', 'trade', 'description'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  model_identifier TEXT NOT NULL,
  base_model TEXT, -- 'gpt-4o-2024-08-06', 'claude-opus-4-6'
  training_samples_count INTEGER,
  accuracy_improvement NUMERIC(5,2), -- percentage improvement
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### P4.6: Multi-Project Template Library

**ID:** `EST-P4-006`
**Priority:** P3 - Advanced
**Effort:** 4 days
**Dependencies:** EST-P2-007 (Template Management)

**Description:** Enterprise-grade template library with version control, inheritance, and multi-project templating for franchise/multi-location operations.

**Acceptance Criteria:**
- Template inheritance: child templates inherit from parent, override specific items
- Multi-level hierarchy: corporate > regional > project-specific templates
- Version control: branch templates, merge changes, rollback
- Template sharing marketplace: share anonymized templates with community
- Template analytics: track usage, identify most valuable templates
- Bulk template application: apply template to multiple estimates at once
- Template validation: ensure template completeness before saving
- Template comparison: diff between template versions

**New Files:**
- `components/estimates/TemplateHierarchy.tsx` (client)
- `components/estimates/TemplateMarketplace.tsx` (client)
- `components/estimates/TemplateVersionControl.tsx` (client)
- `lib/templates/inheritance-resolver.ts` (merge parent + child templates)
- `app/actions/template-marketplace.ts` (marketplace CRUD)

**Modified Files:**
- `components/estimates/TemplateLibrary.tsx` (add hierarchy view)
- Database: `template_inheritance`, `template_versions`, `template_marketplace` tables

**Skills Applied:**
- `async-parallel` - parallel fetch parent templates
- `bundle-dynamic-imports` - lazy load marketplace
- `rendering-content-visibility` - virtual scroll for marketplace

**Implementation Notes:**
```typescript
// Inheritance: merge parent line items, child overrides take precedence
// Hierarchy: company.corporate_template_id -> region.regional_template_id -> project.template_id
// Version control: Git-like branching, each version has parent_version_id
// Marketplace: anonymized templates with tags, ratings, download count
// Analytics: SELECT template_id, COUNT(estimates) FROM estimates GROUP BY template_id
// Bulk apply: POST /api/estimates/bulk-apply-template with { templateId, estimateIds[] }
// Validation: ensure all required trades present, no negative costs
// Comparison: diff algorithm on line_items array, show added/removed/modified
```

---

## DEPENDENCIES & SEQUENCE

### Phase 3 Sequence (Parallelizable)

**Stream A (Measurement + Collaboration):**
- EST-P3-001 (Measurement Tools) + EST-P3-002 (Real-Time Collaboration) - parallel

**Stream B (Offline + Analytics):**
- EST-P3-003 (Offline Mode) + EST-P3-004 (Historical Analytics) - parallel

### Phase 4 Sequence (Parallelizable)

**Stream A (3D + Voice):**
- EST-P4-001 (3D BIM Takeoff) + EST-P4-002 (Voice Input) - parallel

**Stream B (AI + Supplier):**
- EST-P4-003 (Advanced AI) + EST-P4-004 (Supplier Integration) - parallel

**Stream C (ML + Templates):**
- EST-P4-005 (ML Refinement) + EST-P4-006 (Multi-Project Templates) - parallel

---

## EFFORT SUMMARY

### Phase 3 (P2 Future)
| Task | Component | Days |
|------|-----------|------|
| EST-P3-001 | On-Plan Measurement Tools | 5 |
| EST-P3-002 | Real-Time Collaboration | 6 |
| EST-P3-003 | Offline Mode | 7 |
| EST-P3-004 | Historical Cost Analytics | 5 |
| **Phase 3 Total** | **4 tasks** | **23 days** (or ~7 days with 2 parallel streams) |

### Phase 4 (P3 Advanced)
| Task | Component | Days |
|------|-----------|------|
| EST-P4-001 | 3D Model Takeoff (BIM) | 15 |
| EST-P4-002 | Voice Input | 4 |
| EST-P4-003 | Advanced AI Features | 8 |
| EST-P4-004 | Supplier Integration | 10 |
| EST-P4-005 | ML Quantity Refinement | 12 |
| EST-P4-006 | Multi-Project Templates | 4 |
| **Phase 4 Total** | **6 tasks** | **53 days** (or ~15 days with 3 parallel streams) |

### Grand Total
- **Phase 3 + Phase 4:** 10 tasks, 76 days sequential / ~22 days with full parallelization

---

## SKILLS TRACKING

### Most Common React Rules Applied
1. `bundle-barrel-imports` (10 tasks) - Direct Lucide icon imports
2. `async-parallel` (9 tasks) - Parallel data fetching
3. `bundle-dynamic-imports` (7 tasks) - Lazy loading heavy components
4. `rerender-memo` (6 tasks) - Component memoization
5. `rendering-conditional-render` (5 tasks) - Ternary over &&

### Performance Optimizations
- Virtual scrolling: 3 components (AnalyticsDashboard, TemplateMarketplace, BimElementPicker)
- Suspense boundaries: 2 components (CollaborationPresence, OfflineBanner)
- Dynamic imports: 7 components (BimViewer, SupplierPricingModal, TemplateMarketplace, etc.)

---

## NPM DEPENDENCIES (New)

| Package | Version | Size | Purpose | Required By |
|---------|---------|------|---------|-------------|
| `web-ifc` | ^0.0.x | ~500KB | IFC BIM file parsing | EST-P4-001 (3D BIM) |
| `three` | ^0.160.x | ~600KB | 3D rendering for BIM viewer | EST-P4-001 (3D BIM) |
| `simple-statistics` | ^7.x | ~25KB | Statistical analysis, ARIMA forecasting | EST-P4-003 (Advanced AI), EST-P4-005 (ML) |
| `idb` | ^8.x | ~3KB | IndexedDB wrapper for offline storage | EST-P3-003 (Offline Mode) |
| `workbox-window` | ^7.x | ~8KB | Service worker lifecycle management | EST-P3-003 (Offline Mode) |

**Notes:**
- `web-ifc` and `three` are heavy dependencies; use dynamic imports
- `simple-statistics` is lightweight and tree-shakeable
- `idb` provides Promise-based IndexedDB API
- `workbox-window` simplifies service worker registration

---

## TESTING STRATEGY

### Per-Task Testing (Phase 3)
1. **Measurement Tools (EST-P3-001)**
   - Area calculation accuracy (compare to manual calculation)
   - Linear measurement precision
   - Count tool placement accuracy
   - Scale calibration validation
   - Touch gesture disambiguation (zoom vs draw)

2. **Collaboration (EST-P3-002)**
   - Presence indicators update <500ms
   - Cursor positions sync correctly
   - Trade locks prevent conflicts
   - Activity feed shows all actions
   - Conflict resolution handles edge cases

3. **Offline Mode (EST-P3-003)**
   - Data caches correctly
   - Upload queue persists across sessions
   - Sync resolves conflicts properly
   - Background sync triggers on reconnect
   - Offline banner appears/disappears correctly

4. **Analytics (EST-P3-004)**
   - Charts render with correct data
   - Filters apply correctly
   - Export generates valid CSV/PDF
   - Predictions are reasonable
   - Performance with large datasets

### Per-Task Testing (Phase 4)
1. **3D BIM (EST-P4-001)**
   - IFC file parsing accuracy
   - 3D viewer performance (>30fps)
   - Element picking precision
   - Quantity calculations match industry standards
   - Memory management for large models

2. **Voice Input (EST-P4-002)**
   - Transcription accuracy >90%
   - NLP parsing handles variations
   - Offline mode works (if supported)
   - Multi-language support
   - Error correction flow

3. **Advanced AI (EST-P4-003)**
   - Anomaly detection catches outliers
   - Bid optimization improves win rate
   - Cost forecasting is within ±10%
   - Smart assemblies are relevant
   - Risk scoring correlates with actuals

4. **Supplier Integration (EST-P4-004)**
   - API calls succeed reliably
   - Quote comparison is accurate
   - PO creation is correct
   - Order tracking updates correctly
   - Catalog sync handles duplicates

5. **ML Refinement (EST-P4-005)**
   - Training data collection is complete
   - Model fine-tuning improves accuracy
   - A/B testing shows statistical significance
   - Continuous learning doesn't degrade
   - Accuracy dashboard is accurate

6. **Multi-Project Templates (EST-P4-006)**
   - Inheritance resolves correctly
   - Version control maintains history
   - Marketplace search works
   - Bulk apply succeeds
   - Template validation catches errors

---

## MOBILE CHECKS (All Tasks)

Every component must verify:
- [ ] 44px minimum touch targets
- [ ] `active:scale-95` or `active:bg-*` states
- [ ] `dvh` not `vh` for viewport heights
- [ ] `pb-[env(safe-area-inset-bottom)]` on fixed bottom elements
- [ ] `dark:` variants for all colors
- [ ] Direct Lucide imports (no barrel file)
- [ ] No `&&` for conditional rendering (use ternary)

---

## AGENT DISPATCH

### Phase 3
| Task | Agent(s) | Reason |
|------|----------|--------|
| EST-P3-001 | frontend-engineer + backend-engineer | UI + geometry calculations + DB |
| EST-P3-002 | backend-engineer + frontend-engineer | Realtime infrastructure + UI |
| EST-P3-003 | frontend-engineer | Service worker + IndexedDB |
| EST-P3-004 | backend-engineer + frontend-engineer | Analytics queries + Chart UI |

### Phase 4
| Task | Agent(s) | Reason |
|------|----------|--------|
| EST-P4-001 | backend-engineer + frontend-engineer | IFC parsing + 3D viewer |
| EST-P4-002 | frontend-engineer | Web Speech API + UI |
| EST-P4-003 | backend-engineer | AI/ML pipeline |
| EST-P4-004 | backend-engineer + frontend-engineer | API integration + UI |
| EST-P4-005 | backend-engineer | ML training pipeline |
| EST-P4-006 | backend-engineer + frontend-engineer | Template logic + UI |

---

## STATUS

**Version:** 1.0
**Status:** DRAFT - Pending Review
**Next Steps:**
1. Review tasks with team
2. Prioritize Phase 3 vs Phase 4 features
3. Assign to agents (frontend-engineer, backend-engineer)
4. Create approval markers when ready to implement

---

**References:**
- Phase 1+2 Tasks: `.claude/specs/estimates-v2/tasks-phase1-phase2.md`
- Requirements: `.claude/specs/estimates-v2/requirements-ux.md` v3.0
- Design: `.claude/specs/estimates-v2/design.md` v2.4
- Architecture: `.claude/docs/architecture-index.md`
- CLAUDE.md: `.claude/CLAUDE.md`
