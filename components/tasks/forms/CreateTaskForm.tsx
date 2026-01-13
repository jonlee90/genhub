'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, Package, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTask, type CreateTaskFormState } from '@/app/actions/tasks';
import { TaskTypeSelector, TaskTypeBadge } from './TaskTypeSelector';
import { TaskMaterialsManager } from '../materials/TaskMaterialsManager';
import { TaskReceiptUpload } from '../expenses/TaskReceiptUpload';
import type { TaskType, TaskProject, TeamMember } from '@/types/db/task';

interface CreateTaskFormProps {
  projects: TaskProject[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Initial state matching createTask action return type
const initialState: CreateTaskFormState = {
  error: null,
  fieldErrors: null,
  success: false,
  task: null,
};

// Step configuration for multi-step form flow
// Work: Type -> Details (2 steps)
// Purchase: Type -> Details -> Materials (3 steps)
// Approval: Type -> Details (2 steps)
// Admin: Type -> Details (2 steps)
const getStepCount = (taskType: TaskType | null): number => {
  if (taskType === 'purchase') return 3;
  return 2;
};

const getStepLabel = (step: number, taskType: TaskType | null): string => {
  if (step === 1) return 'Task Type';
  if (step === 2) return 'Details';
  if (step === 3 && taskType === 'purchase') return 'Materials';
  return '';
};

export function CreateTaskForm({
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onSuccess,
  onCancel,
}: CreateTaskFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || '');

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  // Receipt photo state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Calculate total steps based on task type
  const totalSteps = getStepCount(selectedTaskType);

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  // Handle task creation success
  useEffect(() => {
    if (state?.success && state?.task) {
      // For Purchase tasks, go to materials step after task creation
      if (selectedTaskType === 'purchase' && currentStep === 2) {
        setCreatedTaskId(state.task.id);
        setCurrentStep(3);
        return;
      }

      // For other tasks or after materials step, call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/app/tasks/${state.task.id}`);
      }
    }
  }, [state, router, onSuccess, selectedTaskType, currentStep]);

