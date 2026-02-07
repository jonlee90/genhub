# Design: Subcontractor Page Redesign

## Architecture Overview

This is a **frontend-only** redesign. The goal is to restructure `SubcontractorPortfolio` into a single cohesive card matching the `TeamSummary` component pattern, and ensure the overall page layout of `SubcontractorsPageClient` mirrors `TeamPageClient`.

### Current vs Target

**Current `SubcontractorPortfolio`** — Flat layout, no wrapper card:
```
[MetricCard][MetricCard][MetricCard][MetricCard]  ← 4 separate cards
[TradeDistributionCard][PerformanceCard]          ← 2 separate cards
```

**Target (match `TeamSummary` pattern)** — Single cohesive card:
```
┌─────────────────────────────────────────────────┐
│ HEADER: [HardHat Icon] "Subcontractor Details"  │
│         "X active subcontractors"  [Status Badge]│
├─────────────────────────────────────────────────┤
│ 3-col stat grid (Total | Active | Avg Rating)   │
│ using StatCard component                         │
├─────────────────────────────────────────────────┤
│ 2-col grid (Expiring Docs | Trades Count)        │
│ using StatCard component                         │
├─────────────────────────────────────────────────┤
│ Trade Distribution (progress bars)               │
├─────────────────────────────────────────────────┤
│ Performance Ratings (star bars)                  │
└─────────────────────────────────────────────────┘
```

## Components

### 1. `SubcontractorPortfolio` → Redesign (components/team/SubcontractorPortfolio.tsx)

**Changes:**
- Wrap entire component in a single white card container matching `TeamSummary`:
  - `bg-white dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm`
- Add header section with gradient background:
  - Icon box: `w-10 h-10 rounded-xl bg-construction-blue` with `HardHat` icon
  - Title: "Subcontractor Details" (uppercase, construction-blue, text-sm font-bold)
  - Subtitle: "X active subcontractors"
  - Status badge: based on expiring docs count (green "Healthy" / yellow "Docs Expiring" / red "Attention")
- Replace separate `MetricCard` components with `StatCard` from `@/components/ui/stat-card` (matching `TeamSummary` usage):
  - 3-column grid: Total Members | Active | Avg Rating
  - 2-column grid: Expiring Docs | Trade Types (count of unique trades)
- Move `TradeDistributionCard` and `PerformanceDistributionCard` inside the single card as bordered sections (like `roleDistribution` in `TeamSummary`)
- On mobile (`compact` mode): hide trade distribution and performance sections (keep only stat grids)

**Props** — No changes to the interface:
```typescript
interface SubcontractorPortfolioProps {
  subcontractors: SubcontractorsRow[];
  stats: {
    total: number;
    active: number;
    expiringLicenses: number;
    expiringInsurance: number;
  };
  compact?: boolean;
}
```

### 2. `SubcontractorsPageClient` — Minor layout adjustments (components/team/SubcontractorsPageClient.tsx)

The overall page layout already closely matches `TeamPageClient`. Minor adjustments needed:

- **No structural changes** — header, filter bar, grid, and pagination layout remain the same
- The redesigned `SubcontractorPortfolio` will naturally fit into the existing slot
- No changes to mobile/desktop branching logic, filters, pagination, or modal handling

### 3. Remove `MetricCard` local component

The `MetricCard` component inside `SubcontractorPortfolio.tsx` will be replaced by the shared `StatCard` from `@/components/ui/stat-card`. The `TradeDistributionCard` and `PerformanceDistributionCard` sub-components will be inlined as sections within the card body (matching how `TeamSummary` handles `roleDistribution` and `recentJoins`).

## Visual Design Reference

Matching `TeamSummary` (components/team/TeamSummary.tsx):

```
Header Pattern:
┌──────────────────────────────────────────────────┐
│ px-4 py-3.5 border-b bg-gradient-to-r            │
│ [10x10 icon box] Title (sm, uppercase, bold)     │
│                  Subtitle (xs, gray)     [Badge]  │
└──────────────────────────────────────────────────┘

Content Pattern:
┌──────────────────────────────────────────────────┐
│ p-4                                              │
│ grid grid-cols-3 gap-2.5 mb-4  (stat cards)     │
│ grid grid-cols-2 gap-2.5 mb-4  (more stats)     │
│ pt-4 border-t (section separator)                │
│   Trade Distribution bars                        │
│ pt-4 border-t mt-4 (section separator)           │
│   Performance Ratings bars                       │
└──────────────────────────────────────────────────┘
```

## Integration Points

- `SubcontractorPortfolio` is used in `SubcontractorsPageClient` in two places:
  1. Mobile: `<SubcontractorPortfolio subcontractors={subcontractors} stats={stats} compact />`
  2. Desktop: `<SubcontractorPortfolio subcontractors={subcontractors} stats={stats} />`
- No changes to props or call sites needed — the redesign is internal to the component
- `StatCard` import added from `@/components/ui/stat-card`
- Remove unused `MetricCard` sub-component

## Files Modified

| File | Change |
|------|--------|
| `components/team/SubcontractorPortfolio.tsx` | Full redesign to match TeamSummary card pattern |

## No Changes To

- `components/team/SubcontractorsPageClient.tsx` — layout already matches
- `components/team/SubcontractorCard.tsx` — cards already look good
- `app/app/team/subcontractors/page.tsx` — server component unchanged
- No database, Server Actions, or API changes
