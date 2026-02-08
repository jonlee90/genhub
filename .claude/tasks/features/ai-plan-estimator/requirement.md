# AI-Assisted Plan Estimating - Requirements

## Problem Statement

General contractors spend 4-8 hours per plan set performing manual quantity takeoff -- measuring rooms, counting fixtures, calculating areas, and transcribing dimensions from construction drawings into spreadsheets. This process is slow, error-prone (typical 5-15% measurement variance between estimators), and expensive (senior estimator time at $75-150/hr). The result is either delayed bids (lost opportunities) or inaccurate estimates (lost profit).

AI vision models can now extract labeled dimensions, room names, and construction notes from plan images with high accuracy on CAD-generated drawings. However, contractors will not trust AI-generated quantities for bidding without a human review step. The feature must make AI the accelerator, not the decision-maker -- extracting data for human verification, not replacing professional judgment.

This feature enables contractors to upload construction plans (PDF/JPG/PNG), have AI extract quantities and dimensions from each page, review and correct the AI output, apply unit costs, and generate a project estimate -- reducing takeoff time from hours to minutes while maintaining contractor control over every number.

---

## Personas

| Persona | Role in Feature | Primary Goal |
|---------|----------------|--------------|
| **GC** (General Contractor) | Primary | Upload plans, review AI takeoff, approve estimates for bidding |
| **PM** (Project Manager) | Primary | Manage estimates per project, apply pricing templates, track costs |
| **Foreman** | Secondary | View estimates and takeoff data for field reference (read-only) |
| **Worker** (Field Worker) | Secondary | View approved estimates for material quantities (read-only) |
| **Sub** (Subcontractor) | Out of scope v1 | No access to estimates in v1 |
| **Client** | Out of scope v1 | No access to estimates in v1 |

---

## User Stories

### US-1: Plan Upload and PDF Processing

**As a** GC or PM,
**I want** to upload construction plan files (PDF, JPG, PNG) to a project,
**So that** the system can process them for AI-assisted quantity takeoff.

**Acceptance Criteria (EARS):**

- WHEN user uploads a PDF file THE SYSTEM SHALL convert each page to a PNG image at approximately 300 DPI using pdfjs-dist and sharp
- WHEN user uploads a JPG or PNG file THE SYSTEM SHALL store it directly as a single plan page without conversion
- WHEN user selects a file larger than 50MB THE SYSTEM SHALL reject the upload and display "File exceeds 50MB limit"
- WHEN user selects a file with an unsupported MIME type THE SYSTEM SHALL reject the upload and display "Only PDF, JPG, and PNG files are accepted"
- WHEN file upload begins THE SYSTEM SHALL display a progress indicator showing upload percentage
- WHEN PDF page conversion begins THE SYSTEM SHALL set the plan status to "processing" and show per-page conversion progress
- WHEN all pages are successfully converted THE SYSTEM SHALL set the plan status to "ready"
- IF PDF conversion fails on any page THEN THE SYSTEM SHALL set the plan status to "failed" and display a user-friendly error message with a retry option
- WHEN user uploads a plan THE SYSTEM SHALL store the original file in Supabase Storage bucket `plan-files` at path `{companyId}/projects/{projectId}/plans/{timestamp}_{sanitizedFilename}`
- WHEN PDF pages are converted THE SYSTEM SHALL store each page image in Supabase Storage bucket `plan-pages` at path `{companyId}/projects/{projectId}/pages/{planId}/page_{pageNumber}.png`
- WHEN user uploads a plan THE SYSTEM SHALL require a project association and optionally allow a phase association
- WHEN user uploads multiple plans to the same project THE SYSTEM SHALL list all plans with their individual processing statuses
- WHEN a plan upload completes THE SYSTEM SHALL log an audit trail entry with action "plan_uploaded", the user ID, and file metadata
- IF user role is foreman or field_worker THEN THE SYSTEM SHALL NOT display the upload button and SHALL return a 403 error if upload is attempted via API
- WHEN file is uploaded THE SYSTEM SHALL validate the MIME type server-side (not just file extension) before accepting the file

**Priority:** Critical

---

