/**
 * TaskLinker - Enhanced P2.5
 * Support for both 'create' and 'link' modes
 * Create mode: Creates new task at 3D location
 * Link mode: Links existing task to 3D location
 */

"use client";

import { useState, useTransition } from "react";
import { m as motion } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Search from "lucide-react/icons/search";
import MapPin from "lucide-react/icons/map-pin";
import Link2 from "lucide-react/icons/link-2";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import Loader2 from "lucide-react/icons/loader-2";
import Plus from "lucide-react/icons/plus";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateTask } from "@/app/actions/tasks";
import { createTaskAtLocation } from "@/app/actions/spatial";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  spatial_marker_id?: string | null;
  phase?: {
    id: string;
    name: string;
  };
}

interface TaskLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "link";
  // For link mode
  markerId?: string;
  markerTitle?: string;
  projectTasks?: Task[];
  onTaskLinked?: (taskId: string) => void;
  // For create mode
  position?: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  elementId?: string;
  projectId?: string;
  phaseId?: string;
  phases?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ id: string; name: string }>;
  onTaskCreated?: (task: any, marker: any) => void;
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

export function TaskLinker(props: TaskLinkerProps) {
  const { mode } = props;

  console.log("[TaskLinker] Rendering mode:", mode);

  if (mode === "create") {
    return <CreateTaskMode {...props} />;
  }

  return <LinkTaskMode {...props} />;
}

// CREATE MODE: New task creation at 3D location
function CreateTaskMode({
  isOpen,
  onClose,
  position,
  normal: _normal,
  elementId,
  projectId,
  phaseId: defaultPhaseId,
  phases = [],
  teamMembers = [],
  onTaskCreated,
}: TaskLinkerProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phaseId, setPhaseId] = useState(defaultPhaseId || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  console.log("[CreateTaskMode] Rendering", { position, projectId });

  const handleSubmit = async () => {
    if (!title.trim() || !projectId || !position) {
      toast.error("Title and location are required");
      return;
    }

    startTransition(async () => {
      try {
        // Convert null to undefined for optional fields to match function signature
        const taskData = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          phase_id: phaseId || undefined,
          assignee_id: assigneeId || undefined,
          due_date: dueDate || undefined,
        };

        // Pass projectId as separate argument per function signature
        const result = await createTaskAtLocation(
          taskData,
          position,
          projectId,
          elementId,
        );

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to create task");
        }

        console.log("[CreateTaskMode] Task created:", result.data);
        toast.success("Task created at 3D location");
        onTaskCreated?.(result.data.task, result.data.marker);
        handleClose();
      } catch (error) {
        console.error("[CreateTaskMode] Error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to create task",
        );
      }
    });
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPhaseId(defaultPhaseId || "");
    setPriority("medium");
    setAssigneeId("");
    setDueDate("");
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Task at Location"
      icon={Plus}
      maxWidth="lg"
      showNavigation={true}
      onBack={handleClose}
      backLabel="Cancel"
      onContinue={handleSubmit}
      continueLabel={isPending ? "Creating..." : "Create Task"}
      continueDisabled={isPending || !title.trim()}
    >
      <div className="space-y-5">
        {/* 3D Position */}
        {position && (
          <div className="p-4 bg-construction-blue/5 rounded-lg border-2 border-construction-blue/20">
            <div className="text-[10px] font-mono font-bold text-construction-blue/70 uppercase tracking-wider mb-2">
              3D Position
            </div>
            <div className="font-mono text-sm text-gray-900">
              X: {position.x.toFixed(2)} / Y: {position.y.toFixed(2)} / Z:{" "}
              {position.z.toFixed(2)}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20",
              "placeholder:text-gray-400 text-sm font-medium",
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20",
              "placeholder:text-gray-400 text-sm resize-none",
            )}
          />
        </div>

        {/* Phase */}
        {phases.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Phase
            </label>
            <select
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "border-2 border-gray-200",
                "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20",
                "text-sm font-medium",
              )}
            >
              <option value="">No Phase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Priority
          </label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setPriority(level)}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg font-bold text-sm uppercase",
                  "border-2 transition-all duration-200",
                  priority === level
                    ? "border-construction-blue bg-construction-blue text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-300",
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        {teamMembers.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Assign To
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "border-2 border-gray-200",
                "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20",
                "text-sm font-medium",
              )}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Due Date */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20",
              "text-sm font-medium",
            )}
          />
        </div>
      </div>
    </ResponsiveModal>
  );
}

