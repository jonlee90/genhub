import { Suspense } from "react";
import { Sidebar } from "../../components/app/Sidebar";
import { BottomNavigation } from "../../components/app/BottomNavigation";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "../../components/pwa/ServiceWorkerRegistration";
import { OfflineBanner } from "../../components/pwa/OfflineBanner";
import { InstallPrompt } from "../../components/pwa/InstallPrompt";
import { isOwner } from "@/app/actions/owner";
import { BottomNavProvider } from "@/lib/contexts/BottomNavContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { auth } from "@/lib/auth";

async function LayoutContent({ children }: { children: React.ReactNode }) {
  // Fetch session once at layout level to avoid multiple API calls
  const session = await auth();

  // Check if current user is a platform owner
  const ownerStatus = await isOwner();

  return (
    <ThemeProvider>
      <BottomNavProvider>
        <div className="flex min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
          {/* PWA: Offline Status Banner - z-50 (highest priority) */}
          <OfflineBanner />

          {/* Sidebar - Desktop Only */}
          <Sidebar isOwner={ownerStatus} session={session} />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Page Content - Bottom padding for mobile nav clearance, none on desktop */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-safe-nav md:pb-0">
              {children}
            </main>
          </div>

          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation session={session} />

          {/* Toast Notifications */}
          <Toaster position="top-right" richColors />

          {/* PWA: Service Worker Update Notification - z-50 (bottom-right toast) */}
          <ServiceWorkerRegistration />

          {/* PWA: Install Prompt - z-40 (medium priority, bottom banner) */}
          <InstallPrompt />
        </div>
      </BottomNavProvider>
    </ThemeProvider>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-blue dark:border-[#6FA1FF]"></div>
      </div>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