### US-2: AI Plan Parsing

**As a** GC or PM,
**I want** each plan page to be automatically parsed by AI to extract rooms, dimensions, and construction notes,
**So that** I get a structured takeoff dataset without manually reading every drawing.

**Acceptance Criteria (EARS):**

- WHEN a plan page reaches "ready" status THE SYSTEM SHALL allow the user to trigger AI parsing for that page
- WHEN AI parsing is triggered THE SYSTEM SHALL send the page image to OpenAI GPT-4o vision API (NOT Claude/Anthropic)
- WHEN AI parsing is triggered THE SYSTEM SHALL first compute the SHA-256 hash of the page image and check for cached results; IF a cache hit exists THEN THE SYSTEM SHALL return the cached result without making an API call
- WHEN the AI processes a page THE SYSTEM SHALL extract ONLY items explicitly visible or labeled on the plan: room/area names, numerically labeled dimensions, derivable square footage, clearly delineated wall segments with measurements, construction notes/callouts/material specifications, and scale indicators
- WHEN the AI returns results THE SYSTEM SHALL include for each extracted item: a confidence score (0.0-1.0), a source_region ({x, y, width, height} as percentage of page dimensions), and an extraction_method ("labeled", "calculated", or "inferred")
- WHEN an extracted item has confidence below 0.7 THE SYSTEM SHALL flag it as needs_review = true
- IF a page contains no extractable construction data (e.g., cover sheet, legend, schedule) THEN THE SYSTEM SHALL return an empty items array with page_type set to "cover", "legend", "schedule", or "unknown"
- THE SYSTEM SHALL NOT fabricate dimensions not visibly labeled on the plan
- THE SYSTEM SHALL NOT assume room purposes from ambiguous or missing labels
- WHEN AI parsing begins THE SYSTEM SHALL set the page parse status to "parsing" and poll for completion every 2-3 seconds via setInterval
- WHEN AI parsing completes successfully THE SYSTEM SHALL store the raw JSON result in the plan_parse_results table as JSONB
- IF AI parsing fails THE SYSTEM SHALL retry once; IF the retry also fails THEN THE SYSTEM SHALL mark the page as "parse_failed" and allow the user to proceed with manual-only takeoff for that page
- WHEN AI parsing is triggered THE SYSTEM SHALL enforce a maximum of 1 AI API call per page (plus 1 retry on failure)
- WHEN an AI API call completes THE SYSTEM SHALL log the model name, input token count, output token count, and estimated cost to the ai_usage_log table

**Priority:** Critical

---

### US-3: Takeoff Normalization

**As a** GC or PM,
**I want** raw AI output to be converted into standardized takeoff line items with consistent units,
**So that** I can review a clean, organized dataset rather than raw AI JSON.

**Acceptance Criteria (EARS):**

- WHEN AI parsing completes for a page THE SYSTEM SHALL automatically normalize the raw output into standardized takeoff line items
- WHEN normalizing area measurements THE SYSTEM SHALL convert all values to square feet (sqft)
- WHEN normalizing length measurements THE SYSTEM SHALL convert all values to linear feet (lf)
- WHEN the same room label appears on multiple pages THE SYSTEM SHALL merge duplicates by label similarity and flag the merge for user confirmation
- WHEN normalizing takeoff items THE SYSTEM SHALL apply configurable waste factors per trade: Drywall +10%, Flooring +15%, Paint +10%, Tile +15%, Lumber/Framing +10%, Concrete +5%, Insulation +10%
- WHEN waste factors are applied THE SYSTEM SHALL store the waste percentage and the pre-waste quantity alongside the adjusted quantity so the calculation is transparent
- WHEN a normalized item has confidence below 0.7 THE SYSTEM SHALL flag it for mandatory user review
- WHEN takeoff items are created THE SYSTEM SHALL store them in a separate table from raw AI output, preserving provenance: page_number, ai_item_id, and a record of any user edits
- WHEN a takeoff item is created from AI output THE SYSTEM SHALL set extraction_method to the value from the AI result ("labeled", "calculated", or "inferred")
- WHEN a user manually adds a takeoff item THE SYSTEM SHALL set extraction_method to "manual"
- WHEN normalization completes THE SYSTEM SHALL NOT modify or overwrite the raw AI parse results stored in plan_parse_results

