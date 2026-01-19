"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  AlertTriangle,
  Ban,
  ArrowUpDown,
  Wrench,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { motion } from "framer-motion";
import { updateTaskStatus } from "@/app/actions/tasks";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/lib/config/task-colors";
import { TaskListMobile } from ".//TaskListMobile";
import type { TaskWithRelations, Phase, TaskStatus } from "@/types/db/task";

interface TaskListProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  /** When provided, we"re in project context - look up phase from this array */
  phases?: Phase[];
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<string, number> = {
  blocked: 0,
  in_progress: 1,
  review: 2,
  todo: 3,
  completed: 4,
};

const isOverdue = (task: TaskWithRelations) => {
  if (!task.due_date || task.status === "completed") return false;
  // Parse due date properly to avoid UTC timezone issues
  const [year, month, day] = task.due_date.split("T")[0].split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

// Status icon mapping (icons are component-specific)
const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }> | null
> = {
  todo: null,
  in_progress: Wrench,
  review: null,
  blocked: AlertTriangle,
  completed: CheckCircle,
};

// Animate in_progress status only
const STATUS_ANIMATE: Record<string, boolean> = {
  todo: false,
  in_progress: true,
  review: false,
  blocked: false,
  completed: false,
};

type SortField = "title" | "project" | "due_date" | "priority" | "status";
type SortOrder = "asc" | "desc";

export function TaskList({ tasks, onTaskClick, phases }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Detect mobile for swipeable card view
  const isMobile = useIsMobile();

  const phaseMap = useMemo(
    () => (phases ? new Map(phases.map((phase) => [phase.id, phase])) : null),
    [phases],
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
    },
    [sortField, sortOrder],
  );

  const sortedTasks = useMemo(() => {
    const tasksToSort = [...tasks];
    tasksToSort.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "project":
          comparison = (a.project?.name || "").localeCompare(
            b.project?.name || "",
          );
          break;
        case "due_date": {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        }
        case "priority":
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "status":
          comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
    return tasksToSort;
  }, [tasks, sortField, sortOrder]);

  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
    currentStatus: TaskStatus,
  ) => {
    if (newStatus === currentStatus) return;

    if (newStatus === "blocked") {
      const reason = window.prompt(
        "Please enter a reason for blocking this task:",
      );
      if (!reason) return;
      await updateTaskStatus(taskId, newStatus, reason);
    } else {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  const getPhaseName = useCallback(
    (task: TaskWithRelations) => {
      if (phaseMap) {
        return phaseMap.get(task.phase_id || "")?.name || "-";
      }
      return task.phase?.name || "-";
    },
    [phaseMap],
  );

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-white hover:text-white hover:bg-white/10 font-black text-xs uppercase tracking-wider"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown
        className={cn(
          "ml-2 h-4 w-4 transition-transform",
          sortField === field && sortOrder === "desc" && "rotate-180",
        )}
      />
    </Button>
  );

  // Mobile View: Use TaskListMobile with swipe actions
  if (isMobile) {
    return (
      <TaskListMobile
        tasks={sortedTasks}
        onTaskClick={onTaskClick}
        phases={phases}
        enableComplete={true}
        enableDelete={true}
      />
    );
  }

  // Desktop Table View
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-construction overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-[#001B51] text-white shadow-construction z-10">
          <TableRow className="border-none hover:bg-[#001B51]">
            <TableHead className="w-[300px] text-white">
              <SortButton field="title" label="Title" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="project" label="Project" />
            </TableHead>
            <TableHead className="text-white font-black text-xs uppercase tracking-wider">
              Phase
            </TableHead>
            <TableHead className="text-white font-black text-xs uppercase tracking-wider">
              Assignee
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="due_date" label="Due Date" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="priority" label="Priority" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="status" label="Status" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const statusConfig = TASK_STATUS_CONFIG[task.status];
            const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
            const taskIsOverdue = isOverdue(task);

            return (
              <TableRow
                key={task.id}
                className="bg-white group hover:bg-[#001B51]/5 transition-colors duration-200 cursor-pointer border-b border-gray-100"
              >
                {/* Title */}
                <TableCell>
                  <button
                    onClick={() => onTaskClick?.(task)}
                    className="font-bold text-sm hover:text-[#001B51] transition-colors flex items-center gap-2 relative group text-left"
                  >
                    {task.status === "blocked" && (
                      <Ban className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    {taskIsOverdue && task.status !== "blocked" && (
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <span className="line-clamp-1 relative">
                      {task.title}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#001B51] group-hover:w-full transition-all duration-300" />
                    </span>
                  </button>
                </TableCell>

                {/* Project */}
                <TableCell>
                  {task.project ? (
                    <Link
                      href={`/app/projects/${task.project.id}`}
                      className="hover:underline text-sm"
                    >
                      {task.project.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Phase */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getPhaseName(task)}
                  </span>
                </TableCell>

                {/* Assignee */}
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={task.assignee.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Unassigned
                    </span>
                  )}
                </TableCell>

                {/* Due Date */}
                <TableCell>
                  {task.due_date ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm",
                        taskIsOverdue && "text-red-600",
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.due_date)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("font-bold", priorityConfig.badgeColor)}
                  >
                    {priorityConfig.label}
                  </Badge>
                </TableCell>

                {/* Status (Inline Edit) */}
                <TableCell>
                  <motion.div
                    animate={
                      STATUS_ANIMATE[task.status] ? { scale: [1, 1.05, 1] } : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(
                          task.id,
                          value as TaskStatus,
                          task.status,
                        )
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-[140px] h-8 font-bold",
                          statusConfig.solidColor,
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[task.status] &&
                            (() => {
                              const Icon = STATUS_ICONS[task.status]!;
                              return <Icon className="w-3 h-3" />;
                            })()}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_STATUS_CONFIG).map(
                          ([value, config]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-1.5">
                                {STATUS_ICONS[value] &&
                                  (() => {
                                    const Icon = STATUS_ICONS[value]!;
                                    return <Icon className="w-3 h-3" />;
                                  })()}
                                {config.label}
                              </div>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
