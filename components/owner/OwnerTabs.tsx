"use client";

/**
 * OwnerTabs Component
 *
 * Tabbed navigation for owner admin pages using SegmentedControl pattern.
 *
 * Features:
 * - Three tabs: Companies, Users, Invites
 * - Active route detection via usePathname
 * - Count badge on Invites tab (if pending > 0)
 * - Haptic feedback on navigation
 * - Next.js Link navigation
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SegmentedControl } from "@/components/mobile/SegmentedControl";
import { Building2, Users, Mail } from "lucide-react";

interface OwnerTabsProps {
  /** Dashboard stats for badge counts */
  stats?: {
    totalCompanies: number;
    totalUsers: number;
    pendingInvitations: number;
  };
}

export function OwnerTabs({ stats }: OwnerTabsProps) {
  const pathname = usePathname();

  // Determine active tab based on current path
  const activeTab = pathname.includes("/owner/users")
    ? "users"
    : pathname.includes("/owner/invites")
      ? "invites"
      : "companies";

  const segments = [
    {
      value: "companies",
      label: "Companies",
      href: "/app/owner/companies",
    },
    {
      value: "users",
      label: "Users",
      href: "/app/owner/users",
    },
    {
      value: "invites",
      label: "Invites",
      href: "/app/owner/invites",
      count: stats?.pendingInvitations,
    },
  ];

  return (
    <div className="flex items-center justify-center md:justify-start">
      <div className="w-full md:w-auto">
        <SegmentedControl
          segments={segments.map((seg) => ({
            value: seg.value,
            label: seg.label,
            count: seg.count,
          }))}
          value={activeTab}
          onChange={(value) => {
            const segment = segments.find((s) => s.value === value);
            if (segment) {
              window.location.href = segment.href;
            }
          }}
          fullWidth={false}
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
}
