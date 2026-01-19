'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  const isAppPage = pathname?.startsWith('/app');

  if (isAppPage) {
    return null;
  }

  return <Footer />;
} 