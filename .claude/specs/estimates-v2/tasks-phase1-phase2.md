# Estimates V3 - Implementation Tasks (Phase 1 + Phase 2)

**Project:** GenHub PWA - Estimates Module V3
**Date:** 2026-02-14 | **Version:** 1.0 | **Status:** DRAFT
**Based on:** `requirements-ux.md` v3.0, `design.md` v2.4

---

## Task Organization

**Phase 1 (P0):** Critical ship-blocking features (REQ-UX-001 through REQ-UX-023)
**Phase 2 (P1):** Important next-sprint features (REQ-UX-007 through REQ-UX-014)

Each task includes:
- **ID:** Unique identifier
- **Component:** What gets built
- **Dependencies:** What must complete first
- **Effort:** Days estimate
- **Skills Applied:** React/performance rules
- **Files:** New/modified files

---

## PHASE 1: P0 CRITICAL FEATURES

### P1.1: Wizard Stepper Component (REQ-UX-001)

**ID:** `EST-P1-001`
**Priority:** P0 - Critical
**Effort:** 1.5 days
**Dependencies:** None

**Description:** Create horizontal step indicator for Upload → Parse → Review → Cost → Summary workflow.

**Acceptance Criteria:**
- 5 labeled steps with completed/active/upcoming states
- Click-back navigation (no skip-forward)
- Mobile compact mode: "Step 3 of 5" with dots
- 44px touch targets, pulse animation on active step
- Checkmark + filled circle for completed steps

**New Files:**
- `components/estimates/EstimateWizardStepper.tsx` (client)

**Modified Files:**
- `components/estimates/EstimatesTabClient.tsx` (integrate stepper)

**Skills Applied:**
- `rendering-conditional-render` - ternary for step states
- `bundle-barrel-imports` - direct Lucide imports
- `rerender-memo` - memoize step circles

**Implementation Notes:**
```typescript
// State management: current step index (1-5)
// Icons: CircleCheck (completed), Circle with ring (active), Circle outline (upcoming)
// Mobile breakpoint: <640px collapses to compact mode
// Colors: completed=#001B51, active=#001B51 ring + pulse, upcoming=#3C3C3C/30
```

---

### P1.2: Confidence Summary + Bulk Accept (REQ-UX-002, REQ-UX-005)

**ID:** `EST-P1-002`
**Priority:** P0 - Critical
**Effort:** 2 days
**Dependencies:** None

**Description:** Confidence-grouped review with summary screen and "Accept All High Confidence" button before swipe cards.

**Acceptance Criteria:**
- Summary shows: "23 items: 15 high, 5 medium, 3 low confidence"
- "Accept All High Confidence" button (full-width, 44px, CheckCheck icon)
- Batch accept items >85% with cascading animation
- Toast shows "15 items accepted"
- Transition to swipe cards for remaining medium/low items
- Confidence threshold slider (default 85%, persist per-user)

**New Files:**
- `components/estimates/ConfidenceSummary.tsx` (client)
- `components/estimates/ConfidenceThresholdSlider.tsx` (client)

**Modified Files:**
- `components/estimates/TakeoffReviewScreenContent.tsx` (add summary before cards)
- `app/actions/estimates.ts` (add bulkAcceptTakeoffItems, bulkRejectTakeoffItems)
- `components/estimates/ConfidenceBadge.tsx` (update to 85% threshold, add icons)

**Skills Applied:**
- `async-parallel` - batch update items via Promise.all
- `bundle-barrel-imports` - direct imports for CheckCheck, ShieldCheck, AlertTriangle
- `rerender-transitions` - startTransition for cascading checkmark animation

**Implementation Notes:**
```typescript
// Server Action: bulkAcceptTakeoffItems(itemIds: string[])
// Animation: 100ms stagger per item for cascade effect
// Confidence tiers: high=85-100%, medium=60-84%, low=0-59%
// Persist threshold: user_preferences table or localStorage
```

---

### P1.3: Swipe Review Cards (REQ-UX-002)

**ID:** `EST-P1-003`
**Priority:** P0 - Critical
**Effort:** 3 days
**Dependencies:** EST-P1-002

**Description:** Tinder-style swipeable card interface for medium/low confidence items on mobile.

**Acceptance Criteria:**
- Card stack: current + 2 behind at 95%/90% scale
- Swipe right >80px = accept (green), left >80px = reject (red), up >60px = flag (amber)
- Snap back <80px threshold with spring animation
- Velocity threshold >500px/s accepts gesture early
- Completion screen: X accepted, Y rejected, Z flagged
- Sort ascending by confidence (low confidence first)

