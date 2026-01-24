"use client";

import { useState, useTransition, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { FileUploadPanel } from "@/components/ui/FileUploadPanel";
// Direct Lucide imports for performance
import Upload from "lucide-react/icons/upload";
import AlertCircle from "lucide-react/icons/alert-circle";
import Loader2 from "lucide-react/icons/loader-2";
import { formatFileSize } from "@/lib/format-utils";
import { uploadCompanyDefaultModel } from "@/app/actions/default-models";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ModelUploadModalProps {
  projectTypeConfigId: string;
  projectTypeName: string;
  onClose: () => void;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [".ifc"];

export function ModelUploadModal({
  projectTypeConfigId,
  projectTypeName,
  onClose,
}: ModelUploadModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setError(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".ifc")) {
      setError("Invalid file type. Please select an IFC file (.ifc)");
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  // Handle upload
  const handleUpload = useCallback(() => {
    if (!selectedFile) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("projectTypeConfigId", projectTypeConfigId);

        // Simulate upload progress (replace with real progress tracking)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await uploadCompanyDefaultModel({
          formData,
          projectTypeConfigId,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.success) {
          toast.success(`Custom default model for ${projectTypeName} has been uploaded.`);

          // Refresh the page to show updated data
          router.refresh();
          onClose();
        } else {
          setError(result.error || "Upload failed. Please try again.");
          setUploadProgress(0);

          toast.error(result.error || "An error occurred during upload.");
        }
      } catch (err) {
        console.error("[ModelUploadModal] Upload error:", err);
        setError("An unexpected error occurred. Please try again.");
        setUploadProgress(0);

        toast.error("An unexpected error occurred.");
      }
    });
  }, [selectedFile, projectTypeConfigId, projectTypeName, toast, router, onClose]);

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={Upload}
      title={`Upload Custom Model - ${projectTypeName}`}
      maxWidth="lg"
      theme="default"
      closeOnBackdropClick={!isPending}
      closeOnEscape={!isPending}
      showNavigation={true}
      onBack={onClose}
      backLabel="Cancel"
      onContinue={handleUpload}
      continueLabel={isPending ? `Uploading... ${uploadProgress}%` : "Upload Model"}
      continueDisabled={!selectedFile || isPending}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-gray-800 border-l-4 border-construction-blue p-4 rounded-lg">
          <h4 className="font-bold text-construction-blue mb-2">Upload Requirements</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>File format: IFC (.ifc)</li>
            <li>Maximum file size: {MAX_FILE_SIZE_MB}MB</li>
            <li>Model will be converted to XKT format automatically</li>
            <li>Upload may take several minutes for large files</li>
          </ul>
        </div>

        <FileUploadPanel
          label="Select IFC File"
          accept={ACCEPTED_FILE_TYPES.join(",")}
          disabled={isPending}
          file={selectedFile}
          onFileSelect={handleFileSelect}
          onClear={() => {
            setSelectedFile(null);
            setError(null);
          }}
          formatFileSize={formatFileSize}
        />

        {/* Upload Progress */}
        {isPending && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Uploading...</span>
              <span className="font-mono text-construction-blue">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-construction-blue transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-gray-800 border-l-4 border-[#DC2626] p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#DC2626]">Upload Error</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-gray-800 border-l-4 border-[#FFB627] p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FFB627] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#FFB627]">Important</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Uploading a custom model will replace the system default for all{" "}
                <strong>new</strong> {projectTypeName} projects. Existing
                projects will not be affected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
