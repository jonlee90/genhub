import { m as motion } from "framer-motion";
import type { ComponentType } from "react";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Clock from "lucide-react/icons/clock";
import Trash2 from "lucide-react/icons/trash-2";
import User from "lucide-react/icons/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeSelector";
import { cn, formatDate } from "@/lib/utils";
import type { TaskPriority, TaskStatus, TaskType } from "@/types/db/enums";
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from "@/lib/config/task-colors";

interface TaskDetailHeaderProps {
  title: string;
  creatorName: string | null;
  createdAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  isOverdue: boolean;
  canDelete: boolean;
  onDelete: () => void;
  statusIcon: ComponentType<{ className?: string }>;
}

export function TaskDetailHeader({
  title,
  creatorName,
  createdAt,
  status,
  priority,
  taskType,
  isOverdue,
  canDelete,
  onDelete,
  statusIcon: StatusIcon,
}: TaskDetailHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-black text-construction-blue dark:text-blue-400 leading-tight mb-3 tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Created by {creatorName || "Unknown"}</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TaskTypeBadge type={taskType} />

        <Badge
          className={cn(
            "px-4 py-2 text-sm font-bold border-2 flex items-center gap-2",
            TASK_STATUS_CONFIG[status].badgeColor,
          )}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              TASK_STATUS_CONFIG[status].dotColor,
            )}
          />
          <StatusIcon className="h-4 w-4" />
          {TASK_STATUS_CONFIG[status].label}
        </Badge>

        <Badge
          className={cn(
            "px-4 py-2 text-sm font-bold border-2",
            TASK_PRIORITY_CONFIG[priority].badgeColor,
          )}
        >
          {TASK_PRIORITY_CONFIG[priority].label} Priority
        </Badge>

        {isOverdue && (
          <Badge
            variant="destructive"
            className="px-4 py-2 text-sm font-bold border-2 border-red-300 flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Overdue
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
