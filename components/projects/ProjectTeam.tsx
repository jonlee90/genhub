'use client';

import { useState, useCallback, useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import UserPlus from 'lucide-react/icons/user-plus';
import HardHat from 'lucide-react/icons/hard-hat';
import X from 'lucide-react/icons/x';
import Users from 'lucide-react/icons/users';
import Mail from 'lucide-react/icons/mail';
import Building2 from 'lucide-react/icons/building-2';
import Loader2 from 'lucide-react/icons/loader-2';
import ChevronRight from 'lucide-react/icons/chevron-right';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { removeProjectTeamMember, removeSubcontractorFromProject } from '@/app/actions/projects';
import { AddMemberModal } from './AddMemberModal';
import { AddSubcontractorModal } from './AddSubcontractorModal';
import { cn, formatCurrency } from '@/lib/utils';
import type { ProjectTeamMember } from '@/types/components/projects';

interface CostSummary {
  taskCount: number;
  taskCosts: number;
  expenseCosts: number;
}

interface ProjectTeamProps {
  projectId: string;
  team: ProjectTeamMember[];
  companyId: string;
  costSummaries?: Map<string, CostSummary>; // Map of member/sub ID to cost summary
}

// Role configuration with construction theme colors
const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-l-purple-500',
  },
  project_manager: {
    label: 'Project Manager',
    color: 'bg-[#001B51]/10 text-[#001B51] border-[#001B51]/20',
    borderColor: 'border-l-[#001B51]',
  },
  foreman: {
    label: 'Foreman',
    color: 'bg-[#059669]/10 text-[#059669] border-[#059669]/30',
    borderColor: 'border-l-[#059669]',
  },
  field_worker: {
    label: 'Field Worker',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    borderColor: 'border-l-gray-400',
  },
  subcontractor: {
    label: 'Subcontractor',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-l-amber-500',
  },
  client: {
    label: 'Client',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    borderColor: 'border-l-pink-500',
  },
};

