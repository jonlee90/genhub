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
import { DesktopTabs } from '@/components/ui/DesktopTabs';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { PlaceholdersVanishInput } from '@/components/ui/aceternity/placeholders-vanish-input';
import type { ProjectWithStats } from '@/app/actions/projects';
import { PROJECT_TYPE_ICON_MAP } from '@/lib/config/project-type-display';

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
  projectTypes?: Array<{ id: string; name: string; icon_name: string | null }>;
}

// Search placeholders
const searchPlaceholders = [
  "Search projects...",
  "Find by name...",
  "Search by client...",
  "Filter by address...",
];

// Normalize project type name to slug format (e.g., "Commercial Office" → "commercial_office")
function normalizeProjectTypeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

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
  projectTypes = [],
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
    <div className="space-y-4  mb-3">
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
            <SelectTrigger className="w-full md:w-[200px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-medium">All Types</span>
              </SelectItem>
              {projectTypes.map((type) => {
                const IconComponent = type.icon_name ? PROJECT_TYPE_ICON_MAP[type.icon_name] : null;
                const projectTypeSlug = normalizeProjectTypeName(type.name);
                return (
                  <SelectItem key={type.id} value={projectTypeSlug}>
                    <span className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="w-4 h-4 text-construction-blue" />}
                      <span className="font-medium">{type.name}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full md:w-[170px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
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
