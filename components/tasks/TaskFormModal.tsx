'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList } from 'lucide-react';
import { CreateTaskForm } from './CreateTaskForm.tsx';
import { Button } from '@/components/ui/button';

interface TaskFormModalProps {
  isOpen: boolean;
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
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
}

export function TaskFormModal({
  isOpen,
  onClose,
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onSuccess,
}: TaskFormModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Subtle blur with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900/60 via-gray-900/70 to-construction-blue/30 backdrop-blur-xl"
            onClick={handleClose}
          >
            {/* Subtle grid pattern (very faint) */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #001B51 1px, transparent 1px),
                  linear-gradient(to bottom, #001B51 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
              }}
            />
          </motion.div>

          {/* Modal Container - Center aligned */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1], // Custom easing for smooth, natural motion
              }}
              className="relative w-full max-w-4xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main Modal - Glass morphism card */}
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200/60">
                {/* Subtle construction accent - Thin colored top border */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue opacity-90" />

                {/* Header */}
                <div className="relative px-8 pt-10 pb-8 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="flex items-start gap-5"
                    >
                      {/* Icon badge - Minimal, professional */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-construction-blue to-construction-blue/80 flex items-center justify-center shadow-lg shadow-construction-blue/20">
                        <ClipboardList className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>

                      {/* Title and description */}
                      <div className="space-y-2 pt-0.5">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                          Create New Task
                        </h2>
                        <p className="text-base text-gray-600 leading-relaxed max-w-lg">
                          Define work scope, assign team members, and set priorities for your project.
                        </p>
                      </div>
                    </motion.div>

                    {/* Close Button - Minimal, elegant */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <Button
                        onClick={handleClose}
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" strokeWidth={2} />
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Form Content Area - Scrollable with smooth scrollbar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="relative max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                >
                  {/* Form Container */}
                  <div className="relative p-8">
                    <CreateTaskForm
                      projects={projects}
                      teamMembers={teamMembers}
                      preselectedProjectId={preselectedProjectId}
                      preselectedPhaseId={preselectedPhaseId}
                      onSuccess={() => {
                        onSuccess?.();
                        handleClose();
                      }}
                    />
                  </div>
                </motion.div>

                {/* Footer - Minimal branding accent */}
                <div className="px-8 py-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      All fields marked with <span className="text-construction-accent">*</span> are required
                    </span>
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-construction-blue/60" />
                      <span className="text-xs font-medium">GenHub</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle glow effect around modal */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-construction-blue/5 via-transparent to-construction-accent/5 rounded-3xl blur-3xl" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
