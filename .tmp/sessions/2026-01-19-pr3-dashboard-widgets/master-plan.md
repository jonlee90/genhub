# Master Plan — PR3 Dashboard Widget Consolidation

## Overview

Standardize dashboard widget wrappers by replacing duplicated card/header/skeleton markup with `WidgetCard`, `WidgetHeader`, and `WidgetSkeleton`. This is a refactor-only change with no behavior or data changes.

## Architecture

- Use `components/ui/WidgetCard.tsx` primitives as the shared UI shell.
- Each widget keeps its internal layout but swaps outer card/header wrappers.
- Skeleton loaders use `WidgetSkeleton` for consistent styling.
- `WidgetsGrid` uses the shared skeleton component for loading state.

## Components (Dependency Order)

1. **Widget Primitives Adoption**
   - Scope: Replace duplicated wrapper classes in widget components.
   - Interfaces: `WidgetCard`, `WidgetHeader`, `WidgetSkeleton` props.
   - Dependencies: `components/ui/WidgetCard.tsx`.
   - Risks: Layout drift if header spacing or right-side actions differ.

2. **Widget Skeleton Standardization**
   - Scope: Migrate widget-level skeletons to `WidgetSkeleton`.
   - Interfaces: `WidgetSkeleton` children slots.
   - Dependencies: Widget components + `components/ui/WidgetCard.tsx`.
   - Risks: Height/spacing parity with current skeletons.

3. **WidgetsGrid Loading State**
   - Scope: Replace inline skeleton with `WidgetSkeleton`.
   - Interfaces: `WidgetSkeleton`.
   - Dependencies: `components/dashboard/WidgetsGrid.tsx`.
   - Risks: Loading card size mismatch.

## Validation

- `npm run lint -- --file components/dashboard/ProjectStatusWidget.tsx`
- `npm run lint -- --file components/dashboard/TaskProgressWidget.tsx`
- `npm run lint -- --file components/dashboard/BudgetSummaryWidget.tsx`
- `npm run lint -- --file components/dashboard/ScheduleHealthWidget.tsx`
- `npm run lint -- --file components/dashboard/TeamActivityWidget.tsx`
- `npm run lint -- --file components/dashboard/MaterialsStatusWidget.tsx`
- `npm run lint -- --file components/dashboard/WidgetsGrid.tsx`
- Manual UI spot check on dashboard widgets (desktop + mobile).

## Rollout / Handoff

- No migrations or data changes.
- If visuals drift, revert to previous wrappers for the affected widget only.
