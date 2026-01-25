"use client";

/**
 * SubcontractorModal Component
 * Unified modal for creating and editing subcontractors
 * Uses ResponsiveModal wrapper for mobile/desktop optimization
 *
 * Features:
 * - Zod validation via useValidatedForm hook
 * - PhoneInput for phone field with automatic formatting
 * - Pre-populated form in edit mode
 * - Controller for Select and PhoneInput components
 * - Success/Error alerts matching TaskModal pattern
 *
 * Mobile Behavior (<768px):
 * ✓ Modal opens as bottom drawer
 * ✓ Drag-to-dismiss works (≥50px drag threshold)
 * ✓ Snap points: half screen (initial), full screen (on scroll/interaction)
 * ✓ Backdrop click dismisses modal
 * ✓ Safe area padding on iOS (pb-[env(safe-area-inset-bottom)])
 * ✓ All touch targets ≥44px (buttons, dropdowns, star rating)
 * ✓ Smooth animations and transitions
 *
 * Desktop Behavior (≥768px):
 * ✓ Modal opens as centered dialog
 * ✓ Max-width enforced at 3xl (768px)
 * ✓ Backdrop click dismisses modal
 * ✓ Escape key dismisses modal
 * ✓ Focus management: first input focused on open, focus returns to trigger on close
 * ✓ Keyboard navigation through all form fields
 * ✓ Smooth fade-in/fade-out animations
 *
 * Touch Target Compliance:
 * - Star rating buttons: 44px x 44px per star
 * - Footer buttons: min-h-[44px]
 * - All interactive elements meet 44px minimum in both dimensions
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import { createSubcontractor, updateSubcontractor } from "@/app/actions/subcontractors";
import type { SubcontractorsRow } from "@/types/db/tables/companies";
import type { TradeType } from "@/types/db/enums";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { addSubcontractorValidation } from "@/lib/validation/client-validation";
import { Controller } from "react-hook-form";

// Type for subcontractor form data
interface SubcontractorFormData {
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
import { toast } from "sonner";
import Plus from "lucide-react/icons/plus";
import Pencil from "lucide-react/icons/pencil";

// Section components
import { BasicInfoSection } from "./subcontractor-modal/BasicInfoSection";
import { ContactSection } from "./subcontractor-modal/ContactSection";
import { LicenseSection } from "./subcontractor-modal/LicenseSection";
import { InsuranceSection } from "./subcontractor-modal/InsuranceSection";
import { PerformanceSection } from "./subcontractor-modal/PerformanceSection";
import { NotesSection } from "./subcontractor-modal/NotesSection";

// Status alerts and footer
import { SuccessAlert, ErrorAlert } from "./subcontractor-modal/StatusAlerts";
import { ModalFooter } from "./subcontractor-modal/ModalFooter";

type Subcontractor = SubcontractorsRow;

interface SubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  subcontractor?: Subcontractor;
  companyId: string;
}

export function SubcontractorModal({
  isOpen,
  onClose,
  mode,
  subcontractor,
  companyId,
}: SubcontractorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Use validated form hook with native validation
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
      company_name: subcontractor?.company_name || "",
      contact_name: subcontractor?.contact_name || "",
      email: subcontractor?.email || "",
      phone: subcontractor?.phone || "",
      trade_type: (subcontractor?.trade_specialization || "general") as TradeType,
      address: subcontractor?.address || "",
      license_number: subcontractor?.license_number || "",
      insurance_provider: subcontractor?.insurance_provider || "",
      rating: subcontractor?.performance_rating || 0,
      notes: subcontractor?.notes || "",
    },
  });

  const rating = watch("rating") || 0;

  // Reset form when modal opens or subcontractor changes
  useEffect(() => {
    if (isOpen) {
      // Reset form with fresh data
      reset({
        company_name: subcontractor?.company_name || "",
        contact_name: subcontractor?.contact_name || "",
        email: subcontractor?.email || "",
        phone: subcontractor?.phone || "",
        trade_type: (subcontractor?.trade_specialization || "general") as TradeType,
        address: subcontractor?.address || "",
        license_number: subcontractor?.license_number || "",
        insurance_provider: subcontractor?.insurance_provider || "",
        rating: subcontractor?.performance_rating || 0,
        notes: subcontractor?.notes || "",
      });
      // Reset states
      setError(null);
      setIsSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subcontractor]);

  const handleClose = useCallback(() => {
    // Reset states on close
    setError(null);
    setIsSuccess(false);
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = createHandleSubmit(async (data: SubcontractorFormData) => {
    setError(null);

    startTransition(async () => {
      try {
        let result;

        if (mode === 'create') {
          // Create mode - use FormData for Server Action
          const formData = new FormData();
          formData.append('company_name', data.company_name);
          formData.append('contact_name', data.contact_name);
          if (data.email) formData.append('email', data.email);
          if (data.phone) formData.append('phone', data.phone);
          formData.append('trade_specialization', data.trade_type);
          if (data.address) formData.append('address', data.address);
          if (data.license_number) formData.append('license_number', data.license_number);
          if (data.insurance_provider) formData.append('insurance_provider', data.insurance_provider);
          if (data.rating && data.rating > 0) formData.append('performance_rating', data.rating.toString());
          if (data.notes) formData.append('notes', data.notes);

          result = await createSubcontractor(formData);
        } else {
          // Edit mode - use object for updateSubcontractor
          result = await updateSubcontractor({
            id: subcontractor!.id,
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
        }

        if (result.success) {
          setIsSuccess(true);
          toast.success(mode === 'create'
            ? "Subcontractor created successfully!"
            : "Subcontractor updated successfully!"
          );

          // Close modal after a short delay
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          setError(result.error || `Failed to ${mode === 'create' ? 'create' : 'update'} subcontractor`);
          toast.error(result.error || `Failed to ${mode === 'create' ? 'create' : 'update'} subcontractor`);
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred");
      }
    });
  });

  // Separate disabled states: fields should be editable, but submit requires valid data
  const isFieldDisabled = isPending || isSuccess;
  const isSubmitDisabled = isPending || isSuccess || !canSubmit;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={mode === 'create' ? Plus : Pencil}
      title={mode === 'create' ? "Add Subcontractor" : "Edit Subcontractor"}
      ariaLabel={mode === 'create' ? "Add Subcontractor" : "Edit Subcontractor"}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {isSuccess ? <SuccessAlert /> : null}

        {/* Error Message */}
        {error ? <ErrorAlert message={error} /> : null}

        {/* Basic Info Section */}
        <BasicInfoSection
          register={register}
          control={control}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* Contact Section */}
        <ContactSection
          register={register}
          control={control}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* License Section */}
        <LicenseSection
          register={register}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* Insurance Section */}
        <InsuranceSection
          register={register}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* Performance Rating Section */}
        <PerformanceSection
          rating={rating}
          setValue={setValue}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* Notes Section */}
        <NotesSection
          register={register}
          errors={errors}
          disabled={isFieldDisabled}
        />

        {/* Footer Actions */}
        <ModalFooter
          onCancel={handleClose}
          isPending={isPending}
          isSuccess={isSuccess}
          canSubmit={!isSubmitDisabled}
        />
      </form>
    </ResponsiveModal>
  );
}
