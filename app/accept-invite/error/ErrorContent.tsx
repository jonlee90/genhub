"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "An error occurred while accepting your invitation.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              Unable to Accept Invitation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{message}</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => router.push("/app")}
              className="w-full min-h-[44px] bg-construction-blue hover:bg-construction-blue/90"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full min-h-[44px]"
            >
              Go Back
            </Button>
          </div>
        </div>
      </m.div>
    </div>
  );
}