**Priority:** Critical

---

### US-4: Human Review and Validation

**As a** GC or PM,
**I want** to review every AI-extracted takeoff item against the original plan image before generating an estimate,
**So that** I can correct errors, reject false extractions, and add missing items to ensure accuracy.

**Acceptance Criteria (EARS):**

- THE SYSTEM SHALL require human review of all takeoff items before allowing estimate generation (mandatory gate)
- WHEN viewing the review screen on mobile (viewport width < 768px) THE SYSTEM SHALL display a stacked layout with the plan viewer on top and the takeoff item list below
- WHEN viewing the review screen on desktop (viewport width >= 768px) THE SYSTEM SHALL display a side-by-side layout with the plan viewer on the left and the takeoff list on the right
- WHEN user taps a takeoff item in the list THE SYSTEM SHALL highlight the corresponding source_region on the plan image with a colored overlay
- WHEN user interacts with the plan viewer THE SYSTEM SHALL support pinch-to-zoom, pan, and swipe between pages at 60fps
- WHEN user taps a quantity or dimension value on a takeoff item THE SYSTEM SHALL open an inline editor with 44px minimum touch targets
- WHEN user reviews a takeoff item THE SYSTEM SHALL provide three actions: Accept (confirm AI value), Reject (remove item from takeoff), and Edit (modify values)
- WHEN user edits a takeoff item THE SYSTEM SHALL record the original AI value, the new user value, and the user ID in the edit history
- WHEN user taps "Add Item" THE SYSTEM SHALL allow manual creation of a new takeoff item with extraction_method set to "manual"
- WHEN displaying takeoff items THE SYSTEM SHALL show confidence badges: Green for confidence >= 0.8 (high), Yellow for 0.5-0.79 (medium, review recommended), Red for < 0.5 (low, review required)
- WHILE the review is in progress THE SYSTEM SHALL display a progress indicator showing "{reviewed count} of {total count} items reviewed"
- WHEN all items have been accepted, rejected, or edited THE SYSTEM SHALL enable the "Proceed to Estimate" button
- IF any items remain unreviewed THEN THE SYSTEM SHALL disable the "Proceed to Estimate" button and display "Review all items to continue"
- WHEN user opens an item detail editor THE SYSTEM SHALL use ResponsiveModal (never raw Dialog)
- WHEN displaying interactive elements THE SYSTEM SHALL ensure all touch targets are at least 44px in height and width

**Priority:** Critical

---

### US-5: Cost and Labor Engine

**As a** GC or PM,
**I want** to apply unit costs (material, labor, equipment) to each takeoff line item and calculate a total estimate with overhead and profit markup,
**So that** I can generate a complete project estimate for bidding or budgeting.

**Acceptance Criteria (EARS):**

- WHEN user proceeds from review to costing THE SYSTEM SHALL display each takeoff item as a line item with: quantity, unit of measure, unit cost, and subtotal (quantity x unit_cost)
- WHEN displaying line item costs THE SYSTEM SHALL break down each unit cost into three components: material cost, labor cost, and equipment cost
- WHEN user views the estimate summary THE SYSTEM SHALL display: line item subtotal, overhead amount (subtotal x overhead %), markup amount ((subtotal + overhead) x markup %), and grand total
- WHEN a new estimate is created THE SYSTEM SHALL default overhead to 10% and profit markup to 15%, both editable by the user
- WHEN user changes overhead or markup percentage THE SYSTEM SHALL recalculate all totals in real time (within 100ms)
- WHEN user taps "Apply Template" THE SYSTEM SHALL display a list of saved pricing templates for selection
- WHEN user selects a pricing template THE SYSTEM SHALL populate unit costs for all matching line items (matched by trade/category and item type)
- WHEN user taps "Save as Template" THE SYSTEM SHALL save the current set of unit costs as a named pricing template for reuse across projects
- WHEN displaying cost calculations THE SYSTEM SHALL show the formula per line item (e.g., "125 sqft x $3.50/sqft = $437.50") so all math is transparent
- WHEN a takeoff item has a matching entry in the existing materials table THE SYSTEM SHALL suggest linking it and pre-filling the unit cost from the material record

