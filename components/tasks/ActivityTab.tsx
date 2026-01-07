'use client';

// Debug: Phase 4 - Activity Tab (display chronological activity log for task)
// Fetches and displays task activity with user, action, timestamp, and details

import { useState, useEffect } from 'react';
import { Activity, Loader2, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTaskActivity } from '@/app/actions/tasks';

// Debug: Activity type (from server action)
type TaskActivity = {
  id: string;
  action: string;
  user_name: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
};

// Debug: Component props
export interface ActivityTabProps {
  taskId: string;
}

/**
 * ActivityTab - Display chronological activity log for task
 * Shows timeline of actions: created, updated, status_changed, assigned, comment_added
 * Each entry shows user, action, timestamp, and optional details
 */
export function ActivityTab({ taskId }: ActivityTabProps) {
  console.log('[ActivityTab] Rendering for task:', taskId);

  // Debug: State
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Fetch activity on mount
  useEffect(() => {
    const fetchActivity = async () => {
      console.log('[ActivityTab] Fetching activity for task:', taskId);
      setLoading(true);
      setError(null);

      const result = await getTaskActivity(taskId);

      if (result.error) {
        console.error('[ActivityTab] Error:', result.error);
        setError(result.error);
        setActivities([]);
      } else if (result.data) {
        console.log('[ActivityTab] Activity loaded:', result.data.length);
        setActivities(result.data);
      }

      setLoading(false);
    };

    fetchActivity();
  }, [taskId]);

  // Debug: Format timestamp helper
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Relative time for recent activity
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    // Absolute time for older activity
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Debug: Get action display text
  const getActionDisplay = (activity: TaskActivity) => {
    const action = activity.action.replace(/_/g, ' ');

    // If old/new values exist, format as change
    if (activity.old_value && activity.new_value) {
      return (
        <span>
          <span className="capitalize">{action}</span>
          {' from '}
          <span className="font-semibold text-red-600">{activity.old_value}</span>
          {' to '}
          <span className="font-semibold text-green-600">{activity.new_value}</span>
        </span>
      );
    }

    // If only new value, format as set
    if (activity.new_value) {
      return (
        <span>
          <span className="capitalize">{action}</span>
          {' to '}
          <span className="font-semibold text-[#001B51]">{activity.new_value}</span>
        </span>
      );
    }

    // Default: just capitalize action
    return <span className="capitalize">{action}</span>;
  };

  // Debug: Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#001B51]" />
        <p className="text-sm text-gray-500">Loading activity...</p>
      </div>
    );
  }

  // Debug: Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-semibold">Error loading activity</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  // Debug: Empty state
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-semibold">No activity yet</p>
        <p className="text-sm text-gray-400 mt-1">Task activity will appear here as changes are made</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Debug: Activity Timeline */}
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={cn(
            'flex gap-3 p-3 rounded-lg',
            'hover:bg-gray-50 transition-colors',
            'border-l-2 border-transparent hover:border-l-[#001B51]'
          )}
        >
          {/* Debug: Timeline dot */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#001B51] shrink-0" />
            {index < activities.length - 1 && (
              <div className="w-px h-full bg-gray-200 min-h-[20px]" />
            )}
          </div>

          {/* Debug: Activity content */}
          <div className="flex-1 min-w-0 pb-2">
            {/* Debug: User and action */}
            <div className="flex items-start gap-2 mb-1">
              <User className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-gray-900">{activity.user_name}</span>
                <span className="text-sm text-gray-600 ml-1.5">
                  {getActionDisplay(activity)}
                </span>
              </div>
            </div>

            {/* Debug: Comment (if exists) */}
            {activity.comment && (
              <div className="ml-6 mt-2 p-2 bg-gray-100 rounded border-l-2 border-l-gray-300">
                <p className="text-sm text-gray-700 italic">{activity.comment}</p>
              </div>
            )}

            {/* Debug: Timestamp */}
            <div className="ml-6 mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTimestamp(activity.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {/* Debug: Summary */}
      <div className="border-t border-gray-200 pt-4 mt-4 text-xs text-gray-500 text-center">
        <p>{activities.length} activity log{activities.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
