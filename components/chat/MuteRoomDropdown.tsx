'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BellOff, Bell, Clock, Timer, Calendar } from 'lucide-react';
import { muteChatRoom } from '@/app/actions/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MuteRoomDropdownProps {
  chatRoomId: string;
  isMuted: boolean;
  mutedUntil?: string | null;
}

/**
 * MuteRoomDropdown - Industrial control for muting chat rooms
 * Design: Heavy-duty dropdown menu with safety signage aesthetics
 */
export function MuteRoomDropdown({ chatRoomId, isMuted, mutedUntil }: MuteRoomDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  console.log('[MuteRoomDropdown] Rendering:', { chatRoomId, isMuted, mutedUntil });

  const muteOptions = [
    { label: '1 hour', hours: 1, icon: Clock },
    { label: '8 hours (work day)', hours: 8, icon: Timer },
    { label: '24 hours', hours: 24, icon: Calendar },
    { label: '7 days', hours: 168, icon: Calendar },
    { label: 'Until I turn it back on', hours: null, icon: BellOff },
  ];

  const handleMute = async (hours: number | null) => {
    console.log('[MuteRoomDropdown] Mute requested for hours:', hours);
    setIsLoading(true);

    let mutedUntilDate: string | null;
    if (hours === null) {
      // Indefinite mute (set to far future, e.g., 100 years)
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      mutedUntilDate = farFuture.toISOString();
      console.log('[MuteRoomDropdown] Indefinite mute until:', mutedUntilDate);
    } else {
      const muteEnd = new Date();
      muteEnd.setHours(muteEnd.getHours() + hours);
      mutedUntilDate = muteEnd.toISOString();
      console.log('[MuteRoomDropdown] Mute until:', mutedUntilDate);
    }

    const result = await muteChatRoom({ chatRoomId, mutedUntil: mutedUntilDate });

    if ('error' in result) {
      console.error('[MuteRoomDropdown] Mute failed:', result.error);
      toast.error(result.error);
    } else {
      const duration = hours ? `for ${hours} hour${hours > 1 ? 's' : ''}` : 'indefinitely';
      console.log('[MuteRoomDropdown] Mute successful:', duration);
      toast.success(`Room muted ${duration}`, {
        description: 'You will not receive notifications from this room.',
        icon: '🔕',
      });
    }

    setIsLoading(false);
    setIsOpen(false);
  };

  const handleUnmute = async () => {
    console.log('[MuteRoomDropdown] Unmute requested');
    setIsLoading(true);

    const result = await muteChatRoom({ chatRoomId, mutedUntil: null });

    if ('error' in result) {
      console.error('[MuteRoomDropdown] Unmute failed:', result.error);
      toast.error(result.error);
    } else {
      console.log('[MuteRoomDropdown] Unmute successful');
      toast.success('Room unmuted', {
        description: 'You will receive notifications from this room.',
        icon: '🔔',
      });
    }

    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative p-2 rounded-lg transition-all duration-200",
            "hover:bg-gray-100 active:scale-95",
            "border-2 border-transparent",
            isMuted && "bg-[#FFB627]/10 border-[#FFB627]",
            isLoading && "opacity-50 cursor-wait"
          )}
          disabled={isLoading}
          title={isMuted ? 'Room is muted' : 'Mute room'}
        >
          {isMuted ? (
            <div className="relative">
              <BellOff className="h-5 w-5 text-[#FFB627]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FFB627] rounded-full animate-pulse" />
            </div>
          ) : (
            <Bell className="h-5 w-5 text-[#001B51] hover:text-[#003080]" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 p-2",
          "bg-white border-2 border-[#001B51]/20",
          "shadow-xl rounded-lg",
          "font-['IBM_Plex_Mono']"
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 mb-2 bg-gradient-to-r from-[#001B51] to-[#003080] rounded-md">
          <p className="text-xs font-bold text-white uppercase tracking-wide">
            {isMuted ? 'Mute Active' : 'Mute Room'}
          </p>
        </div>

        {isMuted ? (
          /* Unmute Option */
          <DropdownMenuItem
            onClick={handleUnmute}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer",
              "hover:bg-[#059669]/10 focus:bg-[#059669]/10",
              "transition-colors duration-150"
            )}
          >
            <div className="p-2 bg-[#059669] rounded">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#001B51]">Unmute Room</p>
              <p className="text-xs text-[#7A7A7A]">Resume notifications</p>
            </div>
          </DropdownMenuItem>
        ) : (
          /* Mute Options */
          <>
            <div className="space-y-1">
              {muteOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => handleMute(option.hours)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer",
                      "hover:bg-[#FFB627]/10 focus:bg-[#FFB627]/10",
                      "transition-colors duration-150"
                    )}
                  >
                    <div className="p-2 bg-[#FFB627]/20 rounded">
                      <IconComponent className="h-4 w-4 text-[#001B51]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#001B51]">{option.label}</p>
                      {option.hours && (
                        <p className="text-xs text-[#7A7A7A]">
                          {option.hours} hour{option.hours > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>

            <DropdownMenuSeparator className="my-2 bg-[#001B51]/10" />

            {/* Info */}
            <div className="px-3 py-2 bg-blue-50 rounded-md">
              <p className="text-xs text-[#001B51] leading-relaxed">
                💡 You'll still receive notifications for @mentions
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