**Priority:** Critical

---

### US-6: Estimate Output and Integration

**As a** GC or PM,
**I want** to save a complete estimate linked to my project with full line-item breakdown and integrate it with existing material and expense tracking,
**So that** the estimate becomes actionable data for procurement and financial management.

**Acceptance Criteria (EARS):**

- WHEN user saves an estimate THE SYSTEM SHALL store it with full line-item breakdown linked to the project (required) and optionally a phase
- WHEN user views a saved estimate THE SYSTEM SHALL display a summary with totals grouped by trade/category and a grand total
- WHEN user taps "Create Materials" on an estimate THE SYSTEM SHALL create material records in the existing materials table for each line item, using the appropriate MaterialCategory enum value
- WHEN user taps "Create Expense" on an estimate THE SYSTEM SHALL create an expense record in the existing expenses table with line items, using the appropriate ExpenseCategory enum value
- WHEN an estimate is first saved THE SYSTEM SHALL set its status to "draft"
- WHEN all takeoff items are reviewed and costs applied THE SYSTEM SHALL allow the user to change status to "reviewed"
- WHEN a user with admin or project_manager role approves an estimate THE SYSTEM SHALL change its status to "approved"
- IF user role is foreman or field_worker THEN THE SYSTEM SHALL NOT allow estimate approval (display approval button as disabled with tooltip "Only admins and project managers can approve")
- WHEN a new plan is uploaded for a project that already has an estimate THE SYSTEM SHALL mark the previous estimate as "superseded" (never delete it) and create a new estimate as "draft"
- WHEN user views estimate history THE SYSTEM SHALL display all versions (draft, reviewed, approved, superseded) with timestamps and the user who created each version
- WHEN an estimate is saved or updated THE SYSTEM SHALL log an audit trail entry with action type, user ID, and timestamp
- WHEN user views an estimate THE SYSTEM SHALL display the source plan file name and link to the review screen for traceability

**Priority:** Critical

---

### US-7: AI Budget Management

**As a** GC (company admin),
**I want** to set and monitor a monthly AI usage budget for my company,
**So that** AI parsing costs are controlled and predictable.

**Acceptance Criteria (EARS):**

- WHEN a company is set up for AI estimating THE SYSTEM SHALL default the monthly AI budget to $50.00 (configurable by admin)
- WHILE monthly AI spend is below 80% of the budget THE SYSTEM SHALL allow AI parsing without any warning
- WHEN monthly AI spend reaches 80% of the budget THE SYSTEM SHALL display a warning banner: "AI budget is at {percent}%. {remaining} remaining this month."
- WHEN monthly AI spend reaches 100% of the budget THE SYSTEM SHALL block all new AI parsing requests (hard stop) and display: "Monthly AI budget exceeded. Manual takeoff only until {next month}."
- WHEN AI parsing is blocked due to budget THE SYSTEM SHALL still allow manual takeoff entry, cost application, and estimate generation
- WHEN admin navigates to AI settings THE SYSTEM SHALL display: current month spend, budget limit, number of pages parsed, average cost per page, and a usage trend chart
- WHEN a new calendar month begins THE SYSTEM SHALL reset the monthly spend counter to $0.00

**Priority:** High

---

## Non-Functional Requirements

### NFR-1: Performance

| Metric | Target | Measurement Point |
|--------|--------|-------------------|
| Plan upload + PDF processing | < 30 seconds | 10-page PDF, 50MB max |
| AI parsing per page | < 15 seconds | Timeout at 30s, then mark failed |
| Takeoff list rendering | < 100ms | 200 line items in list |
| Plan viewer pan/zoom | 60fps | Mobile Safari and Chrome |
| Estimate recalculation | < 100ms | On overhead/markup % change |
| Polling interval | 2-3 seconds | setInterval for parse status |

### NFR-2: Cost Control

