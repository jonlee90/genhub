'use client';

import { useActionState, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createProject } from '@/app/actions/projects';
import { getPhaseTemplates } from '@/app/actions/phase-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StateSelect } from '@/components/ui/StateSelect';
import {
  AlertCircle,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  FolderKanban,
  FileText,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Building2,
  Home,
  UtensilsCrossed,
  Coffee,
  Factory,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhoneNumber, extractPhoneDigits } from '@/lib/hooks/usePhoneMask';
import { BaseModal } from '@/components/ui/BaseModal';
import type { PhaseTemplatesRow } from '@/types/db/tables/projects';

type PhaseTemplate = PhaseTemplatesRow;

const PROJECT_TYPES = [
  {
    value: 'residential',
    label: 'Residential',
    icon: Home,
    description: 'Single-family homes, apartments, condos',
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    icon: UtensilsCrossed,
    description: 'Full-service restaurants, dining establishments',
  },
  {
    value: 'cafe',
    label: 'Cafe',
    icon: Coffee,
    description: 'Coffee shops, cafes, small eateries',
  },
  {
    value: 'commercial_office',
    label: 'Commercial Office',
    icon: Building2,
    description: 'Office buildings, retail spaces',
  },
  {
    value: 'industrial',
    label: 'Industrial',
    icon: Factory,
    description: 'Warehouses, factories, manufacturing',
  },
];

// Form steps configuration
const formSteps = [
  { id: 'type', label: 'Type' },
  { id: 'details', label: 'Details' },
  { id: 'location', label: 'Location' },
  { id: 'timeline', label: 'Timeline' },
];

type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  project?: any;
};

// Client-side validation errors
type ValidationErrors = {
  name?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  address?: string;
  zip_code?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
};

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
  isModal?: boolean;
}

