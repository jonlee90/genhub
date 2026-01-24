"use client";

import { useState, useEffect } from "react";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { assignMaterialValidation } from "@/lib/validation/client-validation";
import { Controller } from "react-hook-form";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, AlertCircle } from "lucide-react";
import {
  assignMaterialToTask,
  createMaterialFromHomeDepot,
  getProjectPhases,
  getPhaseTasks,
} from "@/app/actions/materials";
import { useToast } from "@/hooks/use-toast";
import type { HomeDepotProduct } from "@/lib/services/home-depot-api";

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  phase_id: string | null;
}

interface Phase {
  id: string;
  name: string;
  tasks?: Task[];
}

interface AssignMaterialModalProps {
  product: HomeDepotProduct; // Use actual type
  projects: Project[];
  onClose: () => void;
}

export function AssignMaterialModal({
  product,
  projects,
  onClose,
}: AssignMaterialModalProps) {
  const [purchaserType, setPurchaserType] = useState<
    "gc" | "pm" | "subcontractor"
  >("gc");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const { toast } = useToast();

  // Use validated form hook with native validation
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    canSubmit,
    isSubmitting,
    watch,
    setValue,
  } = useValidatedForm({
    defaultValues: {
      project_id: "",
      phase_id: undefined,
      task_id: undefined,
      quantity: 1,
      purchaser_type: "gc" as const,
    },
  });

  // Watch values for derived state
  const selectedProject = watch("project_id");
  const selectedPhase = watch("phase_id");
  const selectedTask = watch("task_id");
  const quantity = watch("quantity");

  // Load phases when project is selected
  useEffect(() => {
    if (selectedProject) {
      setIsLoadingPhases(true);
      setValue("phase_id", undefined);
      setValue("task_id", undefined);
      setTasks([]);

      getProjectPhases(selectedProject)
        .then((result) => {
          if (!result.success) {
            toast({
              title: "Error",
              description: result.error || "Failed to load project phases",
              variant: "destructive",
            });
            setPhases([]);
          } else {
            setPhases(result.data || []);
          }
          setIsLoadingPhases(false);
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: `Unexpected error: ${err.message}`,
            variant: "destructive",
          });
          setPhases([]);
          setIsLoadingPhases(false);
        });
    } else {
      setPhases([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  // Load tasks when phase is selected
  useEffect(() => {
    if (selectedPhase) {
      setIsLoadingTasks(true);
      setValue("task_id", undefined);

      getPhaseTasks(selectedPhase)
        .then((result) => {
          if (!result.success) {
            toast({
              title: "Error",
              description: result.error || "Failed to load tasks",
              variant: "destructive",
            });
            setTasks([]);
          } else {
            setTasks(result.data || []);
          }
          setIsLoadingTasks(false);
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: `Unexpected error: ${err.message}`,
            variant: "destructive",
          });
          setTasks([]);
          setIsLoadingTasks(false);
        });
    } else {
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase]);

  const onSubmit = handleSubmit(async (data) => {
    // Validate task_id is not empty placeholder
    if (!data.task_id || data.task_id === "_empty") {
      toast({
        title: "Validation Error",
        description: "Please select a valid task.",
        variant: "destructive",
      });
      return;
    }

    // Ensure the product is a plain object for serialization
    const plainProduct = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      manufacturer: product.manufacturer,
      price: product.price,
      unitOfMeasure: product.unitOfMeasure,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      stockStatus: product.stockStatus,
      stockQuantity: product.stockQuantity,
      leadTimeDays: product.leadTimeDays,
      specifications: product.specifications,
      rating: product.rating,
      reviewCount: product.reviewCount,
    };

    // First, create the material from Home Depot product
    const materialResult = await createMaterialFromHomeDepot(plainProduct);

    if (!materialResult.success || !materialResult.data) {
      toast({
        title: "Error",
        description:
          materialResult.error || "Failed to add material to catalog",
        variant: "destructive",
      });
      return;
    }

    const materialId = materialResult.data.id;

    // Then assign it to the task
    const assignResult = await assignMaterialToTask({
      material_id: materialId,
      task_id: data.task_id,
      project_id: data.project_id,
      quantity: data.quantity,
      unit_cost: product.price,
      purchaser_type: purchaserType,
    });

    if (assignResult.success) {
      toast({
        title: "Material Assigned",
        description: `${product.name} has been assigned to the task.`,
      });
      onClose();
    } else {
      toast({
        title: "Error",
        description:
          assignResult.error || "Failed to assign material to task",
        variant: "destructive",
      });
    }
  });

  const totalCost = (quantity || 0) * product.price;

  const formatPrice = (price: number) => priceFormatter.format(price);

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={Package}
      title="Assign Material to Task"
      maxWidth="2xl"
      showNavigation={true}
      onBack={onClose}
      onContinue={onSubmit}
      backLabel="Cancel"
      continueLabel={isSubmitting ? "Assigning..." : "Assign Material"}
      continueDisabled={
        !canSubmit ||
        isSubmitting ||
        selectedTask === "_empty"
      }
    >
      <div className="space-y-6">
        {/* Product Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-construction-blue mb-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">SKU: {product.sku}</span>
            <span className="font-bold text-construction-blue">
              {formatPrice(product.price)} / unit
            </span>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="space-y-4">
          {/* Project Selection */}
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
              rules={assignMaterialValidation.project_id}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project" className="border-2 min-h-[44px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.project_id && (
              <p className="text-sm text-red-600 font-medium">
                {errors.project_id.message}
              </p>
            )}
          </div>

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase" className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Phase *
            </Label>
            <Controller
              name="phase_id"
              control={control}
              rules={assignMaterialValidation.phase_id}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={!selectedProject || isLoadingPhases}
                >
                  <SelectTrigger id="phase" className="border-2 min-h-[44px]">
                    <SelectValue
                      placeholder={
                        isLoadingPhases ? "Loading phases..." : "Select a phase"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.length > 0 ? (
                      phases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>
                        No phases available for this project
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Task *
            </Label>
            <Controller
              name="task_id"
              control={control}
              rules={assignMaterialValidation.task_id}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={!selectedPhase || isLoadingTasks}
                >
                  <SelectTrigger id="task" className="border-2 min-h-[44px]">
                    <SelectValue
                      placeholder={
                        isLoadingTasks ? "Loading tasks..." : "Select a task"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_empty" disabled>
                        No tasks available in this phase
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label
              htmlFor="quantity"
              className="text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Quantity *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              className="border-2 min-h-[44px]"
              placeholder="Enter quantity"
              {...register("quantity", { ...assignMaterialValidation.quantity, valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600 font-medium">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Purchaser Type */}
          <div className="space-y-2">
            <Label
              htmlFor="purchaser"
              className="text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Who Will Purchase? *
            </Label>
            <Select
              value={purchaserType}
              onValueChange={(v: "gc" | "pm" | "subcontractor") =>
                setPurchaserType(v)
              }
            >
              <SelectTrigger id="purchaser" className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gc">General Contractor (GC)</SelectItem>
                <SelectItem value="pm">Project Manager (PM)</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Summary */}
          <div className="bg-construction-blue/5 border-2 border-construction-blue/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">Total Cost:</span>
              <span className="text-2xl font-black text-construction-blue">
                {formatPrice(totalCost)}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {quantity} × {formatPrice(product.price)} per unit
            </p>
          </div>

          {/* Warning for out of stock or special order */}
          {(product.stockStatus === "out_of_stock" ||
            product.stockStatus === "special_order") && (
            <div className="flex items-start gap-2 p-3 bg-construction-red/5 border-2 border-construction-red/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-construction-red shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-construction-red text-sm">
                  {product.stockStatus === "out_of_stock"
                    ? "Out of Stock"
                    : "Special Order"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {product.stockStatus === "out_of_stock"
                    ? "This product is currently out of stock. You can still assign it, but procurement may be delayed."
                    : "This product requires special ordering. Lead time may be extended."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
