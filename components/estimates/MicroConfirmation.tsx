"use client";

import { useState, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SkipForward from "lucide-react/icons/skip-forward";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getPendingMicroConfirmations,
  respondToMicroConfirmation,
} from "@/app/actions/estimates";

type MicroConfirmationType =
  | "scale_confirm"
  | "ceiling_height"
  | "door_count"
  | "room_count"
  | "wall_type_confirm";

type MicroConfirmation = {
  id: string;
  planUploadId: string;
  type: MicroConfirmationType;
  question: string;
  regionImageUrl: string;
  responseOptions: string[];
  defaultResponse?: string | null;
};

type MicroConfirmationProps = {
  planUploadId: string;
  onComplete?: () => void;
};

export function MicroConfirmation({
  planUploadId,
  onComplete,
}: MicroConfirmationProps) {
  const [confirmations, setConfirmations] = useState<MicroConfirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);

  // Load confirmations on mount
  useEffect(() => {
    async function loadConfirmations() {
      try {
        const result = await getPendingMicroConfirmations(planUploadId);
        if (result.success && result.data) {
          // Limit to max 5 confirmations and type cast
          const validConfirmations =
            result.data as unknown as MicroConfirmation[];
          setConfirmations(validConfirmations.slice(0, 5));
        }
      } catch (error) {
        console.error("[MicroConfirmation] Load error:", error);
        toast.error("Failed to load confirmations");
      } finally {
        setIsLoading(false);
      }
    }

    loadConfirmations();
  }, [planUploadId]);

  const handleResponse = async (response: string) => {
    if (currentIndex >= confirmations.length) return;

    const confirmation = confirmations[currentIndex];
    setIsResponding(true);

    try {
      // Submit response with transition for smooth confidence update
      startTransition(async () => {
        const result = await respondToMicroConfirmation({
          confirmationId: confirmation.id,
          response,
        });

        if (result.success) {
          toast.success("Response recorded");
        } else {
          toast.error(result.error || "Failed to record response");
        }
      });

      // Move to next card
      setTimeout(() => {
        if (currentIndex + 1 >= confirmations.length) {
          onComplete?.();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
        setIsResponding(false);
      }, 300);
    } catch (error) {
      console.error("[MicroConfirmation] Response error:", error);
      toast.error("Failed to record response");
      setIsResponding(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 >= confirmations.length) {
      onComplete?.();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading confirmations...
        </p>
      </div>
    );
  }

  if (confirmations.length === 0) {
    return null;
  }

  if (currentIndex >= confirmations.length) {
    return null;
  }

  const currentConfirmation = confirmations[currentIndex];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Progress indicator */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Confirmation {currentIndex + 1} of {confirmations.length}
        </p>
        <div className="mt-2 flex gap-1 justify-center">
          {confirmations.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-construction-blue dark:bg-construction-blue"
                  : index < currentIndex
                    ? "w-4 bg-construction-blue/50 dark:bg-construction-blue/50"
                    : "w-4 bg-gray-300 dark:bg-gray-600",
              )}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          "bg-white dark:bg-gray-800",
          "border-2 border-gray-200 dark:border-gray-700",
          "rounded-lg overflow-hidden shadow-lg",
        )}
      >
        {/* Region image with highlighted border */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
          <Image
            src={currentConfirmation.regionImageUrl}
            alt="Plan region"
            fill
            className="object-contain"
            style={{ borderBottom: "2px solid #001B51" }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question */}
          <h2
            className={cn(
              "text-lg font-semibold text-center",
              "text-gray-900 dark:text-gray-100",
            )}
          >
            {currentConfirmation.question}
          </h2>

          {/* Response buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {currentConfirmation.responseOptions.map((option) => {
              const isDefault = option === currentConfirmation.defaultResponse;

              return (
                <Button
                  key={option}
                  onClick={() => handleResponse(option)}
                  disabled={isResponding}
                  variant={isDefault ? "default" : "outline"}
                  className={cn(
                    "min-h-[44px] flex-1 text-base font-medium",
                    "active:scale-95",
                    isDefault &&
                      "bg-construction-blue hover:bg-construction-blue/90 dark:bg-construction-blue dark:hover:bg-construction-blue/90",
                  )}
                  aria-label={`Select ${option}`}
                >
                  {option}
                </Button>
              );
            })}
          </div>

          {/* Skip button - always visible */}
          <Button
            onClick={handleSkip}
            disabled={isResponding}
            variant="ghost"
            className={cn(
              "w-full min-h-[44px] text-sm",
              "text-gray-600 hover:text-gray-900",
              "dark:text-gray-400 dark:hover:text-gray-100",
              "active:scale-95",
            )}
            aria-label="Skip this confirmation"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
