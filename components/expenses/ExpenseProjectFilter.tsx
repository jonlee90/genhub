'use client';

import { FolderKanban, Receipt, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExpenseProject } from '@/types/db/expense';

type Project = ExpenseProject;

interface ExpenseProjectFilterProps {
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  /** Total expense count for the selected project (or all projects if 'all' selected) */
  expenseCount?: number;
  /** Map of project ID to expense count for each project in the dropdown */
  projectExpenseCounts?: Record<string, number>;
  /** Map of project ID to total expense amount for each project in the dropdown */
  projectExpenseAmounts?: Record<string, number>;
}

export function ExpenseProjectFilter({
  projects,
  selectedProjectId,
  onProjectChange,
  expenseCount,
  projectExpenseCounts,
  projectExpenseAmounts,
}: ExpenseProjectFilterProps) {
  const projectName = selectedProjectId === 'all'
    ? 'All Projects'
    : projects.find((p) => p.id === selectedProjectId)?.name || 'Select Project';

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
              <span className="flex items-center gap-1">
                {projectName}
                {expenseCount !== undefined && (
                  <span className="inline-flex items-center gap-0.5 text-gray-500">
                    (<Receipt className="w-3 h-3" />
                    <span>{expenseCount}</span>)
                  </span>
                )}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px] overflow-y-auto"
          align="start"
        >
          <SelectItem
            value="all"
            className="font-medium [&>span]:flex-1 [&>span]:w-full"
          >
            <div className="flex items-center gap-2 w-full" style={{ width: '100%' }}>
              <FolderKanban className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1">All Projects</span>
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                ({projects.length})
              </span>
            </div>
          </SelectItem>

          <div className="my-1 h-px bg-gray-200" />

          {projects.map((project) => {
            const projectExpenseCount = projectExpenseCounts?.[project.id] ?? 0;
            const projectExpenseAmount = projectExpenseAmounts?.[project.id] ?? 0;
            return (
              <SelectItem
                key={project.id}
                value={project.id}
                className="font-medium [&>span]:flex-1 [&>span]:w-full"
              >
                <div className="flex items-center justify-between w-full min-w-0 gap-3" style={{ width: '100%' }}>
                  {/* Left side: Status indicator + Project name + Expense count */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        project.status === 'active' && "bg-green-500",
                        project.status === 'on_hold' && "bg-yellow-500",
                        project.status === 'completed' && "bg-blue-500",
                        !project.status && "bg-gray-400"
                      )}
                    />
                    <span className="truncate">{project.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-500 flex-shrink-0">
                      <Receipt className="w-3 h-3" />
                      <span>{projectExpenseCount}</span>
                    </span>
                  </div>
                  {/* Right side: Total expense amount - pushed to far right */}
                  {projectExpenseAmount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-construction-blue font-semibold flex-shrink-0 ml-auto">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(projectExpenseAmount)}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
