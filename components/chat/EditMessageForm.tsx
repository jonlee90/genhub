'use client';

/**
 * EditMessageForm - Inline message editing with construction-themed design
 *
 * Features:
 * - Inline textarea replacement for message content
 * - Save and Cancel actions with industrial buttons
 * - Loading state during save
 * - Blueprint-inspired form styling
 */

import { useState } from 'react';
import { m as motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Save, X, Loader2 } from 'lucide-react';
import { editMessage } from '@/app/actions/chat';
import { toast } from 'sonner';

interface EditMessageFormProps {
  messageId: string;
  currentContent: string;
  onSave: () => void;
  onCancel: () => void;
}

// Debug: Inline edit form with industrial blueprint styling
export function EditMessageForm({
  messageId,
  currentContent,
  onSave,
  onCancel,
}: EditMessageFormProps) {
  const [content, setContent] = useState(currentContent);
  const [isSaving, setIsSaving] = useState(false);

  console.log('[EditMessageForm] Rendering for message:', messageId);

  // Debug: Handle save action
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (content.trim() === currentContent.trim()) {
      console.log('[EditMessageForm] No changes detected, canceling');
      onCancel();
      return;
    }

    console.log('[EditMessageForm] Saving edited message:', messageId);
    setIsSaving(true);

    try {
      const result = await editMessage(messageId, content.trim());

      if (result.success) {
        console.log('[EditMessageForm] Message edited successfully');
        toast.success('Message updated');
        onSave();
      } else {
        console.error('[EditMessageForm] Edit failed:', result.error);
        toast.error(result.error || 'Failed to update message');
      }
    } catch (error) {
      console.error('[EditMessageForm] Edit error:', error);
      toast.error('An error occurred while updating the message');
    } finally {
      setIsSaving(false);
    }
  };

  // Debug: Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Debug: Textarea with blueprint-style border */}
      <div className="relative">
        {/* Blueprint grid overlay on focused state */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg pointer-events-none opacity-0 transition-opacity',
            content !== currentContent && 'opacity-5'
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,27,81,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,27,81,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '12px 12px',
          }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isSaving}
          className={cn(
            'relative w-full px-4 py-3 min-h-[100px]',
            'bg-white border-2 border-construction-blue/40',
            'rounded-lg resize-none',
            'font-normal text-sm text-gray-900',
            'focus:outline-none focus:ring-4 focus:ring-construction-blue/20 focus:border-construction-blue',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'placeholder:text-gray-400'
          )}
          placeholder="Edit your message..."
        />
      </div>

      {/* Debug: Action buttons with stamped metal design */}
      <div className="flex items-center justify-between mt-3">
        {/* Keyboard shortcut hints */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 uppercase">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-bold">
              ESC
            </kbd>{' '}
            to cancel
          </span>
          <span className="text-[10px] font-mono text-gray-300">•</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-bold">
              ⌘↵
            </kbd>{' '}
            to save
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Cancel button */}
          <button
            onClick={onCancel}
            disabled={isSaving}
            className={cn(
              'px-4 py-2 rounded-lg',
              'border-2 border-gray-300 bg-white',
              'font-bold text-sm text-gray-700 uppercase tracking-wide',
              'hover:bg-gray-50 hover:border-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center gap-2'
            )}
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          {/* Save button with industrial stamped style */}
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className={cn(
              'px-4 py-2 rounded-lg',
              'border-2 border-construction-blue bg-construction-blue',
              'font-black text-sm text-white uppercase tracking-wide',
              'hover:bg-construction-blue/90 hover:shadow-lg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center gap-2',
              'shadow-md'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Debug: Character count indicator */}
      <div className="mt-2 flex justify-end">
        <span
          className={cn(
            'text-[10px] font-mono font-bold',
            content.length > 9000 ? 'text-construction-red' : 'text-gray-400'
          )}
        >
          {content.length} / 10,000
        </span>
      </div>
    </motion.div>
  );
}
