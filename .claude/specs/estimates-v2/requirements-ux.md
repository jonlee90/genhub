# Estimates Module V3 - Competitive UI/UX Requirements

**Project:** GenHub PWA - Estimates Module Redesign
**Date:** 2026-02-14 | **Version:** 3.0 | **Status:** Draft
**Scope:** UI/UX redesign informed by competitive analysis of 9 competitors, aligned with design.md v2.4 (vector extraction engine + 10-layer validation framework)

---

## 1. Competitive Analysis Summary

### Togal.AI - Best for AI-First Experience
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| "The Togal Button" - one-click AI takeoff | Single oversized CTA (56px, full-width on mobile) triggers full analysis with zero configuration | Simplify our parse trigger to a single prominent button |
| Togal.CHAT - conversational plan queries | Bottom-sheet pattern on mobile (40%/85% snap points) with suggested prompt chips scrollable horizontally above input | Add AI chat sidebar for plan Q&A (P2) |
| Auto-naming for uploaded documents | AI renames files based on detected content (floor plan, elevation, etc.) | Auto-classify page types, auto-name uploads |
| Confidence-hiding strategy | Does NOT show per-item confidence to end users; uses internal QA and presents results as "verified" | Consider simplified "Verified / Needs Review" default with expandable detail |
| Real-time multi-user collaboration | Color-coded cursors with name tags; user-specific layers | Real-time presence indicators (P2) |
| Drawing set comparison | Side-by-side diff with transparent toggle between revision sets; changes highlighted in red/green overlays | Plan version comparison view (P2) |
| AI-powered pattern/image/text search | Find and count items across all pages instantly | Cross-page search with AI-detected elements |

### STACK - Best for Structured Estimating Workflow
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Progressive 5-step stepper | Clear workflow: Plans > Takeoff > Assemblies > Proposal > Export with completion indicators; clickable backward, grayed forward | Adopt for REQ-UX-001 wizard stepper |
| Assemblies system | "Interior Wall" auto-generates studs, plates, drywall (both sides), tape, mud, primer, paint; searchable modal with categories and recent items | Assemblies system for common construction elements |
| Resizable divider pattern | Draggable split-panel divider on desktop; user adjusts plan-to-items ratio; defaults to 50/50 on tablet | Resizable split-panel on desktop/tablet |
| Regional pricing database | Prices auto-adjust by project ZIP code; badge shows "Pricing: Los Angeles, CA" | Integrate with materials catalog + regional pricing |
| Plan version comparison | Compare old vs new drawing sets | Revision tracking with change highlighting |
| Mobile card layout | On tablet, table collapses to card-based layout with swipe-to-reveal actions | Card-based item display on mobile |
| Full proposal generation | From takeoff to formatted bid proposal | PDF export with company branding |
| Integration ecosystem | QuickBooks, Procore, etc. | Export to accounting, PM tools |

### Attentive.ai - Best for Accuracy and Trust
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| QA team review of AI outputs | Human verification layer before delivery; "Verified by Attentive QA" badge | Confidence-based mandatory review gates (L10 approval gate) |
| 98% accuracy claims on floor plans | "AI Accuracy: 98.2%" displayed in takeoff results header | Show overall confidence prominently; flag low-confidence items |
| Color-coded plan overlays | Detected elements overlaid with trade-specific colors: blue=walls, red=electrical, green=plumbing, amber=HVAC | Plan overlay layers toggled by trade (REQ-UX-021) |
| Bid-ready outputs | Formatted PDF for immediate proposal use | Export-ready estimate formatting |
| Multi-trade coverage | 20+ trades in single takeoff; results organized by CSI division with collapsible sections | Expand trade mappings from 21 to 35+ |
| 2X bid turnaround reduction | Speed as primary value prop | Measure and display time savings |

### Procore Estimating - Best for End-to-End Integration
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Estimate-to-budget pipeline | One-click conversion from approved estimate to project budget | One-click estimate-to-budget conversion |
| Resizable panel divider | Draggable divider between plan viewer and item panel; adjustable split ratio | Desktop split-panel with drag-to-resize |
| Embedded cost catalogs | RSMeans integration; "Cost DB" panel slides in from right, searchable by description or CSI code | Materials catalog integration (already planned) |
| All-in-one workflow | Estimates live within project dashboard, not separate module | Keep estimates inside project context |
| Native app limitations | Mobile app is view-only for estimates; full editing requires desktop web | GenHub advantage: full editing on mobile PWA |
| Automated measurement types | Area/linear/count takeoff tools in plan viewer | Add measurement tools to PlanViewer (P2) |
| BIM/3D model takeoff | 3D quantity extraction alongside 2D | Future: 3D model support (out of scope v3) |

### Beam AI - Best Mobile-Friendly AI
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Camera-first workflow | Primary CTA on mobile is large camera button, not file upload; immediate AI processing after capture | Camera-first mobile experience (REQ-UX-003) |
| Progressive result loading | Takeoff results appear card-by-card as AI processes, not all-at-once; real-time counter "12 items found..." | Progressive result loading (REQ-UX-023) |
| Card-based results | Scrollable cards with: item name, quantity, unit, confidence dot (green/amber/red), expand arrow | Card-based item display on mobile |
| Simplified mobile costing | Single "Total Cost" field per item on mobile; detailed breakdown on expand | Simplified mobile cost entry |
| Share via SMS/link | Quick sharing generates mobile-friendly link or SMS summary; no PDF needed for field estimates | Quick share link/SMS for field estimates |

### PlanSwift - Best for Plan Interaction
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| On-plan measurement tools | Area (polygon), Linear (polyline), Count (point markers); distinct cursor and color per tool; auto-calculate from calibrated scale | On-plan measurement tools (P2, REQ-UX-015) |
| Scale calibration wizard | 3-step: (1) draw line on known dimension, (2) enter real length, (3) system applies scale; visual overlay shows result | Scale calibration fallback for vector engine |
| Condition-based takeoff | Items tagged with construction status (new/existing/demo); visual treatment: solid=new, dashed=existing, red=demolition | Construction status visual treatment (REQ-UX-022) |
| Layer system | Plan layers toggled on/off; custom layers per trade; distinct color scheme per layer | Trade-based layer toggling on plan viewer |

### Bluebeam Revu - Best for Document Markup
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Hyperlinked cross-references | Tapping a door mark on floor plan jumps to door schedule; bi-directional linking between plan sheets | Cross-reference linking in AI chat and plan viewer |
| Count tool with visual markers | Each counted item gets numbered marker on plan; count auto-updates as markers added/removed | Visual markers for counted items on plan |
| PDF markup with stamps | Pre-built stamp libraries for common construction symbols | Future: custom stamps for plan markup |
| Studio Sessions | Real-time collaboration with user-specific layers | Real-time collaboration (P2) |

### ConEst - Best for Trade-Specific Workflows
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Trade-specific estimation flows | Different workflows per trade; electrical has panel schedules, circuit counts, wire pull calculations | Trade-specific review screens (future) |
| Database-driven pricing | Extensive material database with current pricing; items selected from catalog | Materials catalog integration |
| What-if analysis | Multiple scenarios (standard vs premium fixtures); side-by-side cost comparison | What-if analysis for bid scenarios (P2) |

### Buildxact - Best for Small Builders
| Strength | Pattern | GenHub Opportunity |
|----------|---------|-------------------|
| Template-first approach | Start from project template (e.g., "Single Story Residential"), adjust quantities; faster than blank slate | Template-based estimates (REQ-UX-013, Flow 4) |
| Supplier price integration | Direct integration with local suppliers; prices update automatically | Supplier pricing integration (future) |
| Simple 3-step mobile wizard | Minimal UI, large buttons, focused "quick estimate" mode | Simplified mobile wizard mode |
| Client-facing proposals | Auto-generated proposals with company branding; email directly from app | Branded proposal export (REQ-UX-011) |

### Key Patterns (2026)

1. **Bottom-sheet plan viewer on mobile** - Plan slides up as a bottom sheet (40%/85%/0% snap points) instead of split-panel; items fill the screen by default; tap item to auto-open plan to region
2. **Confidence-grouped bulk review** - "Accept All High Confidence" one-tap for items >85%; swipe cards only for medium/low confidence items; reduces review from N items to ~8
3. **Progressive result loading** - AI results appear card-by-card as processing completes, not all-at-once; real-time counter and confidence scores visible as items arrive
4. **Camera-first mobile workflow** - Camera button is the primary CTA on mobile, not file upload; immediate processing after capture
5. **Trade-colored plan overlays** - Detected elements overlaid with distinct colors per trade; toggle layers on/off
6. **Construction status visual treatment** - Solid=new, dashed=existing, red strikethrough=demolition on plan overlays
7. **Progressive workflow stepper** - Clear 5-step indicators with clickable back-navigation and forward-skip prevention
8. **Real-time totals** - Running cost totals always visible in sticky bar; updates within 100ms of any edit
9. **Assemblies system** - Pre-built grouped items that auto-expand; strongest workflow differentiator after AI parsing
10. **Quick share** - SMS/link sharing for field estimates; PDF generation reserved for formal proposals

---

## 2. User Personas

### Primary: General Contractor (GC) / Project Manager
- **Context:** Managing 3-10 active projects, needs quick estimates for bidding
- **Goals:** Win more bids, reduce estimation time from days to hours
- **Pain points:** Manual takeoff is slow, pricing is outdated, hard to compare revisions
- **Device:** iPhone 15 Pro / iPad Pro in the field, MacBook in office
- **Usage:** 60% mobile (field), 40% desktop (office)

### Secondary: Estimator / Preconstruction Lead
- **Context:** Full-time estimating role, works on 5-15 bids simultaneously
- **Goals:** Maximum accuracy, consistent methodology, reusable templates
- **Pain points:** Switching between tools, inconsistent unit costs, lost work
- **Device:** Primarily desktop with large monitor, occasionally tablet
- **Usage:** 80% desktop, 20% tablet

### Tertiary: Subcontractor
- **Context:** Receives plans from GC, provides trade-specific pricing
- **Goals:** Quick turnaround on bid requests, protect margins
- **Pain points:** Unclear scope, missing details, late plan changes
- **Device:** Mixed mobile/desktop
- **Usage:** 50/50 mobile/desktop

---

## 3. Core User Flows

### Flow 1: Quick Estimate (Mobile-First, < 5 minutes)

**Persona:** GC in the field, standing on a job site, needs a rough estimate fast.

```
[1. Capture]          [2. Parse]           [3. Review]          [4. Cost]            [5. Share]
 Tap camera btn  -->  AI processes    -->  Swipe cards     -->  Auto-price      -->  Share link
 or pick PDF          w/ per-page grid     Accept/Reject        w/ templates         or SMS
 Auto-classify        Progressive items    Bulk accept >85%     Edit outliers        PDF snapshot
 HEIC + multi-cap     Show each item       confident items      Running total        Copy to clipboard
```

