"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/estimates/ConfidenceBadge";
import { ConstructionStatusBadge } from "@/components/estimates/ConstructionStatusBadge";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Pencil from "lucide-react/icons/pencil";
import Hammer from "lucide-react/icons/hammer";
import { cn } from "@/lib/utils";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type TakeoffItemRowProps = {
  item: TakeoffItem;
  onAccept: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onEdit: (item: TakeoffItem) => void;
  onTap: (item: TakeoffItem) => void;
};

export const TakeoffItemRow = memo(function TakeoffItemRow({
  item,
  onAccept,
  onReject,
  onEdit,
  onTap,
}: TakeoffItemRowProps) {
  const getStatusStyles = () => {
    switch (item.review_status) {
      case "accepted":
        return "border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-900/40";
      case "rejected":
        return "border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40 line-through opacity-60";
      case "edited":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/40";
      default:
        return "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700";
    }
  };

  return (
    <div
      onClick={() => onTap(item)}
      className={cn(
        "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]",
        getStatusStyles(),
        item.needs_review && "ring-2 ring-yellow-500",
      )}
      data-testid="takeoff-item"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Item info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center flex-shrink-0">
            <Hammer className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {item.sub_type}
              </h4>
              <ConfidenceBadge confidence={item.confidence} />
              <ConstructionStatusBadge
                status={
                  (
                    item as typeof item & {
                      construction_status?:
                        | "new"
                        | "existing_to_remain"
                        | "demolition"
                        | null;
                    }
                  ).construction_status
                }
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                {item.quantity} {item.unit}
              </span>
              {item.trade ? (
                <Badge
                  variant="outline"
                  className="text-xs dark:border-gray-600 dark:text-gray-300"
                >
                  {item.trade}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {item.review_status === "pending" && (
          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onAccept(item.id);
              }}
              className="min-h-[44px] min-w-[44px] text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/30 dark:active:bg-green-950/50"
              aria-label="Accept takeoff item"
            >
              <Check className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onReject(item.id);
              }}
              className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/30 dark:active:bg-red-950/50"
              aria-label="Reject takeoff item"
            >
              <X className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="min-h-[44px] min-w-[44px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:active:bg-blue-950/50"
              aria-label="Edit takeoff item"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