export function ProjectTeam({ projectId, team, companyId, costSummaries }: ProjectTeamProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [subcontractorModalOpen, setSubcontractorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'subcontractors'>('members');

  // Performance optimization: Memoize helper function to prevent recreation on every render
  const getCostSummary = useCallback((id: string | null) => {
    if (!id || !costSummaries) return null;
    return costSummaries.get(id);
  }, [costSummaries]);

  // Performance optimization: Memoize filtered lists to prevent recalculation on every render
  const teamMembers = useMemo(() => team.filter((m) => m.user_id !== null), [team]);
  const subcontractors = useMemo(() => team.filter((m) => m.subcontractor_id !== null), [team]);

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleRemoveMember = useCallback(async (memberId: string, userId: string) => {
    setRemovingId(memberId);
    try {
      await removeProjectTeamMember(projectId, userId);
    } catch {
      // Error handling could be improved with toast notification
    } finally {
      setRemovingId(null);
    }
  }, [projectId]);

  const handleRemoveSubcontractor = useCallback(async (memberId: string, subcontractorId: string) => {
    setRemovingId(memberId);
    try {
      await removeSubcontractorFromProject(projectId, subcontractorId);
    } catch {
      // Error handling could be improved with toast notification
    } finally {
      setRemovingId(null);
    }
  }, [projectId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Team Stats - Mobile optimized grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all duration-150',
            'active:scale-[0.98]',
            'text-left',
            activeTab === 'members'
              ? 'border-[#001B51] bg-[#001B51]/5 shadow-sm'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className={cn(
              'h-5 w-5',
              activeTab === 'members' ? 'text-[#001B51]' : 'text-gray-400'
            )} />
            <ChevronRight className={cn(
              'h-4 w-4 transition-transform',
              activeTab === 'members' ? 'text-[#001B51] rotate-90' : 'text-gray-300'
            )} />
          </div>
          <div className={cn(
            'text-2xl font-black',
            activeTab === 'members' ? 'text-[#001B51]' : 'text-gray-700'
          )}>
            {teamMembers.length}
          </div>
          <div className="text-sm font-medium text-gray-600">Team Members</div>
        </button>

        <button
          onClick={() => setActiveTab('subcontractors')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all duration-150',
            'active:scale-[0.98]',
            'text-left',
            activeTab === 'subcontractors'
              ? 'border-amber-500 bg-amber-50 shadow-sm'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <HardHat className={cn(
              'h-5 w-5',
              activeTab === 'subcontractors' ? 'text-amber-600' : 'text-gray-400'
            )} />
            <ChevronRight className={cn(
              'h-4 w-4 transition-transform',
              activeTab === 'subcontractors' ? 'text-amber-600 rotate-90' : 'text-gray-300'
            )} />
          </div>
          <div className={cn(
            'text-2xl font-black',
            activeTab === 'subcontractors' ? 'text-amber-600' : 'text-gray-700'
          )}>
            {subcontractors.length}
          </div>
          <div className="text-sm font-medium text-gray-600">Subcontractors</div>
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'members' ? (
                <div className="w-10 h-10 rounded-xl bg-[#001B51]/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-[#001B51]" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <HardHat className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-[#001B51] text-lg">
                  {activeTab === 'members' ? 'Team Members' : 'Subcontractors'}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeTab === 'members'
                    ? `${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''}`
                    : `${subcontractors.length} subcontractor${subcontractors.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => activeTab === 'members' ? setMemberModalOpen(true) : setSubcontractorModalOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 h-11',
                'rounded-xl font-bold text-sm',
                'transition-all duration-150',
                'active:scale-[0.98]',
                activeTab === 'members'
                  ? 'bg-[#001B51] text-white active:bg-[#001B51]/90'
                  : 'bg-amber-500 text-white active:bg-amber-600'
              )}
            >
              {activeTab === 'members' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Member</span>
                </>
              ) : (
                <>
                  <HardHat className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Sub</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Team Member List */}
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-gray-100"
            >
              {teamMembers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-700 mb-2">No team members yet</h4>
                  <p className="text-gray-500 mb-6 text-sm max-w-[280px] mx-auto">
                    Add team members to collaborate on this project
                  </p>
                  <button
                    onClick={() => setMemberModalOpen(true)}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 h-12',
                      'bg-[#001B51] text-white font-bold rounded-xl',
                      'active:scale-[0.98] active:bg-[#001B51]/90',
                      'transition-all duration-150'
                    )}
                  >
                    <UserPlus className="h-5 w-5" />
                    Add First Member
                  </button>
                </div>
              ) : (
                teamMembers.map((member, index) => {
                  const name = member.user_profiles?.name || 'Unknown';
                  const email = member.user_profiles?.email;
                  const avatar = member.user_profiles?.avatar_url;
                  const costs = getCostSummary(member.user_profiles?.id || null);

                  const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] || {
                    label: member.role,
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    borderColor: 'border-l-gray-400',
                  };

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'flex items-center gap-3 p-4',
                        'border-l-4',
                        roleConfig.borderColor,
                        'active:bg-gray-50 transition-colors'
                      )}
                    >
                      <Avatar className="h-12 w-12 border-2 border-gray-200 flex-shrink-0">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="bg-[#001B51] text-white font-bold text-sm">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate text-base">{name}</p>
                        {email && (
                          <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            {email}
                          </p>
                        )}
                        <Badge className={cn('mt-1.5 text-xs font-bold border', roleConfig.color)}>
                          {roleConfig.label}
                        </Badge>
                        {/* Cost summary line - only show if any values > 0 */}
                        {costs && (costs.taskCount > 0 || costs.taskCosts > 0 || costs.expenseCosts > 0) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {costs.taskCount} task{costs.taskCount !== 1 ? 's' : ''} | {formatCurrency(costs.taskCosts)} costs | {formatCurrency(costs.expenseCosts)} expenses
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => member.user_id && handleRemoveMember(member.id, member.user_id)}
                        disabled={removingId === member.id}
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          'border-2 border-gray-200',
                          'text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50',
                          'active:scale-[0.95]',
                          'transition-all duration-150',
                          'disabled:opacity-50'
                        )}
                      >
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'subcontractors' && (
            <motion.div
              key="subcontractors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-gray-100"
            >
              {subcontractors.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <HardHat className="h-8 w-8 text-amber-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-700 mb-2">No subcontractors yet</h4>
                  <p className="text-gray-500 mb-6 text-sm max-w-[280px] mx-auto">
                    Add subcontractors to work on this project
                  </p>
                  <button
                    onClick={() => setSubcontractorModalOpen(true)}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 h-12',
                      'bg-amber-500 text-white font-bold rounded-xl',
                      'active:scale-[0.98] active:bg-amber-600',
                      'transition-all duration-150'
                    )}
                  >
                    <HardHat className="h-5 w-5" />
                    Add First Subcontractor
                  </button>
                </div>
              ) : (
                subcontractors.map((member, index) => {
                  const sub = member.subcontractors;
                  const companyName = sub?.company_name || 'Unknown';
                  const contactName = sub?.contact_name;
                  const trade = sub?.trade_specialization;
                  const costs = getCostSummary(sub?.id || null);

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'flex items-center gap-3 p-4',
                        'border-l-4 border-l-amber-500',
                        'active:bg-gray-50 transition-colors'
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-amber-700 text-sm">
                          {getInitials(companyName)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate text-base">{companyName}</p>
                        {contactName && (
                          <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {contactName}
                          </p>
                        )}
                        {trade && (
                          <Badge className="mt-1.5 text-xs font-bold border bg-amber-100 text-amber-800 border-amber-200">
                            {trade.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        )}
                        {/* Cost summary line - only show if any values > 0 */}
                        {costs && (costs.taskCount > 0 || costs.taskCosts > 0 || costs.expenseCosts > 0) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {costs.taskCount} task{costs.taskCount !== 1 ? 's' : ''} | {formatCurrency(costs.taskCosts)} costs | {formatCurrency(costs.expenseCosts)} expenses
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          member.subcontractor_id &&
                          handleRemoveSubcontractor(member.id, member.subcontractor_id)
                        }
                        disabled={removingId === member.id}
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          'border-2 border-gray-200',
                          'text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50',
                          'active:scale-[0.95]',
                          'transition-all duration-150',
                          'disabled:opacity-50'
                        )}
                      >
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        projectId={projectId}
        companyId={companyId}
        open={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        existingMemberIds={teamMembers.map((m) => m.user_id).filter((id): id is string => id !== null)}
      />

      {/* Add Subcontractor Modal */}
      <AddSubcontractorModal
        projectId={projectId}
        companyId={companyId}
        open={subcontractorModalOpen}
        onOpenChange={setSubcontractorModalOpen}
        existingSubcontractorIds={subcontractors.map((m) => m.subcontractor_id).filter((id): id is string => id !== null)}
      />
    </div>
  );
}
