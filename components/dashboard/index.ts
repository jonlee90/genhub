/**
 * Dashboard Components
 *
 * Barrel export file for all dashboard-related components.
 * Used by the app/app/page.tsx and related dashboard views.
 */

// Header
export { DashboardHeader } from './DashboardHeader';

// KPI Components
export { KPICard, type KPICardProps } from './KPICard';
export { KPICardsGrid } from './KPICardsGrid';

// Widget Components
export { ProjectStatusWidget, type ProjectStatusWidgetProps } from './ProjectStatusWidget';
export { TaskProgressWidget, type TaskProgressWidgetProps } from './TaskProgressWidget';
export { BudgetSummaryWidget, type BudgetSummaryWidgetProps } from './BudgetSummaryWidget';
export { ScheduleHealthWidget, type ScheduleHealthWidgetProps } from './ScheduleHealthWidget';
export { TeamActivityWidget, type TeamActivityWidgetProps } from './TeamActivityWidget';
export { MaterialsStatusWidget, type MaterialsStatusWidgetProps } from './MaterialsStatusWidget';

// Grid Components
export { WidgetsGrid, type WidgetsGridProps } from './WidgetsGrid';

// Main Content Component
export { DashboardContent, type DashboardContentProps } from './DashboardContent';
