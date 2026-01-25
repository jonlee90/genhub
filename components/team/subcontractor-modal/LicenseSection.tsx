"use client";

/**
 * LicenseSection Component
 * Section for license number field
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-construction-blue" />
        </div>
        License Information
      </h3>

      <div className="space-y-2">
        <Label
          htmlFor="license_number"
          className="text-gray-900 dark:text-gray-100 font-semibold"
        >
          License Number
        </Label>
        <Input
          id="license_number"
          {...register("license_number", addSubcontractorValidation.license_number)}
          type="text"
          placeholder="LIC-123456"
          disabled={disabled}
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
        />
        {errors.license_number ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.license_number.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
