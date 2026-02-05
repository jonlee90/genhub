"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { m } from "framer-motion";
import { type InvitationData } from "@/app/actions/accept-invite";
import { signupWithInvitation } from "@/app/actions/invite-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  HardHat,
  AlertCircle,
  Mail,
  User,
  Lock,
} from "lucide-react";
import {
  passwordValidation,
  confirmPasswordValidation,
  inviteSignupValidation,
} from "@/lib/validation/client-validation";

type InviteSignupFormProps = {
  invitation: InvitationData;
  token: string;
};

type FormData = {
  name: string;
  password: string;
  confirmPassword: string;
};

export function InviteSignupForm({ invitation, token }: InviteSignupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: invitation.name,
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const getPassword = () => watch("password");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const result = await signupWithInvitation({
        token,
        name: data.name,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to login with success message
      router.push(`/accept-invite/login?token=${token}&signup=success`);
    } catch (err) {
      console.error("Signup error:", err);
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
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Join {invitation.companyName} on GenHub
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

        {/* Signup Form */}
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

          {/* Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              {...register("name", inviteSignupValidation.name)}
              placeholder="Enter your full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
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
              {...register("password", passwordValidation)}
              placeholder="Create a strong password"
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator password={password} />

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              {...register("confirmPassword", confirmPasswordValidation(getPassword))}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
            By creating an account, you agree to join {invitation.companyName} on
            GenHub
          </p>
        </form>
      </m.div>
    </div>
  );
}
