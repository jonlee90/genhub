"use client";

/**
 * ContactSection Component
 * Section for email, phone, and address fields
 */

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import Mail from "lucide-react/icons/mail";
import Phone from "lucide-react/icons/phone";
import MapPin from "lucide-react/icons/map-pin";

interface ContactSectionProps {
  register: any;
  control: any;
  errors: any;
  disabled: boolean;
}

export function ContactSection({
  register,
  control,
  errors,
  disabled,
}: ContactSectionProps) {
  return (
    <>
      {/* Email - Optional */}
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-construction-blue" />
          </div>
          Email
        </Label>
        <Input
          id="email"
          {...register("email", addSubcontractorValidation.email)}
          type="email"
          placeholder="john@abcconstruction.com"
          disabled={disabled}
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
        />
        {errors.email ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {/* Phone - Optional */}
      <div className="space-y-2">
        <Label
          htmlFor="phone"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <Phone className="h-4 w-4 text-construction-blue" />
          </div>
          Phone
        </Label>
        <Controller
          name="phone"
          control={control}
          rules={addSubcontractorValidation.phone}
          render={({ field }) => (
            <PhoneInput
              {...field}
              disabled={disabled}
              containerClassName="w-full"
            />
          )}
        />
        {errors.phone ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      {/* Address - Optional */}
      <div className="space-y-2">
        <Label
          htmlFor="address"
          className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-md bg-construction-blue/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-construction-blue" />
          </div>
          Address
        </Label>
        <Textarea
          id="address"
          {...register("address", addSubcontractorValidation.address)}
          placeholder="123 Main Street, City, State ZIP"
          rows={2}
          disabled={disabled}
          className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
        />
        {errors.address ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {errors.address.message}
          </p>
        ) : null}
      </div>
    </>
  );
}
