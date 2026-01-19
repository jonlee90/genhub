/**
 * TaskMaterialsSection - Materials and expenses tabs wrapper
 * Extracted from TaskDetail.tsx for better maintainability
 */
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskMaterials } from '../TaskMaterials';
import { Package, Receipt } from 'lucide-react';

interface TaskMaterialsSectionProps {
  taskId: string;
}

export function TaskMaterialsSection({
  taskId,
}: TaskMaterialsSectionProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'expenses'>('materials');

  const handleMaterialsTab = useCallback(() => setActiveTab('materials'), []);
  const handleExpensesTab = useCallback(() => setActiveTab('expenses'), []);

  return (
    <Card className="border-2 border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Materials & Expenses
        </h2>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'materials' | 'expenses')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials" className="gap-2">
              <Package className="w-4 h-4" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="w-4 h-4" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            <TaskMaterials
              taskId={taskId}
              canEdit={true}
            />
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <TaskMaterials
              taskId={taskId}
              canEdit={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
