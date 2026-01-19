"use client";

import { Package, Truck, CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { MaterialsStatusData } from "@/types/dashboard";

export interface MaterialsStatusWidgetProps {
  materials: MaterialsStatusData;
  isLoading?: boolean;
}

function MaterialsStatusWidgetSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="h-5 w-36 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-2" />
            <div className="h-6 w-8 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </WidgetSkeleton>
  );
}

interface PipelineStageProps {
  icon: typeof Package;
  label: string;
  count: number;
  variant: "needed" | "ordered" | "delivered";
}

const stageStyles = {
  needed: {
    bg: "bg-[#F59E0B]/10",
    border: "border-[#F59E0B]/30",
    iconColor: "text-[#F59E0B]",
    countColor: "text-[#F59E0B]",
  },
  ordered: {
    bg: "bg-[#001B51]/10",
    border: "border-[#001B51]/30",
    iconColor: "text-[#001B51]",
    countColor: "text-[#001B51]",
  },
  delivered: {
    bg: "bg-[#059669]/10",
    border: "border-[#059669]/30",
    iconColor: "text-[#059669]",
    countColor: "text-[#059669]",
  },
} as const;

function PipelineStage({
  icon: Icon,
  label,
  count,
  variant,
}: PipelineStageProps) {
  const styles = stageStyles[variant];

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "border-2",
          styles.bg,
          styles.border,
        )}
      >
        <Icon className={cn("w-6 h-6", styles.iconColor)} />
      </div>
      <div className={cn("text-xl font-black mt-2", styles.countColor)}>
        {count}
      </div>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-1">
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  );
}

export function MaterialsStatusWidget({
  materials,
  isLoading = false,
}: MaterialsStatusWidgetProps) {
  if (isLoading) {
    return <MaterialsStatusWidgetSkeleton />;
  }

  return (
    <Link href="/app/materials" className="block h-full">
      <WidgetCard interactive>
        <WidgetHeader
          icon={Package}
          title="Materials"
          right={
            <span className="text-sm font-semibold text-gray-500">
              {materials.total} total
            </span>
          }
          className="mb-6"
        />

        {/* Pipeline Visualization */}
        <div className="flex items-center justify-center">
          <PipelineStage
            icon={Package}
            label="Needed"
            count={materials.needed}
            variant="needed"
          />
          <PipelineArrow />
          <PipelineStage
            icon={Truck}
            label="Ordered"
            count={materials.ordered}
            variant="ordered"
          />
          <PipelineArrow />
          <PipelineStage
            icon={CheckCircle}
            label="Delivered"
            count={materials.delivered}
            variant="delivered"
          />
        </div>

        {/* View All indicator */}
        <div className="flex items-center justify-center mt-6 text-sm text-[#001B51] font-semibold">
          <span>View all materials</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </WidgetCard>
    </Link>
  );
}
