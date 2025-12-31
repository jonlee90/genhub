'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ClipboardCheck, Calendar, Flag, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EntityPreviewSkeleton, EntityPreviewError } from '../EntityPreview';
import { useRouter } from 'next/navigation';

interface TaskPreviewProps {
  id: string;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  assignee: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

// Debug: Task preview card component
export function TaskPreview({ id }: TaskPreviewProps) {
  const [task, setTask] = useState<TaskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  console.log('[TaskPreview] Rendering for task:', id);

  // Debug: Fetch task data
  useEffect(() => {
    async function fetchTask() {
      console.log('[TaskPreview] Fetching task data:', id);

      try {
        const response = await fetch(`/api/chat/entity-preview?type=task&id=${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch task');
        }

        console.log('[TaskPreview] Task data loaded:', data);
        setTask(data);
      } catch (err: any) {
        console.error('[TaskPreview] Error fetching task:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTask();
  }, [id]);

  // Debug: Loading state
  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  // Debug: Error state
  if (error || !task) {
    return <EntityPreviewError error={error || 'Task not found'} />;
  }

  // Debug: Status badge variant
  const statusVariant = getStatusVariant(task.status);

  // Debug: Priority indicator
  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <motion.div
      onClick={() => router.push(`/app/tasks/${id}`)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full max-w-md bg-white border-2 border-construction-blue rounded-xl p-4',
        'hover:shadow-construction-lg transition-all duration-200 cursor-pointer',
        'group'
      )}
    >
      {/* Debug: Header with icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20 shrink-0">
          <ClipboardCheck className="h-5 w-5 text-construction-blue" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue group-hover:text-blue-700 transition-colors">
            {task.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              className={cn(
                'text-[10px] font-bold px-2 py-0.5',
                statusVariant.bg,
                statusVariant.text
              )}
            >
              {task.status}
            </Badge>
            {task.priority && (
              <div className="flex items-center gap-1">
                <Flag className={cn('h-3 w-3', priorityConfig.color)} />
                <span className={cn('text-xs font-bold', priorityConfig.color)}>
                  {task.priority}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug: Assignee and due date */}
      <div className="grid grid-cols-2 gap-3">
        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border-2 border-gray-200">
              <AvatarImage src={task.assignee.avatar_url || undefined} />
              <AvatarFallback className="bg-construction-blue text-white text-[10px] font-black">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-700 truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <UserIcon className="h-4 w-4" />
            <span className="text-xs">Unassigned</span>
          </div>
        )}

        {/* Due date */}
        {task.due_date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-construction-blue" />
            <span className="text-xs text-gray-700">{formatDate(task.due_date)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">No due date</span>
          </div>
        )}
      </div>

      {/* Debug: Footer hint */}
      <div className="mt-3 pt-3 border-t-2 border-gray-100">
        <p className="text-[10px] font-mono text-gray-500">
          Click to view task details
        </p>
      </div>
    </motion.div>
  );
}

// Debug: Helper functions

function getStatusVariant(status: string): { bg: string; text: string } {
  const variants: Record<string, { bg: string; text: string }> = {
    todo: { bg: 'bg-gray-200', text: 'text-gray-700' },
    in_progress: { bg: 'bg-construction-blue/20', text: 'text-construction-blue' },
    blocked: { bg: 'bg-construction-red/20', text: 'text-construction-red' },
    done: { bg: 'bg-construction-green/20', text: 'text-construction-green' },
  };

  return variants[status.toLowerCase().replace(' ', '_')] || variants.todo;
}

function getPriorityConfig(priority: string | null): { color: string } {
  if (!priority) return { color: 'text-gray-400' };

  const configs: Record<string, { color: string }> = {
    low: { color: 'text-gray-500' },
    medium: { color: 'text-construction-yellow' },
    high: { color: 'text-construction-red' },
  };

  return configs[priority.toLowerCase()] || configs.low;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
