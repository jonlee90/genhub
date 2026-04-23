"use client";

import { useState, useEffect, useCallback } from "react";
import Activity from "lucide-react/icons/activity";
import Loader2 from "lucide-react/icons/loader-2";
import Clock from "lucide-react/icons/clock";
import User from "lucide-react/icons/user";
import { cn, formatDate } from "@/lib/utils";
import { getTaskActivity } from "@/app/actions/tasks";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

interface TaskActivity {
  id: string;
  action: string;
  user_name: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
}

export interface ActivityTabProps {
  taskId: string;
}

/**
 * ActivityTab - Display chronological activity log for task
 * Shows timeline of actions: created, updated, status_changed, assigned, comment_added
 * Each entry shows user, action, timestamp, and optional details
 */
export function ActivityTab({ taskId }: ActivityTabProps) {
  // Component state
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, clearError } = useActionWithError();

  // Fetch activity on mount
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError(null);

      const result = await getTaskActivity(taskId);

      if (!result.success) {
        setError(result.error);
        setActivities([]);
      } else {
        setActivities(result.data);
      }

      setLoading(false);
    };

    fetchActivity();
  }, [taskId, setError]);

  // Format timestamp helper
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Relative time for recent activity
    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    // Absolute time for older activity
    return (
      formatDate(date) +
      " at " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // Get action display text
  const getActionDisplay = (activity: TaskActivity) => {
    const action = activity.action.replace(/_/g, " ");

    // If old/new values exist, format as change
    if (activity.old_value && activity.new_value) {
      return (
        <span>
          <span className="capitalize">{action}</span>
          {" from "}
          <span className="font-semibold text-red-600 dark:text-red-400">
            {activity.old_value}
          </span>
          {" to "}
          <span className="font-semibold text-green-600 dark:text-green-400">
            {activity.new_value}
          </span>
        </span>
      );
    }

    // If only new value, format as set
    if (activity.new_value) {
      return (
        <span>
          <span className="capitalize">{action}</span>
          {" to "}
          <span className="font-semibold text-construction-blue">
            {activity.new_value}
          </span>
        </span>
      );
    }

    // Default: just capitalize action
    return <span className="capitalize">{action}</span>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading activity...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorBanner error={error} onDismiss={clearError} />;
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 font-semibold">
          No activity yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Task activity will appear here as changes are made
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Activity Timeline */}
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={cn(
            "flex gap-3 p-3 rounded-lg",
            "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
            "border-l-2 border-transparent hover:border-l-[var(--construction-blue)]",
          )}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-construction-blue shrink-0" />
            {index < activities.length - 1 && (
              <div className="w-px h-full bg-gray-200 dark:bg-gray-700 min-h-[20px]" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 min-w-0 pb-2">
            {/* User and action */}
            <div className="flex items-start gap-2 mb-1">
              <User className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {activity.user_name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1.5">
                  {getActionDisplay(activity)}
                </span>
              </div>
            </div>

            {/* Comment (if exists) */}
            {activity.comment && (
              <div className="ml-6 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border-l-2 border-l-gray-300 dark:border-l-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  {activity.comment}
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="ml-6 mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {formatTimestamp(activity.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>
          {activities.length} activity log{activities.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
