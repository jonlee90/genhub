"use client";

import { useState, useTransition } from "react";
import type { SubcontractorsRow } from "@/types/db/tables/companies";
import type { TradeType } from "@/types/db/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MoreVertical from "lucide-react/icons/more-vertical";
import Phone from "lucide-react/icons/phone";
import Mail from "lucide-react/icons/mail";
import MapPin from "lucide-react/icons/map-pin";
import Star from "lucide-react/icons/star";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import Edit from "lucide-react/icons/edit";
import Trash2 from "lucide-react/icons/trash-2";
import RotateCcw from "lucide-react/icons/rotate-ccw";
import FileText from "lucide-react/icons/file-text";
import Shield from "lucide-react/icons/shield";
import { toast } from "sonner";
import {
  deactivateSubcontractor,
  reactivateSubcontractor,
  deleteSubcontractor,
} from "@/app/actions/subcontractors";

type Subcontractor = SubcontractorsRow;

interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  canManage: boolean;
  isGCAdmin: boolean;
  onEdit: (subcontractor: Subcontractor) => void;
  onDeactivate?: () => void;
}

// Trade badge color mapping
const TRADE_COLORS: Record<TradeType, string> = {
  electrical: "bg-blue-600 text-white border-blue-600",
  plumbing: "bg-blue-500 text-white border-blue-500",
  hvac: "bg-purple-600 text-white border-purple-600",
  carpentry: "bg-amber-700 text-white border-amber-700",
  masonry: "bg-stone-600 text-white border-stone-600",
  roofing: "bg-red-700 text-white border-red-700",
  flooring: "bg-orange-600 text-white border-orange-600",
  painting: "bg-pink-600 text-white border-pink-600",
  drywall: "bg-gray-500 text-white border-gray-500",
  concrete: "bg-gray-600 text-white border-gray-600",
  landscaping: "bg-green-700 text-white border-green-700",
  demolition: "bg-red-800 text-white border-red-800",
  steel_work: "bg-slate-700 text-white border-slate-700",
  glass_glazing: "bg-cyan-600 text-white border-cyan-600",
  fire_protection: "bg-red-600 text-white border-red-600",
  insulation: "bg-yellow-700 text-white border-yellow-700",
  framing: "bg-amber-600 text-white border-amber-600",
  general: "bg-construction-blue text-white border-construction-blue",
  other: "bg-gray-400 text-white border-gray-400",
};

// Trade label formatting
const TRADE_LABELS: Record<TradeType, string> = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  hvac: "HVAC",
  carpentry: "Carpentry",
  masonry: "Masonry",
  roofing: "Roofing",
  flooring: "Flooring",
  painting: "Painting",
  drywall: "Drywall",
  concrete: "Concrete",
  landscaping: "Landscaping",
  demolition: "Demolition",
  steel_work: "Steel Work",
  glass_glazing: "Glass & Glazing",
  fire_protection: "Fire Protection",
  insulation: "Insulation",
  framing: "Framing",
  general: "General",
  other: "Other",
};