**Step-by-step:**
1. User taps "New Estimate" from project page, sees camera button (mobile) or drag-drop zone (desktop)
2. Captures photo of plan sheet (supports HEIC, multi-capture mode) or selects PDF from device
3. System auto-classifies page type (floor plan, elevation, detail, schedule)
4. Single "Analyze Plan" button triggers AI parse; per-page extraction progress grid shows stage and percentage for each page
5. Results appear progressively card-by-card as AI processes each page (not all-at-once)
6. Review screen shows confidence summary: "23 items: 15 high, 5 medium, 3 low confidence"
7. User taps "Accept All High Confidence" to batch-approve items >85%; swipe cards appear for medium/low items only
8. If micro-confirmations needed (L8): 3-5 targeted yes/no cards for scale, room count, wall type verification
9. Accepted items auto-priced from last-used template or materials catalog
10. Sticky bottom bar shows running total; user taps "Share" to generate link or PDF snapshot

**Exit points:** User can save draft at any step and resume later.

### Flow 2: Detailed Estimate (Desktop, 30-60 minutes)

**Persona:** Estimator preparing a formal bid with full trade breakdown.

```
[1. Multi-Upload]    [2. Batch Parse]     [3. Item Review]     [4. Cost Build]      [5. Export]
 Drag multiple   --> Queue all pages  --> Split-panel:       --> Apply assemblies --> PDF w/ branding
 PDF pages           Per-page grid        Plan left,           Template pricing     Cover page
 Thumbnail grid      Worker queue         Items right          Line-item editing    Trade breakdown
 Re-order pages      Progressive items    Filter by trade      Overhead/markup      Proposal format
                     Retry failed         Color overlays       Micro-confirm
```

**Step-by-step:**
1. Drag multiple PDFs or multi-page PDF into upload zone; thumbnail grid shows all pages
2. Re-order pages if needed; system auto-classifies each page type with confidence badge
3. "Parse All" triggers batch processing; per-page extraction progress grid shows queued/processing/complete/failed status per page with retry for failures
4. Results appear progressively as each page completes; items animate in card-by-card
5. Split-panel view: PlanViewer on left with trade-colored overlays and construction status visualization, item list on right
6. Filter items by trade, confidence level, or status; click item to highlight region on plan with overlay
7. Review confidence summary; "Accept All High Confidence" for items >85%; review remaining items individually
8. If micro-confirmations generated by L8 validation: answer 3-5 targeted questions about scale, room count, wall types
9. Apply assemblies (e.g., "Interior Wall" expands to studs, drywall, tape, paint, labor)
10. Apply pricing template or link items to materials catalog; edit individual costs
11. Set overhead % and markup %; review trade-by-trade subtotals with donut chart
12. Export branded PDF with cover page, trade breakdown, and line-item detail

### Flow 3: Revision Handling

**Persona:** PM who received updated plans from the architect.

```
[1. Upload Rev]      [2. Compare]         [3. Delta Review]    [4. Update]          [5. Recalculate]
 Upload new ver  --> Side-by-side      --> Changed items    --> Accept/reject    --> New totals
 Link to prev        or overlay diff      highlighted          changes              Version history
 estimate            Toggle view          Added/removed        Bulk operations      Audit trail
```

**Step-by-step:**
1. From existing estimate, tap "Upload Revision"; system links new upload to previous version
2. AI parses new version and compares quantities against previous takeoff
3. Comparison view shows: items added (green), removed (red), quantity changed (amber)
4. User reviews each delta; accepts changes individually or in bulk
5. System recalculates costs with updated quantities; shows cost impact (+/- dollar amount)
6. Version history records the revision with timestamp, user, and summary of changes

### Flow 4: Template-Based Estimate

**Persona:** GC bidding on a project type they do regularly (e.g., retail build-out).

```
[1. Select Template]  [2. Auto-Populate]  [3. Adjust]         [4. Price]           [5. Finalize]
 Browse templates --> Items pre-filled --> Edit quantities --> Catalog pricing  --> Review & approve
 by project type     w/ default qtys     Scale to project    Override as needed   Send for approval
 Preview contents    Assemblies applied   Add/remove items    Regional adjustment  Lock estimate
```

**Step-by-step:**
1. Create new estimate; choose "From Template" instead of uploading plans
2. Browse saved templates by project type; preview shows trade breakdown and typical item count
3. Select template; system populates estimate with default items, assemblies, and typical quantities
4. Adjust quantities for the specific project; scale factor option for quick adjustment
5. System prices from materials catalog with regional adjustments; user overrides as needed
6. Review summary; submit for GC approval or self-approve if authorized

---

## 4. Feature Requirements

### P0: Critical (Ship-blocking)

#### REQ-UX-001: Wizard Stepper Progress Indicator

**Story:** As a GC, I want to always know where I am in the estimation process so I do not lose track of my progress.

**Description:** A persistent step indicator showing the user's position in the Upload -> Parse -> Review -> Cost -> Summary workflow. Replaces the current implicit flow with an explicit, clickable progression bar.

**Acceptance Criteria:**
- GIVEN a user starts a new estimate WHEN the estimate wizard loads THEN a horizontal stepper bar displays 5 labeled steps: Upload, Parse, Review, Cost, Summary
- GIVEN the user is on step 3 (Review) WHEN they look at the stepper THEN steps 1-2 show completed (checkmark + filled circle), step 3 shows active (primary color ring + pulse), steps 4-5 show upcoming (gray outline)
- GIVEN the user is on step 4 (Cost) WHEN they tap step 3 (Review) THEN the wizard navigates back to the Review step without losing data
- GIVEN the user is on step 2 (Parse) WHEN they tap step 4 (Cost) THEN the tap is ignored because the user cannot skip forward past incomplete steps
- GIVEN the user is on mobile (<640px) WHEN the stepper renders THEN it collapses to show only the current step label with left/right navigation arrows and a "Step 3 of 5" indicator
- GIVEN the user completes all 5 steps WHEN the summary is displayed THEN the stepper shows all steps completed with a green finish state

**Visual Spec:**
- Desktop: Horizontal bar with connected circles, labels below each
- Mobile: Compact bar with current step name, progress dots, step counter
- Colors: Completed = `#001B51` fill, Active = `#001B51` ring with pulse animation, Upcoming = `#3C3C3C/30` outline
- Minimum touch target: 44px per step circle on mobile

---

#### REQ-UX-002: Mobile Takeoff Review with Swipe Cards + Confidence-Grouped Review

**Story:** As a GC in the field, I want to quickly accept or reject AI-detected items by swiping so I can review an estimate in under 2 minutes on my phone.

**Description:** A confidence-grouped review workflow with a Tinder-style swipeable card interface for medium/low confidence items on mobile. Before swipe cards, a summary screen shows confidence distribution and offers a one-tap "Accept All High Confidence" action. Swipe cards are used only for items requiring individual review, reducing review time from N items to ~8 items on average.

**Acceptance Criteria:**
- GIVEN takeoff items are loaded for review WHEN the review screen renders THEN it first displays a confidence summary: "23 items: 15 high, 5 medium, 3 low confidence" with color-coded counts
- GIVEN the confidence summary is displayed WHEN items exist above 85% confidence THEN an "Accept All High Confidence" button is prominently displayed (full-width, 44px, `CheckCheck` icon) showing count of auto-approvable items
- GIVEN the user taps "Accept All High Confidence" WHEN items exist above the threshold THEN all items above 85% are batch-accepted with a cascading checkmark animation and a toast shows "15 items accepted"
- GIVEN high-confidence items are accepted WHEN medium/low confidence items remain THEN the system transitions to the swipe card interface for remaining items only
- GIVEN a user opens takeoff review on a device with viewport width <640px WHEN the review screen loads THEN the system displays a card stack interface instead of the list/table view
- GIVEN a swipe card is displayed WHEN the user swipes right (>80px horizontal threshold) THEN the item is accepted with a green checkmark animation and the next card animates in from the right
- GIVEN a swipe card is displayed WHEN the user swipes left (>80px horizontal threshold) THEN the item is rejected with a red X animation and the next card animates in
- GIVEN a swipe card is displayed WHEN the user swipes up (>60px vertical threshold) THEN the item is flagged for later review with an amber bookmark animation
- GIVEN the card is partially swiped (<80px) WHEN the user releases THEN the card snaps back to center with a spring animation
- GIVEN all remaining items have been reviewed WHEN the user swipes through all cards THEN a completion screen shows: X accepted, Y rejected, Z flagged, with options to review flagged items or proceed to costing
- GIVEN items have varying confidence scores WHEN cards are ordered THEN low-confidence items appear first (ascending confidence sort) so the user reviews uncertain items while most attentive

**Visual Spec:**
- Confidence summary: Full-width card with color-coded counts (green/amber/red circles), item count per tier
- "Accept All" button: Full-width, `#001B51` background, white text, 44px height, Lucide `CheckCheck` icon, count badge
- Card size: Full width minus 32px padding, 70% of viewport height
- Card content: Item name, trade badge, quantity + unit, confidence bar (4px colored), plan thumbnail (if available)
- Swipe indicators: Green tint + checkmark icon (right), Red tint + X icon (left), Amber tint + bookmark icon (up)
- Stack effect: Next 2 cards visible behind current card at reduced scale (0.95, 0.9) and slight vertical offset

---

#### REQ-UX-003: Enhanced Upload with Camera Capture, HEIC Support + Multi-Capture

**Story:** As a GC on site, I want to snap a photo of a plan sheet and get an instant estimate so I do not have to wait until I am back at my desk.

**Description:** An enhanced upload experience with camera capture on mobile (including HEIC support and multi-capture mode), drag-and-drop on desktop, thumbnail preview grid with auto-classification of page types, and multi-file queuing. Supports rapid multi-capture without returning to app between shots, and client-side image compression before upload.

