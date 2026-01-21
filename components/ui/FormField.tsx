import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "block text-sm font-semibold",
            error ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300",
          )}
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
