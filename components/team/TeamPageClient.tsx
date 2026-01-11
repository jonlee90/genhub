'use client';

/**
 * TeamPageClient Component
 *
 * Client-side wrapper for Team page with mobile-optimized layout.
 * Uses SwipeableCard for member actions on mobile.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { FloatingActionButton } from '@/components/mobile/FloatingActionButton';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberTable } from './TeamMemberTable';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { deactivateTeamMember } from '@/app/actions/team';
import { Users, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];
type MemberStatus = Database['public']['Enums']['member_status'];

interface TeamMember {
  id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  activated_at: string | null;
  invited_at: string | null;
  user_profiles: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
  } | null;
  project_count: number;
}

interface TeamStats {
  total: number;
  active: number;
  invited: number;
  admins: number;
  projectManagers: number;
  fieldWorkers: number;
}

interface TeamPageClientProps {
  members: TeamMember[];
  currentUserRole: UserRole;
  companyId: string;
  stats: TeamStats;
}

export function TeamPageClient({
  members,
  currentUserRole,
  companyId,
  stats,
}: TeamPageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPending, setIsPending] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Handle member deactivation via swipe
  const handleRemoveMember = useCallback(
    async (memberId: string, userId: string) => {
      if (isPending) return;

      setIsPending(memberId);

      try {
        const result = await deactivateTeamMember(userId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Team member deactivated');
          router.refresh();
        }
      } catch {
        toast.error('Failed to deactivate member');
      } finally {
        setIsPending(null);
      }
    },
    [isPending, router]
  );

  // Handle member tap (for viewing details - could open modal in future)
  const handleMemberTap = useCallback((member: TeamMember) => {
    // For now, just log - could open a detail modal
    console.log('[TeamPageClient] Member tapped:', member.user_profiles?.name);
  }, []);

  // Mobile layout with swipeable cards
  if (isMobile) {
    return (
      <div className="relative">
        {/* Team list with pull-to-refresh */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-3 pb-32">
            {members.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No team members yet
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs">
                  Invite team members to start collaborating on projects.
                </p>
              </div>
            ) : (
              // Team member list
              members.map((member) => (
                <SwipeableCard
                  key={member.id}
                  onSwipeLeft={
                    isAdmin && member.status !== 'inactive'
                      ? () => handleRemoveMember(member.id, member.user_id)
                      : undefined
                  }
                  rightActionIcon={<UserMinus className="w-6 h-6" />}
                  rightActionColor="bg-[#DC2626]"
                  disabled={isPending === member.id}
                  className="shadow-sm border border-gray-100"
                >
                  <TeamMemberCard
                    member={member}
                    onClick={() => handleMemberTap(member)}
                  />
                </SwipeableCard>
              ))
            )}
          </div>
        </PullToRefresh>

        {/* FAB for invite */}
        {isAdmin && (
          <FloatingActionButton
            onClick={() => setShowInviteModal(true)}
            icon={UserPlus}
            ariaLabel="Invite team member"
          />
        )}

        {/* Invite modal */}
        <InviteTeamMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={companyId}
        />
      </div>
    );
  }

  // Desktop layout - uses existing TeamMemberTable
  return (
    <TeamMemberTable
      members={members}
      currentUserRole={currentUserRole}
      companyId={companyId}
    />
  );
}