**New Files:**
- `components/estimates/SwipeReviewCard.tsx` (client)
- `components/estimates/SwipeReviewStack.tsx` (client)

**Modified Files:**
- `components/estimates/TakeoffReviewScreenContent.tsx` (responsive: list desktop, cards mobile)

**Skills Applied:**
- `bundle-dynamic-imports` - lazy load framer-motion gestures
- `rerender-memo` - memoize individual cards
- `rendering-hoist-jsx` - static card backgrounds outside render

**Implementation Notes:**
```typescript
// Use framer-motion drag constraints: { left: -200, right: 200, top: -100, bottom: 20 }
// onDragEnd: check dragInfo.offset.x and dragInfo.velocity.x
// Card dimensions: calc(100vw - 32px) x calc(70dvh - 120px)
// Stack depth: 3 cards max with scale transform
// Haptic: navigator.vibrate(10) on threshold cross (Android only, iOS use active:scale-95)
```

---

### P1.4: Camera Upload + HEIC + Multi-Capture (REQ-UX-003)

**ID:** `EST-P1-004`
**Priority:** P0 - Critical
**Effort:** 2.5 days
**Dependencies:** None

**Description:** Enhanced upload with mobile camera capture, HEIC support, multi-capture mode, and thumbnail grid.

**Acceptance Criteria:**
- Camera button (56px, bottom-right FAB) on mobile
- Rear camera, flash auto, highest resolution
- HEIC support without user conversion
- Multi-capture mode: stay in camera, counter shows "3 photos captured"
- Client-side compression: target 1-2MB via canvas.toBlob(quality: 0.8)
- Thumbnail grid: 2 cols mobile, 4 cols desktop, page type badges

**New Files:**
- `components/estimates/CameraUploadButton.tsx` (client)
- `components/estimates/UploadThumbnailGrid.tsx` (client)

**Modified Files:**
- `components/estimates/PlanUploadPanel.tsx` (add camera + thumbnails)
- `app/api/estimates/upload/route.ts` (handle HEIC, return page classification)

**Skills Applied:**
- `bundle-barrel-imports` - direct Camera icon import
- `async-defer-await` - defer compression until needed
- `rendering-conditional-render` - camera button only on mobile

**Implementation Notes:**
```typescript
// Media API: navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
// HEIC: accept="image/heic,image/heif,image/jpeg,image/png,application/pdf"
// Compression: const canvas = document.createElement('canvas'); ctx.drawImage(img); canvas.toBlob(callback, 'image/jpeg', 0.8)
// Multi-capture: track captured[] array, show counter badge on camera button
// Page classification: run on upload, store in plan_pages.page_type
```

---

### P1.5: Sticky Cost Totals Bar (REQ-UX-004)

**ID:** `EST-P1-005`
**Priority:** P0 - Critical
**Effort:** 1.5 days
**Dependencies:** None

**Description:** Fixed bottom bar with real-time running total, collapsible trade breakdown.

**Acceptance Criteria:**
- Fixed at bottom during scroll
- Shows: total cost, item count, trade count
- Updates <100ms on any cost change
- Mobile: single-line "$XX,XXX | XX items" + expand chevron
- Expanded: trade subtotals, overhead %, markup %, grand total
- Hides on non-Cost/Review steps

**New Files:**
- `components/estimates/StickyCostBar.tsx` (client)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (integrate bar, real-time updates)

**Skills Applied:**
- `rerender-defer-reads` - don't subscribe to all items, only totals
- `rerender-functional-setstate` - stable callbacks for cost updates
- `rendering-content-visibility` - content-visibility:auto for trade breakdown

**Implementation Notes:**
```typescript
// Position: fixed bottom-0 left-0 right-0 z-40
// Safe area: pb-[env(safe-area-inset-bottom)]
// Expanded height: max-h-[40vh] overflow-y-auto
// Real-time: useMemo for total = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
// Backdrop: backdrop-blur-md bg-[#001B51]/95
```

---

### P1.6: Trade Donut Chart (REQ-UX-006)

**ID:** `EST-P1-006`
**Priority:** P0 - Critical
**Effort:** 1.5 days
**Dependencies:** None

**Description:** Donut chart visualization of cost by trade on Summary step.

