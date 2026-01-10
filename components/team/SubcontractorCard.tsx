'use client';

import { useState, useTransition } from 'react';
import { Database } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  FileText,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { deactivateSubcontractor } from '@/app/actions/subcontractors';
import { EditSubcontractorModal } from './EditSubcontractorModal';

type Subcontractor = Database['public']['Tables']['subcontractors']['Row'];
type TradeType = Database['public']['Enums']['trade_type'];

interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  canManage: boolean;
  isGCAdmin: boolean;
}

// Trade badge color mapping
const TRADE_COLORS: Record<TradeType, string> = {
  electrical: 'bg-blue-600 text-white border-blue-600',
  plumbing: 'bg-blue-500 text-white border-blue-500',
  hvac: 'bg-purple-600 text-white border-purple-600',
  carpentry: 'bg-amber-700 text-white border-amber-700',
  masonry: 'bg-stone-600 text-white border-stone-600',
  roofing: 'bg-red-700 text-white border-red-700',
  flooring: 'bg-orange-600 text-white border-orange-600',
  painting: 'bg-pink-600 text-white border-pink-600',
  drywall: 'bg-gray-500 text-white border-gray-500',
  concrete: 'bg-gray-600 text-white border-gray-600',
  landscaping: 'bg-green-700 text-white border-green-700',
  demolition: 'bg-red-800 text-white border-red-800',
  steel_work: 'bg-slate-700 text-white border-slate-700',
  glass_glazing: 'bg-cyan-600 text-white border-cyan-600',
  fire_protection: 'bg-red-600 text-white border-red-600',
  insulation: 'bg-yellow-700 text-white border-yellow-700',
  general: 'bg-[#001B51] text-white border-[#001B51]',
  other: 'bg-gray-400 text-white border-gray-400',
};

// Trade label formatting
const TRADE_LABELS: Record<TradeType, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  carpentry: 'Carpentry',
  masonry: 'Masonry',
  roofing: 'Roofing',
  flooring: 'Flooring',
  painting: 'Painting',
  drywall: 'Drywall',
  concrete: 'Concrete',
  landscaping: 'Landscaping',
  demolition: 'Demolition',
  steel_work: 'Steel Work',
  glass_glazing: 'Glass & Glazing',
  fire_protection: 'Fire Protection',
  insulation: 'Insulation',
  general: 'General',
  other: 'Other',
};

export function SubcontractorCard({ subcontractor, canManage, isGCAdmin }: SubcontractorCardProps) {
  console.log('[SubcontractorCard] Rendering card for:', subcontractor.company_name);

  const [isPending, startTransition] = useTransition();
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Check if dates are expiring (within 30 days) or expired
  const checkExpiryStatus = (expiryDate: string | null): 'valid' | 'expiring' | 'expired' => {
    if (!expiryDate) return 'valid';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const licenseStatus = checkExpiryStatus(subcontractor.license_expiry);
  const insuranceStatus = checkExpiryStatus(subcontractor.insurance_expiry);

  const handleDeactivate = async () => {
    setDeactivateDialogOpen(false);

    startTransition(async () => {
      const result = await deactivateSubcontractor(subcontractor.id);
      if (result.success) {
        toast.success(result.message);
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
              i <= stars ? 'fill-construction-yellow text-construction-yellow' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium text-gray-700 ml-1">
          {stars > 0 ? stars.toFixed(1) : 'N/A'}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        className={`relative bg-white border-2 rounded-lg p-6 shadow-construction hover:shadow-construction-lg transition-all ${
          subcontractor.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
        }`}
      >
        {/* Inactive overlay */}
        {!subcontractor.is_active && (
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              Inactive
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-black text-construction-blue mb-2 leading-tight">
              {subcontractor.company_name}
            </h3>
            <Badge
              variant="outline"
              className={`${TRADE_COLORS.general} font-semibold border-2`}
            >
              {'General Contractor'}
            </Badge>
          </div>

          {/* Action Menu */}
          {canManage && subcontractor.is_active && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  disabled={isPending}
                  aria-label={`Actions for ${subcontractor.company_name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-bold text-gray-900">Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    console.log('[SubcontractorCard] Opening edit modal for:', subcontractor.id);
                    setEditModalOpen(true);
                  }}
                  disabled={isPending}
                  className="cursor-pointer"
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="p-1 bg-construction-blue/10 rounded">
              <Mail className="h-4 w-4 text-construction-blue" />
            </div>
            <span className="font-medium">{subcontractor.contact_name}</span>
          </div>
          {subcontractor.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1 bg-gray-100 rounded">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span className="truncate">{subcontractor.email}</span>
            </div>
          )}
          {subcontractor.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1 bg-gray-100 rounded">
                <Phone className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span>{subcontractor.phone}</span>
            </div>
          )}
          {subcontractor.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1 bg-gray-100 rounded">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span className="truncate">{subcontractor.address}</span>
            </div>
          )}
        </div>

        {/* Performance Rating */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Performance</div>
          {renderStars(subcontractor.performance_rating)}
        </div>

        {/* Document Status */}
        <div className="space-y-3">
          {/* License Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">License</span>
            </div>
            {licenseStatus === 'valid' && subcontractor.license_number ? (
              <div className="flex items-center gap-1 text-construction-green">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Valid</span>
              </div>
            ) : licenseStatus === 'expiring' ? (
              <div className="flex items-center gap-1 text-construction-yellow">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expiring Soon</span>
              </div>
            ) : licenseStatus === 'expired' ? (
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
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Insurance</span>
            </div>
            {insuranceStatus === 'valid' && subcontractor.insurance_provider ? (
              <div className="flex items-center gap-1 text-construction-green">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold">Valid</span>
              </div>
            ) : insuranceStatus === 'expiring' ? (
              <div className="flex items-center gap-1 text-construction-yellow">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expiring Soon</span>
              </div>
            ) : insuranceStatus === 'expired' ? (
              <div className="flex items-center gap-1 text-construction-red">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-semibold">Expired</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not Provided</span>
            )}
          </div>
        </div>

        {/* Notes Preview */}
        {subcontractor.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</div>
            <p className="text-sm text-gray-600 line-clamp-2">{subcontractor.notes}</p>
          </div>
        )}
      </div>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Subcontractor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {subcontractor.company_name}. They will no longer appear in
              active listings, but their data will be preserved. This action can be reversed by a
              GC Admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Subcontractor Modal */}
      <EditSubcontractorModal
        isOpen={editModalOpen}
        onClose={() => {
          console.log('[SubcontractorCard] Closing edit modal');
          setEditModalOpen(false);
        }}
        subcontractor={subcontractor}
      />
    </>
  );
}
