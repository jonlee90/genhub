'use client';

/**
 * TypingIndicator - Display who is currently typing
 *
 * Features:
 * - Shows "User is typing..." for 1 user
 * - Shows "User1, User2 are typing..." for 2 users
 * - Shows "User1 and 2 others are typing..." for 3+ users
 * - Animated ellipsis for visual feedback
 * - Construction-themed industrial design
 */

import { m as motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TypingUser } from '@/lib/hooks/useTypingIndicator';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

// Debug: Typing indicator component with animated dots
export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  console.log('[TypingIndicator] Rendering for', typingUsers.length, 'typing users');

  if (typingUsers.length === 0) {
    return null;
  }

  // Debug: Format typing text based on number of users
  const formatTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5',
        'bg-gradient-to-r from-construction-blue/5 to-transparent',
        'border-l-4 border-construction-blue/40',
        className
      )}
    >
      {/* Debug: Animated typing indicator dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-construction-blue"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Debug: Typing text with monospace industrial font */}
      <span className="text-xs font-mono text-construction-blue/80 tracking-tight">
        {formatTypingText()}
      </span>
    </motion.div>
  );
}