export function CreateProjectForm({
  isOpen,
  onClose,
  onSuccess,
  isModal = false
}: CreateProjectFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [projectType, setProjectType] = useState<string>('residential');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState(false);

  // Debug: Phase template preview state
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([]);
  const [phaseTemplatesLoading, setPhaseTemplatesLoading] = useState(false);
  const [showPhasePreview, setShowPhasePreview] = useState(false);

  // Track all form values across steps
  const [formValues, setFormValues] = useState({
    project_type: 'residential',
    name: '',
    description: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    start_date: '',
    end_date: '',
    budget: '',
  });

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const result = await createProject(formData);
      return result as FormState;
    },
    {}
  );

  console.log('[CreateProjectForm] Rendering:', { isOpen, currentStep, projectType });

  // Handle success - redirect or callback
  useEffect(() => {
    if (state.success && state.project) {
      console.log('[CreateProjectForm] Project created successfully:', state.project.id);
      setSuccess(true);

      setTimeout(() => {
        if (isModal && onSuccess) {
          console.log('[CreateProjectForm] Modal mode - calling onSuccess callback');
          onSuccess(state.project.id);
        } else {
          console.log('[CreateProjectForm] Page mode - redirecting to project detail');
          router.push(`/app/projects/${state.project.id}`);
        }
      }, 500);
    }
  }, [state.success, state.project, router, isModal, onSuccess]);

  // ============================================
  // Validation Functions (same as before)
  // ============================================

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined;
    const digits = extractPhoneDigits(phone);
    if (digits.length > 0 && digits.length !== 10) {
      return 'Phone number must be 10 digits';
    }
    return undefined;
  };

  const validateZipCode = (zip: string): string | undefined => {
    if (!zip) return undefined;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip)) {
      return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }
    return undefined;
  };

  const validateBudget = (budget: string): string | undefined => {
    if (!budget) return undefined;
    const num = parseFloat(budget);
    if (isNaN(num)) {
      return 'Budget must be a valid number';
    }
    if (num < 0) {
      return 'Budget must be a positive number';
    }
    return undefined;
  };

  const validateEndDate = (startDate: string, endDate: string): string | undefined => {
    if (!endDate || !startDate) return undefined;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return 'End date must be after start date';
    }
    return undefined;
  };

  const validateField = (fieldName: string, value: string): string | undefined => {
    console.log('[CreateProjectForm] Validating field:', fieldName, value);

    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Project name is required';
        }
        if (value.length > 200) {
          return 'Project name must be less than 200 characters';
        }
        return undefined;

      case 'client_name':
        if (!value || value.trim().length === 0) {
          return 'Client name is required';
        }
        if (value.length > 200) {
          return 'Client name must be less than 200 characters';
        }
        return undefined;

      case 'client_email':
        return validateEmail(value);

      case 'client_phone':
        return validatePhone(value);

      case 'address':
        if (!value || value.trim().length === 0) {
          return 'Address is required';
        }
        return undefined;

      case 'zip_code':
        return validateZipCode(value);

      case 'start_date':
        if (!value) {
          return 'Start date is required';
        }
        return undefined;

      case 'end_date':
        return validateEndDate(formValues.start_date, value);

      case 'budget':
        return validateBudget(value);

      default:
        return undefined;
    }
  };

  const validateCurrentStep = (): boolean => {
    console.log('[CreateProjectForm] Validating step:', currentStep);

    const errors: ValidationErrors = {};
    let hasErrors = false;

    // Step 1: Project Details
    if (currentStep === 1) {
      const nameError = validateField('name', formValues.name);
      if (nameError) {
        errors.name = nameError;
        hasErrors = true;
      }

      const clientNameError = validateField('client_name', formValues.client_name);
      if (clientNameError) {
        errors.client_name = clientNameError;
        hasErrors = true;
      }

      const emailError = validateField('client_email', formValues.client_email);
      if (emailError) {
        errors.client_email = emailError;
        hasErrors = true;
      }

      const phoneError = validateField('client_phone', formValues.client_phone);
      if (phoneError) {
        errors.client_phone = phoneError;
        hasErrors = true;
      }
    }

    // Step 2: Location
    if (currentStep === 2) {
      const addressError = validateField('address', formValues.address);
      if (addressError) {
        errors.address = addressError;
        hasErrors = true;
      }

      const zipError = validateField('zip_code', formValues.zip_code);
      if (zipError) {
        errors.zip_code = zipError;
        hasErrors = true;
      }
    }

    // Step 3: Timeline & Budget
    if (currentStep === 3) {
      const startDateError = validateField('start_date', formValues.start_date);
      if (startDateError) {
        errors.start_date = startDateError;
        hasErrors = true;
      }

      const endDateError = validateField('end_date', formValues.end_date);
      if (endDateError) {
        errors.end_date = endDateError;
        hasErrors = true;
      }

      const budgetError = validateField('budget', formValues.budget);
      if (budgetError) {
        errors.budget = budgetError;
        hasErrors = true;
      }
    }

    setValidationErrors(errors);
    console.log('[CreateProjectForm] Validation result:', { hasErrors, errors });
    return !hasErrors;
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    console.log('[CreateProjectForm] Field blur:', fieldName);
    setTouchedFields(prev => new Set(prev).add(fieldName));
    const error = validateField(fieldName, value);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[CreateProjectForm] Attempting to proceed to next step from:', currentStep);

    const isValid = validateCurrentStep();

    if (!isValid) {
      console.log('[CreateProjectForm] Validation failed, staying on current step');
      return;
    }

    if (currentStep < formSteps.length - 1) {
      const form = e.currentTarget.closest('form');
      if (form) {
        const formData = new FormData(form);
        const newValues = { ...formValues };
        formData.forEach((value, key) => {
          newValues[key as keyof typeof formValues] = value as string;
        });
        setFormValues(newValues);
      }

      console.log('[CreateProjectForm] Validation passed, proceeding to next step');
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setValidationErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('[CreateProjectForm] Form submission attempted');

    const isValid = validateCurrentStep();

    if (!isValid) {
      console.log('[CreateProjectForm] Final validation failed, preventing submission');
      e.preventDefault();
      return;
    }

    console.log('[CreateProjectForm] Final validation passed, submitting form');
  };

  // Fetch phase templates when project type changes
  useEffect(() => {
    const fetchPhaseTemplates = async () => {
      if (!formValues.project_type) {
        console.log('[CreateProjectForm] No project type selected, skipping phase template fetch');
        return;
      }

      console.log('[CreateProjectForm] Fetching phase templates for project type:', formValues.project_type);
      setPhaseTemplatesLoading(true);

      try {
        const result = await getPhaseTemplates();

        if (result.success && result.phaseTemplates) {
          setPhaseTemplates(result.phaseTemplates);
          console.log('[CreateProjectForm] Loaded', result.phaseTemplates.length, 'phase templates');
        } else {
          console.warn('[CreateProjectForm] Failed to fetch phase templates:', result.error);
          setPhaseTemplates([]);
        }
      } catch (error) {
        console.error('[CreateProjectForm] Error fetching phase templates:', error);
        setPhaseTemplates([]);
      } finally {
        setPhaseTemplatesLoading(false);
      }
    };

    fetchPhaseTemplates();
  }, [formValues.project_type]);

  const handleProjectTypeChange = (value: string) => {
    setProjectType(value);
    setFormValues({ ...formValues, project_type: value });
  };

  // Generate step indicator badges
  const stepBadges = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        {formSteps.map((step, idx) => (
          <div
            key={step.id}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
              idx === currentStep
                ? 'bg-construction-blue text-white'
                : idx < currentStep
                ? 'bg-construction-green text-white'
                : 'bg-gray-200 text-gray-500'
            )}
          >
            {idx + 1}. {step.label}
          </div>
        ))}
      </div>
    );
  }, [currentStep]);

  // Modal title based on current step
  const modalTitle = useMemo(() => {
    const titles = [
      'Select Project Type',
      'Enter Project Details',
      'Set Project Location',
      'Define Timeline & Budget',
    ];
    return titles[currentStep] || 'Create New Project';
  }, [currentStep]);

  const modalSubtitle = useMemo(() => {
    const subtitles = [
      'Choose the type of construction project',
      'Provide essential information about your project',
      'Specify where this construction project will take place',
      'Set your project timeline and budget expectations',
    ];
    return subtitles[currentStep];
  }, [currentStep]);

  // Note: Do NOT return null when !isOpen
  // BaseModal handles visibility internally via Radix Dialog
  // This component must always render to allow Dialog state management

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={FolderKanban}
      title={modalTitle}
      subtitle={modalSubtitle}
      badges={stepBadges}
      theme="default"
      maxWidth="4xl"
      formKey={`create-project-step-${currentStep}`}
      closeOnBackdropClick={false}
      closeOnEscape={true}
      leftActions={
        currentStep > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrevious}
            disabled={isPending}
            className="h-10 px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : null
      }
      rightActions={
        currentStep < formSteps.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-construction-blue/90"
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            form="project-form"
            disabled={isPending}
            className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-construction-blue/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </>
            )}
          </Button>
        )
      }
    >
      <form id="project-form" action={formAction} onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{state.error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Project created successfully!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden inputs to preserve form values across steps */}
          {currentStep > 0 && (
            <input type="hidden" name="project_type" value={formValues.project_type} />
          )}
          {currentStep > 1 && (
            <>
              <input type="hidden" name="name" value={formValues.name} />
              <input type="hidden" name="description" value={formValues.description} />
              <input type="hidden" name="client_name" value={formValues.client_name} />
              <input type="hidden" name="client_email" value={formValues.client_email} />
              <input type="hidden" name="client_phone" value={formValues.client_phone} />
            </>
          )}
          {currentStep > 2 && (
            <>
              <input type="hidden" name="address" value={formValues.address} />
              <input type="hidden" name="city" value={formValues.city} />
              <input type="hidden" name="state" value={formValues.state} />
              <input type="hidden" name="zip_code" value={formValues.zip_code} />
            </>
          )}

          {/* Step 0: Project Type Selection */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <input type="hidden" name="project_type" value={projectType} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROJECT_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  const isSelected = projectType === type.value;

                  return (
                    <motion.button
                      key={type.value}
                      type="button"
                      onClick={() => handleProjectTypeChange(type.value)}
                      className={cn(
                        'relative p-5 rounded-xl border-2 transition-all duration-200 text-left',
                        isSelected
                          ? 'border-construction-blue bg-construction-blue/5 shadow-md'
                          : 'border-gray-200 hover:border-construction-blue/50 hover:bg-gray-50'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'mb-3 flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                        isSelected
                          ? 'bg-construction-blue'
                          : 'bg-construction-blue/10'
                      )}>
                        <TypeIcon className={cn(
                          'w-6 h-6 transition-colors',
                          isSelected ? 'text-white' : 'text-construction-blue'
                        )} />
                      </div>

                      <h3 className="font-bold text-base text-gray-900 mb-1">{type.label}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{type.description}</p>

                      {isSelected && (
                        <motion.div
                          className="absolute -top-2 -right-2 w-7 h-7 bg-construction-blue rounded-full flex items-center justify-center shadow-md"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Phase Preview Section */}
              {phaseTemplates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-gray-200"
                >
                  <button
                    type="button"
                    onClick={() => setShowPhasePreview(!showPhasePreview)}
                    className="flex items-center gap-2 mb-3 text-construction-blue hover:text-blue-700 transition-colors font-semibold text-sm"
                  >
                    {showPhasePreview ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Layers className="h-4 w-4" />
                    <span>Phase Preview</span>
                    <span className="ml-auto px-2 py-0.5 bg-construction-blue/10 text-construction-blue rounded-full text-xs font-semibold">
                      {phaseTemplates.length} phases
                    </span>
                  </button>

                  <AnimatePresence>
                    {showPhasePreview && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        {phaseTemplates.map((template, index) => (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-2 p-2 bg-construction-blue/5 border-l-2 border-construction-blue rounded text-xs"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-construction-blue text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-900">{template.name}</span>
                            <Check className="ml-auto h-3 w-3 text-construction-green" />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-construction-blue" />
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Smith Residence Renovation"
                  required
                  disabled={isPending}
                  className={cn(
                    'h-11 border-gray-200',
                    touchedFields.has('name') && validationErrors.name && 'border-red-500'
                  )}
                  defaultValue={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  onBlur={(e) => handleFieldBlur('name', e.target.value)}
                />
                {touchedFields.has('name') && validationErrors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the project scope..."
                  rows={3}
                  disabled={isPending}
                  className="border-gray-200 resize-none"
                  defaultValue={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                />
              </div>

              {/* Client Information */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-construction-blue" />
                  Client Information
                </h4>
                <div className="space-y-4">
                  {/* Client Name */}
                  <div className="space-y-2">
                    <Label htmlFor="client_name" className="text-sm font-semibold text-gray-700">
                      Client Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      placeholder="e.g., John Smith"
                      required
                      disabled={isPending}
                      className={cn(
                        'h-11 border-gray-200',
                        touchedFields.has('client_name') && validationErrors.client_name && 'border-red-500'
                      )}
                      defaultValue={formValues.client_name}
                      onChange={(e) => setFormValues({ ...formValues, client_name: e.target.value })}
                      onBlur={(e) => handleFieldBlur('client_name', e.target.value)}
                    />
                    {touchedFields.has('client_name') && validationErrors.client_name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors.client_name}
                      </p>
                    )}
                  </div>

                  {/* Client Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_email" className="text-sm font-semibold text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="client_email"
                        name="client_email"
                        type="email"
                        placeholder="client@example.com"
                        disabled={isPending}
                        className={cn(
                          'h-11 border-gray-200',
                          touchedFields.has('client_email') && validationErrors.client_email && 'border-red-500'
                        )}
                        defaultValue={formValues.client_email}
                        onChange={(e) => setFormValues({ ...formValues, client_email: e.target.value })}
                        onBlur={(e) => handleFieldBlur('client_email', e.target.value)}
                      />
                      {touchedFields.has('client_email') && validationErrors.client_email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.client_email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_phone" className="text-sm font-semibold text-gray-700">
                        Phone
                      </Label>
                      <Input
                        id="client_phone"
                        name="client_phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        disabled={isPending}
                        className={cn(
                          'h-11 border-gray-200',
                          touchedFields.has('client_phone') && validationErrors.client_phone && 'border-red-500'
                        )}
                        value={formValues.client_phone}
                        onChange={(e) => setFormValues({ ...formValues, client_phone: formatPhoneNumber(e.target.value) })}
                        onBlur={(e) => handleFieldBlur('client_phone', e.target.value)}
                      />
                      {touchedFields.has('client_phone') && validationErrors.client_phone && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.client_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  required
                  disabled={isPending}
                  className={cn(
                    'h-11 border-gray-200',
                    touchedFields.has('address') && validationErrors.address && 'border-red-500'
                  )}
                  defaultValue={formValues.address}
                  onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
                  onBlur={(e) => handleFieldBlur('address', e.target.value)}
                />
                {touchedFields.has('address') && validationErrors.address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.address}
                  </p>
                )}
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    disabled={isPending}
                    className="h-11 border-gray-200"
                    defaultValue={formValues.city}
                    onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                    State
                  </Label>
                  <StateSelect
                    id="state"
                    name="state"
                    placeholder="Select state"
                    disabled={isPending}
                    value={formValues.state}
                    onValueChange={(value) => setFormValues({ ...formValues, state: value })}
                  />
                </div>
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-sm font-semibold text-gray-700">
                  ZIP Code
                </Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  placeholder="12345"
                  disabled={isPending}
                  className={cn(
                    'h-11 border-gray-200',
                    touchedFields.has('zip_code') && validationErrors.zip_code && 'border-red-500'
                  )}
                  defaultValue={formValues.zip_code}
                  onChange={(e) => setFormValues({ ...formValues, zip_code: e.target.value })}
                  onBlur={(e) => handleFieldBlur('zip_code', e.target.value)}
                />
                {touchedFields.has('zip_code') && validationErrors.zip_code && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.zip_code}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Timeline & Budget */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Start & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    disabled={isPending}
                    className={cn(
                      'h-11 border-gray-200',
                      touchedFields.has('start_date') && validationErrors.start_date && 'border-red-500'
                    )}
                    defaultValue={formValues.start_date}
                    onChange={(e) => setFormValues({ ...formValues, start_date: e.target.value })}
                    onBlur={(e) => handleFieldBlur('start_date', e.target.value)}
                  />
                  {touchedFields.has('start_date') && validationErrors.start_date && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Expected End Date
                  </Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    disabled={isPending}
                    className={cn(
                      'h-11 border-gray-200',
                      touchedFields.has('end_date') && validationErrors.end_date && 'border-red-500'
                    )}
                    defaultValue={formValues.end_date}
                    onChange={(e) => setFormValues({ ...formValues, end_date: e.target.value })}
                    onBlur={(e) => handleFieldBlur('end_date', e.target.value)}
                  />
                  {touchedFields.has('end_date') && validationErrors.end_date && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  Budget ($)
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000.00"
                  disabled={isPending}
                  className={cn(
                    'h-11 border-gray-200',
                    touchedFields.has('budget') && validationErrors.budget && 'border-red-500'
                  )}
                  defaultValue={formValues.budget}
                  onChange={(e) => setFormValues({ ...formValues, budget: e.target.value })}
                  onBlur={(e) => handleFieldBlur('budget', e.target.value)}
                />
                {touchedFields.has('budget') && validationErrors.budget && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.budget}
                  </p>
                )}
              </div>

              {/* Ready to Create Banner */}
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-construction-blue/5 border border-construction-blue/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-construction-blue rounded-lg shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-construction-blue mb-1">Ready to Create!</h4>
                      <p className="text-sm text-gray-600">
                        Click "Create Project" to start your construction journey with automatic phase creation and health tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
