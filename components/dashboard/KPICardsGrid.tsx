"use client";

import { useMemo } from "react";
import {
  FolderKanban,
  ClipboardList,
  Wallet,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { KPICard, type KPICardProps } from "./KPICard";
import type { DashboardKPIs } from "@/types/dashboard";
import { formatPercentWhole, formatBudget } from "@/lib/utils";

interface KPICardsGridProps {
  kpis: DashboardKPIs;
  isLoading?: boolean;
}

/**
 * Determines the appropriate variant based on KPI context and value
 */
function getVariant(
  type: "projects" | "tasks" | "budget" | "schedule" | "approvals" | "team",
  kpis: DashboardKPIs,
): KPICardProps["variant"] {
  switch (type) {
    case "projects":
      return kpis.activeProjects > 0 ? "default" : "warning";

    case "tasks":
      return kpis.tasksOverdue > 0 ? "warning" : "default";

    case "budget":
      if (kpis.budgetUtilization < 80) return "success";
      if (kpis.budgetUtilization <= 100) return "warning";
      return "danger";

    case "schedule":
      const total =
        kpis.scheduleOnTime + kpis.scheduleAtRisk + kpis.scheduleDelayed;
      if (total === 0) return "default";
      const onTimePercent = (kpis.scheduleOnTime / total) * 100;
      if (onTimePercent >= 80) return "success";
      if (onTimePercent >= 60) return "warning";
      return "danger";

    case "approvals":
      return kpis.totalExpenses > 0 ? "warning" : "default";

    case "team":
      return "default";

    default:
      return "default";
  }
}

/**
 * KPICardsGrid - Mobile-first KPI card grid
 *
 * Features:
 * - Horizontal scroll on mobile (2 cards visible)
 * - 3 columns on tablet, 6 columns on desktop
 * - Touch-friendly cards with 44px+ tap targets
 * - Snap scrolling on mobile
 */
export function KPICardsGrid({ kpis, isLoading = false }: KPICardsGridProps) {
  const scheduleOnTimePercentRaw = useMemo(() => {
    const scheduleTotal =
      kpis.scheduleOnTime + kpis.scheduleAtRisk + kpis.scheduleDelayed;
    return scheduleTotal > 0
      ? (kpis.scheduleOnTime / scheduleTotal) * 100
      : 100;
  }, [kpis.scheduleOnTime, kpis.scheduleAtRisk, kpis.scheduleDelayed]);

  // Loading state: render 6 skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <KPICard
            key={`skeleton-${index}`}
            title=""
            value=""
            icon={FolderKanban}
            variant="default"
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  // Define the 6 KPI cards
  const cards: Array<Omit<KPICardProps, "isLoading"> & { key: string }> = [
    {
      key: "active-projects",
      title: "Projects",
      value: kpis.activeProjects,
      subtitle: `${kpis.totalProjects} total`,
      icon: FolderKanban,
      variant: getVariant("projects", kpis),
      trend:
        kpis.projectsTrend !== 0
          ? {
              value: Math.abs(kpis.projectsTrend),
              direction:
                kpis.projectsTrend > 0
                  ? "up"
                  : kpis.projectsTrend < 0
                    ? "down"
                    : "neutral",
              label: "vs last month",
            }
          : undefined,
      href: "/app/projects",
    },
    {
      key: "tasks-week",
      title: "Tasks",
      value: kpis.tasksThisWeek,
      subtitle:
        kpis.tasksOverdue > 0
          ? `${kpis.tasksOverdue} overdue`
          : `${kpis.tasksDueToday} due today`,
      icon: ClipboardList,
      variant: getVariant("tasks", kpis),
      href: "/app/tasks",
    },
    {
      key: "budget-health",
      title: "Budget",
      value: formatPercentWhole(kpis.budgetUtilization),
      subtitle: `${formatBudget(kpis.totalActualSpend)} spent`,
      icon: Wallet,
      variant: getVariant("budget", kpis),
      trend:
        kpis.budgetUtilization > 100
          ? {
              value: Math.round(kpis.budgetUtilization - 100),
              direction: "up",
              label: "over",
            }
          : undefined,
      href: "/app/budget",
    },
    {
      key: "schedule-status",
      title: "Schedule",
      value: formatPercentWhole(scheduleOnTimePercentRaw),
      subtitle:
        kpis.scheduleDelayed > 0
          ? `${kpis.scheduleDelayed} delayed`
          : `${kpis.scheduleOnTime} on time`,
      icon: Clock,
      variant: getVariant("schedule", kpis),
      href: "/app/schedule",
    },
    {
      key: "pending-approvals",
      title: "Approvals",
      value: kpis.totalExpenses + kpis.pendingApprovals,
      subtitle:
        kpis.totalExpenseAmount > 0
          ? formatBudget(kpis.totalExpenseAmount)
          : "All caught up",
      icon: AlertCircle,
      variant: getVariant("approvals", kpis),
      href: "/app/expenses?status=pending",
    },
    {
      key: "team-size",
      title: "Team",
      value: kpis.teamSize,
      subtitle:
        kpis.unassignedTasks > 0
          ? `${kpis.unassignedTasks} unassigned`
          : "All assigned",
      icon: Users,
      variant: getVariant("team", kpis),
      href: "/app/team",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {cards.map((card) => (
        <KPICard
          key={card.key}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          trend={card.trend}
          variant={card.variant}
          href={card.href}
        />
      ))}
    </div>
  );
}
