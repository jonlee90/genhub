"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import User from "lucide-react/icons/user";
import Mail from "lucide-react/icons/mail";
import Phone from "lucide-react/icons/phone";
import { m as motion } from "framer-motion";
// Vercel: bundle-dynamic-imports - Lazy load MetroJourney (369 lines, heavy animations)
const MetroJourney = dynamic(
  () => import("./MetroJourney").then((mod) => ({ default: mod.MetroJourney })),
  {
    loading: () => (
      <div className="h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
    ),
  },
);
import { ProjectExpenseSummary } from "./ProjectExpenseSummary";
import { ProjectTaskSummary } from "./ProjectTaskSummary";
import { InfoCard } from "./InfoCard";
import { formatDate } from "@/lib/utils";
import type { ProjectOverviewProps } from "@/types/components/projects";
import type { ProjectPhasesRow } from "@/types/db/tables/projects";
import type { TasksRow } from "@/types/db/tables/tasks";
import { TeamCostSummaryCard } from "./TeamCostSummaryCard";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { useDeferredData } from "@/hooks/use-deferred-data";
import {
  getProjectExpenseStats,
  getProjectTeamCosts,
} from "@/app/actions/project-deferred";
import { getProjectFinancialSummary } from "@/app/actions/project-financials";
import {
  ProjectTaskSummarySkeleton,
  ProjectExpenseSummarySkeleton,
  TeamCostSummaryCardSkeleton,
} from "./ProjectOverviewSkeletons";

export function ProjectOverview({
  project,
  projects = [],
  teamMembers = [],
  phaseTaskStats = [],
  expenseStats: initialExpenseStats,
  taskStats: initialTaskStats,
  teamCostSummaries: initialTeamCostSummaries = [],
  taskTypes = [],
  onModalOpen,
  onNavigateToFinancials,
}: ProjectOverviewProps) {
  // Performance optimization: Deferred loading for non-critical data
  // Load expense/task stats 800ms after initial render (high priority deferred)
  const {
    data: statsData,
    loading: statsLoading,
    hasFetched: statsFetched,
  } = useDeferredData({
    fetchFn: () => getProjectExpenseStats({ projectId: project.id }),
    delay: 800,
    cacheKey: `project-${project.id}-stats`,
    enabled: !initialExpenseStats || !initialTaskStats, // Skip if already provided
  });

  // Load team costs 1200ms after initial render (lower priority)
  const {
    data: teamData,
    loading: teamLoading,
    hasFetched: teamFetched,
  } = useDeferredData({
    fetchFn: () => getProjectTeamCosts({ projectId: project.id }),
    delay: 1200,
    cacheKey: `project-${project.id}-team-costs`,
    enabled: initialTeamCostSummaries.length === 0, // Skip if already provided
  });

  // Load financial summary deferred (1400ms — low priority)
  const { data: financialData, hasFetched: financialFetched } = useDeferredData(
    {
      fetchFn: () => getProjectFinancialSummary(project.id),
      delay: 1400,
      cacheKey: `project-${project.id}-financial-summary`,
      enabled: true,
    },
  );

  // Use deferred data if available, fallback to initial props
  const expenseStats = statsFetched
    ? statsData?.expenseStats
    : initialExpenseStats;
  const taskStats = statsFetched ? statsData?.taskStats : initialTaskStats;
  const teamCostSummaries = (
    teamFetched ? (teamData?.teamCostSummaries ?? []) : initialTeamCostSummaries
  ).slice(0, 5);

  // Performance optimization: Memoize computed values to prevent unnecessary recalculations
  const hasPhases = useMemo(
    () => project.project_phases && project.project_phases.length > 0,
    [project.project_phases],
  );

  // Performance optimization: Memoize client fields array to prevent recreation on every render
  const clientFields = useMemo(
    () => [
      {
        label: "Name",
        value: project.client_name,
        show: !!project.client_name,
      },
      {
        label: "Email",
        value: project.client_email,
        icon: Mail,
        href: project.client_email ?? undefined,
        hrefType: "email" as const,
        show: !!project.client_email,
      },
      {
        label: "Phone",
        value: project.client_phone,
        icon: Phone,
        href: project.client_phone ?? undefined,
        hrefType: "tel" as const,
        show: !!project.client_phone,
      },
    ],
    [project.client_name, project.client_email, project.client_phone],
  );

  // Performance optimization: Memoize footer content to prevent recreation on every render
  const clientFooterContent = useMemo(
    () =>
      project.created_at || project.updated_at ? (
        <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-3 col-span-full">
          {project.created_at && (
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {formatDate(project.created_at, { includeYear: true })}
              </div>
            </div>
          )}
          {project.updated_at && (
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Updated
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {formatDate(project.updated_at, { includeYear: true })}
              </div>
            </div>
          )}
        </div>
      ) : undefined,
    [project.created_at, project.updated_at],
  );

  return (
    <div className="space-y-6">
      {/* Project Journey - Full Width Hero Section */}
      {hasPhases && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <MetroJourney
            phases={(project.project_phases || []) as ProjectPhasesRow[]}
            tasks={(project.tasks || []) as TasksRow[]}
            phaseStats={phaseTaskStats}
            projectId={project.id}
            projects={projects}
            teamMembers={(teamMembers || []).filter(
              (
                m,
              ): m is {
                id: string;
                name: string;
                email: string;
                avatar_url: string | null;
              } => !!m.name,
            )}
            taskTypes={taskTypes}
            onModalOpen={onModalOpen}
          />
        </motion.div>
      )}

      {/* Two-Column Layout: Main Content + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column - 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.3 : 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Task Summary Widget - Deferred Loading */}
          {statsLoading && !taskStats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectTaskSummarySkeleton />
            </motion.div>
          ) : taskStats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ProjectTaskSummary
                taskStats={taskStats}
                projectBudget={project.budget ?? undefined}
              />
            </motion.div>
          ) : null}

          {/* Expense Summary Widget - Deferred Loading */}
          {statsLoading && !expenseStats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectExpenseSummarySkeleton />
            </motion.div>
          ) : expenseStats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ProjectExpenseSummary
                expenseStats={expenseStats}
                budget={project.budget ?? 0}
              />
            </motion.div>
          ) : null}
        </motion.div>

        {/* Sidebar Column - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.35 : 0.15 }}
          className="space-y-6"
        >
          {/* Client Information */}
          {(project.client_name ||
            project.client_email ||
            project.client_phone) && (
            <InfoCard
              headerIcon={User}
              headerTitle="Client Information"
              headerDescription="Primary contact"
              columns={1}
              fields={clientFields}
              footerContent={clientFooterContent}
            />
          )}

          {/* Budget Summary Card - Deferred Loading */}
          {financialFetched && financialData ? (
            <BudgetSummaryCard
              summary={financialData.data ?? null}
              onNavigateToFinancials={onNavigateToFinancials}
            />
          ) : null}

          {/* Team Cost Summary Card - Deferred Loading */}
          {teamLoading && teamCostSummaries.length === 0 ? (
            <TeamCostSummaryCardSkeleton />
          ) : teamCostSummaries.length > 0 ? (
            <TeamCostSummaryCard summaries={teamCostSummaries} />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
