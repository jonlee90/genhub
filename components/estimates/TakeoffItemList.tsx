"use client";

import { TakeoffItemRow } from "@/components/estimates/TakeoffItemRow";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type TakeoffItemListProps = {
  items: TakeoffItem[];
  onItemClick: (item: TakeoffItem) => void;
  onAccept: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onEdit: (item: TakeoffItem) => void;
};

export function TakeoffItemList({
  items,
  onItemClick,
  onAccept,
  onReject,
  onEdit,
}: TakeoffItemListProps) {
  // Simple list for now (grouping by page would require joining with plan_pages)
  return (
    <div className="space-y-2 overflow-y-auto" data-testid="takeoff-item-list">
      {items.map((item) => (
        <TakeoffItemRow
          key={item.id}
          item={item}
          onAccept={onAccept}
          onReject={onReject}
          onEdit={onEdit}
          onTap={onItemClick}
          data-testid={`takeoff-item-${item.id}`}
        />
      ))}
    </div>
  );
}
