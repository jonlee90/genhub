"use client";

/**
 * InsuranceSection Component
 * Section for insurance provider field
 */

import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/mobile/MobileInput";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import Shield from "lucide-react/icons/shield";

interface InsuranceSectionProps {
  register: any;
  errors: any;
  disabled: boolean;
}

export function InsuranceSection({
  register,
  errors,
  disabled,
}: InsuranceSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        Insurance Information
      </h4>

      <div className="space-y-1.5">
        <Label
          htmlFor="insurance_provider"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Provider
        </Label>
        <MobileInput
          {...register("insurance_provider", addSubcontractorValidation.insurance_provider)}
          id="insurance_provider"
          placeholder="e.g., ABC Insurance Co."
          disabled={disabled}
          error={errors.insurance_provider?.message}
          inputMode="text"
          enterKeyHint="next"
        />
      </div>
    </div>
  );
}
