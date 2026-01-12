'use client';

/**
 * EditSubcontractorModal Component
 * Modal for editing existing subcontractor details
 * Uses updateSubcontractor Server Action for data persistence
 * Construction-themed design matching the GenHub PWA aesthetic
 */

import { useState, useTransition, useEffect, useCallback } from 'react';
import { updateSubcontractor } from '@/app/actions/subcontractors';
import { Database } from '@/types/database.types';
import { formatPhoneNumber } from '@/lib/hooks/usePhoneMask';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Star,
  CheckCircle2,
  XCircle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

type Subcontractor = Database['public']['Tables']['subcontractors']['Row'];
type TradeType = Database['public']['Enums']['trade_type'];

const TRADE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'steel_work', label: 'Steel Work' },
  { value: 'glass_glazing', label: 'Glass & Glazing' },
  { value: 'fire_protection', label: 'Fire Protection' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'other', label: 'Other' },
];

interface EditSubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontractor: Subcontractor;
}

export function EditSubcontractorModal({
  isOpen,
  onClose,
  subcontractor,
}: EditSubcontractorModalProps) {
  console.log('[EditSubcontractorModal] Rendering with subcontractor:', subcontractor.id);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state - pre-populated with existing data
  const [companyName, setCompanyName] = useState(subcontractor.company_name || '');
  const [contactName, setContactName] = useState(subcontractor.contact_name || '');
  const [email, setEmail] = useState(subcontractor.email || '');
  const [phone, setPhone] = useState(
    subcontractor.phone ? formatPhoneNumber(subcontractor.phone) : ''
  );
  const [address, setAddress] = useState(subcontractor.address || '');
  const [selectedTrade, setSelectedTrade] = useState<TradeType>(
    subcontractor.trade_specialization || 'general'
  );
  const [licenseNumber, setLicenseNumber] = useState(subcontractor.license_number || '');
  const [licenseExpiry, setLicenseExpiry] = useState(
    subcontractor.license_expiry ? subcontractor.license_expiry.split('T')[0] : ''
  );
  const [insuranceProvider, setInsuranceProvider] = useState(
    subcontractor.insurance_provider || ''
  );
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    subcontractor.insurance_expiry ? subcontractor.insurance_expiry.split('T')[0] : ''
  );
  const [rating, setRating] = useState(subcontractor.performance_rating || 0);
  const [notes, setNotes] = useState(subcontractor.notes || '');

  // Reset form when subcontractor changes
  useEffect(() => {
    console.log('[EditSubcontractorModal] Resetting form for subcontractor:', subcontractor.id);
    setCompanyName(subcontractor.company_name || '');
    setContactName(subcontractor.contact_name || '');
    setEmail(subcontractor.email || '');
    setPhone(subcontractor.phone ? formatPhoneNumber(subcontractor.phone) : '');
    setAddress(subcontractor.address || '');
    setSelectedTrade(subcontractor.trade_specialization || 'general');
    setLicenseNumber(subcontractor.license_number || '');
    setLicenseExpiry(
      subcontractor.license_expiry ? subcontractor.license_expiry.split('T')[0] : ''
    );
    setInsuranceProvider(subcontractor.insurance_provider || '');
    setInsuranceExpiry(
      subcontractor.insurance_expiry ? subcontractor.insurance_expiry.split('T')[0] : ''
    );
    setRating(subcontractor.performance_rating || 0);
    setNotes(subcontractor.notes || '');
    setError(null);
    setFieldErrors(null);
    setIsSuccess(false);
  }, [subcontractor]);

  const handleClose = useCallback(() => {
    console.log('[EditSubcontractorModal] Closing modal');
    setError(null);
    setFieldErrors(null);
    setIsSuccess(false);
    onClose();
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EditSubcontractorModal] Submitting form for subcontractor:', subcontractor.id);

    setError(null);
    setFieldErrors(null);

    startTransition(async () => {
      try {
        const result = await updateSubcontractor({
          id: subcontractor.id,
          company_name: companyName,
          contact_name: contactName,
          email: email,
          phone: phone || undefined,
          address: address || undefined,
          trade_specialization: selectedTrade,
          license_number: licenseNumber || undefined,
          license_expiry: licenseExpiry || undefined,
          insurance_provider: insuranceProvider || undefined,
          insurance_expiry: insuranceExpiry || undefined,
          performance_rating: rating > 0 ? rating : undefined,
          notes: notes || undefined,
        });

        console.log('[EditSubcontractorModal] Update result:', result);

        if (result.success) {
          setIsSuccess(true);
          toast.success('Subcontractor updated successfully!');

          // Close modal after a short delay
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors as Record<string, string[]>);
          } else {
            setError(result.error || 'Failed to update subcontractor');
          }
          toast.error(result.error || 'Failed to update subcontractor');
        }
      } catch (err) {
        console.error('[EditSubcontractorModal] Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred');
      }
    });
  };

  const isDisabled = isPending || isSuccess;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Pencil}
      title="Edit Subcontractor"
      subtitle={`Update details for ${subcontractor.company_name}`}
      maxWidth="3xl"
      showFooter={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {isSuccess && (
          <Alert className="bg-green-50 border-2 border-green-300 text-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="ml-2 font-semibold">
              Subcontractor updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !fieldErrors && (
          <Alert className="bg-red-50 border-2 border-red-300 text-red-900">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="ml-2 font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Company Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_company_name"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <Building2 className="h-4 w-4 text-construction-blue" />
            Company Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit_company_name"
            type="text"
            placeholder="ABC Construction LLC"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {fieldErrors?.company_name && (
            <p className="text-sm text-red-600 font-medium">{fieldErrors.company_name[0]}</p>
          )}
        </div>

        {/* Trade Specialization - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_trade_specialization"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <FileText className="h-4 w-4 text-construction-blue" />
            Trade Specialization <span className="text-red-600">*</span>
          </Label>
          <Select
            value={selectedTrade}
            onValueChange={(value) => setSelectedTrade(value as TradeType)}
            disabled={isDisabled}
          >
            <SelectTrigger className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue">
              <SelectValue placeholder="Select trade" />
            </SelectTrigger>
            <SelectContent>
              {TRADE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(fieldErrors as any)?.trade_specialization && (
            <p className="text-sm text-red-600 font-medium">
              {(fieldErrors as any).trade_specialization[0]}
            </p>
          )}
        </div>

        {/* Contact Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_contact_name"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <User className="h-4 w-4 text-construction-blue" />
            Contact Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit_contact_name"
            type="text"
            placeholder="John Doe"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {fieldErrors?.contact_name && (
            <p className="text-sm text-red-600 font-medium">{fieldErrors.contact_name[0]}</p>
          )}
        </div>

        {/* Email - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_email"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-construction-blue" />
            Email <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit_email"
            type="email"
            placeholder="john@abcconstruction.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
          {fieldErrors?.email && (
            <p className="text-sm text-red-600 font-medium">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Phone - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_phone"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <Phone className="h-4 w-4 text-construction-blue" />
            Phone
          </Label>
          <Input
            id="edit_phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
          />
        </div>

        {/* Address - Optional */}
        <div className="space-y-2">
          <Label
            htmlFor="edit_address"
            className="text-gray-900 font-semibold flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-construction-blue" />
            Address
          </Label>
          <Textarea
            id="edit_address"
            placeholder="123 Main Street, City, State ZIP"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
          />
        </div>

        {/* License Section */}
        <div className="border-t-2 border-gray-200 pt-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-construction-blue" />
            License Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_license_number" className="text-gray-900 font-semibold">
                License Number
              </Label>
              <Input
                id="edit_license_number"
                type="text"
                placeholder="LIC-123456"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={isDisabled}
                className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_license_expiry" className="text-gray-900 font-semibold">
                Expiry Date
              </Label>
              <Input
                id="edit_license_expiry"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                disabled={isDisabled}
                className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Insurance Section */}
        <div className="border-t-2 border-gray-200 pt-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-construction-blue" />
            Insurance Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_insurance_provider" className="text-gray-900 font-semibold">
                Provider
              </Label>
              <Input
                id="edit_insurance_provider"
                type="text"
                placeholder="ABC Insurance Co."
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                disabled={isDisabled}
                className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_insurance_expiry" className="text-gray-900 font-semibold">
                Expiry Date
              </Label>
              <Input
                id="edit_insurance_expiry"
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                disabled={isDisabled}
                className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="space-y-2">
          <Label className="text-gray-900 font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-construction-blue" />
            Performance Rating
          </Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(rating === i ? 0 : i)}
                disabled={isDisabled}
                className="focus:outline-none focus:ring-2 focus:ring-construction-blue focus:ring-offset-2 rounded-sm disabled:opacity-50"
                aria-label={`Rate ${i} stars`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    i <= rating
                      ? 'fill-construction-yellow text-construction-yellow'
                      : 'text-gray-300 hover:text-construction-yellow'
                  }`}
                />
              </button>
            ))}
            <span className="text-sm text-gray-600 ml-2">
              {rating > 0 ? `${rating}/5` : 'Not rated'}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="edit_notes" className="text-gray-900 font-semibold">
            Notes
          </Label>
          <Textarea
            id="edit_notes"
            placeholder="Any additional notes or comments..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isDisabled}
            className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="border-2 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isDisabled}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
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
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
