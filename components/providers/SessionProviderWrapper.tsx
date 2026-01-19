'use client';

/**
 * SessionProviderWrapper - Scoped Session Provider
 *
 * Only use this to wrap components that specifically need useSession() hook.
 * This prevents unnecessary /api/auth/session calls across the entire app.
 *
 * Components that need this:
 * - MessageItem (chat)
 * - CheckoutButton (stripe)
 * - PortalButton (stripe)
 * - RefundButton (stripe)
 */

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
