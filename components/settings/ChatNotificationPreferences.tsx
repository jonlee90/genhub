'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellOff, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChatNotificationPreferences - Simplified notification settings
 * Clean Card pattern matching Projects/Tasks design system
 * Maintains all existing toggle functionality
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

  // Helper to get status badge
  const getStatusBadge = () => {
    if (permission === 'granted') {
      return (
        <Badge className="bg-construction-green/10 text-construction-green border border-construction-green/30 text-xs font-bold">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          ACTIVE
        </Badge>
      );
    }
    if (permission === 'denied') {
      return (
        <Badge className="bg-construction-red/10 text-construction-red border border-construction-red/30 text-xs font-bold">
          <ShieldAlert className="h-3 w-3 mr-1" />
          BLOCKED
        </Badge>
      );
    }
    return (
      <Badge className="bg-construction-yellow/10 text-construction-yellow border border-construction-yellow/30 text-xs font-bold">
        STANDBY
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Push Notifications Card */}
      <Card className="border-2 border-gray-200 shadow-construction hover:border-construction-blue/30 transition-colors">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            {/* Left: Icon + Content */}
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="p-2.5 md:p-3 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20 shrink-0">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-construction-blue" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-black text-construction-blue uppercase tracking-tight">
                    Push Notifications
                  </h3>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Receive real-time alerts even when the application is minimized or closed.
                </p>

                {/* Blocked Warning */}
                {permission === 'denied' && (
                  <div className="mt-3 p-2.5 bg-construction-red/5 border-l-4 border-construction-red rounded-r">
                    <p className="text-xs text-construction-red font-medium">
                      Notifications blocked in browser settings. Enable to receive push alerts.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Switch */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={isLoading || permission === 'denied'}
                className={cn(
                  'data-[state=checked]:bg-construction-green data-[state=unchecked]:bg-gray-300',
                  isLoading && 'opacity-50 cursor-wait'
                )}
              />
              <span className="text-xs font-bold text-gray-500 uppercase">
                {pushEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
      <Card className="border-2 border-gray-200 shadow-construction hover:border-construction-blue/30 transition-colors">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            {/* Left: Icon + Content */}
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="p-2.5 md:p-3 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20 shrink-0">
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-construction-blue" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-black text-construction-blue uppercase tracking-tight mb-1">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Receive daily message summaries and important updates via email.
                </p>
              </div>
            </div>

            {/* Right: Switch */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                className="data-[state=checked]:bg-construction-green data-[state=unchecked]:bg-gray-300"
              />
              <span className="text-xs font-bold text-gray-500 uppercase">
                {emailEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3 md:p-4 bg-construction-blue/5 rounded-lg border-l-4 border-construction-blue">
        <div className="p-1.5 bg-construction-blue rounded shrink-0">
          <BellOff className="h-4 w-4 text-white" />
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-bold text-construction-blue">Note:</span>{' '}
          In-app notifications are always enabled and cannot be disabled to ensure critical job site communications are never missed.
        </p>
      </div>
    </div>
  );
}
