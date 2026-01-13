/**
 * ProjectSummary - Re-exports from shared component
 *
 * This file provides backward compatibility for code that imports
 * ProjectSummary from the projects folder. The component has been
 * moved to components/shared/PortfolioSummary.tsx for reuse across
 * different pages.
 *
 * @deprecated Import from '@/components/shared' instead:
 * import { PortfolioSummary, type PortfolioSummaryStats } from '@/components/shared';
 */

export {
  PortfolioSummary as ProjectSummary,
  type PortfolioSummaryStats,
} from '@/components/shared';
