"use client";

import { useRef, useState, useCallback } from "react";
import Camera from "lucide-react/icons/camera";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CameraUploadButtonProps = {
  onCapture: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
};

export function CameraUploadButton({
  onCapture,
  disabled = false,
  className,
}: CameraUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const capturedFiles = useRef<File[]>([]);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Maintain aspect ratio while targeting ~1080p max
        const MAX_SIZE = 1920;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          0.8,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      reader.onerror = () => reject(new Error("Failed to read file"));

      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      try {
        // Compress images if needed
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            // Only compress images, not PDFs
            if (file.type.startsWith("image/")) {
              const compressed = await compressImage(file);
              // Only use compressed version if significantly smaller
              return compressed.size < file.size * 0.9 ? compressed : file;
            }
            return file;
          }),
        );

        // Add to captured files array
        capturedFiles.current = [...capturedFiles.current, ...processedFiles];
        setCapturedCount(capturedFiles.current.length);

        toast.success(
          `${processedFiles.length} ${processedFiles.length === 1 ? "photo" : "photos"} captured`,
        );

        // Reset input to allow re-capture
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } catch (error) {
        console.error("[CameraUploadButton] Compression error:", error);
        toast.error("Failed to process image");
      }
    },
    [compressImage],
  );

  const handleDone = useCallback(() => {
    if (capturedFiles.current.length === 0) {
      toast.error("No photos captured");
      return;
    }

    onCapture(capturedFiles.current);
    capturedFiles.current = [];
    setCapturedCount(0);
  }, [onCapture]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <>
      {/* Mobile-only FAB */}
      <div className="sm:hidden fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2">
        {capturedCount > 0 ? (
          <button
            onClick={handleDone}
            className={cn(
              "px-4 py-2 rounded-full shadow-lg",
              "bg-green-600 text-white font-semibold text-sm",
              "hover:bg-green-700 active:bg-green-800 active:scale-95",
              "dark:bg-green-600 dark:hover:bg-green-700 dark:active:bg-green-800",
              "min-h-[44px] transition-all",
            )}
            aria-label={`Upload ${capturedCount} captured photos`}
          >
            Upload {capturedCount} {capturedCount === 1 ? "Photo" : "Photos"}
          </button>
        ) : null}

        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "relative rounded-full shadow-lg",
            "bg-construction-blue text-white",
            "hover:bg-construction-blue/90 active:bg-construction-blue active:scale-95",
            "dark:bg-construction-blue dark:hover:bg-construction-blue/90 dark:active:bg-construction-blue",
            "min-h-[56px] min-w-[56px]",
            "flex items-center justify-center",
            "transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          )}
          aria-label="Capture photo from camera"
        >
          <Camera className="w-6 h-6" />

          {capturedCount > 0 ? (
            <Badge
              className={cn(
                "absolute -top-1 -right-1",
                "bg-red-500 text-white border-2 border-white dark:border-gray-900",
                "min-w-[24px] h-6 flex items-center justify-center px-1.5",
                "font-bold text-xs",
              )}
            >
              {capturedCount}
            </Badge>
          ) : null}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/heic,image/heif,image/jpeg,image/png,application/pdf"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="Camera file input"
      />
    </>
  );
}
