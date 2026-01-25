"use client";

/**
 * InsuranceSection Component
 * Section for insurance provider field
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-construction-blue" />
        </div>
        Insurance Information
      </h3>

      <div className="space-y-2">
        <Label
          htmlFor="insurance_provider"
          className="text-gray-900 dark:text-gray-100 font-semibold"
        >
          Provider
        </Label>
        <Input
          id="insurance_provider"
          {...register("insurance_provider", addSubcontractorValidation.insurance_provider)}
          type="text"
          placeholder="ABC Insurance Co."
          disabled={disabled}
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
        />
        {errors.insurance_provider ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.insurance_provider.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
