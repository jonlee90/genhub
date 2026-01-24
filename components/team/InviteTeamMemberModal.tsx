"use client";

import { useState, useCallback } from "react";
import { Controller } from "react-hook-form";
import { inviteTeamMember } from "@/app/actions/team";
import type { UserRole } from "@/types/db/enums";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { inviteTeamMemberValidation } from "@/lib/validation/client-validation";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { MobileInput } from "@/components/mobile/MobileInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Loader2 from "lucide-react/icons/loader-2";
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

  // Use React Hook Form with native validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    canSubmit,
    reset,
  } = useValidatedForm({
    defaultValues: {
      email: "",
      name: "",
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
    formData.append("email", data.email);
    formData.append("name", data.name);
    formData.append("role", data.role);
    formData.append("company_id", companyId);

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
        // Reset copied state after 3 seconds
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        // Silently handle copy failure
      }
    }
  }, [serverSuccess?.invitationLink]);

  // Share link using Web Share API (if available)
  const handleShareLink = useCallback(async () => {
    if (serverSuccess?.invitationLink && navigator.share) {
      try {
        await navigator.share({
          title: "Team Invitation - GenHub",
          text: "You have been invited to join our team on GenHub!",
          url: serverSuccess.invitationLink,
        });
      } catch (err) {
        // User cancelled or share failed - silently handle
      }
    }
  }, [serverSuccess?.invitationLink]);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Invite Team Member"
      maxWidth="2xl"
    >
      <form id="invite-form" onSubmit={onSubmit} className="space-y-6">
        {/* Success Message with Shareable Link */}
        {serverSuccess && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-2 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="ml-2 font-semibold">
                {serverSuccess.message}
              </AlertDescription>
            </Alert>

            {/* Invitation Link Box */}
            {serverSuccess.invitationLink && (
              <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-construction-blue" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Invitation Link
                  </span>
                  {!serverSuccess.emailSent && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
                      Email not sent - share manually
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share this link with your team member to complete their
                  registration:
                </p>

                {/* Link Display and Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                    {serverSuccess.invitationLink}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className={`shrink-0 border-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
                      copied
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-construction-blue hover:bg-construction-blue/5"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  {/* Share button - only show if Web Share API is available */}
                  {typeof navigator !== "undefined" &&
                    typeof navigator.share === "function" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleShareLink}
                        className="shrink-0 border-2 border-gray-300 dark:border-gray-600 hover:border-construction-blue hover:bg-construction-blue/5 min-h-[44px] min-w-[44px]"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This link expires in 7 days for security reasons.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {serverError && (
          <Alert className="bg-red-50 border-2 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="ml-2 font-semibold">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-construction-blue" />
            Email Address
          </Label>
          <MobileInput
            {...register("email", inviteTeamMemberValidation.email)}
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            disabled={isSubmitting || !!serverSuccess}
            error={errors.email?.message}
          />
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-construction-blue" />
            Full Name
          </Label>
          <MobileInput
            {...register("name", inviteTeamMemberValidation.name)}
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isSubmitting || !!serverSuccess}
            error={errors.name?.message}
          />
        </div>

        {/* Role Selector */}
        <div className="space-y-2">
          <Label
            htmlFor="role"
            className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2"
          >
            <Shield className="h-4 w-4 text-construction-blue" />
            Role
          </Label>
          <Controller
            name="role"
            control={control}
            rules={inviteTeamMemberValidation.role}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting || !!serverSuccess}
              >
                <SelectTrigger className="border-2 border-gray-300 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue min-h-[56px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
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
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-construction-blue p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-construction-blue" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Role Permissions
              </h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <p className="mb-1">
                  <strong>Admin:</strong> Full system access
                </p>
                <p className="mb-1">
                  <strong>Project Manager:</strong> Manage projects and teams
                </p>
                <p className="mb-1">
                  <strong>Foreman:</strong> Field supervision
                </p>
                <p className="mb-1">
                  <strong>Field Worker:</strong> Task execution
                </p>
                <p className="mb-1">
                  <strong>Subcontractor:</strong> Limited scope access
                </p>
                <p>
                  <strong>Client:</strong> View-only access
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {serverSuccess ? (
            <>
              {/* After success: Show invite another and done buttons */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Reset form to invite another member
                  setServerSuccess(null);
                  setServerError(null);
                  reset();
                }}
                className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Another
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done
              </Button>
            </>
          ) : (
            <>
              {/* Before success: Show cancel and submit buttons */}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </ResponsiveModal>
  );
}
