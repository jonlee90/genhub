"use client";

/**
 * InviteTeamMemberModal Component
 * Modal for inviting team members by email
 * Uses ResponsiveModal wrapper for mobile/desktop optimization
 *
 * Mobile Behavior (<768px):
 * ✓ Modal opens as bottom drawer
 * ✓ All touch targets ≥44px (buttons, dropdowns)
 * ✓ Smooth animations and transitions
 *
 * Desktop Behavior (≥768px):
 * ✓ Modal opens as centered dialog
 * ✓ Max-width enforced at 2xl
 */

import { useState, useCallback, useRef } from "react";
import { Controller } from "react-hook-form";
import { inviteTeamMember } from "@/app/actions/team";
import type { UserRole } from "@/types/db/enums";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { MobileInput } from "@/components/mobile/MobileInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Mail from "lucide-react/icons/mail";
import User from "lucide-react/icons/user";
import Shield from "lucide-react/icons/shield";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import UserPlus from "lucide-react/icons/user-plus";
import Copy from "lucide-react/icons/copy";
import Check from "lucide-react/icons/check";
import Link2 from "lucide-react/icons/link-2";
import Share2 from "lucide-react/icons/share-2";
import AlertCircle from "lucide-react/icons/alert-circle";

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

const ROLE_OPTIONS = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all features and settings",
  },
  {
    value: "project_manager",
    label: "Project Manager",
    description: "Manage projects, tasks, and team assignments",
  },
  {
    value: "foreman",
    label: "Foreman",
    description: "Field supervision and task oversight",
  },
  {
    value: "field_worker",
    label: "Field Worker",
    description: "Basic task access and updates",
  },
  {
    value: "subcontractor",
    label: "Subcontractor",
    description: "Limited to assigned work scope",
  },
  {
    value: "client",
    label: "Client",
    description: "Client portal access only",
  },
] as const;

// Validation rules
const validation = {
  first_name: {
    required: "First name is required",
    minLength: { value: 1, message: "First name is required" },
    maxLength: { value: 100, message: "First name is too long" },
  },
  last_name: {
    required: "Last name is required",
    minLength: { value: 1, message: "Last name is required" },
    maxLength: { value: 100, message: "Last name is too long" },
  },
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Please enter a valid email address",
    },
  },
  role: {
    required: "Role is required",
  },
};

// Success Alert component
function SuccessAlert({ message, invitationLink, emailSent, onCopy, copied }: {
  message: string;
  invitationLink?: string;
  emailSent?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">{message}</p>
        </div>
      </div>

      {/* Invitation Link Box */}
      {invitationLink && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-construction-blue" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Invitation Link
            </span>
            {!emailSent && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
                Email not sent
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            Share this link with your team member to complete registration:
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {invitationLink}
            </div>
            <button
              type="button"
              onClick={onCopy}
              className={cn(
                "shrink-0 px-3 py-2 text-sm font-medium rounded-lg border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center",
                copied
                  ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "border-gray-200 dark:border-gray-700 hover:border-construction-blue hover:bg-construction-blue/5 text-gray-700 dark:text-gray-300"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={() => {
                  navigator.share({
                    title: "Team Invitation - GenHub",
                    text: "You have been invited to join our team on GenHub!",
                    url: invitationLink,
                  });
                }}
                className="shrink-0 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:border-construction-blue hover:bg-construction-blue/5 text-gray-700 dark:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Link expires in 7 days for security.
          </p>
        </div>
      )}
    </div>
  );
}

// Error Alert component
function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
      </div>
    </div>
  );
}

export function InviteTeamMemberModal({
  isOpen,
  onClose,
  companyId,
}: InviteTeamMemberModalProps) {
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{
    message: string;
    invitationLink?: string;
    emailSent?: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form ref for programmatic submission
  const formRef = useRef<HTMLFormElement>(null);

  // Form for invite
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    canSubmit,
    reset,
  } = useValidatedForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "field_worker" as UserRole,
    },
  });

  const handleClose = useCallback(() => {
    reset();
    setCopied(false);
    setServerError(null);
    setServerSuccess(null);
    onClose();
  }, [onClose, reset]);

  // Handle form submission
  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setServerSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", `${data.first_name} ${data.last_name}`);
    formData.append("email", data.email);
    formData.append("role", data.role);

    const result = await inviteTeamMember(formData);
    setIsSubmitting(false);

    if (result.success) {
      setServerSuccess({
        message: result.message || "Invitation sent successfully",
        invitationLink: result.invitationLink,
        emailSent: result.emailSent,
      });
    } else {
      setServerError(result.error || "Failed to send invitation");
    }
  });

  // Copy invitation link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (serverSuccess?.invitationLink) {
      try {
        await navigator.clipboard.writeText(serverSuccess.invitationLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Silently handle copy failure
      }
    }
  }, [serverSuccess?.invitationLink]);

  // Navigation handlers for ResponsiveModal
  const handleContinue = useCallback(() => {
    if (serverSuccess) {
      // After success, reset and allow adding another
      setServerSuccess(null);
      setServerError(null);
      reset();
    } else {
      // Submit the form
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  }, [serverSuccess, reset]);

  // Determine button labels
  const continueLabel = isSubmitting
    ? "Sending..."
    : serverSuccess
    ? "Invite Another"
    : "Send Invitation";

  const isFieldDisabled = isSubmitting || !!serverSuccess;
  const isSubmitDisabled = isSubmitting || !canSubmit;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Invite Team Member"
      maxWidth="2xl"
      showNavigation={true}
      onBack={handleClose}
      backLabel="Cancel"
      onContinue={handleContinue}
      continueLabel={continueLabel}
      continueDisabled={!serverSuccess && isSubmitDisabled}
    >
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        {/* Success Message */}
        {serverSuccess && (
          <SuccessAlert
            message={serverSuccess.message}
            invitationLink={serverSuccess.invitationLink}
            emailSent={serverSuccess.emailSent}
            onCopy={handleCopyLink}
            copied={copied}
          />
        )}

        {/* Error Message */}
        {serverError && <ErrorAlert message={serverError} />}

        {/* First Name & Last Name - Side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="first_name"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <User className="h-4 w-4 text-construction-blue" />
              First Name <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <MobileInput
              {...register("first_name", validation.first_name)}
              id="first_name"
              type="text"
              placeholder="John"
              disabled={isFieldDisabled}
              error={errors.first_name?.message}
              inputMode="text"
              enterKeyHint="next"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="last_name"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Last Name <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <MobileInput
              {...register("last_name", validation.last_name)}
              id="last_name"
              type="text"
              placeholder="Doe"
              disabled={isFieldDisabled}
              error={errors.last_name?.message}
              inputMode="text"
              enterKeyHint="next"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
          >
            <Mail className="h-4 w-4 text-construction-blue" />
            Email Address <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <MobileInput
            {...register("email", validation.email)}
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            disabled={isFieldDisabled}
            error={errors.email?.message}
            inputMode="email"
            enterKeyHint="next"
          />
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <Label
            htmlFor="role"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
          >
            <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            Role <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Controller
            name="role"
            control={control}
            rules={validation.role}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isFieldDisabled}
              >
                <SelectTrigger
                  aria-required="true"
                  className="h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20 min-h-[44px]"
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Info Box */}
        {!serverSuccess && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              An invitation email will be sent. The team member will appear in your team list once they accept the invitation.
            </p>
          </div>
        )}
      </form>
    </ResponsiveModal>
  );
}
