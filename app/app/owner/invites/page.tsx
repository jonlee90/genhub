import { getPendingAdminInvitations } from '@/app/actions/owner';
import { OwnerInvitesClient } from '@/components/owner/OwnerInvitesClient';
import { OwnerPageHeader } from '@/components/owner/OwnerPageHeader';
import { OwnerStatsGrid } from '@/components/owner/OwnerStatsGrid';

/**
 * Owner Invites Page
 *
 * Server Component - Displays pending admin invitations and provides
 * interface to send new invitations.
 * Accessible only by platform owners.
 */
export default async function OwnerInvitesPage() {
  console.log('[OwnerInvitesPage] Fetching pending invitations');

  const result = await getPendingAdminInvitations();

  if (result.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Invitations</h1>
          <p className="text-gray-600 dark:text-gray-400">{result.error}</p>
        </div>
      </div>
    );
  }

  const invitations = result.data || [];

  // Prepare stats for grid
  const statsData = [
    {
      title: "Pending Invitations",
      value: invitations.length,
      iconName: "mail" as const,
      variant: "warning" as const,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      {/* Page Header */}
      <OwnerPageHeader
        title="INVITATIONS"
        subtitle="Invite new company admins to join GenHub"
        iconName="mail"
      />

      {/* Stats Grid */}
      <OwnerStatsGrid stats={statsData} columns={3} />

      {/* Client Component for Invite Form and Actions */}
      <OwnerInvitesClient invitations={invitations} />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
