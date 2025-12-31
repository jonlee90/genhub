'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChatNotificationPreferences - Industrial control panel for notification settings
 * Design: Construction site control room with heavy-duty switches and safety signage
 */
export function ChatNotificationPreferences() {
  const { permission, requestPermission, isLoading } = usePushNotifications();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  console.log('[ChatNotificationPreferences] Rendering with permission:', permission);

  // Update state based on permission
  useEffect(() => {
    const granted = permission === 'granted';
    console.log('[ChatNotificationPreferences] Permission changed:', permission, '-> pushEnabled:', granted);
    setPushEnabled(granted);
  }, [permission]);

  const handlePushToggle = async (enabled: boolean) => {
    console.log('[ChatNotificationPreferences] Push toggle clicked:', enabled);

    if (enabled && permission !== 'granted') {
      console.log('[ChatNotificationPreferences] Requesting permission...');
      const granted = await requestPermission();
      console.log('[ChatNotificationPreferences] Permission result:', granted);
      setPushEnabled(granted);
    } else {
      console.log('[ChatNotificationPreferences] Setting push enabled:', enabled);
      setPushEnabled(enabled);
      // TODO: Unregister push subscription if disabled
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    console.log('[ChatNotificationPreferences] Email toggle clicked:', enabled);
    setEmailEnabled(enabled);
    // TODO: Update user email notification preferences in database
  };

  return (
    <div className="space-y-6">
      {/* Industrial header with diagonal stripes */}
      <div className="relative overflow-hidden rounded-lg border-2 border-[#001B51] bg-gradient-to-br from-[#001B51] to-[#003080] p-6">
        {/* Diagonal hazard stripes background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              #FFB627 20px,
              #FFB627 40px
            )`
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FFB627] rounded">
              <Bell className="h-6 w-6 text-[#001B51]" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide font-['Work_Sans']">
              Notification Control
            </h2>
          </div>
          <p className="text-sm text-blue-100 font-['IBM_Plex_Mono']">
            SYSTEM STATUS: Configure alert delivery channels
          </p>
        </div>
      </div>

      {/* Push Notifications Control Panel */}
      <div className="relative overflow-hidden rounded-lg border-2 border-[#001B51]/30 bg-white shadow-lg">
        {/* Riveted border effect */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />

        <div className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon with metal plate background */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7A7A7A] to-[#3C3C3C] rounded-lg rotate-1" />
                <div className="relative p-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-inner">
                  <Bell className="h-6 w-6 text-[#001B51]" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black text-[#001B51] uppercase tracking-wide font-['Work_Sans']">
                    Push Notifications
                  </h3>
                  {permission === 'granted' && (
                    <Badge className="bg-[#059669] text-white border-0 font-['IBM_Plex_Mono'] text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      ACTIVE
                    </Badge>
                  )}
                  {permission === 'denied' && (
                    <Badge variant="destructive" className="border-0 font-['IBM_Plex_Mono'] text-xs font-bold">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      BLOCKED
                    </Badge>
                  )}
                  {permission === 'default' && (
                    <Badge className="bg-[#FFB627] text-[#001B51] border-0 font-['IBM_Plex_Mono'] text-xs font-bold">
                      STANDBY
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[#3C3C3C] font-['IBM_Plex_Mono'] leading-relaxed">
                  Receive real-time alerts even when the application is minimized or closed.
                  Critical for job site communications.
                </p>

                {permission === 'denied' && (
                  <div className="mt-3 p-3 bg-red-50 border-l-4 border-[#DC2626] rounded">
                    <p className="text-xs text-red-800 font-['IBM_Plex_Mono'] font-bold">
                      ⚠ ALERT: Notifications blocked in browser settings. Enable to receive push alerts.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Industrial switch */}
            <div className="flex flex-col items-center gap-2">
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={isLoading || permission === 'denied'}
                className={cn(
                  "h-8 w-14 data-[state=checked]:bg-[#059669] data-[state=unchecked]:bg-[#7A7A7A]",
                  "shadow-lg border-2 border-[#3C3C3C]/20",
                  isLoading && "opacity-50 cursor-wait"
                )}
              />
              <span className="text-xs font-['IBM_Plex_Mono'] font-bold text-[#3C3C3C] uppercase">
                {pushEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notifications Control Panel */}
      <div className="relative overflow-hidden rounded-lg border-2 border-[#001B51]/30 bg-white shadow-lg">
        {/* Riveted border effect */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#3C3C3C] rounded-full" />

        <div className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon with metal plate background */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7A7A7A] to-[#3C3C3C] rounded-lg rotate-1" />
                <div className="relative p-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-inner">
                  <Mail className="h-6 w-6 text-[#001B51]" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black text-[#001B51] uppercase tracking-wide font-['Work_Sans'] mb-1">
                  Email Notifications
                </h3>
                <p className="text-sm text-[#3C3C3C] font-['IBM_Plex_Mono'] leading-relaxed">
                  Receive daily message summaries and important updates via email.
                  Useful for offline review.
                </p>
              </div>
            </div>

            {/* Industrial switch */}
            <div className="flex flex-col items-center gap-2">
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                className={cn(
                  "h-8 w-14 data-[state=checked]:bg-[#059669] data-[state=unchecked]:bg-[#7A7A7A]",
                  "shadow-lg border-2 border-[#3C3C3C]/20"
                )}
              />
              <span className="text-xs font-['IBM_Plex_Mono'] font-bold text-[#3C3C3C] uppercase">
                {emailEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Blueprint style */}
      <div className="relative overflow-hidden rounded-lg border-2 border-[#001B51] bg-blue-50">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(#001B51 1px, transparent 1px),
              linear-gradient(90deg, #001B51 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative z-10 p-4 flex items-start gap-3">
          <div className="p-2 bg-[#001B51] rounded">
            <BellOff className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-['IBM_Plex_Mono'] font-bold text-[#001B51] mb-1">
              SYSTEM NOTE:
            </p>
            <p className="text-sm text-[#3C3C3C] font-['IBM_Plex_Mono']">
              In-app notifications are always enabled and cannot be disabled.
              This ensures critical job site communications are never missed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
