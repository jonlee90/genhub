import { ChatNotificationPreferences } from '@/components/settings/ChatNotificationPreferences';
import { KakaoTalkSettings } from '@/components/settings/KakaoTalkSettings';
import { Settings, Bell, User, Building2, MessageCircle } from 'lucide-react';

/**
 * Settings Page - Construction-themed control panel
 * Includes notification preferences and other app settings
 */
export default function SettingsPage() {
  console.log('[SettingsPage] Rendering settings page');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header - Blueprint style */}
        <div className="relative overflow-hidden rounded-lg border-4 border-[#001B51] bg-gradient-to-br from-[#001B51] via-[#003080] to-[#001B51] p-8 shadow-xl">
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(white 1px, transparent 1px),
                linear-gradient(90deg, white 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-[#FFB627] rounded-lg shadow-lg">
                <Settings className="h-8 w-8 text-[#001B51]" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-wide font-['Work_Sans']">
                  System Settings
                </h1>
                <p className="text-sm text-blue-100 font-['IBM_Plex_Mono'] mt-1">
                  CONTROL PANEL • Configure application preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 bg-[#001B51] rounded">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#001B51] uppercase tracking-wide font-['Work_Sans']">
                Notifications
              </h2>
              <p className="text-sm text-[#7A7A7A] font-['IBM_Plex_Mono']">
                Manage how you receive job site alerts and updates
              </p>
            </div>
          </div>

          <ChatNotificationPreferences />
        </section>

        {/* KakaoTalk Integration Section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 bg-[#FFB627] rounded">
              <MessageCircle className="h-5 w-5 text-[#001B51]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#001B51] uppercase tracking-wide font-['Work_Sans']">
                KakaoTalk Integration
              </h2>
              <p className="text-sm text-[#7A7A7A] font-['IBM_Plex_Mono']">
                Connect your KakaoTalk account for notifications and message sync
              </p>
            </div>
          </div>

          <KakaoTalkSettings />
        </section>

        {/* Future Settings Sections (placeholders) */}
        <section className="opacity-50">
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 bg-[#3C3C3C] rounded">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#3C3C3C] uppercase tracking-wide font-['Work_Sans']">
                Profile Settings
              </h2>
              <p className="text-sm text-[#7A7A7A] font-['IBM_Plex_Mono']">
                Coming soon...
              </p>
            </div>
          </div>
        </section>

        <section className="opacity-50">
          <div className="mb-4 flex items-center gap-3">
            <div className="p-2 bg-[#3C3C3C] rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#3C3C3C] uppercase tracking-wide font-['Work_Sans']">
                Company Settings
              </h2>
              <p className="text-sm text-[#7A7A7A] font-['IBM_Plex_Mono']">
                Coming soon...
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
