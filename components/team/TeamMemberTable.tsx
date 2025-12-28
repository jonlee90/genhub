'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Database } from '@/types/database.types';
import { updateTeamMemberRole, deactivateTeamMember } from '@/app/actions/team';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreVertical,
  ArrowUpDown,
  HardHat,
  Briefcase,
  Users,
  Hammer,
  UserCheck,
  Building2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';

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

interface TeamMemberTableProps {
  members: TeamMember[];
  currentUserRole: UserRole;
  companyId: string;
}

type SortField = 'name' | 'email' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 25;

const ROLE_CONFIG = {
  gc_admin: {
    label: 'GC Admin',
    color: 'bg-[#001B51] text-white border-[#001B51]',
    icon: Briefcase,
  },
  project_manager: {
    label: 'Project Manager',
    color: 'bg-[#3C3C3C] text-white border-[#3C3C3C]',
    icon: Building2,
  },
  foreman: {
    label: 'Foreman',
    color: 'bg-[#7A7A7A] text-white border-[#7A7A7A]',
    icon: HardHat,
  },
  field_worker: {
    label: 'Field Worker',
    color: 'bg-green-700 text-white border-green-700',
    icon: Hammer,
  },
  subcontractor: {
    label: 'Subcontractor',
    color: 'bg-yellow-600 text-white border-yellow-600',
    icon: Users,
  },
  client: {
    label: 'Client',
    color: 'bg-blue-600 text-white border-blue-600',
    icon: UserCheck,
  },
} as const;

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  invited: {
    label: 'Invited',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
} as const;

export function TeamMemberTable({ members, currentUserRole, companyId }: TeamMemberTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sort') as SortField) || 'name'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get('order') as SortDirection) || 'asc'
  );
  const [isPending, startTransition] = useTransition();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [optimisticMembers, setOptimisticMembers] = useState(members);

  const isGCAdmin = currentUserRole === 'gc_admin';

  // Sync optimistic state with server state
  useEffect(() => {
    setOptimisticMembers(members);
  }, [members]);

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';

    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('sort', field);
    params.set('order', newDirection);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    // Update state
    if (sortField === field) {
      setSortDirection(newDirection);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Memoized sorted and paginated members
  const sortedMembers = useMemo(() => {
    const membersToSort = [...optimisticMembers];

    membersToSort.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'name':
          aValue = a.user_profiles?.name || '';
          bValue = b.user_profiles?.name || '';
          break;
        case 'email':
          aValue = a.user_profiles?.email || '';
          bValue = b.user_profiles?.email || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return membersToSort;
  }, [optimisticMembers, sortField, sortDirection]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedMembers, currentPage]);

  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Optimistic update
    const previousMembers = [...optimisticMembers];
    setOptimisticMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
    );

    startTransition(async () => {
      const result = await updateTeamMemberRole(userId, newRole);
      if (result.error) {
        // Revert on error
        setOptimisticMembers(previousMembers);
        toast.error(result.error);
      } else {
        toast.success('Role updated successfully');
      }
    });
  };

  const handleDeactivate = async (userId: string) => {
    setDeactivateUserId(null);

    startTransition(async () => {
      const result = await deactivateTeamMember(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Team member deactivated successfully');
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-1 bg-[#001B51] rounded-full" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-600">{members.length} total members</p>
          </div>
        </div>

        {isGCAdmin && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-[#001B51] hover:bg-[#001B51]/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-[#001B51]/10">
                <TableHead className="font-bold text-gray-900">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-[#001B51] transition-colors"
                  >
                    Member
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-gray-900">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-[#001B51] transition-colors"
                  >
                    Email
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-gray-900">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-1 hover:text-[#001B51] transition-colors"
                  >
                    Role
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-gray-900">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-[#001B51] transition-colors"
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-bold text-gray-900">Projects</TableHead>
                {isGCAdmin && <TableHead className="font-bold text-gray-900">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isGCAdmin ? 6 : 5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">No team members found</p>
                      <p className="text-sm text-gray-400">
                        {isGCAdmin ? 'Click "Invite Team Member" to get started' : 'Contact your GC Admin to invite members'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const statusConfig = STATUS_CONFIG[member.status];
                  const RoleIcon = roleConfig.icon;

                  return (
                    <TableRow
                      key={member.id}
                      className="hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-gray-200">
                            <AvatarImage src={member.user_profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-[#001B51] text-white font-semibold">
                              {getInitials(member.user_profiles?.name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {member.user_profiles?.name || 'Unknown'}
                            </p>
                            {member.activated_at && (
                              <p className="text-xs text-gray-500">
                                Joined {new Date(member.activated_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {member.user_profiles?.email || 'No email'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${roleConfig.color} font-semibold border-2 px-3 py-1 flex items-center gap-1.5 w-fit`}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusConfig.color} font-medium border px-3 py-1`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700 font-medium">{member.project_count}</span>
                      </TableCell>
                      {isGCAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                disabled={isPending}
                                aria-label={`Actions for ${member.user_profiles?.name || 'team member'}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="font-bold text-gray-900">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
                                Change Role
                              </DropdownMenuLabel>
                              {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                                const Icon = config.icon;
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleRoleChange(member.user_id, role as UserRole)}
                                    disabled={member.role === role || isPending}
                                    className="cursor-pointer"
                                  >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {config.label}
                                  </DropdownMenuItem>
                                );
                              })}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeactivateUserId(member.user_id)}
                                disabled={member.status === 'inactive' || isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                Deactivate Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {sortedMembers.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedMembers.length)} of{' '}
              {sortedMembers.length} members
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog
        open={!!deactivateUserId}
        onOpenChange={(open) => !open && setDeactivateUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the team member's access immediately. They can be
              reactivated later by a GC Admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateUserId) handleDeactivate(deactivateUserId);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        companyId={companyId}
      />
    </div>
  );
}