**Acceptance Criteria:**
- GIVEN a user is on a mobile device WHEN the upload screen loads THEN a prominent camera button (min 44px, Lucide `Camera` icon) is displayed alongside the file picker
- GIVEN a user taps the camera button WHEN the device camera opens THEN the system uses the rear-facing camera with flash auto and highest resolution available
- GIVEN a user captures a photo WHEN the image is processed THEN the system shows a thumbnail preview with auto-detected page type label (e.g., "Floor Plan", "Elevation", "Schedule") and a confidence percentage
- GIVEN a user is on desktop WHEN they drag files over the upload zone THEN the zone highlights with a dashed border animation and "Drop files here" text, accepting PDF, PNG, JPG, and HEIC formats
- GIVEN multiple files are uploaded WHEN the thumbnail grid displays THEN each thumbnail shows: preview image, page type classification badge, file size, and a remove button (44px touch target)
- GIVEN a file fails to upload WHEN the error occurs THEN the failed file shows a red error badge with retry button; successfully uploaded files are not affected
- GIVEN a user uploads an HEIC image (iOS default camera format) WHEN the file is received THEN the system accepts and processes it without requiring format conversion by the user
- GIVEN a user activates multi-capture mode WHEN they capture a photo THEN the camera stays open for rapid sequential capture without returning to the app between shots; a counter shows "3 photos captured"
- GIVEN images are captured or selected WHEN they are queued for upload THEN client-side compression targets 1-2MB per image via `canvas.toBlob()` with quality 0.8 before uploading

**Visual Spec:**
- Camera button: 56px circle, `#001B51` background, white `Camera` icon, positioned bottom-right with `active:scale-95`
- Multi-capture indicator: Small counter badge (red circle) on camera button showing captured count
- Thumbnail grid: 2 columns on mobile, 4 columns on desktop, 8px gap
- Page type badge: Positioned top-left of thumbnail, semi-transparent background, uppercase small text
- Drop zone: Dashed 2px border, `#001B51/20` background on hover, 200ms transition

---

#### REQ-UX-004: Sticky Cost Totals Bar

**Story:** As a PM, I want to always see the running cost total while editing line items so I can make pricing decisions in context.

**Description:** A persistent bottom bar that stays fixed during scrolling, showing the real-time running total, item count, and trade breakdown summary. Collapses to a minimal bar on mobile and expands on tap.

**Acceptance Criteria:**
- GIVEN the user is on the Cost or Review step WHEN they scroll through line items THEN a sticky bar remains fixed at the bottom of the viewport showing: total cost (formatted as currency), accepted item count, and trade count
- GIVEN a line item cost changes WHEN the user edits a unit cost or quantity THEN the sticky bar total updates within 100ms without a full page re-render
- GIVEN the user is on mobile (<640px) WHEN the sticky bar is displayed THEN it shows a single-line summary: "$XX,XXX | XX items" with an expand chevron
- GIVEN the user taps the expand chevron on mobile WHEN the bar expands THEN it slides up to reveal a trade-by-trade subtotal breakdown (max 40% of viewport height, scrollable)
- GIVEN the estimate has overhead and markup percentages WHEN the sticky bar displays THEN it shows: Subtotal, + Overhead (%), + Markup (%), = Grand Total as a stacked breakdown in the expanded view
- GIVEN the user navigates away from Cost/Review steps WHEN the stepper changes THEN the sticky bar hides with a slide-down animation

**Visual Spec:**
- Bar height: 56px collapsed (mobile), 64px (desktop)
- Background: `#001B51` with white text, `backdrop-blur-sm` for translucency
- Safe area: `pb-[env(safe-area-inset-bottom)]` on mobile
- Grand total: Bold 20px, item count: 14px muted
- Expand animation: 300ms ease-out slide-up

---

#### REQ-UX-005: Confidence-Driven Review Prioritization

**Story:** As an estimator, I want the system to surface uncertain items first and let me bulk-approve confident items so I spend my review time where it matters most.

**Description:** A review workflow that sorts items by AI confidence ascending, provides a confidence threshold slider, and offers a "Accept All Confident" bulk action for items above the threshold. Updated to use 85% as the high-confidence threshold (industry standard) with enhanced visual indicators.

**Acceptance Criteria:**
- GIVEN takeoff items are loaded for review WHEN the review screen renders THEN items are sorted ascending by confidence score (lowest confidence first)
- GIVEN items have varying confidence scores WHEN the review list displays THEN each item shows a confidence indicator: `ShieldCheck` icon + green bar (85-100%), `AlertTriangle` icon + amber bar (60-84%), `AlertTriangle` filled icon + red bar (0-59%)
- GIVEN the confidence indicator is displayed WHEN the user taps or hovers on it THEN the numeric percentage is revealed (not always visible to avoid clutter)
- GIVEN each item row or card WHEN it renders THEN a 4px colored confidence bar is displayed inside the row, width proportional to score, color matching the tier
- GIVEN the user adjusts the confidence threshold slider WHEN the slider value changes THEN items above the threshold are visually grouped under an "Auto-Approve" section with a muted style, and items below remain in the "Needs Review" section
- GIVEN the user taps "Accept All Confident" WHEN items exist above the threshold THEN all items above the threshold are batch-accepted with a cascading checkmark animation, and a toast shows "X items accepted"
- GIVEN all items below the threshold have been reviewed WHEN the user has only threshold-approved items remaining THEN the system shows a completion prompt: "All uncertain items reviewed. Accept remaining X confident items?"
- GIVEN the confidence threshold slider is set WHEN the user changes it THEN the system persists the threshold value per-user so it applies to future estimates

**Visual Spec:**
- Threshold slider: Full-width, 44px touch height, labeled ticks at 60%, 75%, 85%, 95%
- Default threshold: 85% (updated from 80% to align with industry standard)
- "Accept All Confident" button: Full-width, `#001B51` background, white text, 44px height, Lucide `CheckCheck` icon
- Confidence bar: 4px height, color-coded, inside each item row/card
- High confidence icon: `ShieldCheck` (16px, green)
- Medium/Low confidence icon: `AlertTriangle` (16px, amber or red)

---

#### REQ-UX-006: Trade Breakdown Summary with Donut Chart

**Story:** As a GC, I want to see a visual breakdown of costs by trade so I can quickly identify the largest cost drivers and spot anomalies.

**Description:** A trade breakdown section with a donut chart visualization, collapsible trade sections, and sortable summary table. Displayed on the Summary step and accessible from the sticky cost bar expanded view.

**Acceptance Criteria:**
- GIVEN the user reaches the Summary step WHEN the summary loads THEN a donut chart displays cost distribution by trade, with each segment colored by trade and showing the trade name + percentage on hover/tap
- GIVEN the donut chart is displayed WHEN the user taps a trade segment THEN the corresponding trade section below scrolls into view and expands to show its line items
- GIVEN trade sections are listed below the chart WHEN the summary renders THEN each trade shows: trade name, item count, subtotal, and percentage of total; sections are collapsible
- GIVEN a trade has more than 10 line items WHEN the section is expanded THEN it shows the first 5 items with a "Show X more" button to avoid overwhelming the view
- GIVEN the estimate has no line items WHEN the summary renders THEN the chart area shows an empty state: "No items yet. Complete the Review step to see your cost breakdown."
- GIVEN the user is on mobile WHEN the donut chart renders THEN it sizes to 200px diameter with trade labels listed below the chart (not overlaid) to avoid crowding

**Visual Spec:**
- Donut chart: 280px diameter (desktop), 200px diameter (mobile), 60px inner radius
- Trade colors: Consistent palette mapped to CSI divisions (structural = blue, electrical = amber, plumbing = teal, etc.)
- Chart center: Total cost displayed in bold
- Trade sections: 1px border, 12px padding, `ChevronDown`/`ChevronUp` toggle icon, 44px row height

---

#### REQ-UX-019: Micro-Confirmation Cards (L8 Validation)

**Story:** As an estimator, I want the AI to ask me 3-5 quick verification questions about uncertain detections so I can boost accuracy without reviewing every single item.

**Description:** A card-based swipe UI for targeted yes/no prompts generated by the L8 validation layer. Each card shows a plan region image with highlighted elements, a simple question, and touch-friendly response buttons. Driven by `validation/micro-confirmation.ts` backend. Reduces the need for full manual review by confirming the most impactful uncertain detections.

