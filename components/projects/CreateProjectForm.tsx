'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Home, UtensilsCrossed, Coffee, Factory, AlertCircle, MapPin, DollarSign, Calendar, Users, HardHat, FileText, Check } from 'lucide-react';
import { Stepper } from '@/components/ui/aceternity/stepper';
import { TextGenerateEffect } from '@/components/ui/aceternity/text-generate-effect';
import { cn } from '@/lib/utils';
import { formatPhoneNumber, extractPhoneDigits } from '@/lib/hooks/usePhoneMask';

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
  {
    id: 'type',
    label: 'Project Type',
    icon: <HardHat className="w-6 h-6" />,
    title: 'Select Your Project Type',
    description: 'Choose the type of construction project you\'re planning to start.',
  },
  {
    id: 'details',
    label: 'Details',
    icon: <FileText className="w-6 h-6" />,
    title: 'Enter Project Details',
    description: 'Provide essential information about your project including name and client details.',
  },
  {
    id: 'location',
    label: 'Location',
    icon: <MapPin className="w-6 h-6" />,
    title: 'Project Location',
    description: 'Specify where this construction project will take place.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <Calendar className="w-6 h-6" />,
    title: 'Set Timeline and Budget',
    description: 'Define your project timeline and budget expectations.',
  },
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

