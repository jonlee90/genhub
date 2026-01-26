"use client";

/**
 * ContactSection Component
 * Section for email, phone, and address fields
 */

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/mobile/MobileInput";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import Users from "lucide-react/icons/users";
import Mail from "lucide-react/icons/mail";
import Phone from "lucide-react/icons/phone";
import MapPin from "lucide-react/icons/map-pin";
import AlertCircle from "lucide-react/icons/alert-circle";

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
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        Contact Information
      </h4>

      <div className="space-y-4">
        {/* Email & Phone - Side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Email
            </Label>
            <MobileInput
              {...register("email", addSubcontractorValidation.email)}
              id="email"
              type="email"
              placeholder="john@abcconstruction.com"
              disabled={disabled}
              error={errors.email?.message}
              inputMode="email"
              enterKeyHint="next"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
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
            {errors.phone && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label
            htmlFor="address"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
          >
            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            Address
          </Label>
          <Textarea
            id="address"
            {...register("address", addSubcontractorValidation.address)}
            placeholder="123 Main Street, City, State ZIP"
            rows={2}
            disabled={disabled}
            className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 resize-none text-sm rounded-xl min-h-[72px]"
          />
          {errors.address && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              {errors.address.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
