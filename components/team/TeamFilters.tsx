'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Performance optimization: Direct imports instead of barrel file
import { DesktopTabs } from '@/components/ui/DesktopTabs';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { PlaceholdersVanishInput } from '@/components/ui/aceternity/placeholders-vanish-input';
import type { TeamMember } from '@/types/team';

interface TeamFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  members: TeamMember[];
}

// Search placeholders
const searchPlaceholders = [
  "Search team members...",
  "Find by name...",
  "Search by email...",
  "Filter by role...",
];

export function TeamFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  roleFilter,
  onRoleChange,
  sortBy,
  onSortChange,
  members,
}: TeamFiltersProps) {
  // Calculate member counts by status
  const statusCounts = useMemo(() => {
    // Filter members by search and role (exclude status filter)
    const membersForCounting = members.filter((member) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          member.user_profiles?.name?.toLowerCase().includes(query) ||
          member.user_profiles?.email?.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      return true;
    });

    const counts: Record<string, number> = {
      all: membersForCounting.length,
      active: 0,
      invited: 0,
      inactive: 0,
    };

    membersForCounting.forEach((member) => {
      if (member.status in counts) {
        counts[member.status]++;
      }
    });

    return counts;
  }, [members, searchQuery, roleFilter]);

  // Status tabs configuration with counts
  const statusTabs = useMemo(() => [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'active', label: 'Active', count: statusCounts.active },
    { value: 'invited', label: 'Invited', count: statusCounts.invited },
    { value: 'inactive', label: 'Inactive', count: statusCounts.inactive },
  ], [statusCounts]);

  return (
    <div className="space-y-4 mb-3">
      {/* Status Filter Tabs - Mobile View (< 768px) */}
      <div className="md:hidden">
        <FilterTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={onStatusChange}
          showCounts={true}
          useStatusGradients={true}
          layoutId="teamStatusTabsMobile"
        />
      </div>

      {/* Status Filter Tabs - Desktop/Tablet View (≥ 768px) */}
      <div className="hidden md:block">
        <DesktopTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={onStatusChange}
          showCounts={true}
          useStatusGradients={true}
          layoutId="teamStatusTabs"
        />
      </div>

      {/* Search & Dropdowns */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
        {/* Search input with vanishing placeholders */}
        <div className="flex-1 min-w-[280px]">
          <PlaceholdersVanishInput
            placeholders={searchPlaceholders}
            value={searchQuery}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
          />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          {/* Role filter dropdown with construction styling */}
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger className="w-full md:w-[200px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-medium">All Roles</span>
              </SelectItem>
              <SelectItem value="admin">
                <span className="font-medium">Admin</span>
              </SelectItem>
              <SelectItem value="project_manager">
                <span className="font-medium">Project Manager</span>
              </SelectItem>
              <SelectItem value="foreman">
                <span className="font-medium">Foreman</span>
              </SelectItem>
              <SelectItem value="field_worker">
                <span className="font-medium">Field Worker</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full md:w-[170px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">
                <span className="font-medium">Name (A-Z)</span>
              </SelectItem>
              <SelectItem value="email">
                <span className="font-medium">Email (A-Z)</span>
              </SelectItem>
              <SelectItem value="role">
                <span className="font-medium">Role</span>
              </SelectItem>
              <SelectItem value="joined">
                <span className="font-medium">Join Date</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
