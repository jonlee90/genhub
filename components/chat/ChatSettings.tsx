'use client';

/**
 * ChatSettings - Chat room settings modal with industrial design
 *
 * Features:
 * - Name & Description editing (GC Admin/PM only)
 * - Member list (read-only)
 * - Export chat transcript (GC Admin only)
 * - Only for project chat rooms
 * - Blueprint-inspired modal design
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Settings, Save, Download, Loader2, Hash, AlertCircle } from 'lucide-react';
import { ChatMemberList, ChatMember } from './ChatMemberList';
import { updateChatRoom, exportTranscript, getChatRoomParticipants, isUserGcAdmin } from '@/app/actions/chat';
import { toast } from 'sonner';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomType: 'project' | 'dm';
  initialName: string;
  initialDescription: string | null;
}

// Debug: Main settings modal with industrial blueprint design
export function ChatSettings({
  isOpen,
  onClose,
  roomId,
  roomType,
  initialName,
  initialDescription,
}: ChatSettingsProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [isGcAdminOrPm, setIsGcAdminOrPm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  console.log('[ChatSettings] Rendering:', {
    isOpen,
    roomId,
    roomType,
    isGcAdminOrPm,
  });

  // Debug: Only show for project rooms
  if (roomType !== 'project') {
    return null;
  }

  // Debug: Fetch members and check user role
  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      console.log('[ChatSettings] Fetching members and user role...');
      setIsLoadingMembers(true);

      try {
        // Check if user is GC Admin or PM
        const roleResult = await isUserGcAdmin();
        console.log('[ChatSettings] User role check:', roleResult);
        setIsGcAdminOrPm(roleResult.isGcAdmin || roleResult.isPm);

        // Fetch members
        const membersResult = await getChatRoomParticipants(roomId);
        if (membersResult.success && membersResult.participants) {
          console.log('[ChatSettings] Members loaded:', membersResult.participants.length);
          setMembers(membersResult.participants as ChatMember[]);
        } else {
          console.error('[ChatSettings] Failed to load members:', membersResult.error);
          toast.error('Failed to load members');
        }
      } catch (error) {
        console.error('[ChatSettings] Error loading data:', error);
        toast.error('An error occurred while loading settings');
      } finally {
        setIsLoadingMembers(false);
      }
    }

    fetchData();
  }, [isOpen, roomId]);

  // Debug: Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName(initialName);
      setDescription(initialDescription || '');
    }
  }, [isOpen, initialName, initialDescription]);

  // Debug: Handle save
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Room name is required');
      return;
    }

    console.log('[ChatSettings] Saving settings...');
    setIsSaving(true);

    try {
      const result = await updateChatRoom(roomId, {
        name: name.trim(),
        description: description.trim() || null,
      });

      if (result.success) {
        console.log('[ChatSettings] Settings saved successfully');
        toast.success('Settings updated');
        onClose();
      } else {
        console.error('[ChatSettings] Save failed:', result.error);
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('[ChatSettings] Save error:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Debug: Handle export
  const handleExport = async () => {
    console.log('[ChatSettings] Exporting transcript...');
    setIsExporting(true);

    try {
      const result = await exportTranscript(roomId);

      if (result.success && result.transcript) {
        console.log('[ChatSettings] Transcript exported successfully');

        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.transcript, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-transcript-${roomId}-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Transcript exported successfully');
      } else {
        console.error('[ChatSettings] Export failed:', result.error);
        toast.error(result.error || 'Failed to export transcript');
      }
    } catch (error) {
      console.error('[ChatSettings] Export error:', error);
      toast.error('An error occurred while exporting transcript');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop with blueprint grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-construction-blue/20 backdrop-blur-md z-50"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,27,81,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,27,81,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Debug: Settings modal with industrial stamped metal design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'fixed top-[5%] left-1/2 -translate-x-1/2 z-50',
              'w-full max-w-3xl max-h-[90vh] mx-auto',
              'bg-white rounded-xl shadow-construction-xl',
              'border-4 border-construction-blue/20',
              'overflow-hidden flex flex-col'
            )}
          >
            {/* Debug: Header with blueprint overlay */}
            <div className="relative bg-gradient-to-r from-construction-blue to-construction-blue/90 px-6 py-4 border-b-4 border-construction-yellow/60 shrink-0">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(white 1px, transparent 1px),
                    linear-gradient(90deg, white 1px, transparent 1px)
                  `,
                  backgroundSize: '16px 16px',
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight uppercase">
                      Chat Room Settings
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Hash className="h-3 w-3 text-white/60" />
                      <p className="text-xs font-mono text-white/80">{initialName}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close settings"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Debug: Content with scrollable area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-6 space-y-6">
                {/* Debug: Name & Description section (editable for GC Admin/PM only) */}
                <div>
                  <h3 className="text-sm font-black text-construction-blue uppercase tracking-wide mb-3">
                    Room Information
                  </h3>

                  {!isGcAdminOrPm && (
                    <div className="mb-4 p-3 bg-construction-yellow/10 border-l-4 border-construction-yellow rounded-r-lg">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-construction-accent shrink-0 mt-0.5" />
                        <p className="text-xs text-construction-accent font-mono">
                          Only GC Admins and PMs can edit room settings
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Room name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Room Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isGcAdminOrPm}
                        className={cn(
                          'w-full px-4 py-3 bg-white border-2 border-gray-200',
                          'rounded-lg font-medium text-gray-900',
                          'focus:outline-none focus:ring-4 focus:ring-construction-blue/20 focus:border-construction-blue',
                          'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60',
                          'transition-all duration-200',
                          'placeholder:text-gray-400'
                        )}
                        placeholder="Enter room name..."
                      />
                    </div>

                    {/* Room description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!isGcAdminOrPm}
                        rows={3}
                        className={cn(
                          'w-full px-4 py-3 bg-white border-2 border-gray-200',
                          'rounded-lg font-medium text-gray-900 resize-none',
                          'focus:outline-none focus:ring-4 focus:ring-construction-blue/20 focus:border-construction-blue',
                          'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60',
                          'transition-all duration-200',
                          'placeholder:text-gray-400'
                        )}
                        placeholder="Enter room description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Debug: Members section (read-only) */}
                <div>
                  <h3 className="text-sm font-black text-construction-blue uppercase tracking-wide mb-3">
                    Members ({members.length})
                  </h3>

                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-construction-blue animate-spin" />
                    </div>
                  ) : (
                    <ChatMemberList members={members} />
                  )}
                </div>

                {/* Debug: Export section (GC Admin only) */}
                {isGcAdminOrPm && (
                  <div>
                    <h3 className="text-sm font-black text-construction-blue uppercase tracking-wide mb-3">
                      Export
                    </h3>

                    <div
                      className={cn(
                        'p-4 rounded-lg',
                        'bg-gray-50 border-2 border-dashed border-gray-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Download className="h-5 w-5 text-construction-accent shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Export Chat Transcript</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Download a complete transcript of all messages, attachments, and reactions as a JSON file.
                          </p>

                          <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={cn(
                              'mt-3 px-4 py-2 rounded-lg',
                              'border-2 border-construction-accent bg-construction-accent',
                              'font-bold text-sm text-white uppercase tracking-wide',
                              'hover:bg-construction-accent/90 hover:shadow-lg',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              'transition-all duration-200',
                              'flex items-center gap-2'
                            )}
                          >
                            {isExporting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Export Transcript
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Debug: Footer with action buttons */}
            {isGcAdminOrPm && (
              <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 shrink-0">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className={cn(
                      'px-4 py-2 rounded-lg',
                      'border-2 border-gray-300 bg-white',
                      'font-bold text-sm text-gray-700 uppercase tracking-wide',
                      'hover:bg-gray-50 hover:border-gray-400',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-200'
                    )}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className={cn(
                      'px-4 py-2 rounded-lg',
                      'border-2 border-construction-blue bg-construction-blue',
                      'font-black text-sm text-white uppercase tracking-wide',
                      'hover:bg-construction-blue/90 hover:shadow-lg',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-200',
                      'flex items-center gap-2',
                      'shadow-md'
                    )}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
