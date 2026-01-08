/**
 * ReceiptPhotoBadge Component
 * - Small badge overlay for receipt photos
 * - Shows "Task" (blue) or "Expense" (green)
 * - Tooltip with source title
 */

'use client';

import { FileText, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReceiptPhotoBadgeProps {
  source: 'task_receipt' | 'expense_receipt';
  sourceTitle?: string;
  sourceId?: string;
}

export function ReceiptPhotoBadge({ source, sourceTitle, sourceId }: ReceiptPhotoBadgeProps) {
  console.log('[ReceiptPhotoBadge] Rendering:', { source, sourceTitle, sourceId });

  const isTask = source === 'task_receipt';
  const label = isTask ? 'Task' : 'Expense';
  const tooltipText = sourceTitle || (isTask ? 'Task Receipt' : 'Expense Receipt');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-md cursor-default',
              isTask ? 'bg-[#001B51] text-white' : 'bg-[#059669] text-white'
            )}
          >
            {isTask ? <FileText className="h-3 w-3" /> : <Receipt className="h-3 w-3" />}
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