**Acceptance Criteria:**
- 280px desktop, 200px mobile, 60px inner radius
- Tap segment to scroll to trade section
- Trade colors: walls=blue, electrical=amber, plumbing=teal, HVAC=green, doors=purple, windows=cyan
- Center shows total cost
- Collapsible trade sections below chart
- Empty state for no items

**New Files:**
- `components/estimates/TradeDonutChart.tsx` (client)

**Modified Files:**
- `components/estimates/EstimateSummary.tsx` (add chart + trade sections)

**Skills Applied:**
- `bundle-dynamic-imports` - lazy load recharts
- `rerender-memo` - memoize chart with useMemo on data changes only
- `rendering-conditional-render` - empty state ternary

**Implementation Notes:**
```typescript
// Library: recharts <PieChart> with <Pie innerRadius={60} outerRadius={100}>
// Data format: { name: 'Electrical', value: 12500, color: '#F59E0B' }
// onClick: scroll to element via ref.current?.scrollIntoView({ behavior: 'smooth' })
// Trade sections: accordion with ChevronDown/Up toggle
// Empty state: "No items yet. Complete the Review step to see your cost breakdown."
```

---

### P1.7: Micro-Confirmation Cards (REQ-UX-019)

**ID:** `EST-P1-007`
**Priority:** P0 - Critical
**Effort:** 2 days
**Dependencies:** EST-P1-003 (uses similar card UI)

**Description:** L8 validation layer with 3-5 targeted yes/no prompts for uncertain detections.

**Acceptance Criteria:**
- Max 5 cards total
- Each card: plan region image, simple question, 2-3 response buttons
- "Skip" always available
- 44px touch targets
- Confidence updates in real-time after answer
- Driven by `validation/micro-confirmation.ts` backend

**New Files:**
- `components/estimates/MicroConfirmation.tsx` (client)
- `lib/extraction/validation/micro-confirmation.ts` (L8 logic)

**Modified Files:**
- `app/actions/estimates.ts` (add respondToMicroConfirmation)
- Database: `micro_confirmations` table (migration exists in design.md)

**Skills Applied:**
- `bundle-barrel-imports` - direct icon imports
- `rerender-transitions` - startTransition for confidence update animation
- `rendering-conditional-render` - skip button always visible

**Implementation Notes:**
```typescript
// Card types: scale_confirm, ceiling_height, door_count, room_count, wall_type_confirm
// Confidence boost: +15 scale, +10 ceiling height, +10 door count, +10 room count, +10 wall type
// Image: cropped plan region with highlighted element (2px colored border)
// Question text: 16px semibold, centered
// Response buttons: horizontal row, primary for default, outline for alternatives
// Server Action: respondToMicroConfirmation(confirmationId, response) -> updates extraction result
```

---

### P1.8: Extraction Progress Grid (REQ-UX-020)

**ID:** `EST-P1-008`
**Priority:** P0 - Critical
**Effort:** 2.5 days
**Dependencies:** None (integrates with existing upload/parse)

**Description:** Per-page extraction status grid with Realtime updates from worker queue.

**Acceptance Criteria:**
- Grid: 2 cols mobile, 4 cols desktop
- Cell per page: queued (gray), processing (blue pulse), complete (green checkmark), failed (red X + retry)
- Overall progress: stage name, percentage, ETA
- Retry button for failed pages (44px)
- Cancel button (top-right, red text)
- Realtime via Supabase subscription to `extraction_jobs`

**New Files:**
- `components/estimates/ExtractionProgress.tsx` (client)
- `lib/extraction/progress-tracker.ts` (useExtractionProgress hook)

**Modified Files:**
- `components/estimates/ParseProgressOverlay.tsx` (conditionally render ExtractionProgress)
- Database: `extraction_jobs` table (migration exists in design.md)

**Skills Applied:**
- `async-suspense-boundaries` - Suspense for realtime subscription
- `bundle-barrel-imports` - direct icon imports
- `rerender-memo` - memoize page cells

**Implementation Notes:**
```typescript
// Supabase Realtime: channel.on('postgres_changes', { event: 'UPDATE', table: 'extraction_jobs', filter: `plan_upload_id=eq.${id}` })
// Page cell: 80px mobile, 100px desktop, rounded-lg, border-1
// Status colors: queued=#6B7280, processing=#001B51 + pulse animation, complete=#16A34A, failed=#DC2626
// ETA: average duration per job * remaining jobs
// Retry: POST /api/estimates/extract with pageIds=[failedPageNumber]
```

