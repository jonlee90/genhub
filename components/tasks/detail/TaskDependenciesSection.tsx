/**
 * TaskDependenciesSection - Dependencies management wrapper
 * Extracted from TaskDetail.tsx for better maintainability
 * This is a thin wrapper around the existing TaskDependencies component
 */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TaskDependencies } from '../TaskDependencies';

interface Dependency {
  id: string;
  depends_on_task_id: string;
  depends_on: { id: string; title: string; status: string };
}

interface Dependent {
  id: string;
  task_id: string;
  task: { id: string; title: string; status: string };
}

interface TaskDependenciesSectionProps {
  taskId: string;
  projectId: string;
  dependencies: Dependency[];
  dependents: Dependent[];
}

export function TaskDependenciesSection({
  taskId,
  projectId,
  dependencies,
  dependents,
}: TaskDependenciesSectionProps) {
  return (
    <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Task Dependencies
        </h2>
        <TaskDependencies
          taskId={taskId}
          projectId={projectId}
          dependencies={dependencies}
          dependents={dependents}
        />
      </CardContent>
    </Card>
  );
}
