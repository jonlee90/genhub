"use client";

/**
 * BasicInfoSection Component
 * Section for company name, trade specialization, and contact name
 */

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/mobile/MobileInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import type { TradeType } from "@/types/db/enums";
import Building2 from "lucide-react/icons/building-2";
import Briefcase from "lucide-react/icons/briefcase";
import User from "lucide-react/icons/user";
import AlertCircle from "lucide-react/icons/alert-circle";

const TRADE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: "carpentry", label: "Carpentry" },
  { value: "concrete", label: "Concrete" },
  { value: "demolition", label: "Demolition" },
  { value: "drywall", label: "Drywall" },
  { value: "electrical", label: "Electrical" },
  { value: "fire_protection", label: "Fire Protection" },
  { value: "flooring", label: "Flooring" },
  { value: "framing", label: "Framing" },
  { value: "general", label: "General" },
  { value: "glass_glazing", label: "Glass & Glazing" },
  { value: "hvac", label: "HVAC" },
  { value: "insulation", label: "Insulation" },
  { value: "landscaping", label: "Landscaping" },
  { value: "masonry", label: "Masonry" },
  { value: "other", label: "Other" },
  { value: "painting", label: "Painting" },
  { value: "plumbing", label: "Plumbing" },
  { value: "roofing", label: "Roofing" },
  { value: "steel_work", label: "Steel Work" },
];

interface BasicInfoSectionProps {
  register: any;
  control: any;
  errors: any;
  disabled: boolean;
}

export function BasicInfoSection({
  register,
  control,
  errors,
  disabled,
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Company Name - Required */}
      <div className="space-y-1.5">
        <Label
          htmlFor="company_name"
          className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
        >
          <Building2 className="h-4 w-4 text-construction-blue dark:text-construction-blue" />
          Company Name <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <MobileInput
          {...register("company_name", addSubcontractorValidation.company_name)}
          id="company_name"
          placeholder="e.g., ABC Construction LLC"
          disabled={disabled}
          error={errors.company_name?.message}
          inputMode="text"
          enterKeyHint="next"
        />
      </div>

      {/* Trade Specialization - Required */}
      <div className="space-y-1.5">
        <Label
          htmlFor="trade_specialization"
          className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
        >
          <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Trade Specialization <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Controller
          name="trade_specialization"
          control={control}
          rules={addSubcontractorValidation.trade_specialization}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                aria-required="true"
                className="h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20 min-h-[44px]"
              >
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.trade_type && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            {errors.trade_type.message}
          </p>
        )}
      </div>

      {/* Contact Name - Required */}
      <div className="space-y-1.5">
        <Label
          htmlFor="contact_name"
          className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
        >
          <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          Contact Name <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <MobileInput
          {...register("contact_name", addSubcontractorValidation.contact_name)}
          id="contact_name"
          placeholder="e.g., John Doe"
          disabled={disabled}
          error={errors.contact_name?.message}
          inputMode="text"
          enterKeyHint="next"
        />
      </div>
    </>
  );
}
