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

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  value: number;
  colorClass: "blue" | "green" | "accent" | "yellow" | "red";
}

export function StatCard({ icon, label, sublabel, value, colorClass }: StatCardProps) {
  return (
    <BaseStatCard
      icon={icon}
      label={label}
      sublabel={sublabel}
      value={value}
      colorClass={colorClass}
    />
  );
}
