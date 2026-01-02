'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Receipt,
  Users,
  Settings,
  Bell,
  LogOut,
  HardHat,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Debug: Secondary navigation items for More menu
const moreNavItems = [
  { name: 'Expenses', href: '/app/expenses', icon: Receipt, description: 'Track project expenses' },
  { name: 'Chat', href: '/app/chat', icon: MessageSquare, description: 'Team communication' },
  { name: 'Team', href: '/app/team', icon: Users, description: 'Manage team members' },
  { name: 'Subcontractors', href: '/app/team/subcontractors', icon: HardHat, description: 'Manage subcontractors' },
  { name: 'Notifications', href: '/app/notifications', icon: Bell, description: 'View all notifications' },
  { name: 'Settings', href: '/app/settings', icon: Settings, description: 'App settings' },
];

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Debug: Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debug: Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Debug: Check if current path matches nav item
  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  // Debug: Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut({ callbackUrl: '/' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Debug: More Menu - Slides up from bottom */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Debug: Top accent line - construction blue gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

              {/* Debug: Drag handle indicator */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Debug: Header with user profile */}
              <div className="relative px-5 py-4 bg-gradient-to-br from-construction-blue to-blue-700">
                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>

                {/* Logo and branding */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/icon-192.png"
                      alt="GenHub Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">GenHub</h2>
                    <p className="text-xs text-white/70">Construction Management</p>
                  </div>
                </div>

                {/* User profile section */}
                {session?.user && (
                  <motion.div
                    className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Avatar className="h-10 w-10 border-2 border-white/30">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-construction-accent text-white font-bold">
                        {session.user.name ? getInitials(session.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs text-white/70 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <HardHat className="w-5 h-5 text-white/50" />
                  </motion.div>
                )}
              </div>

              {/* Debug: Navigation items */}
              <nav className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-1">
                  {moreNavItems.map((item, index) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all',
                            active
                              ? 'bg-construction-blue/10 text-construction-blue'
                              : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                          )}
                        >
                          {/* Icon container */}
                          <div
                            className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                              active
                                ? 'bg-construction-blue text-white'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Label and description */}
                          <div className="flex-1 min-w-0">
                            <span className={cn('font-bold', active && 'text-construction-blue')}>
                              {item.name}
                            </span>
                            <p className="text-xs text-gray-500 truncate">
                              {item.description}
                            </p>
                          </div>

                          {/* Chevron */}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              {/* Debug: Sign out button */}
              <div className="px-4 py-4 border-t border-gray-200">
                <motion.button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </motion.button>

                {/* Debug: System status indicator */}
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-construction-green animate-pulse" />
                  <span>System Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
