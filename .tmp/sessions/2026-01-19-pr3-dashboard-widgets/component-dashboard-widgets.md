# Component Plan — Dashboard Widgets

## Overview

Replace duplicated widget wrappers with shared widget primitives. Behavior remains unchanged; this is a wrapper-only refactor.

## Architecture

- Each widget imports `WidgetCard` and `WidgetHeader`.
- Skeletons use `WidgetSkeleton` for consistent borders and padding.
- Widgets keep internal structure; only outer wrapper/header and skeleton container change.

## Components (Dependency Order)

1. **Widget Cards/Headers**
   - Scope: Update widget wrappers and headers in:
     - `components/dashboard/ProjectStatusWidget.tsx`
     - `components/dashboard/TaskProgressWidget.tsx`
     - `components/dashboard/BudgetSummaryWidget.tsx`
     - `components/dashboard/ScheduleHealthWidget.tsx`
     - `components/dashboard/TeamActivityWidget.tsx`
     - `components/dashboard/MaterialsStatusWidget.tsx`
   - Interfaces: `WidgetCard` (`interactive`), `WidgetHeader` (`icon`, `title`, `right`, `className`)
   - Dependencies: `components/ui/WidgetCard.tsx`
   - Risks: Header spacing/CTA alignment drift.

2. **Widget Skeletons**
   - Scope: Replace skeleton wrappers with `WidgetSkeleton` in the same widgets.
   - Interfaces: `WidgetSkeleton` children slot
   - Dependencies: `components/ui/WidgetCard.tsx`
   - Risks: Height or spacing mismatch.

3. **WidgetsGrid Loading State**
   - Scope: Replace inline skeleton with `WidgetSkeleton`.
   - Dependencies: `components/dashboard/WidgetsGrid.tsx`
   - Risks: Skeleton height drift.

## Validation

- `npm run lint -- --file components/dashboard/ProjectStatusWidget.tsx`
- `npm run lint -- --file components/dashboard/TaskProgressWidget.tsx`
- `npm run lint -- --file components/dashboard/BudgetSummaryWidget.tsx`
- `npm run lint -- --file components/dashboard/ScheduleHealthWidget.tsx`
- `npm run lint -- --file components/dashboard/TeamActivityWidget.tsx`
- `npm run lint -- --file components/dashboard/MaterialsStatusWidget.tsx`
- `npm run lint -- --file components/dashboard/WidgetsGrid.tsx`
- Manual UI spot check on dashboard widgets (desktop + mobile).
