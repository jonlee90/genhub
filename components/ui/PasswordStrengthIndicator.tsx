"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordStrengthIndicatorProps = {
  password: string;
};

type Requirement = {
  label: string;
  test: (password: string) => boolean;
};

const requirements: Requirement[] = [
  {
    label: "8+ characters",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "Uppercase letter (A-Z)",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "Lowercase letter (a-z)",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "Number (0-9)",
    test: (password: string) => /[0-9]/.test(password),
  },
];

// Hoisted outside component - no re-creation on render (rendering-hoist-jsx pattern)
const PROGRESS_COLORS = {
  weak: "bg-red-500 dark:bg-red-600",
  medium: "bg-yellow-500 dark:bg-yellow-600",
  strong: "bg-green-500 dark:bg-green-600",
} as const;

function getProgressColor(count: number): string {
  if (count <= 1) return PROGRESS_COLORS.weak;
  if (count <= 3) return PROGRESS_COLORS.medium;
  return PROGRESS_COLORS.strong;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const metRequirements = React.useMemo(() => {
    return requirements.map((req) => req.test(password));
  }, [password]);

  const metCount = metRequirements.filter(Boolean).length;
  const progressColor = getProgressColor(metCount);
  const progressWidth = `${(metCount / requirements.length) * 100}%`;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", progressColor)}
          style={{ width: progressWidth }}
        />
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-2">
        {requirements.map((req, index) => {
          const isMet = metRequirements[index];
          return (
            <li
              key={req.label}
              className="flex items-center gap-2 text-sm"
            >
              {isMet ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "transition-colors",
                  isMet
                    ? "text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