  // Handle type selection
  const handleTypeSelect = (type: TaskType) => {
    setSelectedTaskType(type);
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear task type when going back to step 1
      if (currentStep === 2) {
        setSelectedTaskType(null);
      }
    }
  };

  // Handle skip materials step for purchase tasks
  const handleSkipMaterials = () => {
    if (onSuccess) {
      onSuccess();
    } else if (createdTaskId) {
      router.push(`/app/tasks/${createdTaskId}`);
    }
  };

  // Determine if cost fields should be shown (not for approval tasks)
  const showCostFields = selectedTaskType !== 'approval';

  return (
    <Card className="border-2 border-gray-200 shadow-lg">
      <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-black text-construction-blue flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Task
            </CardTitle>
            {/* Show selected task type badge after selection */}
            {selectedTaskType && currentStep > 1 && (
              <TaskTypeBadge type={selectedTaskType} />
            )}
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-bold text-construction-blue">Step {currentStep}</span>
            <span>of {totalSteps}</span>
            <span className="text-gray-400">|</span>
            <span className="font-medium">{getStepLabel(currentStep, selectedTaskType)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-construction-blue"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Error Display */}
        <AnimatePresence>
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Task Type Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <TaskTypeSelector
                selectedType={selectedTaskType}
                onSelect={handleTypeSelect}
                disabled={isPending}
              />

              {/* Navigation for Step 1 */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel || (() => router.back())}
                  disabled={isPending}
                  className="border-2"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!selectedTaskType}
                  className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Task Details Form */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form action={formAction} className="space-y-6">
                {/* Hidden task_type field */}
                <input type="hidden" name="task_type" value={selectedTaskType || 'work'} />

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-bold text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder={
                      selectedTaskType === 'purchase' ? 'e.g., Order lumber for framing' :
                      selectedTaskType === 'approval' ? 'e.g., Building permit approval' :
                      selectedTaskType === 'admin' ? 'e.g., Update project schedule' :
                      'Enter task title'
                    }
                    required
                    disabled={isPending}
                    className="border-2 border-gray-200 focus:border-construction-blue"
                  />
                  {state?.fieldErrors?.title && (
                    <p className="text-sm text-red-500">{state.fieldErrors.title[0]}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the task in detail..."
                    rows={3}
                    disabled={isPending}
                    className="border-2 border-gray-200 focus:border-construction-blue resize-none"
                  />
                </div>

                {/* Project & Phase */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project_id" className="text-sm font-bold text-gray-700">
                      Project <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="project_id"
                      value={selectedProjectId}
                      onValueChange={setSelectedProjectId}
                      required
                      disabled={isPending}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {state?.fieldErrors?.project_id && (
                      <p className="text-sm text-red-500">{state.fieldErrors.project_id[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phase_id" className="text-sm font-bold text-gray-700">
                      Phase
                    </Label>
                    <Select
                      name="phase_id"
                      defaultValue={preselectedPhaseId || 'none'}
                      disabled={isPending || !selectedProjectId}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                        <SelectValue placeholder="Select phase (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No phase</SelectItem>
                        {phases
                          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                          .map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assignee & Priority */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assignee_id" className="text-sm font-bold text-gray-700">
                      {selectedTaskType === 'purchase' ? 'Purchaser' :
                       selectedTaskType === 'approval' ? 'Approver' : 'Assignee'}
                    </Label>
                    <Select name="assignee_id" defaultValue="unassigned" disabled={isPending}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-bold text-gray-700">
                      Priority
                    </Label>
                    <Select
                      name="priority"
                      defaultValue={selectedTaskType === 'admin' ? 'low' : 'medium'}
                      disabled={isPending}
                    >
                      <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range - hide start_date for approval tasks */}
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedTaskType !== 'approval' && (
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-sm font-bold text-gray-700">
                        Start Date
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        disabled={isPending}
                        className="border-2 border-gray-200 focus:border-construction-blue"
                      />
                    </div>
                  )}

                  <div className={`space-y-2 ${selectedTaskType === 'approval' ? 'md:col-span-2' : ''}`}>
                    <Label htmlFor="due_date" className="text-sm font-bold text-gray-700">
                      {selectedTaskType === 'approval' ? 'Deadline' :
                       selectedTaskType === 'purchase' ? 'Order By Date' : 'Due Date'}
                    </Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      disabled={isPending}
                      className="border-2 border-gray-200 focus:border-construction-blue"
                    />
                  </div>
                </div>

                {/* Cost - only show for non-approval tasks */}
                {showCostFields && (
                  <div className="space-y-2">
                    <Label htmlFor="planned_cost" className="text-sm font-bold text-gray-700">
                      {selectedTaskType === 'purchase' ? 'Budget Estimate ($)' : 'Planned Cost ($)'}
                    </Label>
                    <Input
                      id="planned_cost"
                      name="planned_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isPending}
                      className="border-2 border-gray-200 focus:border-construction-blue"
                    />
                  </div>
                )}

                {/* Receipt Photo Upload - especially useful for purchase tasks */}
                <TaskReceiptUpload
                  receiptUrl={receiptPreview}
                  onReceiptChange={(file, preview) => {
                    setReceiptFile(file);
                    setReceiptPreview(preview);
                  }}
                  disabled={isPending}
                  showLabel={true}
                />

                {/* Hidden field for receipt URL (will be set after upload in real implementation) */}
                {receiptPreview && (
                  <input type="hidden" name="receipt_photo_url" value={receiptPreview} />
                )}

                {/* Navigation for Step 2 */}
                <div className="flex justify-between gap-4 pt-6 border-t-2 border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isPending}
                    className="border-2 gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel || (() => router.back())}
                      disabled={isPending}
                      className="border-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending || !selectedProjectId}
                      className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold gap-2"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : selectedTaskType === 'purchase' ? (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add & Materials
                          <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Task
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Materials (Purchase tasks only) */}
          {currentStep === 3 && selectedTaskType === 'purchase' && createdTaskId && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Add Materials</h3>
                    <p className="text-sm text-gray-600">
                      Search Home Depot products and add them to this purchase task
                    </p>
                  </div>
                </div>

                {/* Materials Manager in edit mode */}
                <TaskMaterialsManager
                  taskId={createdTaskId}
                  projectId={selectedProjectId}
                  mode="edit"
                />

                {/* Navigation for Step 3 */}
                <div className="flex justify-between gap-4 pt-6 border-t-2 border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipMaterials}
                    className="border-2"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (onSuccess) {
                        onSuccess();
                      } else {
                        router.push(`/app/tasks/${createdTaskId}`);
                      }
                    }}
                    className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
