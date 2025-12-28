'use client';

import { X, CheckCircle2, Clock, AlertTriangle, Ban, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Database } from '@/types/database.types';
import { isTaskOverdue, formatDate } from '@/lib/date-utils';
import { TaskModalTrigger } from '@/components/tasks/TaskModalTrigger';

type Phase = Database['public']['Tables']['project_phases']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface PhaseDetailPanelProps {
  phase: Phase;
  tasks: Task[];
  stats: PhaseStats;
  projectId: string;
  onClose: () => void;
  projects: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
}

const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', icon: Clock, color: 'bg-purple-100 text-purple-800' },
  blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
};

const PRIORITY_CONFIG = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-red-100 text-red-600',
};

export function PhaseDetailPanel({
  phase,
  tasks,
  stats,
  projectId,
  onClose,
  projects,
  teamMembers,
}: PhaseDetailPanelProps) {
  const statusConfig = {
    not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  };

  const phaseStatus = statusConfig[phase.status as keyof typeof statusConfig];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{phase.name}</h3>
            <Badge className={phaseStatus.color}>{phaseStatus.label}</Badge>
          </div>
          {phase.notes && (
            <p className="text-sm text-muted-foreground mt-1">{phase.notes}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Progress</p>
          <div className="flex items-center gap-2">
            <Progress value={phase.completion_percentage} className="flex-1 h-2" />
            <span className="text-sm font-medium">{phase.completion_percentage}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="text-lg font-semibold">
            {stats.completedTasks} / {stats.totalTasks}
          </p>
        </div>

        {phase.started_at && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(phase.started_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {phase.completed_at && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(phase.completed_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Warning Banners */}
      {stats.blockedTasks > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Ban className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">
            {stats.blockedTasks} blocked task{stats.blockedTasks > 1 ? 's' : ''} in this phase
          </span>
        </div>
      )}

      {stats.overdueTasks > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-700">
            {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} in this phase
          </span>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Tasks</h4>
          <TaskModalTrigger
            projects={projects}
            teamMembers={teamMembers}
            preselectedProjectId={projectId}
            preselectedPhaseId={phase.id}
            variant="outline"
            size="sm"
            label="Add Task"
          />
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks in this phase yet
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tasks.map((task) => {
              const taskStatus = TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG];
              const StatusIcon = taskStatus.icon;
              const isOverdue = isTaskOverdue(task.due_date, task.status);

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <StatusIcon
                    className={`h-4 w-4 flex-shrink-0 ${
                      task.status === 'completed'
                        ? 'text-green-500'
                        : task.status === 'blocked'
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={taskStatus.color}>
                        {taskStatus.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  {task.due_date && (
                    <div
                      className={`text-xs flex items-center gap-1 ${
                        isOverdue ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
