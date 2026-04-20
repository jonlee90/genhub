"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { m as motion } from "framer-motion";
import { useRouter } from "next/navigation";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Building2 from "lucide-react/icons/building-2";
import MapPin from "lucide-react/icons/map-pin";
import Calendar from "lucide-react/icons/calendar";
import DollarSign from "lucide-react/icons/dollar-sign";
import TrendingUp from "lucide-react/icons/trending-up";
import Users from "lucide-react/icons/users";
import ClipboardList from "lucide-react/icons/clipboard-list";
import Clock from "lucide-react/icons/clock";
import FileText from "lucide-react/icons/file-text";
import Settings from "lucide-react/icons/settings";
import Activity from "lucide-react/icons/activity";
import Home from "lucide-react/icons/home";
import UtensilsCrossed from "lucide-react/icons/utensils-crossed";
import Factory from "lucide-react/icons/factory";
import ExternalLink from "lucide-react/icons/external-link";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";
import FolderKanban from "lucide-react/icons/folder-kanban";
import FolderOpen from "lucide-react/icons/folder-open";
import Target from "lucide-react/icons/target";
import Calculator from "lucide-react/icons/calculator";
import { Badge } from "@/components/ui/badge";
import { cn, formatBudget, formatPercentWhole } from "@/lib/utils";
import { ProjectTeam } from "./ProjectTeam";
import { ProjectSettings } from "./ProjectSettings";
import { ProjectOverview } from "./ProjectOverview";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { EstimatesTabClient } from "@/components/estimates/EstimatesTabClient";
import {
  TaskModalProvider,
  useTaskModal,
} from "@/components/tasks/TaskModalContext";
import { ProjectFilesTab } from "./files/ProjectFilesTab";
import { useModalData } from "@/hooks/use-modal-data";

// Dynamic import FinancialsTabClient (only loads when Financials tab is active)
const FinancialsTabClient = dynamic(
  () =>
    import("@/components/projects/financials/FinancialsTabClient").then(
      (mod) => ({ default: mod.FinancialsTabClient }),
    ),
  { ssr: false },
);

// Dynamic import TaskModal (only loads when modal opens)
const TaskModal = dynamic(
  () =>
    import("@/components/tasks/TaskModal").then((mod) => ({
      default: mod.TaskModal,
    })),
  { ssr: false },
);

import type {
  ProjectDetailProps,
  ProjectSimple,
} from "@/types/components/projects";
import type {
  TaskWithRelations,
  TeamMember as TaskBoardTeamMember,
  Phase,
} from "@/types/db/task";

type ProjectDetailContentProps = ProjectDetailProps;

// Modal renderer - consumes TaskModalContext
function TaskModalRenderer({
  projects = [],
  teamMembers,
  projectId,
  tasks,
  onSuccess,
  onModalOpen,
  isLoadingModalData,
}: {
  projects?: ProjectSimple[];
  teamMembers: TaskBoardTeamMember[];
  projectId: string;
  tasks: TaskWithRelations[];
  onSuccess: () => void;
  onModalOpen: () => void;
  isLoadingModalData?: boolean;
}) {
  const { isOpen, mode, selectedTask, close } = useTaskModal();

  // Trigger modal data fetch when modal opens (useEffect prevents on every render)
  useEffect(() => {
    if (isOpen) {
      onModalOpen();
    }
  }, [isOpen, onModalOpen]);

  if (!isOpen) return null;

  return (
    <TaskModal
      isOpen={isOpen}
      onClose={close}
      mode={mode}
      task={selectedTask}
      projects={projects}
      teamMembers={teamMembers}
      preselectedProjectId={projectId}
      onSuccess={onSuccess}
      tasks={tasks}
      userRole={null}
      isLoadingData={isLoadingModalData}
    />
  );
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color:
      "bg-construction-green/10 text-construction-green border-construction-green",
    dotColor: "bg-construction-green",
  },
  on_hold: {
    label: "On Hold",
    color:
      "bg-construction-accent/10 text-construction-accent border-construction-accent",
    dotColor: "bg-construction-accent",
  },
  completed: {
    label: "Completed",
    color:
      "bg-construction-blue/10 text-construction-blue border-construction-blue",
    dotColor: "bg-construction-blue",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
    dotColor: "bg-red-500",
  },
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-construction-green";
  if (score >= 60) return "text-construction-blue";
  if (score >= 40) return "text-construction-accent";
  return "text-construction-red";
};