---

### P1.9: Plan Color Overlays by Trade (REQ-UX-021)

**ID:** `EST-P1-009`
**Priority:** P0 - Critical
**Effort:** 2 days
**Dependencies:** None (enhances existing PlanViewer)

**Description:** Detected elements overlaid on plan with trade-specific colors, toggle layers.

**Acceptance Criteria:**
- Trade colors: walls=blue, electrical=amber, plumbing=teal, HVAC=green, doors=purple, windows=cyan
- Opacity: 30% desktop, 20% mobile
- Toggle control: horizontal chip bar above plan, 44px touch targets
- Tap overlay to select item in list
- Selected overlay: 50% opacity + 2px border + pulse animation
- Fade in/out on toggle (200ms)

**New Files:**
- `components/estimates/PlanOverlayLayer.tsx` (client)

**Modified Files:**
- `components/estimates/PlanViewer.tsx` (render overlay layers)

**Skills Applied:**
- `rendering-content-visibility` - content-visibility for hidden layers
- `bundle-barrel-imports` - direct imports
- `rerender-memo` - memoize overlay SVG paths

**Implementation Notes:**
```typescript
// Render: SVG <g> per trade with <path> or <rect> per element
// Trade filter state: Record<string, boolean> - { walls: true, doors: true, ... }
// Toggle chip: inline-flex gap-2, overflow-x-auto, pb-2
// Overlay coordinates: map from takeoff_items.source_region JSON { x, y, width, height }
// Selection: onClick={(e) => onSelectItem(element.takeoffItemId)}
// Pulse animation: @keyframes pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 0.7 } }
```

---

### P1.10: Construction Status Visual Treatment (REQ-UX-022)

**ID:** `EST-P1-010`
**Priority:** P0 - Critical
**Effort:** 1.5 days
**Dependencies:** EST-P1-009 (extends overlay system)

**Description:** Visual distinction for new/existing/demolition items on plan and in list.

**Acceptance Criteria:**
- New: solid overlay, trade color, standard opacity
- Existing: dashed outline (4px dash, 4px gap), gray #6B7280, 25% opacity
- Demolition: red overlay #DC2626, 35% opacity, diagonal hatch pattern
- Item list badge: "New" (blue), "Existing" (gray), "Demo" (red)
- Filter by construction status

**New Files:**
- `components/estimates/ConstructionStatusBadge.tsx` (client)

**Modified Files:**
- `components/estimates/PlanOverlayLayer.tsx` (apply status styles)
- `components/estimates/TakeoffItemRow.tsx` (add status badge)

**Skills Applied:**
- `rendering-conditional-render` - ternary for status styles
- `bundle-barrel-imports` - direct Plus/Minus icon imports
- `rendering-hoist-jsx` - static SVG patterns outside render

**Implementation Notes:**
```typescript
// SVG dasharray: strokeDasharray="4,4" for existing
// Hatch pattern: <pattern id="demolition-hatch" patternUnits="userSpaceOnUse" width="8" height="8">
//   <path d="M0,8 l8,-8" stroke="#DC2626" strokeWidth="1"/>
// </pattern>
// Badge: 12px text, pill shape, bg opacity 15%, text full color
// Filter: dropdown with checkboxes for new/existing/demolition
```

---

### P1.11: Progressive Result Loading (REQ-UX-023)

**ID:** `EST-P1-011`
**Priority:** P0 - Critical
**Effort:** 1.5 days
**Dependencies:** EST-P1-008 (uses Realtime subscription)

**Description:** Takeoff items appear card-by-card as detected, not all-at-once.

**Acceptance Criteria:**
- Items appear with slide-up + fade-in (250ms)
- Counter: "12 items found so far..." with pulse on increment
- Confidence score visible immediately
- On completion: "23 items found" (no "so far"), confidence summary appears
- Works while user interacts with already-loaded items
- Failed page retains existing items

**New Files:**
- None (enhances existing components)

**Modified Files:**
- `components/estimates/TakeoffReviewScreenContent.tsx` (progressive rendering)
- `lib/extraction/result-assembler.ts` (stream items as detected)

**Skills Applied:**
- `async-suspense-boundaries` - Suspense for streaming items
- `rerender-transitions` - startTransition for item entrance
- `rendering-content-visibility` - content-visibility for off-screen items

