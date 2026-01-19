"use client";

import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertTriangle,
  Ban,
  Package,
  Pencil,
  Layers as LayersIcon,
  Box,
  Receipt,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { TASK_PRIORITY_CONFIG } from "@/lib/config/task-colors";
import { getTaskTypeDisplayConfig } from "@/lib/config/task-type-display";
import type { TaskWithRelations, Phase } from "@/types/db/task";

interface TaskCardProps {
  task: TaskWithRelations;
  isDragging?: boolean;
  onTaskClick?: (task: TaskWithRelations) => void;
  /** When provided, we"re in project context - show phase from this array instead of task.phase */
  phases?: Phase[];
  /** Show edit indicator on hover - default true when phases provided */
  showEditIndicator?: boolean;
  /** Optional expense stats to display */
  expenseStats?: {
    count: number;
    totalAmount: number;
  };
}

// All cards use construction-blue border for consistent branding
const CARD_BORDER = "border-l-4 border-construction-blue";

// Utility functions extracted outside component to prevent recreation on every render
function formatCurrency(amount: number) {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export const TaskCard = React.memo(function TaskCard({
  task,
  isDragging = false,
  onTaskClick,
  phases,
  showEditIndicator,
  expenseStats,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  // When in DragOverlay (isDragging=true), don"t apply transform
  // The DragOverlay handles positioning via its own internal transform
  const style = isDragging
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  // Parse due date properly to avoid UTC timezone issues
  const isOverdue = useMemo(() => {
    if (!task.due_date || task.status === "completed") return false;
    const [year, month, day] = task.due_date
      .split("T")[0]
      .split("-")
      .map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }, [task.due_date, task.status]);

  const isBlocked = task.status === "blocked";

  // In project context (phases provided), look up phase from phases array
  const phase = useMemo(
    () => (phases ? phases.find((p) => p.id === task.phase_id) : task.phase),
    [phases, task.phase_id, task.phase],
  );

  // Show edit indicator when explicitly set, or when in project context (phases provided)
  const shouldShowEditIndicator = showEditIndicator ?? !!phases;

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  const hasMaterials = task.materialStats && task.materialStats.count > 0;
  const hasExpenses = expenseStats && expenseStats.count > 0;

  // Check if task has 3D location
  const has3DLocation = !!task.spatial_marker_id;

  // Get task type configuration with fallback to "work"
  const taskTypeConfig = getTaskTypeDisplayConfig(task.task_type);
  const TaskTypeIcon = taskTypeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-manipulation transition-all duration-200 ease-out",
        isSortableDragging && "opacity-50 scale-95",
        !isSortableDragging && !isDragging && "shadow-md hover:shadow-lg",
      )}
    >
      {/* Separate click handler from drag handler to prevent positioning conflicts */}
      <div
        onClick={() => {
          // Only trigger modal if not dragging AND not in drag preview
          if (!isSortableDragging && !isDragging) {
            onTaskClick?.(task);
          }
        }}
        className="relative"
      >
        <Card
          className={cn(
            "p-3 bg-white hover:shadow-md transition-shadow cursor-pointer relative border-2 group",
            // Apply construction blue border by default
            CARD_BORDER,
            // Blocked state - keep red background
            isBlocked && "bg-red-50",
          )}
        >
          {/* Edit indicator on hover */}
          {shouldShowEditIndicator && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-construction-blue text-white p-1.5 rounded-lg shadow-lg">
                <Pencil className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Priority Badge - Top Right Corner - hidden when edit indicator is showing */}
          <div
            className={cn(
              "absolute top-2 right-2 z-10 animate-badge-pop",
              shouldShowEditIndicator && "group-hover:hidden",
            )}
          >
            <Badge
              variant="secondary"
              className={cn(
                "font-bold text-[10px] px-2 py-0.5",
                priorityConfig.badgeColor,
              )}
            >
              {priorityConfig.label}
            </Badge>
          </div>

          {/* Task Type Badge - Industrial Construction Theme */}
          <div className="mb-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-sm border-2",
                taskTypeConfig.color,
                "border-black/10",
              )}
              title={taskTypeConfig.description}
            >
              <TaskTypeIcon
                className="h-3 w-3 drop-shadow-sm"
                strokeWidth={2.5}
              />
              <span className="text-[10px] font-black tracking-wide uppercase leading-none">
                {taskTypeConfig.label}
              </span>
            </div>
          </div>

          {/* Title and Material Badge */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-sm line-clamp-2 text-gray-900">
                {task.title}
              </h4>
              {/* Material Badge - Industrial Stamped Metal Style */}
              {hasMaterials && (
                <div
                  className="shrink-0 animate-badge-pop"
                  title={`${task.materialStats!.count} materials - ${formatCurrency(task.materialStats!.totalCost)}`}
                >
                  {/* Stamped Metal Badge Design */}
                  <div className="relative">
                    {/* Shadow layers for depth */}
                    <div className="absolute inset-0 bg-construction-accent rounded-lg blur-sm opacity-40 translate-y-0.5" />

                    {/* Main badge with rivets */}
                    <div className="relative bg-gradient-to-br from-construction-accent via-construction-accent to-[#2a2a2a] border-2 border-[#2a2a2a] rounded-lg px-2.5 py-1.5 shadow-lg">
                      {/* Decorative corner rivets */}
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />

                      {/* Content */}
                      <div className="flex items-center gap-1.5">
                        {/* Stacked layers icon for materials */}
                        <div className="relative">
                          <LayersIcon className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                        </div>

                        {/* Count badge */}
                        <div className="flex flex-col items-start leading-none">
                          <span className="text-[10px] font-black text-white/90 tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                            {task.materialStats!.count}
                          </span>
                          <span className="text-[8px] font-bold text-white/70 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                            MAT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project/Phase - show project name in tasks context, only phase in project context */}
            {(task.project || phase) && (
              <p className="text-xs text-muted-foreground truncate">
                {phases ? (
                  // Project context - show only phase name
                  phase?.name
                ) : (
                  // Tasks page context - show project / phase
                  <>
                    {task.project?.name}
                    {phase && ` / ${phase.name}`}
                  </>
                )}
              </p>
            )}

            {/* Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Due Date */}
                {task.due_date && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isOverdue ? "text-red-600" : "text-muted-foreground",
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.due_date)}
                  </div>
                )}

                {/* Blocked Indicator */}
                {isBlocked && (
                  <div
                    className="flex items-center gap-1 text-xs text-red-600"
                    title={task.blocked_reason || "Blocked"}
                  >
                    <Ban className="h-3 w-3" />
                    <span className="sr-only">Blocked</span>
                  </div>
                )}

                {/* Overdue Indicator */}
                {isOverdue && !isBlocked && (
                  <div
                    className="flex items-center gap-1 text-xs text-orange-600"
                    title="Overdue"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span className="sr-only">Overdue</span>
                  </div>
                )}

                {/* Material Cost Display - Industrial Style */}
                {hasMaterials && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-construction-accent/10 to-construction-accent/5 border border-construction-accent/20 rounded-md"
                    title={`Total materials cost: $${task.materialStats!.totalCost.toFixed(2)}`}
                  >
                    <Package className="h-3 w-3 text-construction-accent" />
                    <span className="text-[11px] font-black text-construction-accent tracking-tight">
                      {formatCurrency(task.materialStats!.totalCost)}
                    </span>
                  </div>
                )}

                {/* Expense Display */}
                {hasExpenses && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-100/50 to-amber-50/50 border border-amber-300/60 rounded-md"
                    title={`${expenseStats!.count} expense${expenseStats!.count !== 1 ? "s" : ""} - ${formatCurrency(expenseStats!.totalAmount)}`}
                  >
                    <Receipt className="h-3 w-3 text-amber-600" />
                    <span className="text-[11px] font-black text-amber-700 tracking-tight">
                      {formatCurrency(expenseStats!.totalAmount)}
                    </span>
                  </div>
                )}

                {/* P4.7 - 3D Location Badge */}
                {has3DLocation && task.project?.id && (
                  <a
                    href={`/app/projects/${task.project.id}/spatial?marker=${task.spatial_marker_id}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent task card click
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1",
                      "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5",
                      "border border-construction-blue/30",
                      "rounded-md",
                      "hover:bg-construction-blue/20 hover:border-construction-blue/50",
                      "transition-all duration-200",
                      "group/location",
                    )}
                    title="View in 3D"
                  >
                    <Box className="h-3 w-3 text-construction-blue group-hover/location:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-[11px] font-black text-construction-blue tracking-tight">
                      3D
                    </span>
                  </a>
                )}
              </div>

              {/* Assignee */}
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Blocked Reason */}
            {isBlocked && task.blocked_reason && (
              <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded truncate">
                {task.blocked_reason}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props changed
  // Returns true if props are equal (skip re-render), false if different (re-render)
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.showEditIndicator === nextProps.showEditIndicator &&
    // Compare expense stats if present
    prevProps.expenseStats?.count === nextProps.expenseStats?.count &&
    prevProps.expenseStats?.totalAmount === nextProps.expenseStats?.totalAmount
  );
});
