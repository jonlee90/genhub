"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import AlertCircle from "lucide-react/icons/alert-circle";
import Loader2 from "lucide-react/icons/loader-2";
import { cn } from "@/lib/utils";

interface FileUploadPanelProps {
  preview: string | null;
  uploading: boolean;
  progress: number;
  error?: string | null;
  imageClassName?: string;
  containerClassName?: string;
  sizes?: string;
}

export function FileUploadPanel({
  preview,
  uploading,
  progress,
  error,
  imageClassName,
  containerClassName,
  sizes = "100vw",
}: FileUploadPanelProps) {
  return (
    <>
      <AnimatePresence mode="wait">
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "relative rounded-lg overflow-hidden border-2 border-gray-200",
              containerClassName,
            )}
          >
            <Image
              src={preview}
              alt="Preview"
              width={1200}
              height={800}
              className={cn("w-full h-auto", imageClassName)}
              sizes={sizes}
              unoptimized
            />

            {/* Progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <div className="w-3/4 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#001B51]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white text-sm mt-2">{progress}%</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}
    </>
  );
}