**Implementation Notes:**
```typescript
// Realtime subscription: channel.on('INSERT', { table: 'takeoff_items', filter: `plan_upload_id=eq.${id}` })
// Animation: framer-motion <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
// Counter: position absolute top-4 right-4, pulse animation scale(1.05) on increment
// Loading indicator: small Loader2 spinner next to counter while extraction in progress
```

---

## PHASE 2: P1 IMPORTANT FEATURES

### P2.1: AI Plan Chat Sidebar (REQ-UX-007)

**ID:** `EST-P2-001`
**Priority:** P1 - Important
**Effort:** 3 days
**Dependencies:** None

**Description:** Collapsible sidebar (desktop) or bottom sheet (mobile) for natural language plan Q&A.

**Acceptance Criteria:**
- Sidebar: 320px width, slides in/out (300ms)
- Bottom sheet: 40%/85% snap points on mobile
- Suggested prompt chips above input (horizontal scroll)
- AI responses with inline references: "[Page 3, Region B4]" (tappable)
- Tapping reference highlights region on plan + scrolls
- Typing indicator: animated dots
- Persistent per-estimate: `estimate_chat_messages` table

**New Files:**
- `components/estimates/PlanChatSidebar.tsx` (client)
- `app/actions/estimate-chat.ts` (sendChatMessage, getChatHistory)

**Modified Files:**
- `components/estimates/EstimatesTabClient.tsx` (add chat toggle)
- Database: `estimate_chat_messages` table (migration in design.md)

**Skills Applied:**
- `async-parallel` - parallel fetch for chat history + plan data
- `bundle-dynamic-imports` - lazy load chat on first open
- `rerender-memo` - memoize message list

**Implementation Notes:**
```typescript
// Message format: { role: 'user' | 'assistant', content: string, references: { pageNumber, region }[] }
// Reference link: <button onClick={() => highlightPlanRegion(ref)}>Page {ref.pageNumber}</button>
// Suggested prompts: ["How many doors?", "Total square footage?", "List all electrical panels"]
// AI backend: calls OpenAI with plan context + extraction results
// Mobile: use same bottom-sheet pattern as plan viewer
```

---

### P2.2: Assemblies System (REQ-UX-008)

**ID:** `EST-P2-002`
**Priority:** P1 - Important
**Effort:** 4 days
**Dependencies:** None

**Description:** Pre-built grouped items for consistent estimation (e.g., "Interior Wall" → studs, drywall, tape, paint).

**Acceptance Criteria:**
- Assembly library with search + category filter
- Create from existing items or from scratch
- Apply assembly to takeoff item (expands into component items)
- Default quantities with multiplier relative to parent
- Company-level and personal libraries
- Assembly versioning with update-all-instances option

**New Files:**
- `components/estimates/AssemblyPicker.tsx` (client)
- `components/estimates/AssemblyEditor.tsx` (client)
- `app/actions/assemblies.ts` (CRUD + applyAssembly)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (add "Apply Assembly" button)
- Database: `estimate_assemblies`, `assembly_items` tables (migrations in design.md)

**Skills Applied:**
- `async-parallel` - parallel fetch assemblies + materials
- `bundle-dynamic-imports` - lazy load assembly picker modal
- `rerender-memo` - memoize assembly cards

**Implementation Notes:**
```typescript
// Assembly data: { name, description, category, items: [{ trade, description, unit, quantityMultiplier, materialId }] }
// Apply: server action creates line items with parent_assembly_id reference
// Versioning: assembly.version integer, "Update all instances?" modal on version change
// Search: fuzzy match on name + description
// Categories: walls, flooring, ceilings, roofing, sitework, misc
```

---

### P2.3: Multi-Page Batch Operations (REQ-UX-009)

**ID:** `EST-P2-003`
**Priority:** P1 - Important
**Effort:** 2 days
**Dependencies:** EST-P1-008 (uses same progress system)

**Description:** "Parse All" button for sequential parsing of all uploaded pages.

**Acceptance Criteria:**
- "Parse All" button triggers batch
- Per-page status in progress grid
- ETA based on average duration
- Cancel mid-process (completed pages retained)
- Results aggregated across all pages
- Background processing: navigate away and return

**New Files:**
- None (enhances existing extraction system)

**Modified Files:**
- `components/estimates/PlanUploadPanel.tsx` (add "Parse All" button)
- `app/api/estimates/extract/route.ts` (batch mode)

