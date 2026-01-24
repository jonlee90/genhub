"use client";

import {
  useActionState,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import { createProject } from "@/app/actions/projects";
import { getPhaseTemplates } from "@/app/actions/phase-templates";
import { getProjectTypes } from "@/app/actions/project-types";
import { MobileInput } from "@/components/mobile/MobileInput";
import { TouchButton } from "@/components/mobile/TouchButton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StateSelect } from "@/components/ui/StateSelect";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import AlertCircle from "lucide-react/icons/alert-circle";
import MapPin from "lucide-react/icons/map-pin";
import DollarSign from "lucide-react/icons/dollar-sign";
import Calendar from "lucide-react/icons/calendar";
import Users from "lucide-react/icons/users";
import FolderKanban from "lucide-react/icons/folder-kanban";
import FileText from "lucide-react/icons/file-text";
import Check from "lucide-react/icons/check";
import ArrowRight from "lucide-react/icons/arrow-right";
import ArrowLeft from "lucide-react/icons/arrow-left";
import Sparkles from "lucide-react/icons/sparkles";
import Plus from "lucide-react/icons/plus";
import { cn } from "@/lib/utils";
import { CreateProjectHiddenFields } from "@/components/projects/create/CreateProjectHiddenFields";
import { CreateProjectStatusAlerts } from "@/components/projects/create/CreateProjectStatusAlerts";
import {
  formatPhoneNumber,
  extractPhoneDigits,
} from "@/lib/hooks/usePhoneMask";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  ProjectTypeSelector,
  FormSubmissionOverlay,
} from "@/components/projects/form";
import type { PhaseTemplatesRow, ProjectTypeConfigsRow } from "@/types/db/tables/projects";
import type { CreateProjectFormState } from "@/types/components/projects";

type PhaseTemplate = PhaseTemplatesRow;

// Form steps configuration
const FORM_STEPS = ["Type", "Details", "Location", "Timeline"];

type FormState = CreateProjectFormState;

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
  projectTypes?: ProjectTypeConfigsRow[];
}

