import { ChatNotificationPreferences } from '@/components/settings/ChatNotificationPreferences';
import { KakaoTalkSettings } from '@/components/settings/KakaoTalkSettings';
import { SettingsSectionHeader } from '@/components/settings/SettingsSectionHeader';
import { ProjectConfigurationSection } from '@/components/settings/ProjectConfigurationSection';
import { Bell, MessageCircle, User, Building2, Wrench } from 'lucide-react';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

/**
 * Settings Page - Redesigned to match Projects/Tasks layout patterns
 * Uses construction-themed design with blueprint grid background
 * Server Component - child components handle client-side interactivity
 */
export default async function SettingsPage() {
  console.log('[SettingsPage] Rendering settings page');

  // Check user role for Project Configuration section
  const session = await auth();
  let isGcAdmin = false;

  if (session?.user?.id) {
    const supabase = await createClient();
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    isGcAdmin = companyUser?.role === 'gc_admin';
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background - Fixed, low opacity */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

      {/* Page Header - Industrial Typography */}
      <div className="relative">
        {/* Construction border line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="pt-2 md:pt-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
            SETTINGS
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-500">
            Configure your account preferences and integrations
          </p>
        </div>
      </div>

      {/* Settings Sections Container */}
      <div className="space-y-6 md:space-y-8 relative z-10">
        {/* ============================================ */}
        {/* Project Configuration - GC Admin Only */}
        {/* ============================================ */}
        {isGcAdmin && (
          <section className="space-y-4">
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
        <section className="space-y-4">
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
        <section className="space-y-4">
          <SettingsSectionHeader
            icon={MessageCircle}
            title="KakaoTalk Integration"
            description="Connect your KakaoTalk account for notifications and message sync"
          />
          <KakaoTalkSettings />
        </section>

        {/* ============================================ */}
        {/* Future Settings Sections (Disabled/Coming Soon) */}
        {/* ============================================ */}
        <section className="space-y-4">
          <SettingsSectionHeader
            icon={User}
            title="Profile Settings"
            description="Coming soon..."
            disabled
          />
        </section>

        <section className="space-y-4">
          <SettingsSectionHeader
            icon={Building2}
            title="Company Settings"
            description="Coming soon..."
            disabled
          />
        </section>
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
