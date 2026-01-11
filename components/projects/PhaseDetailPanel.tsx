'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Clock, AlertTriangle, Ban, Calendar, Sparkles, Loader2, ListTodo, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { applyTaskTemplates } from '@/app/actions/phases';
import type { Database } from '@/types/database.types';
import { isTaskOverdue, formatDate } from '@/lib/date-utils';
import { TaskModalTrigger } from '@/components/tasks/TaskModalTrigger';
import { TaskModal } from '@/components/tasks/TaskModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn, formatPercentWhole } from '@/lib/utils';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/config/task-colors';

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

// Status icon mapping (icons are component-specific, colors come from shared config)
const STATUS_ICONS = {
  todo: Clock,
  in_progress: Clock,
  review: Clock,
  blocked: Ban,
  completed: CheckCircle2,
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

    startTransition(async () => {
      try {
        // applyTaskTemplates now finds the matching phase template by name automatically
        const result = await applyTaskTemplates(phase.id);

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

  const progressPercentageRaw = stats.totalTasks > 0
    ? (stats.completedTasks / stats.totalTasks) * 100
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
         
        <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">

            <div className="p-2 bg-[#001B51] rounded-lg">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#001B51]">{phase.name} Tasks</h4>
             
                
            {phase.notes && (
               <p className="text-xs text-gray-600 font-medium">{phase.notes}</p>
            )}
              
            </div>


            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                "text-sm font-semibold px-2.5 py-1 rounded-md",
                phaseStatus.color
              )}>
                {phaseStatus.label}
              </span>
            </div>
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
          
        </motion.div>

        {/* Progress Card - Creative Phase Progress Dashboard */}
        <motion.div
          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Header Strip */}
          <div className="h-1.5 bg-gradient-to-r from-[#001B51] via-[#001B51]/80 to-[#059669]" />

          <div className="p-4">
            {/* Top Section: Arc Gauge + Stats */}
            <div className="flex items-center gap-4">
              {/* Arc Progress Gauge */}
              <div className="relative flex-shrink-0">
                <svg width="80" height="48" viewBox="0 0 80 48" className="overflow-visible">
                  {/* Background arc */}
                  <path
                    d="M 8 44 A 32 32 0 0 1 72 44"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Progress arc - animated */}
                  <motion.path
                    d="M 8 44 A 32 32 0 0 1 72 44"
                    fill="none"
                    stroke="#001B51"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="100.53"
                    initial={{ strokeDashoffset: 100.53 }}
                    animate={{ strokeDashoffset: 100.53 - (progressPercentageRaw / 100) * 100.53 }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                  {/* Tick marks */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const angle = (Math.PI * tick) / 100;
                    const x1 = 40 - 26 * Math.cos(angle);
                    const y1 = 44 - 26 * Math.sin(angle);
                    const x2 = 40 - 30 * Math.cos(angle);
                    const y2 = 44 - 30 * Math.sin(angle);
                    return (
                      <line
                        key={tick}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={tick <= progressPercentageRaw ? '#001B51' : '#D1D5DB'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Center percentage */}
                <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                  <motion.span
                    className="text-lg font-black text-[#001B51] tabular-nums"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    {formatPercentWhole(progressPercentageRaw)}
                  </motion.span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* Completed */}
                <motion.div
                  className="flex items-center gap-2 p-2 bg-[#059669]/10 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Completed</p>
                    <p className="text-sm font-bold text-[#059669] tabular-nums">{stats.completedTasks}</p>
                  </div>
                </motion.div>

                {/* Remaining */}
                <motion.div
                  className="flex items-center gap-2 p-2 bg-[#001B51]/5 rounded-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Target className="w-4 h-4 text-[#001B51]" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Left</p>
                    <p className="text-sm font-bold text-[#001B51] tabular-nums">{stats.totalTasks - stats.completedTasks}</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Task Distribution Bar */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Task Distribution</span>
                <span className="text-xs font-bold text-gray-700 tabular-nums">{stats.totalTasks} total</span>
              </div>

              {stats.totalTasks > 0 ? (
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                  {/* Completed segment */}
                  {stats.completedTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#059669]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  )}
                  {/* In Progress segment (remaining - blocked - overdue) */}
                  {(() => {
                    const inProgressTasks = stats.totalTasks - stats.completedTasks - stats.blockedTasks - stats.overdueTasks;
                    return inProgressTasks > 0 ? (
                      <motion.div
                        className="h-full bg-[#3B82F6]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(inProgressTasks / stats.totalTasks) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                      />
                    ) : null;
                  })()}
                  {/* Overdue segment */}
                  {stats.overdueTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#F59E0B]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.overdueTasks / stats.totalTasks) * 100}%` }}
                      transition={{ duration: 0.8, delay: 1.0 }}
                    />
                  )}
                  {/* Blocked segment */}
                  {stats.blockedTasks > 0 && (
                    <motion.div
                      className="h-full bg-[#DC2626]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.blockedTasks / stats.totalTasks) * 100}%` }}
                      transition={{ duration: 0.8, delay: 1.1 }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-2.5 bg-gray-100 rounded-full" />
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#059669] rounded-full" />
                  <span className="text-[10px] text-gray-500">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                  <span className="text-[10px] text-gray-500">Active</span>
                </div>
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#F59E0B] rounded-full" />
                    <span className="text-[10px] text-gray-500">Overdue</span>
                  </div>
                )}
                {stats.blockedTasks > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#DC2626] rounded-full" />
                    <span className="text-[10px] text-gray-500">Blocked</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Contextual Insight Banner */}
            <motion.div
              className={cn(
                "mt-4 p-2.5 rounded-lg flex items-center gap-2",
                progressPercentageRaw === 100
                  ? "bg-[#059669]/10 border border-[#059669]/20"
                  : progressPercentageRaw >= 75
                    ? "bg-[#001B51]/5 border border-[#001B51]/10"
                    : stats.blockedTasks > 0 || stats.overdueTasks > 0
                      ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20"
                      : "bg-gray-50 border border-gray-100"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              {progressPercentageRaw === 100 ? (
                <>
                  <div className="p-1 bg-[#059669]/20 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <span className="text-xs font-medium text-[#059669]">Phase Complete! All tasks finished.</span>
                </>
              ) : progressPercentageRaw >= 75 ? (
                <>
                  <div className="p-1 bg-[#001B51]/10 rounded">
                    <TrendingUp className="w-3.5 h-3.5 text-[#001B51]" />
                  </div>
                  <span className="text-xs font-medium text-[#001B51]">Great progress! {stats.totalTasks - stats.completedTasks} tasks to go.</span>
                </>
              ) : stats.blockedTasks > 0 || stats.overdueTasks > 0 ? (
                <>
                  <div className="p-1 bg-[#F59E0B]/20 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  </div>
                  <span className="text-xs font-medium text-[#B45309]">
                    {stats.blockedTasks > 0 && stats.overdueTasks > 0
                      ? `${stats.blockedTasks} blocked, ${stats.overdueTasks} overdue - needs attention`
                      : stats.blockedTasks > 0
                        ? `${stats.blockedTasks} blocked task${stats.blockedTasks > 1 ? 's' : ''} - review dependencies`
                        : `${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} - consider priority`}
                  </span>
                </>
              ) : stats.totalTasks === 0 ? (
                <>
                  <div className="p-1 bg-gray-100 rounded">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">No tasks yet. Add tasks to track progress.</span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-gray-100 rounded">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Keep going! {stats.totalTasks - stats.completedTasks} tasks remaining.</span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>


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
              const statusConfig = TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG];
              const priorityConfig = TASK_PRIORITY_CONFIG[task.priority as keyof typeof TASK_PRIORITY_CONFIG];
              const StatusIcon = STATUS_ICONS[task.status as keyof typeof STATUS_ICONS];
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
                      task.status === 'completed' && 'bg-emerald-50 group-hover:bg-emerald-100',
                      task.status === 'blocked' && 'bg-red-50 group-hover:bg-red-100',
                      task.status === 'in_progress' && 'bg-blue-50 group-hover:bg-blue-100',
                      task.status === 'todo' && 'bg-gray-50 group-hover:bg-gray-100',
                      task.status === 'review' && 'bg-amber-50 group-hover:bg-amber-100'
                    )}>
                      <StatusIcon className={cn("h-5 w-5", statusConfig.iconColor)} />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-[#001B51] transition-colors mb-2.5 leading-snug">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold border-2", statusConfig.badgeColor)}
                        >
                          {statusConfig.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold border-2", priorityConfig.badgeColor)}
                        >
                          {priorityConfig.label.toUpperCase()}
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
