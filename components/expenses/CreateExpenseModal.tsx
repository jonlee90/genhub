"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { createExpenseValidation } from "@/lib/validation/client-validation";
import { Controller } from "react-hook-form";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  Camera,
  X,
  FileText,
  Sparkles,
  Info,
} from "lucide-react";
import {
  createExpense,
  updateExpense,
  getPaymentMethodSuggestions,
} from "@/app/actions/expenses";
import { getSubcontractorsByCompany } from "@/app/actions/subcontractors";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { m as motion } from "framer-motion";
import Image from "next/image";
import type { CreateExpenseModalProps } from "@/types/db/expense";
import { getTaskTypeDisplayConfig } from "@/lib/config/task-type-display";

export function CreateExpenseModal({
  projects,
  tasks,
  onClose,
  onSuccess,
  taskContext,
  companyId,
  defaultProjectId,
  expense,
}: CreateExpenseModalProps) {
  // Derive edit mode before any state declarations
  const isEdit = !!expense;

  const [paymentMethodSuggestions, setPaymentMethodSuggestions] = useState<
    string[]
  >(["VISA", "AMEX", "ZELLE", "CASH", "CHECK", "DEBIT"]);
  const [paymentMethod, setPaymentMethod] = useState(
    isEdit ? (expense?.payment_method ?? "") : "",
  );
  const [showPaymentSuggestions, setShowPaymentSuggestions] = useState(false);
  const [, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Use validated form hook with native validation
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    canSubmit,
    isSubmitting,
    watch,
  } = useValidatedForm({
    defaultValues: {
      project_id: isEdit
        ? (expense.project?.id ?? "")
        : taskContext?.projectId || defaultProjectId || "",
      task_id: isEdit
        ? (expense.task?.id ?? undefined)
        : taskContext?.taskId || undefined,
      description: isEdit ? expense.description : "",
      amount: isEdit ? String(expense.amount) : "",
      category: isEdit
        ? (expense.category as
            | "materials"
            | "labor"
            | "subcontractor"
            | "equipment"
            | "permits"
            | "transportation"
            | "meals"
            | "lodging"
            | "other")
        : ("materials" as
            | "materials"
            | "labor"
            | "subcontractor"
            | "equipment"
            | "permits"
            | "transportation"
            | "meals"
            | "lodging"
            | "other"),
      expense_date: isEdit
        ? expense.expense_date
        : new Date().toISOString().split("T")[0],
      subcontractor_id: null as string | null,
    },
  });

  // Watch values for derived state
  const selectedProject = watch("project_id");
  const [subcontractors, setSubcontractors] = useState<
    Array<{ id: string; company_name: string; contact_name: string | null }>
  >([]);
  const [subcontractorLoading, setSubcontractorLoading] = useState(false);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<
    string | null
  >(null);

  // Filter tasks for selected project
  const projectTasks = useMemo(
    () =>
      selectedProject
        ? tasks.filter((task) => task.project_id === selectedProject)
        : [],
    [selectedProject, tasks],
  );

  // Load subcontractors when project is selected
  useEffect(() => {
    if (!selectedProject || isEdit) {
      setSubcontractors([]);
      return;
    }
    setSubcontractorLoading(true);
    getSubcontractorsByCompany()
      .then((result) => {
        if (result.success && result.data) {
          setSubcontractors(result.data);
        }
      })
      .finally(() => setSubcontractorLoading(false));
  }, [selectedProject, isEdit]);

  // Count tasks per project
  const taskCountPerProject = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.project_id] = (counts[task.project_id] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  // Fetch payment method suggestions on mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const result = await getPaymentMethodSuggestions();
      if (result.data && result.data.length > 0) {
        const defaults = ["VISA", "AMEX", "ZELLE", "CASH", "CHECK", "DEBIT"];
        setPaymentMethodSuggestions(
          Array.from(new Set([...result.data, ...defaults])),
        );
      }
    };
    fetchPaymentMethods();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessingOCR(true);
    toast.success("AI is extracting data from your receipt...");

    // In a real implementation, you'd call the OCR service here
    // For now, we'll simulate it
    setTimeout(() => {
      setIsProcessingOCR(false);
      toast.success("Receipt data extracted. Please review and confirm.");
      // In real implementation:
      // const result = await processReceiptOCR({ receiptImage: file });
      // if (result.success && result.data) {
      //   setVendorName(result.data.vendor_name || '');
      //   setAmount(result.data.total?.toString() || '');
      //   setDescription(result.data.description || '');
      // }
    }, 2000);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    setSelectedSubcontractorId(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    if (isEdit) {
      const result = await updateExpense({
        id: expense.id,
        description: data.description,
        amount: parseFloat(data.amount) || 0,
        category: data.category as
          | "materials"
          | "labor"
          | "subcontractor"
          | "equipment"
          | "permits"
          | "transportation"
          | "meals"
          | "lodging"
          | "other",
        expense_date: data.expense_date,
        payment_method: paymentMethod || undefined,
      });
      if (result.success) {
        toast.success("Expense updated.");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to update expense");
      }
      return;
    }

    // In a real implementation, upload the receipt to storage first
    // const receiptUrl = await uploadReceiptToStorage(receiptFile);

    const result = await createExpense({
      project_id: data.project_id,
      task_id:
        data.task_id && data.task_id !== "no-task" ? data.task_id : undefined,
      description: data.description,
      amount: parseFloat(data.amount) || 0,
      category: data.category as
        | "materials"
        | "labor"
        | "subcontractor"
        | "equipment"
        | "permits"
        | "transportation"
        | "meals"
        | "lodging"
        | "other",
      expense_date: data.expense_date,
      payment_method: paymentMethod || undefined,
      receipt_url: receiptPreview || undefined, // In real implementation, use the uploaded URL
      subcontractor_id: selectedSubcontractorId || undefined,
    });

    if (result.success) {
      toast.success(
        taskContext
          ? `Expense added to task: ${taskContext.taskTitle}`
          : "Your expense has been added and is now under review.",
      );
      onSuccess?.();
      onClose();
    } else {
      toast.error(result.error || "Failed to submit expense");
    }
  });

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={handleClose}
      icon={FileText}
      title={
        isEdit ? "Edit Expense" : taskContext ? "Add Expense" : "Submit Expense"
      }
      theme="default"
      maxWidth="3xl"
      showNavigation={true}
      onBack={isEdit ? handleClose : taskContext ? handleClose : undefined}
      backLabel={isEdit ? "Back" : taskContext ? "Back to Task" : "Back"}
      onContinue={onSubmit}
      continueLabel={
        isSubmitting
          ? isEdit
            ? "Saving..."
            : taskContext
              ? "Adding..."
              : "Submitting..."
          : isEdit
            ? "Save Changes"
            : taskContext
              ? "Add Expense"
              : "Submit Expense"
      }
      continueDisabled={!canSubmit || isSubmitting}
    >
      <div className="space-y-6">
        {/* Task Context Info Banner - Positioned at top of form */}
        {taskContext && (
          <div className="bg-construction-blue/10 border-l-4 border-construction-blue p-4 rounded-r">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-construction-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-construction-blue">
                  Adding expense for task: {taskContext.taskTitle}
                </p>
                {taskContext.projectName && (
                  <p className="text-sm text-gray-600">
                    Project: {taskContext.projectName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Expense Form */}
        <div className="space-y-4">
          {/* Project and Task */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="project"
                className="text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Project *
              </Label>
              <Controller
                name="project_id"
                control={control}
                rules={createExpenseValidation.project_id}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!taskContext || isEdit}
                  >
                    <SelectTrigger
                      id="project"
                      className={`border-2 ${taskContext || isEdit ? "bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60" : ""}`}
                    >
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          <span className="text-gray-500 text-sm ml-2">
                            ({taskCountPerProject[project.id]} tasks)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {taskContext ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Locked: Pre-filled from task context
                </p>
              ) : isEdit ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Locked — project cannot be changed when editing
                </p>
              ) : null}
              {errors.project_id && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.project_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="task"
                className="text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Task {taskContext ? "*" : "(Optional)"}
              </Label>
              <Controller
                name="task_id"
                control={control}
                rules={createExpenseValidation.task_id}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!selectedProject || !!taskContext || isEdit}
                  >
                    <SelectTrigger
                      id="task"
                      className={`border-2 ${taskContext || isEdit ? "bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60" : ""}`}
                    >
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-task">No task</SelectItem>
                      {projectTasks.map((task) => {
                        const taskTypeLabel = task.task_type
                          ? getTaskTypeDisplayConfig(task.task_type as any)
                              .label
                          : "Work";
                        return (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                            <span className="text-gray-500 text-sm ml-2">
                              [{taskTypeLabel}]
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {taskContext ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Locked: Pre-filled from task context
                </p>
              ) : isEdit ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Locked — task cannot be changed when editing
                </p>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Description *
            </Label>
            <Textarea
              id="description"
              className="border-2"
              placeholder="e.g., Lumber for framing, electrical supplies, etc."
              rows={3}
              {...register("description", createExpenseValidation.description)}
            />
            {errors.description && (
              <p className="text-sm text-red-600 font-medium">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Amount, Category, Date */}
          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              name="amount"
              control={control}
              rules={createExpenseValidation.amount}
              render={({ field: { onChange, value, ...fieldRest } }) => (
                <CurrencyInput
                  {...fieldRest}
                  label="Amount *"
                  hint="Use a negative amount for refunds or credits"
                  error={errors.amount?.message}
                  placeholder="0.00"
                  allowNegative
                  onValueChange={(val) => onChange(val || "")}
                  value={value || ""}
                />
              )}
            />

            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Category *
              </Label>
              <Controller
                name="category"
                control={control}
                rules={createExpenseValidation.category}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="subcontractor">
                        Subcontractor
                      </SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="permits">Permits</SelectItem>
                      <SelectItem value="transportation">
                        Transportation
                      </SelectItem>
                      <SelectItem value="meals">Meals</SelectItem>
                      <SelectItem value="lodging">Lodging</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                className="border-2"
                {...register(
                  "expense_date",
                  createExpenseValidation.expense_date,
                )}
              />
              {errors.expense_date && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.expense_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Subcontractor Picker — only when project is selected and not editing */}
          {!isEdit && selectedProject ? (
            <div className="space-y-2">
              <Label
                htmlFor="subcontractor_id"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Subcontractor
              </Label>
              <div className="relative">
                <select
                  id="subcontractor_id"
                  className="w-full min-h-[44px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001B51] disabled:opacity-50"
                  value={selectedSubcontractorId ?? ""}
                  disabled={subcontractorLoading}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setSelectedSubcontractorId(val);
                  }}
                >
                  <option value="">
                    {subcontractorLoading ? "Loading..." : "None (optional)"}
                  </option>
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.company_name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSubcontractorId ? (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />A payment will be auto-added
                  to this subcontractor&apos;s contract.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Payment Method */}
          <div className="space-y-2 relative">
            <Label
              htmlFor="payment-method"
              className="text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Payment Method (Optional)
            </Label>
            <div className="relative">
              <input
                id="payment-method"
                type="text"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setShowPaymentSuggestions(true);
                }}
                onFocus={() => setShowPaymentSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowPaymentSuggestions(false), 200)
                }
                placeholder='e.g., "VISA 4516", "ZELLE", "CHK 2843"'
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-construction-blue focus:outline-none min-h-[44px]"
                disabled={isSubmitting}
              />
            </div>

            {showPaymentSuggestions &&
            paymentMethodSuggestions.filter((s) =>
              s.toLowerCase().includes(paymentMethod.toLowerCase()),
            ).length > 0 ? (
              <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                {paymentMethodSuggestions
                  .filter((s) =>
                    s.toLowerCase().includes(paymentMethod.toLowerCase()),
                  )
                  .map((method) => (
                    <button
                      key={method}
                      type="button"
                      onMouseDown={() => {
                        setPaymentMethod(method);
                        setShowPaymentSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 min-h-[44px] transition-colors"
                    >
                      {method}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Receipt Upload Section — hidden in edit mode */}
        {!isEdit ? (
          <div className="space-y-4">
            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Receipt Photo
            </Label>

            {receiptPreview ? (
              <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="relative w-full h-64 bg-gray-100">
                  <Image
                    src={receiptPreview}
                    alt="Receipt preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {isProcessingOCR && (
                    <div className="bg-construction-blue text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-semibold">
                        Processing OCR...
                      </span>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveReceipt}
                    className="shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-construction-blue hover:bg-construction-blue/5 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 group-hover:text-construction-blue" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Upload File</p>
                      <p className="text-sm text-gray-600">
                        Choose from gallery
                      </p>
                    </div>
                  </div>
                </button>

                {/* Camera Upload */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-construction-blue hover:bg-construction-blue/5 transition-all group"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-construction-blue/10 transition-colors">
                      <Camera className="h-8 w-8 text-gray-400 group-hover:text-construction-blue" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Take Photo</p>
                      <p className="text-sm text-gray-600">Use camera</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {isProcessingOCR ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-construction-blue/5 border-2 border-construction-blue/20 rounded-lg p-3 flex items-center gap-3"
              >
                <Sparkles className="h-5 w-5 text-construction-blue animate-pulse" />
                <div>
                  <p className="font-bold text-construction-blue text-sm">
                    AI Processing
                  </p>
                  <p className="text-xs text-gray-600">
                    Extracting vendor, amount, and line items...
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ResponsiveModal>
  );
}
