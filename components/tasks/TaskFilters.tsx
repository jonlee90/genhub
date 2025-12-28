'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Project = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  projects: Project[];
  teamMembers: TeamMember[];
}

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function TaskFilters({
  searchQuery,
  onSearchChange,
  projectFilter,
  onProjectChange,
  assigneeFilter,
  onAssigneeChange,
  priorityFilter,
  onPriorityChange,
  projects,
  teamMembers,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Project Filter */}
      <Select value={projectFilter} onValueChange={onProjectChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Assignee Filter */}
      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
