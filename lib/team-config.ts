/**
 * Team Module Configuration
 *
 * Shared configuration for role and status badges with direct Lucide icon imports.
 * Prevents barrel import overhead by importing individual icon files.
 */

import Briefcase from "lucide-react/icons/briefcase";
import Building2 from "lucide-react/icons/building-2";
import HardHat from "lucide-react/icons/hard-hat";
import Hammer from "lucide-react/icons/hammer";
import Users from "lucide-react/icons/users";
import UserCheck from "lucide-react/icons/user-check";
import type { LucideIcon } from "lucide-react";
import type { UserRole, MemberStatus } from "@/types/db/enums";

interface RoleConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

interface StatusConfig {
  label: string;
  color: string;
  dotColor: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    label: "Admin",
    color: "bg-[#001B51] text-white border-[#001B51]",
    icon: Briefcase,
  },
  project_manager: {
    label: "Project Manager",
    color: "bg-[#3C3C3C] text-white border-[#3C3C3C]",
    icon: Building2,
  },
  foreman: {
    label: "Foreman",
    color: "bg-[#7A7A7A] text-white border-[#7A7A7A]",
    icon: HardHat,
  },
  field_worker: {
    label: "Field Worker",
    color: "bg-green-700 text-white border-green-700",
    icon: Hammer,
  },
  subcontractor: {
    label: "Subcontractor",
    color: "bg-yellow-600 text-white border-yellow-600",
    icon: Users,
  },
  client: {
    label: "Client",
    color: "bg-blue-600 text-white border-blue-600",
    icon: UserCheck,
  },
} as const;

export const STATUS_CONFIG: Record<MemberStatus, StatusConfig> = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-300",
    dotColor: "bg-green-500",
  },
  invited: {
    label: "Invited",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dotColor: "bg-yellow-500",
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    dotColor: "bg-gray-400",
  },
} as const;