export function ProjectDetailContent({
  project,
  projects = [],
  teamMembers = [],
  phaseTaskStats,
  taskDependencies = [],
  expenseStats,
  taskStats,
  projectFiles = [],
  projectPhotos = [],
  teamCostSummaries = [],
  taskTypes = [],
  userRole,
}: ProjectDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "financials"
    | "team"
    | "tasks"
    | "files"
    | "estimates"
    | "settings"
  >("overview");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Lazy-load modal data (projects + team members) when needed
  const {
    data: modalData,
    fetchData: fetchModalData,
    isLoading,
  } = useModalData();

  // Handler for when primary photo changes - refresh to get updated project data
  const handlePrimaryPhotoChange = useCallback(() => {
    router.refresh();
  }, [router]);

  // Handler to trigger modal data fetch (called when modals open)
  const handleModalOpen = useCallback(() => {
    fetchModalData();
  }, [fetchModalData]);

  // Use lazy-loaded data with fallback to props (always default to empty array)
  const resolvedProjects = modalData?.projects || projects || [];
  const resolvedTeamMembers = modalData?.teamMembers || teamMembers || [];

  // Performance optimization: Memoize computed values
  const statusConfig = useMemo(
    () =>
      STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ||
      STATUS_CONFIG.active,
    [project.status],
  );

  // Get project type icon
  const getProjectTypeIcon = useMemo(() => {
    const iconClass = "w-6 h-6 text-white sm:w-7 sm:h-7 md:w-8 md:h-8";
    switch (project.project_type) {
      case "residential":
        return <Home className={iconClass} />;
      case "restaurant_cafe":
      case "restaurant":
      case "cafe":
        return <UtensilsCrossed className={iconClass} />;
      case "commercial_office":
        return <Building2 className={iconClass} />;
      case "industrial":
        return <Factory className={iconClass} />;
      default:
        return <FolderKanban className={iconClass} />;
    }
  }, [project.project_type]);

  // Format address for Google Maps
  const getGoogleMapsUrl = useMemo(() => {
    if (!project.address) return null;
    const addressParts = [
      project.address,
      project.city,
      project.state,
      project.zip_code,
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  }, [project.address, project.city, project.state, project.zip_code]);

  // Truncate description
  const DESCRIPTION_LIMIT = 150;
  const shouldTruncateDescription = useMemo(
    () => project.description && project.description.length > DESCRIPTION_LIMIT,
    [project.description],
  );

  const displayDescription = useMemo(
    () =>
      !project.description
        ? null
        : isDescriptionExpanded || !shouldTruncateDescription
          ? project.description
          : project.description.slice(0, DESCRIPTION_LIMIT) + "...",
    [project.description, isDescriptionExpanded, shouldTruncateDescription],
  );

  // Calculate project statistics
  const totalTasks = useMemo(() => project.tasks?.length || 0, [project.tasks]);

  const teamSize = useMemo(
    () => project.project_team?.length || 0,
    [project.project_team],
  );

  // Calculate timeline progress
  const getDaysRemaining = useMemo(() => {
    if (!project.end_date) return null;
    const today = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [project.end_date]);

  const daysRemaining = getDaysRemaining;

  return (
    <TaskModalProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Project Header - Streamlined Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Hero Card with Project Identity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-construction-lg overflow-hidden">
            {/* Top Section: Project Identity */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              {/* Row 1: Icon + Name + Status */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Project Type Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-construction-blue/10 rounded-xl transform rotate-2" />
                  <div className="relative p-2.5 bg-gradient-to-br from-[var(--construction-blue)] to-[var(--construction-blue)]/90 rounded-xl shadow-lg sm:p-3.5">
                    {getProjectTypeIcon}
                  </div>
                </div>

                {/* Project Name */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black text-construction-blue tracking-tight leading-tight break-words uppercase sm:text-xl md:text-2xl lg:text-3xl">
                    {project.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-0.5 w-6 bg-construction-accent rounded-full" />
                    <span className="text-[10px] font-bold text-construction-accent uppercase tracking-widest sm:text-xs">
                      {project.project_type?.replace(/_/g, " ") ||
                        "General Construction"}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  className={cn(
                    "px-2.5 py-1.5 text-[10px] font-black border-2 flex items-center gap-1.5 shadow-md whitespace-nowrap flex-shrink-0 uppercase tracking-wider rounded-lg",
                    "sm:px-3 sm:py-2 sm:text-xs",
                    statusConfig.color,
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full animate-pulse",
                      statusConfig.dotColor,
                    )}
                  />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Description (if exists) */}
              {displayDescription && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {displayDescription}
                  </p>
                  {shouldTruncateDescription && (
                    <button
                      onClick={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                      className="mt-2 text-xs font-bold text-construction-blue flex items-center gap-1 min-h-[44px] active:opacity-70"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Show less <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Location Link */}
              {project.address && (
                <div className="mt-3">
                  {getGoogleMapsUrl ? (
                    <a
                      href={getGoogleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 -mx-1 rounded-lg",
                        "text-xs font-semibold text-construction-blue",
                        "bg-construction-blue/5 hover:bg-construction-blue/10",
                        "active:scale-[0.98] transition-all duration-150",
                        "min-h-[44px] sm:text-sm",
                      )}
                    >
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {[project.address, project.city, project.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                      <span>
                        {[project.address, project.city, project.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Section: Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 sm:grid-cols-3 lg:grid-cols-6">
              {/* Budget — wide card, first position */}
              <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-construction-green" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Budget
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 mb-2">
                  <span className="text-sm font-black text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                    {project.budget ? formatBudget(project.budget) : "Not set"}
                  </span>
                  {expenseStats && expenseStats.approvedAmount > 0 ? (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums leading-none">
                      {`${formatBudget(expenseStats.approvedAmount)} spent`}
                    </span>
                  ) : null}
                </div>
                {project.budget && project.budget > 0 && expenseStats ? (
                  <>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          expenseStats.approvedAmount / project.budget > 1
                            ? "bg-construction-red"
                            : expenseStats.approvedAmount / project.budget >=
                                0.75
                              ? "bg-construction-yellow"
                              : "bg-construction-green",
                        )}
                        style={{
                          width: `${Math.min((expenseStats.approvedAmount / project.budget) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {`${formatBudget(project.budget - expenseStats.approvedAmount)} left`}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Progress */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-construction-blue" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-construction-blue rounded-full transition-all duration-500"
                      style={{
                        width: `${project.completion_percentage || 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-black text-construction-blue tabular-nums min-w-[3ch]">
                    {formatPercentWhole(project.completion_percentage || 0)}
                  </span>
                </div>
              </div>

              {/* Health Score */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity
                    className={cn(
                      "h-3.5 w-3.5",
                      getHealthColor(project.health_score || 0),
                    )}
                  />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Health
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (project.health_score || 0) >= 80
                          ? "bg-construction-green"
                          : (project.health_score || 0) >= 60
                            ? "bg-construction-blue"
                            : (project.health_score || 0) >= 40
                              ? "bg-construction-yellow"
                              : "bg-construction-red",
                      )}
                      style={{ width: `${project.health_score || 0}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-black tabular-nums min-w-[3ch]",
                      getHealthColor(project.health_score || 0),
                    )}
                  >
                    {project.health_score || 0}
                  </span>
                </div>
              </div>

              {/* Start Date */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Start
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Not set"}
                </span>
              </div>

              {/* End Date */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Target
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Not set"}
                </span>
              </div>

              {/* Days Remaining */}
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock
                    className={cn(
                      "h-3.5 w-3.5",
                      daysRemaining !== null && daysRemaining < 0
                        ? "text-construction-red"
                        : "text-gray-400 dark:text-gray-500",
                    )}
                  />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {daysRemaining !== null && daysRemaining < 0
                      ? "Overdue"
                      : "Days Left"}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-black tabular-nums",
                    daysRemaining !== null && daysRemaining < 0
                      ? "text-construction-red"
                      : "text-gray-900 dark:text-gray-100",
                  )}
                >
                  {daysRemaining !== null ? Math.abs(daysRemaining) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation - Mobile-First Pill Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative -mx-4 px-4 md:mx-0 md:px-0"
        >
          {/* Industrial accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Scrollable tab container with snap points */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide sm:gap-2 md:gap-3"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Overview Tab */}
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "overview"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Overview</span>
            </button>

            {/* Financials Tab */}
            <button
              onClick={() => setActiveTab("financials")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "financials"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Financials</span>
            </button>

            {/* Team Tab */}
            <button
              onClick={() => setActiveTab("team")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "team"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Team</span>
              {teamSize > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums",
                    activeTab === "team"
                      ? "bg-white/20 text-white"
                      : "bg-construction-blue/10 text-construction-blue",
                  )}
                >
                  {teamSize}
                </span>
              )}
            </button>

            {/* Tasks Tab */}
            <button
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "tasks"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Tasks</span>
              {totalTasks > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums",
                    activeTab === "tasks"
                      ? "bg-white/20 text-white"
                      : "bg-construction-blue/10 text-construction-blue",
                  )}
                >
                  {totalTasks}
                </span>
              )}
            </button>

            {/* Files Tab */}
            <button
              onClick={() => setActiveTab("files")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "files"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Files & Photos</span>
              <span className="sm:hidden">Files</span>
              {(projectFiles?.length || 0) + (projectPhotos?.length || 0) >
                0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums",
                    activeTab === "files"
                      ? "bg-white/20 text-white"
                      : "bg-construction-blue/10 text-construction-blue",
                  )}
                >
                  {(projectFiles?.length || 0) + (projectPhotos?.length || 0)}
                </span>
              )}
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start",
                "min-h-[44px] min-w-[44px] flex-shrink-0",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97]",
                "sm:px-5 sm:py-3 sm:text-sm",
                activeTab === "settings"
                  ? "bg-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
              )}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Content - Lazy rendered: Only active tab is mounted */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <ProjectOverview
              project={project}
              projects={resolvedProjects}
              teamMembers={resolvedTeamMembers}
              phaseTaskStats={phaseTaskStats}
              expenseStats={expenseStats}
              taskStats={taskStats}
              teamCostSummaries={teamCostSummaries}
              taskTypes={taskTypes}
              onModalOpen={handleModalOpen}
              onNavigateToFinancials={() => setActiveTab("financials")}
            />
          )}

          {activeTab === "financials" && (
            <FinancialsTabClient
              projectId={project.id}
              projectName={project.name}
              userRole={userRole || null}
              companyId={project.company_id || ""}
            />
          )}

          {activeTab === "team" && (
            <ProjectTeam
              projectId={project.id}
              companyId={project.company_id || ""}
              team={project.project_team || []}
              costSummaries={
                teamCostSummaries && teamCostSummaries.length > 0
                  ? new Map(
                      teamCostSummaries.map((s) => [
                        s.id,
                        {
                          taskCount: s.taskCount,
                          taskCosts: s.taskCosts,
                          expenseCosts: s.expenseCosts,
                        },
                      ]),
                    )
                  : undefined
              }
            />
          )}

          {activeTab === "tasks" && (
            <TaskBoard
              initialTasks={(project.tasks || []) as TaskWithRelations[]}
              taskDependencies={taskDependencies}
              projects={resolvedProjects}
              teamMembers={resolvedTeamMembers as TaskBoardTeamMember[]}
              initialView="kanban"
              projectId={project.id}
              phases={(project.project_phases || []) as Phase[]}
              taskTypes={taskTypes}
            />
          )}

          {activeTab === "files" && (
            <ProjectFilesTab
              projectId={project.id}
              initialFiles={projectFiles || []}
              initialPhotos={projectPhotos || []}
              currentImageUrl={project.image_url}
              onPrimaryPhotoChange={handlePrimaryPhotoChange}
            />
          )}

          {activeTab === "settings" && (
            <ProjectSettings project={project} userRole={userRole} />
          )}
        </motion.div>

        {/* Task modal - rendered via context */}
        <TaskModalRenderer
          projects={resolvedProjects}
          teamMembers={resolvedTeamMembers as TaskBoardTeamMember[]}
          projectId={project.id}
          tasks={(project.tasks || []) as TaskWithRelations[]}
          onSuccess={() => router.refresh()}
          onModalOpen={handleModalOpen}
          isLoadingModalData={isLoading}
        />
      </div>
    </TaskModalProvider>
  );
}
