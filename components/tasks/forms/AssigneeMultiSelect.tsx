'use client';

import { useState, useEffect } from 'react';
import { Check, X, Users, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getProjectAssignees, type AssigneeOption, type TaskAssignee } from '@/app/actions/tasks';

interface AssigneeMultiSelectProps {
  projectId: string;
  selectedAssignees: TaskAssignee[];
  onChange: (assignees: TaskAssignee[]) => void;
  disabled?: boolean;
  assignees?: AssigneeOption[]; // Optional: Pre-fetched assignees to avoid N+1 queries
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function AssigneeMultiSelect({ projectId, selectedAssignees, onChange, disabled, assignees }: AssigneeMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Use pre-fetched assignees if provided, otherwise fetch them
  useEffect(() => {
    // If assignees are provided via props, use them directly
    if (assignees) {
      setOptions(assignees);
      setLoading(false);
      return;
    }

    // Otherwise, fall back to fetching (backward compatibility)
    if (projectId) {
      setLoading(true);
      getProjectAssignees(projectId).then(result => {
        if (result.data) setOptions(result.data);
        setLoading(false);
      });
    }
  }, [projectId, assignees]);

  const users = options.filter(o => o.type === 'user');
  const subcontractors = options.filter(o => o.type === 'subcontractor');

  const isSelected = (option: AssigneeOption) =>
    selectedAssignees.some(a => a.id === option.id && a.type === option.type);

  const toggleAssignee = (option: AssigneeOption) => {
    if (isSelected(option)) {
      onChange(selectedAssignees.filter(a => !(a.id === option.id && a.type === option.type)));
    } else {
      onChange([...selectedAssignees, { id: option.id, type: option.type }]);
    }
  };

  const removeAssignee = (assignee: TaskAssignee) => {
    onChange(selectedAssignees.filter(a => !(a.id === assignee.id && a.type === assignee.type)));
  };

  const selectedOptions = options.filter(o => isSelected(o));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 border-gray-200"
            disabled={disabled || loading}
          >
            <span className="text-gray-500">
              {selectedAssignees.length === 0 ? 'Select assignees...' : `${selectedAssignees.length} selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="max-h-64 overflow-y-auto">
            {users.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Team Members
                </div>
                {users.map(option => (
                  <div
                    key={`user-${option.id}`}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleAssignee(option)}
                  >
                    <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isSelected(option) ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                      {isSelected(option) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={option.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-[#001B51] text-white">{getInitials(option.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{option.name}</span>
                  </div>
                ))}
              </div>
            )}
            {subcontractors.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Subcontractors
                </div>
                {subcontractors.map(option => (
                  <div
                    key={`sub-${option.id}`}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleAssignee(option)}
                  >
                    <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isSelected(option) ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                      {isSelected(option) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-orange-600 text-white">{getInitials(option.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{option.name}</span>
                      {option.company_name && <span className="text-xs text-gray-500">{option.company_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {options.length === 0 && !loading && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No team members assigned to this project</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map(option => (
            <Badge key={`${option.type}-${option.id}`} variant="secondary" className="pl-1 pr-1 gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className={cn("text-[8px] text-white", option.type === 'user' ? "bg-[#001B51]" : "bg-orange-600")}>
                  {getInitials(option.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{option.name}</span>
              <button onClick={() => removeAssignee({ id: option.id, type: option.type })} className="hover:bg-gray-300 rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
