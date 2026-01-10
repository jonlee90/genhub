import { redirect } from 'next/navigation';
import { isOwner } from '@/app/actions/owner';

/**
 * Owner Layout
 *
 * Protects all /app/owner/* routes.
 * Only platform owners can access these pages.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[OwnerLayout] Checking owner status');

  const ownerStatus = await isOwner();

  if (!ownerStatus) {
    console.log('[OwnerLayout] User is not an owner, redirecting to /app');
    redirect('/app');
  }

  console.log('[OwnerLayout] User is owner, rendering children');

  return <>{children}</>;
}
