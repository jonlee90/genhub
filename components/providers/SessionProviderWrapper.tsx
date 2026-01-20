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
import type { Session } from 'next-auth';

interface SessionProviderWrapperProps {
  children: ReactNode;
  session?: Session | null;
}

export function SessionProviderWrapper({ children, session }: SessionProviderWrapperProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
