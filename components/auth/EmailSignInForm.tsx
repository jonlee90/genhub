"use client";

/**
 * EmailSignInForm Component
 *
 * Email magic link sign-in form with validation and success/error states.
 * Uses Nodemailer provider for sending magic links.
 *
 * Debug: States - idle, loading, success, error
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, AlertCircle, ArrowLeft } from "lucide-react";

interface EmailSignInFormProps {
  callbackUrl?: string;
  defaultEmail?: string;
}

type FormState = "idle" | "loading" | "success" | "error";

export function EmailSignInForm({
  callbackUrl = "/app",
  defaultEmail = "",
}: EmailSignInFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Debug: Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Debug: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[EmailSignInForm] Submitting email:", email);

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      setFormState("error");
      return;
    }

    setFormState("loading");
    setErrorMessage("");

    try {
      const result = await signIn("nodemailer", {
        email,
        callbackUrl,
        redirect: false,
      });

      console.log("[EmailSignInForm] Sign-in result:", result);

      if (result?.error) {
        setErrorMessage("Failed to send magic link. Please try again.");
        setFormState("error");
      } else {
        setFormState("success");
      }
    } catch (error) {
      console.error("[EmailSignInForm] Error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setFormState("error");
    }
  };

  // Debug: Reset form to try again
  const handleReset = () => {
    setFormState("idle");
    setErrorMessage("");
  };

  // Success state - email sent
  if (formState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mx-auto w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center"
        >
          <Mail className="w-8 h-8 text-construction-blue" />
        </motion.div>
        <div>
          <h3 className="text-xl font-black text-gray-900">Check Your Email</h3>
          <p className="text-gray-600 mt-2">
            We've sent a magic link to{" "}
            <strong className="text-construction-blue">{email}</strong>
          </p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium">Didn't receive the email?</p>
          <p className="mt-1">Check your spam folder or try again.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Try a different email
        </Button>
      </motion.div>
    );
  }

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
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-900 font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={formState === "loading"}
          className="h-12 text-base border-2 focus:border-construction-blue focus:ring-construction-blue/20"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={formState === "loading" || !email}
        className="w-full h-12 text-base font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all"
      >
        {formState === "loading" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-5 w-5" />
            Send Magic Link
          </>
        )}
      </Button>
    </form>
  );
}
