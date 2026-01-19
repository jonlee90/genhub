/**
 * StatCard Component
 *
 * Reusable statistics card for team dashboards.
 * Features construction-themed design with icons and gradient backgrounds.
 */

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  value: number;
  colorClass: "blue" | "green" | "accent" | "yellow" | "red";
}

const COLOR_CLASSES = {
  blue: {
    gradient: "from-construction-blue/5 to-construction-blue/10",
    iconBg: "bg-construction-blue/10",
    iconBorder: "border-construction-blue/20",
    iconColor: "text-construction-blue",
    badgeColor: "text-construction-blue/60",
    textColor: "text-construction-blue",
  },
  green: {
    gradient: "from-construction-green/5 to-construction-green/10",
    iconBg: "bg-construction-green/10",
    iconBorder: "border-construction-green/20",
    iconColor: "text-construction-green",
    badgeColor: "text-construction-green/60",
    textColor: "text-construction-green",
  },
  accent: {
    gradient: "from-construction-accent/5 to-construction-accent/10",
    iconBg: "bg-construction-accent/10",
    iconBorder: "border-construction-accent/20",
    iconColor: "text-construction-accent",
    badgeColor: "text-construction-accent/60",
    textColor: "text-construction-accent",
  },
  yellow: {
    gradient: "from-construction-yellow/5 to-construction-yellow/10",
    iconBg: "bg-construction-yellow/10",
    iconBorder: "border-construction-yellow/20",
    iconColor: "text-construction-yellow",
    badgeColor: "text-construction-yellow/60",
    textColor: "text-construction-yellow",
  },
  red: {
    gradient: "from-construction-red/5 to-construction-red/10",
    iconBg: "bg-construction-red/10",
    iconBorder: "border-construction-red/20",
    iconColor: "text-construction-red",
    badgeColor: "text-construction-red/60",
    textColor: "text-construction-red",
  },
} as const;

export function StatCard({ icon: Icon, label, sublabel, value, colorClass }: StatCardProps) {
  const colors = COLOR_CLASSES[colorClass];

  return (
    <div className="relative group h-full">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-lg transform group-hover:scale-105 transition-transform`}
      />
      <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className={`p-1.5 md:p-2 ${colors.iconBg} rounded-lg border-2 ${colors.iconBorder}`}>
            <Icon className={`h-4 w-4 md:h-5 md:w-5 ${colors.iconColor}`} />
          </div>
          <div className={`text-[10px] md:text-xs font-mono uppercase tracking-wider ${colors.badgeColor}`}>
            {label}
          </div>
        </div>
        <div>
          <div className={`text-2xl md:text-4xl font-black ${colors.textColor} leading-none mb-1`}>
            {value}
          </div>
          <div className="text-xs md:text-sm font-bold text-gray-600">
            {sublabel}
          </div>
        </div>
      </div>
    </div>
  );
}
