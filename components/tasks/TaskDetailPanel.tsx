"use client";

// Phase 4 - Task Detail Panel (slide-out drawer)
// Main panel component with tab navigation for task details, materials, expenses, attachments, activity

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskDetails } from "@/app/actions/tasks";
import { TaskDetailsTab } from ".//TaskDetailsTab";
import { MaterialTab } from ".//MaterialTab";
import { ExpensesTab } from ".//ExpensesTab";
import { AttachmentsTab } from ".//AttachmentsTab";
import { ActivityTab } from ".//ActivityTab";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

// Task details type (from server action)
export type TaskDetails = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  start_date?: string;
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  phase?: {
    id: string;
    name: string;
  };
  spatial_marker?: {
    id: string;
    position_x: number;
    position_y: number;
    position_z: number;
    element_id?: string;
  };
  material_count?: number;
  expense_count?: number;
  attachment_count?: number;
  planned_cost?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
};

// Component props
export interface TaskDetailPanelProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string; // For edit permissions (client = read-only)
  hasBudgetVisibility?: boolean; // NEW: Controls cost visibility (default: true)
}

// Tab type
type TabType = "details" | "materials" | "expenses" | "attachments" | "activity";

/**
 * TaskDetailPanel - Slide-out drawer showing full task information
 * Desktop: 500px width, slides from right
 * Mobile: Full width, 70vh height, slides from bottom
 *
 * Tabs: Details | Materials | Expenses | Attachments | Activity
 */
export function TaskDetailPanel({ taskId, isOpen, onClose, userRole, hasBudgetVisibility = true }: TaskDetailPanelProps) {
  // Tab and data state
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [taskData, setTaskData] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, setError, clearError } = useActionWithError();

  // Fetch task details when panel opens
  useEffect(() => {
    if (!taskId || !isOpen) {
      setTaskData(null);
      setError(null);
      return;
    }

    const fetchTask = async () => {
      setLoading(true);
      setError(null);

      const result = await getTaskDetails(taskId);

      if (result.error) {
        setError(result.error);
        setTaskData(null);
      } else if (result.data) {
        setTaskData(result.data);
      }

      setLoading(false);
    };

    fetchTask();
  }, [taskId, isOpen]);

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
    }
  }, [isOpen]);

  // Don"t render if closed
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay (mobile only) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel Container - Bottom sheet on mobile, side drawer on desktop */}
      <div
        className={cn(
          "fixed bg-white dark:bg-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-out",
          // Desktop: slide from right, 500px width, full height
          "md:top-0 md:right-0 md:w-[500px] md:h-full md:border-l-4 md:border-l-[var(--construction-blue)] dark:md:border-l-blue-500",
          isOpen ? "md:translate-x-0" : "md:translate-x-full",
          // Mobile: slide from bottom (bottom sheet), full width, 70vh height
          "bottom-0 left-0 right-0 rounded-t-2xl border-t-4 border-t-[var(--construction-blue)] dark:border-t-blue-500",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          height: typeof window !== "undefined" && window.innerWidth < 768 ? "70vh" : "100vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
      >
        {/* Mobile Drag Handle (visual affordance) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header with title and close button */}
        <div className="border-b-2 border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gradient-to-r from-[var(--construction-blue)]/5 dark:from-[var(--construction-blue)]/10 to-transparent">
          <h2
            id="task-panel-title"
            className="font-black uppercase text-lg tracking-tight text-construction-blue dark:text-blue-400 truncate pr-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </span>
            ) : error ? (
              "Error"
            ) : taskData ? (
              taskData.title
            ) : (
              "Task Details"
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            aria-label="Close panel"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto bg-gray-50 dark:bg-gray-800">
          {(["details", "materials", "expenses", "attachments", "activity"] as TabType[]).map(tab => {
            // Get badge count for tab
            const getBadgeCount = () => {
              if (!taskData) return null;
              switch (tab) {
                case "materials":
                  return taskData.material_count || 0;
                case "expenses":
                  return taskData.expense_count || 0;
                case "attachments":
                  return taskData.attachment_count || 0;
                default:
                  return null;
              }
            };

            const badgeCount = getBadgeCount();

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 font-bold uppercase text-xs whitespace-nowrap relative transition-all",
                  "flex items-center gap-2",
                  activeTab === tab
                    ? "text-construction-blue dark:text-blue-400 bg-white dark:bg-gray-900"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {tab}
                {badgeCount !== null && badgeCount > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-bold",
                    activeTab === tab ? "bg-construction-blue dark:bg-blue-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  )}>
                    {badgeCount}
                  </span>
                )}
                {/* Active tab indicator */}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-construction-blue dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 120px)" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
              <p className="text-sm text-gray-500">Loading task details...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorBanner error={error} onDismiss={clearError} />
            </div>
          ) : taskData ? (
            <div className="p-4">
              {activeTab === "details" && <TaskDetailsTab task={taskData} userRole={userRole} />}
              {activeTab === "materials" && <MaterialTab taskId={taskData.id} hasBudgetVisibility={hasBudgetVisibility} />}
              {activeTab === "expenses" && <ExpensesTab taskId={taskData.id} hasBudgetVisibility={hasBudgetVisibility} />}
              {activeTab === "attachments" && <AttachmentsTab taskId={taskData.id} />}
              {activeTab === "activity" && <ActivityTab taskId={taskData.id} />}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No task selected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
