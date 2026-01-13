'use client';

// P3.3 - Activity timeline tab
// Shows activity log (marker created, content added, etc.)

import { Activity, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MarkerContent } from '@/types/db/spatial';

export interface ActivityTimelineProps {
  markerId: string;
  activities: MarkerContent[];
}

/**
 * ActivityTimeline - Activity log for marker
 * Shows auto-generated events (marker created, photo added, etc.)
 */
export function ActivityTimeline({ markerId, activities }: ActivityTimelineProps) {
  console.log('[ActivityTimeline] Rendering', { markerId, activityCount: activities.length });

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Activity className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">
          No Activity Yet
        </h3>
        <p className="text-sm text-gray-600">
          Activity logs will appear here as you interact with this marker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* TODO: Implement full activity timeline with activity_data parsing */}
      {activities.map((activity, index) => {
        const timeAgo = activity.created_at
          ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
          : '';

        return (
          <div key={activity.id} className="relative pl-8 pb-6">
            {/* Debug: Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Debug: Timeline dot */}
            <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#001B51] border-2 border-white shadow" />

            {/* Debug: Activity content */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
              <p className="text-sm font-bold text-[#001B51] mb-1">
                Activity Event
              </p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
              {/* TODO: Parse activity_data and show formatted message */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