**Acceptance Criteria:**
- GIVEN the L8 validation layer generates micro-confirmations WHEN the extraction pipeline reaches the validate stage THEN the user is presented with 3-5 confirmation cards (never more than 5)
- GIVEN a micro-confirmation card is displayed WHEN it renders THEN it shows: a cropped plan region image with the relevant element highlighted, a simple question (e.g., "Is the scale 1/4" = 1'-0"?"), and 2-3 response options
- GIVEN the confirmation card has response options WHEN the user taps an option THEN the button shows a selected state (44px minimum touch target), and the confidence score for related elements updates in real-time
- GIVEN a confirmation card is displayed WHEN the user does not want to answer THEN a "Skip" button is always available and visible; skipping does not penalize confidence
- GIVEN the user answers a micro-confirmation WHEN the response is submitted THEN the system applies the confidence boost (e.g., +15 for scale confirmation, +10 for room count) and shows the updated confidence
- GIVEN all micro-confirmations are answered or skipped WHEN the user completes the cards THEN the pipeline continues to generate the final estimate with updated confidence scores

**Visual Spec:**
- Card: Full width minus 32px padding, centered, white background, 16px rounded corners
- Plan region image: Top 50% of card, cropped to relevant area, highlighted element with 2px colored border
- Question text: 16px semibold, centered below image
- Response buttons: Horizontal row, 44px height, 8px gap, primary color for default option, outline for alternatives
- "Skip" button: Text-only, muted color, below response buttons
- Confidence update: Animated counter showing "+15" next to confidence badge after response

---

#### REQ-UX-020: Extraction Progress with Per-Page Grid (Worker Queue)

**Story:** As an estimator processing a multi-page plan set, I want to see the extraction status of each page individually so I can track progress and retry failures without reprocessing the entire set.

**Description:** Replaces the simple progress bar with a per-page status grid powered by the worker queue system. Each page cell shows its current extraction stage and status. Includes overall progress percentage, ETA, retry for failed pages, and cancel. Powered by Supabase Realtime subscription to the `extraction_jobs` table.

**Acceptance Criteria:**
- GIVEN an extraction pipeline is created WHEN the progress UI renders THEN it displays a grid of page cells (2 columns mobile, 4 columns desktop), one cell per page
- GIVEN a page cell is displayed WHEN its extraction status changes THEN the cell updates in real-time to show: queued (gray), processing (blue pulse animation), complete (green checkmark), failed (red X with retry button)
- GIVEN the extraction is in progress WHEN the progress UI is visible THEN it shows: current stage name (e.g., "Detecting walls..."), overall percentage (completed/total jobs), and estimated time remaining based on average job duration
- GIVEN a page fails extraction WHEN the failure is detected THEN the failed page cell shows a retry button (44px touch target); tapping retry re-queues that page's remaining jobs
- GIVEN the extraction is in progress WHEN the user wants to stop THEN a cancel button is available; cancelling retains all completed pages and discards in-progress/queued jobs
- GIVEN the Supabase Realtime subscription is active WHEN an extraction_job row updates THEN the progress UI reflects the change within 500ms

**Visual Spec:**
- Page cell: 80px square (mobile), 100px square (desktop), rounded 8px, border 1px
- Status colors: queued=`#6B7280`, processing=`#001B51` with pulse, complete=`#16A34A`, failed=`#DC2626`
- Stage label: 12px text below progress bar, truncated with ellipsis if needed
- Overall progress: Full-width bar above grid, percentage + ETA text
- Cancel button: Text-only, red, 44px touch target, positioned top-right of progress section

---

#### REQ-UX-021: Plan Region Color Overlays by Trade

**Story:** As an estimator, I want to see detected elements overlaid on the plan with distinct colors per trade so I can visually verify what the AI found.

**Description:** Detected elements from the vector extraction engine are overlaid on the plan viewer with trade-specific colors. Users can toggle layers on/off per trade, and clicking an overlay selects the corresponding takeoff item. Inspired by the Attentive.ai color-coded plan overlay pattern.

**Acceptance Criteria:**
- GIVEN takeoff items have been extracted WHEN the plan viewer renders THEN detected elements are overlaid with semi-transparent colored regions matching their trade
- GIVEN the overlay colors WHEN elements are displayed THEN the following trade-color mapping is used: walls=blue (#3B82F6), electrical=amber (#F59E0B), plumbing=teal (#14B8A6), HVAC=green (#22C55E), doors=purple (#A855F7), windows=cyan (#06B6D4)
- GIVEN trade overlays are displayed WHEN the user taps a toggle control THEN individual trade layers can be turned on/off without affecting other layers
- GIVEN an overlay element is displayed WHEN the user taps it THEN the corresponding takeoff item is selected in the item list, and the item detail scrolls into view
- GIVEN a takeoff item is selected in the item list WHEN the plan viewer is visible THEN the corresponding overlay element highlights with increased opacity and a 2px border pulse animation
- GIVEN the plan viewer is on mobile WHEN overlays are displayed THEN overlay opacity is reduced to 20% (vs 30% on desktop) to avoid obscuring the underlying plan

**Visual Spec:**
- Overlay opacity: 30% desktop, 20% mobile
- Selected overlay: 50% opacity + 2px solid border matching trade color + pulse animation (600ms)
- Toggle control: Horizontal scrollable chip bar above plan viewer, each chip shows trade color dot + name, 44px touch target
- Layer toggle animation: 200ms fade in/out

---

#### REQ-UX-022: Construction Status Visual Treatment

**Story:** As an estimator reviewing a TI (tenant improvement) project, I want to visually distinguish between new construction, existing-to-remain, and demolition items on the plan so I can verify the AI correctly classified each element.

**Description:** Takeoff items with construction status (new/existing_to_remain/demolition) receive distinct visual treatments on both the plan overlay and the item list. Maps to `takeoff_items.construction_status` field from design.md v2.4. Inspired by PlanSwift's condition-based takeoff pattern.

**Acceptance Criteria:**
- GIVEN a wall or element has `construction_status: 'new'` WHEN it renders on the plan overlay THEN it displays as a solid colored overlay (trade color at standard opacity)
- GIVEN a wall or element has `construction_status: 'existing_to_remain'` WHEN it renders on the plan overlay THEN it displays as a dashed gray overlay (4px dash, 4px gap, #6B7280 at 25% opacity)
- GIVEN a wall or element has `construction_status: 'demolition'` WHEN it renders on the plan overlay THEN it displays as a red strikethrough overlay (#DC2626 at 35% opacity with diagonal hatch pattern)
- GIVEN a takeoff item has a construction status WHEN it renders in the item list THEN a small badge shows the status: "New" (blue), "Existing" (gray), "Demo" (red)
- GIVEN the user filters the item list WHEN they select a construction status filter THEN only items matching that status are shown, and the plan overlays update to match

**Visual Spec:**
- New: Solid overlay, trade color, standard opacity
- Existing: Dashed outline (SVG dasharray="4,4"), `#6B7280`, 25% opacity
- Demolition: Red overlay `#DC2626` at 35%, diagonal hatch lines (45deg, 4px spacing)
- Status badge in list: 12px text, pill shape, color-coded background at 15% opacity with matching text color

---

#### REQ-UX-023: Progressive Result Loading

**Story:** As a GC waiting for AI to process my plans, I want to see results appear one-by-one as they are detected so I get immediate feedback instead of staring at a blank screen.

**Description:** Takeoff items appear card-by-card as the AI extraction processes each page, rather than loading all at once after processing completes. Each new item animates in with an entrance animation. A real-time counter increments as items arrive, and confidence scores are visible immediately. Inspired by the Beam AI progressive loading pattern.

**Acceptance Criteria:**
- GIVEN the extraction pipeline is processing WHEN a takeoff item is detected and normalized THEN it immediately appears in the review list/card stack with an animated entrance (slide up + fade in, 250ms)
- GIVEN items are appearing progressively WHEN a new item arrives THEN a counter at the top of the review section updates: "12 items found so far..." with a subtle pulse animation on increment
- GIVEN an item appears progressively WHEN it renders THEN its confidence score is immediately visible (color-coded bar + tier icon)
- GIVEN items are loading progressively WHEN the extraction completes for all pages THEN the counter changes to "23 items found" (no "so far"), and the confidence summary appears
- GIVEN the user is viewing progressively loaded items WHEN they interact with an item (tap, swipe) THEN the interaction works normally even while more items are still loading
- GIVEN the extraction pipeline fails for a page WHEN items from other pages have already loaded THEN existing items are retained and a warning banner shows "Page 5 failed - retry available"

**Visual Spec:**
- Item entrance animation: `translateY(20px)` -> `translateY(0)` + `opacity: 0` -> `opacity: 1`, 250ms ease-out
- Counter: 14px text, muted color, positioned top-right of review section, subtle scale pulse (1.0 -> 1.05 -> 1.0) on increment
- Loading indicator: Small spinner next to counter while extraction is still in progress
- Completed state: Counter text changes to bold, spinner removed, slight green flash on final count

---

### P1: Important (Next Sprint)

#### REQ-UX-007: AI Plan Chat Sidebar

**Story:** As a PM, I want to ask natural language questions about my uploaded plans so I can extract information without manually scanning every page.

**Description:** A collapsible sidebar (desktop) or bottom sheet (mobile) where users can ask questions about their plans in natural language. The AI responds with answers referencing specific plan pages and regions. Inspired by Togal.CHAT.

**Key behaviors:**
- Chat input at bottom with suggested prompts ("How many doors?", "Total square footage?", "List all electrical panels")
- AI responses reference page numbers and highlight relevant regions on plan viewer
- Conversation persists per estimate; user can re-open and continue
- Typing indicator while AI processes
- Export chat as PDF appendix

---

#### REQ-UX-008: Assemblies System

**Story:** As an estimator, I want to create and apply pre-built assemblies so common construction elements are estimated consistently and completely.

**Description:** A system for grouping related line items into reusable assemblies. For example, an "Interior Wall" assembly might include: metal studs, drywall (both sides), tape and joint compound, primer, paint, and labor. Assemblies can be saved as templates, shared across the company, and applied during the costing step.

**Key behaviors:**
- Assembly library with search and category filtering
- Create assembly from existing line items or from scratch
- Apply assembly to a takeoff item (expands into component items)
- Assembly includes default quantities with multiplier relative to parent quantity
- Company-level and personal assembly libraries
- Assembly versioning (update assembly, option to update all instances)

---

#### REQ-UX-009: Multi-Page Batch Operations

**Story:** As an estimator working on a 50-page plan set, I want to parse all pages at once and track progress so I do not have to process each page individually.

**Key behaviors:**
- "Parse All" button triggers sequential parsing of all uploaded pages
- Per-page extraction progress grid shows: current stage, pages completed, estimated time remaining (REQ-UX-020)
- Per-page status: queued, parsing, complete, failed (with retry)
- Option to cancel batch mid-process (completed pages retained)
- Results aggregated across all pages into unified takeoff item list
- Background processing: user can navigate away and return

---

#### REQ-UX-010: Revision Comparison View

**Story:** As a PM, I want to compare a new plan version against the previous estimate so I can quickly see what changed and update my numbers.

**Key behaviors:**
- Side-by-side or overlay toggle for plan images
- Item-level diff: added (green), removed (red), quantity changed (amber)
- Cost impact summary: "+$X,XXX from revision" or "-$X,XXX from revision"
- Accept/reject changes individually or in bulk
- Revision linked to parent estimate with version number
- Audit trail of all revision changes

---

#### REQ-UX-011: PDF Export with Company Branding

**Story:** As a GC, I want to export a professionally formatted PDF estimate so I can include it in my bid proposals.

**Key behaviors:**
- Cover page with company logo, project name, date, estimator name
- Executive summary with totals, trade breakdown chart, key metrics
- Trade-by-trade detail pages with line items, quantities, and costs
- Optional: include plan thumbnails with highlighted takeoff regions
- Footer with page numbers, company name, "Confidential" watermark option
- Customizable: select which trades to include, level of detail

---

#### REQ-UX-012: Estimate-to-Budget Conversion

**Story:** As a GC, I want to convert an approved estimate into a project budget with one click so I do not have to re-enter all the numbers.

**Key behaviors:**
- "Convert to Budget" button on approved estimates
- Maps estimate trades to budget categories
- Preserves line-item detail as budget sub-items
- Adds contingency line based on project risk settings
- Creates budget in draft status for review before activation
- Links budget back to source estimate for traceability

---

#### REQ-UX-013: Template Management

**Story:** As an estimator, I want to save, organize, and share pricing templates so my team uses consistent pricing across projects.

**Key behaviors:**
- Save current estimate pricing as named template
- Template library with search, category filter, last-used date
- Apply template to new estimate (bulk-prices all matching items)
- Company templates (shared) vs personal templates (private)
- Template versioning with changelog
- Duplicate and modify templates

---

#### REQ-UX-014: Material Catalog Integration

**Story:** As a PM, I want line items automatically linked to our materials catalog so estimates use real, current pricing.

**Key behaviors:**
- AI suggests material catalog matches for each line item
- Confidence-scored suggestions with manual override
- Stale price warnings when catalog price is older than 30 days
- One-click accept suggestion or search catalog manually
- Linked items auto-update when catalog prices change (with notification)
- Bulk link: "Match all unlinked items" action

---

### P2: Future (Backlog)

#### REQ-UX-015: On-Plan Measurement Tools

**Story:** As an estimator, I want to draw measurements directly on the plan so I can verify or supplement AI-detected quantities.

**Key behaviors:**
- Area tool (polygon), linear tool (polyline), count tool (tap markers)
- Scale calibration from known dimension on plan
- Measurement auto-creates or updates takeoff item
- Measurements persist and display on plan view
- Undo/redo support
- Touch-optimized: two-finger zoom does not trigger measurement

---

#### REQ-UX-016: Real-Time Collaboration

**Story:** As part of a preconstruction team, I want multiple estimators to work on the same estimate simultaneously so we can divide work by trade.

**Key behaviors:**
- Presence indicators showing who is viewing/editing
- Cursor positions visible to other users
- Conflict resolution: last-write-wins with notification
- Trade-level locking: claim a trade section for exclusive editing
- Activity feed showing recent changes by team members

---

#### REQ-UX-017: Offline Mode

**Story:** As a GC in the field with poor connectivity, I want to continue working on my estimate offline and sync when I reconnect.

**Key behaviors:**
- Service worker caches active estimate data
- Upload queue for photos taken offline
- Conflict resolution on sync (timestamp-based)
- Visual indicator: "Offline - changes will sync" banner
- Automatic sync when connection restored

---

#### REQ-UX-018: Historical Cost Analytics

**Story:** As a GC, I want to see cost trends across my past estimates so I can identify pricing patterns and improve future bids.

**Key behaviors:**
- Cost per square foot trends over time
- Trade cost comparison across projects
- Win/loss analysis for bids (if bid outcome tracked)
- Material price trend charts
- Export analytics as report

---

## 5. UI/UX Design Specifications

### Layout Architecture

**Desktop (>1024px):**
```
+-------------------------------------------------------------+
| Project Header / Breadcrumb                                   |
+-------------------------------------------------------------+
| Wizard Stepper (horizontal, full-width)                       |
+-------------------------------------------------------------+
|                        |                                      |
|   Plan Viewer          |   Item Panel                         |
|   (60% width)          |   (40% width)                        |
|   - Zoomable plan      |   - Filters bar                      |
|   - Trade overlays     |   - Item list / cards                |
|   - Status overlays    |   - Inline editing                   |
|   - Region highlights  |   - Confidence bars                  |
|   [Resizable divider]  |                                      |
|                        |                                      |
+-------------------------------------------------------------+
| Sticky Cost Totals Bar (64px)                                 |
+-------------------------------------------------------------+
```

**Tablet (640px - 1024px):**
```
+-------------------------------------------+
| Project Header (compact)                   |
+-------------------------------------------+
| Wizard Stepper (horizontal, compact)       |
+-------------------------------------------+
|                    |                        |
|   Plan Viewer      |   Item Panel           |
|   (50% width)      |   (50% width)          |
|   [Resizable]      |                        |
|                    |                        |
+-------------------------------------------+
| Sticky Cost Totals Bar (56px)              |
+-------------------------------------------+
```

**Mobile (<640px) - Bottom-Sheet Plan Viewer Pattern:**
```
+-----------------------------+
| Project Header (minimal)     |
+-----------------------------+
| Stepper (compact: "3 of 5") |
+-----------------------------+
|                              |
|   Full-width content area    |
|   - Upload: Camera + grid    |
|   - Review: Swipe cards      |
|   - Cost: Scrollable list    |
|   - Summary: Chart + list    |
|                              |
|   [Items fill screen by      |
|    default; no plan visible]  |
|                              |
+-----------------------------+
| [FAB: "View Plan" 56px]     |
| Sticky Cost Bar (56px)       |
| pb-[env(safe-area-inset)]    |
+-----------------------------+

Plan Viewer as Bottom Sheet (on FAB tap or item tap):
+-----------------------------+
| [Drag handle: 32x4px]       |
|                              |
|   Plan Viewer                |
|   - Trade overlays           |
|   - Status overlays          |
|   - Pinch-zoom + pan         |
|   - Region highlights        |
|                              |
| Snap: 40% / 85% / 0%        |
+-----------------------------+
```

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#001B51` | Stepper active, buttons, chart accents |
| `--color-accent` | `#3C3C3C` | Secondary text, borders, inactive states |
| `--color-success` | `#16A34A` | Accepted items, completed steps, high confidence |
| `--color-warning` | `#D97706` | Medium confidence, flagged items, revision changes |
| `--color-danger` | `#DC2626` | Rejected items, errors, low confidence, demolition |
| `--color-surface` | `#FFFFFF` / `#0A0A0A` (dark) | Card backgrounds |
| `--color-muted` | `#6B7280` / `#9CA3AF` (dark) | Secondary text, placeholder |
| `--color-wall` | `#3B82F6` (blue) | Wall trade overlay |
| `--color-electrical` | `#F59E0B` (amber) | Electrical trade overlay |
| `--color-plumbing` | `#14B8A6` (teal) | Plumbing trade overlay |
| `--color-hvac` | `#22C55E` (green) | HVAC trade overlay |
| `--color-doors` | `#A855F7` (purple) | Door trade overlay |
| `--color-windows` | `#06B6D4` (cyan) | Window trade overlay |
| `--touch-min` | `44px` | Minimum interactive target size |
| `--touch-comfortable` | `48px` | Preferred button height |
| `--radius-card` | `12px` | Card border radius |
| `--radius-button` | `8px` | Button border radius |
| `--spacing-page` | `16px` (mobile) / `24px` (desktop) | Page-level padding |
| `--viewport-unit` | `dvh` | Viewport height calculations |

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title | 24px / 1.5rem | 700 | 1.2 |
| Section header | 18px / 1.125rem | 600 | 1.3 |
| Card title | 16px / 1rem | 600 | 1.4 |
| Body text | 14px / 0.875rem | 400 | 1.5 |
| Caption / label | 12px / 0.75rem | 500 | 1.4 |
| Cost total (sticky bar) | 20px / 1.25rem | 700 | 1.2 |
| Cost subtotal | 16px / 1rem | 600 | 1.3 |

### Lucide Icon Mapping

| Action | Icon | Size | Context |
|--------|------|------|---------|
| Upload file | `Upload` | 20px | Upload zone, file picker |
| Camera capture | `Camera` | 24px | Mobile camera button |
| Parse / AI analyze | `Sparkles` | 20px | Parse trigger button |
| Accept item | `Check` | 20px | Swipe card, list action |
| Reject item | `X` | 20px | Swipe card, list action |
| Flag for review | `Bookmark` | 20px | Swipe up action |
| Edit item | `Pencil` | 16px | Inline edit trigger |
| Delete item | `Trash2` | 16px | Remove item action |
| Expand/collapse | `ChevronDown` / `ChevronUp` | 16px | Trade sections, cost bar |
| Export PDF | `FileDown` | 20px | Export button |
| Template | `LayoutTemplate` | 20px | Template picker/save |
| Assembly | `Layers` | 20px | Assembly library |
| Chat | `MessageSquare` | 20px | AI chat sidebar |
| Confidence high | `ShieldCheck` | 16px | High confidence (85%+) |
| Confidence medium/low | `AlertTriangle` | 16px | Medium/low confidence warning |
| Revision | `GitCompare` | 20px | Revision comparison |
| Cost/pricing | `DollarSign` | 16px | Cost column header |
| Trade filter | `Filter` | 16px | Filter controls |
| Settings | `Settings` | 20px | Template/assembly management |
| Share | `Share2` | 20px | Share estimate link |
| Step complete | `CircleCheck` | 20px | Wizard stepper |
| Step active | `Circle` | 20px | Wizard stepper (with ring) |
| Step upcoming | `Circle` | 20px | Wizard stepper (outline) |
| View plan | `Map` | 24px | FAB to open plan bottom sheet |
| Retry | `RotateCcw` | 16px | Retry failed extraction page |
| Cancel | `XCircle` | 20px | Cancel extraction |
| Construction new | `Plus` | 12px | New construction badge |
| Construction demo | `Minus` | 12px | Demolition badge |
| Progressive loading | `Loader2` | 16px | Spinner while items loading |

### Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Card swipe accept | 300ms | `ease-out` | Swipe right past threshold |
| Card swipe reject | 300ms | `ease-out` | Swipe left past threshold |
| Card snap back | 200ms | `spring(1, 80, 10)` | Release below threshold |
| Card stack entrance | 250ms | `ease-out` | After previous card exits |
| Progressive item entrance | 250ms | `ease-out` | New item detected by AI |
| Stepper fill | 400ms | `ease-in-out` | Step completion |
| Sticky bar expand | 300ms | `ease-out` | Tap expand chevron |
| Sticky bar collapse | 200ms | `ease-in` | Tap collapse or scroll |
| Toast notification | 200ms in, 150ms out | `ease-out` / `ease-in` | Action feedback |
| Confidence bar fill | 600ms | `ease-out` | Item render |
| Confidence update pulse | 300ms | `ease-out` | After micro-confirmation answer |
| Donut chart segments | 500ms staggered (50ms/seg) | `ease-out` | Summary load |
| Page type badge appear | 150ms | `ease-out` | After classification |
| Bulk accept cascade | 100ms stagger per item | `ease-out` | "Accept All Confident" tap |
| Bottom sheet open | 300ms | `spring(1, 80, 12)` | FAB tap or item tap |
| Bottom sheet close | 200ms | `ease-in` | Swipe down or tap dismiss |
| Trade overlay fade | 200ms | `ease-out` | Layer toggle on/off |
| Overlay selection pulse | 600ms | `ease-in-out` | Item selected in list |
| Extraction page cell update | 150ms | `ease-out` | Job status change via Realtime |

### Touch Interaction Patterns

| Interaction | Gesture | Feedback |
|-------------|---------|----------|
| Accept item | Swipe right >80px | Green overlay + haptic (light) |
| Reject item | Swipe left >80px | Red overlay + haptic (light) |
| Flag item | Swipe up >60px | Amber overlay + haptic (medium) |
| Expand cost bar | Tap chevron | Slide up + haptic (light) |
| Zoom plan | Pinch (two-finger) | Native zoom with finger-tracking origin via `@use-gesture/react` |
| Pan plan | Single finger drag | Momentum-based panning with deceleration |
| Double-tap plan | Double tap | Toggle zoom 1x <-> 3x centered on tap point |
| Open plan bottom sheet | Tap FAB | Plan slides up from bottom + haptic (light) |
| Resize plan bottom sheet | Drag handle | Snap to 40% / 85% / 0% + haptic (selection) at snap points |
| Select overlay element | Tap overlay region | Highlight overlay + scroll to item in list |
| Long press item | 500ms hold | Context menu (edit, delete, flag) + haptic (heavy) |
| Pull to refresh | Pull down >64px | Refresh takeoff data |
| Scroll item list | Vertical swipe | Native scroll, horizontal swipe reserved for cards |
| Micro-confirmation answer | Tap button | Button highlight + confidence boost animation |

---

## 6. Mobile-First Considerations

### Breakpoints and Responsive Behavior

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| `xs` | <375px | Single column, minimal chrome, compact stepper |
| `sm` | 375-639px | Single column, swipe cards, camera button, bottom-sheet plan viewer |
| `md` | 640-1023px | Split panel (50/50), list view, both panels visible |
| `lg` | 1024-1279px | Split panel (60/40), full stepper, resizable divider |
| `xl` | 1280px+ | Split panel (60/40), sidebar chat, expanded tool panels |

### Swipeable Card Patterns

- **Card dimensions:** `calc(100vw - 32px)` width, `calc(70dvh - 120px)` height (accounting for stepper + cost bar)
- **Stack depth:** Show 3 cards max (current + 2 behind at 95% and 90% scale)
- **Drag constraints:** Horizontal drag only on X-axis; vertical drag only for flag gesture (requires >30deg angle from horizontal)
- **Velocity threshold:** If swipe velocity >500px/s, accept gesture even if distance is below threshold
- **Accessibility:** Visible Accept/Reject/Flag buttons below card for users who cannot swipe; `aria-live="polite"` announces card transitions
- **Orientation lock:** Cards optimized for portrait; landscape shows side-by-side plan + card

### Haptic Feedback Points

| Event | Haptic Type | iOS API |
|-------|-------------|---------|
| Card crosses accept threshold | `selection` | `UISelectionFeedbackGenerator` |
| Card crosses reject threshold | `selection` | `UISelectionFeedbackGenerator` |
| Card crosses flag threshold | `impactMedium` | `UIImpactFeedbackGenerator(.medium)` |
| Bulk accept triggered | `notificationSuccess` | `UINotificationFeedbackGenerator(.success)` |
| Bottom sheet snaps to point | `selection` | `UISelectionFeedbackGenerator` |
| Micro-confirmation answered | `impactLight` | `UIImpactFeedbackGenerator(.light)` |
| Cost total updates | None (too frequent) | -- |
| Long press context menu | `impactHeavy` | `UIImpactFeedbackGenerator(.heavy)` |
| Step completed | `notificationSuccess` | `UINotificationFeedbackGenerator(.success)` |

Implementation: Use `navigator.vibrate()` as fallback for Android. Feature-detect with `'vibrate' in navigator`. Note: iOS Safari does not support Web Vibration API; rely on visual feedback (`active:scale-95`) as the primary feedback mechanism.

### Virtual Scrolling for Large Lists

- Trigger virtual scrolling when item count exceeds 50
- Use `@tanstack/react-virtual` (already installed) for windowed rendering
- Render only visible items + 5 overscan items above/below
- Row height: fixed 72px for consistent scroll behavior
- Sticky section headers for trade groupings (float above virtual list)
- Scroll restoration: remember position when navigating away and returning

### Bottom-Sheet Plan Viewer (Mobile)

Replaces the previous "collapsible plan viewer" design with a bottom-sheet pattern:

- **Default:** Plan viewer hidden on mobile; items fill screen
- **FAB button:** "View Plan" floating action button (56px, bottom-right, above cost bar), Lucide `Map` icon, `#001B51` background, white icon, `active:scale-95`
- **Open:** Tap FAB or tap any item; plan slides up as bottom sheet
- **Snap points:** 40% (peek - shows plan with item list visible below), 85% (expanded - near full screen), 0% (dismissed)
- **Auto-open:** When user taps an item, plan auto-opens to 40% and scrolls to the highlighted region
- **Gesture:** Drag handle (32px wide, 4px height, centered, `#3C3C3C/30` color) at top of sheet
- **Plan interaction inside sheet:** Pinch-zoom, pan, region highlights all work within the bottom sheet context
- **Close:** Swipe down past 20% threshold or tap outside sheet
- **Background:** `backdrop-blur-md` overlay on content behind sheet
- **Border radius:** 16px top corners
- **Safe area:** `pb-[env(safe-area-inset-bottom)]`

### Touch Gesture Upgrade for PlanViewer

Replace current mouse-only event handlers with `@use-gesture/react` (~8KB):

- **Pinch-to-zoom:** Two-finger pinch with finger-tracking origin (zoom center follows midpoint between fingers, not viewport center)
- **Momentum-based panning:** Single finger drag with deceleration after release; spring-based physics via framer-motion `useSpring`
- **Double-tap-to-zoom:** Toggle between 1x (fit-to-screen) and 3x centered on tap point
- **Gesture disambiguation:** Automatically distinguishes drag vs pinch vs tap vs long-press; prevents pinch from triggering pan
- **Zoom limits:** Min 0.5x, max 8x; elastic bounce at limits (springs back from 0.4x/8.5x)
- **Performance:** Use CSS `transform: scale()` with `will-change: transform` for GPU acceleration

### Bottom Sheet Patterns

Use bottom sheets (not modals) on mobile for:
- Plan viewer (primary - see above)
- Item detail/edit forms
- Assembly picker
- Template selector
- Filter controls
- Chat interface
- Micro-confirmation cards

Bottom sheet specs:
- Drag handle: 32px wide, 4px height, centered, `#3C3C3C/30` color
- Snap points: 40% (peek), 85% (expanded), 0% (dismissed)
- Background: `backdrop-blur-md` overlay
- Border radius: 16px top corners
- Safe area: `pb-[env(safe-area-inset-bottom)]`

---

## 7. AI Integration Points

### Enhanced Parsing with Page Classification

**Current state:** Single-page parse via `/api/estimates/parse` returns takeoff items.

**V3 enhancement (aligned with design.md v2.4):**
- Pre-parse step classifies each uploaded page: floor plan, elevation, detail, schedule, cover, specification
- Classification confidence shown on thumbnail badges
- Parse behavior adapts by page type (e.g., schedules parsed as tables, floor plans as spatial regions)
- Pages classified as "cover" or "specification" are skipped in takeoff but retained for chat Q&A
- Vector engine (`/api/estimates/extract`) handles vector PDFs; GPT-4o fallback for raster pages
- Feature flag `EXTRACTION_ENGINE` controls routing: `auto` (default), `vector`, `openai`

### Auto-Classification of Uploaded Documents

**Trigger:** Immediately after upload, before user initiates parse.

**Classification taxonomy:**
| Type | Description | Parse Strategy |
|------|-------------|---------------|
| `floor_plan` | Overhead layout view | Spatial region detection (vector engine) |
| `reflected_ceiling` | Ceiling plan view | Fixture/diffuser counting |
| `elevation` | Side/front view | Linear measurement extraction |
| `section` | Cross-section view | Material layer identification |
| `detail` | Enlarged detail view | Component-level takeoff |
| `schedule` | Door/window/finish schedule | Table extraction (schedule-parser) |
| `electrical` | E-prefix sheet | Symbol counting, panel schedules |
| `plumbing` | P-prefix sheet | Fixture schedule, pipe tracing |
| `mechanical` | M-prefix sheet | Equipment schedule, duct measurement |
| `site_plan` | Site layout | Area calculations |
| `cover` | Title sheet | Project metadata extraction |
| `specification` | Written specs | Text extraction for chat |
| `unknown` | Unclassifiable | Flag for manual classification |

**Output:** Page type badge on each thumbnail, stored in `plan_pages.page_type` column.

### 10-Layer Validation Integration (from design.md v2.4)

The extraction pipeline includes a 10-layer validation framework. UX touch points:

| Layer | UX Impact |
|-------|-----------|
| L1: Extraction Quality | No direct UX; internal quality gate |
| L2: Dimension Cross-Validation | Scale confidence indicator in stepper |
| L3: Geometry Constraint Solver | Auto-repairs visible in item detail ("auto-corrected" badge) |
| L4: Symbol Relationship Graph | Contextual warnings (e.g., "Door detected but not attached to wall") |
| L5: Cross-Sheet Reconciliation | Discrepancy warnings in review (e.g., "Door schedule says 15, plan shows 12") |
| L6: Redundant Quantity Validation | Area cross-check badge (e.g., "Area verified by 3 methods") |
| L7: Probabilistic Confidence Engine | Per-item confidence scores (replaces flat scorer) |
| L8: Human Micro-Confirmation | **REQ-UX-019** - Card-based yes/no prompts |
| L9: Error Recovery & Auto-Correction | "Auto-corrected" badges with before/after detail on tap |
| L10: Final Approval Gate | Auto-approve (>90), review required (60-89), rejected (<40) status |

### Confidence Visualization Patterns

**Three-tier confidence display (updated thresholds):**

| Tier | Range | Color | Icon | Behavior |
|------|-------|-------|------|----------|
| High | 85-100% | `#16A34A` (green) | `ShieldCheck` | Auto-approvable, standard display |
| Medium | 60-84% | `#D97706` (amber) | `AlertTriangle` | Review recommended, highlighted border |
| Low | 0-59% | `#DC2626` (red) | `AlertTriangle` (filled) | Review required, cannot bulk-approve |

**Confidence bar:** 4px tall, horizontally fills proportional to score, color-coded by tier. Displayed inside item rows and swipe cards.

**Numeric percentage:** Hidden by default; shown on tap/hover to avoid visual clutter (per Togal.AI insight - avoid overwhelming users with numbers).

**Aggregate confidence:** Displayed in stepper as overall estimate confidence: "AI Confidence: 82%" with color-coded badge.

### Plan Chat Interface Spec

**Desktop:** Collapsible right sidebar, 320px width, slides in/out with 300ms animation.

**Mobile:** Bottom sheet with 40%/85% snap points.

**Chat UI elements:**
- Message list with user (right-aligned, primary color bubble) and AI (left-aligned, gray bubble) messages
- Suggested prompt chips above input: scrollable horizontal list
- Input: Text field with send button (44px), `Sparkles` icon prefix
- AI response format: Text with inline references like "[Page 3, Region B4]" that are tappable links
- Tapping a reference highlights the region on plan viewer and scrolls to it (inspired by Bluebeam's hyperlinked cross-references)
- Loading state: Animated dots in AI bubble
- Persistent per-estimate: `estimate_chat_messages` table stores history

---

## 8. Data Model Implications

### New Tables

#### `estimate_assemblies`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default `gen_random_uuid()` | Assembly ID |
| company_id | uuid | FK -> companies, NOT NULL | Company isolation |
| name | text | NOT NULL | Assembly name (e.g., "Interior Wall") |
| description | text | | Assembly description |
| category | text | NOT NULL | Grouping category (e.g., "Walls", "Flooring") |
| is_company_template | boolean | default false | Shared vs personal |
| created_by | uuid | FK -> profiles, NOT NULL | Creator |
| version | integer | default 1 | Version number |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

**RLS:** Company members can SELECT; creator or admin can INSERT/UPDATE/DELETE.

#### `assembly_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default `gen_random_uuid()` | Item ID |
| assembly_id | uuid | FK -> estimate_assemblies, NOT NULL | Parent assembly |
| trade | text | NOT NULL | Trade/CSI division |
| description | text | NOT NULL | Item description |
| unit | text | NOT NULL | Unit of measure |
| quantity_multiplier | numeric(10,4) | NOT NULL, default 1.0 | Quantity relative to parent |
| material_id | uuid | FK -> materials, nullable | Link to catalog |
| default_unit_cost | numeric(12,2) | | Fallback unit cost |
| sort_order | integer | default 0 | Display order |
| created_at | timestamptz | NOT NULL, default now() | |

**RLS:** Inherits from parent assembly via company_id join.

#### `estimate_chat_messages`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default `gen_random_uuid()` | Message ID |
| estimate_id | uuid | FK -> estimates, NOT NULL | Parent estimate |
| company_id | uuid | FK -> companies, NOT NULL | Company isolation |
| user_id | uuid | FK -> profiles, NOT NULL | Sender |
| role | text | NOT NULL, check in ('user','assistant') | Message role |
| content | text | NOT NULL | Message body |
| references | jsonb | default '[]' | Plan page/region references |
| created_at | timestamptz | NOT NULL, default now() | |

**RLS:** Company members on matching estimate can SELECT/INSERT.

#### `estimate_revisions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default `gen_random_uuid()` | Revision ID |
| estimate_id | uuid | FK -> estimates, NOT NULL | Parent estimate |
| company_id | uuid | FK -> companies, NOT NULL | Company isolation |
| version_number | integer | NOT NULL | Sequential version |
| parent_revision_id | uuid | FK -> estimate_revisions, nullable | Previous version |
| plan_upload_id | uuid | FK -> plan_uploads, nullable | New plan version |
| change_summary | jsonb | default '{}' | {added: N, removed: N, modified: N, cost_delta: N} |
| created_by | uuid | FK -> profiles, NOT NULL | Who created revision |
| created_at | timestamptz | NOT NULL, default now() | |

**RLS:** Company members on matching estimate can SELECT; estimate owner or admin can INSERT.

### New Columns on Existing Tables

#### `plan_pages` (add columns)
- `page_type` text, nullable, check in ('floor_plan','reflected_ceiling','site_plan','elevation','section','detail','schedule','electrical','plumbing','mechanical','cover','specification','unknown')
- `page_classification` text, nullable, check in ('vector','raster','mixed')
- `classification_confidence` numeric(5,2), nullable

#### `takeoff_items` (add columns)
- `room_context` text, nullable
- `construction_status` text, nullable, check in ('new','existing_to_remain','demolition')
- `extraction_engine` text, nullable, check in ('openai','vector-engine-v1')

#### `estimates` (add columns)
- `template_id` uuid, FK -> pricing_templates, nullable
- `parent_estimate_id` uuid, FK -> estimates, nullable (for revisions)
- `version` integer, default 1

### New Server Actions

| Action | Input | Output | Description |
|--------|-------|--------|-------------|
| `createAssembly` | name, category, items[] | Assembly | Create reusable assembly |
| `getAssemblies` | companyId, category? | Assembly[] | List assemblies |
| `updateAssembly` | assemblyId, updates | Assembly | Modify assembly |
| `deleteAssembly` | assemblyId | void | Remove assembly |
| `applyAssembly` | estimateId, assemblyId, parentItemId | LineItem[] | Expand assembly into line items |
| `sendChatMessage` | estimateId, content | ChatMessage | Send chat message, get AI response |
| `getChatHistory` | estimateId | ChatMessage[] | Load chat history |
| `createRevision` | estimateId, planUploadId | Revision | Create new revision |
| `getRevisionDiff` | revisionId | DiffResult | Compare revision to parent |
| `classifyPages` | planUploadId | PageClassification[] | AI classify uploaded pages |
| `convertToBudget` | estimateId | Budget | Convert estimate to project budget |
| `bulkAcceptItems` | itemIds[] | void | Batch accept takeoff items |
| `bulkRejectItems` | itemIds[] | void | Batch reject takeoff items |
| `respondToMicroConfirmation` | confirmationId, response | ConfidenceUpdate | Submit L8 micro-confirmation answer |

### Real-Time Data Requirements

| Feature | Channel | Payload | Frequency |
|---------|---------|---------|-----------|
| Extraction progress | `extraction_jobs` (Supabase Realtime) | { jobId, status, stage, pageNumber } | Per-job update |
| Progressive results | `takeoff_items` (Supabase Realtime) | { new takeoff item } | Per-item as detected |
| Cost total updates | Client-side only | Computed from local state | On every edit |
| Chat messages (P1) | `estimate:{id}:chat` | { message } | Per message |
| Collaboration (P2) | `estimate:{id}:presence` | { userId, cursor, section } | 200ms throttle |

---

## 9. Component Architecture

### New Components to Create

| # | Component | File Path | Type | Description |
|---|-----------|-----------|------|-------------|
| 1 | `EstimateWizardStepper` | `components/estimates/EstimateWizardStepper.tsx` | Client | Horizontal step indicator with clickable steps, mobile compact mode |
| 2 | `SwipeReviewCard` | `components/estimates/SwipeReviewCard.tsx` | Client | Individual swipeable card with gesture handling, confidence display |
| 3 | `SwipeReviewStack` | `components/estimates/SwipeReviewStack.tsx` | Client | Card stack manager: ordering, confidence grouping, transitions, completion state |
| 4 | `CameraUploadButton` | `components/estimates/CameraUploadButton.tsx` | Client | Mobile camera capture with rear-camera, flash auto, HEIC support, multi-capture |
| 5 | `UploadThumbnailGrid` | `components/estimates/UploadThumbnailGrid.tsx` | Client | Grid of uploaded page thumbnails with classification badges |
| 6 | `StickyCostBar` | `components/estimates/StickyCostBar.tsx` | Client | Fixed bottom bar with running total, expandable trade breakdown |
| 7 | `ConfidenceThresholdSlider` | `components/estimates/ConfidenceThresholdSlider.tsx` | Client | Slider control for bulk-approve threshold |
| 8 | `TradeDonutChart` | `components/estimates/TradeDonutChart.tsx` | Client | Donut chart visualization of cost by trade |
| 9 | `AssemblyPicker` | `components/estimates/AssemblyPicker.tsx` | Client | Assembly library browser with search and apply action |
| 10 | `PlanChatSidebar` | `components/estimates/PlanChatSidebar.tsx` | Client | AI chat interface for plan Q&A (sidebar/bottom sheet) |
| 11 | `RevisionDiffView` | `components/estimates/RevisionDiffView.tsx` | Client | Side-by-side or overlay diff of estimate versions |
| 12 | `MicroConfirmation` | `components/estimates/MicroConfirmation.tsx` | Client | Card-based L8 validation confirmation UI (REQ-UX-019) |
| 13 | `ExtractionProgress` | `components/estimates/ExtractionProgress.tsx` | Client | Per-page extraction progress grid with Realtime subscription (REQ-UX-020) |
| 14 | `PlanOverlayLayer` | `components/estimates/PlanOverlayLayer.tsx` | Client | Trade-colored SVG overlays on plan viewer (REQ-UX-021) |
| 15 | `ConstructionStatusBadge` | `components/estimates/ConstructionStatusBadge.tsx` | Client | Visual badge for new/existing/demolition status (REQ-UX-022) |
| 16 | `ConfidenceSummary` | `components/estimates/ConfidenceSummary.tsx` | Client | Confidence distribution summary with "Accept All High" button (REQ-UX-002) |

### Existing Components to Modify

| # | Component | File Path | Changes |
|---|-----------|-----------|---------|
| 1 | `EstimatesTabClient` | `components/estimates/EstimatesTabClient.tsx` | Add wizard stepper integration, route to `/api/estimates/extract` for vector engine |
| 2 | `TakeoffReviewScreenContent` | `components/estimates/TakeoffReviewScreenContent.tsx` | Add responsive switch: list (desktop) vs swipe cards (mobile), confidence grouping, progressive loading support |
| 3 | `PlanUploadPanel` | `components/estimates/PlanUploadPanel.tsx` | Add camera capture button, thumbnail grid with classification, HEIC support, multi-capture, drag-drop enhancement |
| 4 | `PlanViewer` | `components/estimates/PlanViewer.tsx` | Replace mouse-only events with `@use-gesture/react` for touch gestures; add trade overlay layers, construction status overlays, bottom-sheet mode for mobile |
| 5 | `CostEditor` | `components/estimates/CostEditor.tsx` | Integrate sticky cost bar, assembly application, real-time total calculation |
| 6 | `EstimateSummary` | `components/estimates/EstimateSummary.tsx` | Add donut chart, trade breakdown sections, revision history link |
| 7 | `ConfidenceBadge` | `components/estimates/ConfidenceBadge.tsx` | Update thresholds (85% high), add `ShieldCheck`/`AlertTriangle` icons, add 4px confidence bar variant, add numeric detail on tap |
| 8 | `ParseProgressOverlay` | `components/estimates/ParseProgressOverlay.tsx` | Conditionally render `ExtractionProgress` for vector engine, keep existing for GPT-4o |

### Full File Map

```
components/estimates/
  # NEW (16 files)
  ├── EstimateWizardStepper.tsx      # REQ-UX-001
  ├── SwipeReviewCard.tsx            # REQ-UX-002
  ├── SwipeReviewStack.tsx           # REQ-UX-002
  ├── ConfidenceSummary.tsx          # REQ-UX-002 (confidence-grouped review)
  ├── CameraUploadButton.tsx         # REQ-UX-003
  ├── UploadThumbnailGrid.tsx        # REQ-UX-003
  ├── StickyCostBar.tsx              # REQ-UX-004
  ├── ConfidenceThresholdSlider.tsx   # REQ-UX-005
  ├── TradeDonutChart.tsx            # REQ-UX-006
  ├── MicroConfirmation.tsx          # REQ-UX-019 (L8 validation)
  ├── ExtractionProgress.tsx         # REQ-UX-020 (worker queue progress)
  ├── PlanOverlayLayer.tsx           # REQ-UX-021 (trade color overlays)
  ├── ConstructionStatusBadge.tsx    # REQ-UX-022 (new/existing/demo)
  ├── AssemblyPicker.tsx             # REQ-UX-008
  ├── PlanChatSidebar.tsx            # REQ-UX-007
  ├── RevisionDiffView.tsx           # REQ-UX-010
  #
  # MODIFIED (8 files)
  ├── EstimatesTabClient.tsx         # Wizard + extract endpoint routing
  ├── TakeoffReviewScreenContent.tsx # Swipe mode + confidence grouping + progressive loading
  ├── PlanUploadPanel.tsx            # Camera + HEIC + multi-capture + thumbnails
  ├── PlanViewer.tsx                 # Touch gestures + overlays + bottom-sheet mode
  ├── CostEditor.tsx                 # Sticky bar + assemblies
  ├── EstimateSummary.tsx            # Donut chart + trades
  ├── ConfidenceBadge.tsx            # Three-tier system (85% threshold) + icons + bar
  ├── ParseProgressOverlay.tsx       # ExtractionProgress integration
  #
  # UNCHANGED (existing, no modifications needed)
  ├── AddManualItemModal.tsx
  ├── AiBudgetBanner.tsx
  ├── CostLineItemRow.tsx
  ├── EmptyEstimatesState.tsx
  ├── EstimateHistoryList.tsx
  ├── EstimateStatusBadge.tsx
  ├── EstimatesSkeleton.tsx
  ├── EstimatesErrorBoundary.tsx
  ├── EstimatesTab.tsx
  ├── PlanUploadProgress.tsx
  ├── PricingTemplateModal.tsx
  ├── SaveTemplateModal.tsx
  ├── TakeoffItemEditModal.tsx
  ├── TakeoffItemList.tsx
  ├── TakeoffItemRow.tsx
  └── TakeoffReviewScreen.tsx

app/actions/
  # MODIFIED
  ├── estimates.ts                   # New actions: bulkAccept, bulkReject, classifyPages, convertToBudget, respondToMicroConfirmation
  #
  # NEW
  ├── assemblies.ts                  # CRUD for assemblies + applyAssembly
  └── estimate-chat.ts               # sendChatMessage, getChatHistory

supabase/migrations/
  # NEW
  ├── {ts}_create_estimate_assemblies.sql
  ├── {ts}_create_assembly_items.sql
  ├── {ts}_create_estimate_chat_messages.sql
  ├── {ts}_create_estimate_revisions.sql
  ├── {ts}_add_plan_pages_classification.sql
  └── {ts}_add_takeoff_items_extraction_metadata.sql
```

---

## 10. Competitive Feature Matrix

| Feature | GenHub v1 | GenHub v3 | Togal.AI | STACK | Attentive.ai | Procore | Beam AI | PlanSwift | Bluebeam | ConEst | Buildxact |
|---------|-----------|-----------|----------|-------|-------------|---------|---------|-----------|----------|--------|-----------|
| AI plan parsing | Basic | Vector engine + GPT-4o | Advanced | No | Advanced | No | Advanced | No | No | No | No |
| One-click AI takeoff | No | Yes (REQ-UX-001) | Yes ("Togal Button") | No | Yes | No | Yes | No | No | No | No |
| Swipe review (mobile) | No | Yes (REQ-UX-002) | No | No | No | No | No | No | No | No | No |
| Confidence-grouped bulk review | No | Yes (REQ-UX-002) | No | Yes (partial) | No | Yes (partial) | No | No | No | No | No |
| Camera capture | No | Yes + HEIC + multi-capture (REQ-UX-003) | No | No | No | No | Yes | No | No | No | No |
| Progressive wizard | Implicit | Explicit stepper (REQ-UX-001) | Implicit | Yes | Guided | Yes | Guided | No | No | Yes | Yes (3-step) |
| Confidence scoring | Basic badge | Three-tier 85% + icons + bar (REQ-UX-005) | Internal only | N/A | Yes (98% claim) | N/A | Yes | N/A | N/A | N/A | N/A |
| Micro-confirmations (L8) | No | Yes (REQ-UX-019) | No | No | QA team | No | No | No | No | No | No |
| Progressive result loading | No | Yes (REQ-UX-023) | No | No | No | No | Yes | No | No | No | No |
| Plan color overlays by trade | No | Yes (REQ-UX-021) | No | No | Yes | No | No | Yes (layers) | No | No | No |
| Construction status visuals | No | Yes (REQ-UX-022) | No | No | No | No | No | Yes (conditions) | No | No | No |
| Extraction progress (per-page) | No | Yes (REQ-UX-020) | Basic | No | No | No | Basic | No | No | No | No |
| Bulk accept/reject | No | Yes (REQ-UX-002/005) | Yes | Yes | Yes | Yes | Yes | No | No | No | No |
| Trade breakdown chart | No | Donut chart (REQ-UX-006) | Yes | Yes | Yes | Yes | Basic | No | No | Yes | Yes |
| Sticky cost totals | No | Yes (REQ-UX-004) | Yes | Yes | No | Yes | No | No | No | No | No |
| Assemblies system | No | Yes (REQ-UX-008) | No | Yes | No | Yes | No | No | No | No | No |
| Material catalog link | No | Yes (REQ-UX-014) | No | Yes (regional DB) | No | Yes (RSMeans) | No | No | No | Yes | Yes (suppliers) |
| AI plan chat | No | Yes (REQ-UX-007) | Yes (Togal.CHAT) | No | No | No | No | No | No | No | No |
| Revision comparison | No | Yes (REQ-UX-010) | Yes | Yes | No | Yes | No | No | Yes | No | No |
| PDF export w/ branding | Basic | Branded (REQ-UX-011) | Yes | Yes | Yes | Yes | Basic | Yes | Yes | Yes | Yes |
| Estimate-to-budget | No | Yes (REQ-UX-012) | No | No | No | Yes | No | No | No | No | No |
| Template management | Basic | Enhanced (REQ-UX-013) | No | Yes | No | Yes | No | No | No | No | Yes |
| On-plan measurements | No | P2 (REQ-UX-015) | Yes | Yes | No | Yes | No | Yes | Yes (stamps) | No | No |
| Real-time collaboration | No | P2 (REQ-UX-016) | Yes | No | No | Yes | No | No | Yes (Sessions) | No | No |
| Offline mode | No | P2 (REQ-UX-017) | No | No | No | Yes (native) | No | No | No | No | No |
| Historical analytics | No | P2 (REQ-UX-018) | Basic | Yes | No | Yes | No | No | No | Yes | No |
| Mobile-first design | Partial | Full (bottom-sheet plan, swipe cards, camera-first) | Desktop-first | Desktop-first | Desktop-only | Mixed (native limited) | Mobile-friendly | Desktop-only (Windows) | Desktop-only | Desktop-only | Mobile-friendly |
| Multi-page batch | Basic | Per-page grid + worker queue (REQ-UX-009/020) | Yes | Yes | Yes | Yes | Yes | No | No | No | No |
| Page type classification | No | Yes (13 types, Section 7) | Yes | No | No | No | Yes | No | No | No | No |
| Hyperlinked cross-references | No | P1 via AI chat (REQ-UX-007) | No | No | No | No | No | No | Yes | No | No |
| Trade-specific workflows | No | Future | No | No | No | No | No | No | No | Yes | No |
| What-if analysis | No | Future | No | No | No | No | No | No | No | Yes | No |
| Supplier integration | No | Future | No | No | No | No | No | No | No | No | Yes |
| Bottom-sheet plan viewer | No | Yes (Section 6) | No | No | No | No | No | No | No | No | No |
| Touch gestures (pinch/pan) | No | Yes (@use-gesture/react, Section 6) | No | No | No | No | Partial | No | No | No | No |

**GenHub v3 Differentiators:**
1. **Only mobile-first estimating tool** with bottom-sheet plan viewer, swipe-to-review, camera capture with HEIC/multi-capture, and sticky totals
2. **AI confidence transparency** - strongest implementation with three-tier scoring, confidence-grouped bulk review, micro-confirmations (L8), and progressive result loading
3. **Vector extraction engine** with 10-layer validation framework - unique in market; zero API cost for vector PDFs
4. **End-to-end in one app** - estimate to budget to project management (matched only by Procore at 10x the price)
5. **Progressive result loading** - matched only by Beam AI; items appear as detected rather than all-at-once
6. **Plan interaction** - trade-colored overlays + construction status visuals + touch gestures; closest to PlanSwift's interaction model but on mobile

---

## 11. NPM Dependencies

| Package | Version | Size | Purpose | Required By |
|---------|---------|------|---------|-------------|
| `framer-motion` | ^12.x | ~32KB gzip | Swipe gestures, card animations, spring physics, layout animations | SwipeReviewCard, SwipeReviewStack, StickyCostBar, MicroConfirmation, progressive item entrance |
| `@use-gesture/react` | ^10.x | ~8KB gzip | **NEW**: Plan viewer pinch-zoom with finger-tracking origin, momentum pan, double-tap-to-zoom, gesture disambiguation | PlanViewer touch gesture upgrade |
| `recharts` | ^2.x | ~45KB gzip | Donut chart, responsive charts | TradeDonutChart, HistoricalAnalytics (P2) |
| `@tanstack/react-virtual` | ^3.x | ~6KB gzip | Virtual scrolling for large item lists (already installed) | TakeoffReviewScreenContent (>50 items) |

**Notes:**
- `framer-motion` is already installed and provides the gesture system needed for swipe cards; also used for spring-based animations on the plan viewer zoom transitions
- `@use-gesture/react` is the recommended **new** dependency (~8KB) specifically for plan viewer touch gestures; provides pinch-zoom with finger-tracking origin, momentum panning with deceleration, and double-tap detection that cannot be replicated with CSS/framer-motion alone
- `recharts` is preferred over chart.js for React integration and SSR compatibility; if already using a chart library in the project, prefer that instead
- `@tanstack/react-virtual` is already installed and replaces the previously recommended `react-window`; preferred for virtual scrolling
- All packages support tree-shaking; use direct imports (e.g., `import { motion } from 'framer-motion'`) to minimize bundle impact

---

## Status

**Document Status:** DRAFT - Pending Review
**Version:** 3.0
**Changelog:**
- v3.0 (2026-02-14): Aligned with design.md v2.4; added REQ-UX-019 through REQ-UX-023; expanded competitive analysis to 9 competitors; updated confidence threshold to 85%; added bottom-sheet plan viewer, touch gestures, progressive loading, micro-confirmations, extraction progress grid, trade overlays, construction status visuals; updated competitive matrix; replaced react-window with @tanstack/react-virtual; added @use-gesture/react dependency
- v2.0 (2026-02-14): Initial competitive analysis with 5 competitors; REQ-UX-001 through REQ-UX-018

**Approval Required:** Yes - approve before proceeding to task generation
**Next Step:** Review requirements, then proceed to `tasks.md`

---

**References:**
- Design spec: `.claude/specs/estimates-v2/design.md` v2.4
- Accuracy framework: `.claude/specs/estimates-v2/accuracy-framework.md` v1.0
- Existing requirements: `.claude/specs/estimates-v2/requirements.md`
- Materials integration: `.claude/specs/estimates-v2/materials-integration-plan.md`
- Competitive research: `.claude/plans/adaptive-fluttering-boot-agent-a1a4704.md`
- Upgrade research: `.claude/specs/estimates-v2/upgrade-research.md`
