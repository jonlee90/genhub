'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, AlertTriangle, Ban, ArrowUpDown, Wrench, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { updateTaskStatus } from '@/app/actions/tasks';
import type { Database } from '@/types/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
};

// Phase type for project context
type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  /** When provided, we're in project context - look up phase from this array */
  phases?: Phase[];
}

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-200 text-gray-700', icon: null, animate: false },
  in_progress: { label: 'In Progress', color: 'bg-[#001B51] text-white', icon: Wrench, animate: true },
  review: { label: 'Review', color: 'bg-[#3C3C3C] text-white', icon: null, animate: false },
  blocked: { label: 'Blocked', color: 'bg-[#DC2626] text-white', icon: AlertTriangle, animate: false },
  completed: { label: 'Completed', color: 'bg-[#059669] text-white', icon: CheckCircle, animate: false },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-[#059669]/10 text-[#059669] font-bold' },
  medium: { label: 'Medium', color: 'bg-[#FFB627]/10 text-[#FFB627] font-bold' },
  high: { label: 'High', color: 'bg-[#DC2626]/10 text-[#DC2626] font-bold' },
};

type SortField = 'title' | 'project' | 'due_date' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export function TaskList({ tasks, onTaskClick, phases }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Determine if we're in project context
  const isProjectContext = !!phases;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'project':
        comparison = (a.project?.name || '').localeCompare(b.project?.name || '');
        break;
      case 'due_date':
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'status':
        const statusOrder = { blocked: 0, in_progress: 1, review: 2, todo: 3, completed: 4 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => {
    if (newStatus === currentStatus) return;

    if (newStatus === 'blocked') {
      const reason = window.prompt('Please enter a reason for blocking this task:');
      if (!reason) return;
      await updateTaskStatus(taskId, newStatus, reason);
    } else {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    // Parse date components manually to avoid UTC timezone issues
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    // Parse due date properly to avoid UTC timezone issues
    const [year, month, day] = task.due_date.split('T')[0].split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Get phase name - from phases array in project context, or from task.phase otherwise
  const getPhaseName = (task: Task) => {
    if (phases) {
      const phase = phases.find((p) => p.id === task.phase_id);
      return phase?.name || '-';
    }
    return task.phase?.name || '-';
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-white hover:text-white hover:bg-white/10 font-black text-xs uppercase tracking-wider"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className={cn(
        "ml-2 h-4 w-4 transition-transform",
        sortField === field && sortOrder === 'desc' && "rotate-180"
      )} />
    </Button>
  );

  return (
    <div className="rounded-lg border-2 border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-[#001B51] text-white shadow-construction z-10">
          <TableRow className="border-none hover:bg-[#001B51]">
            <TableHead className="w-[300px] text-white">
              <SortButton field="title" label="Title" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="project" label="Project" />
            </TableHead>
            <TableHead className="text-white font-black text-xs uppercase tracking-wider">Phase</TableHead>
            <TableHead className="text-white font-black text-xs uppercase tracking-wider">Assignee</TableHead>
            <TableHead className="text-white">
              <SortButton field="due_date" label="Due Date" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="priority" label="Priority" />
            </TableHead>
            <TableHead className="text-white">
              <SortButton field="status" label="Status" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const taskIsOverdue = isOverdue(task);

            return (
              <TableRow
                key={task.id}
                className="group hover:bg-[#001B51]/5 transition-colors duration-200 cursor-pointer"
              >
                {/* Title */}
                <TableCell>
                  <button
                    onClick={() => onTaskClick?.(task)}
                    className="font-bold text-sm hover:text-[#001B51] transition-colors flex items-center gap-2 relative group text-left"
                  >
                    {task.status === 'blocked' && (
                      <Ban className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    {taskIsOverdue && task.status !== 'blocked' && (
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <span className="line-clamp-1 relative">
                      {task.title}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#001B51] group-hover:w-full transition-all duration-300" />
                    </span>
                  </button>
                </TableCell>

                {/* Project */}
                <TableCell>
                  {task.project ? (
                    <Link
                      href={`/app/projects/${task.project.id}`}
                      className="hover:underline text-sm"
                    >
                      {task.project.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Phase */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getPhaseName(task)}
                  </span>
                </TableCell>

                {/* Assignee */}
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unassigned</span>
                  )}
                </TableCell>

                {/* Due Date */}
                <TableCell>
                  {task.due_date ? (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm',
                        taskIsOverdue && 'text-red-600'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.due_date)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <Badge variant="secondary" className={cn('font-bold', priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                </TableCell>

                {/* Status (Inline Edit) */}
                <TableCell>
                  <motion.div
                    animate={statusConfig.animate ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value as TaskStatus, task.status)
                      }
                    >
                      <SelectTrigger className={cn('w-[140px] h-8 font-bold', statusConfig.color)}>
                        <div className="flex items-center gap-1.5">
                          {statusConfig.icon && <statusConfig.icon className="w-3 h-3" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-1.5">
                              {config.icon && <config.icon className="w-3 h-3" />}
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
