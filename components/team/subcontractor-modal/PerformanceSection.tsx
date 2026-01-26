"use client";

/**
 * PerformanceSection Component
 * Section for star rating selector with 44px touch targets
 */

import { Label } from "@/components/ui/label";
import Star from "lucide-react/icons/star";

interface PerformanceSectionProps {
  rating: number;
  setValue: any;
  errors: any;
  disabled: boolean;
}

export function PerformanceSection({
  rating,
  setValue,
  errors,
  disabled,
}: PerformanceSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
        Performance Rating
      </h4>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setValue("rating", rating === i ? 0 : i)}
              disabled={disabled}
              className="focus:outline-none focus:ring-2 focus:ring-construction-blue focus:ring-offset-2 rounded-sm disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform"
              aria-label={`Rate ${i} stars`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  i <= rating
                    ? "fill-construction-yellow text-construction-yellow"
                    : "text-gray-300 dark:text-gray-600 hover:text-construction-yellow"
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            {rating > 0 ? `${rating}/5` : "Not rated"}
          </span>
        </div>
        {errors.rating && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.rating.message}
          </p>
        )}
      </div>
    </div>
  );
}
