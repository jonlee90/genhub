"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatNotificationPreferences - Mobile-first notification settings
 * Touch-friendly cards with 44px minimum tap targets
 * Maintains all existing toggle functionality
 */
export function ChatNotificationPreferences() {
  const { permission, requestPermission, isLoading } = usePushNotifications();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  console.log(
    "[ChatNotificationPreferences] Rendering with permission:",
    permission,
  );

  // Update state based on permission
  useEffect(() => {
    const granted = permission === "granted";
    console.log(
      "[ChatNotificationPreferences] Permission changed:",
      permission,
      "-> pushEnabled:",
      granted,
    );
    setPushEnabled(granted);
  }, [permission]);

  const handlePushToggle = async (enabled: boolean) => {
    console.log("[ChatNotificationPreferences] Push toggle clicked:", enabled);

    if (enabled && permission !== "granted") {
      console.log("[ChatNotificationPreferences] Requesting permission...");
      const granted = await requestPermission();
      console.log("[ChatNotificationPreferences] Permission result:", granted);
      setPushEnabled(granted);
    } else {
      console.log(
        "[ChatNotificationPreferences] Setting push enabled:",
        enabled,
      );
      setPushEnabled(enabled);
      // TODO: Unregister push subscription if disabled
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    console.log("[ChatNotificationPreferences] Email toggle clicked:", enabled);
    setEmailEnabled(enabled);
    // TODO: Update user email notification preferences in database
  };

  // Helper to get status badge
  const getStatusBadge = () => {
    if (permission === "granted") {
      return (
        <Badge className="bg-[#059669]/10 text-[#059669] border border-[#059669]/30 text-xs font-bold px-2 py-0.5">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          ACTIVE
        </Badge>
      );
    }
    if (permission === "denied") {
      return (
        <Badge className="bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 text-xs font-bold px-2 py-0.5">
          <ShieldAlert className="h-3 w-3 mr-1" />
          BLOCKED
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-bold px-2 py-0.5">
        STANDBY
      </Badge>
    );
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Push Notifications Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-construction overflow-hidden active:bg-gray-50 transition-colors">
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon + Content */}
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icon - 44px touch target */}
              <div className="p-2.5 bg-construction-blue/10 rounded-xl border-2 border-construction-blue/20 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Bell className="h-5 w-5 text-construction-blue" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-base md:text-lg font-bold text-construction-blue">
                    Push Notifications
                  </h3>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Receive real-time alerts even when app is closed
                </p>

                {/* Blocked Warning */}
                {permission === "denied" && (
                  <div className="mt-3 p-3 bg-[#DC2626]/5 border-l-4 border-[#DC2626] rounded-r-lg">
                    <p className="text-xs text-[#DC2626] font-medium">
                      Notifications blocked in browser settings. Enable to
                      receive push alerts.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Switch with touch-friendly area */}
            <div
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 -m-2 rounded-lg",
                "min-w-[60px] min-h-[60px] justify-center",
                (isLoading || permission === "denied") && "opacity-50",
              )}
            >
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={isLoading || permission === "denied"}
                className={cn(
                  "data-[state=checked]:bg-[#059669] data-[state=unchecked]:bg-gray-300",
                  "scale-110",
                  isLoading && "cursor-wait",
                )}
              />
              <span className="text-xs font-bold text-gray-500 uppercase">
                {pushEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notifications Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-construction overflow-hidden active:bg-gray-50 transition-colors">
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon + Content */}
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icon - 44px touch target */}
              <div className="p-2.5 bg-construction-blue/10 rounded-xl border-2 border-construction-blue/20 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Mail className="h-5 w-5 text-construction-blue" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base md:text-lg font-bold text-construction-blue mb-1.5">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Daily summaries and important updates via email
                </p>
              </div>
            </div>

            {/* Right: Switch with touch-friendly area */}
            <div
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 -m-2 rounded-lg",
                "min-w-[60px] min-h-[60px] justify-center",
              )}
            >
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                className="data-[state=checked]:bg-[#059669] data-[state=unchecked]:bg-gray-300 scale-110"
              />
              <span className="text-xs font-bold text-gray-500 uppercase">
                {emailEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner - More compact on mobile */}
      <div className="flex items-start gap-3 p-3 md:p-4 bg-construction-blue/5 rounded-xl border border-construction-blue/10">
        <div className="p-1.5 bg-construction-blue rounded-lg shrink-0">
          <Info className="h-4 w-4 text-white" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-construction-blue">Note:</span>{" "}
          In-app notifications are always enabled for critical job site
          communications.
        </p>
      </div>
    </div>
  );
}
