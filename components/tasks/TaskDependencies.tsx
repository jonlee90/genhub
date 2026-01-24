"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Clock } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { removeTaskDependency } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskDependency, TaskDependent } from "@/types/db/task";

interface TaskDependenciesProps {
  taskId: string;
  projectId: string;
  dependencies: TaskDependency[];
  dependents: TaskDependent[];
}

const STATUS_ICON = {
  completed: { icon: CheckCircle, color: "text-green-600" },
  in_progress: { icon: Clock, color: "text-blue-600" },
  todo: { icon: Clock, color: "text-gray-400" },
  review: { icon: Clock, color: "text-purple-600" },
  blocked: { icon: AlertTriangle, color: "text-red-600" },
};

export function TaskDependencies({
  taskId,
  projectId,
  dependencies,
  dependents,
}: TaskDependenciesProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleRemove = async (dependsOnTaskId: string) => {
    setIsRemoving(dependsOnTaskId);
    const result = await removeTaskDependency(taskId, dependsOnTaskId);
    if (result.success) {
      setIsRemoving(null);
    } else {
      setIsRemoving(null);
    }
  };

  const getStatusDisplay = (status: string) => {
    const config = STATUS_ICON[status as keyof typeof STATUS_ICON] || STATUS_ICON.todo;
    const Icon = config.icon;
    return <Icon className={cn("h-4 w-4", config.color)} />;
  };

  return (
    <div className="space-y-6">
      {/* Dependencies (tasks this task depends on) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Blocked By
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks that must be completed before this task
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No dependencies. This task can start anytime.
            </p>
          ) : (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 bg-muted/50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusDisplay(dep.depends_on.status)}
                    <Link
                      href={`/app/tasks/${dep.depends_on.id}`}
                      className="font-medium hover:underline"
                    >
                      {dep.depends_on.title}
                    </Link>
                    <Badge
                      variant="secondary"
                      className={cn(
                        dep.depends_on.status === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      )}
                    >
                      {dep.depends_on.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(dep.depends_on.id)}
                    disabled={isRemoving === dep.depends_on.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {dependencies.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                {dependencies.every((d) => d.depends_on.status === "completed") ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">All dependencies completed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-600">
                      {dependencies.filter((d) => d.depends_on.status !== "completed").length} pending
                      dependencies
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependents (tasks that depend on this task) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Blocking
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tasks waiting for this task to be completed
          </p>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tasks are waiting on this one.
            </p>
          ) : (
            <div className="space-y-2">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 bg-muted/50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusDisplay(dep.task.status)}
                    <Link
                      href={`/app/tasks/${dep.task.id}`}
                      className="font-medium hover:underline"
                    >
                      {dep.task.title}
                    </Link>
                    <Badge
                      variant="secondary"
                      className={cn(
                        dep.task.status === "blocked"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {dep.task.status === "blocked" ? "Waiting" : dep.task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          {dependents.length > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Completing this task may unblock{" "}
              {dependents.filter((d) => d.task.status === "blocked").length} tasks.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
