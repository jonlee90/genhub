"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import { acceptAdminInvitation } from "@/app/actions/accept-admin-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HardHat,
  AlertCircle,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import type { AdminInvitationData } from "@/app/actions/accept-admin-invite";

interface AdminSignupFormProps {
  token: string;
  invitation: AdminInvitationData;
  userEmail: string;
  userName: string;
}

export function AdminSignupForm({
  token,
  invitation: _invitation,
  userEmail,
  userName,
}: AdminSignupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(userName);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState(userEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    console.log("[AdminSignupForm] Submitting form", {
      name,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
    });

    const result = await acceptAdminInvitation(
      token,
      { name },
      {
        name: companyName,
        address: companyAddress || undefined,
        phone: companyPhone || undefined,
        email: companyEmail || undefined,
      },
    );

    console.log("[AdminSignupForm] Result:", result);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (result.success) {
      setSuccess(true);
      // Redirect to app after short delay
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-construction-green rounded-xl flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Welcome to GenHub!
              </h1>
              <p className="text-gray-600 mt-2">
                Your company has been created successfully. Redirecting you to
                your dashboard...
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-construction-blue animate-spin" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
      >
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center"
          >
            <HardHat className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Complete Your Setup
            </h1>
            <p className="text-gray-600 mt-1">
              Create your company profile to get started
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-construction-blue uppercase tracking-wide">
              <User className="w-4 h-4" />
              Your Information
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-gray-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="pl-10 bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                This email is linked to your Google account and cannot be
                changed.
              </p>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-construction-blue uppercase tracking-wide pt-4 border-t">
              <Building2 className="w-4 h-4" />
              Company Information
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="companyName"
                className="text-sm font-bold text-gray-700"
              >
                Company Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ABC Construction LLC"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="companyAddress"
                className="text-sm font-bold text-gray-700"
              >
                Address (Optional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="123 Main Street&#10;City, State 12345"
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="companyPhone"
                  className="text-sm font-bold text-gray-700"
                >
                  Phone (Optional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="companyEmail"
                  className="text-sm font-bold text-gray-700"
                >
                  Company Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@company.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !name || !companyName}
            className="w-full h-12 text-base text-white font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Company...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 pt-4 border-t">
            By completing setup, you'll become the admin of your company on
            GenHub
          </p>
        </form>
      </motion.div>
    </div>
  );
}
