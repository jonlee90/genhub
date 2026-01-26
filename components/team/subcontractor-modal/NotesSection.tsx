"use client";

/**
 * NotesSection Component
 * Section for notes textarea field
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import FileText from "lucide-react/icons/file-text";
import AlertCircle from "lucide-react/icons/alert-circle";

interface NotesSectionProps {
  register: any;
  errors: any;
  disabled: boolean;
}

export function NotesSection({
  register,
  errors,
  disabled,
}: NotesSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        Additional Notes
      </h4>

      <div className="space-y-1.5">
        <Label
          htmlFor="notes"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Notes
        </Label>
        <Textarea
          id="notes"
          {...register("notes", addSubcontractorValidation.notes)}
          placeholder="Any additional notes or comments..."
          rows={3}
          disabled={disabled}
          className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 resize-none text-sm rounded-xl min-h-[88px]"
        />
        {errors.notes && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            {errors.notes.message}
          </p>
        )}
      </div>
    </div>
  );
}
