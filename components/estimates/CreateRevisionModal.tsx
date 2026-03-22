"use client";

import { useState, useRef } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Upload from "lucide-react/icons/upload";
import Loader2 from "lucide-react/icons/loader-2";
import FileText from "lucide-react/icons/file-text";
import X from "lucide-react/icons/x";
import { createRevision } from "@/app/actions/revisions";
import { uploadPlanFile } from "@/app/actions/estimates";
import { toast } from "sonner";

interface CreateRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
  projectId: string;
  onRevisionCreated?: (revisionId: string) => void;
}

export function CreateRevisionModal({
  isOpen,
  onClose,
  estimateId,
  projectId,
  onRevisionCreated,
}: CreateRevisionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "image/png", "image/jpeg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload a PDF or image.");
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 50MB.");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload new plan file
      const uploadResult = await uploadPlanFile({
        file: selectedFile,
        projectId,
      });

      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.error || "Failed to upload plan file");
        setIsUploading(false);
        return;
      }

      const planUploadId = uploadResult.data.id;

      // Step 2: Create revision with AI diff
      const revisionResult = await createRevision({
        estimateId,
        newPlanUploadId: planUploadId,
        notes: notes.trim() || undefined,
      });

      if (!revisionResult.success || !revisionResult.data) {
        toast.error(revisionResult.error || "Failed to create revision");
        setIsUploading(false);
        return;
      }

      toast.success("Revision created successfully");
      onRevisionCreated?.((revisionResult.data as any).id);
      onClose();

      // Reset form
      setSelectedFile(null);
      setNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create revision",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Create Revision">
      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <Label htmlFor="file-upload" className="text-sm font-medium mb-2">
            Upload New Plan
          </Label>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload plan file"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <FileText className="w-5 h-5 text-construction-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="min-h-[44px] min-w-[44px] p-2 active:scale-95"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[44px] active:scale-95 border-dashed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="revision-notes" className="text-sm font-medium mb-2">
            Notes (Optional)
          </Label>
          <Textarea
            id="revision-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what changed in this revision..."
            rows={3}
            className="min-h-[88px]"
            aria-label="Revision notes"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="flex-1 min-h-[44px] active:scale-95 bg-construction-blue hover:bg-construction-blue/90 dark:bg-construction-blue dark:hover:bg-construction-blue/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Revision"
            )}
          </Button>
        </div>

        {/* Info Message */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            The AI will compare the new plan against the current estimate and
            highlight added, removed, and modified items.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}