| Control | Implementation |
|---------|---------------|
| Per-parse cost tracking | Log model, token_count_in, token_count_out, estimated_cost per API call |
| Monthly budget | Company-level, configurable, default $50/month |
| 80% alert | Warning banner on estimate pages |
| 100% hard stop | Block new AI parsing API calls at server level; return error to client |
| Page-level caching | SHA-256 hash of page image as cache key; skip re-parsing identical images |
| Max retries | 1 retry per page on failure, then mark parse_failed |
| Estimated cost per page | ~$0.01 (GPT-4o vision, ~1000 input tokens image + prompt, ~500 output tokens) |

### NFR-3: Security and Authorization

| Requirement | Implementation |
|-------------|---------------|
| Row-Level Security | All new tables have company_id column with RLS policies enforcing company isolation |
| Upload authorization | admin and project_manager roles only |
| View authorization | All project team members (admin, project_manager, foreman, field_worker) |
| Estimate approval | admin and project_manager roles only |
| Storage access | Private Supabase Storage buckets with signed URLs (1-hour expiry) |
| Filename sanitization | `filename.replace(/[^a-zA-Z0-9.-]/g, "_")` on all uploads |
| MIME type validation | Server-side validation of file content type (not just extension); accept only application/pdf, image/jpeg, image/png |
| API key protection | OpenAI API key stored as server-side environment variable, never exposed to client |

### NFR-4: Error Handling

| Scenario | Behavior |
|----------|----------|
| Corrupt or unreadable PDF | Detect via pdfjs-dist error, return user-friendly message "This PDF could not be processed. Please check the file and try again.", do NOT retry |
| AI parsing failure | Retry once automatically; if retry fails, mark page as "parse_failed" with option to proceed with manual-only takeoff |
| Storage upload failure | Clean up any partial uploads, display retry button to user |
| Network interruption during upload | Display "Upload interrupted. Please check your connection and try again." with retry button (resume upload not required in v1) |
| Zod validation error | Return first issue message to client for display |
| File too large | Reject before upload with "File exceeds 50MB limit" |
| Unsupported file type | Reject before upload with "Only PDF, JPG, and PNG files are accepted" |
| Budget exceeded | Block AI parsing with clear message, allow manual entry |

### NFR-5: Observability

| Category | What to Track |
|----------|---------------|
| Upload events | File name, size, type, user, project, timestamp, success/failure |
| Parse events | Page ID, start time, end time, success/failure, token counts, cost |
| Parse quality | Success rate, average confidence per page, items extracted per page |
| Cost tracking | Per-company monthly spend, average cost per page, budget utilization % |
| Estimate events | Create, update, status change, approval, with user and timestamp |
| Audit trail | All estimate edits tracked: user_id, timestamp, field changed, old value, new value |
| File audit | Use existing file_audit_log pattern for plan file operations (upload, delete, access) |

---

## v1 Scope Boundaries

### In Scope

- Upload PDF (multi-page), JPG, PNG plan files to a project
- PDF-to-image conversion at ~300 DPI using pdfjs-dist + sharp (server-side)
- AI parsing via OpenAI GPT-4o vision API (per-page, with structured JSON output)
- Takeoff normalization with unit standardization, waste factors, and duplicate merging
- Human review screen with plan viewer and inline takeoff editing (mandatory gate)
- Cost and labor engine with material/labor/equipment breakdown, overhead, and markup
- Estimate output with full line-item breakdown, status lifecycle, and versioning
- Pricing templates (save/load named cost preset sets)
- Integration with existing materials and expenses tables
- AI usage tracking and monthly budget enforcement
- Polling-based async status updates (setInterval 2-3s)

### Out of Scope (Future Versions)

| Feature | Target Version | Rationale |
|---------|---------------|-----------|
| DWG/DXF/BIM file support | v2 | Requires specialized parsing libraries; PDF/image covers 80%+ of contractor plan formats |
| PDF export of estimates | v2 | Browser print/save-as-PDF sufficient for v1 |
| AI-powered cost suggestions | v2 | Requires historical cost data accumulation from v1 usage |
| Multi-estimator collaboration | v2 | Single-user estimate editing sufficient for v1 |
| Offline estimate editing | v2 | Requires complex sync logic; estimates are office/connectivity work |
| Scale auto-detection from unmarked drawings | v2 | Requires ML model training; v1 only reads explicitly labeled dimensions |
| Supplier API integration for live pricing | v2 | Manual pricing + templates sufficient for v1 |
| Change order tracking from plan revisions | v3 | Requires diff engine between plan versions |
| Subcontractor/client access to estimates | v2 | Internal use only for v1 |

