'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoreMenu } from './MoreMenu';

// Debug: Bottom navigation items for mobile - 5 core items
const navigationItems = [
  { name: 'Home', href: '/app', icon: LayoutDashboard },
  { name: 'Projects', href: '/app/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/app/tasks', icon: CheckSquare },
  { name: 'Materials', href: '/app/materials', icon: Package },
  { name: 'More', href: '#more', icon: MoreHorizontal, isMore: true },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Debug: Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(href);
  };

  // Debug: Check if "More" menu items are active
  const isMoreActive = () => {
    const moreRoutes = ['/app/expenses', '/app/chat', '/app/team', '/app/settings', '/app/notifications'];
    return moreRoutes.some(route => pathname.startsWith(route));
  };

  return (
    <>
      {/* Debug: Bottom Navigation Bar - Fixed at bottom, hidden on desktop */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 md:hidden',
          'bg-white border-t border-gray-200 shadow-construction-lg'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Debug: Top accent line - construction blue */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

        <div className="flex items-center justify-around h-14">
          {navigationItems.map((item) => {
            const active = item.isMore ? isMoreActive() : isActive(item.href);
            const Icon = item.icon;

            if (item.isMore) {
              // Debug: More button opens modal instead of navigating
              return (
                <button
                  key={item.name}
                  onClick={() => setIsMoreMenuOpen(true)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors',
                    'active:bg-gray-100'
                  )}
                  aria-label="Open more menu"
                >
                  <motion.div
                    className="relative flex flex-col items-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200',
                        active
                          ? 'bg-construction-blue text-white'
                          : 'text-gray-500'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold mt-0.5 transition-colors',
                        active ? 'text-construction-blue' : 'text-gray-500'
                      )}
                    >
                      {item.name}
                    </span>
                    {/* Debug: Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-construction-blue"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </button>
              );
            }

            // Debug: Regular navigation link
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors',
                  'active:bg-gray-100'
                )}
              >
                <motion.div
                  className="relative flex flex-col items-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200',
                      active
                        ? 'bg-construction-blue text-white'
                        : 'text-gray-500'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold mt-0.5 transition-colors',
                      active ? 'text-construction-blue' : 'text-gray-500'
                    )}
                  >
                    {item.name}
                  </span>
                  {/* Debug: Active indicator dot */}
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-construction-blue"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Debug: More Menu Modal */}
      <MoreMenu isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} />
    </>
  );
}
