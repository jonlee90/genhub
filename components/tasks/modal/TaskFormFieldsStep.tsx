/**
 * TaskFormFieldsStep - Main form fields for task creation/editing
 *
 * Renders all task form fields based on task type configuration:
 * - Basic fields: Title, Description, Project, Phase, Priority
 * - Date fields: Start Date, Due Date
 * - Cost fields: Planned Cost, Actual Cost
 * - Status (edit mode only)
 * - Approval workflow section
 * - Receipt upload
 * - Auto-expense settings
 * - Materials section
 * - Expenses section
 */
"use client";

import React, { useState, useMemo } from "react";
import { m as motion } from "framer-motion";
import {
  Calendar,
  Flag,
  Layers,
  FolderKanban,
  DollarSign,
  FileText,
  Sparkles,
  ClipboardList,
  MessageSquare,
  Loader2,
  Check,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isFieldVisible } from "@/lib/config/task-type-fields";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/lib/config/task-colors";
import type { TaskType } from "@/types/db/enums";
import type { FieldConfig } from "@/lib/config/task-type-fields";

interface Project {
  id: string;
  name: string;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index?: number;
  }>;
}

interface TaskFormFieldsStepProps {
  // Mode
  mode: "create" | "edit";
  taskType: TaskType | null;
  config: FieldConfig;

  // Basic fields
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  selectedProjectId: string;
  onProjectChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;

  // Phase
  phaseId: string;
  onPhaseChange: (value: string) => void;

  // Dates
  startDate: string;
  onStartDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;

  // Costs
  plannedCost: string;
  onPlannedCostChange: (value: string) => void;
  actualCost: string;
  onActualCostChange: (value: string) => void;

  // Status (edit mode)
  status: string;
  onStatusChange: (value: string) => void;

  // Projects
  projects: Project[];

  // Disabled state
  disabled?: boolean;

  // Approval workflow (optional - edit mode only)
  approvalStatus?: string | null;
  approvalNotes?: string;
  onApprovalNotesChange?: (value: string) => void;
  onApprovalAction?: (
    status: "approved" | "rejected" | "revision_requested",
  ) => void;
  isApprovalPending?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNotesHistory?: string | null;
}

const DEFAULT_THEME = {
  iconColor: "text-construction-blue",
  focusRing: "focus:ring-construction-blue/20 focus:border-construction-blue",
};

/**
 * Main form fields step - renders all task form fields
 * Conditionally shows/hides fields based on task type configuration
 */
