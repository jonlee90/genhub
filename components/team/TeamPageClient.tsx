'use client';

/**
 * TeamPageClient - Optimized Team List Page
 *
 * Performance optimizations:
 * - Memoized filter/sort/stats calculations
 * - CSS-based stagger animations
 * - Dynamic import for InviteTeamMemberModal
 * - Reduced framer-motion usage
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { BlueprintBackground } from '@/components/shared';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberTable } from './TeamMemberTable';
import { TeamSummary, type TeamSummaryStats } from './TeamSummary';
import { TeamFilters } from './TeamFilters';
import { Button } from '@/components/ui/button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { deactivateTeamMember } from '@/app/actions/team';
// Performance optimization: Direct imports instead of barrel file
import Users from 'lucide-react/icons/users';
import UserMinus from 'lucide-react/icons/user-minus';
import UserPlus from 'lucide-react/icons/user-plus';
import ShieldAlert from 'lucide-react/icons/shield-alert';
import X from 'lucide-react/icons/x';
import { toast } from 'sonner';
import type { UserRole } from '@/types/db/enums';
import type { TeamMember, TeamStats } from '@/types/team';

// Dynamic import for heavy modal component
const InviteTeamMemberModal = dynamic(
  () => import('./InviteTeamMemberModal').then((m) => ({ default: m.InviteTeamMemberModal })),
  { ssr: false }
);

// ============================================
// Extracted Components for Better Performance
// ============================================

/**
 * No results state when filters return empty - memoized
 */
const NoResultsState = memo(function NoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 dark:border-construction-red/30 rounded-xl transform rotate-1" />
      <div className="relative flex flex-col items-center justify-center py-16 md:py-20 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 dark:from-construction-red/20 dark:to-construction-red/10 rounded-2xl border-2 border-construction-red/20 dark:border-construction-red/40">
          <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-construction-red" />
        </div>
        <h3 className="text-xl md:text-3xl font-black text-construction-red dark:text-construction-red mb-2 md:mb-3">
          NO TEAM MEMBERS FOUND
        </h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4 md:mb-8 max-w-md text-center text-sm md:text-lg">
          No team members match your current filters. Adjust search criteria or clear all filters.
        </p>
        <Button
          size="lg"
          onClick={onClearFilters}
          className="h-11 md:h-12 px-6 md:px-8 bg-white dark:bg-gray-900 border-2 border-construction-red hover:bg-construction-red hover:text-white dark:hover:bg-construction-red dark:hover:text-white transition-all shadow-construction font-black group"
        >
          <X className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
          CLEAR ALL FILTERS
        </Button>
      </div>
    </div>
  );
});

/**
 * Mobile empty filter state - simpler version
 */
