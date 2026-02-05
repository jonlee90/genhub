"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { m } from "framer-motion";
import { type InvitationData, acceptInvitation } from "@/app/actions/accept-invite";
import { validatePasswordForInvitation } from "@/app/actions/invite-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  HardHat,
  AlertCircle,
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";

type InviteLoginFormProps = {
  invitation: InvitationData;
  token: string;
  showSuccessMessage?: boolean;
};

type FormData = {
  password: string;
};

export function InviteLoginForm({
  invitation,
  token,
  showSuccessMessage = false,
}: InviteLoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      // Step 1: Validate password with Supabase Auth
      const validateResult = await validatePasswordForInvitation({
        token,
        password: data.password,
      });

      if (!validateResult.success) {
        setError(validateResult.error);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create NextAuth session and redirect to callback page
      // The callback page will accept the invitation once session is fully established
      // Note: signIn with redirect: true navigates away and never returns
      await signIn("credentials", {
        email: validateResult.email,
        password: data.password,
        redirect: true,
        callbackUrl: `/accept-invite/callback?token=${token}`,
      });
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
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
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sign in to join {invitation.companyName}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccessMessage ? (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Account created successfully! Please sign in to continue.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Error Alert */}
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field (Disabled) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              value={invitation.email}
              disabled
              className="bg-gray-50 dark:bg-gray-950"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Password
            </label>
            <PasswordInput
              id="password"
              {...register("password", {
                required: "Password is required",
              })}
              placeholder="Enter your password"
              className={errors.password ? "border-red-500" : ""}
              autoFocus
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] text-base font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
            Signing in will accept your invitation to {invitation.companyName}
          </p>
        </form>
      </m.div>
    </div>
  );
}
