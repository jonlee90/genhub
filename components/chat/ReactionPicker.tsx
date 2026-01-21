'use client';

/**
 * ReactionPicker - Emoji picker for message reactions
 *
 * Features:
 * - Grid layout with construction-themed emojis (10 emojis)
 * - Click to select and toggle reaction
 * - Auto-close after selection
 * - Industrial design with categories
 */

import { m as motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CONSTRUCTION_EMOJIS } from '@/types/db/chat';
import { X } from 'lucide-react';

interface ReactionPickerProps {
  messageId: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Debug: Emoji picker component
export function ReactionPicker({ messageId, onSelect, onClose, isOpen }: ReactionPickerProps) {
  console.log('[ReactionPicker] Rendering for message:', messageId, 'Open:', isOpen);

  const handleSelect = (emoji: string) => {
    console.log('[ReactionPicker] Emoji selected:', emoji);
    onSelect(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop to close picker on outside click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            aria-label="Close reaction picker"
          />

          {/* Debug: Picker popover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute z-50 mt-2',
              'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-construction-lg',
              'p-4 min-w-[280px]'
            )}
            style={{
              top: '100%',
              right: 0,
            }}
          >
            {/* Debug: Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-black uppercase tracking-wide text-construction-blue">
                React with Emoji
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Close picker"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Debug: Emoji grid */}
            <div className="grid grid-cols-5 gap-2">
              {CONSTRUCTION_EMOJIS.map(({ emoji, label, category }) => (
                <motion.button
                  key={emoji}
                  onClick={() => handleSelect(emoji)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'group relative aspect-square',
                    'flex items-center justify-center',
                    'text-2xl',
                    'bg-gray-50 dark:bg-gray-900 hover:bg-construction-blue/10 dark:hover:bg-construction-blue/20',
                    'border-2 border-transparent hover:border-construction-blue/40 dark:hover:border-construction-blue/60',
                    'rounded-lg',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-construction-blue/50'
                  )}
                  title={label}
                  aria-label={`React with ${label}`}
                >
                  <span role="img" aria-label={label}>
                    {emoji}
                  </span>

                  {/* Debug: Category badge on hover */}
                  <div
                    className={cn(
                      'absolute -bottom-1 left-1/2 -translate-x-1/2',
                      'px-1.5 py-0.5 bg-construction-accent text-white',
                      'text-[8px] font-mono uppercase tracking-tight rounded',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'whitespace-nowrap pointer-events-none'
                    )}
                  >
                    {category}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Debug: Helper text */}
            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-3 text-center">
              Construction-themed reactions
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
