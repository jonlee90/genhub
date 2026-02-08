# AI Plan Estimator - Part 2: UI Components and Integration

**Implementation Tasks for Frontend and User Workflows**

---

## Overview

Part 2 builds the user-facing UI for AI-assisted plan estimating:
- Estimates tab integration into ProjectDetailContent
- Plan upload panel with drag-drop
- AI parsing progress overlay
- Takeoff review screen (split layout)
- Cost editor with pricing templates
- Estimate summary and history
- AI budget banner
- Mobile-first responsive design

**Estimated Duration:** 2 weeks
**Dependencies:** Part 1 completed and deployed
**Agent Sequence:** frontend-engineer → code-reviewer

---

## Task 2.1: Extend ProjectDetailContent Tab Union

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Add "estimates" to the tab union in ProjectDetailContent and add the Estimates tab button with Calculator icon.

**Files:**
- `components/projects/ProjectDetailContent.tsx`

**Acceptance Criteria:**
- [ ] Tab union type extended: `"overview" | "team" | "tasks" | "files" | "estimates" | "settings"`
- [ ] New tab button added with `Calculator` icon from Lucide
- [ ] Tab button text: "Estimates"
- [ ] Tab button follows existing pattern (same styling, active states)
- [ ] 44px minimum touch target for tab button
- [ ] Conditional render: `{activeTab === "estimates" && <EstimatesTab projectId={projectId} userRole={userRole} />}`
- [ ] Build passes with no TypeScript errors
- [ ] No visual regression on existing tabs

**Dependencies:** Part 1 Task 1.13 (types available)

---

## Task 2.2: EstimatesTab Server Component Wrapper

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the server component wrapper that fetches initial data and passes to client component.

**Files:**
- `components/estimates/EstimatesTab.tsx`

**Acceptance Criteria:**
- [ ] Server component (no `'use client'`)
- [ ] Props: `{ projectId: string, userRole: UserRole }`
- [ ] Fetches data via Server Actions:
  - `getPlanUploads(projectId)`
  - `getEstimates(projectId)`
  - `getAiUsage()` (for budget banner)
- [ ] Error handling with try/catch, displays error state if fetch fails
- [ ] Passes data down to `<EstimatesTabContent>` client component
- [ ] Loading state: renders `<EstimatesSkeleton>` during fetch
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.1

---

## Task 2.3: EstimatesTabContent Client Container

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the client component that manages sub-views (upload, review, costing, summary) and state.

**Files:**
- `components/estimates/EstimatesTabContent.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ planUploads, estimates, aiUsage, userRole }`
- [ ] State: `const [subView, setSubView] = useState<'upload' | 'review' | 'costing' | 'summary'>('upload')`
- [ ] State: `const [selectedPlan, setSelectedPlan] = useState<PlanUpload | null>(null)`
- [ ] State: `const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null)`
- [ ] Conditional rendering:
  - `subView === 'upload'` → `<PlanUploadPanel>` + `<ParseProgressOverlay>`
  - `subView === 'review'` → `<TakeoffReviewScreen>`
  - `subView === 'costing'` → `<CostEditor>`
  - `subView === 'summary'` → `<EstimateSummary>`
- [ ] Renders `<AiBudgetBanner>` at top when budget >= 80%
- [ ] Empty state: if no planUploads, render `<EmptyEstimatesState>`
- [ ] Navigation between sub-views via button clicks (stepper pattern)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.2

---

## Task 2.4: PlanUploadPanel Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/file-upload.md`

**Description:**
Create the plan upload UI with drag-drop zone and file picker.

**Files:**
- `components/estimates/PlanUploadPanel.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Drag-drop zone with `onDragOver`, `onDrop` handlers
- [ ] Visual feedback: border color change on drag hover
- [ ] File input with `accept=".pdf,.jpg,.jpeg,.png"`
- [ ] 44px minimum touch target on "Select File" button
- [ ] Client-side validation: file size < 50MB, MIME type check
- [ ] Error toast: "File exceeds 50MB limit" or "Only PDF, JPG, and PNG files are accepted"
- [ ] Upload via `fetch('/api/estimates/upload', { method: 'POST', body: formData })`
- [ ] Progress bar using `XMLHttpRequest.upload.onprogress`
- [ ] Success callback: refreshes plan uploads list
- [ ] Role gate: hide upload button if `userRole === 'foreman' || userRole === 'field_worker'`
- [ ] Lucide `Upload` icon
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.3

---

## Task 2.5: PlanUploadProgress Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the upload/processing progress indicator per plan.

**Files:**
- `components/estimates/PlanUploadProgress.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ planUpload: PlanUpload }`
- [ ] Status badge rendering:
  - `uploading` → spinner + "Uploading..."
  - `processing` → spinner + "Converting page X of Y..."
  - `ready` → checkmark + "Ready"
  - `failed` → X icon + "Failed" + error message
- [ ] Per-page progress if PDF (fetch pages from `getPlanPages()`)
- [ ] "Retry" button on failed status (admin/PM only)
- [ ] "Parse with AI" button on ready status (enabled if budget allows)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.4

---

## Task 2.6: ParseProgressOverlay Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/polling.md`