export function CreateProjectForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [projectType, setProjectType] = useState<string>('residential');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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

  // Redirect on success
  useEffect(() => {
    if (state.success && state.project) {
      const timer = setTimeout(() => {
        router.push(`/app/projects/${state.project.id}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.project, router]);

  const currentStepData = formSteps[currentStep];

  // ============================================
  // Validation Functions
  // ============================================

  /**
   * Validate email format
   */
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  /**
   * Validate phone number (must be 10 digits when formatted)
   */
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined; // Phone is optional
    const digits = extractPhoneDigits(phone);
    if (digits.length > 0 && digits.length !== 10) {
      return 'Phone number must be 10 digits';
    }
    return undefined;
  };

  /**
   * Validate ZIP code (5 digits or 5+4 format)
   */
  const validateZipCode = (zip: string): string | undefined => {
    if (!zip) return undefined; // ZIP is optional
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip)) {
      return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }
    return undefined;
  };

  /**
   * Validate budget (must be positive number)
   */
  const validateBudget = (budget: string): string | undefined => {
    if (!budget) return undefined; // Budget is optional
    const num = parseFloat(budget);
    if (isNaN(num)) {
      return 'Budget must be a valid number';
    }
    if (num < 0) {
      return 'Budget must be a positive number';
    }
    return undefined;
  };

  /**
   * Validate end date (must be after start date)
   */
  const validateEndDate = (startDate: string, endDate: string): string | undefined => {
    if (!endDate || !startDate) return undefined; // End date is optional
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return 'End date must be after start date';
    }
    return undefined;
  };

  /**
   * Validate a single field
   */
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

  /**
   * Validate all fields for the current step
   */
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

  /**
   * Handle field blur - validate and mark as touched
   */
  const handleFieldBlur = (fieldName: string, value: string) => {
    console.log('[CreateProjectForm] Field blur:', fieldName);

    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(fieldName));

    // Validate field
    const error = validateField(fieldName, value);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[CreateProjectForm] Attempting to proceed to next step from:', currentStep);

    // Validate current step before proceeding
    const isValid = validateCurrentStep();

    if (!isValid) {
      console.log('[CreateProjectForm] Validation failed, staying on current step');
      return;
    }

    if (currentStep < formSteps.length - 1) {
      // Capture current step values before moving
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
      // Clear validation errors when going back
      setValidationErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handle form submission - final validation
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('[CreateProjectForm] Form submission attempted');

    // Validate all fields one last time
    const isValid = validateCurrentStep();

    if (!isValid) {
      console.log('[CreateProjectForm] Final validation failed, preventing submission');
      e.preventDefault();
      return;
    }

    console.log('[CreateProjectForm] Final validation passed, submitting form');
    // Let the form action handle submission
  };

  // Update formValues when projectType changes
  const handleProjectTypeChange = (value: string) => {
    setProjectType(value);
    setFormValues({ ...formValues, project_type: value });
  };

  return (
    <div className="space-y-8">
      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Progress stepper */}
      <Stepper steps={formSteps} currentStep={currentStep} />

      {/* Multi-step form */}
      <form action={formAction} onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step title with text generate effect */}
            <div className="space-y-2 text-center">
              <TextGenerateEffect
                words={currentStepData.title}
                className="text-3xl font-black text-gray-900"
              />
              <p className="text-gray-600 font-medium">{currentStepData.description}</p>
            </div>

            {/* Step-specific content */}
            <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-construction">
              {/* Hidden inputs to preserve all form values across steps */}
              {currentStep > 0 && (
                <>
                  <input type="hidden" name="project_type" value={formValues.project_type} />
                </>
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

              {/* Step 1: Project Type Selection */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <input type="hidden" name="project_type" value={projectType} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PROJECT_TYPES.map((type) => {
                      const TypeIcon = type.icon;
                      const isSelected = projectType === type.value;

                      return (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => handleProjectTypeChange(type.value)}
                          className={cn(
                            "relative p-6 rounded-xl border-2 transition-all duration-300 text-left",
                            isSelected
                              ? "border-construction-blue shadow-construction-lg bg-construction-blue/5"
                              : "border-gray-200 hover:border-construction-blue/50 hover:shadow-construction bg-white"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Icon Container */}
                          <div className={cn(
                            "mb-4 flex items-center justify-center w-16 h-16 rounded-xl transition-all",
                            isSelected
                              ? "bg-construction-blue"
                              : "bg-construction-blue/10"
                          )}>
                            <TypeIcon className={cn(
                              "w-8 h-8 transition-colors",
                              isSelected ? "text-white" : "text-construction-blue"
                            )} />
                          </div>

                          {/* Label and Description */}
                          <div className="space-y-1">
                            <h3 className="font-black text-lg text-gray-900">{type.label}</h3>
                            <p className="text-sm text-gray-600 leading-snug">{type.description}</p>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <motion.div
                              className="absolute -top-2 -right-2 w-8 h-8 bg-construction-blue rounded-full flex items-center justify-center shadow-construction"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Project Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-bold">Project Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Smith Residence Renovation"
                        required
                        disabled={isPending}
                        className={cn(
                          "border-2 h-11",
                          touchedFields.has('name') && validationErrors.name && "border-red-500 focus-visible:ring-red-500"
                        )}
                        defaultValue={formValues.name}
                        onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                      />
                      {/* Show client-side validation error if touched */}
                      {touchedFields.has('name') && validationErrors.name && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.name}
                        </p>
                      )}
                      {/* Show server-side validation error from form submission */}
                      {state.fieldErrors?.name && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {state.fieldErrors.name[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-bold">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Brief description of the project scope..."
                        rows={4}
                        disabled={isPending}
                        className="border-2"
                        defaultValue={formValues.description}
                        onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-dashed border-gray-200">
                    <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-construction-blue" />
                      Client Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="client_name" className="font-bold">Client Name *</Label>
                          <Input
                            id="client_name"
                            name="client_name"
                            placeholder="e.g., John Smith"
                            required
                            disabled={isPending}
                            className={cn(
                              "border-2 h-11",
                              touchedFields.has('client_name') && validationErrors.client_name && "border-red-500 focus-visible:ring-red-500"
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
                          {state.fieldErrors?.client_name && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {state.fieldErrors.client_name[0]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="client_email" className="font-bold">Client Email</Label>
                          <Input
                            id="client_email"
                            name="client_email"
                            type="email"
                            placeholder="client@example.com"
                            disabled={isPending}
                            className={cn(
                              "border-2 h-11",
                              touchedFields.has('client_email') && validationErrors.client_email && "border-red-500 focus-visible:ring-red-500"
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
                          {state.fieldErrors?.client_email && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {state.fieldErrors.client_email[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_phone" className="font-bold">Client Phone</Label>
                        <Input
                          id="client_phone"
                          name="client_phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          disabled={isPending}
                          className={cn(
                            "border-2 h-11",
                            touchedFields.has('client_phone') && validationErrors.client_phone && "border-red-500 focus-visible:ring-red-500"
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
              )}

              {/* Step 3: Location */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-bold">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main Street"
                      required
                      disabled={isPending}
                      className={cn(
                        "border-2 h-11",
                        touchedFields.has('address') && validationErrors.address && "border-red-500 focus-visible:ring-red-500"
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
                    {state.fieldErrors?.address && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {state.fieldErrors.address[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="font-bold">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        disabled={isPending}
                        className="border-2 h-11"
                        defaultValue={formValues.city}
                        onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="font-bold">State</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="State"
                        disabled={isPending}
                        className="border-2 h-11"
                        defaultValue={formValues.state}
                        onChange={(e) => setFormValues({ ...formValues, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code" className="font-bold">ZIP Code</Label>
                      <Input
                        id="zip_code"
                        name="zip_code"
                        placeholder="12345"
                        disabled={isPending}
                        className={cn(
                          "border-2 h-11",
                          touchedFields.has('zip_code') && validationErrors.zip_code && "border-red-500 focus-visible:ring-red-500"
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
                  </div>
                </div>
              )}

              {/* Step 4: Timeline & Budget */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="font-bold">Start Date *</Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        required
                        disabled={isPending}
                        className={cn(
                          "border-2 h-11",
                          touchedFields.has('start_date') && validationErrors.start_date && "border-red-500 focus-visible:ring-red-500"
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
                      {state.fieldErrors?.start_date && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {state.fieldErrors.start_date[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="font-bold">Expected End Date</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        disabled={isPending}
                        className={cn(
                          "border-2 h-11",
                          touchedFields.has('end_date') && validationErrors.end_date && "border-red-500 focus-visible:ring-red-500"
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

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="font-bold">Budget ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="budget"
                        name="budget"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="50000.00"
                        disabled={isPending}
                        className={cn(
                          "border-2 h-11 pl-10",
                          touchedFields.has('budget') && validationErrors.budget && "border-red-500 focus-visible:ring-red-500"
                        )}
                        defaultValue={formValues.budget}
                        onChange={(e) => setFormValues({ ...formValues, budget: e.target.value })}
                        onBlur={(e) => handleFieldBlur('budget', e.target.value)}
                      />
                    </div>
                    {touchedFields.has('budget') && validationErrors.budget && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {validationErrors.budget}
                      </p>
                    )}
                    {state.fieldErrors?.budget && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {state.fieldErrors.budget[0]}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200">
                    <div className="bg-construction-blue/5 border-2 border-construction-blue/20 rounded-lg p-4">
                      <h4 className="font-black text-construction-blue mb-2">Ready to Create!</h4>
                      <p className="text-sm text-gray-600">
                        Click "Create Project" below to start your construction journey with automatic phase creation and health tracking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <motion.button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={cn(
                  "px-6 py-2.5 text-sm font-bold rounded-lg transition-colors",
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
                whileHover={{ scale: currentStep > 0 ? 1.05 : 1 }}
                whileTap={{ scale: currentStep > 0 ? 0.95 : 1 }}
              >
                Previous
              </motion.button>

              {currentStep < formSteps.length - 1 ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-construction-blue to-blue-700 rounded-lg shadow-construction hover:shadow-construction-lg transition-shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next Step
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-construction-blue to-blue-700 rounded-lg shadow-construction hover:shadow-construction-lg transition-shadow disabled:opacity-50"
                  whileHover={{ scale: isPending ? 1 : 1.05 }}
                  whileTap={{ scale: isPending ? 1 : 0.95 }}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                  {isPending ? 'Creating Project...' : 'Create Project'}
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}