const MobileNoResultsState = memo(function MobileNoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No members found</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">Try adjusting your filters</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="h-11 px-6 rounded-xl font-semibold text-construction-red dark:text-construction-red bg-red-50 dark:bg-construction-red/10 active:bg-red-100 dark:active:bg-construction-red/20 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

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
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // UI states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPending, setIsPending] = useState<string | null>(null);

  const router = useRouter();
  const isMobile = useIsMobile();

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
  }, []);

  // Filter and sort members - memoized
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.user_profiles?.name?.toLowerCase().includes(query) ||
          member.user_profiles?.email?.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.user_profiles?.name || a.user_profiles?.email || '';
          const nameB = b.user_profiles?.name || b.user_profiles?.email || '';
          return nameA.localeCompare(nameB);
        case 'email':
          const emailA = a.user_profiles?.email || '';
          const emailB = b.user_profiles?.email || '';
          return emailA.localeCompare(emailB);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'joined':
          const dateA = new Date(a.activated_at || a.invited_at || 0).getTime();
          const dateB = new Date(b.activated_at || b.invited_at || 0).getTime();
          return dateB - dateA;
        default:
          const defaultNameA = a.user_profiles?.name || a.user_profiles?.email || '';
          const defaultNameB = b.user_profiles?.name || b.user_profiles?.email || '';
          return defaultNameA.localeCompare(defaultNameB);
      }
    });

    return filtered;
  }, [members, searchQuery, statusFilter, roleFilter, sortBy]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSortBy('name');
  }, []);

  // Calculate team summary stats - memoized
  const teamSummaryStats = useMemo((): TeamSummaryStats | null => {
    if (members.length === 0) return null;

    // Count by status
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const invitedMembers = members.filter((m) => m.status === 'invited').length;

    // Count by role
    const admins = members.filter((m) => m.role === 'admin').length;
    const projectManagers = members.filter((m) => m.role === 'project_manager').length;
    const foremen = members.filter((m) => m.role === 'foreman').length;
    const fieldWorkers = members.filter((m) => m.role === 'field_worker').length;

    // Calculate role distribution
    const roleDistribution = [
      { role: 'Admins', count: admins, percentage: Math.round((admins / members.length) * 100) },
      { role: 'Project Managers', count: projectManagers, percentage: Math.round((projectManagers / members.length) * 100) },
      { role: 'Foremen', count: foremen, percentage: Math.round((foremen / members.length) * 100) },
      { role: 'Field Workers', count: fieldWorkers, percentage: Math.round((fieldWorkers / members.length) * 100) },
    ].filter((item) => item.count > 0);

    // Calculate recent joins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJoins = members
      .filter((m) => {
        const joinDate = new Date(m.activated_at || m.invited_at || 0);
        return joinDate >= sevenDaysAgo;
      })
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        name: m.user_profiles?.name || m.user_profiles?.email || 'Unknown',
        role: m.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        joinedAt: m.activated_at || m.invited_at || new Date().toISOString(),
      }));

    return {
      totalMembers: members.length,
      activeMembers,
      invitedMembers,
      admins,
      projectManagers,
      foremen,
      fieldWorkers,
      roleDistribution,
      recentJoins: recentJoins.length > 0 ? recentJoins : undefined,
    };
  }, [members]);

  // Empty State - No Team Members Yet
  if (members.length === 0) {
    return (
      <>
        <EmptyStateCard
          icon={Users}
          title="BUILD YOUR TEAM"
          description="Invite team members to start collaborating on projects"
          buttonText="INVITE MEMBER"
          onButtonClick={() => setShowInviteModal(true)}
          showButton={isAdmin}
        />
        <InviteTeamMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={companyId}
        />
      </>
    );
  }

  // Render layout based on device type
  return (
    <>
      {isMobile ? (
        <div className="flex flex-col h-full">
          <PullToRefresh onRefresh={handleRefresh} className="flex-1">
            <div className="p-4">
              <BlueprintBackground />

              {/* Header */}
              <div className="relative mb-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
                <div className="flex items-start pt-2 justify-between gap-3">
                  <h1 className="text-3xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
                    TEAM
                  </h1>
                  {isAdmin && (
                    <Button
                      size="lg"
                      onClick={() => setShowInviteModal(true)}
                      className="relative h-11 px-4 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg transition-all group overflow-hidden text-white"
                    >
                      <UserPlus className="mr-1.5 h-4 w-4 group-hover:rotate-90 transition-transform" />
                      <span className="font-black text-sm">INVITE</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Team Summary */}
              {teamSummaryStats && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <TeamSummary stats={teamSummaryStats} />
                </div>
              )}

              {/* Filters */}
              <TeamFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                members={members}
              />

              {/* Team member cards */}
              {filteredMembers.length === 0 ? (
                <MobileNoResultsState onClearFilters={clearFilters} />
              ) : (
                <div className="space-y-3 pb-32">
                  {filteredMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${Math.min(index * 50, 300)}ms`,
                        animationDuration: '400ms',
                        animationFillMode: 'both',
                      }}
                    >
                      <SwipeableCard
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PullToRefresh>
        </div>
      ) : (
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
          <BlueprintBackground />

          {/* Header */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
            <div className="flex flex-col gap-4 pt-2 md:pt-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
                  TEAM
                </h1>
                {isAdmin && (
                  <Button
                    size="lg"
                    onClick={() => setShowInviteModal(true)}
                    className="relative w-full md:w-auto h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
                  >
                    <UserPlus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-black text-sm md:text-base">INVITE</span>
                    <span className="hidden sm:inline font-black text-sm md:text-base ml-1">
                      TEAM MEMBER
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Team Summary */}
          {teamSummaryStats && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <TeamSummary stats={teamSummaryStats} />
            </div>
          )}

          {/* Filters */}
          <TeamFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            members={members}
          />

          {/* Team member table or empty state */}
          {filteredMembers.length === 0 ? (
            <NoResultsState onClearFilters={clearFilters} />
          ) : (
            <TeamMemberTable
              members={filteredMembers}
              currentUserRole={currentUserRole}
              companyId={companyId}
            />
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
        </div>
      )}

      {/* Single modal instance for both mobile and desktop */}
      <InviteTeamMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        companyId={companyId}
      />
    </>
  );
}
