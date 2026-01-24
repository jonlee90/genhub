"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Layers from "lucide-react/icons/layers";
import Edit from "lucide-react/icons/edit";
import Trash2 from "lucide-react/icons/trash-2";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import AlertCircle from "lucide-react/icons/alert-circle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  createPhase,
  updatePhaseName,
  deletePhase,
} from "@/app/actions/phases";
import { useFormSubmit } from "@/hooks/use-form-submit";
import type { ProjectPhasesRow } from "@/types/db/tables/projects";

type Phase = ProjectPhasesRow;

interface ManagePhasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  phases: Phase[];
  onSuccess?: () => void;
}

type ModalMode = "list" | "create" | "edit" | "delete";

export function ManagePhasesModal({
  isOpen,
  onClose,
  projectId,
  phases,
  onSuccess,
}: ManagePhasesModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ModalMode>("list");
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [phaseName, setPhaseName] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [deleteTaskHandling, setDeleteTaskHandling] = useState<
    "move" | "delete"
  >("move");
  const [targetPhaseId, setTargetPhaseId] = useState<string>("");

  console.log("[ManagePhasesModal] Rendering:", {
    mode,
    selectedPhase: selectedPhase?.id,
  });

  // Form submission hooks with legacy result conversion
  const createPhaseSubmit = useFormSubmit({
    action: async (formData) => {
      const result = await createPhase(projectId, formData);
      if (result.success && result.phase) {
        return { success: true as const, data: result.phase };
      }
      return { success: false as const, error: result.error || 'Failed to create phase' };
    },
    onSuccess: () => {
      setPhaseName("");
      setPhaseDescription("");
      setMode("list");
      onSuccess?.();
      router.refresh();
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    },
    successMessage: "Phase created successfully",
    errorMessage: "Failed to create phase",
  });

  const updatePhaseSubmit = useFormSubmit({
    action: async (formData) => {
      const result = await updatePhaseName(selectedPhase!.id, formData);
      if (result.success && result.phase) {
        return { success: true as const, data: result.phase };
      }
      return { success: false as const, error: result.error || 'Failed to update phase' };
    },
    onSuccess: () => {
      setMode("list");
      setSelectedPhase(null);
      onSuccess?.();
      router.refresh();
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    },
    successMessage: "Phase updated successfully",
    errorMessage: "Failed to update phase",
  });

  const deletePhaseSubmit = useFormSubmit({
    action: async () => {
      // Validate before submitting
      if (deleteTaskHandling === "move" && !targetPhaseId) {
        return {
          success: false as const,
          error: "Please select a target phase for tasks",
        };
      }
      const result = await deletePhase(
        selectedPhase!.id,
        deleteTaskHandling,
        targetPhaseId || undefined
      );
      if (result.success) {
        return { success: true as const, data: undefined as any };
      }
      return { success: false as const, error: result.error || 'Failed to delete phase' };
    },
    onSuccess: () => {
      setMode("list");
      setSelectedPhase(null);
      onSuccess?.();
      router.refresh();
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    },
    successMessage: "Phase deleted successfully",
    errorMessage: "Failed to delete phase",
  });

  // Determine which submit is pending
  const isPending =
    createPhaseSubmit.isPending ||
    updatePhaseSubmit.isPending ||
    deletePhaseSubmit.isPending;

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleCreatePhase = useCallback(async () => {
    console.log("[ManagePhasesModal] Creating phase:", phaseName);
    setError(null);

    const formData = new FormData();
    formData.append("name", phaseName);
    if (phaseDescription) {
      formData.append("description", phaseDescription);
    }

    await createPhaseSubmit.submit(formData);
  }, [phaseName, phaseDescription, createPhaseSubmit]);

  const handleUpdatePhase = useCallback(async () => {
    if (!selectedPhase) return;

    console.log("[ManagePhasesModal] Updating phase:", selectedPhase.id);
    setError(null);

    const formData = new FormData();
    formData.append("name", phaseName);
    if (phaseDescription) {
      formData.append("description", phaseDescription);
    }

    await updatePhaseSubmit.submit(formData);
  }, [selectedPhase, phaseName, phaseDescription, updatePhaseSubmit]);

  const handleDeletePhase = useCallback(async () => {
    if (!selectedPhase) return;

    console.log("[ManagePhasesModal] Deleting phase:", selectedPhase.id, {
      taskHandling: deleteTaskHandling,
      targetPhaseId,
    });
    setError(null);

    // Validation is now handled inside the submit action
    await deletePhaseSubmit.submit(new FormData());
  }, [selectedPhase, deleteTaskHandling, targetPhaseId, deletePhaseSubmit]);

  const handleEditClick = useCallback((phase: Phase) => {
    console.log("[ManagePhasesModal] Edit phase:", phase.id);
    setSelectedPhase(phase);
    setPhaseName(phase.name);
    setPhaseDescription(phase.notes || "");
    setMode("edit");
  }, []);

  const handleDeleteClick = useCallback((phase: Phase) => {
    console.log("[ManagePhasesModal] Delete phase:", phase.id);
    setSelectedPhase(phase);
    setMode("delete");
  }, []);

  const handleBackToList = useCallback(() => {
    setMode("list");
    setSelectedPhase(null);
    setPhaseName("");
    setPhaseDescription("");
    setError(null);
  }, []);

  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Phase";
      case "edit":
        return "Edit Phase";
      case "delete":
        return "Delete Phase";
      default:
        return "Manage Phases";
    }
  };

  const getModalSubtitle = () => {
    switch (mode) {
      case "create":
        return "Add a new phase to your project";
      case "edit":
        return "Update phase details";
      case "delete":
        return "Choose how to handle tasks in this phase";
      default:
        return "Add, edit, or remove project phases";
    }
  };

  const getContinueLabel = (): string => {
    switch (mode) {
      case "list":
        return "Add Phase";
      case "create":
        return isPending ? "Creating..." : "Create Phase";
      case "edit":
        return isPending ? "Saving..." : "Save Changes";
      case "delete":
        return isPending ? "Deleting..." : "Delete Phase";
      default:
        return "Continue";
    }
  };

  const getContinueDisabled = (): boolean => {
    switch (mode) {
      case "create":
      case "edit":
        return isPending || !phaseName.trim();
      case "delete":
        return isPending;
      default:
        return false;
    }
  };

  const handleContinueAction = useCallback(() => {
    switch (mode) {
      case "list":
        setMode("create");
        break;
      case "create":
        handleCreatePhase();
        break;
      case "edit":
        handleUpdatePhase();
        break;
      case "delete":
        handleDeletePhase();
        break;
    }
  }, [mode, handleCreatePhase, handleUpdatePhase, handleDeletePhase]);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={Layers}
      title={getModalTitle()}
      theme="default"
      maxWidth="2xl"
      showNavigation={true}
      onBack={mode !== "list" ? handleBackToList : undefined}
      backLabel="Back"
      onContinue={handleContinueAction}
      continueLabel={getContinueLabel()}
      continueDisabled={getContinueDisabled()}
    >
      <AnimatePresence mode="wait">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}

        {/* List Mode */}
        {mode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {phases.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No phases yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click "Add Phase" to create your first phase
                </p>
              </div>
            ) : (
              phases.map((phase, index) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-construction-blue/5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-construction-blue/30 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-construction-blue text-white font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{phase.name}</p>
                    {phase.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {phase.notes}
                      </p>
                    )}
                  </div>
                  {/* Debug: Buttons always visible on mobile, hover-visible on desktop */}
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(phase)}
                      className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                      aria-label="Edit phase"
                    >
                      <Edit className="h-4 w-4 text-construction-blue" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(phase)}
                      className="h-9 w-9 md:h-8 md:w-8 p-0 touch-manipulation"
                      aria-label="Delete phase"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Create/Edit Mode */}
        {(mode === "create" || mode === "edit") && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phase-name" className="font-bold">
                Phase Name *
              </Label>
              <Input
                id="phase-name"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                placeholder="e.g., Foundation Work"
                disabled={isPending}
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase-description" className="font-bold">
                Description
              </Label>
              <Textarea
                id="phase-description"
                value={phaseDescription}
                onChange={(e) => setPhaseDescription(e.target.value)}
                placeholder="Optional phase description..."
                rows={3}
                disabled={isPending}
                className="border-2 resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* Delete Mode */}
        {mode === "delete" && selectedPhase && (
          <motion.div
            key="delete"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-900">
                  Delete "{selectedPhase.name}"?
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  This action cannot be undone. Choose how to handle tasks in
                  this phase.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Task Handling</Label>
              <Select
                value={deleteTaskHandling}
                onValueChange={(value: "move" | "delete") =>
                  setDeleteTaskHandling(value)
                }
                disabled={isPending}
              >
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">
                    Move tasks to another phase
                  </SelectItem>
                  <SelectItem value="delete">Delete all tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deleteTaskHandling === "move" && (
              <div className="space-y-2">
                <Label className="font-bold">Target Phase *</Label>
                <Select
                  value={targetPhaseId}
                  onValueChange={setTargetPhaseId}
                  disabled={isPending}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select a phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases
                      .filter((p) => p.id !== selectedPhase.id)
                      .map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ResponsiveModal>
  );
}
