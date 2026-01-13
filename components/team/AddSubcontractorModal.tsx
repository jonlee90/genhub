'use client';

import { useState, useActionState, useEffect, useCallback } from 'react';
import { createSubcontractor, uploadSubcontractorDocument } from '@/app/actions/subcontractors';
import type { TradeType } from '@/types/db/enums';
import { formatPhoneNumber, extractPhoneDigits } from '@/lib/hooks/usePhoneMask';
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
  Upload,
  CheckCircle2,
  XCircle,
  HardHat,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddSubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

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

export function AddSubcontractorModal({ isOpen, onClose, companyId }: AddSubcontractorModalProps) {
  const [selectedTrade, setSelectedTrade] = useState<TradeType>('general');
  const [rating, setRating] = useState(0);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');

  // State to capture form metadata for document upload
  const [capturedFormData, setCapturedFormData] = useState<{
    licenseNumber?: string;
    licenseExpiry?: string;
    insuranceProvider?: string;
    insuranceExpiry?: string;
  }>({});

  // Use useActionState hook for form submission
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Capture form data before submission
      setCapturedFormData({
        licenseNumber: formData.get('license_number') as string || undefined,
        licenseExpiry: formData.get('license_expiry') as string || undefined,
        insuranceProvider: formData.get('insurance_provider') as string || undefined,
        insuranceExpiry: formData.get('insurance_expiry') as string || undefined,
      });

      const result = await createSubcontractor(formData);
      return result;
    },
    null
  );

  // Handle successful creation and document upload
  useEffect(() => {
    let isCancelled = false;

    if (state?.success && state?.data) {
      const uploadDocuments = async () => {
        if (isCancelled) return;

        const subcontractorId = state.data.id;
        let uploadErrors = false;

        // Upload license document if provided
        if (licenseFile && !isCancelled) {
          setIsUploadingDocs(true);
          const licenseFormData = new FormData();
          licenseFormData.append('subcontractor_id', subcontractorId);
          licenseFormData.append('document_type', 'license');
          licenseFormData.append('file', licenseFile);

          // Use captured state instead of DOM queries
          if (capturedFormData.licenseNumber) {
            licenseFormData.append('license_number', capturedFormData.licenseNumber);
          }
          if (capturedFormData.licenseExpiry) {
            licenseFormData.append('license_expiry', capturedFormData.licenseExpiry);
          }

          const licenseResult = await uploadSubcontractorDocument(licenseFormData);
          if (!isCancelled && !licenseResult.success) {
            toast.error(`License upload failed: ${licenseResult.error}`);
            uploadErrors = true;
          }
        }

        // Upload insurance document if provided
        if (insuranceFile && !isCancelled) {
          setIsUploadingDocs(true);
          const insuranceFormData = new FormData();
          insuranceFormData.append('subcontractor_id', subcontractorId);
          insuranceFormData.append('document_type', 'insurance');
          insuranceFormData.append('file', insuranceFile);

          // Use captured state instead of DOM queries
          if (capturedFormData.insuranceProvider) {
            insuranceFormData.append('insurance_provider', capturedFormData.insuranceProvider);
          }
          if (capturedFormData.insuranceExpiry) {
            insuranceFormData.append('insurance_expiry', capturedFormData.insuranceExpiry);
          }

          const insuranceResult = await uploadSubcontractorDocument(insuranceFormData);
          if (!isCancelled && !insuranceResult.success) {
            toast.error(`Insurance upload failed: ${insuranceResult.error}`);
            uploadErrors = true;
          }
        }

        if (!isCancelled) {
          setIsUploadingDocs(false);

          // Show success message and close modal
          if (!uploadErrors) {
            toast.success('Subcontractor created successfully!');
          } else {
            toast.warning('Subcontractor created but some documents failed to upload.');
          }

          // Close modal after a short delay
          setTimeout(() => {
            if (!isCancelled) {
              handleClose();
            }
          }, 1500);
        }
      };

      uploadDocuments();
    }

    return () => {
      isCancelled = true;
    };
  }, [state?.success, state?.data, licenseFile, insuranceFile, capturedFormData]);

  const handleClose = useCallback(() => {
    setSelectedTrade('general');
    setRating(0);
    setLicenseFile(null);
    setInsuranceFile(null);
    setIsUploadingDocs(false);
    setPhoneValue('');
    onClose();
  }, [onClose]);

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('License file size must be less than 5MB');
        e.target.value = '';
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('License file must be PDF, JPEG, or PNG');
        e.target.value = '';
        return;
      }
      setLicenseFile(file);
    }
  };

  const handleInsuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Insurance file size must be less than 5MB');
        e.target.value = '';
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Insurance file must be PDF, JPEG, or PNG');
        e.target.value = '';
        return;
      }
      setInsuranceFile(file);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={HardHat}
      title="Add Subcontractor"
      subtitle="Add a new subcontractor to your company directory. Fill in the required fields and upload any relevant documents."
      maxWidth="3xl"
      showFooter={false}
    >
      <form action={formAction} className="space-y-6">
          {/* Success Message */}
          {state?.success && (
            <Alert className="bg-green-50 border-2 border-green-300 text-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="ml-2 font-semibold">{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {state?.error && !state?.fieldErrors && (
            <Alert className="bg-red-50 border-2 border-red-300 text-red-900">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="ml-2 font-semibold">{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Company Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-gray-900 font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-construction-blue" />
              Company Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="company_name"
              name="company_name"
              type="text"
              placeholder="ABC Construction LLC"
              required
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            />
            {state?.fieldErrors?.company_name && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.company_name[0]}</p>
            )}
          </div>

          {/* Trade Specialization - Required */}
          <div className="space-y-2">
            <Label htmlFor="trade_specialization" className="text-gray-900 font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-construction-blue" />
              Trade Specialization <span className="text-red-600">*</span>
            </Label>
            <Select
              value={selectedTrade}
              onValueChange={(value) => setSelectedTrade(value as TradeType)}
              disabled={isPending || state?.success || isUploadingDocs}
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
            {/* Hidden input for form submission - Radix Select doesn't submit values natively */}
            <input type="hidden" name="trade_specialization" value={selectedTrade} />
            {(state?.fieldErrors as any)?.trade_specialization && (
              <p className="text-sm text-red-600 font-medium">
                {(state!.fieldErrors as any).trade_specialization[0]}
              </p>
            )}
          </div>

          {/* Contact Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="contact_name" className="text-gray-900 font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-construction-blue" />
              Contact Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contact_name"
              name="contact_name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            />
            {state?.fieldErrors?.contact_name && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.contact_name[0]}</p>
            )}
          </div>

          {/* Email - Required */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-construction-blue" />
              Email <span className="text-red-600">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@abcconstruction.com"
              required
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Phone - Optional */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-900 font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-construction-blue" />
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneValue}
              onChange={(e) => setPhoneValue(formatPhoneNumber(e.target.value))}
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
            />
          </div>

          {/* Address - Optional */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-900 font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-construction-blue" />
              Address
            </Label>
            <Textarea
              id="address"
              name="address"
              placeholder="123 Main Street, City, State ZIP"
              rows={2}
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
            />
          </div>

          {/* License Section */}
          <div className="border-t-2 border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-construction-blue" />
              License Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number" className="text-gray-900 font-semibold">
                  License Number
                </Label>
                <Input
                  id="license_number"
                  name="license_number"
                  type="text"
                  placeholder="LIC-123456"
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_expiry" className="text-gray-900 font-semibold">
                  Expiry Date
                </Label>
                <Input
                  id="license_expiry"
                  name="license_expiry"
                  type="date"
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_file" className="text-gray-900 font-semibold">
                License Document
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="license_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleLicenseFileChange}
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
                {licenseFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLicenseFile(null)}
                    disabled={isPending || state?.success || isUploadingDocs}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {licenseFile && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <p className="text-xs text-gray-500">PDF, JPEG, or PNG. Max 5MB.</p>
            </div>
          </div>

          {/* Insurance Section */}
          <div className="border-t-2 border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-construction-blue" />
              Insurance Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_provider" className="text-gray-900 font-semibold">
                  Provider
                </Label>
                <Input
                  id="insurance_provider"
                  name="insurance_provider"
                  type="text"
                  placeholder="ABC Insurance Co."
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_expiry" className="text-gray-900 font-semibold">
                  Expiry Date
                </Label>
                <Input
                  id="insurance_expiry"
                  name="insurance_expiry"
                  type="date"
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_file" className="text-gray-900 font-semibold">
                Insurance Document
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="insurance_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleInsuranceFileChange}
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors"
                />
                {insuranceFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInsuranceFile(null)}
                    disabled={isPending || state?.success || isUploadingDocs}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {insuranceFile && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {insuranceFile.name} ({(insuranceFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <p className="text-xs text-gray-500">PDF, JPEG, or PNG. Max 5MB.</p>
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
                  onClick={() => setRating(i)}
                  disabled={isPending || state?.success || isUploadingDocs}
                  className="focus:outline-none"
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
            <input type="hidden" name="performance_rating" value={rating} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-900 font-semibold">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes or comments..."
              rows={3}
              disabled={isPending || state?.success || isUploadingDocs}
              className="border-2 border-gray-300 focus:border-construction-blue focus:ring-construction-blue transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending || isUploadingDocs}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || state?.success || isUploadingDocs}
              className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : isUploadingDocs ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading Documents...
                </>
              ) : state?.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Created!
                </>
              ) : (
                'Add Subcontractor'
              )}
            </Button>
          </div>
        </form>
    </BaseModal>
  );
}
