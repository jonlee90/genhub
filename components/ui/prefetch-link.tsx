'use client';

/**
 * PrefetchLink Component
 *
 * Enhanced Link component with intelligent prefetching.
 * Wraps Next.js Link with hover/focus prefetch behavior.
 *
 * Features:
 * - Auto-prefetch on hover (debounced)
 * - Immediate prefetch on focus (accessibility)
 * - Cancel on mouse leave
 * - Pass-through all Link props
 * - TypeScript-safe
 *
 * @example
 * ```tsx
 * <PrefetchLink href="/app/tasks" prefetchDelay={150}>
 *   Go to Tasks
 * </PrefetchLink>
 * ```
 */

import Link, { LinkProps } from 'next/link';
import { usePrefetch } from '@/hooks/use-prefetch';
import { forwardRef } from 'react';

interface PrefetchLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  /** Delay in ms before prefetch triggers (default: 100) */
  prefetchDelay?: number;
  /** Callback when prefetch starts */
  onPrefetch?: () => void;
  /** Disable prefetch */
  disablePrefetch?: boolean;
  /** Additional className */
  className?: string;
}

export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  function PrefetchLink(
    {
      href,
      children,
      prefetchDelay,
      onPrefetch,
      disablePrefetch = false,
      className,
      ...linkProps
    },
    ref
  ) {
    const { prefetchProps } = usePrefetch(href, {
      delay: prefetchDelay,
      onPrefetch,
      disabled: disablePrefetch,
    });

    return (
      <Link
        ref={ref}
        href={href}
        className={className}
        {...prefetchProps}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }
);