---

## Technical Constraints

| Constraint | Specification | Rationale |
|------------|---------------|-----------|
| AI Provider | OpenAI GPT-4o vision API | Faster, cheaper (~$0.01/page), proven for document parsing |
| PDF Processing | pdfjs-dist + sharp | sharp already installed in project; pdfjs-dist is well-maintained for server-side PDF rendering |
| Async Notification | Polling via setInterval (2-3s) | Simple implementation; no extra Supabase Realtime infra needed for v1 |
| Multi-tenancy | company_id column + RLS on every new table | Existing GenHub pattern for company isolation |
| Data Access | Server Actions via getUserContext() for all DB operations | Existing GenHub pattern; no Supabase in 'use client' components |
| File Uploads | API Routes with formData for file upload endpoints | Existing GenHub pattern from project-files upload |
| Modals | ResponsiveModal only (never raw Dialog) | GenHub blocking rule |
| Icons | Lucide icons only | GenHub blocking rule |
| Touch Targets | 44px minimum height and width on all interactive elements | GenHub blocking rule |
| Mobile-First | Designed for 375px viewport width, using dvh and safe-area-inset-bottom | GenHub design standard |
| Validation | Zod schemas for all server-side input validation | Existing GenHub pattern |
| Auth Return Pattern | `{ success: true, data }` or `{ success: false, error: "message" }` | Existing GenHub Server Action pattern |

---

## Integration Points with Existing System

### Projects (existing)

- Plans are associated with a project (required FK to projects table)
- Plans can optionally be associated with a project phase (FK to project_phases)
- Project access verified via `verifyProjectAccess(supabase, projectId, companyId)`
- Estimates page accessible at route: `/app/projects/[id]/estimates/`

### Materials (existing)

- Estimate line items can create material records in the materials table
- MaterialCategory enum used for categorization: lumber, concrete, electrical, plumbing, hvac, roofing, flooring, paint, hardware, tools, fixtures, insulation, drywall, doors_windows, landscaping, other
- material_assignments table links materials to projects with quantity and unit_cost

### Expenses (existing)

- Estimates can generate expense records in the expenses table
- ExpenseCategory enum used: materials, labor, equipment, permits, transportation, meals, lodging, other
- expense_line_items table stores individual cost entries within an expense

### Project Files (existing)

- Follow existing file_audit_log pattern for upload/access auditing
- Follow existing Supabase Storage upload pattern (formData, sanitize filename, store, insert DB record, revalidatePath)

### Trade Types (existing)

- TradeType enum used for categorizing takeoff items and estimate lines: general, electrical, plumbing, hvac, carpentry, masonry, roofing, flooring, painting, drywall, concrete, landscaping, demolition, steel_work, glass_glazing, fire_protection, insulation, framing, other

### User Roles (existing)

- UserRole enum: admin, project_manager, foreman, field_worker, subcontractor, client
- Authorization matrix defined per user story

---

## Authorization Matrix

| Action | admin | project_manager | foreman | field_worker | subcontractor | client |
|--------|-------|----------------|---------|-------------|---------------|--------|
| Upload plan | Yes | Yes | No | No | No | No |
| Trigger AI parsing | Yes | Yes | No | No | No | No |
| View plans and takeoff | Yes | Yes | Yes | Yes | No | No |
| Review/edit takeoff items | Yes | Yes | No | No | No | No |
| Create/edit estimate | Yes | Yes | No | No | No | No |
| Approve estimate | Yes | Yes | No | No | No | No |
| Manage pricing templates | Yes | Yes | No | No | No | No |
| Configure AI budget | Yes | No | No | No | No | No |
| View AI usage stats | Yes | Yes | No | No | No | No |

