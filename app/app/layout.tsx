import { Header } from "../../components/app/Header";
import { Sidebar } from "../../components/app/Sidebar";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "../../components/pwa/ServiceWorkerRegistration";
import { OfflineBanner } from "../../components/pwa/OfflineBanner";
import { InstallPrompt } from "../../components/pwa/InstallPrompt";

export default function AppLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex h-screen bg-gray-50">
			{/* PWA: Offline Status Banner - z-50 (highest priority) */}
			<OfflineBanner />

			{/* Sidebar - Desktop Only */}
			<Sidebar />

			{/* Main Content Area */}
			<div className="flex flex-col flex-1 overflow-hidden">
				{/* Header - Mobile Only */}
				<div className="md:hidden">
					<Header />
				</div>

				{/* Page Content */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 md:p-0">
					{children}
				</main>
			</div>

			{/* Toast Notifications */}
			<Toaster position="top-right" richColors />

			{/* PWA: Service Worker Update Notification - z-50 (bottom-right toast) */}
			<ServiceWorkerRegistration />

			{/* PWA: Install Prompt - z-40 (medium priority, bottom banner) */}
			<InstallPrompt />
		</div>
	);
}