'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TaskReceiptUploadProps {
  receiptUrl?: string | null;
  onReceiptChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
  showLabel?: boolean;
  compact?: boolean;
}

/**
 * TaskReceiptUpload Component
 *
 * Allows users to upload or capture receipt photos for tasks.
 * Features:
 * - File upload from device
 * - Camera capture (mobile/PWA)
 * - Image preview with remove option
 * - Construction-themed design matching expense upload
 *
 * Debug: Used in CreateTaskForm and TaskModal for receipt documentation
 */
export function TaskReceiptUpload({
  receiptUrl,
  onReceiptChange,
  disabled = false,
  showLabel = true,
  compact = false,
}: TaskReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(receiptUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onReceiptChange(file, previewUrl);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setPreview(null);
    onReceiptChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {showLabel && (
        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4 text-construction-blue" />
          Receipt Photo {compact ? '' : '(Optional)'}
        </Label>
      )}

      <AnimatePresence mode="wait">
        {preview ? (
          // Preview Mode
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50',
              compact ? 'h-32' : 'h-48',
            )}
          >
            {/* Image Preview */}
            <div className="relative w-full h-full">
              <Image
                src={preview}
                alt="Receipt preview"
                fill
                className="object-contain p-2"
              />
            </div>

            {/* Remove Button */}
            {!disabled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 right-2"
              >
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveReceipt}
                  className="h-8 w-8 p-0 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-construction-blue/10 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-construction-blue" />
                  <span className="text-sm font-semibold text-construction-blue">Processing...</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Upload Mode
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'grid gap-3',
              compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2',
            )}
          >
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg transition-all group',
                'hover:border-construction-blue hover:bg-construction-blue/5',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent',
                compact ? 'p-4' : 'p-6 sm:p-8',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
                aria-label="Upload receipt photo"
              />
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  'p-2 sm:p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors',
                  compact && 'p-2',
                )}>
                  <Upload className={cn(
                    'text-gray-400 group-hover:text-construction-blue transition-colors',
                    compact ? 'h-5 w-5' : 'h-6 w-6 sm:h-8 sm:w-8',
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    'font-bold text-gray-900',
                    compact ? 'text-xs' : 'text-sm',
                  )}>
                    Upload File
                  </p>
                  <p className={cn(
                    'text-gray-600',
                    compact ? 'text-[10px]' : 'text-xs sm:text-sm',
                  )}>
                    From gallery
                  </p>
                </div>
              </div>
            </button>

            {/* Camera Capture Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg transition-all group',
                'hover:border-construction-blue hover:bg-construction-blue/5',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent',
                compact ? 'p-4' : 'p-6 sm:p-8',
              )}
            >
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
                aria-label="Capture receipt photo with camera"
              />
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  'p-2 sm:p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors',
                  compact && 'p-2',
                )}>
                  <Camera className={cn(
                    'text-gray-400 group-hover:text-construction-blue transition-colors',
                    compact ? 'h-5 w-5' : 'h-6 w-6 sm:h-8 sm:w-8',
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    'font-bold text-gray-900',
                    compact ? 'text-xs' : 'text-sm',
                  )}>
                    Take Photo
                  </p>
                  <p className={cn(
                    'text-gray-600',
                    compact ? 'text-[10px]' : 'text-xs sm:text-sm',
                  )}>
                    Use camera
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {!preview && !compact && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-gray-500 italic"
        >
          Attach photos of receipts, purchase orders, or invoices for documentation.
        </motion.p>
      )}
    </div>
  );
}