**Skills Applied:**
- `async-parallel` - parallel job creation (not execution)
- `rendering-conditional-render` - parse all vs parse page

**Implementation Notes:**
```typescript
// POST /api/estimates/extract with { planUploadId, pageIds: null } for all pages
// Worker queue handles sequential processing
// Background: Realtime subscription persists across navigation
// Cancel: DELETE /api/estimates/extract/:planUploadId endpoint
```

---

### P2.4: Revision Comparison View (REQ-UX-010)

**ID:** `EST-P2-004`
**Priority:** P1 - Important
**Effort:** 3.5 days
**Dependencies:** None

**Description:** Side-by-side or overlay diff of estimate versions.

**Acceptance Criteria:**
- Upload new version, link to previous estimate
- AI compares quantities against previous takeoff
- Diff view: added (green), removed (red), quantity changed (amber)
- Accept/reject changes individually or bulk
- Cost impact: "+$X,XXX" or "-$X,XXX"
- Version history with timestamp, user, summary

**New Files:**
- `components/estimates/RevisionDiffView.tsx` (client)
- `app/actions/revisions.ts` (createRevision, getRevisionDiff)

**Modified Files:**
- `components/estimates/EstimateSummary.tsx` (add "Upload Revision" button)
- Database: `estimate_revisions` table (migration in design.md)

**Skills Applied:**
- `async-parallel` - parallel fetch old + new estimates
- `rendering-content-visibility` - virtual scroll for large diffs
- `rerender-memo` - memoize diff rows

**Implementation Notes:**
```typescript
// Diff algorithm: match items by trade + description, compare quantities
// Change types: { type: 'added' | 'removed' | 'modified', item, oldQuantity?, newQuantity?, costDelta }
// Side-by-side: 2-column layout desktop, stacked mobile
// Overlay: toggle opacity slider between versions
// Bulk actions: "Accept All Additions", "Reject All Deletions"
```

---

### P2.5: PDF Export with Company Branding (REQ-UX-011)

**ID:** `EST-P2-005`
**Priority:** P1 - Important
**Effort:** 3 days
**Dependencies:** None

**Description:** Professionally formatted PDF estimate for bid proposals.

**Acceptance Criteria:**
- Cover page: logo, project name, date, estimator name
- Executive summary: totals, trade chart, key metrics
- Trade-by-trade detail: line items, quantities, costs
- Optional: plan thumbnails with highlighted regions
- Footer: page numbers, company name, "Confidential" watermark
- Customizable: select trades, detail level

**New Files:**
- `app/api/estimates/export-pdf/route.ts` (PDF generation)
- `lib/pdf/estimate-template.ts` (PDF template)

**Modified Files:**
- `components/estimates/EstimateSummary.tsx` (add "Export PDF" button)

**Skills Applied:**
- `async-defer-await` - defer PDF generation until needed
- No React rules (server-side PDF)

**Implementation Notes:**
```typescript
// Library: @react-pdf/renderer or puppeteer for HTML→PDF
// Cover: company.logo_url, estimate.name, estimate.created_at, user.full_name
// Executive summary: donut chart image, total, subtotals by trade
// Detail pages: table with trade, description, quantity, unit, unit cost, total
// Watermark: diagonal "CONFIDENTIAL" at 15% opacity
// Endpoint: GET /api/estimates/:id/export-pdf → returns PDF blob
```

---

### P2.6: Estimate-to-Budget Conversion (REQ-UX-012)

**ID:** `EST-P2-006`
**Priority:** P1 - Important
**Effort:** 2.5 days
**Dependencies:** None

**Description:** One-click conversion from approved estimate to project budget.

**Acceptance Criteria:**
- "Convert to Budget" button on approved estimates
- Maps estimate trades to budget categories
- Preserves line-item detail as budget sub-items
- Adds contingency line based on project risk settings
- Creates budget in draft status
- Links budget back to source estimate

**New Files:**
- `app/actions/budget-conversion.ts` (convertToBudget)

**Modified Files:**
- `components/estimates/EstimateSummary.tsx` (add conversion button)
- `components/budgets/BudgetDetail.tsx` (show source estimate link)

**Skills Applied:**
- `async-parallel` - parallel insert budget + line items
- No React-specific rules (server action)

**Implementation Notes:**
```typescript
// Server Action: convertToBudget(estimateId) → creates budget
// Category mapping: estimate_line_items.trade → budget_categories.name
// Contingency: project.risk_factor (low=5%, medium=10%, high=15%)
// Draft status: allows review before activation
// Link: budget.source_estimate_id = estimateId
```

