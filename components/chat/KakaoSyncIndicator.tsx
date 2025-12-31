'use client';

import { motion } from 'framer-motion';
import { MessageCircle, CheckCheck, ArrowDownToLine } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================
// Types
// ============================================

interface KakaoSyncIndicatorProps {
  /**
   * Whether this message was synced TO KakaoTalk
   */
  syncedToKakao?: boolean;

  /**
   * Whether this message came FROM KakaoTalk (external source)
   */
  fromKakao?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================
// Main Component
// ============================================

export function KakaoSyncIndicator({
  syncedToKakao = false,
  fromKakao = false,
  size = 'sm',
  className = '',
}: KakaoSyncIndicatorProps) {
  console.log('[KakaoSyncIndicator] Rendering:', { syncedToKakao, fromKakao });

  // Don't render anything if no sync status
  if (!syncedToKakao && !fromKakao) {
    return null;
  }

  // Size mappings
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  // Determine which indicator to show
  const isSynced = syncedToKakao;
  const isExternal = fromKakao;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25,
            }}
            className={className}
          >
            {isSynced && (
              <div
                className={`inline-flex items-center justify-center rounded-full bg-green-100 border border-green-500 ${badgeSizeClasses[size]}`}
              >
                <div className="relative">
                  <MessageCircle
                    className={`${sizeClasses[size]} text-green-600`}
                  />
                  <CheckCheck
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-green-700"
                    strokeWidth={3}
                  />
                </div>
              </div>
            )}

            {isExternal && (
              <div
                className={`inline-flex items-center justify-center rounded-full bg-yellow-100 border-2 border-[#FFB627] ${badgeSizeClasses[size]}`}
              >
                <div className="relative">
                  <MessageCircle
                    className={`${sizeClasses[size]} text-[#FFB627]`}
                  />
                  <ArrowDownToLine
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-[#001B51]"
                    strokeWidth={3}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="bg-[#001B51] text-white border-2 border-[#FFB627] font-['IBM_Plex_Mono'] text-xs font-bold"
        >
          {isSynced && (
            <div className="flex items-center gap-2">
              <CheckCheck className="h-3 w-3" />
              <span>Synced to KakaoTalk</span>
            </div>
          )}
          {isExternal && (
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-3 w-3" />
              <span>From KakaoTalk</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// Usage Examples (JSDoc)
// ============================================

/**
 * Usage in message components:
 *
 * @example
 * // Message synced TO KakaoTalk
 * <KakaoSyncIndicator syncedToKakao={message.synced_to_kakao} size="sm" />
 *
 * @example
 * // Message received FROM KakaoTalk
 * <KakaoSyncIndicator fromKakao={message.external_source === 'kakao'} size="md" />
 *
 * @example
 * // In a message bubble component
 * <div className="flex items-center gap-2">
 *   <MessageContent>{message.content}</MessageContent>
 *   <KakaoSyncIndicator
 *     syncedToKakao={message.synced_to_kakao}
 *     fromKakao={message.external_source === 'kakao'}
 *   />
 * </div>
 */
