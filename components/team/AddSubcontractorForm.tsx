"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createSubcontractor,
  uploadSubcontractorDocument,
} from "@/app/actions/subcontractors";
import type { TradeType } from "@/types/db/enums";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { useFormSubmit } from "@/hooks/use-form-submit";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import { Controller } from "react-hook-form";
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
import Upload from "lucide-react/icons/upload";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import HardHat from "lucide-react/icons/hard-hat";
import { toast } from "sonner";

interface AddSubcontractorFormProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

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
  { value: "framing", label: "Framing" },
  { value: "other", label: "Other" },
];

export function AddSubcontractorForm({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: AddSubcontractorFormProps) {
  const router = useRouter();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  // State to capture form metadata for document upload
  const [capturedFormData, setCapturedFormData] = useState<{
    licenseNumber?: string;
    licenseExpiry?: string;
    insuranceProvider?: string;
    insuranceExpiry?: string;
  }>({});

  // Use validated form hook with native validation
  const {
    register,
    control,
    handleSubmit: createHandleSubmit,
    formState: { errors },
    canSubmit,
    isSubmitting,
    reset,
    watch,
  } = useValidatedForm({
    defaultValues: {
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      trade_type: "general" as TradeType,
      address: "",
      license_number: "",
      insurance_provider: "",
      rating: 0,
      notes: "",
    },
  });

  const rating = watch("rating") || 0;

  // Use form submit hook
  const { formAction, isPending, result } = useFormSubmit({
    action: async (formData) => {
      // Capture form data before submission
      setCapturedFormData({
        licenseNumber: (formData.get("license_number") as string) || undefined,
        licenseExpiry: (formData.get("license_expiry") as string) || undefined,
        insuranceProvider:
          (formData.get("insurance_provider") as string) || undefined,
        insuranceExpiry:
          (formData.get("insurance_expiry") as string) || undefined,
      });

      const result = await createSubcontractor(formData);
      // Convert to FormActionResult
      if (result.success && result.data) {
        return { success: true as const, data: result.data };
      }
      return {
        success: false as const,
        error: result.error || 'Failed to create subcontractor',
        fieldErrors: 'fieldErrors' in result ? result.fieldErrors : undefined,
      };
    },
    successMessage: "Subcontractor created successfully!",
    errorMessage: "Failed to create subcontractor",
  });

  // Handle successful creation and document upload
  useEffect(() => {
    if (!result || !result.success) return;

    let isCancelled = false;

    const uploadDocuments = async () => {
      if (isCancelled) return;

      const subcontractorId = result.data.id;
      let uploadErrors = false;

      // Upload license document if provided
      if (licenseFile && !isCancelled) {
        setIsUploadingDocs(true);
        const licenseFormData = new FormData();
        licenseFormData.append("subcontractor_id", subcontractorId);
        licenseFormData.append("document_type", "license");
        licenseFormData.append("file", licenseFile);

        // Use captured state instead of DOM queries
        if (capturedFormData.licenseNumber) {
          licenseFormData.append(
            "license_number",
            capturedFormData.licenseNumber,
          );
        }
        if (capturedFormData.licenseExpiry) {
          licenseFormData.append(
            "license_expiry",
            capturedFormData.licenseExpiry,
          );
        }

        const licenseResult =
          await uploadSubcontractorDocument(licenseFormData);
        if (!isCancelled && !licenseResult.success) {
          toast.error(`License upload failed: ${licenseResult.error}`);
          uploadErrors = true;
        }
      }

      // Upload insurance document if provided
      if (insuranceFile && !isCancelled) {
        setIsUploadingDocs(true);
        const insuranceFormData = new FormData();
        insuranceFormData.append("subcontractor_id", subcontractorId);
        insuranceFormData.append("document_type", "insurance");
        insuranceFormData.append("file", insuranceFile);

        // Use captured state instead of DOM queries
        if (capturedFormData.insuranceProvider) {
          insuranceFormData.append(
            "insurance_provider",
            capturedFormData.insuranceProvider,
          );
        }
        if (capturedFormData.insuranceExpiry) {
          insuranceFormData.append(
            "insurance_expiry",
            capturedFormData.insuranceExpiry,
          );
        }

        const insuranceResult =
          await uploadSubcontractorDocument(insuranceFormData);
        if (!isCancelled && !insuranceResult.success) {
          toast.error(`Insurance upload failed: ${insuranceResult.error}`);
          uploadErrors = true;
        }
      }

      if (!isCancelled) {
        setIsUploadingDocs(false);

        // Show warning if some documents failed
        if (uploadErrors) {
          toast.warning(
            "Subcontractor created but some documents failed to upload.",
          );
        }

        // Close modal and refresh
        setTimeout(() => {
          if (!isCancelled) {
            handleClose();
            router.refresh();
            onSuccess?.();
          }
        }, 1500);
      }
    };

    uploadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [
    result,
    licenseFile,
    insuranceFile,
    capturedFormData,
  ]);

  const handleClose = useCallback(() => {
    reset();
    setLicenseFile(null);
    setInsuranceFile(null);
    setIsUploadingDocs(false);
    onClose();
  }, [onClose, reset]);

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("License file size must be less than 5MB");
        e.target.value = "";
        return;
      }
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("License file must be PDF, JPEG, or PNG");
        e.target.value = "";
        return;
      }
      setLicenseFile(file);
    }
  };

  const handleInsuranceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Insurance file size must be less than 5MB");
        e.target.value = "";
        return;
      }
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Insurance file must be PDF, JPEG, or PNG");
        e.target.value = "";
        return;
      }
      setInsuranceFile(file);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={HardHat}
      title="Add Subcontractor"
      maxWidth="3xl"
      theme="default"
    >
      <form action={formAction} className="space-y-6">
        {/* Success Message */}
        {result?.success && (
          <Alert className="bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2 font-semibold">
              Subcontractor created successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {result && !result.success && (
          <Alert className="bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="ml-2 font-semibold">
              {result.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Company Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="company_name"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Building2 className="h-4 w-4 text-construction-blue" />
            Company Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="company_name"
            type="text"
            placeholder="ABC Construction LLC"
            disabled={isPending || result?.success || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            {...register("company_name", addSubcontractorValidation.company_name)}
          />
          {errors.company_name && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.company_name.message}
            </p>
          )}
        </div>

        {/* Trade Specialization - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="trade_type"
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
                disabled={isPending || result?.success || isUploadingDocs}
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
          {/* Hidden input for form submission */}
          <input type="hidden" name="trade_specialization" value={watch("trade_type")} />
          {errors.trade_type && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.trade_type.message}
            </p>
          )}
        </div>

        {/* Contact Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="contact_name"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-construction-blue" />
            Contact Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="contact_name"
            type="text"
            placeholder="John Doe"
            disabled={isPending || result?.success || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            {...register("contact_name", addSubcontractorValidation.contact_name)}
          />
          {errors.contact_name && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.contact_name.message}
            </p>
          )}
        </div>

        {/* Email - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-construction-blue" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@abcconstruction.com"
            disabled={isPending || result?.success || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            {...register("email", addSubcontractorValidation.email)}
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Phone className="h-4 w-4 text-construction-blue" />
            Phone
          </Label>
          <PhoneInput
            id="phone"
            disabled={isPending || result?.success || isUploadingDocs}
            error={errors.phone?.message}
            {...register("phone", addSubcontractorValidation.phone)}
          />
        </div>

        {/* Address - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="address"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-construction-blue" />
            Address
          </Label>
          <Textarea
            id="address"
            placeholder="123 Main Street, City, State ZIP"
            rows={2}
            disabled={isPending || result?.success || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
            {...register("address", addSubcontractorValidation.address)}
          />
          {errors.address && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
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
                htmlFor="license_number"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                License Number
              </Label>
              <Input
                id="license_number"
                type="text"
                placeholder="LIC-123456"
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                {...register("license_number", addSubcontractorValidation.license_number)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="license_expiry"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                Expiry Date
              </Label>
              <Input
                id="license_expiry"
                name="license_expiry"
                type="date"
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="license_file"
              className="text-gray-900 dark:text-gray-100 font-semibold"
            >
              License Document
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="license_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleLicenseFileChange}
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
              {licenseFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLicenseFile(null)}
                  disabled={isPending || result?.success || isUploadingDocs}
                  className="min-h-[44px]"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            {licenseFile && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPEG, or PNG. Max 5MB.</p>
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
                htmlFor="insurance_provider"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                Provider
              </Label>
              <Input
                id="insurance_provider"
                type="text"
                placeholder="ABC Insurance Co."
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                {...register("insurance_provider", addSubcontractorValidation.insurance_provider)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="insurance_expiry"
                className="text-gray-900 dark:text-gray-100 font-semibold"
              >
                Expiry Date
              </Label>
              <Input
                id="insurance_expiry"
                name="insurance_expiry"
                type="date"
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="insurance_file"
              className="text-gray-900 dark:text-gray-100 font-semibold"
            >
              Insurance Document
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="insurance_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleInsuranceFileChange}
                disabled={isPending || result?.success || isUploadingDocs}
                className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
              {insuranceFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInsuranceFile(null)}
                  disabled={isPending || result?.success || isUploadingDocs}
                  className="min-h-[44px]"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            {insuranceFile && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {insuranceFile.name} ({(insuranceFile.size / 1024).toFixed(1)}{" "}
                KB)
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPEG, or PNG. Max 5MB.</p>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-construction-blue" />
            Performance Rating
          </Label>
          <Controller
            name="rating"
            control={control}
            rules={addSubcontractorValidation.rating}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => field.onChange(i)}
                    disabled={isPending || result?.success || isUploadingDocs}
                    className="focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        i <= (field.value || 0)
                          ? "fill-construction-yellow text-construction-yellow"
                          : "text-gray-300 hover:text-construction-yellow dark:text-gray-600 dark:hover:text-construction-yellow"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {(field.value || 0) > 0 ? `${field.value}/5` : "Not rated"}
                </span>
                <input type="hidden" name="performance_rating" value={field.value || 0} />
              </div>
            )}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100 font-semibold">
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes or comments..."
            rows={3}
            disabled={isPending || result?.success || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
            {...register("notes", addSubcontractorValidation.notes)}
          />
          {errors.notes && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.notes.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending || isUploadingDocs}
            className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || isPending || result?.success || isUploadingDocs}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 min-h-[44px] active:scale-95"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : isUploadingDocs ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading Documents...
              </>
            ) : result?.success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Created!
              </>
            ) : (
              "Add Subcontractor"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
