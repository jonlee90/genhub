/**
 * MarkerCreationModal - P2.2
 * Modal for creating spatial markers (issue/note/safety/milestone)
 * Features dynamic theming based on marker type and file uploads
 */

"use client";

import { useState, useTransition } from "react";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import AlertCircle from "lucide-react/icons/alert-circle";
import FileText from "lucide-react/icons/file-text";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Flag from "lucide-react/icons/flag";
import Loader2 from "lucide-react/icons/loader-2";
import Upload from "lucide-react/icons/upload";
import Camera from "lucide-react/icons/camera";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { createMarker, uploadMarkerAttachment } from "@/app/actions/spatial";
import { toast } from "sonner";
import { SpatialMarker } from "@/types/db/spatial";

// Use valid database enum types: "issue" | "note" | "photo" | "inspection" | "rfi" | "safety" | "material" | "progress"
type MarkerType = "issue" | "note" | "safety" | "progress";
type PriorityLevel = "low" | "medium" | "high";

interface MarkerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  markerType: MarkerType;
  position: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  elementId?: string;
  projectId: string;
  phaseId?: string;
  onSubmit: (marker: SpatialMarker) => void;
  teamMembers?: Array<{ id: string; name: string }>;
}

const MARKER_TYPE_CONFIG = {
  issue: {
    icon: AlertCircle,
    label: "Issue",
    color: "#DC2626",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    gradientFrom: "#DC2626",
    gradientTo: "#B91C1C",
  },
  note: {
    icon: FileText,
    label: "Note",
    color: "#FBBF24",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    gradientFrom: "#FBBF24",
    gradientTo: "#F59E0B",
  },
  safety: {
    icon: AlertTriangle,
    label: "Safety",
    color: "#F97316",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    gradientFrom: "#F97316",
    gradientTo: "#EA580C",
  },
  progress: {
    icon: Flag,
    label: "Progress",
    color: "#10B981",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    gradientFrom: "#10B981",
    gradientTo: "#059669",
  },
};

export function MarkerCreationModal({
  isOpen,
  onClose,
  markerType,
  position,
  normal,
  elementId,
  projectId,
  phaseId,
  onSubmit,
  teamMembers = [],
}: MarkerCreationModalProps) {
  console.log("[MarkerCreationModal] Rendering", {
    isOpen,
    markerType,
    position,
    projectId,
  });

  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const config = MARKER_TYPE_CONFIG[markerType];
  const Icon = config.icon;

  // Show priority field only for issue/safety markers
  const showPriorityField = markerType === "issue" || markerType === "safety";

  const handleSubmit = async () => {
    console.log("[MarkerCreationModal] Submitting marker", {
      title,
      markerType,
    });

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      try {
        // Step 1: Create marker
        const markerData = {
          project_id: projectId,
          phase_id: phaseId || null,
          type: markerType,
          title: title.trim(),
          description: description.trim() || null,
          priority: showPriorityField ? priority : "medium",
          position_x: position.x,
          position_y: position.y,
          position_z: position.z,
          normal_x: normal?.x || null,
          normal_y: normal?.y || null,
          normal_z: normal?.z || null,
          element_id: elementId || null,
          status: "open" as const,
          assigned_to: assigneeId || null,
        };

        const result = await createMarker(markerData);

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to create marker");
        }

        const createdMarker = result.data;
        console.log("[MarkerCreationModal] Marker created:", createdMarker.id);

        // Step 2: Upload photos
        if (uploadedPhotos.length > 0) {
          console.log(
            "[MarkerCreationModal] Uploading photos:",
            uploadedPhotos.length,
          );
          for (const photo of uploadedPhotos) {
            await uploadMarkerAttachment(createdMarker.id, photo, "photo");
          }
        }

        // Step 3: Upload files
        if (uploadedFiles.length > 0) {
          console.log(
            "[MarkerCreationModal] Uploading files:",
            uploadedFiles.length,
          );
          for (const file of uploadedFiles) {
            await uploadMarkerAttachment(createdMarker.id, file, "file");
          }
        }

        toast.success(`${config.label} marker created successfully`);
        onSubmit(createdMarker);
        handleClose();
      } catch (error) {
        console.error("[MarkerCreationModal] Error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to create marker",
        );
      }
    });
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssigneeId("");
    setUploadedPhotos([]);
    setUploadedFiles([]);
    onClose();
  };

  const handlePhotoSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newPhotos = Array.from(files);
      setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add ${config.label}`}
      icon={Icon}
      maxWidth="lg"
      rightActions={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={cn(
              "px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg",
              "hover:bg-gray-50 transition-colors font-medium text-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !title.trim()}
            className={cn(
              "px-4 py-2 bg-[#001B51] text-white rounded-lg",
              "hover:bg-[#001B51]/90 transition-colors font-medium text-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2",
            )}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 3D Position Display */}
        <div
          className={cn(
            "p-4 rounded-lg border-2",
            config.bgColor,
            config.borderColor,
          )}
        >
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 opacity-70">
            3D Location
          </div>
          <div className="font-mono text-sm">
            X: {position.x.toFixed(2)} / Y: {position.y.toFixed(2)} / Z:{" "}
            {position.z.toFixed(2)}
          </div>
          {elementId && (
            <div className="text-xs font-mono mt-1 opacity-70">
              Element: {elementId.substring(0, 24)}...
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Enter ${config.label.toLowerCase()} title...`}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-[#001B51] focus:outline-none focus:ring-2 focus:ring-[#001B51]/20",
              "placeholder:text-gray-400 text-sm font-medium",
              "transition-all duration-200",
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
            rows={4}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-gray-200",
              "focus:border-[#001B51] focus:outline-none focus:ring-2 focus:ring-[#001B51]/20",
              "placeholder:text-gray-400 text-sm",
              "resize-none transition-all duration-200",
            )}
          />
        </div>

        {/* Priority (for issue/safety only) */}
        {showPriorityField && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as PriorityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setPriority(level)}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg font-bold text-sm uppercase",
                    "border-2 transition-all duration-200",
                    priority === level
                      ? "border-[#001B51] bg-[#001B51] text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assign To */}
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
                "focus:border-[#001B51] focus:outline-none focus:ring-2 focus:ring-[#001B51]/20",
                "text-sm font-medium",
                "transition-all duration-200",
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

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Photos
          </label>
          <div className="space-y-2">
            {uploadedPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <Camera className="h-4 w-4 text-[#001B51]" />
                <span className="text-sm font-medium flex-1 truncate">
                  {photo.name}
                </span>
                <button
                  onClick={() =>
                    setUploadedPhotos((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoSelect(e.target.files)}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
                "border-2 border-dashed border-gray-300",
                "hover:border-[#001B51] hover:bg-gray-50",
                "cursor-pointer transition-all duration-200",
              )}
            >
              <Camera className="h-4 w-4 text-[#001B51]" />
              <span className="text-sm font-medium text-gray-700">
                Add Photos
              </span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Files
          </label>
          <div className="space-y-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <Upload className="h-4 w-4 text-[#001B51]" />
                <span className="text-sm font-medium flex-1 truncate">
                  {file.name}
                </span>
                <button
                  onClick={() =>
                    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            <input
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
                "border-2 border-dashed border-gray-300",
                "hover:border-[#001B51] hover:bg-gray-50",
                "cursor-pointer transition-all duration-200",
              )}
            >
              <Upload className="h-4 w-4 text-[#001B51]" />
              <span className="text-sm font-medium text-gray-700">
                Add Files
              </span>
            </label>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
