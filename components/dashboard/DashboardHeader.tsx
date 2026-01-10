'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  userName: string
  className?: string
}

/**
 * DashboardHeader - Clean welcome header for the dashboard
 *
 * Features:
 * - Simplified welcome message
 * - Blueprint accent bar
 * - Subtle entrance animation
 * - Mobile responsive
 */
export function DashboardHeader({ userName, className }: DashboardHeaderProps) {
  console.log('[DashboardHeader] Rendering:', { userName })

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('relative', className)}
    >
      {/* Blueprint accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#001B51]" />

      <div className="pt-4 md:pt-6">
        {/* Welcome message */}
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#001B51]"
        >
          Welcome back, {userName}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-1 md:mt-2 text-sm md:text-base text-gray-500 font-medium"
        >
          Your construction command center
        </motion.p>
      </div>
    </motion.div>
  )
}
