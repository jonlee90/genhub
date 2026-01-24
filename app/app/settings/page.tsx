import { ChatNotificationPreferences } from "@/components/settings/ChatNotificationPreferences";
import { KakaoTalkSettings } from "@/components/settings/KakaoTalkSettings";
import { SettingsSectionHeader } from "@/components/settings/SettingsSectionHeader";
import { ProjectConfigurationSection } from "@/components/settings/ProjectConfigurationSection";
import { Bell, MessageCircle, User, Building2, Wrench } from "lucide-react";
import { getSettingsPageData } from "@/lib/settings";

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "var(--construction-blue)",
} as const;

/**
 * Settings Page - Mobile-first PWA design for construction workers
 * Uses construction-themed design with blueprint grid background
 * Server Component - child components handle client-side interactivity
 */
export default async function SettingsPage() {
  const { isAdmin } = await getSettingsPageData();

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden pb-24 md:pb-8">
      {/* Blueprint Grid Background - Matching Projects/Tasks pages */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
        <div className="absolute inset-0" style={BLUEPRINT_BACKGROUND_STYLE} />
      </div>

      {/* Industrial Header with Blueprint Aesthetic - Matching Projects/Tasks */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue dark:bg-blue-400" />

        <div className="flex flex-col gap-4 pt-2 md:pt-4">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 md:space-y-3">
              {/* Main Title - Heavy Industrial Typography matching Projects/Tasks */}
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue dark:text-blue-400 leading-none">
                SETTINGS
              </h1>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                Configure preferences & integrations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections Container */}
      <div className="space-y-4 md:space-y-6">
        {/* ============================================ */}
        {/* Project Configuration - GC Admin Only */}
        {/* ============================================ */}
        {isAdmin && (
          <section className="space-y-3 md:space-y-4">
            <SettingsSectionHeader
              icon={Wrench}
              title="Project Configuration"
              description="Manage project types, task types, and workflow templates"
            />
            <ProjectConfigurationSection />
          </section>
        )}

        {/* ============================================ */}
        {/* Notifications Section */}
        {/* ============================================ */}
        <section className="space-y-3 md:space-y-4">
          <SettingsSectionHeader
            icon={Bell}
            title="Notifications"
            description="Manage how you receive job site alerts and updates"
          />
          <ChatNotificationPreferences />
        </section>

        {/* ============================================ */}
        {/* KakaoTalk Integration Section */}
        {/* ============================================ */}
        <section className="space-y-3 md:space-y-4">
          <SettingsSectionHeader
            icon={MessageCircle}
            title="KakaoTalk Integration"
            description="Connect your KakaoTalk account for notifications and message sync"
          />
          <KakaoTalkSettings />
        </section>

        {/* ============================================ */}
        {/* Future Settings Sections - Compact Coming Soon */}
        {/* ============================================ */}
        <div className="hidden md:block space-y-4">
          <section className="space-y-3">
            <SettingsSectionHeader
              icon={User}
              title="Profile Settings"
              description="Coming soon..."
              disabled
            />
          </section>

          <section className="space-y-3">
            <SettingsSectionHeader
              icon={Building2}
              title="Company Settings"
              description="Coming soon..."
              disabled
            />
          </section>
        </div>

        {/* Mobile: Collapsed Coming Soon Banner */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
            <div className="flex -space-x-2">
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                More settings coming soon
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Profile & Company settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom border - matching Projects/Tasks */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

      {/* Safe area bottom padding for iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
