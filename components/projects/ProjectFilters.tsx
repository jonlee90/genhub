'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, UtensilsCrossed, Coffee, Building2, Factory } from 'lucide-react';
import { Tabs } from '@/components/ui/aceternity/tabs';
import { PlaceholdersVanishInput } from '@/components/ui/aceternity/placeholders-vanish-input';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
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
}: ProjectFiltersProps) {
  // Status tabs configuration
  const statusTabs = [
    { id: 'all', label: 'All Projects' },
    { id: 'active', label: 'Active' },
    { id: 'on_hold', label: 'On Hold' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-4">

 
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

           {/* Status Tabs */}
      <Tabs
        tabs={statusTabs}
        activeTab={statusFilter}
        onChange={onStatusChange}
      />

    </div>
  );
}
