"use client";

import { useState, useTransition } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { FileUploadPanel } from "@/components/ui/FileUploadPanel";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { uploadCompanyDefaultModel } from "@/app/actions/default-models";
import { useToast } from "@/hooks/use-toast";
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
  console.log("[ModelUploadModal] Opening for project type:", projectTypeName);

  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    console.log("[ModelUploadModal] File selected");
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

    console.log(
      "[ModelUploadModal] File valid:",
      file.name,
      formatFileSize(file.size),
    );
    setSelectedFile(file);
  };

  // Handle upload
  const handleUpload = () => {
    if (!selectedFile) return;

    console.log("[ModelUploadModal] Starting upload:", selectedFile.name);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("projectTypeConfigId", projectTypeConfigId);

        // Simulate upload progress (replace with real progress tracking)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await uploadCompanyDefaultModel(
          formData,
          projectTypeConfigId,
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.success) {
          toast({
            title: "Upload Successful",
            description: `Custom default model for ${projectTypeName} has been uploaded.`,
            variant: "default",
          });

          // Refresh the page to show updated data
          router.refresh();
          onClose();
        } else {
          setError(result.error || "Upload failed. Please try again.");
          setUploadProgress(0);

          toast({
            title: "Upload Failed",
            description: result.error || "An error occurred during upload.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("[ModelUploadModal] Upload error:", err);
        setError("An unexpected error occurred. Please try again.");
        setUploadProgress(0);

        toast({
          title: "Upload Failed",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={Upload}
      title={`Upload Custom Model - ${projectTypeName}`}
      subtitle="Upload a custom IFC file to replace the system default model"
      maxWidth="lg"
      theme="default"
      closeOnBackdropClick={!isPending}
      closeOnEscape={!isPending}
      rightActions={[
        <Button
          key="cancel"
          onClick={onClose}
          variant="outline"
          disabled={isPending}
          className="border-2 border-gray-300"
        >
          Cancel
        </Button>,
        <Button
          key="upload"
          onClick={handleUpload}
          disabled={!selectedFile || isPending}
          className="bg-[#001B51] hover:bg-[#001B51]/90 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Model
            </>
          )}
        </Button>,
      ]}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-[#001B51] p-4 rounded-lg">
          <h4 className="font-bold text-[#001B51] mb-2">Upload Requirements</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
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
              <span className="font-semibold text-gray-700">Uploading...</span>
              <span className="font-mono text-[#001B51]">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#001B51] transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-[#DC2626] p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#DC2626]">Upload Error</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-[#FFB627] p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FFB627] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#FFB627]">Important</p>
              <p className="text-sm text-gray-600 mt-1">
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
