'use client';

import { FolderKanban, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  status?: string;
};

interface ProjectFilterHeaderProps {
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
}

export function ProjectFilterHeader({
  projects,
  selectedProjectId,
  onProjectChange,
}: ProjectFilterHeaderProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const displayText = selectedProjectId === 'all' ? 'All Projects' : selectedProject?.name || 'Select Project';

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedProjectId} onValueChange={onProjectChange}>
        <SelectTrigger
          className={cn(
            "min-w-[200px] sm:min-w-[280px] h-11 px-4",
            "bg-white border-2 border-construction-blue/20 rounded-lg",
            "hover:border-construction-blue/40 transition-colors",
            "focus:ring-2 focus:ring-construction-blue/20 focus:border-construction-blue",
            "font-semibold text-construction-blue",
            selectedProjectId !== 'all' && "bg-construction-blue/5"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedProjectId !== 'all' && (
              <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
            )}
            <SelectValue placeholder="All Projects">
              {displayText}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px] overflow-y-auto"
          align="start"
        >
          <SelectItem
            value="all"
            className="font-medium"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-gray-400" />
              All Projects
              <span className="ml-auto text-xs text-gray-400">
                ({projects.length})
              </span>
            </div>
          </SelectItem>

          <div className="my-1 h-px bg-gray-200" />

          {projects.map((project) => (
            <SelectItem
              key={project.id}
              value={project.id}
              className="font-medium"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    project.status === 'active' && "bg-green-500",
                    project.status === 'on_hold' && "bg-yellow-500",
                    project.status === 'completed' && "bg-blue-500",
                    !project.status && "bg-gray-400"
                  )}
                />
                <span className="truncate">{project.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FolderKanban className="w-5 h-5 text-construction-blue" />
    </div>
  );
}
