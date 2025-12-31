'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Building2, ClipboardCheck, Hammer, DollarSign, User as UserIcon } from 'lucide-react';
import type { EntityType } from '@/types/chat.types';

interface EntityMentionProps {
  type: EntityType;
  id: string;
  displayName: string;
  onRemove?: () => void;
  className?: string;
}

// Debug: Entity mention chip/badge component for MessageInput
export function EntityMention({ type, id, displayName, onRemove, className }: EntityMentionProps) {
  console.log('[EntityMention] Rendering:', { type, id, displayName });

  const config = getEntityConfig(type);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border-2',
        'bg-construction-blue text-white shadow-sm',
        'border-construction-blue/50',
        'transition-all duration-200',
        'group',
        className
      )}
    >
      {/* Debug: Entity icon */}
      <config.icon className="h-3.5 w-3.5 shrink-0" />

      {/* Debug: Display name */}
      <span className="text-xs font-bold max-w-[200px] truncate">{displayName}</span>

      {/* Debug: Remove button (if onRemove provided) */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
            console.log('[EntityMention] Removed:', { type, id, displayName });
          }}
          className={cn(
            'ml-0.5 p-0.5 rounded transition-colors',
            'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30'
          )}
          aria-label="Remove mention"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.span>
  );
}

// Debug: Read-only mention badge (for displaying in messages)
export function EntityMentionBadge({ type, id, displayName, onClick }: EntityMentionProps & { onClick?: () => void }) {
  const config = getEntityConfig(type);

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border-2',
        'bg-construction-blue/10 hover:bg-construction-blue/20',
        'border-construction-blue/30 hover:border-construction-blue/50',
        'transition-all duration-200',
        'cursor-pointer'
      )}
    >
      <config.icon className={cn('h-3.5 w-3.5', config.color)} />
      <span className="text-xs font-bold text-construction-blue max-w-[200px] truncate">
        {displayName}
      </span>
    </motion.button>
  );
}

// Debug: Helper functions

function getEntityConfig(type: EntityType) {
  const configs = {
    project: {
      icon: Building2,
      color: 'text-construction-blue',
      label: 'Project',
    },
    task: {
      icon: ClipboardCheck,
      color: 'text-construction-blue',
      label: 'Task',
    },
    material: {
      icon: Hammer,
      color: 'text-construction-accent',
      label: 'Material',
    },
    expense: {
      icon: DollarSign,
      color: 'text-construction-green',
      label: 'Expense',
    },
    user: {
      icon: UserIcon,
      color: 'text-construction-blue',
      label: 'User',
    },
  };

  return configs[type] || configs.user;
}
