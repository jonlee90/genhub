'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Truck, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { updateMaterialAssignment, getMaterialAssignmentsByTask } from '@/app/actions/materials';
import { useToast } from '@/hooks/use-toast';

interface Material {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  unit_of_measure: string;
  product_image_url: string | null;
}

interface MaterialAssignment {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  procurement_status: 'needed' | 'ordered' | 'delivered' | 'installed';
  purchaser_type: 'gc' | 'pm' | 'subcontractor';
  ordered_date: string | null;
  estimated_delivery_date: string | null;
  delivered_date: string | null;
  installed_date: string | null;
  material: Material;
}

interface TaskMaterialsProps {
  taskId: string;
  canEdit: boolean;
}

const PROCUREMENT_STATUS_CONFIG = {
  needed: {
    label: 'Need to Order',
    icon: Package,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-400',
  },
  ordered: {
    label: 'Ordered',
    icon: TrendingUp,
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
    dotColor: 'bg-construction-blue',
  },
  delivered: {
    label: 'Delivered',
    icon: Truck,
    color: 'bg-amber-50 text-amber-700 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  installed: {
    label: 'Installed',
    icon: CheckCircle2,
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
    dotColor: 'bg-construction-green',
  },
};

export function TaskMaterials({ taskId, canEdit }: TaskMaterialsProps) {
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, [taskId]);

  const loadMaterials = async () => {
    console.log('[TaskMaterials] Loading materials for taskId:', taskId);
    setIsLoading(true);

    // Use server action for proper authentication
    const result = await getMaterialAssignmentsByTask(taskId);

    console.log('[TaskMaterials] Server action result:', result);

    if (result.success && result.data) {
      // Transform data to match expected interface
      const transformedData = result.data.map((assignment: any) => ({
        id: assignment.id,
        quantity: assignment.quantity,
        unit_cost: assignment.unit_cost,
        total_cost: assignment.total_cost,
        procurement_status: assignment.procurement_status,
        purchaser_type: assignment.purchaser_type,
        ordered_date: assignment.ordered_date,
        estimated_delivery_date: assignment.estimated_delivery_date,
        delivered_date: assignment.delivered_date,
        installed_date: assignment.installed_date,
        material: assignment.material
      }));
      setMaterials(transformedData);
    } else {
      console.error('[TaskMaterials] Error:', result.error);
    }

    setIsLoading(false);
  };

  const handleStatusUpdate = (materialAssignmentId: string, newStatus: string) => {
    setUpdatingId(materialAssignmentId);
    startTransition(async () => {
      const result = await updateMaterialAssignment({
        id: materialAssignmentId,
        procurement_status: newStatus as 'needed' | 'ordered' | 'delivered' | 'installed',
      });

      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `Material status updated to ${PROCUREMENT_STATUS_CONFIG[newStatus as keyof typeof PROCUREMENT_STATUS_CONFIG].label}`,
        });
        await loadMaterials();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update material status',
          variant: 'destructive',
        });
      }
      setUpdatingId(null);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalCost = materials.reduce((sum, m) => sum + m.total_cost, 0);

  if (isLoading) {
    return (
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (materials.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Package className="h-4 w-4" />
            <p className="text-sm">No materials assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-construction">
      <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black text-construction-blue flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials ({materials.length})
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-xl font-black text-construction-blue">{formatCurrency(totalCost)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <AnimatePresence>
            {materials.map((assignment, index) => {
              const statusConfig = PROCUREMENT_STATUS_CONFIG[assignment.procurement_status];
              const StatusIcon = statusConfig.icon;
              const isUpdating = updatingId === assignment.id;

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Material Image or Icon */}
                    <div className="shrink-0">
                      {assignment.material.product_image_url ? (
                        <div className="w-16 h-16 rounded-lg border-2 border-gray-200 overflow-hidden bg-white">
                          <img
                            src={assignment.material.product_image_url}
                            alt={assignment.material.product_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                          <Wrench className="h-6 w-6 text-construction-blue" />
                        </div>
                      )}
                    </div>

                    {/* Material Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h4 className="font-bold text-construction-blue line-clamp-1">
                          {assignment.material.product_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>SKU: {assignment.material.sku}</span>
                          <span className="text-gray-400">•</span>
                          <Badge variant="outline" className="font-semibold capitalize text-xs">
                            {assignment.material.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity and Cost */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Quantity:</span>{' '}
                          <span className="font-bold text-gray-900">
                            {assignment.quantity} {assignment.material.unit_of_measure}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit Cost:</span>{' '}
                          <span className="font-bold text-gray-900">{formatCurrency(assignment.unit_cost)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>{' '}
                          <span className="font-bold text-construction-blue">{formatCurrency(assignment.total_cost)}</span>
                        </div>
                      </div>

                      {/* Purchaser */}
                      <div className="text-sm">
                        <span className="text-gray-600">Purchaser:</span>{' '}
                        <Badge variant="outline" className="ml-1 capitalize font-semibold">
                          {assignment.purchaser_type === 'gc' ? 'General Contractor' :
                           assignment.purchaser_type === 'pm' ? 'Project Manager' : 'Subcontractor'}
                        </Badge>
                      </div>

                      {/* Dates */}
                      {(assignment.ordered_date || assignment.delivered_date || assignment.installed_date) && (
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          {assignment.ordered_date && (
                            <div>
                              <div className="text-gray-500 font-semibold">Ordered</div>
                              <div className="text-gray-900">{formatDate(assignment.ordered_date)}</div>
                            </div>
                          )}
                          {assignment.delivered_date && (
                            <div>
                              <div className="text-gray-500 font-semibold">Delivered</div>
                              <div className="text-gray-900">{formatDate(assignment.delivered_date)}</div>
                            </div>
                          )}
                          {assignment.installed_date && (
                            <div>
                              <div className="text-gray-500 font-semibold">Installed</div>
                              <div className="text-gray-900">{formatDate(assignment.installed_date)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Update */}
                    <div className="shrink-0 space-y-2">
                      {canEdit ? (
                        <Select
                          value={assignment.procurement_status}
                          onValueChange={(value) => handleStatusUpdate(assignment.id, value)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className={cn('w-[160px] border-2 font-semibold', statusConfig.color)}>
                            <div className="flex items-center gap-2">
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <div className={cn('h-2 w-2 rounded-full', statusConfig.dotColor)} />
                                  <StatusIcon className="h-3 w-3" />
                                </>
                              )}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="needed">
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3" />
                                Need to Order
                              </div>
                            </SelectItem>
                            <SelectItem value="ordered">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                Ordered
                              </div>
                            </SelectItem>
                            <SelectItem value="delivered">
                              <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3" />
                                Delivered
                              </div>
                            </SelectItem>
                            <SelectItem value="installed">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" />
                                Installed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn('font-semibold border-2 px-3 py-2', statusConfig.color)}>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', statusConfig.dotColor)} />
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </div>
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