export function TaskFormFieldsStep({
  mode,
  taskType,
  config,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  selectedProjectId,
  onProjectChange,
  priority,
  onPriorityChange,
  phaseId,
  onPhaseChange,
  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,
  plannedCost,
  onPlannedCostChange,
  actualCost,
  onActualCostChange,
  status,
  onStatusChange,
  projects,
  disabled,
  approvalStatus,
  approvalNotes,
  onApprovalNotesChange,
  onApprovalAction,
  isApprovalPending,
  approvedBy,
  approvedAt,
  approvalNotesHistory,
}: TaskFormFieldsStepProps) {
  const theme = DEFAULT_THEME;

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  // Handle start date change with due date validation
  const handleStartDateChange = (newStartDate: string) => {
    onStartDateChange(newStartDate);
    // If start date is after due date, update due date to match
    if (dueDate && newStartDate > dueDate) {
      onDueDateChange(newStartDate);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Project Selection - Required for create mode */}
      {mode === "create" && (
        <div className="space-y-2">
          <Label
            htmlFor="project"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <FolderKanban className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            Project <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedProjectId}
            onValueChange={(value) => {
              onProjectChange(value);
              // Reset phase when project changes
              onPhaseChange("none");
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id="project"
              className="h-11 border-gray-200 dark:border-gray-700"
            >
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Approval Status Section - Conditional rendering based on task type */}
      {isFieldVisible(taskType, "approvalWorkflow", mode) && approvalStatus && (
        <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
              Approval Workflow
            </h3>
            <span
              className={cn(
                "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                approvalStatus === "pending" &&
                  "bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
                approvalStatus === "approved" &&
                  "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
                approvalStatus === "rejected" &&
                  "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200",
                approvalStatus === "revision_requested" &&
                  "bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
              )}
            >
              {approvalStatus.replace("_", " ").toUpperCase()}
            </span>
          </div>

          {/* Approval Notes Input */}
          <div className="space-y-2 mb-3">
            <Label
              htmlFor="approval_notes"
              className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Approval Notes
            </Label>
            <Textarea
              id="approval_notes"
              value={approvalNotes || ""}
              onChange={(e) => onApprovalNotesChange?.(e.target.value)}
              placeholder="Add notes for this approval decision..."
              rows={2}
              disabled={isApprovalPending || approvalStatus === "approved"}
              className="border-amber-200 dark:border-amber-900/40 focus:ring-amber-500/20 focus:border-amber-500 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Approval Action Buttons */}
          {approvalStatus !== "approved" && onApprovalAction && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onApprovalAction("approved")}
                disabled={isApprovalPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isApprovalPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onApprovalAction("revision_requested")}
                disabled={isApprovalPending}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Request Revision
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onApprovalAction("rejected")}
                disabled={isApprovalPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          {/* Show previous approval info if exists */}
          {approvedBy && approvedAt && (
            <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700">
              Last updated: {new Date(approvedAt).toLocaleDateString()}
              {approvalNotesHistory && (
                <p className="mt-1 italic">"{approvalNotesHistory}"</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label
          htmlFor="title"
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <Sparkles className={cn("h-4 w-4", theme.iconColor)} />
          Task Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="What needs to be done?"
          required
          disabled={disabled}
          className={cn(
            "h-11 border-gray-200 dark:border-gray-700",
            theme.focusRing,
          )}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add details about this task..."
          rows={3}
          disabled={disabled}
          className={cn(
            "border-gray-200 dark:border-gray-700 resize-none",
            theme.focusRing,
          )}
        />
      </div>

      {/* Status & Phase Row */}
      <div
        className={cn(
          "grid gap-4",
          isFieldVisible(taskType, "phase", mode)
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        {/* Status field - Edit mode only */}
        {mode === "edit" && (
          <div className="space-y-2">
            <Label
              htmlFor="status"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={onStatusChange}
              disabled={disabled}
            >
              <SelectTrigger
                id="status"
                className="h-11 border-gray-200 dark:border-gray-700"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    textValue={config.label}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", config.dotColor)}
                      />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phase field - Hidden for admin tasks */}
        {isFieldVisible(taskType, "phase", mode) && (
          <div className="space-y-2">
            <Label
              htmlFor="phase"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <Layers className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Phase
            </Label>
            <Select
              value={phaseId}
              onValueChange={onPhaseChange}
              disabled={disabled || !selectedProjectId}
            >
              <SelectTrigger
                id="phase"
                className="h-11 border-gray-200 dark:border-gray-700"
              >
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No phase</SelectItem>
                {phases
                  .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                  .map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Priority - Always visible */}
      <div className="space-y-2">
        <Label
          htmlFor="priority"
          className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <Flag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Priority
        </Label>
        <Select
          value={priority}
          onValueChange={onPriorityChange}
          disabled={disabled}
        >
          <SelectTrigger
            id="priority"
            className="h-11 border-gray-200 dark:border-gray-700"
          >
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value} textValue={config.label}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn("w-2 h-2 rounded-full", config.dotColor)}
                  />
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Row */}
      <div
        className={cn(
          "grid gap-4",
          isFieldVisible(taskType, "startDate", mode)
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1",
        )}
      >
        {/* Start Date - Hidden for admin tasks */}
        {isFieldVisible(taskType, "startDate", mode) && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              disabled={disabled}
              className="h-11 border-gray-200 dark:border-gray-700"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            Due Date
          </Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            disabled={disabled}
            min={startDate || undefined}
            className="h-11 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Costs Row - Conditional rendering and dynamic labels */}
      {isFieldVisible(taskType, "plannedCost", mode) && (
        <div
          className={cn(
            "grid gap-4",
            isFieldVisible(taskType, "actualCost", mode)
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1",
          )}
        >
          {/* Planned Cost with dynamic label */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              {config.labels.plannedCost}
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={plannedCost}
              onChange={(e) => onPlannedCostChange(e.target.value)}
              placeholder="0.00"
              disabled={disabled}
              className={cn(
                "h-11 border-gray-200 dark:border-gray-700",
                taskType === "purchase" &&
                  "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500",
              )}
            />
          </div>

          {/* Actual Cost - Edit mode only */}
          {isFieldVisible(taskType, "actualCost", mode) && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className={cn("h-4 w-4", theme.iconColor)} />
                Actual Cost
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={actualCost}
                onChange={(e) => onActualCostChange(e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                className="h-11 border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
