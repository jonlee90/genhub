"use client";

/**
 * PasswordSignInForm Component
 *
 * Email + Password sign-in form with validation and error handling.
 * Uses the CredentialsProvider configured in auth.config.ts.
 *
 * Features:
 * - Zod validation via useValidatedForm hook
 * - MobileInput for email field
 * - PasswordInput for password field
 * - Error state management
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { emailSignInValidation } from "@/lib/validation/client-validation";
import { Button } from "@/components/ui/button";
import { MobileInput } from "@/components/mobile/MobileInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

// Type for password sign-in form data
interface PasswordSignInFormData {
  email: string;
  password: string;
}

interface PasswordSignInFormProps {
  callbackUrl?: string;
  defaultEmail?: string;
}

type FormState = "idle" | "loading" | "error";

export function PasswordSignInForm({
  callbackUrl = "/app",
  defaultEmail = "",
}: PasswordSignInFormProps) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Use validated form hook with native validation
  const {
    register,
    handleSubmit: createHandleSubmit,
    formState: { errors },
    canSubmit,
  } = useValidatedForm({
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  // Handle form submission
  const handleSubmit = createHandleSubmit(async (data: PasswordSignInFormData) => {
    console.log("[PasswordSignInForm] Form submitted - handler called");
    console.log("[PasswordSignInForm] Submitting email:", data.email);

    setFormState("loading");
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl,
        redirect: false,
      });

      console.log("[PasswordSignInForm] Sign-in result:", result);

      if (result?.error) {
        console.error("[PasswordSignInForm] Sign-in error:", result.error);
        setErrorMessage("Invalid email or password. Please try again.");
        setFormState("error");
      } else if (result?.ok) {
        // Success - redirect to callback URL
        console.log("[PasswordSignInForm] Sign-in successful, redirecting to:", callbackUrl);
        window.location.href = callbackUrl;
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setFormState("error");
      }
    } catch (error) {
      console.error("[PasswordSignInForm] Error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setFormState("error");
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      <AnimatePresence>
        {formState === "error" && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Input */}
      <MobileInput
        {...register("email", emailSignInValidation.email)}
        label="Email Address"
        type="email"
        inputMode="email"
        enterKeyHint="next"
        placeholder="you@example.com"
        error={errors.email?.message}
        disabled={formState === "loading"}
      />

      {/* Password Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <PasswordInput
          {...register("password", {
            required: "Password is required",
          })}
          id="password"
          placeholder="Enter your password"
          disabled={formState === "loading"}
          className={errors.password ? "border-red-500" : ""}
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
        disabled={!canSubmit || formState === "loading"}
        className="w-full h-12 text-base font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all min-h-[44px]"
      >
        {formState === "loading" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
}
