/**
 * Skeleton Components Index
 *
 * Centralized exports for all skeleton loading states.
 * Import from this file for consistency.
 *
 * @example
 * ```tsx
 * import { ProjectCardSkeleton, TaskListSkeleton } from '@/components/skeletons';
 * ```
 */

export {
  ProjectCardSkeleton,
  ProjectCardSkeletonList,
} from './ProjectCardSkeleton';

export {
  TaskListSkeleton,
  TaskBoardSkeleton,
} from './TaskListSkeleton';

export {
  MaterialCardSkeleton,
  MaterialCardSkeletonList,
} from './MaterialCardSkeleton';

export {
  ExpenseTableSkeleton,
  ExpenseStatsSkeleton,
} from './ExpenseTableSkeleton';

export {
  ChatMessageSkeleton,
  ChatMessageListSkeleton,
  ChatRoomSkeleton,
  ChatRoomListSkeleton,
} from './ChatMessageSkeleton';

export {
  DashboardSkeleton,
  DashboardWidgetSkeleton,
} from './DashboardSkeleton';

// Re-export existing skeleton utilities
export { Skeleton } from '@/components/ui/skeleton';
export { SkeletonCard } from '@/components/mobile/SkeletonCard';