---

### P2.7: Template Management (REQ-UX-013)

**ID:** `EST-P2-007`
**Priority:** P1 - Important
**Effort:** 3 days
**Dependencies:** EST-P2-002 (assemblies)

**Description:** Save, organize, and share pricing templates across projects.

**Acceptance Criteria:**
- Save current estimate pricing as named template
- Library: search, category filter, last-used date
- Apply template to estimate (bulk-price matching items)
- Company templates (shared) vs personal (private)
- Template versioning with changelog
- Duplicate and modify templates

**New Files:**
- `components/estimates/TemplateLibrary.tsx` (client)
- `components/estimates/TemplateVersionHistory.tsx` (client)
- `app/actions/templates.ts` (CRUD + applyTemplate)

**Modified Files:**
- `components/estimates/SaveTemplateModal.tsx` (enhance existing)
- `components/estimates/PricingTemplateModal.tsx` (enhance existing)
- Database: extend `pricing_templates` table

**Skills Applied:**
- `async-parallel` - parallel fetch templates + materials
- `bundle-dynamic-imports` - lazy load library modal
- `rendering-content-visibility` - virtual scroll for template list

**Implementation Notes:**
```typescript
// Template data: { name, description, category, isCompanyTemplate, lineItems: [{ trade, description, unit, unitCost }] }
// Apply: match by trade + description (fuzzy), update estimate_line_items.unit_cost
// Versioning: template.version integer, changelog TEXT[]
// Last used: template_usage table with user_id + timestamp
// Categories: residential, commercial_ti, warehouse, retail, office
```

---

### P2.8: Material Catalog Integration (REQ-UX-014)

**ID:** `EST-P2-008`
**Priority:** P1 - Important
**Effort:** 4 days
**Dependencies:** None (uses existing materials module)

**Description:** Auto-link line items to materials catalog for real pricing.

**Acceptance Criteria:**
- AI suggests material matches per line item
- Confidence-scored suggestions with manual override
- Stale price warnings (>30 days old)
- One-click accept or manual catalog search
- Linked items auto-update on catalog price change (with notification)
- Bulk action: "Match all unlinked items"

**New Files:**
- `components/estimates/MaterialSuggestionPicker.tsx` (client)
- `components/estimates/MaterialMatchConfirmModal.tsx` (client)
- `components/estimates/LinkedMaterialBadge.tsx` (client)
- `components/estimates/StalePriceWarning.tsx` (client)
- `app/actions/material-suggestions.ts` (suggest, bulkMatch, checkStaleness)

**Modified Files:**
- `components/estimates/CostEditor.tsx` (add "Link Material" per row)
- Database: `estimate_line_items.material_id` FK (already in design.md)

**Skills Applied:**
- `async-parallel` - parallel fetch suggestions for all items
- `bundle-dynamic-imports` - lazy load suggestion picker
- `rerender-memo` - memoize suggestion cards

**Implementation Notes:**
```typescript
// Suggestion algorithm: fuzzy match on trade + description, score by relevance
// Server Action: suggestMaterialsForLineItem({ trade, category, subType }) → Material[]
// Stale check: materials.updated_at < now() - INTERVAL '30 days'
// Auto-update: trigger on material UPDATE, notify via toast "3 items updated to new prices"
// Bulk match: POST /api/estimates/:id/bulk-match-materials
```

---

## DEPENDENCIES & SEQUENCE

### Phase 1 Sequence (Parallelizable)

**Stream 1 (Wizard + Review):**
- EST-P1-001 (Stepper) → EST-P1-002 (Confidence Summary) → EST-P1-003 (Swipe Cards)

**Stream 2 (Upload + Progress):**
- EST-P1-004 (Camera Upload) → EST-P1-008 (Extraction Progress) → EST-P1-011 (Progressive Loading)

**Stream 3 (Plan Visualization):**
- EST-P1-009 (Color Overlays) → EST-P1-010 (Construction Status)

**Stream 4 (Cost + Summary):**
- EST-P1-005 (Sticky Bar) → EST-P1-006 (Donut Chart)

**Stream 5 (Validation):**
- EST-P1-007 (Micro-Confirmation Cards) - can run parallel with Stream 1

### Phase 2 Sequence (Parallelizable)

**Stream A (Chat + Assemblies):**
- EST-P2-001 (AI Chat) + EST-P2-002 (Assemblies) - parallel

