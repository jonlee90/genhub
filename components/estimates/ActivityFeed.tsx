"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBrowserClient } from "@/utils/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEstimateActivity } from "@/app/actions/estimates";
import { formatDistanceToNow } from "date-fns";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";
import Activity from "lucide-react/icons/activity";

// ============================================
// TYPES
// ============================================

type ActivityType =
  | "item_added"
  | "item_edited"
  | "item_deleted"
  | "cost_updated"
  | "assembly_applied"
  | "bulk_accepted"
  | "bulk_rejected";

interface EstimateActivity {
  id: string;
  estimate_id: string;
  company_id: string;
  user_id: string;
  action_type: ActivityType;
  details: Record<string, unknown>;
  created_at: string;
}

interface ActivityFeedProps {
  estimateId: string;
}

// ============================================
// HELPERS
// ============================================

const ACTION_TYPE_LABELS: Record<ActivityType, string> = {
  item_added: "added an item",
  item_edited: "edited an item",
  item_deleted: "deleted an item",
  cost_updated: "updated costs",
  assembly_applied: "applied assembly",
  bulk_accepted: "bulk accepted",
  bulk_rejected: "bulk rejected",
};

function getActionLabel(actionType: ActivityType): string {
  return ACTION_TYPE_LABELS[actionType] ?? actionType;
}

function getUserLabel(activity: EstimateActivity): string {
  const details = activity.details;
  if (typeof details?.userName === "string") return details.userName;
  return "Someone";
}

function getRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivityFeed({ estimateId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<EstimateActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<SupabaseClient["channel"]> | null>(null);

  // Load initial activities
  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      setIsLoading(true);
      const { data, error } = await getEstimateActivity(estimateId, 20);
      if (!isMounted) return;
      if (!error && data) {
        setActivities(data as EstimateActivity[]);
      }
      setIsLoading(false);
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, [estimateId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = getBrowserClient();

    const channel = supabase
      .channel(`estimate_activity:${estimateId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "estimate_activity",
          filter: `estimate_id=eq.${estimateId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newActivity = payload.new as unknown as EstimateActivity;
          setActivities((prev) => [newActivity, ...prev].slice(0, 20));
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [estimateId]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 min-h-[44px] bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="activity-feed-panel"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activity
          </span>
          {activities.length > 0 ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({activities.length})
            </span>
          ) : null}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Panel */}
      {isExpanded ? (
        <div
          id="activity-feed-panel"
          className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No activity yet.
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-4 py-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    <span className="font-medium">
                      {getUserLabel(activity)}
                    </span>{" "}
                    {getActionLabel(activity.action_type)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {getRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