// LINK MODE: Link existing task to 3D location
function LinkTaskMode({
  isOpen,
  onClose,
  markerId,
  markerTitle,
  projectTasks = [],
  onTaskLinked,
}: TaskLinkerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  console.log(
    "[LinkTaskMode] Rendering with marker:",
    markerId,
    "Tasks:",
    projectTasks.length,
  );

  const filteredTasks = projectTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.phase?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleLinkTask = async (taskId: string) => {
    if (!markerId) {
      toast.error("No marker selected");
      return;
    }

    console.log("[LinkTaskMode] Linking task:", taskId, "to marker:", markerId);
    setIsLinking(true);
    setSelectedTaskId(taskId);

    try {
      const formData = new FormData();
      formData.append("id", taskId);
      formData.append("spatial_marker_id", markerId);

      const result = await updateTask(formData);

      if (result.success) {
        console.log("[LinkTaskMode] Task linked successfully");
        toast.success("Task linked to 3D marker");
        onTaskLinked?.(taskId);
        onClose();
      } else {
        console.error("[LinkTaskMode] Failed to link task:", result.error);
        toast.error(result.error || "Failed to link task");
      }
    } catch (error) {
      console.error("[LinkTaskMode] Error linking task:", error);
      toast.error("Failed to link task");
    } finally {
      setIsLinking(false);
      setSelectedTaskId(null);
    }
  };

  const handleUnlinkTask = async (taskId: string) => {
    console.log("[LinkTaskMode] Unlinking task:", taskId);
    setIsLinking(true);
    setSelectedTaskId(taskId);

    try {
      const formData = new FormData();
      formData.append("id", taskId);
      formData.append("spatial_marker_id", "");

      const result = await updateTask(formData);

      if (result.success) {
        console.log("[LinkTaskMode] Task unlinked successfully");
        toast.success("Task unlinked from marker");
        onTaskLinked?.(taskId);
      } else {
        console.error("[LinkTaskMode] Failed to unlink task:", result.error);
        toast.error(result.error || "Failed to unlink task");
      }
    } catch (error) {
      console.error("[LinkTaskMode] Error unlinking task:", error);
      toast.error("Failed to unlink task");
    } finally {
      setIsLinking(false);
      setSelectedTaskId(null);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Task to Marker"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Marker Info */}
        {markerTitle && (
          <div className="flex items-center gap-3 p-4 bg-construction-blue/5 rounded-lg border-2 border-construction-blue/20">
            <div className="p-2 bg-construction-blue rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/70">
                Target Marker
              </div>
              <div className="text-sm font-bold text-gray-900">
                {markerTitle}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-construction-blue/20",
              "placeholder:text-gray-400 text-sm",
            )}
          />
        </div>

        {/* Task List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm font-bold text-gray-900 mb-1">
                No tasks found
              </div>
              <div className="text-xs text-gray-500">
                Try adjusting your search query
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isLinked = task.spatial_marker_id === markerId;
              const isProcessing = isLinking && selectedTaskId === task.id;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    isLinked
                      ? "bg-construction-blue/5 border-construction-blue"
                      : "bg-white border-gray-200 hover:border-gray-300",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                          {task.title}
                        </h4>
                        {isLinked && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-construction-blue/10 rounded text-xs font-mono font-bold text-construction-blue">
                            <CheckCircle2 className="h-3 w-3" />
                            Linked
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.phase && (
                          <div className="text-xs text-gray-600">
                            {task.phase.name}
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            STATUS_COLORS[
                              task.status as keyof typeof STATUS_COLORS
                            ],
                          )}
                        >
                          {task.status}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            PRIORITY_COLORS[
                              task.priority as keyof typeof PRIORITY_COLORS
                            ],
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        isLinked
                          ? handleUnlinkTask(task.id)
                          : handleLinkTask(task.id)
                      }
                      disabled={isProcessing}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-sm",
                        "flex items-center gap-2",
                        "transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isLinked
                          ? "bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100"
                          : "bg-construction-blue text-white border-2 border-construction-blue hover:bg-blue-700",
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isLinked ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Unlink</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
