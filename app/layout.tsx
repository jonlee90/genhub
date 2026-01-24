import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import config from "@/config";
import "./globals.css";
import { GoogleTagManager } from '@next/third-parties/google'
import { OpenPanelComponent } from '@openpanel/nextjs';
import { Toaster } from 'react-hot-toast';
import FooterWrapper from "@/components/ui/FooterWrapper";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { MotionProvider } from "@/components/providers/MotionProvider";

export const metadata: Metadata = {
  ...config.metadata,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GenHub'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: 'var(--construction-blue)'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* FOUC Prevention Script - Runs BEFORE CSS loads */}
        {/* Note: dangerouslySetInnerHTML is safe here - contains only hardcoded logic with no user input */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    // Read saved theme preference from localStorage
    var saved = localStorage.getItem('genhub-theme-preference');
    var preference = 'system';

    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed.preference === 'light' || parsed.preference === 'dark' || parsed.preference === 'system') {
          preference = parsed.preference;
        }
      } catch (e) {
        console.warn('Failed to parse saved theme preference:', e);
      }
    }

    // Resolve theme based on preference
    var theme = 'light';

    if (preference === 'dark') {
      theme = 'dark';
    } else if (preference === 'system') {
      // Detect system preference
      try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          theme = 'dark';
        }
      } catch (e) {
        console.warn('Failed to detect system theme:', e);
      }
    }

    // Apply .dark class to <html> if needed
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    console.warn('FOUC prevention script failed:', e);
  }
})();
            `.trim()
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950"
      >
        <MotionProvider>
          <Toaster position="top-center" />
          <main className="flex-grow">
            {children}
          </main>
          {/* Footer uses usePathname() which needs Suspense */}
          <Suspense fallback={null}>
            <FooterWrapper />
          </Suspense>
          {/* Service Worker Registration - PWA Support */}
          <ServiceWorkerRegistration />
        </MotionProvider>
      </body>
      {/* Google Tag Manager */}
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
      )}

      {/* OpenPanel Analytics */}
      {process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID && (
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID}
          trackScreenViews={true}
          // trackAttributes={true}
          // trackOutgoingLinks={true}
          // If you have a user id, you can pass it here to identify the user
          // profileId={'123'}
        />
      )}
    </html>
  );
}
