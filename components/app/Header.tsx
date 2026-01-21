"use client";

import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import { TopAccentBar } from "@/components/ui/TopAccentBar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// Routes where the mobile header should be hidden (page has its own header)
const HIDE_HEADER_ROUTES = ["/app/tasks"];

// Debug: Simplified mobile header - navigation moved to bottom nav
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const notificationCount = 3;

  // Hide header on specific routes that have their own mobile header
  const shouldHideHeader = HIDE_HEADER_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (shouldHideHeader) {
    return null;
  }

  // Debug: Check if we're on the dashboard (home) or a sub-page
  const isDashboard = pathname === "/app";

  // Debug: Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <motion.header
      className="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Top accent border */}
      <TopAccentBar />

      <div className="flex items-center justify-between px-4 py-3 pt-4">
        {/* Left Side - Back Button or Empty Space */}
        <div className="w-10 h-10 flex items-center justify-center">
          {!isDashboard && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Center Logo */}
        <Link href="/app/" className="flex items-center gap-2 group active:scale-95 transition-transform">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
            <Image
              src="/icon-192.png"
              alt="GenHub Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">GenHub</h1>
          </div>
        </Link>

        {/* Right Side - Theme Toggle & Notifications Bell */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          <div className="active:scale-95 transition-transform">
            <Link
              href="/app/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Notifications (${notificationCount} unread)`}
            >
              <Bell size={20} className="text-gray-700 dark:text-gray-300" />

              {notificationCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-construction-accent rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {notificationCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
