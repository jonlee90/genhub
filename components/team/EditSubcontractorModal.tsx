"use client";

/**
 * EditSubcontractorModal Component
 * Modal for editing existing subcontractor details
 * Uses updateSubcontractor Server Action for data persistence
 *
 * Features:
 * - Zod validation via useValidatedForm hook
 * - PhoneInput for phone field with automatic formatting
 * - Pre-populated form with existing data
 * - Controller for Select components
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import { updateSubcontractor } from "@/app/actions/subcontractors";
import type { SubcontractorsRow } from "@/types/db/tables/companies";
import type { TradeType } from "@/types/db/enums";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import { Controller } from "react-hook-form";

// Type for subcontractor form data
interface AddSubcontractorFormData {
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  trade_type: TradeType;
  address?: string;
  license_number?: string;
  insurance_provider?: string;
  rating?: number;
  notes?: string;
}
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Loader2 from "lucide-react/icons/loader-2";
import Building2 from "lucide-react/icons/building-2";
import User from "lucide-react/icons/user";
import Mail from "lucide-react/icons/mail";
import Phone from "lucide-react/icons/phone";
import MapPin from "lucide-react/icons/map-pin";
import FileText from "lucide-react/icons/file-text";
import Shield from "lucide-react/icons/shield";
import Star from "lucide-react/icons/star";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import Pencil from "lucide-react/icons/pencil";
import { toast } from "sonner";

type Subcontractor = SubcontractorsRow;

const TRADE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "carpentry", label: "Carpentry" },
  { value: "masonry", label: "Masonry" },
  { value: "roofing", label: "Roofing" },
  { value: "flooring", label: "Flooring" },
  { value: "painting", label: "Painting" },
  { value: "drywall", label: "Drywall" },
  { value: "concrete", label: "Concrete" },
  { value: "landscaping", label: "Landscaping" },
  { value: "demolition", label: "Demolition" },
  { value: "steel_work", label: "Steel Work" },
  { value: "glass_glazing", label: "Glass & Glazing" },
  { value: "fire_protection", label: "Fire Protection" },
  { value: "insulation", label: "Insulation" },
  { value: "other", label: "Other" },
];

interface EditSubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontractor: Subcontractor;
}

export function EditSubcontractorModal({
  isOpen,
  onClose,
  subcontractor,
}: EditSubcontractorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Use validated form hook with native validation and pre-populated data
  const {
    register,
    control,
    handleSubmit: createHandleSubmit,
    formState: { errors },
    canSubmit,
    reset,
    watch,
    setValue,
  } = useValidatedForm({
    defaultValues: {
      company_name: subcontractor.company_name || "",
      contact_name: subcontractor.contact_name || "",
      email: subcontractor.email || "",
      phone: subcontractor.phone || "",
      trade_type: (subcontractor.trade_specialization || "general") as TradeType,
      address: subcontractor.address || "",
      license_number: subcontractor.license_number || "",
      insurance_provider: subcontractor.insurance_provider || "",
      rating: subcontractor.performance_rating || 0,
      notes: subcontractor.notes || "",
    },
  });

  const rating = watch("rating") || 0;

  // Reset form when modal opens with subcontractor data
  useEffect(() => {
    if (isOpen) {
      // Reset form with fresh data
      reset({
        company_name: subcontractor.company_name || "",
        contact_name: subcontractor.contact_name || "",
        email: subcontractor.email || "",
        phone: subcontractor.phone || "",
        trade_type: (subcontractor.trade_specialization || "general") as TradeType,
        address: subcontractor.address || "",
        license_number: subcontractor.license_number || "",
        insurance_provider: subcontractor.insurance_provider || "",
        rating: subcontractor.performance_rating || 0,
        notes: subcontractor.notes || "",
      });
    }
  }, [isOpen, subcontractor, reset]);

  const handleClose = useCallback(() => {
    // Reset states on close
    setError(null);
    setIsSuccess(false);
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = createHandleSubmit(async (data: AddSubcontractorFormData) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await updateSubcontractor({
          id: subcontractor.id,
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          trade_specialization: data.trade_type,
          license_number: data.license_number || undefined,
          insurance_provider: data.insurance_provider || undefined,
          performance_rating: data.rating && data.rating > 0 ? data.rating : undefined,
          notes: data.notes || undefined,
        });

        if (result.success) {
          setIsSuccess(true);
          toast.success("Subcontractor updated successfully!");

          // Close modal after a short delay
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          setError(result.error || "Failed to update subcontractor");
          toast.error(result.error || "Failed to update subcontractor");
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred");
      }
    });
  });

  const isDisabled = isPending || isSuccess || !canSubmit;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Pencil}
      title="Edit Subcontractor"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {isSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2 font-semibold">
              Subcontractor updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="ml-2 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Company Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_company_name"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Building2 className="h-4 w-4 text-construction-blue" />
            Company Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit_company_name"
            {...register("company_name", addSubcontractorValidation.company_name)}
            type="text"
            placeholder="ABC Construction LLC"
            disabled={isDisabled}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {errors.company_name && (
            <p className="text-sm text-red-600 font-medium">
              {errors.company_name.message}
            </p>
          )}
        </div>

        {/* Trade Specialization - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_trade_specialization"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-construction-blue" />
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
                disabled={isDisabled}
              >
                <SelectTrigger className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue">
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
            <p className="text-sm text-red-600 font-medium">
              {errors.trade_type.message}
            </p>
          )}
        </div>

        {/* Contact Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_contact_name"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-construction-blue" />
            Contact Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit_contact_name"
            {...register("contact_name", addSubcontractorValidation.contact_name)}
            type="text"
            placeholder="John Doe"
            disabled={isDisabled}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {errors.contact_name && (
            <p className="text-sm text-red-600 font-medium">
              {errors.contact_name.message}
            </p>
          )}
        </div>

        {/* Email - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_email"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-construction-blue" />
            Email
          </Label>
          <Input
            id="edit_email"
            {...register("email", addSubcontractorValidation.email)}
            type="email"
            placeholder="john@abcconstruction.com"
            disabled={isDisabled}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {errors.email && (
            <p className="text-sm text-red-600 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_phone"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Phone className="h-4 w-4 text-construction-blue" />
            Phone
          </Label>
          <Controller
            name="phone"
            control={control}
            rules={addSubcontractorValidation.phone}
            render={({ field }) => (
              <PhoneInput
                {...field}
                disabled={isDisabled}
                containerClassName="w-full"
              />
            )}
          />
          {errors.phone && (
            <p className="text-sm text-red-600 font-medium">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Address - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_address"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-construction-blue" />
            Address
          </Label>
          <Textarea
            id="edit_address"
            {...register("address", addSubcontractorValidation.address)}
            placeholder="123 Main Street, City, State ZIP"
            rows={2}
            disabled={isDisabled}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
          />
          {errors.address && (
            <p className="text-sm text-red-600 font-medium">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* License Section */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-construction-blue" />
            License Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit_license_number"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                License Number
              </Label>
              <Input
                id="edit_license_number"
                {...register("license_number", addSubcontractorValidation.license_number)}
                type="text"
                placeholder="LIC-123456"
                disabled={isDisabled}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
              {errors.license_number && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.license_number.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Insurance Section */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-construction-blue" />
            Insurance Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit_insurance_provider"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                Provider
              </Label>
              <Input
                id="edit_insurance_provider"
                {...register("insurance_provider", addSubcontractorValidation.insurance_provider)}
                type="text"
                placeholder="ABC Insurance Co."
                disabled={isDisabled}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
              {errors.insurance_provider && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.insurance_provider.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-construction-blue" />
            Performance Rating
          </Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setValue("rating", rating === i ? 0 : i)}
                disabled={isDisabled}
                className="focus:outline-none focus:ring-2 focus:ring-construction-blue focus:ring-offset-2 rounded-sm disabled:opacity-50 min-h-[44px] min-w-[44px]"
                aria-label={`Rate ${i} stars`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    i <= rating
                      ? "fill-construction-yellow text-construction-yellow"
                      : "text-gray-300 dark:text-gray-600 hover:text-construction-yellow"
                  }`}
                />
              </button>
            ))}
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {rating > 0 ? `${rating}/5` : "Not rated"}
            </span>
          </div>
          {errors.rating && (
            <p className="text-sm text-red-600 font-medium">
              {errors.rating.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="edit_notes" className="text-gray-900 dark:text-gray-100 font-semibold">
            Notes
          </Label>
          <Textarea
            id="edit_notes"
            {...register("notes", addSubcontractorValidation.notes)}
            placeholder="Any additional notes or comments..."
            rows={3}
            disabled={isDisabled}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
          />
          {errors.notes && (
            <p className="text-sm text-red-600 font-medium">
              {errors.notes.message}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="border-2 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isDisabled}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
