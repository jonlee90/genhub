"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  userName: string;
  className?: string;
}

/**
 * DashboardHeader - Mobile-first welcome header for the dashboard
 *
 * Features:
 * - Clean welcome message with construction theme
 * - Mobile-optimized typography (16px+ prevents iOS zoom)
 * - High contrast for outdoor visibility
 * - Minimal animation for performance
 */
export function DashboardHeader({ userName, className }: DashboardHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <header className={cn("relative", className)}>
      {/* Navy accent bar - construction theme */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#001B51] rounded-full" />

      <div className="pt-4">
        {/* Greeting - smaller on mobile, larger on desktop */}
        <p className="text-sm md:text-base text-gray-500 font-medium mb-1">
          {greeting},
        </p>

        {/* User name - bold, high contrast */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#001B51]">
          {userName}
        </h1>

        {/* Subtitle */}
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          Your construction command center
        </p>
      </div>
    </header>
  );
}
