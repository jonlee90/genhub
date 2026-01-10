import { getPendingAdminInvitations } from '@/app/actions/owner';
import { OwnerInvitesClient } from '@/components/owner/OwnerInvitesClient';
import { Mail } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Invitations</h1>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const invitations = result.data || [];

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

      {/* Industrial Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-construction-blue/60 uppercase tracking-wider">
                Platform Admin
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              INVITATIONS
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              Invite new company admins to join GenHub
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-yellow-500/10 rounded-lg border-2 border-yellow-500/20">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-yellow-600/60">
                Pending
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-yellow-600 leading-none mb-1">
                {invitations.length}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Pending Invitations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Component for Invite Form and Actions */}
      <OwnerInvitesClient invitations={invitations} />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