**Stream B (Batch + Revisions):**
- EST-P2-003 (Multi-Page Batch) + EST-P2-004 (Revision Diff) - parallel

**Stream C (Export + Conversion):**
- EST-P2-005 (PDF Export) + EST-P2-006 (Budget Conversion) - parallel

**Stream D (Templates + Materials):**
- EST-P2-007 (Templates) + EST-P2-008 (Materials) - parallel

---

## EFFORT SUMMARY

### Phase 1 (P0 Critical)
| Stream | Tasks | Days |
|--------|-------|------|
| Stream 1 (Wizard + Review) | 3 tasks | 7 |
| Stream 2 (Upload + Progress) | 3 tasks | 6.5 |
| Stream 3 (Plan Visualization) | 2 tasks | 3.5 |
| Stream 4 (Cost + Summary) | 2 tasks | 3 |
| Stream 5 (Validation) | 1 task | 2 |
| **Phase 1 Total** | **11 tasks** | **22 days** (or ~5 days with 4-5 parallel streams) |

### Phase 2 (P1 Important)
| Stream | Tasks | Days |
|--------|-------|------|
| Stream A (Chat + Assemblies) | 2 tasks | 7 |
| Stream B (Batch + Revisions) | 2 tasks | 5.5 |
| Stream C (Export + Conversion) | 2 tasks | 5.5 |
| Stream D (Templates + Materials) | 2 tasks | 7 |
| **Phase 2 Total** | **8 tasks** | **25 days** (or ~7 days with 4 parallel streams) |

### Grand Total
- **Phase 1 + Phase 2:** 19 tasks, 47 days sequential / ~12 days with full parallelization

---

## SKILLS TRACKING

### Most Common React Rules Applied
1. `bundle-barrel-imports` (16 tasks) - Direct Lucide icon imports
2. `async-parallel` (9 tasks) - Parallel data fetching
3. `rerender-memo` (11 tasks) - Component memoization
4. `rendering-conditional-render` (8 tasks) - Ternary over &&
5. `bundle-dynamic-imports` (6 tasks) - Lazy loading

### Performance Optimizations
- Virtual scrolling: 4 components (TakeoffReviewScreenContent, TemplateLibrary, RevisionDiffView, MaterialCatalog)
- Suspense boundaries: 3 components (ExtractionProgress, ChatSidebar, ProgressiveLoading)
- Content visibility: 5 components (StickyCostBar, TradeDonutChart, DiffView, Overlays)

---

## TESTING STRATEGY

### Per-Task Testing
Each task requires:
1. **Unit tests:** Component logic + edge cases
2. **Integration tests:** Data flow + server actions
3. **Mobile tests:** Touch targets (44px), active states, safe areas
4. **Dark mode tests:** All variants present
5. **Accessibility:** ARIA labels, keyboard nav

### E2E Test Flows (Phase 1)
1. **Full Upload → Review → Cost → Summary**
   - Upload with camera
   - Bulk accept high confidence
   - Swipe remaining cards
   - Apply costs
   - View donut chart

2. **Extraction Progress + Retry**
   - Upload multi-page PDF
   - Watch per-page progress
   - Simulate failure
   - Retry failed page
   - Verify progressive loading

3. **Plan Visualization**
   - Toggle trade overlays
   - Select overlay → item highlights
   - Filter by construction status
   - Verify color contrast (dark mode)

### E2E Test Flows (Phase 2)
1. **AI Chat → Apply Assembly → Export**
   - Ask "How many doors?"
   - Click reference link
   - Apply Interior Wall assembly
   - Export branded PDF

2. **Revision Compare → Accept Changes → Convert Budget**
   - Upload revision
   - Review diffs
   - Accept changes
   - Convert to budget
   - Verify line items

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

## STATUS

**Version:** 1.0
**Status:** DRAFT - Pending Review
**Next Steps:**
1. Review tasks with team
2. Prioritize Phase 1 streams
3. Assign to agents (frontend-engineer, backend-engineer)
4. Create approval markers: `touch .claude/specs/estimates-v2/tasks-phase1.APPROVED`

---

**References:**
- Requirements: `.claude/specs/estimates-v2/requirements-ux.md` v3.0
- Design: `.claude/specs/estimates-v2/design.md` v2.4
- Architecture: `.claude/docs/architecture-index.md`
- CLAUDE.md: `.claude/CLAUDE.md`
