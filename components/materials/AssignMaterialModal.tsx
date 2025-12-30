'use client';

import { useState, useTransition, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { assignMaterialToTask, createMaterialFromHomeDepot, getProjectPhases, getPhaseTasks } from '@/app/actions/materials';
import { useToast } from '@/hooks/use-toast';
import type { HomeDepotProduct } from '@/lib/services/home-depot-api';

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

export function AssignMaterialModal({ product, projects, onClose }: AssignMaterialModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [purchaserType, setPurchaserType] = useState<'gc' | 'pm' | 'subcontractor'>('gc');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingPhases, setIsLoadingPhases] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const { toast } = useToast();

  // Load phases when project is selected
  useEffect(() => {
    if (selectedProject) {
      console.log('Loading phases for project:', selectedProject);
      setIsLoadingPhases(true);
      setSelectedPhase('');
      setSelectedTask('');
      setTasks([]);

      getProjectPhases(selectedProject)
        .then((result) => {
          console.log('Phases response:', result);
          if (!result.success) {
            console.error('Error loading phases:', result.error);
            toast({
              title: 'Error',
              description: result.error || 'Failed to load project phases',
              variant: 'destructive',
            });
            setPhases([]);
          } else {
            console.log('Setting phases:', result.data);
            setPhases(result.data || []);
          }
          setIsLoadingPhases(false);
        })
        .catch((err) => {
          console.error('Unexpected error loading phases:', err);
          toast({
            title: 'Error',
            description: `Unexpected error: ${err.message}`,
            variant: 'destructive',
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
      console.log('Loading tasks for phase:', selectedPhase);
      setIsLoadingTasks(true);
      setSelectedTask('');

      getPhaseTasks(selectedPhase)
        .then((result) => {
          console.log('Tasks response:', result);
          if (!result.success) {
            console.error('Error loading tasks:', result.error);
            toast({
              title: 'Error',
              description: result.error || 'Failed to load tasks',
              variant: 'destructive',
            });
            setTasks([]);
          } else {
            console.log('Setting tasks:', result.data);
            setTasks(result.data || []);
          }
          setIsLoadingTasks(false);
        })
        .catch((err) => {
          console.error('Unexpected error loading tasks:', err);
          toast({
            title: 'Error',
            description: `Unexpected error: ${err.message}`,
            variant: 'destructive',
          });
          setTasks([]);
          setIsLoadingTasks(false);
        });
    } else {
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase]);

  const handleAssign = () => {
    // Validate all fields including empty placeholder
    if (!selectedProject || !selectedTask || selectedTask === '_empty' || !quantity || parseFloat(quantity) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      // Debug: Log product before passing to server action
      console.log('AssignMaterialModal - product being passed:', product);
      console.log('AssignMaterialModal - product.name:', product?.name);
      console.log('AssignMaterialModal - product keys:', Object.keys(product || {}));

      // Ensure the product is a plain object for serialization
      // Server Actions serialize objects - ensure all properties are preserved
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

      console.log('AssignMaterialModal - plain product:', plainProduct);

      // First, create the material from Home Depot product
      // Pass the actual HomeDepotProduct object directly
      const materialResult = await createMaterialFromHomeDepot(plainProduct as any);

      if (!materialResult.success || !materialResult.data) {
        toast({
          title: 'Error',
          description: materialResult.error || 'Failed to add material to catalog',
          variant: 'destructive',
        });
        return;
      }

      const materialId = materialResult.data.id;

      // Then assign it to the task
      const assignResult = await assignMaterialToTask({
        material_id: materialId,
        task_id: selectedTask,
        project_id: selectedProject,
        quantity: parseFloat(quantity),
        unit_cost: product.price,
        purchaser_type: purchaserType,
      });

      if (assignResult.success) {
        toast({
          title: 'Material Assigned',
          description: `${product.name} has been assigned to the task.`,
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: assignResult.error || 'Failed to assign material to task',
          variant: 'destructive',
        });
      }
    });
  };

  const totalCost = parseFloat(quantity || '0') * product.price;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      icon={Package}
      title="Assign Material to Task"
      maxWidth="2xl"
      leftActions={
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
      }
      rightActions={
        <Button
          onClick={handleAssign}
          disabled={isPending || !selectedProject || !selectedTask || selectedTask === '_empty' || !quantity || parseFloat(quantity) <= 0}
          className="bg-construction-green hover:bg-construction-green/90 text-white font-bold"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            'Assign Material'
          )}
        </Button>
      }
    >
      <div className="space-y-6">
          {/* Product Summary */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-construction-blue mb-2">{product.name}</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">SKU: {product.sku}</span>
              <span className="font-bold text-construction-blue">{formatPrice(product.price)} / unit</span>
            </div>
          </div>

          {/* Assignment Form */}
          <div className="space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-bold text-gray-700">
                Project *
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project" className="border-2">
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
            </div>

            {/* Phase Selection */}
            <div className="space-y-2">
              <Label htmlFor="phase" className="text-sm font-bold text-gray-700">
                Phase *
              </Label>
              <Select
                value={selectedPhase}
                onValueChange={setSelectedPhase}
                disabled={!selectedProject || isLoadingPhases}
              >
                <SelectTrigger id="phase" className="border-2">
                  <SelectValue placeholder={isLoadingPhases ? "Loading phases..." : "Select a phase"} />
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
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label htmlFor="task" className="text-sm font-bold text-gray-700">
                Task *
              </Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={!selectedPhase || isLoadingTasks}
              >
                <SelectTrigger id="task" className="border-2">
                  <SelectValue placeholder={isLoadingTasks ? "Loading tasks..." : "Select a task"} />
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
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-bold text-gray-700">
                Quantity *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border-2"
                placeholder="Enter quantity"
              />
            </div>

            {/* Purchaser Type */}
            <div className="space-y-2">
              <Label htmlFor="purchaser" className="text-sm font-bold text-gray-700">
                Who Will Purchase? *
              </Label>
              <Select value={purchaserType} onValueChange={(v: any) => setPurchaserType(v)}>
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
                <span className="font-bold text-gray-700">Total Cost:</span>
                <span className="text-2xl font-black text-construction-blue">{formatPrice(totalCost)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {quantity} × {formatPrice(product.price)} per unit
              </p>
            </div>

            {/* Warning for out of stock or special order */}
            {(product.stockStatus === 'out_of_stock' || product.stockStatus === 'special_order') && (
              <div className="flex items-start gap-2 p-3 bg-construction-red/5 border-2 border-construction-red/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-construction-red shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-construction-red text-sm">
                    {product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Special Order'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {product.stockStatus === 'out_of_stock'
                      ? 'This product is currently out of stock. You can still assign it, but procurement may be delayed.'
                      : 'This product requires special ordering. Lead time may be extended.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </BaseModal>
  );
}
