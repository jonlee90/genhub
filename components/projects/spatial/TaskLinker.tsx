'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Link2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseModal } from '@/components/ui/BaseModal';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateTask } from '@/app/actions/tasks';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  spatial_marker_id?: string | null;
  phase?: {
    id: string;
    name: string;
  };
}

interface TaskLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  markerId: string;
  markerTitle: string;
  projectTasks: Task[];
  onTaskLinked?: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  blocked: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};

export function TaskLinker({
  isOpen,
  onClose,
  markerId,
  markerTitle,
  projectTasks,
  onTaskLinked,
}: TaskLinkerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  console.log('[TaskLinker] Rendering with marker:', markerId, 'Tasks:', projectTasks.length);

  // Debug: Filter tasks based on search
  const filteredTasks = projectTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.phase?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug: Handle task linking
  const handleLinkTask = async (taskId: string) => {
    console.log('[TaskLinker] Linking task:', taskId, 'to marker:', markerId);
    setIsLinking(true);
    setSelectedTaskId(taskId);

    try {
      const formData = new FormData();
      formData.append('id', taskId);
      formData.append('spatial_marker_id', markerId);

      const result = await updateTask(formData);

      if (result.success) {
        console.log('[TaskLinker] Task linked successfully');
        toast.success('Task linked to 3D marker');
        onTaskLinked?.(taskId);
        onClose();
      } else {
        console.error('[TaskLinker] Failed to link task:', result.error);
        toast.error(result.error || 'Failed to link task');
      }
    } catch (error) {
      console.error('[TaskLinker] Error linking task:', error);
      toast.error('Failed to link task');
    } finally {
      setIsLinking(false);
      setSelectedTaskId(null);
    }
  };

  // Debug: Handle unlinking
  const handleUnlinkTask = async (taskId: string) => {
    console.log('[TaskLinker] Unlinking task:', taskId);
    setIsLinking(true);
    setSelectedTaskId(taskId);

    try {
      const formData = new FormData();
      formData.append('id', taskId);
      formData.append('spatial_marker_id', ''); // Clear the marker

      const result = await updateTask(formData);

      if (result.success) {
        console.log('[TaskLinker] Task unlinked successfully');
        toast.success('Task unlinked from marker');
        onTaskLinked?.(taskId);
      } else {
        console.error('[TaskLinker] Failed to unlink task:', result.error);
        toast.error(result.error || 'Failed to unlink task');
      }
    } catch (error) {
      console.error('[TaskLinker] Error unlinking task:', error);
      toast.error('Failed to unlink task');
    } finally {
      setIsLinking(false);
      setSelectedTaskId(null);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Task to Marker"
      size="lg"
    >
      <div className="space-y-4">
        {/* Marker Info */}
        <div className="flex items-center gap-3 p-4 bg-construction-blue/5 rounded-lg border-2 border-construction-blue/20">
          <div className="p-2 bg-construction-blue rounded-lg">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/70">
              Target Marker
            </div>
            <div className="text-sm font-bold text-gray-900">
              {markerTitle}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg',
              'border-2 border-gray-200',
              'focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-construction-blue/20',
              'placeholder:text-gray-400 text-sm'
            )}
          />
        </div>

        {/* Task List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm font-bold text-gray-900 mb-1">
                No tasks found
              </div>
              <div className="text-xs text-gray-500">
                Try adjusting your search query
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isLinked = task.spatial_marker_id === markerId;
              const isProcessing = isLinking && selectedTaskId === task.id;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all',
                    isLinked
                      ? 'bg-construction-blue/5 border-construction-blue'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                          {task.title}
                        </h4>
                        {isLinked && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-construction-blue/10 rounded text-xs font-mono font-bold text-construction-blue">
                            <CheckCircle2 className="h-3 w-3" />
                            Linked
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {task.phase && (
                          <div className="text-xs text-gray-600">
                            {task.phase.name}
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] px-2 py-0.5', STATUS_COLORS[task.status as keyof typeof STATUS_COLORS])}
                        >
                          {task.status}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] px-2 py-0.5', PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS])}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => isLinked ? handleUnlinkTask(task.id) : handleLinkTask(task.id)}
                      disabled={isProcessing}
                      className={cn(
                        'px-4 py-2 rounded-lg font-bold text-sm',
                        'flex items-center gap-2',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isLinked
                          ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100'
                          : 'bg-construction-blue text-white border-2 border-construction-blue hover:bg-blue-700'
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isLinked ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Unlink</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
}