**Description:**
Create the polling overlay that displays AI parsing progress.

**Files:**
- `components/estimates/ParseProgressOverlay.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ planUploadId: string, onComplete: () => void }`
- [ ] Polling via `setInterval` every 2 seconds
- [ ] Calls `GET /api/estimates/parse-status?planUploadId={id}`
- [ ] Displays per-page status:
  - `pending` → gray dot
  - `parsing` → spinner + "Parsing page X..."
  - `parsed` → green checkmark + "Page X complete"
  - `parse_failed` → red X + "Page X failed"
- [ ] Total progress bar: `{parsed + failed} of {total} pages`
- [ ] Stops polling when `allComplete === true`
- [ ] Calls `onComplete()` callback when done
- [ ] Modal overlay with `ResponsiveModal` (NEVER raw Dialog)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.5

---

## Task 2.7: PlanViewer Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/image-viewer.md`

**Description:**
Create the pan/zoom plan image viewer with region highlights.

**Files:**
- `components/estimates/PlanViewer.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ imageUrl: string, regions: SourceRegion[], activeRegionId?: string, onRegionClick?: (id: string) => void }`
- [ ] CSS `transform: scale() translate()` for zoom/pan (GPU-accelerated)
- [ ] Touch events: `onTouchStart/Move/End` for pinch-to-zoom and pan
- [ ] Mouse events: wheel for zoom, drag for pan
- [ ] Zoom limits: min 1x, max 5x
- [ ] Region overlays: absolute positioned divs with colored borders
- [ ] Active region highlighted with thicker border + different color
- [ ] Page navigation: swipe or prev/next buttons (if multi-page)
- [ ] `will-change: transform` for performance
- [ ] 60fps target on mobile Safari (test on iPhone SE)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.6

---

## Task 2.8: TakeoffReviewScreen Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/responsive-layout.md`

**Description:**
Create the review screen with responsive split layout.

**Files:**
- `components/estimates/TakeoffReviewScreen.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ planUploadId: string }`
- [ ] Fetches takeoff items via `getTakeoffItems(planUploadId)`
- [ ] Fetches plan pages via `getPlanPages(planUploadId)`
- [ ] Layout: `flex flex-col md:flex-row`
- [ ] Mobile (< 768px): plan viewer top, item list bottom (stacked)
- [ ] Desktop (>= 768px): plan viewer left 60%, item list right 40%
- [ ] Progress indicator: "{reviewed} of {total} items reviewed"
- [ ] "Proceed to Estimate" button: disabled until all items reviewed
- [ ] Disabled state tooltip: "Review all items to continue"
- [ ] State syncing: tapping item in list highlights region in viewer
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.7

---

## Task 2.9: TakeoffItemList and TakeoffItemRow Components

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/list-patterns.md`

**Description:**
Create the scrollable takeoff item list and individual item row components.

**Files:**
- `components/estimates/TakeoffItemList.tsx`
- `components/estimates/TakeoffItemRow.tsx`

**Acceptance Criteria:**
- [ ] `TakeoffItemList`:
  - `'use client'`
  - Props: `{ items: TakeoffItem[], onItemClick, onAccept, onReject, onEdit }`
  - Grouped by page_number with section headers
  - Scrollable with `overflow-y-auto`
  - Filter/sort controls: by trade, by confidence, by review_status
  - Virtualization not required for v1 (test with 200 items, should render < 100ms)
- [ ] `TakeoffItemRow`:
  - `'use client'`
  - Props: `{ item: TakeoffItem, onAccept, onReject, onEdit, onTap }`
  - Displays: label, type icon (Lucide), quantity + unit, trade badge, `<ConfidenceBadge>`
  - Three action buttons (44px min): Accept (Check icon, green), Reject (X icon, red), Edit (Pencil icon)
  - Visual states: pending (neutral), accepted (green border), rejected (red strikethrough), edited (blue border)
  - `onTap` highlights source_region in viewer
  - Needs review flag: yellow highlight if `needs_review === true`
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.8

---

## Task 2.10: TakeoffItemEditModal Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/modal-patterns.md`