export function CreateProjectForm({
  isOpen,
  onClose,
  onSuccess,
  isModal = false,
  projectTypes: prefetchedProjectTypes = [],
}: CreateProjectFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [projectType, setProjectType] = useState<string>("residential");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState(false);

  // Project type configs (for mapping to phase templates)
  // Use useRef to avoid triggering dependent effects when reference changes
  const projectTypeConfigsRef = useRef<Record<string, string>>({});

  // Fetched project types from database
  const [projectTypeConfigs, setProjectTypeConfigs] = useState<ProjectTypeConfigsRow[]>([]);

  // Phase template preview state
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([]);
  const [phaseTemplatesLoading, setPhaseTemplatesLoading] = useState(false);

  // Track all form values across steps
  // Performance optimization: Lazy state initialization to avoid object recreation on every render
  const [formValues, setFormValues] = useState(() => ({
    project_type: "residential",
    name: "",
    description: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    start_date: "",
    end_date: "",
    budget: "",
  }));

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const result = await createProject(formData);
      return result as FormState;
    },
    {},
  );

  // Handle success - redirect or callback
  useEffect(() => {
    if (state.success && state.project) {
      setSuccess(true);
      const projectId = state.project.id;
      setTimeout(() => {
        if (isModal && onSuccess) {
          onSuccess(projectId);
        } else {
          router.push(`/app/projects/${projectId}`);
        }
      }, 500);
    }
  }, [state.success, state.project, router, isModal, onSuccess]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined;
    const digits = extractPhoneDigits(phone);
    if (digits.length > 0 && digits.length !== 10) {
      return "Phone number must be 10 digits";
    }
    return undefined;
  };

  const validateZipCode = (zip: string): string | undefined => {
    if (!zip) return undefined;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zip)) {
      return "Please enter a valid ZIP code";
    }
    return undefined;
  };

  const validateBudget = (budget: string): string | undefined => {
    if (!budget) return undefined;
    const num = parseFloat(budget);
    if (isNaN(num)) return "Budget must be a valid number";
    if (num < 0) return "Budget must be positive";
    return undefined;
  };

  const validateEndDate = (
    startDate: string,
    endDate: string,
  ): string | undefined => {
    if (!endDate || !startDate) return undefined;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return "End date must be after start date";
    return undefined;
  };

  const validateField = useCallback(
    (fieldName: string, value: string): string | undefined => {
      switch (fieldName) {
        case "name":
          if (!value || value.trim().length === 0)
            return "Project name is required";
          if (value.length > 200) return "Must be less than 200 characters";
          return undefined;
        case "client_name":
          if (!value || value.trim().length === 0)
            return "Client name is required";
          if (value.length > 200) return "Must be less than 200 characters";
          return undefined;
        case "client_email":
          return validateEmail(value);
        case "client_phone":
          return validatePhone(value);
        case "address":
          if (!value || value.trim().length === 0) return "Address is required";
          return undefined;
        case "zip_code":
          return validateZipCode(value);
        case "start_date":
          if (!value) return "Start date is required";
          return undefined;
        case "end_date":
          return validateEndDate(formValues.start_date, value);
        case "budget":
          return validateBudget(value);
        default:
          return undefined;
      }
    },
    [formValues.start_date],
  );

  const validateCurrentStep = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    let hasErrors = false;

    if (currentStep === 1) {
      const nameError = validateField("name", formValues.name);
      if (nameError) {
        errors.name = nameError;
        hasErrors = true;
      }

      const clientNameError = validateField(
        "client_name",
        formValues.client_name,
      );
      if (clientNameError) {
        errors.client_name = clientNameError;
        hasErrors = true;
      }

      const emailError = validateField("client_email", formValues.client_email);
      if (emailError) {
        errors.client_email = emailError;
        hasErrors = true;
      }

      const phoneError = validateField("client_phone", formValues.client_phone);
      if (phoneError) {
        errors.client_phone = phoneError;
        hasErrors = true;
      }
    }

    if (currentStep === 2) {
      const addressError = validateField("address", formValues.address);
      if (addressError) {
        errors.address = addressError;
        hasErrors = true;
      }

      const zipError = validateField("zip_code", formValues.zip_code);
      if (zipError) {
        errors.zip_code = zipError;
        hasErrors = true;
      }
    }

    if (currentStep === 3) {
      const startDateError = validateField("start_date", formValues.start_date);
      if (startDateError) {
        errors.start_date = startDateError;
        hasErrors = true;
      }

      const endDateError = validateField("end_date", formValues.end_date);
      if (endDateError) {
        errors.end_date = endDateError;
        hasErrors = true;
      }

      const budgetError = validateField("budget", formValues.budget);
      if (budgetError) {
        errors.budget = budgetError;
        hasErrors = true;
      }
    }

    setValidationErrors(errors);
    return !hasErrors;
  }, [currentStep, formValues, validateField]);

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleFieldBlur = useCallback(
    (fieldName: string, value: string) => {
      setTouchedFields((prev) => new Set(prev).add(fieldName));
      const error = validateField(fieldName, value);
      setValidationErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [validateField],
  );

  const handleNext = useCallback(() => {
      const isValid = validateCurrentStep();
      if (!isValid) return;

      if (currentStep < FORM_STEPS.length - 1) {
        const form = document.getElementById("project-form") as HTMLFormElement;
        if (form) {
          const formData = new FormData(form);
          const newValues = { ...formValues };
          formData.forEach((value, key) => {
            newValues[key as keyof typeof formValues] = value as string;
          });
          setFormValues(newValues);
        }
        setCurrentStep(currentStep + 1);
      }
    },
    [currentStep, formValues, validateCurrentStep],
  );

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setValidationErrors({});
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const isValid = validateCurrentStep();
      if (!isValid) {
        e.preventDefault();
      }
    },
    [validateCurrentStep],
  );

  // Fetch project type configs on mount (for mapping to phase templates)
  // Performance optimization: Use prefetched data when available, avoid duplicate API calls (async-parallel)
  // Only fetch when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const setupProjectTypeConfigs = async () => {
      try {
        // Use prefetched types if available (from server-side props)
        let typesToUse = prefetchedProjectTypes;

        // If no prefetch available, fetch on-demand
        if (!typesToUse || typesToUse.length === 0) {
          const result = await getProjectTypes();
          if (result.success && result.projectTypes) {
            typesToUse = result.projectTypes;
          }
        }

        if (typesToUse && typesToUse.length > 0) {
          // Store the project types for rendering in ProjectTypeSelector
          setProjectTypeConfigs(typesToUse);

          // Create mapping from project type name (lowercase) to config ID
          const mapping: Record<string, string> = {};
          typesToUse.forEach((pt) => {
            // Map both the config name and a lowercase version
            const key = pt.name.toLowerCase().replace(/\s+/g, "_");
            mapping[key] = pt.id;
            // Also map exact name match
            mapping[pt.name] = pt.id;
          });
          // Store in ref to avoid triggering dependent effects
          projectTypeConfigsRef.current = mapping;
        }
      } catch {
        // Silently fail - phase preview is optional
      }
    };
    setupProjectTypeConfigs();
  }, [isOpen, prefetchedProjectTypes]);

  // Fetch phase templates when project type changes
  // Only fetch when modal is open to avoid duplicate API calls
  useEffect(() => {
    if (!isOpen) return;

    const fetchPhaseTemplates = async () => {
      if (!formValues.project_type) return;

      // Map the project type to config name for lookup
      const typeNameMapping: Record<string, string> = {
        residential: "Residential",
        restaurant: "Restaurant",
        cafe: "Cafe",
        commercial_office: "Commercial Office",
        industrial: "Industrial",
      };
      const configName = typeNameMapping[formValues.project_type];
      const configId =
        projectTypeConfigsRef.current[configName] ||
        projectTypeConfigsRef.current[formValues.project_type];

      if (!configId) {
        // Config not found yet, skip fetching
        setPhaseTemplates([]);
        return;
      }

      setPhaseTemplatesLoading(true);
      try {
        const result = await getPhaseTemplates(configId);
        if (result.success && result.phaseTemplates) {
          setPhaseTemplates(result.phaseTemplates);
        } else {
          setPhaseTemplates([]);
        }
      } catch {
        setPhaseTemplates([]);
      } finally {
        setPhaseTemplatesLoading(false);
      }
    };
    fetchPhaseTemplates();
  }, [isOpen, formValues.project_type]);

  // Performance optimization: Memoize event handler to prevent recreation on every render
  const handleProjectTypeChange = useCallback(
    (value: string) => {
      setProjectType(value);
      setFormValues({ ...formValues, project_type: value });
    },
    [formValues],
  );

  // Dynamic modal title based on step
  const modalTitle = useMemo(() => {
    const titles = [
      "Select Project Type",
      "Project Details",
      "Project Location",
      "Timeline & Budget",
    ];
    return titles[currentStep] || "Create New Project";
  }, [currentStep]);

  const modalSubtitle = useMemo(() => {
    const subtitles = [
      "Choose your construction project type",
      "Enter project and client information",
      "Specify the project location",
      "Set timeline and budget",
    ];
    return subtitles[currentStep];
  }, [currentStep]);

  // Determine navigation handlers and labels based on current step
  const shouldShowBack = currentStep > 0;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={FolderKanban}
      title={modalTitle}
      currentStep={currentStep + 1}
      totalSteps={FORM_STEPS.length}
      theme="default"
      maxWidth="3xl"
      formKey={`create-project-step-${currentStep}`}
      closeOnBackdropClick={false}
      closeOnEscape={true}
      showNavigation={true}
      onBack={shouldShowBack ? handlePrevious : undefined}
      onContinue={
        isLastStep
          ? () => {
              // Trigger form submission
              const form = document.getElementById("project-form") as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }
          : handleNext
      }
      backLabel="Back"
      continueLabel={isLastStep ? "Create Project" : "Continue"}
      continueDisabled={isPending}
    >
      <form id="project-form" action={formAction} onSubmit={handleSubmit}>
        {/* Error/Success Messages */}
        <CreateProjectStatusAlerts
          error={state.error || null}
          success={success}
        />

        {/* Hidden inputs to preserve form values across steps */}
        <CreateProjectHiddenFields
          currentStep={currentStep}
          projectType={projectType}
          formValues={formValues}
        />

        {/* Step 0: Project Type Selection */}
        {currentStep === 0 && (
          <ProjectTypeSelector
            projectType={projectType}
            onProjectTypeChange={handleProjectTypeChange}
            phaseTemplates={phaseTemplates}
            phaseTemplatesLoading={phaseTemplatesLoading}
            disabled={isPending}
            projectTypes={projectTypeConfigs}
          />
        )}

        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Project Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-construction-blue" />
                Project Name <span className="text-red-500">*</span>
              </Label>
              <MobileInput
                id="name"
                name="name"
                placeholder="e.g., Smith Residence Renovation"
                required
                disabled={isPending}
                error={
                  touchedFields.has("name") ? validationErrors.name : undefined
                }
                value={formValues.name}
                onChange={(e) =>
                  setFormValues({ ...formValues, name: e.target.value })
                }
                onBlur={(e) => handleFieldBlur("name", e.target.value)}
                inputMode="text"
                enterKeyHint="next"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the project scope..."
                rows={2}
                disabled={isPending}
                className="border-gray-200 dark:border-gray-700 resize-none text-sm rounded-xl min-h-[72px]"
                value={formValues.description}
                onChange={(e) =>
                  setFormValues({ ...formValues, description: e.target.value })
                }
              />
            </div>

            {/* Client Information Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-construction-blue" />
                Client Information
              </h4>

              <div className="space-y-4">
                {/* Client Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="client_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Client Name <span className="text-red-500">*</span>
                  </Label>
                  <MobileInput
                    id="client_name"
                    name="client_name"
                    placeholder="e.g., John Smith"
                    required
                    disabled={isPending}
                    error={
                      touchedFields.has("client_name")
                        ? validationErrors.client_name
                        : undefined
                    }
                    value={formValues.client_name}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        client_name: e.target.value,
                      })
                    }
                    onBlur={(e) =>
                      handleFieldBlur("client_name", e.target.value)
                    }
                    inputMode="text"
                    enterKeyHint="next"
                  />
                </div>

                {/* Email & Phone - Side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MobileInput
                    id="client_email"
                    name="client_email"
                    type="email"
                    label="Email"
                    placeholder="client@example.com"
                    disabled={isPending}
                    error={
                      touchedFields.has("client_email")
                        ? validationErrors.client_email
                        : undefined
                    }
                    value={formValues.client_email}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        client_email: e.target.value,
                      })
                    }
                    onBlur={(e) =>
                      handleFieldBlur("client_email", e.target.value)
                    }
                    inputMode="email"
                    enterKeyHint="next"
                  />
                  <MobileInput
                    id="client_phone"
                    name="client_phone"
                    type="tel"
                    label="Phone"
                    placeholder="(555) 123-4567"
                    disabled={isPending}
                    error={
                      touchedFields.has("client_phone")
                        ? validationErrors.client_phone
                        : undefined
                    }
                    value={formValues.client_phone}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        client_phone: formatPhoneNumber(e.target.value),
                      })
                    }
                    onBlur={(e) =>
                      handleFieldBlur("client_phone", e.target.value)
                    }
                    inputMode="tel"
                    enterKeyHint="next"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Street Address */}
            <div className="space-y-1.5">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <MapPin className="h-4 w-4 text-gray-400" />
                Street Address <span className="text-red-500">*</span>
              </Label>
              <MobileInput
                id="address"
                name="address"
                placeholder="123 Main Street"
                required
                disabled={isPending}
                error={
                  touchedFields.has("address")
                    ? validationErrors.address
                    : undefined
                }
                value={formValues.address}
                onChange={(e) =>
                  setFormValues({ ...formValues, address: e.target.value })
                }
                onBlur={(e) => handleFieldBlur("address", e.target.value)}
                inputMode="text"
                enterKeyHint="next"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MobileInput
                id="city"
                name="city"
                label="City"
                placeholder="City"
                disabled={isPending}
                value={formValues.city}
                onChange={(e) =>
                  setFormValues({ ...formValues, city: e.target.value })
                }
                inputMode="text"
                enterKeyHint="next"
              />
              <div className="space-y-1.5">
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  State
                </Label>
                <StateSelect
                  id="state"
                  name="state"
                  placeholder="Select state"
                  disabled={isPending}
                  value={formValues.state}
                  onValueChange={(value) =>
                    setFormValues({ ...formValues, state: value })
                  }
                />
              </div>
            </div>

            {/* ZIP Code */}
            <div className="sm:w-1/2">
              <MobileInput
                id="zip_code"
                name="zip_code"
                label="ZIP Code"
                placeholder="12345"
                disabled={isPending}
                error={
                  touchedFields.has("zip_code")
                    ? validationErrors.zip_code
                    : undefined
                }
                value={formValues.zip_code}
                onChange={(e) =>
                  setFormValues({ ...formValues, zip_code: e.target.value })
                }
                onBlur={(e) => handleFieldBlur("zip_code", e.target.value)}
                inputMode="numeric"
                enterKeyHint="next"
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Timeline & Budget */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="start_date"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  disabled={isPending}
                  className={cn(
                    "block w-full h-12 px-4 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    "border rounded-xl transition-all",
                    touchedFields.has("start_date") &&
                      validationErrors.start_date
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20",
                    "focus:outline-none focus:ring-2",
                    "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400",
                  )}
                  value={formValues.start_date}
                  onChange={(e) =>
                    setFormValues({ ...formValues, start_date: e.target.value })
                  }
                  onBlur={(e) => handleFieldBlur("start_date", e.target.value)}
                />
                {touchedFields.has("start_date") &&
                  validationErrors.start_date && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.start_date}
                    </p>
                  )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="end_date"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Expected End Date
                </Label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  disabled={isPending}
                  className={cn(
                    "block w-full h-12 px-4 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    "border rounded-xl transition-all",
                    touchedFields.has("end_date") && validationErrors.end_date
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20",
                    "focus:outline-none focus:ring-2",
                    "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400",
                  )}
                  value={formValues.end_date}
                  onChange={(e) =>
                    setFormValues({ ...formValues, end_date: e.target.value })
                  }
                  onBlur={(e) => handleFieldBlur("end_date", e.target.value)}
                />
                {touchedFields.has("end_date") && validationErrors.end_date && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.end_date}
                  </p>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="sm:w-1/2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="budget"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                >
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  Budget
                </Label>
                <MobileInput
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="50000"
                  disabled={isPending}
                  error={
                    touchedFields.has("budget")
                      ? validationErrors.budget
                      : undefined
                  }
                  value={formValues.budget}
                  onChange={(e) =>
                    setFormValues({ ...formValues, budget: e.target.value })
                  }
                  onBlur={(e) => handleFieldBlur("budget", e.target.value)}
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  enterKeyHint="done"
                />
              </div>
            </div>

            {/* Ready to Create */}
            <div className="mt-6 p-4 bg-construction-blue/5 border border-construction-blue/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-construction-blue rounded-lg shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-construction-blue">
                    Ready to Create
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Your project will be created with automatic phase setup and
                    health tracking.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </form>

      {/* Submission overlay with multi-step loader */}
      <FormSubmissionOverlay
        isSubmitting={isPending}
        isComplete={success}
        projectName={formValues.name}
      />
    </ResponsiveModal>
  );
}
