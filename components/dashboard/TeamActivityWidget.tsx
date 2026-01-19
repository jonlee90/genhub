"use client";

import Link from "next/link";
import { Users, AlertTriangle, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { TeamActivityData } from "@/types/dashboard";

export interface TeamActivityWidgetProps {
  activity: TeamActivityData;
  isLoading?: boolean;
}

/**
 * Generate a consistent background color based on name
 */
function getAvatarColor(name: string): string {
  const colors = [
    "bg-[#001B51]",
    "bg-[#059669]",
    "bg-[#3C3C3C]",
    "bg-[#7C3AED]",
    "bg-[#0891B2]",
    "bg-[#EA580C]",
  ];
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function TeamActivityWidgetSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
            <div className="h-5 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </WidgetSkeleton>
  );
}

export function TeamActivityWidget({
  activity,
  isLoading = false,
}: TeamActivityWidgetProps) {
  if (isLoading) {
    return <TeamActivityWidgetSkeleton />;
  }

  const { totalMembers, topAssignees, unassignedTasks } = activity;
  const maxTasks =
    topAssignees.length > 0
      ? Math.max(...topAssignees.map((a) => a.taskCount))
      : 1;

  return (
    <Link href="/app/team" className="block h-full group">
      <WidgetCard interactive>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <WidgetHeader
            icon={Users}
            title={`${totalMembers} Team Member${totalMembers !== 1 ? "s" : ""}`}
            right={
              <ChevronRight className="w-4 h-4 text-gray-400 group-active:translate-x-0.5 transition-transform" />
            }
            titleClassName="text-[#001B51] normal-case tracking-normal"
          />
        </div>

        {/* Top Assignees */}
        <div className="space-y-3">
          {topAssignees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No task assignments yet</p>
            </div>
          ) : (
            topAssignees.slice(0, 5).map((assignee) => {
              const barWidth =
                maxTasks > 0 ? (assignee.taskCount / maxTasks) * 100 : 0;

              return (
                <div key={assignee.id} className="flex items-center gap-3">
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage
                      src={assignee.avatarUrl ?? undefined}
                      alt={assignee.name}
                    />
                    <AvatarFallback
                      className={cn(
                        "text-white text-xs font-semibold",
                        getAvatarColor(assignee.name),
                      )}
                    >
                      {getInitials(assignee.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name and Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {assignee.name}
                      </span>
                      <span className="text-xs font-bold text-[#001B51] ml-2">
                        {assignee.taskCount}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#001B51] rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unassigned Tasks Warning */}
        {unassignedTasks > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <span className="text-sm font-semibold text-[#F59E0B]">
                {unassignedTasks} unassigned task
                {unassignedTasks !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </WidgetCard>
    </Link>
  );
}
