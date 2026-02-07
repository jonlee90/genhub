# Implementation Tasks: Subcontractor Page Redesign

## Task 1: Redesign SubcontractorPortfolio to match TeamSummary card pattern

- **Agent**: frontend-engineer
- **Skills**: vercel-react-best-practices
- **Files**: `components/team/SubcontractorPortfolio.tsx`
- **Depends on**: None
- **Acceptance**:
  - Component renders as a single white card with rounded corners, border, shadow (matching TeamSummary wrapper)
  - Header section has: HardHat icon box (construction-blue), "Subcontractor Details" title, active count subtitle, health status badge
  - Stat grids use `StatCard` from `@/components/ui/stat-card` instead of local `MetricCard`
  - Trade distribution and performance ratings render as inline sections with `border-t` separators (not separate cards)
  - `compact` mode (mobile) hides trade/performance sections, shows only stat grids
  - Dark mode support preserved
  - No props interface changes
- **Estimated complexity**: Medium

## Task 2: Build verification and code review

- **Agent**: code-reviewer
- **Skills**: code-review
- **Depends on**: Task 1
- **Acceptance**:
  - `npm run build` passes
  - `npm run lint` passes
  - `npm run lint:ts` passes
  - No Supabase usage in client component
  - 44px touch targets on any interactive elements
  - Dark mode classes present on all elements
  - StatCard import is correct
  - Component matches TeamSummary visual pattern
- **Estimated complexity**: Simple
