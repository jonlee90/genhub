/**
 * TaskAssigneeStep - Assignee selection and management
 *
 * Renders multi-assignee selector and optional primary assignee selector
 * for auto-expense functionality.
 */
"use client";

import React from "react";
import { User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AssigneeMultiSelect } from "../AssigneeMultiSelect";
import {
  PrimaryAssigneeSelector,
  type AssigneeOption,
} from "../PrimaryAssigneeSelector";
import type { TaskAssignee } from "@/app/actions/tasks";

interface TaskAssigneeStepProps {
  // Project context
  projectId: string;

  // Multi-assignee selection
  selectedAssignees: TaskAssignee[];
  onAssigneesChange: (assignees: TaskAssignee[]) => void;

  // Primary assignee (for auto-expense)
  primaryAssigneeId: string | null;
  onPrimaryAssigneeChange: (id: string | null) => void;
  assigneeOptions: AssigneeOption[];

  // Optional: Pre-fetched assignees to avoid N+1 queries
  assignees?: Array<{
    id: string;
    type: "user" | "subcontractor";
    name: string;
    email?: string;
    avatar_url?: string | null;
    company_name?: string;
  }>;

  // Show primary assignee selector
  showPrimarySelector?: boolean;

  // Disabled state
  disabled?: boolean;
}

/**
 * Assignee selection step - handles multi-assignee selection
 * and primary assignee selection for auto-expense functionality
 */
export function TaskAssigneeStep({
  projectId,
  selectedAssignees,
  onAssigneesChange,
  primaryAssigneeId,
  onPrimaryAssigneeChange,
  assigneeOptions,
  assignees,
  showPrimarySelector = false,
  disabled,
}: TaskAssigneeStepProps) {
  return (
    <div className="space-y-4">
      {/* Multi-Assignee Selection */}
      <div className="space-y-2">
        <Label
          htmlFor="assignee"
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Assignees
        </Label>
        <AssigneeMultiSelect
          projectId={projectId}
          selectedAssignees={selectedAssignees}
          onChange={onAssigneesChange}
          disabled={disabled}
          assignees={assignees}
        />
      </div>

      {/* Primary Assignee Selector - Only when multiple assignees */}
      {showPrimarySelector && assigneeOptions.length > 1 && (
        <PrimaryAssigneeSelector
          assignees={assigneeOptions}
          primaryId={primaryAssigneeId}
          onPrimaryChange={onPrimaryAssigneeChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
