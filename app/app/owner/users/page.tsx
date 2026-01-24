import { getAllUsers } from "@/app/actions/owner";
import { Users, Mail, CheckCircle } from "lucide-react";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { OwnerStatsGrid } from "@/components/owner/OwnerStatsGrid";
import { OwnerUsersClient } from "@/components/owner/OwnerUsersClient";

/**
 * Owner Users Page
 *
 * Server Component - Displays all users across all companies.
 * Accessible only by platform owners.
 */
export default async function OwnerUsersPage() {
  console.log("[OwnerUsersPage] Fetching users");

  const result = await getAllUsers();

  if (result.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{result.error}</p>
        </div>
      </div>
    );
  }

  const users = result.data || [];
  const { activeUsers, invitedUsers } = users.reduce(
    (acc, user) => {
      if (user.status === "active") acc.activeUsers += 1;
      if (user.status === "invited") acc.invitedUsers += 1;
      return acc;
    },
    { activeUsers: 0, invitedUsers: 0 },
  );

  // Prepare stats for grid
  const statsData = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      variant: "default" as const,
    },
    {
      title: "Active",
      value: activeUsers,
      icon: CheckCircle,
      variant: "success" as const,
    },
    {
      title: "Invited",
      value: invitedUsers,
      icon: Mail,
      variant: "warning" as const,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      {/* Page Header */}
      <OwnerPageHeader
        title="USERS"
        subtitle="All users across all companies"
        icon={Users}
      />

      {/* Stats Grid */}
      <OwnerStatsGrid stats={statsData} columns={3} />

      {/* Users Display with Search */}
      <OwnerUsersClient users={users} />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
