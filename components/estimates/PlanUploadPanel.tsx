"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Upload from "lucide-react/icons/upload";
import { cn } from "@/lib/utils";
import { PlanUploadProgress } from "@/components/estimates/PlanUploadProgress";
import { CameraUploadButton } from "@/components/estimates/CameraUploadButton";
import { UploadThumbnailGrid } from "@/components/estimates/UploadThumbnailGrid";
import Zap from "lucide-react/icons/zap";
import { getPlanPages } from "@/app/actions/estimates";
import type { PlanUpload, PlanPage } from "@/types/db/tables/estimates";
import type { UserRole } from "@/types/db/enums";

type PlanUploadPanelProps = {
  projectId: string;
  planUploads: PlanUpload[];
  userRole: UserRole | null;
  onNavigateToReview?: (planUploadId: string) => void;
};

// Type returned from getPlanPages action includes signedUrl
type PageWithSignedUrl = PlanPage & {
  signedUrl: string | null;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
];

export function PlanUploadPanel({
  projectId,
  planUploads,
  userRole,
  onNavigateToReview,
}: PlanUploadPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsingAll, setIsParsingAll] = useState(false);
  const [allPlanPages, setAllPlanPages] = useState<PageWithSignedUrl[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const canUpload = userRole === "admin" || userRole === "project_manager";

  // Fetch all plan pages for thumbnail grid
  useEffect(() => {
    if (planUploads.length === 0) {
      setAllPlanPages([]);
      return;
    }

    setIsLoadingPages(true);

    // Fetch pages for all uploads in parallel
    Promise.all(planUploads.map((upload) => getPlanPages(upload.id)))
      .then((results) => {
        const allPages: PageWithSignedUrl[] = [];

        results.forEach((result) => {
          if (result.success && result.data) {
            allPages.push(...result.data);
          }
        });

        setAllPlanPages(allPages);
      })
      .catch((error) => {
        console.error("[PlanUploadPanel] Failed to load pages:", error);
      })
      .finally(() => {
        setIsLoadingPages(false);
      });
  }, [planUploads]);

  const handleParseAll = useCallback(async () => {
    if (planUploads.length === 0) return;

    try {
      setIsParsingAll(true);

      // Trigger actual AI parsing for all uploads
      const promises = planUploads.map((upload) =>
        fetch("/api/estimates/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planUploadId: upload.id }),
        }),
      );

      const responses = await Promise.all(promises);

      // Check for failures
      const failures = responses.filter((r) => !r.ok);
      if (failures.length > 0) {
        toast.error(`Failed to start parsing for ${failures.length} upload(s)`);
      } else {
        toast.success("Batch parsing started for all pages");
      }

      router.refresh();
    } catch (error) {
      console.error("[PlanUploadPanel] Parse all error:", error);
      toast.error("Failed to start batch parsing");
    } finally {
      setIsParsingAll(false);
    }
  }, [planUploads, router]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File exceeds 50MB limit";
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return "Only PDF, JPG, and PNG files are accepted";
    }

    return null;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });

        const uploadPromise = new Promise<void>((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"));
          });

          xhr.open("POST", "/api/estimates/upload");
          xhr.send(formData);
        });

        await uploadPromise;

        toast.success("Plan upload started processing");

        router.refresh();
      } catch (error) {
        console.error("[PlanUploadPanel] Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file",
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [projectId, validateFile, toast, router],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  // File input change handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("[PlanUploadPanel] File input ref is not available");
      toast.error("Upload button error - please refresh the page");
    }
  }, [toast]);

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {canUpload && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-construction-blue bg-construction-blue/5 dark:bg-construction-blue/10"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-construction-blue dark:text-construction-blue" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Upload Construction Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop or click to select a file
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PDF, JPG, PNG, or HEIC • Max 50MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
                aria-label="File input for plan upload"
              />

              <Button
                onClick={handleButtonClick}
                disabled={isUploading}
                className="min-h-[44px] min-w-[44px] px-6 active:scale-95"
                aria-label={isUploading ? "Uploading plan" : "Select plan file"}
              >
                {isUploading ? "Uploading..." : "Select File"}
              </Button>

              {isUploading && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-construction-blue transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile camera button */}
          <CameraUploadButton
            onCapture={async (files) => {
              for (const file of files) {
                await handleFileUpload(file);
              }
            }}
            disabled={isUploading}
          />
        </>
      )}

      {/* Plan uploads list */}
      {planUploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Plan Uploads
            </h3>
            {canUpload && planUploads.length > 1 ? (
              <Button
                onClick={handleParseAll}
                disabled={isParsingAll}
                variant="outline"
                size="sm"
                className="min-h-[44px] active:scale-95"
                aria-label="Parse all pages"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isParsingAll ? "Parsing..." : "Parse All Pages"}
              </Button>
            ) : null}
          </div>

          {planUploads.map((upload) => (
            <PlanUploadProgress
              key={upload.id}
              planUpload={upload}
              projectId={projectId}
              onNavigateToReview={onNavigateToReview}
            />
          ))}
        </div>
      )}

      {/* Thumbnail grid of all uploaded pages */}
      {!isLoadingPages && allPlanPages.length > 0 ? (
        <UploadThumbnailGrid
          files={allPlanPages.map((page) => ({
            id: page.id,
            name: `Page ${page.page_number}`,
            url: page.signedUrl || "",
            type: "image/png",
            pageType: null, // page_type is in plan_parse_results, shown after parsing
          }))}
        />
      ) : null}
    </div>
  );
}
