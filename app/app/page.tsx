"use client";

import { FolderKanban, CheckSquare, Users, TrendingUp, HardHat, Hammer, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BackgroundBoxes } from "@/components/ui/aceternity/background-boxes";
import { HeroHighlight, Highlight } from "@/components/ui/aceternity/hero-highlight";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { cn } from "@/lib/utils";

/**
 * GenHub Dashboard - Industrial Command Center
 * Enhanced with Aceternity UI components and construction theme
 */
export default function AppPage() {
  // Mock data (replace with real data later)
  const stats = [
    {
      label: "Active Projects",
      value: "0",
      subtitle: "No projects yet",
      icon: FolderKanban,
      color: "blue",
      bgColor: "bg-construction-blue/10",
      iconColor: "text-construction-blue",
      borderColor: "border-construction-blue/20",
    },
    {
      label: "Active Tasks",
      value: "0",
      subtitle: "No tasks yet",
      icon: CheckSquare,
      color: "green",
      bgColor: "bg-construction-green/10",
      iconColor: "text-construction-green",
      borderColor: "border-construction-green/20",
    },
    {
      label: "Team Members",
      value: "1",
      subtitle: "You",
      icon: Users,
      color: "accent",
      bgColor: "bg-construction-accent/10",
      iconColor: "text-construction-accent",
      borderColor: "border-construction-accent/20",
    },
    {
      label: "Completion Rate",
      value: "0%",
      subtitle: "Overall progress",
      icon: TrendingUp,
      color: "red",
      bgColor: "bg-construction-red/10",
      iconColor: "text-construction-red",
      borderColor: "border-construction-red/20",
    },
  ];

  const quickActions = [
    {
      href: "/app/projects",
      icon: HardHat,
      title: "Create Project",
      description: "Start a new construction project",
      color: "blue",
      bgColor: "bg-construction-blue/10",
      iconColor: "text-construction-blue",
      hoverBorder: "hover:border-construction-blue",
      hoverBg: "hover:bg-construction-blue/5",
    },
    {
      href: "/app/tasks",
      icon: Hammer,
      title: "Add Task",
      description: "Create a new task or checklist",
      color: "green",
      bgColor: "bg-construction-green/10",
      iconColor: "text-construction-green",
      hoverBorder: "hover:border-construction-green",
      hoverBg: "hover:bg-construction-green/5",
    },
    {
      href: "/app/team",
      icon: Users,
      title: "Invite Team",
      description: "Add team members or subcontractors",
      color: "accent",
      bgColor: "bg-construction-accent/10",
      iconColor: "text-construction-accent",
      hoverBorder: "hover:border-construction-accent",
      hoverBg: "hover:bg-construction-accent/5",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <BackgroundBoxes boxSize={40} className="text-construction-blue" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-4 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
        {/* Welcome Section with Hero Highlight */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Construction accent bar */}
          <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-construction-blue to-construction-accent rounded-full mb-4 md:mb-6" />

          <HeroHighlight>
            <h1 className="text-2xl md:text-5xl font-black text-construction-blue leading-tight mb-2 md:mb-3">
              WELCOME TO <Highlight>GENHUB</Highlight>
            </h1>
          </HeroHighlight>

          <TextGenerateEffect
            words="Mission control for your construction operations. Monitor projects, track progress, and manage teams with industrial precision."
            className="text-sm md:text-lg text-gray-600 font-medium max-w-3xl"
            duration={0.5}
          />
        </motion.div>

        {/* Stats Grid with Staggered Animation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative h-full"
            >
              {/* Gradient background on hover */}
              <div className={cn(
                "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur",
                stat.bgColor
              )} />

              <div className={cn(
                "relative bg-white rounded-lg border-2 p-3 md:p-6 shadow-construction transition-all h-full",
                stat.borderColor,
                "group-hover:shadow-construction-lg"
              )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-gray-600 mb-1 md:mb-2 truncate">
                      {stat.label}
                    </p>
                    <motion.p
                      className={cn("text-2xl md:text-4xl font-black mb-1", stat.iconColor)}
                      whileHover={{ scale: 1.05 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-[10px] md:text-xs font-medium text-gray-500">{stat.subtitle}</p>
                  </div>

                  <motion.div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 flex-shrink-0",
                      stat.bgColor,
                      stat.borderColor
                    )}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <stat.icon className={cn("w-5 h-5 md:w-7 md:h-7", stat.iconColor)} />
                  </motion.div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-transparent via-transparent to-construction-blue/5" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions with Construction Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative bg-white rounded-lg shadow-construction border-2 border-gray-200 p-4 md:p-8 overflow-hidden"
        >
          {/* Decorative blueprint grid */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none hidden md:block">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
                color: "#001B51",
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
              <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                >
                  <Link href={action.href}>
                    <motion.div
                      className={cn(
                        "group relative flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-lg border-2 border-gray-200 transition-all",
                        action.hoverBorder,
                        action.hoverBg,
                        "hover:shadow-construction overflow-hidden active:bg-gray-50"
                      )}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Icon container */}
                      <motion.div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex-shrink-0",
                          action.bgColor,
                          action.iconColor,
                          "border-gray-200 group-hover:border-opacity-50"
                        )}
                        whileHover={{ rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                      </motion.div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm md:text-base text-gray-900 group-hover:text-construction-blue transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 font-medium truncate">
                          {action.description}
                        </p>
                      </div>

                      {/* Hover slide effect */}
                      <motion.div
                        className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                          action.bgColor
                        )}
                        initial={{ x: "-100%" }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ zIndex: -1 }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity with Industrial Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-white rounded-lg shadow-construction border-2 border-gray-200 p-4 md:p-8"
        >
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-2 h-2 bg-construction-accent rounded-full animate-pulse" />
            <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">
              Recent Activity
            </h2>
          </div>

          <div className="relative">
            {/* Empty state with construction theme */}
            <div className="text-center py-8 md:py-12">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-construction-blue/10 border-2 border-construction-blue/20 mb-3 md:mb-4"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Package className="w-8 h-8 md:w-10 md:h-10 text-construction-blue" />
              </motion.div>

              <p className="text-base md:text-lg font-bold text-gray-700 mb-1 md:mb-2">
                No recent activity
              </p>
              <p className="text-xs md:text-sm text-gray-500 font-medium max-w-md mx-auto px-4">
                Activity will appear here once you create projects and tasks. Start building your construction empire!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
