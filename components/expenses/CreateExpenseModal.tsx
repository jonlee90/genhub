"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
} from "lucide-react";
import {
  createExpense,
  getVendorOptions,
  type VendorOption,
} from "@/app/actions/expenses";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Image from "next/image";
import type { CreateExpenseModalProps } from "@/types/db/expense";
import { VendorCombobox } from "./VendorCombobox";
import { getTaskTypeDisplayConfig } from "@/lib/config/task-type-display";

export function CreateExpenseModal({
  projects,
  tasks,
  onClose,
  taskContext,
  companyId,
}: CreateExpenseModalProps) {
  // Initialize with task context if provided
  const [selectedProject, setSelectedProject] = useState<string>(
    taskContext?.projectId || "",
  );

  // Vendor options state
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>(
    taskContext?.taskId || "",
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("materials");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [vendorName, setVendorName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Filter tasks for selected project
  const projectTasks = useMemo(
    () =>
      selectedProject
        ? tasks.filter((task) => task.project_id === selectedProject)
        : [],
    [selectedProject, tasks],
  );

  // Count tasks per project
  const taskCountPerProject = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.project_id] = (counts[task.project_id] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  // Fetch vendor options on mount
  useEffect(() => {
    if (!companyId) return;

    const fetchVendors = async () => {
      setVendorLoading(true);
      setVendorError(null);

      try {
        const result = await getVendorOptions(companyId);
        if (result.data) {
          setVendorOptions(result.data);
        } else if (result.error) {
          setVendorError(result.error);
        }
      } catch {
        setVendorError("Failed to load vendor options");
      } finally {
        setVendorLoading(false);
      }
    };

    fetchVendors();
  }, [companyId]);

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
    toast({
      title: "Processing Receipt",
      description: "AI is extracting data from your receipt...",
    });

    // In a real implementation, you'd call the OCR service here
    // For now, we'll simulate it
    setTimeout(() => {
      setIsProcessingOCR(false);
      toast({
        title: "OCR Complete",
        description: "Receipt data extracted. Please review and confirm.",
      });
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

  const handleSubmit = () => {
    if (
      !selectedProject ||
      !description ||
      !amount ||
      parseFloat(amount) <= 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      // In a real implementation, upload the receipt to storage first
      // const receiptUrl = await uploadReceiptToStorage(receiptFile);

      const result = await createExpense({
        project_id: selectedProject,
        task_id:
          selectedTask && selectedTask !== "no-task" ? selectedTask : undefined,
        description,
        amount: parseFloat(amount),
        category: category as
          | "materials"
          | "labor"
          | "equipment"
          | "permits"
          | "transportation"
          | "meals"
          | "lodging"
          | "other",
        expense_date: expenseDate,
        vendor_name: vendorName || undefined,
        receipt_url: receiptPreview || undefined, // In real implementation, use the uploaded URL
      });

      if (result.success) {
        toast({
          title: "Expense Added Successfully",
          description: taskContext
            ? `Expense added to task: ${taskContext.taskTitle}`
            : "Your expense has been added and is now under review.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit expense",
          variant: "destructive",
        });
      }
    });
  };

  // Validation state for submit button
  const isValid =
    selectedProject && description && amount && parseFloat(amount) > 0;

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={FileText}
      title={taskContext ? "Add Expense" : "Submit Expense"}
      subtitle={
        !taskContext
          ? "Upload a receipt and let AI extract the details automatically"
          : undefined
      }
      theme="default"
      maxWidth="3xl"
      leftActions={
        taskContext ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="h-10 px-4 font-medium text-[#001B51] hover:bg-[#001B51]/10 hover:text-[#001B51] transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Task
          </Button>
        ) : undefined
      }
      rightActions={
        <Button
          onClick={handleSubmit}
          disabled={isPending || !isValid}
          className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-construction-blue/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {taskContext ? "Adding..." : "Submitting..."}
            </>
          ) : taskContext ? (
            "Add Expense"
          ) : (
            "Submit Expense"
          )}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Task Context Info Banner - Positioned at top of form */}
        {taskContext && (
          <div className="bg-[#001B51]/10 border-l-4 border-[#001B51] p-4 rounded-r">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#001B51] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[#001B51]">
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
        {/* Receipt Upload Section */}
        <div className="space-y-4">
          <Label className="text-sm font-bold text-gray-700">
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
                    <p className="text-sm text-gray-600">Choose from gallery</p>
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

          {isProcessingOCR && (
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
          )}
        </div>

        {/* Expense Form */}
        <div className="space-y-4">
          {/* Project and Task */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="project"
                className="text-sm font-bold text-gray-700"
              >
                Project *
              </Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={!!taskContext}
              >
                <SelectTrigger
                  id="project"
                  className={`border-2 ${taskContext ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
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
              {taskContext && (
                <p className="text-xs text-gray-500 italic">
                  Locked: Pre-filled from task context
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task" className="text-sm font-bold text-gray-700">
                Task {taskContext ? "*" : "(Optional)"}
              </Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={!selectedProject || !!taskContext}
              >
                <SelectTrigger
                  id="task"
                  className={`border-2 ${taskContext ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
                >
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-task">No task</SelectItem>
                  {projectTasks.map((task) => {
                    const taskTypeLabel = task.task_type
                      ? getTaskTypeDisplayConfig(task.task_type as any).label
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
              {taskContext && (
                <p className="text-xs text-gray-500 italic">
                  Locked: Pre-filled from task context
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <FormField label="Description *" htmlFor="description">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2"
              placeholder="e.g., Lumber for framing, electrical supplies, etc."
              rows={3}
            />
          </FormField>

          {/* Amount, Category, Date */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-sm font-bold text-gray-700"
              >
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-2"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="text-sm font-bold text-gray-700"
              >
                Category *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="lodging">Lodging</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold text-gray-700">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="border-2"
              />
            </div>
          </div>

          {/* Vendor Name - VendorCombobox or fallback Input */}
          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-sm font-bold text-gray-700">
              Vendor Name (Optional)
            </Label>
            {companyId ? (
              <VendorCombobox
                options={vendorOptions}
                value={vendorName}
                onChange={setVendorName}
                placeholder="Select or enter vendor..."
                loading={vendorLoading}
                error={vendorError}
                disabled={isPending}
              />
            ) : (
              <Input
                id="vendor"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="border-2"
                placeholder="e.g., Home Depot, Lowe's, etc."
              />
            )}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