export function SubcontractorCard({
  subcontractor,
  canManage,
  isGCAdmin,
  onEdit,
  onDeactivate,
}: SubcontractorCardProps) {
  const [isPending, startTransition] = useTransition();
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if dates are expiring (within 30 days) or expired
  const checkExpiryStatus = (
    expiryDate: string | null,
  ): "valid" | "expiring" | "expired" => {
    if (!expiryDate) return "valid";
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring";
    return "valid";
  };

  const licenseStatus = checkExpiryStatus(subcontractor.license_expiry);
  const insuranceStatus = checkExpiryStatus(subcontractor.insurance_expiry);

  const handleDeactivate = async () => {
    setDeactivateDialogOpen(false);

    startTransition(async () => {
      const result = await deactivateSubcontractor(subcontractor.id);
      if (result.success) {
        toast.success(result.message);
        onDeactivate?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReactivate = async () => {
    startTransition(async () => {
      const result = await reactivateSubcontractor(subcontractor.id);
      if (result.success) {
        toast.success(result.message);
        onDeactivate?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handlePermanentDelete = async () => {
    setDeleteDialogOpen(false);

    startTransition(async () => {
      const result = await deleteSubcontractor(subcontractor.id);
      if (result.success) {
        toast.success(result.message);
        onDeactivate?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Render star rating
  const renderStars = (rating: number | null) => {
    const stars = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i <= stars
                ? "fill-construction-yellow text-construction-yellow"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
          {stars > 0 ? stars.toFixed(1) : "N/A"}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        className={`relative bg-white dark:bg-gray-800 border-2 rounded-lg p-6 shadow-construction hover:shadow-construction-lg transition-all ${
          subcontractor.is_active
            ? "border-gray-200 dark:border-gray-700"
            : "border-gray-300 dark:border-gray-600 opacity-60"
        }`}
      >
        {/* Inactive overlay */}
        {!subcontractor.is_active && (
          <div className="absolute top-4 right-4">
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-800 border-gray-300"
            >
              Inactive
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-black text-construction-blue dark:text-blue-400 mb-2 leading-tight">
              {subcontractor.company_name}
            </h3>
            <Badge
              variant="outline"
              className={`${TRADE_COLORS[subcontractor.trade_specialization || "general"]} font-semibold border-2`}
            >
              {TRADE_LABELS[subcontractor.trade_specialization || "general"]}
            </Badge>
          </div>

          {/* Action Menu - Show for active (canManage) or inactive (isGCAdmin) */}
          {(canManage && subcontractor.is_active) ||
          (isGCAdmin && !subcontractor.is_active) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={isPending}
                  aria-label={`Actions for ${subcontractor.company_name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-bold text-gray-900 dark:text-gray-100">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Active subcontractor actions */}
                {subcontractor.is_active ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit(subcontractor)}
                      disabled={isPending}
                      className="cursor-pointer min-h-[44px]"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    {isGCAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeactivateDialogOpen(true)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                ) : (
                  /* Inactive subcontractor actions (admin only) */
                  <>
                    <DropdownMenuItem
                      onClick={handleReactivate}
                      disabled={isPending}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 cursor-pointer min-h-[44px]"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reactivate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Permanently Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="p-1 bg-construction-blue/10 dark:bg-blue-900/30 rounded">
              <Mail className="h-4 w-4 text-construction-blue dark:text-blue-400" />
            </div>
            <span className="font-medium">{subcontractor.contact_name}</span>
          </div>
          {subcontractor.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1 bg-gray-100 dark:bg-gray-750 rounded">
                <Mail className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="truncate">{subcontractor.email}</span>
            </div>
          )}
          {subcontractor.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1 bg-gray-100 dark:bg-gray-750 rounded">
                <Phone className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <span>{subcontractor.phone}</span>
            </div>
          )}
          {subcontractor.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1 bg-gray-100 dark:bg-gray-750 rounded">
                <MapPin className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="truncate">{subcontractor.address}</span>
            </div>
          )}
        </div>

        {/* Performance Rating */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Performance
          </div>
          {renderStars(subcontractor.performance_rating)}
        </div>

        {/* Document Status */}
        <div className="space-y-3">
          {/* License Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                License
              </span>
            </div>
            {licenseStatus === "valid" && subcontractor.license_number ? (
              <div className="flex items-center gap-1 text-construction-green">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Valid</span>
              </div>
            ) : licenseStatus === "expiring" ? (
              <div className="flex items-center gap-1 text-construction-yellow">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expiring Soon</span>
              </div>
            ) : licenseStatus === "expired" ? (
              <div className="flex items-center gap-1 text-construction-red">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expired</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not Provided</span>
            )}
          </div>

          {/* Insurance Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Insurance
              </span>
            </div>
            {insuranceStatus === "valid" && subcontractor.insurance_provider ? (
              <div className="flex items-center gap-1 text-construction-green">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Valid</span>
              </div>
            ) : insuranceStatus === "expiring" ? (
              <div className="flex items-center gap-1 text-construction-yellow">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expiring Soon</span>
              </div>
            ) : insuranceStatus === "expired" ? (
              <div className="flex items-center gap-1 text-construction-red">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expired</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not Provided</span>
            )}
          </div>

          {/* Certificate of Insurance */}
          {subcontractor.certificate_of_insurance ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  COI
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(subcontractor.certificate_of_insurance!, "_blank")
                }
                className="text-xs font-semibold text-construction-blue hover:text-construction-blue/80 hover:bg-construction-blue/10 min-h-[44px] px-3"
              >
                View COI
              </Button>
            </div>
          ) : null}
        </div>

        {/* Notes Preview */}
        {subcontractor.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Notes
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {subcontractor.notes}
            </p>
          </div>
        )}
      </div>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Subcontractor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {subcontractor.company_name}. They will no
              longer appear in active listings, but their data will be
              preserved. This action can be reversed by a GC Admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Permanently Delete Subcontractor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {subcontractor.company_name} and all
              their data.
              <span className="block mt-2 font-semibold text-red-600">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
