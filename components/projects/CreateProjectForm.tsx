"use client";

import {
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
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { useFormSubmit } from "@/hooks/use-form-submit";
import { createProjectValidation } from "@/lib/validation/client-validation";
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
  const [projectType, setProjectType] = useState<string>("");

  // Project type configs (for mapping to phase templates)
  // Use useRef to avoid triggering dependent effects when reference changes
  const projectTypeConfigsRef = useRef<Record<string, string>>({});

  // Fetched project types from database
  const [projectTypeConfigs, setProjectTypeConfigs] = useState<ProjectTypeConfigsRow[]>([]);

  // Phase template preview state
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([]);
  const [phaseTemplatesLoading, setPhaseTemplatesLoading] = useState(false);

  // Use React Hook Form with native validation
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useValidatedForm({
    defaultValues: {
      project_type: "",
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
    },
  });

  // Watch all form values
  const formValues = watch();

  // Use form submit hook with overlay
  const { formAction, isPending, isComplete, result } = useFormSubmit({
    action: async (formData) => {
      const result = await createProject(formData);
      // Convert legacy result to FormActionResult
      if ('project' in result && result.success) {
        return { success: true as const, data: result.project };
      } else if ('error' in result) {
        return {
          success: false as const,
          error: result.error || 'Failed to create project',
          fieldErrors: 'fieldErrors' in result ? result.fieldErrors : undefined,
        };
      }
      return { success: false as const, error: 'Unknown error occurred' };
    },
    onSuccess: (project) => {
      const projectId = project.id;
      setTimeout(() => {
        if (isModal && onSuccess) {
          onSuccess(projectId);
        } else {
          router.push(`/app/projects/${projectId}`);
        }
      }, 500);
    },
    useOverlay: true,
  });

  // Validate current step before continuing
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    let fieldsToValidate: string[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["name", "client_name", "client_email", "client_phone"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["address", "zip_code"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["start_date", "end_date", "budget"];
    }

    const result = await trigger(fieldsToValidate as any);
    return result;
  }, [currentStep, trigger]);

  const handleNext = useCallback(async () => {
      const isValid = await validateCurrentStep();
      if (!isValid) return;

      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    },
    [currentStep, validateCurrentStep],
  );

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      const isValid = await validateCurrentStep();
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

      // formValues.project_type is already the project type config ID
      const configId = formValues.project_type;

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
      setValue("project_type", value);
    },
    [setValue],
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

  // Project type badge for header (shown from step 2 onwards)
  const projectTypeBadge = useMemo(() => {
    if (currentStep === 0) return undefined;

    // Look up project type name from the database configs by ID
    const selectedType = projectTypeConfigs.find(
      (pt) => pt.id === formValues.project_type
    );
    const displayName = selectedType?.name || formValues.project_type;

    return (
      <span className="px-3 py-1 text-xs font-medium bg-construction-blue/10 text-construction-blue dark:bg-construction-blue/20 dark:text-construction-blue rounded-full">
        {displayName}
      </span>
    );
  }, [currentStep, formValues.project_type, projectTypeConfigs]);

  // Determine navigation handlers and labels based on current step
  const shouldShowBack = currentStep > 0;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={FolderKanban}
      title={modalTitle}
      badges={projectTypeBadge}
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
          error={result && !result.success ? result.error : null}
          success={isComplete}
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
                className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-construction-blue dark:text-construction-blue" />
                Project Name <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <MobileInput
                {...register("name", createProjectValidation.name)}
                id="name"
                placeholder="e.g., Smith Residence Renovation"
                disabled={isPending}
                error={errors.name?.message}
                inputMode="text"
                enterKeyHint="next"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                Description
              </Label>
              <Textarea
                {...register("description", createProjectValidation.description)}
                id="description"
                placeholder="Brief description of the project scope..."
                rows={2}
                disabled={isPending}
                className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 resize-none text-sm rounded-xl min-h-[72px]"
              />
              {errors.description && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Client Information Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-construction-blue dark:text-construction-blue" />
                Client Information
              </h4>

              <div className="space-y-4">
                {/* Client Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="client_name"
                    className="text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Client Name <span className="text-red-500 dark:text-red-400">*</span>
                  </Label>
                  <MobileInput
                    {...register("client_name", createProjectValidation.client_name)}
                    id="client_name"
                    placeholder="e.g., John Smith"
                    disabled={isPending}
                    error={errors.client_name?.message}
                    inputMode="text"
                    enterKeyHint="next"
                  />
                </div>

                {/* Email & Phone - Side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MobileInput
                    {...register("client_email", createProjectValidation.client_email)}
                    id="client_email"
                    type="email"
                    label="Email"
                    placeholder="client@example.com"
                    disabled={isPending}
                    error={errors.client_email?.message}
                    inputMode="email"
                    enterKeyHint="next"
                  />
                  <MobileInput
                    {...register("client_phone", {
                      ...createProjectValidation.client_phone,
                      onChange: (e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setValue("client_phone", formatted);
                      }
                    })}
                    id="client_phone"
                    type="tel"
                    label="Phone"
                    placeholder="(555) 123-4567"
                    disabled={isPending}
                    error={errors.client_phone?.message}
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
                className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
              >
                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                Street Address <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <MobileInput
                {...register("address", createProjectValidation.address)}
                id="address"
                placeholder="123 Main Street"
                disabled={isPending}
                error={errors.address?.message}
                inputMode="text"
                enterKeyHint="next"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MobileInput
                {...register("city", createProjectValidation.city)}
                id="city"
                label="City"
                placeholder="City"
                disabled={isPending}
                error={errors.city?.message}
                inputMode="text"
                enterKeyHint="next"
              />
              <div className="space-y-1.5">
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  State
                </Label>
                <StateSelect
                  id="state"
                  name="state"
                  placeholder="Select state"
                  disabled={isPending}
                  value={formValues.state}
                  onValueChange={(value) => setValue("state", value)}
                />
              </div>
            </div>

            {/* ZIP Code */}
            <div className="sm:w-1/2">
              <MobileInput
                {...register("zip_code", createProjectValidation.zip_code)}
                id="zip_code"
                label="ZIP Code"
                placeholder="12345"
                disabled={isPending}
                error={errors.zip_code?.message}
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
                  className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Start Date <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <input
                  {...register("start_date", createProjectValidation.start_date)}
                  id="start_date"
                  type="date"
                  disabled={isPending}
                  className={cn(
                    "block w-full h-12 px-4 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    "border rounded-xl transition-all [color-scheme:light] dark:[color-scheme:dark]",
                    errors.start_date
                      ? "border-red-500 dark:border-red-600 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20",
                    "focus:outline-none focus:ring-2",
                    "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400",
                  )}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="end_date"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Expected End Date
                </Label>
                <input
                  {...register("end_date", createProjectValidation.end_date)}
                  id="end_date"
                  type="date"
                  disabled={isPending}
                  className={cn(
                    "block w-full h-12 px-4 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    "border rounded-xl transition-all [color-scheme:light] dark:[color-scheme:dark]",
                    errors.end_date
                      ? "border-red-500 dark:border-red-600 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-700 focus:border-construction-blue focus:ring-construction-blue/20",
                    "focus:outline-none focus:ring-2",
                    "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400",
                  )}
                />
                {errors.end_date && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="sm:w-1/2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="budget"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Budget
                </Label>
                <MobileInput
                  {...register("budget", createProjectValidation.budget)}
                  id="budget"
                  type="number"
                  placeholder="50000"
                  disabled={isPending}
                  error={errors.budget?.message}
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  enterKeyHint="done"
                />
              </div>
            </div>

            {/* Ready to Create */}
            <div className="mt-6 p-4 bg-construction-blue/5 dark:bg-construction-blue/10 border border-construction-blue/20 dark:border-construction-blue/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-construction-blue dark:bg-construction-blue rounded-lg shrink-0">
                  <Check className="w-4 h-4 text-white dark:text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-construction-blue dark:text-construction-blue">
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
        isComplete={isComplete}
        projectName={formValues.name}
      />
    </ResponsiveModal>
  );
}
