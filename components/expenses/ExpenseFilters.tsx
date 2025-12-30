'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';

// Debug: Expense filters component
interface Project {
  id: string;
  name: string;
}

interface ExpenseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  projectFilter: string;
  onProjectChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  projects: Project[];
}

export function ExpenseFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  projectFilter,
  onProjectChange,
  sortBy,
  onSortChange,
  projects,
}: ExpenseFiltersProps) {
  // Debug: Track filter changes
  console.log('[ExpenseFilters] Current filters:', {
    searchQuery,
    statusFilter,
    projectFilter,
    sortBy,
  });

  return (
    <div className="relative">
      {/* Industrial frame with construction theme */}
      <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

      <div className="bg-white border-2 border-gray-200 rounded-lg md:rounded-xl shadow-construction p-3 md:p-5">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
          <h3 className="text-sm md:text-base font-black text-construction-blue uppercase tracking-wider">
            Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => {
                console.log('[ExpenseFilters] Search query changed:', e.target.value);
                onSearchChange(e.target.value);
              }}
              className="pl-10 border-2 border-gray-200 focus:border-construction-blue transition-colors h-10 md:h-11 font-medium"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              console.log('[ExpenseFilters] Status filter changed:', value);
              onStatusChange(value);
            }}
          >
            <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue h-10 md:h-11 font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Project Filter */}
          <Select
            value={projectFilter}
            onValueChange={(value) => {
              console.log('[ExpenseFilters] Project filter changed:', value);
              onProjectChange(value);
            }}
          >
            <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue h-10 md:h-11 font-medium">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onValueChange={(value) => {
              console.log('[ExpenseFilters] Sort changed:', value);
              onSortChange(value);
            }}
          >
            <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue h-10 md:h-11 font-medium sm:col-span-2 lg:col-span-1">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Latest First</SelectItem>
              <SelectItem value="date">Expense Date</SelectItem>
              <SelectItem value="amount_high">Amount (High to Low)</SelectItem>
              <SelectItem value="amount_low">Amount (Low to High)</SelectItem>
              <SelectItem value="description">Description (A-Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
