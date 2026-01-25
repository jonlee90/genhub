"use client";

/**
 * StatusAlerts Component
 * Success and Error alert components matching TaskModal styling
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";

export function SuccessAlert() {
  return (
    <Alert role="alert" className="bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      <AlertDescription className="ml-2 font-semibold">
        Subcontractor saved successfully!
      </AlertDescription>
    </Alert>
  );
}

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <Alert role="alert" className="bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100">
      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertDescription className="ml-2 font-semibold">
        {message}
      </AlertDescription>
    </Alert>
  );
}
