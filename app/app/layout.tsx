import { Header } from "../../components/app/Header";
import { Sidebar } from "../../components/app/Sidebar";
import { BottomNavigation } from "../../components/app/BottomNavigation";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "../../components/pwa/ServiceWorkerRegistration";
import { OfflineBanner } from "../../components/pwa/OfflineBanner";
import { InstallPrompt } from "../../components/pwa/InstallPrompt";
import { isOwner } from "@/app/actions/owner";
import { BottomNavProvider } from "@/lib/contexts/BottomNavContext";

export default async function AppLayout({
	children
}: {
	children: React.ReactNode
}) {
	// Check if current user is a platform owner
	const ownerStatus = await isOwner();

	return (
		<BottomNavProvider>
			<div className="flex h-screen bg-gray-50">
				{/* PWA: Offline Status Banner - z-50 (highest priority) */}
				<OfflineBanner />

				{/* Sidebar - Desktop Only */}
				<Sidebar isOwner={ownerStatus} />

				{/* Main Content Area */}
				<div className="flex flex-col flex-1 overflow-hidden">

					{/* Page Content - Added pb-20 for bottom nav clearance on mobile */}
					<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 md:p-0 ">
						{children}
					</main>
				</div>

				{/* Bottom Navigation - Mobile Only */}
				<BottomNavigation />

				{/* Toast Notifications */}
				<Toaster position="top-right" richColors />

				{/* PWA: Service Worker Update Notification - z-50 (bottom-right toast) */}
				<ServiceWorkerRegistration />

				{/* PWA: Install Prompt - z-40 (medium priority, bottom banner) */}
				<InstallPrompt />
			</div>
		</BottomNavProvider>
	);
}
