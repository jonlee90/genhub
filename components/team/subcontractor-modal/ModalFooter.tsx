"use client";

/**
 * ModalFooter Component
 * Footer with Cancel and Submit buttons
 * Submit button shows different states: Normal, Pending (Loader2), Success (CheckCircle2)
 */

import { Button } from "@/components/ui/button";
import Loader2 from "lucide-react/icons/loader-2";
import CheckCircle2 from "lucide-react/icons/check-circle-2";

interface ModalFooterProps {
  onCancel: () => void;
  isPending: boolean;
  isSuccess: boolean;
  canSubmit: boolean;
}

export function ModalFooter({
  onCancel,
  isPending,
  isSuccess,
  canSubmit,
}: ModalFooterProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px]"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={!canSubmit}
        className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 min-h-[44px]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Saved!
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}
