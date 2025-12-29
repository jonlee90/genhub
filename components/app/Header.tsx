"use client";

import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Debug: Simplified mobile header - navigation moved to bottom nav
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const notificationCount = 3;

  // Debug: Check if we're on the dashboard (home) or a sub-page
  const isDashboard = pathname === "/app";

  // Debug: Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <motion.header
      className="relative bg-white border-b border-gray-200 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

      <div className="flex items-center justify-between px-4 py-3 pt-4">
        {/* Left Side - Back Button or Empty Space */}
        <div className="w-10 h-10 flex items-center justify-center">
          {!isDashboard && (
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Go back"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </motion.button>
          )}
        </div>

        {/* Center Logo */}
        <Link href="/app/" className="flex items-center gap-2 group">
          <motion.div
            className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden"
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/icon-192.png"
              alt="GenHub Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">GenHub</h1>
          </div>
        </Link>

        {/* Right Side - Notifications Bell */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Link
            href="/app/notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={`Notifications (${notificationCount} unread)`}
          >
            <Bell size={20} className="text-gray-700" />

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
        </motion.div>
      </div>
    </motion.header>
  );
}
