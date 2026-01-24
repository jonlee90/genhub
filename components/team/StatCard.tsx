'use client';

/**
 * StatCard Component - Team Dashboard
 *
 * Wrapper component for team dashboards with construction-themed styling.
 * Provides a simplified interface for team statistics display.
 *
 * Note: This component wraps the base StatCard from @/components/ui/stat-card
 * to maintain backwards compatibility and provide team-specific styling.
 */

import type { LucideIcon } from "lucide-react";
import { StatCard as BaseStatCard } from "@/components/ui/stat-card";
import Users from "lucide-react/icons/users";
import UserCog from "lucide-react/icons/user-cog";
import HardHat from "lucide-react/icons/hard-hat";
import Hammer from "lucide-react/icons/hammer";
import UserPlus from "lucide-react/icons/user-plus";
import Shield from "lucide-react/icons/shield";
import Briefcase from "lucide-react/icons/briefcase";
import AlertTriangle from "lucide-react/icons/alert-triangle";

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  "user-cog": UserCog,
  "hard-hat": HardHat,
  hammer: Hammer,
  "user-plus": UserPlus,
  shield: Shield,
  briefcase: Briefcase,
  "alert-triangle": AlertTriangle,
};

interface StatCardProps {
  icon: string;
  label: string;
  sublabel: string;
  value: number;
  colorClass: "blue" | "green" | "accent" | "yellow" | "red";
}

export function StatCard({ icon, label, sublabel, value, colorClass }: StatCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <BaseStatCard
      icon={IconComponent}
      label={label}
      sublabel={sublabel}
      value={value}
      colorClass={colorClass}
    />
  );
}
