"use client";

/**
 * LicenseSection Component
 * Section for license number field
 */

import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/mobile/MobileInput";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import FileText from "lucide-react/icons/file-text";

interface LicenseSectionProps {
  register: any;
  errors: any;
  disabled: boolean;
}

export function LicenseSection({
  register,
  errors,
  disabled,
}: LicenseSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        License Information
      </h4>

      <div className="space-y-1.5">
        <Label
          htmlFor="license_number"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          License Number
        </Label>
        <MobileInput
          {...register("license_number", addSubcontractorValidation.license_number)}
          id="license_number"
          placeholder="e.g., LIC-123456"
          disabled={disabled}
          error={errors.license_number?.message}
          inputMode="text"
          enterKeyHint="next"
        />
      </div>
    </div>
  );
}
