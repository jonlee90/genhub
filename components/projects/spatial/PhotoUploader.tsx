/**
 * PhotoUploader Component
 * - File picker + camera capture on mobile
 * - Client-side validation (max 10MB, JPEG/PNG/WebP)
 * - Upload progress bar
 * - Optimistic UI
 */

"use client";

import { useState, useRef } from "react";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Camera from "lucide-react/icons/camera";
import Upload from "lucide-react/icons/upload";
import { cn } from "@/lib/utils";
import { FileUploadPanel } from "@/components/projects/files/FileUploadPanel";
import { validatePhoto } from "@/lib/image-processing";
import { toast } from "sonner";

interface PhotoUploaderProps {
  markerId: string;
  onUploadComplete: (photoUrl: string) => void;
  onCancel?: () => void;
}

export function PhotoUploader({
  markerId,
  onUploadComplete,
  onCancel,
}: PhotoUploaderProps) {
  console.log("[PhotoUploader] Rendering for marker:", markerId);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    console.log("[PhotoUploader] File selected:", file.name);
    setError(null);

    // Validate file
    const validation = validatePhoto(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      toast.error(validation.error || "Invalid file");
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    console.log("[PhotoUploader] Uploading file:", file.name);
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("markerId", markerId.toString());

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/spatial/upload-photo", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      console.log("[PhotoUploader] Upload success:", result.content.id);
      toast.success("Photo uploaded successfully");

      // Call callback with photo URL
      onUploadComplete(result.content.url);

      // Reset state
      setTimeout(() => {
        setPreview(null);
        setProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      console.error("[PhotoUploader] Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <FileUploadPanel
        preview={preview}
        uploading={uploading}
        progress={progress}
        error={error}
      />

      {/* Upload buttons */}
      {!uploading && !preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8",
            "hover:border-[#001B51] hover:bg-gray-50 transition-colors",
            "cursor-pointer",
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              {/* File picker button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-[#001B51] text-white font-bold",
                  "hover:bg-[#002B71] transition-colors",
                )}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">CHOOSE FILE</span>
              </button>

              {/* Camera button (mobile only) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-[#3C3C3C] text-white font-bold",
                  "hover:bg-[#4C4C4C] transition-colors",
                  "md:hidden", // Only show on mobile
                )}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">CAMERA</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              or drag and drop your photo here
            </p>
            <p className="text-xs text-gray-400 text-center">
              JPEG, PNG, WebP • Max 10MB
            </p>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && !uploading && (
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "w-full px-4 py-2 rounded-lg",
            "border border-gray-300 text-gray-700 font-medium",
            "hover:bg-gray-50 transition-colors",
          )}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
