"use client";

/**
 * BasicInfoSection Component
 * Section for company name, trade specialization, and contact name
 */

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import FileText from "lucide-react/icons/file-text";
import User from "lucide-react/icons/user";

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
      <div className="space-y-2">
        <Label
          htmlFor="company_name"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-construction-blue" />
          </div>
          Company Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="company_name"
          {...register("company_name", addSubcontractorValidation.company_name)}
          type="text"
          placeholder="ABC Construction LLC"
          disabled={disabled}
          aria-required="true"
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
        />
        {errors.company_name ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.company_name.message}
          </p>
        ) : null}
      </div>

      {/* Trade Specialization - Required */}
      <div className="space-y-2">
        <Label
          htmlFor="trade_specialization"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-construction-blue" />
          </div>
          Trade Specialization <span className="text-red-600">*</span>
        </Label>
        <Controller
          name="trade_type"
          control={control}
          rules={addSubcontractorValidation.trade_type}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger aria-required="true" className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue min-h-[44px]">
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
        {errors.trade_type ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.trade_type.message}
          </p>
        ) : null}
      </div>

      {/* Contact Name - Required */}
      <div className="space-y-2">
        <Label
          htmlFor="contact_name"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <User className="h-4 w-4 text-construction-blue" />
          </div>
          Contact Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="contact_name"
          {...register("contact_name", addSubcontractorValidation.contact_name)}
          type="text"
          placeholder="John Doe"
          disabled={disabled}
          aria-required="true"
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
        />
        {errors.contact_name ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.contact_name.message}
          </p>
        ) : null}
      </div>
    </>
  );
}
