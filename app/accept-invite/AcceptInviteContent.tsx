"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { type InvitationData } from "@/app/actions/accept-invite";
import { checkEmailExists } from "@/app/actions/invite-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  HardHat,
  AlertCircle,
  Mail,
  User,
  Building2,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AcceptInviteContentProps = {
  invitation?: InvitationData;
  token?: string;
  error?: string;
};

// Role display mapping
const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-construction-blue text-white" },
  project_manager: {
    label: "Project Manager",
    color: "bg-blue-600 text-white",
  },
  foreman: { label: "Foreman", color: "bg-construction-gray text-white" },
  field_worker: { label: "Field Worker", color: "bg-gray-600 text-white" },
  subcontractor: {
    label: "Subcontractor",
    color: "bg-construction-gray-light text-white",
  },
  client: { label: "Client", color: "bg-gray-500 text-white" },
};

export function AcceptInviteContent({
  invitation,
  token,
  error: initialError,
}: AcceptInviteContentProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);

  // If there's an initial error (invalid token, etc.), show error state
  if (initialError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                Invalid Invitation
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{initialError}</p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-construction-blue hover:bg-construction-blue/90"
            >
              Return to Home
            </Button>
          </div>
        </m.div>
      </div>
    );
  }

  // If no invitation data, this shouldn't happen but handle it
  if (!invitation || !token) {
    return null;
  }

  const roleInfo = ROLE_DISPLAY[invitation.role] || {
    label: invitation.role,
    color: "bg-gray-500 text-white",
  };

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setError(undefined);
    try {
      // Check if email exists in the system
      const result = await checkEmailExists(invitation.email);

      if (!result.success) {
        setError(result.error);
        setIsAccepting(false);
        return;
      }

      // Route based on user existence and password status
      if (result.exists && result.hasPassword) {
        // User exists with password -> redirect to login
        router.push(`/accept-invite/login?token=${token}`);
      } else if (result.exists && !result.hasPassword) {
        // User exists but only has Google auth
        setError(
          "Account exists with Google sign-in. Please contact your administrator for assistance."
        );
        setIsAccepting(false);
      } else {
        // New user -> redirect to signup
        router.push(`/accept-invite/signup?token=${token}`);
      }
    } catch (err) {
      console.error("Accept invitation error:", err);
      setError("Failed to process invitation. Please try again.");
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8"
      >
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <m.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center"
          >
            <HardHat className="w-8 h-8 text-white" />
          </m.div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">
              Join GenHub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Accept your team invitation
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Invitation Details */}
        <div className="bg-gradient-to-br from-construction-blue/5 to-blue-50 dark:from-construction-blue/10 dark:to-blue-950 rounded-xl border-2 border-construction-blue/20 dark:border-construction-blue/30 p-4 mb-6 space-y-3">
          <h2 className="font-black text-construction-blue text-sm uppercase tracking-wide">
            Invitation Details
          </h2>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">Email:</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">
                {invitation.email}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">Name:</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">
                {invitation.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">Company:</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">
                {invitation.companyName}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <UserCog className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">Role:</span>
              <Badge className={cn("font-bold", roleInfo.color)}>
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Accept Invitation Button */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full min-h-[44px] text-base font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all active:scale-[0.98]"
          >
            {isAccepting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Accept Invitation
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
            By continuing, you agree to join {invitation.companyName} on GenHub
          </p>
        </div>
      </m.div>
    </div>
  );
}
