# Requirements: Materials-Estimates Integration

> **Status:** Draft
> **Created:** 2026-02-16
> **Module:** Estimates + Materials

## Problem Statement

The Materials module (Home Depot catalog via SerpAPI, price tracking, procurement workflow) and the Estimates module (AI plan parsing, takeoff items, cost line items) are **partially connected** — bridge code exists (`material-suggestions.ts`, UI components) but the foundational `material_id` FK migration is unapplied. Costs on parsed estimates default to $0 because the AI only extracts quantities. This spec connects the two modules so estimates get real catalog prices, stay current, and flow into procurement.

## Goal

Accurate estimates powered by real Home Depot prices, with minimal SerpAPI spend ($75/mo Developer plan = 5,000 calls/month).

## API Budget Constraints

- **Plan:** SerpAPI Developer ($75/mo, 5,000 calls)
- **Target steady-state:** ~163 calls/month (3.3% of budget)
- **Budget breakdown:**
  - Price sync cron (optimized): ~43 calls/mo
  - 10 estimates x ~9 calls each: ~90 calls/mo
  - Ad-hoc searches: ~30 calls/mo

---

## Top 10 Use Cases

| # | Use Case | API Calls | Value |
|---|----------|-----------|-------|
| 1 | **Auto-fill costs from catalog** — parsed line items get real prices instead of $0 | 0 (catalog only) | Critical |
| 2 | **One-click bulk match** — link all unlinked line items to best catalog match | 0 (catalog only) | Critical |
| 3 | **Live price cascade** — when daily cron updates a material price, all linked estimates update | 0 (cron does it) | High |
| 4 | **Estimate-to-procurement** — approved estimate -> material orders with `needed` status | 0 | High |
| 5 | **Search Home Depot inline** — when no catalog match, search HD and add product in one step | 1-2 per search | High |
| 6 | **Pricing templates linked to materials** — template costs auto-update from catalog | 0 | Medium |
| 7 | **Unit-of-measure conversion** — 100 LF of 2x4 -> 13 studs (each) with auto-conversion | 0 | Medium |
| 8 | **Material cost analytics** — per-trade cost breakdown, unlinked item warnings | 0 | Medium |
| 9 | **AI-assisted search** — use takeoff description ("3/4 CDX plywood 4x8") as HD search query | 1 per unique item | Medium |
| 10 | **Price trend indicators** — sparkline/badge on line items showing 30-day price trend | 0 (uses `material_price_history`) | Low |

---

## User Stories (EARS Format)

### US-1: Auto-fill Costs from Catalog
**When** an AI-parsed estimate has line items with $0 cost,
**the system shall** automatically match each line item to the closest material in the company catalog and fill in the unit price.

**Acceptance Criteria:**
- AC-1.1: Line items with matching catalog materials show the catalog price as `unit_cost`
- AC-1.2: Match confidence score >= 70 triggers auto-link
- AC-1.3: Items below threshold show "No match" with manual search option
- AC-1.4: Zero API calls consumed (catalog-only matching)

### US-2: One-Click Bulk Match
**When** a user views an estimate with unlinked line items,
**the system shall** provide a "Match All" button that links all eligible items to catalog materials in one action.

**Acceptance Criteria:**
- AC-2.1: Button shows count of unmatchable items (e.g., "Match 12/15 items")
- AC-2.2: Bulk operation completes in < 3 seconds for 50 items
- AC-2.3: Results summary shows matched, skipped, and failed counts
- AC-2.4: Each linked item updates `material_id` FK and `unit_cost`

### US-3: Live Price Cascade
**When** a material price is updated by the daily sync cron,
**the system shall** automatically update the `unit_cost` on all linked estimate line items in draft or reviewed status.

**Acceptance Criteria:**
- AC-3.1: Only draft/reviewed estimates are updated (not approved/archived)
- AC-3.2: Price change is logged for audit trail
- AC-3.3: Estimate total recalculates after cascade
- AC-3.4: Estimate-linked materials get daily sync priority; others weekly

### US-4: Estimate-to-Procurement
**When** a user approves an estimate,
**the system shall** offer to create material orders from all linked line items.

**Acceptance Criteria:**
- AC-4.1: "Create Orders" button appears on approved estimates
- AC-4.2: Creates `material_assignments` with `needed` status
- AC-4.3: Quantities derived from line item quantities with UOM conversion
- AC-4.4: Existing assignments are not duplicated

### US-5: Inline Home Depot Search
**When** no catalog match exists for a line item,
**the system shall** allow the user to search Home Depot and save + link a product in one step.

**Acceptance Criteria:**
- AC-5.1: Search uses takeoff description as default query
- AC-5.2: Results show product image, price, and relevance
- AC-5.3: Selected product saves to catalog AND links to line item
- AC-5.4: Search results cached for 24 hours (1-2 API calls per search)

### US-6: Pricing Templates Linked to Materials
**When** a pricing template item is linked to a catalog material,
**the system shall** auto-update the template cost when the material price changes.

**Acceptance Criteria:**
- AC-6.1: `pricing_template_items` gains `material_id` FK
- AC-6.2: Template costs update on price sync
- AC-6.3: Unlinking preserves the last-known price

### US-7: Unit-of-Measure Conversion
**When** matching line items to materials with different units,
**the system shall** convert between compatible units (LF -> each, SF -> sheet, etc.).

**Acceptance Criteria:**
- AC-7.1: Compatible unit groups defined (length, area, volume, count)
- AC-7.2: Conversion factors stored in category mapping
- AC-7.3: Converted quantity shown alongside original

### US-8: Material Cost Analytics
**When** viewing an estimate summary,
**the system shall** show per-trade material cost breakdown and flag unlinked items.

**Acceptance Criteria:**
- AC-8.1: Donut chart shows cost by trade
- AC-8.2: Warning badge on unlinked items
- AC-8.3: "X of Y items linked" progress indicator

### US-9: AI-Assisted Search
**When** a user clicks "Search" on an unlinked item,
**the system shall** pre-fill the search with the AI-parsed description.

**Acceptance Criteria:**
- AC-9.1: Description text used as search query
- AC-9.2: Results ranked by relevance to trade category
- AC-9.3: One API call per unique search term (cached)

### US-10: Price Trend Indicators
**When** viewing a linked line item,
**the system shall** show a 30-day price trend badge (up/down/stable).

**Acceptance Criteria:**
- AC-10.1: Uses existing `material_price_history` data
- AC-10.2: Badge shows direction and percentage change
- AC-10.3: Zero API calls (computed from cached history)

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | API calls must stay under 5,000/month (target: <200) |
| NFR-2 | Bulk match must complete in < 3 seconds for 50 items |
| NFR-3 | Price cascade must not block user interactions |
| NFR-4 | All UI follows mobile-first PWA patterns (44px touch, dark mode) |
| NFR-5 | Cache hit rate > 90% for repeat searches |
