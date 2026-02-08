"use client";

/**
 * COISection Component
 * Section for Certificate of Insurance upload/view
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Shield from "lucide-react/icons/shield";
import Upload from "lucide-react/icons/upload";
import Eye from "lucide-react/icons/eye";
import XCircle from "lucide-react/icons/x-circle";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import { toast } from "sonner";
import {
  uploadSubcontractorDocument,
  deleteSubcontractorDocument,
} from "@/app/actions/subcontractors";

interface COISectionProps {
  subcontractorId?: string;
  existingCoiUrl?: string | null;
  disabled: boolean;
}

export function COISection({
  subcontractorId,
  existingCoiUrl,
  disabled,
}: COISectionProps) {
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    existingCoiUrl || null,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("COI file size must be less than 5MB");
        e.target.value = "";
        return;
      }
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("COI file must be PDF, JPEG, or PNG");
        e.target.value = "";
        return;
      }
      setCoiFile(file);
    }
  };

  const handleUpload = async () => {
    if (!coiFile || !subcontractorId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("subcontractor_id", subcontractorId);
    formData.append("document_type", "coi");
    formData.append("file", coiFile);

    try {
      const result = await uploadSubcontractorDocument(formData);
      if (result.success && result.data) {
        setUploadedUrl(result.data.url);
        setCoiFile(null);
        toast.success("Certificate of Insurance uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload COI");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewCoi = () => {
    if (uploadedUrl) {
      window.open(uploadedUrl, "_blank");
    }
  };

  const handleDelete = async () => {
    if (!subcontractorId) return;

    setIsDeleting(true);
    try {
      const result = await deleteSubcontractorDocument(subcontractorId, "coi");
      if (result.success) {
        setUploadedUrl(null);
        toast.success("Certificate of Insurance deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete COI");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        Certificate of Insurance
      </h4>

      <div className="space-y-3">
        {/* Show existing COI or upload new */}
        {uploadedUrl ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Current COI Document
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewCoi}
                className="min-h-[44px] flex-1"
                disabled={disabled}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="min-h-[44px]"
                disabled={disabled || isDeleting}
                title="Delete certificate"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label
              htmlFor="coi_file"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Upload COI Document (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="coi_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
              {coiFile && !isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoiFile(null)}
                  disabled={disabled}
                  className="min-h-[44px]"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {coiFile && (
              <>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {coiFile.name} ({(coiFile.size / 1024).toFixed(1)} KB)
                </p>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={disabled || isUploading || !subcontractorId}
                  className="min-h-[44px] w-full bg-construction-blue hover:bg-construction-blue/90 active:bg-construction-blue/80 dark:bg-construction-blue dark:hover:bg-construction-blue/90 dark:active:bg-construction-blue/80 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Certificate"}
                </Button>
              </>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF, JPEG, or PNG. Max 5MB.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