**Description:**
Create the edit modal for takeoff items using ResponsiveModal.

**Files:**
- `components/estimates/TakeoffItemEditModal.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Uses `ResponsiveModal` wrapper (NEVER raw Dialog)
- [ ] Props: `{ item: TakeoffItem, isOpen, onClose, onSave }`
- [ ] Form fields: label, quantity, unit_of_measure, waste_factor (%), trade (dropdown), notes (textarea)
- [ ] Shows original AI value alongside editable field (e.g., "AI: 125 sqft")
- [ ] All inputs have 44px min touch targets
- [ ] On save: calls `reviewTakeoffItem({ itemId, reviewStatus: 'edited', editedValues })`
- [ ] Validation: quantity > 0, waste_factor 0-100
- [ ] Cancel button + Save button
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.9

---

## Task 2.11: AddManualItemModal Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/modal-patterns.md`

**Description:**
Create the modal for manually adding takeoff items.

**Files:**
- `components/estimates/AddManualItemModal.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Uses `ResponsiveModal`
- [ ] Props: `{ planUploadId: string, planPageId?: string, isOpen, onClose, onAdd }`
- [ ] Form fields: category (dropdown), sub_type (text), label (text), trade (dropdown), quantity (number), unit_of_measure (text), waste_factor (%), notes (textarea)
- [ ] All inputs have 44px min touch targets
- [ ] On add: calls `addManualTakeoffItem({ planUploadId, planPageId, ...values })`
- [ ] Sets `extraction_method='manual'`, `confidence=1.0` on backend
- [ ] Validation: all required fields filled
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.10

---

## Task 2.12: CostEditor Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/form-patterns.md`

**Description:**
Create the cost application UI with line items, templates, and totals.

**Files:**
- `components/estimates/CostEditor.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ estimateId?: string, takeoffItems: TakeoffItem[] }`
- [ ] State for line items (starts from takeoffItems, converts to EstimateLineItem format)
- [ ] Table with columns: description, quantity, unit, material_cost, labor_cost, equipment_cost, unit_cost (computed), subtotal (computed)
- [ ] Overhead % input (default 10%), markup % input (default 15%)
- [ ] Real-time total recalculation on any input change (debounced 100ms)
- [ ] Formula display per row: "125 sqft x $3.50/sqft = $437.50"
- [ ] "Apply Template" button → opens `<PricingTemplateModal>`
- [ ] "Save as Template" button → opens `<SaveTemplateModal>`
- [ ] Summary section: subtotal, overhead_amount, markup_amount, grand_total
- [ ] "Save Estimate" button → calls `createEstimate()` or `updateEstimate()`
- [ ] All inputs have 44px min touch targets
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.11

---

## Task 2.13: CostLineItemRow Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the individual cost line item row with editable costs.

**Files:**
- `components/estimates/CostLineItemRow.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ lineItem: EstimateLineItem, onChange: (updated: EstimateLineItem) => void }`
- [ ] Displays: description, quantity (read-only), unit (read-only)
- [ ] Editable inputs: material_cost, labor_cost, equipment_cost (number inputs)
- [ ] Computed display: unit_cost = material + labor + equipment
- [ ] Computed display: subtotal = quantity × unit_cost
- [ ] Formula text below row (small gray text)
- [ ] All inputs have 44px min touch targets
- [ ] Number input formatting: 2 decimal places
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.12

---

## Task 2.14: PricingTemplateModal Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/modal-patterns.md`

**Description:**
Create the modal for selecting and applying pricing templates.

**Files:**
- `components/estimates/PricingTemplateModal.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Uses `ResponsiveModal`
- [ ] Props: `{ isOpen, onClose, onApply: (templateId: string) => void }`
- [ ] Fetches templates via `getPricingTemplates()`
- [ ] Lists templates with: name, description, item count, created date
- [ ] Selectable template cards (44px min touch targets)
- [ ] "Apply" button (disabled until template selected)
- [ ] On apply: calls `applyPricingTemplate(templateId, estimateId)`, shows toast with matched count
- [ ] Loading state during fetch
- [ ] Empty state: "No templates saved yet"
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.13

---

## Task 2.15: SaveTemplateModal Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/modal-patterns.md`

