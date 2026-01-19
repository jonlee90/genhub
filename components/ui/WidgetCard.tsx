"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function WidgetCard({
  children,
  className,
  interactive = false,
}: WidgetCardProps) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-200 rounded-xl p-4 h-full",
        interactive &&
          "transition-all duration-150 active:scale-[0.99] active:bg-gray-50/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface WidgetHeaderProps {
  icon: LucideIcon;
  title: string;
  right?: ReactNode;
  className?: string;
  iconClassName?: string;
  iconWrapperClassName?: string;
  titleClassName?: string;
}

export function WidgetHeader({
  icon: Icon,
  title,
  right,
  className,
  iconClassName,
  iconWrapperClassName,
  titleClassName,
}: WidgetHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn("p-2 bg-[#001B51]/10 rounded-lg", iconWrapperClassName)}
        >
          <Icon className={cn("w-5 h-5 text-[#001B51]", iconClassName)} />
        </div>
        <h3
          className={cn(
            "text-sm font-bold text-gray-900 uppercase tracking-wide",
            titleClassName,
          )}
        >
          {title}
        </h3>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

interface WidgetSkeletonProps {
  children: ReactNode;
  className?: string;
}

export function WidgetSkeleton({ children, className }: WidgetSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-200 rounded-xl p-4 animate-pulse h-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
