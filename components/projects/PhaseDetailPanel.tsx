"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import X from "lucide-react/icons/x";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Calendar from "lucide-react/icons/calendar";
import ListTodo from "lucide-react/icons/list-todo";
import Target from "lucide-react/icons/target";
import TrendingUp from "lucide-react/icons/trending-up";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Zap from "lucide-react/icons/zap";
import { Button } from "@/components/ui/button";
import { TaskModalTrigger } from "@/components/tasks/TaskModalTrigger";
import { useTaskModal } from "@/components/tasks/TaskModalContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { m as motion } from "framer-motion";
import { cn, formatPercentWhole, formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types/db/task";
import type { ProjectPhasesRow } from "@/types/db/tables/projects";
import type { TasksRow } from "@/types/db/tables/tasks";

type Phase = ProjectPhasesRow;
type Task = TasksRow & {
  assignees?: Array<{
    id: string;
    user_id: string | null;
    subcontractor_id: string | null;
    user?: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
    subcontractor?: {
      id: string;
      contact_name: string;
      company_name: string;
    } | null;
  }>;
};

// Transform PhaseDetailPanel tasks to TaskCard format
function transformToTaskWithRelations(task: Task): TaskWithRelations {
  // Get first assignee for TaskCard (which expects single assignee)
  const firstAssignee = task.assignees?.[0];
  const assignee = firstAssignee
    ? {
        id: firstAssignee.user?.id || firstAssignee.id,
        name:
          firstAssignee.user?.name ||
          firstAssignee.subcontractor?.contact_name ||
          "Unknown",
        email: "", // TaskCard doesn't display email
        avatar_url: firstAssignee.user?.avatar_url || null,
      }
    : undefined;

  return {
    ...task,
    assignee,
  };
}

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface PhaseDetailPanelProps {
  phase: Phase;
  tasks: Task[];
  stats: PhaseStats;
  projectId: string;
  onClose: () => void;
  projects: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  taskTypes?: any[]; // TaskTypeConfigsRow[]
  onModalOpen?: () => void;
}

export function PhaseDetailPanel({
  phase,
  tasks,
  stats,
  projectId,
  onClose,
  projects = [],
  teamMembers = [],
  taskTypes = [],
  onModalOpen,
}: PhaseDetailPanelProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { openEdit } = useTaskModal();

  // Performance optimization: Memoize computed values
  const statusConfig = useMemo(
    () => ({
      not_started: { label: "Not Started", color: "text-gray-700" },
      in_progress: { label: "In Progress", color: "text-construction-blue" },
      completed: { label: "Completed", color: "text-[#059669]" },
    }),
    [],
  );

  const phaseStatus = useMemo(
    () => statusConfig[phase.status as keyof typeof statusConfig],
    [phase.status, statusConfig],
  );

  // Transform tasks for TaskCard component
  const transformedTasks = useMemo(
    () => tasks.map(transformToTaskWithRelations),
    [tasks],
  );

  // Handle task card click
  const handleTaskClick = useCallback(
    (task: TaskWithRelations) => {
      onModalOpen?.();
      openEdit(task as any);
    },
    [onModalOpen, openEdit],
  );

  const progressPercentageRaw = useMemo(
    () =>
      stats.totalTasks > 0
        ? (stats.completedTasks / stats.totalTasks) * 100
        : 0,
    [stats.totalTasks, stats.completedTasks],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT COLUMN - Phase Info */}
      <div className="space-y-5">
        {/* Header Section */}
        <motion.div
          className="flex items-start justify-between gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200 dark:border-gray-700 w-full">
            {/* Add task button Section */}
            <TaskModalTrigger
              projects={projects}
              teamMembers={teamMembers}
              taskTypes={taskTypes}
              preselectedProjectId={projectId}
              preselectedPhaseId={phase.id}
              variant="default"
              size="sm"
              label="Add Task"
              className="w-full bg-construction-blue hover:bg-construction-blue/90 text-white font-bold shadow-construction min-h-[44px] transition-all"
              onOpen={onModalOpen}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Button>
        </motion.div>

        {/* Date Cards Grid */}
        {(phase.started_at || phase.completed_at) && (
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Start Date Card */}
            {phase.started_at && (
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Started
                </p>
                <div className="flex items-center gap-2 text-construction-blue">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    {formatDate(phase.started_at, { includeYear: true })}
                  </span>
                </div>
              </div>
            )}

            {/* Completed Date Card */}
            {phase.completed_at && (
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Completed
                </p>
                <div className="flex items-center gap-2 text-[#059669]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    {formatDate(phase.completed_at, { includeYear: true })}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons 
        <motion.div
          className="flex flex-col gap-3 pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleApplyTemplates}
            disabled={applyingTemplates || isPending}
            variant="outline"
            className="w-full border-2 border-construction-blue/20 text-construction-blue hover:bg-construction-blue/5 font-bold h-11 transition-all"
          >
            {applyingTemplates ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying Templates...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Task Templates
              </>
            )}
          </Button>
          
        </motion.div>
*/}
        {/* Progress Card - Creative Phase Progress Dashboard */}
        <motion.div
          className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Header Strip */}
          <div className="md:h-1.5 md:bg-gradient-to-r from-[var(--construction-blue)] via-[var(--construction-blue)]/80 to-[#059669]" />

          <div className="md:p-4">
            {/* Top Section: Arc Gauge + Stats */}
            <div className="hidden md:flex items-center gap-4">
              {/* Arc Progress Gauge */}
              <div className="relative flex-shrink-0">
                <svg
                  width="80"
                  height="48"
                  viewBox="0 0 80 48"
                  className="overflow-visible"
                >
                  {/* Background arc */}
                  <path
                    d="M 8 44 A 32 32 0 0 1 72 44"
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="1"
                    style={{
                      colorScheme: "light",
                    }}
                  />
                  {/* Progress arc - animated */}
                  <motion.path
                    d="M 8 44 A 32 32 0 0 1 72 44"
                    fill="none"
                    stroke="var(--construction-blue)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="100.53"
                    initial={{ strokeDashoffset: 100.53 }}
                    animate={{
                      strokeDashoffset:
                        100.53 - (progressPercentageRaw / 100) * 100.53,
                    }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  />
                  {/* Tick marks */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const angle = (Math.PI * tick) / 100;
                    const x1 = 40 - 26 * Math.cos(angle);
                    const y1 = 44 - 26 * Math.sin(angle);
                    const x2 = 40 - 30 * Math.cos(angle);
                    const y2 = 44 - 30 * Math.sin(angle);
                    return (
                      <line
                        key={tick}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          tick <= progressPercentageRaw
                            ? "var(--construction-blue)"
                            : "#D1D5DB"
                        }
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Center percentage */}
                <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                  <motion.span
                    className="text-lg font-black text-construction-blue tabular-nums"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    {formatPercentWhole(progressPercentageRaw)}
                  </motion.span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* Completed */}
                <motion.div
                  className="flex items-center gap-2 p-2 bg-[#059669]/10 dark:bg-[#059669]/20 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Completed
                    </p>
                    <p className="text-sm font-bold text-[#059669] tabular-nums">
                      {stats.completedTasks}
                    </p>
                  </div>
                </motion.div>

                {/* Remaining */}
                <motion.div
                  className="flex items-center gap-2 p-2 bg-construction-blue/5 dark:bg-construction-blue/20 rounded-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Target className="w-4 h-4 text-construction-blue" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Left
                    </p>
                    <p className="text-sm font-bold text-construction-blue tabular-nums">
                      {stats.totalTasks - stats.completedTasks}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Task Distribution Bar */}
            <motion.div
              className="hidden md:block mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Task Distribution
                </span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                  {stats.totalTasks} total
                </span>
              </div>

              {stats.totalTasks > 0 ? (
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  {/* Completed segment */}
                  {stats.completedTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#059669]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(stats.completedTasks / stats.totalTasks) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  )}
                  {/* In Progress segment (remaining - blocked - overdue) */}
                  {(() => {
                    const inProgressTasks =
                      stats.totalTasks -
                      stats.completedTasks -
                      stats.blockedTasks -
                      stats.overdueTasks;
                    return inProgressTasks > 0 ? (
                      <motion.div
                        className="h-full bg-[#3B82F6]"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(inProgressTasks / stats.totalTasks) * 100}%`,
                        }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                      />
                    ) : null;
                  })()}
                  {/* Overdue segment */}
                  {stats.overdueTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#F59E0B]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(stats.overdueTasks / stats.totalTasks) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 1.0 }}
                    />
                  )}
                  {/* Blocked segment */}
                  {stats.blockedTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#DC2626]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(stats.blockedTasks / stats.totalTasks) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 1.1 }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full" />
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#059669] rounded-full" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Active
                  </span>
                </div>
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Overdue
                    </span>
                  </div>
                )}
                {stats.blockedTasks > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#DC2626] rounded-full" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Blocked
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Contextual Insight Banner */}
            <motion.div
              className={cn(
                "md:mt-4 p-2.5 rounded-lg flex items-center gap-2",
                progressPercentageRaw === 100
                  ? "bg-[#059669]/10 border border-[#059669]/20 dark:bg-[#059669]/20 dark:border-[#059669]/40"
                  : progressPercentageRaw >= 75
                    ? "bg-construction-blue/5 border border-construction-blue/10 dark:bg-construction-blue/15 dark:border-construction-blue/30"
                    : stats.blockedTasks > 0 || stats.overdueTasks > 0
                      ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20 dark:bg-[#F59E0B]/20 dark:border-[#F59E0B]/40"
                      : "bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800",
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              {progressPercentageRaw === 100 ? (
                <>
                  <div className="p-1 bg-[#059669]/20 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <span className="text-xs font-medium text-[#059669]">
                    Phase Complete! All tasks finished.
                  </span>
                </>
              ) : progressPercentageRaw >= 75 ? (
                <>
                  <div className="p-1 bg-construction-blue/10 rounded">
                    <TrendingUp className="w-3.5 h-3.5 text-construction-blue" />
                  </div>
                  <span className="text-xs font-medium text-construction-blue">
                    Great progress! {stats.totalTasks - stats.completedTasks}{" "}
                    tasks to go.
                  </span>
                </>
              ) : stats.blockedTasks > 0 || stats.overdueTasks > 0 ? (
                <>
                  <div className="p-1 bg-[#F59E0B]/20 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  </div>
                  <span className="text-xs font-medium text-[#B45309]">
                    {stats.blockedTasks > 0 && stats.overdueTasks > 0
                      ? `${stats.blockedTasks} blocked, ${stats.overdueTasks} overdue - needs attention`
                      : stats.blockedTasks > 0
                        ? `${stats.blockedTasks} blocked task${stats.blockedTasks > 1 ? "s" : ""} - review dependencies`
                        : `${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""} - consider priority`}
                  </span>
                </>
              ) : stats.totalTasks === 0 ? (
                <>
                  <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                    <Zap className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    No tasks yet. Add tasks to track progress.
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                    <Zap className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Keep going! {stats.totalTasks - stats.completedTasks} tasks
                    remaining.
                  </span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN - Task List */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Task List with Fixed Height and Scroll */}
        {transformedTasks.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <ListTodo className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-bold mb-1">
              No Tasks Yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click "Add New Task" to get started
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {transformedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskClick={handleTaskClick}
                showEditIndicator={true}
              />
            ))}
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 8px;
            transition: background 0.2s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7684;
          }
        }
      `}</style>
    </div>
  );
}
