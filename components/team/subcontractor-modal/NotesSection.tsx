"use client";

/**
 * NotesSection Component
 * Section for notes textarea field
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";

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
    <div className="space-y-2">
      <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100 font-semibold">
        Notes
      </Label>
      <Textarea
        id="notes"
        {...register("notes", addSubcontractorValidation.notes)}
        placeholder="Any additional notes or comments..."
        rows={3}
        disabled={disabled}
        className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
      />
      {errors.notes ? (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {errors.notes.message}
        </p>
      ) : null}
    </div>
  );
}
