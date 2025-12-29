'use client';

/**
 * AuthLayout Component
 *
 * Shared layout wrapper for authentication pages (login, signup).
 * Construction-themed with gradient background and centered card.
 *
 * Debug: Uses Framer Motion for entrance animation
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HardHat } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  console.log('[AuthLayout] Rendering auth layout');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-construction-blue rounded-lg group-hover:scale-105 transition-transform">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-construction-blue">GenHub</span>
        </Link>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
      >
        {children}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-sm text-gray-500 text-center"
      >
        Construction project management made simple
      </motion.p>
    </div>
  );
}
