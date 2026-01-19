import type { ReactNode } from "react";
import { Upload, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadPanelProps {
  label: string;
  description?: ReactNode;
  accept?: string;
  disabled?: boolean;
  file?: File | null;
  onFileSelect: (file: File | null) => void;
  onOpenFileDialog?: () => void;
  onClear?: () => void;
  clearLabel?: string;
  formatFileSize?: (bytes: number) => string;
  className?: string;
}

export function FileUploadPanel({
  label,
  description,
  accept,
  disabled = false,
  file,
  onFileSelect,
  onOpenFileDialog,
  onClear,
  clearLabel = "Choose Different File",
  formatFileSize,
  className,
}: FileUploadPanelProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event.target.files?.[0] ?? null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {description ? (
        <div className="text-sm text-gray-500">{description}</div>
      ) : null}
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id={`file-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
        />
        <div
          onClick={() => {
            if (!disabled) {
              onOpenFileDialog?.();
              document
                .getElementById(
                  `file-upload-${label.replace(/\s+/g, "-").toLowerCase()}`,
                )
                ?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
            file
              ? "border-[#059669] bg-[#059669]/5"
              : "border-gray-300 hover:border-[#001B51] hover:bg-gray-50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          {file ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#059669]/10 rounded-lg inline-block">
                <FileIcon className="w-8 h-8 text-[#059669]" />
              </div>
              <div>
                <p className="font-semibold text-[#001B51]">{file.name}</p>
                {formatFileSize && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
              {onClear && !disabled && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClear();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-md border-2 border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {clearLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 rounded-lg inline-block">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">
                  Click to select file
                </p>
                <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