**Description:**
Create the modal for saving current costs as a template.

**Files:**
- `components/estimates/SaveTemplateModal.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Uses `ResponsiveModal`
- [ ] Props: `{ isOpen, onClose, lineItems: EstimateLineItem[] }`
- [ ] Form fields: name (required), description (optional)
- [ ] On save: calls `createPricingTemplate({ name, description, items: [...] })`
- [ ] Converts line items to template items (strips estimate-specific data)
- [ ] Success toast: "Template saved: {name}"
- [ ] Validation: name required, 1-200 chars
- [ ] 44px min touch targets
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.14

---

## Task 2.16: EstimateSummary Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the estimate summary view with trade breakdown and totals.

**Files:**
- `components/estimates/EstimateSummary.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ estimate: EstimateWithLineItems }`
- [ ] Header: estimate name, status badge, created date, created by
- [ ] Source link: "From: {plan filename}" (tappable, navigates to review screen)
- [ ] Trade-grouped breakdown table:
  - Group line items by trade
  - Show subtotal per trade
  - Collapsible/expandable groups
- [ ] Totals section: subtotal, overhead (amount + %), markup (amount + %), grand total
- [ ] Action buttons (admin/PM only):
  - "Edit Costs" → navigates to costing view
  - "Approve" → calls `approveEstimate()`, shows confirmation dialog
  - "Create Materials" → calls `createMaterialsFromEstimate()`, toast with count
  - "Create Expense" → calls `createExpenseFromEstimate()`, toast with expense ID
- [ ] Read-only for foreman/field_worker
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.15

---

## Task 2.17: EstimateHistoryList Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/list-patterns.md`

**Description:**
Create the estimate version history list.

**Files:**
- `components/estimates/EstimateHistoryList.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ estimates: Estimate[] }`
- [ ] Displays all versions sorted by created_at DESC
- [ ] Each row: name, status badge, created by, created date, grand_total
- [ ] Current estimate highlighted
- [ ] Superseded estimates grayed out
- [ ] Tappable rows (44px min) → navigates to that estimate's summary
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.16

---

## Task 2.18: AiBudgetBanner Component

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create the budget warning/exceeded banner.

**Files:**
- `components/estimates/AiBudgetBanner.tsx`

**Acceptance Criteria:**
- [ ] `'use client'` directive
- [ ] Props: `{ aiUsage: { currentSpend: number, budget: number, percentUsed: number } }`
- [ ] Warning banner (yellow) if percentUsed >= 80% and < 100%:
  - Text: "AI budget is at {percent}%. ${remaining} remaining this month."
  - AlertTriangle icon from Lucide
- [ ] Exceeded banner (red) if percentUsed >= 100%:
  - Text: "Monthly AI budget exceeded. Manual takeoff only until {next month}."
  - XCircle icon from Lucide
- [ ] Hidden if percentUsed < 80%
- [ ] Dismissible with X button (stores in sessionStorage)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.17

---

## Task 2.19: EstimateStatusBadge and ConfidenceBadge Components

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create server component badges for status and confidence.

**Files:**
- `components/estimates/EstimateStatusBadge.tsx`
- `components/estimates/ConfidenceBadge.tsx`

**Acceptance Criteria:**
- [ ] `EstimateStatusBadge`:
  - Server component (no `'use client'`)
  - Props: `{ status: EstimateStatus }`
  - Badge colors: draft (gray), reviewed (blue), approved (green), superseded (gray + strikethrough)
  - Uses GenHub badge pattern
- [ ] `ConfidenceBadge`:
  - Server component
  - Props: `{ confidence: number }`
  - Colors: green (>= 0.8), yellow (0.5-0.79), red (< 0.5)
  - Text: "High" / "Medium" / "Low"
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.18

---

