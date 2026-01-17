'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Home from 'lucide-react/icons/home';
import UtensilsCrossed from 'lucide-react/icons/utensils-crossed';
import Coffee from 'lucide-react/icons/coffee';
import Building2 from 'lucide-react/icons/building-2';
import Factory from 'lucide-react/icons/factory';
import { DesktopTabs } from '@/components/ui/DesktopTabs';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { PlaceholdersVanishInput } from '@/components/ui/aceternity/placeholders-vanish-input';
import type { ProjectWithStats } from '@/app/actions/projects';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  projects: ProjectWithStats[];
}

// Search placeholders
const searchPlaceholders = [
  "Search projects...",
  "Find by name...",
  "Search by client...",
  "Filter by address...",
];

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortChange,
  projects,
}: ProjectFiltersProps) {
  // Calculate project counts by status
  const statusCounts = useMemo(() => {
    // Filter projects by search and type (exclude status filter)
    const projectsForCounting = projects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(query) ||
          project.client_name.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && project.project_type !== typeFilter) {
        return false;
      }

      return true;
    });

    const counts: Record<string, number> = {
      all: projectsForCounting.length,
      planning: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
    };

    projectsForCounting.forEach((project) => {
      if (project.status in counts) {
        counts[project.status]++;
      }
    });

    return counts;
  }, [projects, searchQuery, typeFilter]);

  // Status tabs configuration without icons, with counts
  const statusTabs = useMemo(() => [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'planning', label: 'Planning', count: statusCounts.planning },
    { value: 'active', label: 'Active', count: statusCounts.active },
    { value: 'on_hold', label: 'On Hold', count: statusCounts.on_hold },
    { value: 'completed', label: 'Completed', count: statusCounts.completed },
  ], [statusCounts]);

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs - Mobile View (< 768px) */}
      <div className="md:hidden">
        <FilterTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={onStatusChange}
          showCounts={true}
          useStatusGradients={true}
          layoutId="projectStatusTabsMobile"
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
          layoutId="projectStatusTabs"
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
        <div className='grid grid-cols-2'>
          {/* Project type dropdown with construction styling */}
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full md:w-[200px] h-11 border-2 border-gray-200 font-bold hover:border-construction-blue/50 transition-colors">
              <SelectValue placeholder="Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-medium">All Types</span>
              </SelectItem>
              <SelectItem value="residential">
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Residential</span>
                </span>
              </SelectItem>
              <SelectItem value="restaurant">
                <span className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Restaurant</span>
                </span>
              </SelectItem>
              <SelectItem value="cafe">
                <span className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Cafe</span>
                </span>
              </SelectItem>
              <SelectItem value="commercial_office">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Commercial Office</span>
                </span>
              </SelectItem>
              <SelectItem value="industrial">
                <span className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-600" />
                  <span className="font-medium">Industrial</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full md:w-[170px] h-11 border-2 border-gray-200 font-bold hover:border-construction-blue/50 transition-colors">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">
                <span className="font-medium">Newest First</span>
              </SelectItem>
              <SelectItem value="name">
                <span className="font-medium">Name (A-Z)</span>
              </SelectItem>
              <SelectItem value="client">
                <span className="font-medium">Client (A-Z)</span>
              </SelectItem>
              <SelectItem value="start_date">
                <span className="font-medium">Start Date</span>
              </SelectItem>
              <SelectItem value="health_score">
                <span className="font-medium">Health Score</span>
              </SelectItem>
              <SelectItem value="completion">
                <span className="font-medium">Completion %</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
