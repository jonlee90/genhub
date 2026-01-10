'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Clock, AlertTriangle, Ban, Calendar, Sparkles, Loader2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { applyTaskTemplates } from '@/app/actions/phases';
import type { Database } from '@/types/database.types';
import { isTaskOverdue, formatDate } from '@/lib/date-utils';
import { TaskModalTrigger } from '@/components/tasks/TaskModalTrigger';
import { TaskModal } from '@/components/tasks/TaskModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Phase = Database['public']['Tables']['project_phases']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignees?: Array<{
    id: string;
    user_id: string | null;
    subcontractor_id: string | null;
    user?: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
    subcontractor?: {
      id: string;
      contact_name: string;
      company_name: string;
    } | null;
  }>;
};

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
  todo: { label: 'To Do', icon: Clock, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  review: { label: 'Review', icon: Clock, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-50 text-red-700 border-red-200' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200' },
};

const PRIORITY_CONFIG = {
  low: 'bg-gray-50 text-gray-600 border-gray-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-red-50 text-red-600 border-red-200',
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
  console.log('[PhaseDetailPanel] Rendering phase detail:', phase.name);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [applyingTemplates, setApplyingTemplates] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Debug: Log when editingTask changes
  console.log('[PhaseDetailPanel] editingTask state:', editingTask?.id, editingTask?.title);

  const statusConfig = {
    not_started: { label: 'Not Started', color: 'text-gray-700' },
    in_progress: { label: 'In Progress', color: 'text-[#001B51]' },
    completed: { label: 'Completed', color: 'text-[#059669]' },
  };

  const phaseStatus = statusConfig[phase.status as keyof typeof statusConfig];

  // Handle apply task templates
  const handleApplyTemplates = async () => {
    console.log('[PhaseDetailPanel] Applying task templates to phase:', phase.id);
    setApplyingTemplates(true);

    const phaseTemplateId = 'placeholder-template-id';

    startTransition(async () => {
      try {
        const result = await applyTaskTemplates(phase.id, phaseTemplateId);

        if (result.success && result.tasksCreated) {
          toast.success(`${result.tasksCreated} tasks created from templates`);
          router.refresh();
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (error) {
        console.error('[PhaseDetailPanel] Error applying templates:', error);
        toast.error('Failed to apply task templates');
      } finally {
        setApplyingTemplates(false);
      }
    });
  };

  const progressPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT COLUMN - Phase Info */}
      <div className="space-y-5">
        {/* Header Section */}
        <motion.div
          className="flex items-start justify-between gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-[#001B51] truncate">{phase.name}</h3>
              <span className={cn(
                "text-sm font-semibold px-2.5 py-1 rounded-md",
                phaseStatus.color
              )}>
                {phaseStatus.label}
              </span>
            </div>
            {phase.notes && (
              <p className="text-sm text-gray-600 leading-relaxed">{phase.notes}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </motion.div>

        {/* Date Cards Grid */}
        {(phase.started_at || phase.completed_at) && (
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Start Date Card */}
            {phase.started_at && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Started</p>
                <div className="flex items-center gap-2 text-[#001B51]">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    {new Date(phase.started_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Completed Date Card */}
            {phase.completed_at && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Completed</p>
                <div className="flex items-center gap-2 text-[#059669]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    {new Date(phase.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Warning Alerts */}
        {(stats.blockedTasks > 0 || stats.overdueTasks > 0) && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {stats.blockedTasks > 0 && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">
                    {stats.blockedTasks} Blocked Task{stats.blockedTasks > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-600">Requires immediate attention</p>
                </div>
              </div>
            )}

            {stats.overdueTasks > 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-yellow-700">
                    {stats.overdueTasks} Overdue Task{stats.overdueTasks > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-600">Past due date</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-3 pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleApplyTemplates}
            disabled={applyingTemplates || isPending}
            variant="outline"
            className="w-full border-2 border-[#001B51]/20 text-[#001B51] hover:bg-[#001B51]/5 font-bold h-11 transition-all"
          >
            {applyingTemplates ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying Templates...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Task Templates
              </>
            )}
          </Button>
          <TaskModalTrigger
            projects={projects}
            teamMembers={teamMembers}
            preselectedProjectId={projectId}
            preselectedPhaseId={phase.id}
            variant="default"
            size="default"
            label="Add New Task"
            className="w-full bg-[#001B51] hover:bg-[#001B51]/90 text-white font-bold shadow-construction h-11 transition-all"
          />
        </motion.div>

        {/* Progress Card - Compact version below action buttons */}
        <motion.div
          className="bg-gradient-to-r from-[#001B51] to-[#001B51]/90 rounded-xl p-4 text-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <ListTodo className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tabular-nums leading-none">{progressPercentage}%</span>
                  <span className="text-sm text-white/60 tabular-nums">
                    ({stats.completedTasks}/{stats.totalTasks})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-[120px]">
              <Progress
                value={progressPercentage}
                className="h-2 bg-white/20 rounded-full overflow-hidden"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN - Task List */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
          <div className="p-2 bg-[#001B51] rounded-lg">
            <ListTodo className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#001B51]">Phase Tasks</h4>
            <p className="text-xs text-gray-600 font-medium">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} in this phase
            </p>
          </div>
        </div>

        {/* Task List with Fixed Height and Scroll */}
        {tasks.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border-2 border-dashed border-gray-300"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-2xl flex items-center justify-center">
              <ListTodo className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-bold mb-1">No Tasks Yet</p>
            <p className="text-xs text-gray-500">Click "Add New Task" to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {tasks.map((task) => {
              const taskStatus = TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG];
              const StatusIcon = taskStatus.icon;
              const isOverdue = isTaskOverdue(task.due_date, task.status);

              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#001B51]/40 hover:shadow-construction hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[PhaseDetailPanel] Task clicked:', task.id, task.title);
                    setEditingTask(task);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      console.log('[PhaseDetailPanel] Task key activated:', task.id, task.title);
                      setEditingTask(task);
                    }
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Status Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      task.status === 'completed' && 'bg-green-50 group-hover:bg-green-100',
                      task.status === 'blocked' && 'bg-red-50 group-hover:bg-red-100',
                      task.status === 'in_progress' && 'bg-blue-50 group-hover:bg-blue-100',
                      task.status === 'todo' && 'bg-gray-50 group-hover:bg-gray-100',
                      task.status === 'review' && 'bg-purple-50 group-hover:bg-purple-100'
                    )}>
                      <StatusIcon className={cn(
                        "h-5 w-5",
                        task.status === 'completed' && 'text-green-600',
                        task.status === 'blocked' && 'text-red-600',
                        task.status === 'in_progress' && 'text-blue-600',
                        task.status === 'todo' && 'text-gray-500',
                        task.status === 'review' && 'text-purple-600'
                      )} />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-[#001B51] transition-colors mb-2.5 leading-snug">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold border-2", taskStatus.color)}
                        >
                          {taskStatus.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold border-2", PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG])}
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                        {/* Assignee Avatars */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex -space-x-1.5 ml-auto">
                            {task.assignees.slice(0, 3).map((a) => {
                              const name = a.user?.name || a.subcontractor?.contact_name || '?';
                              const isUser = !!a.user_id;
                              return (
                                <Avatar key={a.id} className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={a.user?.avatar_url || undefined} />
                                  <AvatarFallback className={cn("text-[9px] text-white", isUser ? "bg-[#001B51]" : "bg-orange-600")}>
                                    {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {task.assignees.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-600">+{task.assignees.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className={cn(
                        "flex-shrink-0 flex flex-col items-end gap-1",
                        isOverdue ? 'text-red-600' : 'text-gray-600'
                      )}>
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold tabular-nums leading-none">
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          mode="edit"
          task={editingTask}
          projects={projects}
          teamMembers={teamMembers}
          onSuccess={() => {
            setEditingTask(null);
            router.refresh();
          }}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