## Task 2.20: EmptyEstimatesState and EstimatesSkeleton Components

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/frontend/component-patterns.md`

**Description:**
Create empty state and loading skeleton components.

**Files:**
- `components/estimates/EmptyEstimatesState.tsx`
- `components/estimates/EstimatesSkeleton.tsx`

**Acceptance Criteria:**
- [ ] `EmptyEstimatesState`:
  - Server component
  - Props: `{ userRole: UserRole }`
  - Displays blueprint illustration (Lucide FileText icon, large)
  - Text: "No estimates yet. Upload a construction plan to get started."
  - "Upload Plan" button (visible only for admin/PM)
  - Center-aligned, friendly design
- [ ] `EstimatesSkeleton`:
  - Server component
  - Pulse animation on placeholder cards
  - Mimics layout of plan upload list
  - 3-4 skeleton cards
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.19

---

## Task 2.21: Mobile Responsiveness Testing

**Agent:** frontend-engineer
**Skills:**
- `vercel-react-best-practices`
- `.claude/skills/testing/mobile-testing.md`

**Description:**
Test all components at 375px viewport width and verify mobile-specific requirements.

**Files:**
- All components created in Part 2

**Acceptance Criteria:**
- [ ] Test on Chrome DevTools at 375px width
- [ ] Test on Safari iOS Simulator (iPhone SE)
- [ ] All touch targets >= 44px height and width
- [ ] Plan viewer pan/zoom works smoothly (60fps target)
- [ ] Stacked layout on TakeoffReviewScreen (plan top, list bottom)
- [ ] No horizontal scroll on any screen
- [ ] Modal overlays use full viewport height (`dvh`)
- [ ] Safe area insets applied: `pb-[env(safe-area-inset-bottom)]`
- [ ] All inputs keyboard-accessible (no overlapping keyboards)
- [ ] Dark mode tested (all text readable, proper contrast)
- [ ] Active states visible on all interactive elements
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.20

---

## Task 2.22: Integration Testing - Full User Flow

**Agent:** frontend-engineer
**Skills:**
- `.claude/skills/testing/integration-testing.md`
- `vercel-react-best-practices`

**Description:**
Test the complete user flow from upload to estimate creation.

**Files:**
- Manual testing checklist (document results in `.claude/tasks/features/ai-plan-estimator/test-results.md`)

**Acceptance Criteria:**
- [ ] Flow 1: Upload PDF → Processing → Ready
- [ ] Flow 2: Parse with AI → Polling → Complete
- [ ] Flow 3: Review takeoff → Accept/Reject/Edit → Proceed
- [ ] Flow 4: Apply costs → Template application → Save estimate
- [ ] Flow 5: View estimate → Approve → Create materials/expense
- [ ] Flow 6: Budget warning at 80% → Hard stop at 100%
- [ ] Error cases: file too large, unsupported MIME, PDF conversion fail, AI parse fail
- [ ] Role gates: foreman cannot upload, cannot approve
- [ ] Cache test: same page re-parsed uses cache
- [ ] All Server Actions return expected format
- [ ] No console errors during flow
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 2.21

---

## Task 2.23: Code Review - Part 2 Frontend Components

**Agent:** code-reviewer
**Skills:** `.claude/skills/workflow/code-review.md`

**Description:**
Review all Part 2 frontend code for correctness, performance, accessibility, and adherence to GenHub patterns.

**Files:**
- All files created in Tasks 2.1-2.22

**Acceptance Criteria:**
- [ ] All components follow GenHub patterns (ResponsiveModal, Lucide icons, 44px targets)
- [ ] No Supabase in 'use client' components
- [ ] All Server Actions called correctly with error handling
- [ ] Loading states present on all async operations
- [ ] Error states handled gracefully with user-friendly messages
- [ ] Mobile layout tested at 375px
- [ ] Plan viewer maintains 60fps on mobile (Chrome Performance profiler)
- [ ] All modals use ResponsiveModal (NEVER raw Dialog)
- [ ] All touch targets >= 44px
- [ ] Accessibility: ARIA labels, keyboard navigation, screen reader support
- [ ] Dark mode support (proper text contrast)
- [ ] No hardcoded colors (uses Tailwind theme)
- [ ] TypeScript build passes with zero errors
- [ ] ESLint passes with zero warnings
- [ ] No console.log in production code
- [ ] Integration tests documented in test-results.md

**Dependencies:** Task 2.22

---

## Summary

**Total Tasks:** 23
**Estimated Duration:** 2 weeks
**Output:**
- 18 React components (15 client, 3 server)
- Full estimates tab integration
- Complete user workflows (upload, parse, review, cost, summary)
- Mobile-responsive design
- Full code review and integration testing

**Feature Complete:** After Part 2, the AI Plan Estimator feature is ready for production deployment.