---

## AI Parsing Output Schema Reference

The following JSON schema defines the expected output from GPT-4o for each parsed page. This schema is referenced by FR-2 and FR-3.

```json
{
  "page_number": 1,
  "page_type": "floor_plan | elevation | section | detail | schedule | cover | legend | unknown",
  "scale": { "ratio": "1/4\" = 1'", "pixels_per_foot": 24.5 } | null,
  "items": [
    {
      "id": "generated-uuid",
      "type": "room | wall | opening | fixture | note | dimension",
      "label": "Kitchen",
      "dimensions": {
        "length_ft": 12.5,
        "width_ft": 10.0,
        "height_ft": null,
        "area_sqft": 125.0,
        "linear_ft": null
      },
      "confidence": 0.85,
      "source_region": { "x": 0.15, "y": 0.22, "width": 0.35, "height": 0.28 },
      "extraction_method": "labeled",
      "needs_review": false,
      "notes": "Dimensions clearly labeled on plan"
    }
  ],
  "raw_notes": ["General notes found on this page"],
  "warnings": ["Scale not found - dimensions may be unreliable"]
}
```

---

## Waste Factor Configuration Reference

Default waste factors by trade (configurable per company, stored in config table, not hardcoded):

| Trade | Default Waste Factor | Rationale |
|-------|---------------------|-----------|
| Drywall | +10% | Standard cutting waste |
| Flooring | +15% | Pattern matching, cuts at walls |
| Paint | +10% | Coverage variance, touch-ups |
| Tile | +15% | Cuts, breakage, pattern waste |
| Lumber/Framing | +10% | Cuts, defects, standard waste |
| Concrete | +5% | Over-pour allowance |
| Insulation | +10% | Cutting, fitting waste |

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| OpenAI API access (GPT-4o with vision) | External service | Requires API key provisioning |
| pdfjs-dist npm package | New dependency | Not yet installed |
| sharp npm package | Existing dependency | Already installed in project |
| Supabase Storage buckets (plan-files, plan-pages) | Infrastructure | Must be created |
| Existing projects table and verifyProjectAccess | Existing code | Available |
| Existing materials and expenses tables | Existing code | Available |
| Existing file_audit_log pattern | Existing code | Available |

---

## Success Metrics

- [ ] Plan upload completes within 30 seconds for a 10-page, 50MB PDF
- [ ] AI parsing completes within 15 seconds per page
- [ ] AI parsing achieves > 80% average confidence on CAD-generated plans with labeled dimensions
- [ ] Human review + cost application takes < 30 minutes for a 10-page residential plan (vs 4-8 hours manual)
- [ ] All 7 user stories pass acceptance criteria
- [ ] Monthly AI cost stays within configurable budget with hard stop enforcement
- [ ] Zero instances of AI-fabricated dimensions in production (strict extraction rules enforced)
- [ ] Takeoff list renders within 100ms for 200 line items
- [ ] Plan viewer maintains 60fps pan/zoom on mobile
- [ ] All new tables have company_id with RLS policies
- [ ] Build passes with no TypeScript errors
- [ ] Mobile layout works correctly at 375px viewport width

---

## Glossary

| Term | Definition |
|------|-----------|
| **Takeoff** | The process of measuring and listing all quantities of materials, labor, and equipment needed for a construction project from the plans |
| **Plan** | A construction drawing (floor plan, elevation, section, detail) showing dimensions, room layouts, and specifications |
| **Estimate** | A costed document listing all takeoff items with unit prices, overhead, and profit markup |
| **Pricing Template** | A reusable, named set of unit costs (e.g., "Residential Standard 2025") that can be applied across multiple estimates |
| **Waste Factor** | A percentage added to raw quantities to account for cutting waste, breakage, and installation losses |
| **Confidence Score** | A 0.0-1.0 value indicating how certain the AI is about an extracted item |
| **Source Region** | The x/y/width/height coordinates (as percentages) identifying where on the plan image an item was extracted from |
| **CSI MasterFormat** | Construction Specifications Institute standard for organizing construction information (referenced for future trade categorization) |

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes -- approve to proceed to design phase
