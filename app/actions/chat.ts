'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// ============================================
// Validation Schemas
// ============================================

const sendMessageSchema = z.object({
  chatRoomId: z.string().uuid('Invalid chat room ID'),
  content: z.string().min(1, 'Message content is required').max(10000, 'Message is too long'),
  replyToId: z.string().uuid('Invalid reply ID').optional().nullable(),
  entityReferences: z.array(
    z.object({
      type: z.enum(['user', 'task', 'project', 'material', 'expense']),
      id: z.string().uuid(),
    })
  ).optional().nullable(),
});

const uploadAttachmentSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  file: z.instanceof(File),
});

const markAsReadSchema = z.object({
  chatRoomId: z.string().uuid('Invalid chat room ID'),
});

const toggleReactionSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Emoji too long'),
});

const muteChatRoomSchema = z.object({
  chatRoomId: z.string().uuid('Invalid chat room ID'),
  mutedUntil: z.string().datetime().nullable(), // ISO string or null to unmute
});

const createDMRoomSchema = z.object({
  recipientUserId: z.string().uuid('Invalid recipient user ID'),
});

const editMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  newContent: z.string().min(1, 'Message content is required').max(10000, 'Message is too long'),
});

const deleteMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});

// SECURITY FIX (M2): Add validation schema for updateChatRoom
const updateChatRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  name: z.string().min(1, 'Room name is required').max(100, 'Room name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
});

const exportTranscriptSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

const getChatRoomParticipantsSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  console.log('[getUserContext] Getting user session...');

  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    console.error('[getUserContext] No authenticated user found');
    return { error: 'Not authenticated' };
  }

  console.log('[getUserContext] User authenticated:', session.user.id);

  // Create Supabase client
  const supabase = await createClient();

  // Get user's company and role using NextAuth user ID
  const { data: companyUser, error: companyError } = (await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single()) as { data: any; error: any };

  if (companyError || !companyUser) {
    console.error('[getUserContext] No active company found:', companyError);
    return { error: 'No active company found for user' };
  }

  console.log('[getUserContext] User context loaded:', {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
  });

  return {
    user: {
      id: session.user.id,
      name: session.user.name || 'Unknown User',
      email: session.user.email || '',
    },
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

async function verifyChatRoomAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chatRoomId: string,
  userId: string
) {
  console.log('[verifyChatRoomAccess] Verifying access for user:', userId, 'to room:', chatRoomId);

  // Check if user is a participant in the chat room
  const { data: participant, error } = (await supabase
    .from('chat_participants')
    .select('id, role')
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId)
    .single()) as { data: any; error: any };

  if (error || !participant) {
    console.error('[verifyChatRoomAccess] Access denied:', error);
    return { error: 'You do not have access to this chat room' };
  }

  console.log('[verifyChatRoomAccess] Access granted, participant role:', participant.role);
  return { participant };
}

// ============================================
// Server Actions
// ============================================

/**
 * Send a message to a chat room
 * Validates user is a participant before sending
 */
export async function sendMessage(formData: FormData) {
  console.log('[sendMessage] Starting message send...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Get session for user name in notifications
  const session = await auth();

  // Parse entity references with error handling
  let entityReferences = null;
  try {
    const refsString = formData.get('entityReferences');
    if (refsString) {
      entityReferences = JSON.parse(refsString as string);
    }
  } catch (e) {
    console.error('[sendMessage] Invalid JSON in entityReferences:', e);
    return { error: 'Invalid entity references format' };
  }

  // Parse form data
  const rawData = {
    chatRoomId: formData.get('chatRoomId') as string,
    content: formData.get('content') as string,
    replyToId: formData.get('replyToId') as string | null,
    entityReferences,
  };

  console.log('[sendMessage] Parsed form data:', {
    chatRoomId: rawData.chatRoomId,
    contentLength: rawData.content?.length,
    hasReply: !!rawData.replyToId,
    hasReferences: !!rawData.entityReferences,
  });

  // Validate input
  const validation = sendMessageSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[sendMessage] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const data = validation.data;

  // Verify user is a participant in the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, data.chatRoomId, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[sendMessage] User has access, inserting message...');

  // Insert message (without nested relationship to avoid FK errors)
  const { data: messageData, error: insertError } = (await (supabase
    .from('messages') as any)
    .insert({
      chat_room_id: data.chatRoomId,
      sender_id: userId,
      content: data.content,
      reply_to_id: data.replyToId || null,
      entity_references: data.entityReferences || [],
    })
    .select('*')
    .single()) as { data: any; error: any };

  if (insertError) {
    console.error('[sendMessage] Error inserting message:', insertError);
    return { error: 'Failed to send message. Please try again.' };
  }

  console.log('[sendMessage] Message sent successfully:', messageData.id);

  // Fetch sender profile separately (avoid FK relationship issues)
  const { data: senderProfile } = await supabase
    .from('user_profiles')
    .select('id, name, email, avatar_url')
    .eq('id', userId)
    .single();

  // Combine message with sender profile
  const message = {
    ...messageData,
    sender: senderProfile || null,
  };

  // ============================================
  // Task 0019: Two-Way Sync to KakaoTalk
  // ============================================
  // TODO: Uncomment when kakao_connections table is created (Task 0019)
  // console.log('[sendMessage] Checking for KakaoTalk two-way sync...');
  // try {
  //   // Check if sender has two-way sync enabled
  //   const { data: kakaoConnection } = await supabase
  //     .from('kakao_connections')
  //     .select('two_way_sync')
  //     .eq('user_id', userId)
  //     .eq('two_way_sync', true)
  //     .is('disconnected_at', null)
  //     .single();

  //   if (kakaoConnection) {
  //     console.log('[sendMessage] Two-way sync enabled, syncing to KakaoTalk...');
  //     const { KakaoService } = await import('@/lib/services/kakao');
  //     await KakaoService.syncMessage(userId, {
  //       content: data.content,
  //       chatRoomId: data.chatRoomId,
  //     });
  //   }
  // } catch (syncError) {
  //   console.error('[sendMessage] Error syncing to KakaoTalk:', syncError);
  //   // Don't fail message send if sync fails
  // }

  // Get chat room details for push notifications
  const { data: chatRoom } = (await supabase
    .from('chat_rooms')
    .select('id, name, type')
    .eq('id', data.chatRoomId)
    .single()) as { data: any; error: any };

  // Create mention notifications for @user references
  if (data.entityReferences && data.entityReferences.length > 0) {
    console.log('[sendMessage] Processing entity references:', data.entityReferences);

    const userMentions = data.entityReferences.filter(ref => ref.type === 'user');

    if (userMentions.length > 0) {
      console.log('[sendMessage] Creating notifications for', userMentions.length, 'user mentions');

      // Create notifications for mentioned users (excluding self-mentions)
      const mentionNotifications = userMentions
        .filter(ref => ref.id !== userId) // Don't notify yourself
        .map(ref => ({
          user_id: ref.id,
          type: 'mention' as const,
          title: 'You were mentioned in a message',
          message: `${session?.user?.name || 'Someone'} mentioned you in a message`,
          link: `/app/chat/${data.chatRoomId}`,
        }));

      if (mentionNotifications.length > 0) {
        const { error: notificationError } = await (supabase
          .from('notifications') as any)
          .insert(mentionNotifications);

        if (notificationError) {
          console.error('[sendMessage] Error creating mention notifications:', notificationError);
          // Don't fail the message send if notification fails
        } else {
          console.log('[sendMessage] Created', mentionNotifications.length, 'mention notifications');
        }
      }
    }
  }

  // If this is a reply, create notification for parent message author
  if (data.replyToId) {
    console.log('[sendMessage] Creating notification for reply to message:', data.replyToId);

    // Get the parent message to find the author
    const { data: parentMessage, error: parentError } = (await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', data.replyToId)
      .single()) as { data: any; error: any };

    if (!parentError && parentMessage && parentMessage.sender_id !== userId) {
      // Don't notify if replying to your own message
      console.log('[sendMessage] Creating notification for user:', parentMessage.sender_id);

      const { error: notificationError } = await (supabase
        .from('notifications') as any)
        .insert({
          user_id: parentMessage.sender_id,
          type: 'mention', // Using 'mention' type for thread replies
          title: 'New reply to your message',
          message: `${session?.user?.name || 'Someone'} replied to your message`,
          link: `/app/chat/${data.chatRoomId}?thread=${data.replyToId}`,
        });

      if (notificationError) {
        console.error('[sendMessage] Error creating notification:', notificationError);
        // Don't fail the message send if notification fails
      } else {
        console.log('[sendMessage] Notification created successfully');
      }
    }
  }

  // ============================================
  // Push Notification Triggers
  // ============================================
  console.log('[sendMessage] Triggering push notifications for offline recipients...');

  // Get all participants in the chat room (excluding sender)
  const { data: participants } = (await supabase
    .from('chat_participants')
    .select('user_id, muted_until')
    .eq('chat_room_id', data.chatRoomId)
    .neq('user_id', userId)) as { data: any; error: any };

  if (participants && participants.length > 0) {
    console.log('[sendMessage] Found', participants.length, 'potential recipients');

    for (const participant of participants) {
      // Check if room is muted for this user
      const isMuted = participant.muted_until && new Date(participant.muted_until) > new Date();

      // Check if this user was mentioned
      const hasMention = data.entityReferences?.some(
        ref => ref.type === 'user' && ref.id === participant.user_id
      );

      // Skip if muted AND not mentioned (mentions override mute)
      if (isMuted && !hasMention) {
        console.log('[sendMessage] Skipping push for muted room (user:', participant.user_id, ')');
        continue;
      }

      // Prepare push notification payload
      const pushTitle = hasMention
        ? `${session?.user?.name || 'Someone'} mentioned you in ${chatRoom?.name || 'a chat'}`
        : chatRoom?.name || 'New message';

      const pushBody = data.content.length > 100
        ? data.content.substring(0, 100) + '...'
        : data.content;

      const pushData = {
        roomId: data.chatRoomId,
        messageId: message.id,
        url: `/app/chat/${data.chatRoomId}`,
      };

      // Call Edge Function to send push
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('[sendMessage] Missing Supabase credentials for Edge Function');
          continue;
        }

        console.log('[sendMessage] Sending push to user:', participant.user_id);

        const pushResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-push-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: participant.user_id,
              title: pushTitle,
              body: pushBody,
              data: pushData,
            }),
          }
        );

        if (!pushResponse.ok) {
          const errorText = await pushResponse.text();
          console.error('[sendMessage] Push notification failed:', errorText);
        } else {
          const result = await pushResponse.json();
          console.log('[sendMessage] Push notification sent:', result);
        }
      } catch (error) {
        console.error('[sendMessage] Error calling push notification Edge Function:', error);
        // Don't fail message send if push fails
      }
    }
  }

  // Revalidate chat paths
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${data.chatRoomId}`);

  return { success: true, message };
}

/**
 * Mark all messages in a chat room as read for the current user
 * Updates last_read_at timestamp for the user's participant record
 */
export async function markMessagesAsRead(chatRoomId: string) {
  console.log('[markMessagesAsRead] Marking messages as read for room:', chatRoomId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = markAsReadSchema.safeParse({ chatRoomId });
  if (!validation.success) {
    console.error('[markMessagesAsRead] Validation failed:', validation.error);
    return { error: 'Invalid chat room ID' };
  }

  // Verify user is a participant
  const accessCheck = await verifyChatRoomAccess(supabase, chatRoomId, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[markMessagesAsRead] Updating last_read_at timestamp...');

  // Update last_read_at for the user's participant record
  const { error: updateError } = await (supabase
    .from('chat_participants') as any)
    .update({ last_read_at: new Date().toISOString() })
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[markMessagesAsRead] Error updating last_read_at:', updateError);
    return { error: 'Failed to mark messages as read' };
  }

  console.log('[markMessagesAsRead] Messages marked as read successfully');

  // Revalidate chat paths to update unread badges
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${chatRoomId}`);

  return { success: true };
}

/**
 * Get all reply messages for a parent message (thread view)
 * Returns the parent message and all its replies
 */
export async function getThreadMessages(parentMessageId: string) {
  console.log('[getThreadMessages] Fetching thread for parent message:', parentMessageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Get the parent message first
  const { data: parentMessage, error: parentError } = (await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('id', parentMessageId)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (parentError) {
    console.error('[getThreadMessages] Error fetching parent message:', parentError);
    return { error: 'Failed to fetch parent message' };
  }

  // Verify user has access to the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, parentMessage.chat_room_id, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[getThreadMessages] Fetching replies...');

  // Get all replies to the parent message
  const { data: replies, error: repliesError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('reply_to_id', parentMessageId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (repliesError) {
    console.error('[getThreadMessages] Error fetching replies:', repliesError);
    return { error: 'Failed to fetch thread replies' };
  }

  console.log('[getThreadMessages] Thread fetched successfully:', {
    parentId: parentMessageId,
    replyCount: replies.length,
  });

  return {
    success: true,
    parentMessage,
    replies,
  };
}

/**
 * Get reply count for a specific message
 * Used for displaying thread indicators in message list
 */
export async function getMessageReplyCount(messageId: string) {
  console.log('[getMessageReplyCount] Getting reply count for message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { supabase } = userContext;

  // Count non-deleted replies
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('reply_to_id', messageId)
    .is('deleted_at', null);

  if (error) {
    console.error('[getMessageReplyCount] Error counting replies:', error);
    return { error: 'Failed to count replies' };
  }

  console.log('[getMessageReplyCount] Reply count:', count);

  return {
    success: true,
    count: count || 0,
  };
}

/**
 * Get reply counts for multiple messages at once
 * More efficient than calling getMessageReplyCount for each message
 */
export async function getMessageReplyCounts(messageIds: string[]) {
  console.log('[getMessageReplyCounts] Getting reply counts for', messageIds.length, 'messages');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { supabase } = userContext;

  // Query all replies for the given message IDs
  const { data: replies, error } = await supabase
    .from('messages')
    .select('reply_to_id')
    .in('reply_to_id', messageIds)
    .is('deleted_at', null);

  if (error) {
    console.error('[getMessageReplyCounts] Error fetching replies:', error);
    return { error: 'Failed to fetch reply counts' };
  }

  // Count replies per message
  const counts: Record<string, number> = {};
  messageIds.forEach(id => counts[id] = 0);

  replies?.forEach(reply => {
    if (reply.reply_to_id) {
      counts[reply.reply_to_id] = (counts[reply.reply_to_id] || 0) + 1;
    }
  });

  console.log('[getMessageReplyCounts] Reply counts calculated:', counts);

  return {
    success: true,
    counts,
  };
}

// ============================================
// Reaction Functions
// ============================================

/**
 * Toggle a reaction on a message (add if not exists, remove if exists)
 * No notifications are sent for reactions (silent acknowledgment per Req 3.7)
 * @param messageId - UUID of the message to react to
 * @param emoji - Emoji character (construction-themed: 👍, ✅, 🏗️, 🔨, 🔧, ⚠️, 🚧, 📋, 💰, 🏢)
 */
export async function toggleReaction(messageId: string, emoji: string) {
  console.log('[toggleReaction] Toggling reaction:', { messageId, emoji });

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = toggleReactionSchema.safeParse({ messageId, emoji });
  if (!validation.success) {
    console.error('[toggleReaction] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const data = validation.data;

  // Get the message to verify it exists and get chat_room_id for access check
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('id, chat_room_id')
    .eq('id', data.messageId)
    .is('deleted_at', null)
    .single();

  if (messageError || !message) {
    console.error('[toggleReaction] Message not found:', messageError);
    return { error: 'Message not found' };
  }

  // Verify user has access to the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, message.chat_room_id, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[toggleReaction] User has access, checking existing reaction...');

  // Check if reaction already exists
  const { data: existingReaction, error: checkError } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', data.messageId)
    .eq('user_id', userId)
    .eq('emoji', data.emoji)
    .maybeSingle();

  if (checkError) {
    console.error('[toggleReaction] Error checking existing reaction:', checkError);
    return { error: 'Failed to check reaction status' };
  }

  if (existingReaction) {
    // Reaction exists, remove it
    console.log('[toggleReaction] Removing existing reaction:', existingReaction.id);

    const { error: deleteError } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existingReaction.id);

    if (deleteError) {
      console.error('[toggleReaction] Error removing reaction:', deleteError);
      return { error: 'Failed to remove reaction' };
    }

    console.log('[toggleReaction] Reaction removed successfully');

    // Revalidate to update UI
    revalidatePath('/app/chat');
    revalidatePath(`/app/chat/${message.chat_room_id}`);

    return {
      success: true,
      action: 'removed' as const,
      messageId: data.messageId,
      emoji: data.emoji,
    };
  } else {
    // Reaction doesn't exist, add it
    console.log('[toggleReaction] Adding new reaction');

    const { data: newReaction, error: insertError } = (await (supabase
      .from('message_reactions') as any)
      .insert({
        message_id: data.messageId,
        user_id: userId,
        emoji: data.emoji,
      })
      .select()
      .single()) as { data: any; error: any };

    if (insertError) {
      console.error('[toggleReaction] Error adding reaction:', insertError);
      return { error: 'Failed to add reaction' };
    }

    console.log('[toggleReaction] Reaction added successfully:', newReaction.id);

    // Revalidate to update UI
    revalidatePath('/app/chat');
    revalidatePath(`/app/chat/${message.chat_room_id}`);

    return {
      success: true,
      action: 'added' as const,
      messageId: data.messageId,
      emoji: data.emoji,
      reaction: newReaction,
    };
  }
}

/**
 * Get reactions for a specific message
 * Returns grouped reactions with counts and user details
 * Includes hasReacted flag for current user
 */
export async function getMessageReactions(messageId: string) {
  console.log('[getMessageReactions] Fetching reactions for message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate messageId
  if (!messageId || messageId.length === 0) {
    return { error: 'Invalid message ID' };
  }

  // Get all reactions for the message
  const { data: reactions, error: reactionsError } = await supabase
    .from('message_reactions')
    .select(`
      id,
      emoji,
      created_at,
      user_id,
      user:user_profiles (
        id,
        name,
        avatar_url
      )
    `)
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (reactionsError) {
    console.error('[getMessageReactions] Error fetching reactions:', reactionsError);
    return { error: 'Failed to fetch reactions' };
  }

  // Group reactions by emoji and calculate counts
  const groupedReactions: Record<string, {
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{ id: string; name: string; avatar_url: string | null }>;
  }> = {};

  reactions?.forEach((reaction: any) => {
    const { emoji, user_id, user } = reaction;

    if (!groupedReactions[emoji]) {
      groupedReactions[emoji] = {
        emoji,
        count: 0,
        hasReacted: false,
        users: [],
      };
    }

    groupedReactions[emoji].count++;
    if (user_id === userId) {
      groupedReactions[emoji].hasReacted = true;
    }

    // Add user info for tooltip
    if (user) {
      groupedReactions[emoji].users.push({
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
      });
    }
  });

  // Convert to array for easier rendering
  const reactionArray = Object.values(groupedReactions);

  console.log('[getMessageReactions] Reactions fetched:', {
    messageId,
    uniqueEmojis: reactionArray.length,
    totalReactions: reactions?.length || 0,
  });

  return {
    success: true,
    reactions: reactionArray,
  };
}

/**
 * Get reactions for multiple messages at once
 * More efficient than calling getMessageReactions for each message
 */
export async function getMessagesReactions(messageIds: string[]) {
  console.log('[getMessagesReactions] Fetching reactions for', messageIds.length, 'messages');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  if (!messageIds || messageIds.length === 0) {
    return { success: true, reactionsMap: {} };
  }

  // Query all reactions for the given message IDs
  const { data: reactions, error } = await supabase
    .from('message_reactions')
    .select(`
      id,
      message_id,
      emoji,
      user_id,
      created_at,
      user:user_profiles (
        id,
        name,
        avatar_url
      )
    `)
    .in('message_id', messageIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMessagesReactions] Error fetching reactions:', error);
    return { error: 'Failed to fetch reactions' };
  }

  // Group reactions by message ID, then by emoji
  const reactionsMap: Record<string, Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{ id: string; name: string; avatar_url: string | null }>;
  }>> = {};

  // Initialize empty arrays for all message IDs
  messageIds.forEach(id => reactionsMap[id] = []);

  // Group reactions
  const tempMap: Record<string, Record<string, any>> = {};

  reactions?.forEach((reaction: any) => {
    const { message_id, emoji, user_id, user } = reaction;

    if (!tempMap[message_id]) {
      tempMap[message_id] = {};
    }

    if (!tempMap[message_id][emoji]) {
      tempMap[message_id][emoji] = {
        emoji,
        count: 0,
        hasReacted: false,
        users: [],
      };
    }

    tempMap[message_id][emoji].count++;
    if (user_id === userId) {
      tempMap[message_id][emoji].hasReacted = true;
    }

    if (user) {
      tempMap[message_id][emoji].users.push({
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
      });
    }
  });

  // Convert to array format
  Object.keys(tempMap).forEach(messageId => {
    reactionsMap[messageId] = Object.values(tempMap[messageId]);
  });

  console.log('[getMessagesReactions] Reactions fetched for', Object.keys(reactionsMap).length, 'messages');

  return {
    success: true,
    reactionsMap,
  };
}

// ============================================
// File Attachment Functions
// ============================================

/**
 * Upload a file attachment for a message
 * Validates file size (max 10MB) and type, uploads to Vercel Blob
 * @param formData - FormData containing messageId and file
 * @returns Attachment metadata with URL
 */
export async function uploadAttachment(formData: FormData) {
  console.log('[uploadAttachment] Starting file upload...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Extract file from FormData
  const file = formData.get('file') as File | null;
  const messageId = formData.get('messageId') as string | null;

  if (!file || !messageId) {
    console.error('[uploadAttachment] Missing file or messageId');
    return { error: 'File and message ID are required' };
  }

  console.log('[uploadAttachment] File received:', {
    name: file.name,
    size: file.size,
    type: file.type,
    messageId,
  });

  // Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10485760; // 10MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    console.error('[uploadAttachment] File too large:', file.size);
    return { error: 'File size exceeds 10MB limit' };
  }

  if (file.size === 0) {
    console.error('[uploadAttachment] Empty file');
    return { error: 'File is empty' };
  }

  // Validate file type
  const ALLOWED_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    // Archives
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    console.error('[uploadAttachment] Invalid file type:', file.type);
    return {
      error: 'Invalid file type. Allowed: images (jpg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx), archives (zip)',
    };
  }

  // Verify message exists and user has access
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('id, chat_room_id, sender_id')
    .eq('id', messageId)
    .is('deleted_at', null)
    .single();

  if (messageError || !message) {
    console.error('[uploadAttachment] Message not found:', messageError);
    return { error: 'Message not found' };
  }

  // Verify user has access to the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, message.chat_room_id, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[uploadAttachment] Access verified, uploading to Vercel Blob...');

  try {
    // Upload to Vercel Blob
    const { put } = await import('@vercel/blob');

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `chat/${message.chat_room_id}/${messageId}/${timestamp}-${sanitizedFilename}`;

    console.log('[uploadAttachment] Uploading to blob:', blobFilename);

    const blob = await put(blobFilename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('[uploadAttachment] File uploaded to Vercel Blob:', blob.url);

    // Determine if this is an image (for thumbnail generation)
    const isImage = file.type.startsWith('image/');
    let thumbnailUrl = null;

    if (isImage) {
      // Vercel Blob doesn't auto-generate thumbnails, but we can use the original URL
      // Or implement thumbnail generation later with image processing
      thumbnailUrl = blob.url;
    }

    // Create attachment record in database
    const { data: attachment, error: insertError } = (await (supabase
      .from('message_attachments') as any)
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: blob.url,
        file_type: file.type,
        file_size: file.size,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single()) as { data: any; error: any };

    if (insertError) {
      console.error('[uploadAttachment] Error creating attachment record:', insertError);
      // TODO: Delete blob if database insert fails
      return { error: 'Failed to save attachment metadata' };
    }

    console.log('[uploadAttachment] Attachment created successfully:', attachment.id);

    // Revalidate chat paths
    revalidatePath('/app/chat');
    revalidatePath(`/app/chat/${message.chat_room_id}`);

    return {
      success: true,
      attachment: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_url: attachment.file_url,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        thumbnail_url: attachment.thumbnail_url,
        created_at: attachment.created_at,
      },
    };
  } catch (error) {
    console.error('[uploadAttachment] Unexpected error:', error);
    return { error: 'Failed to upload file. Please try again.' };
  }
}

/**
 * Get attachments for a specific message
 * @param messageId - UUID of the message
 * @returns Array of attachment metadata
 */
export async function getMessageAttachments(messageId: string) {
  console.log('[getMessageAttachments] Fetching attachments for message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate messageId
  if (!messageId || messageId.length === 0) {
    return { error: 'Invalid message ID' };
  }

  // Verify message exists and get chat_room_id
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('id, chat_room_id')
    .eq('id', messageId)
    .is('deleted_at', null)
    .single();

  if (messageError || !message) {
    console.error('[getMessageAttachments] Message not found:', messageError);
    return { error: 'Message not found' };
  }

  // Verify user has access to the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, message.chat_room_id, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  // Fetch attachments
  const { data: attachments, error: attachmentsError } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (attachmentsError) {
    console.error('[getMessageAttachments] Error fetching attachments:', attachmentsError);
    return { error: 'Failed to fetch attachments' };
  }

  console.log('[getMessageAttachments] Attachments fetched:', attachments?.length || 0);

  return {
    success: true,
    attachments: attachments || [],
  };
}

/**
 * Delete an attachment (soft delete or hard delete from blob)
 * @param attachmentId - UUID of the attachment
 * @returns Success status
 */
export async function deleteAttachment(attachmentId: string) {
  console.log('[deleteAttachment] Deleting attachment:', attachmentId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate attachmentId
  if (!attachmentId || attachmentId.length === 0) {
    return { error: 'Invalid attachment ID' };
  }

  // Get attachment to verify ownership
  const { data: attachment, error: attachmentError } = await supabase
    .from('message_attachments')
    .select(`
      *,
      message:messages (
        id,
        sender_id,
        chat_room_id
      )
    `)
    .eq('id', attachmentId)
    .single();

  if (attachmentError || !attachment) {
    console.error('[deleteAttachment] Attachment not found:', attachmentError);
    return { error: 'Attachment not found' };
  }

  const message = attachment.message as any;

  // Verify user is the message sender
  if (message.sender_id !== userId) {
    console.error('[deleteAttachment] User does not own this attachment');
    return { error: 'You can only delete your own attachments' };
  }

  console.log('[deleteAttachment] Deleting from database...');

  // Delete from database (this will cascade)
  const { error: deleteError } = await supabase
    .from('message_attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteError) {
    console.error('[deleteAttachment] Error deleting attachment:', deleteError);
    return { error: 'Failed to delete attachment' };
  }

  // TODO: Optionally delete from Vercel Blob storage
  // This requires the blob token and may be done asynchronously
  // For now, we just remove the database record

  console.log('[deleteAttachment] Attachment deleted successfully');

  // Revalidate chat paths
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${message.chat_room_id}`);

  return { success: true };
}

/**
 * Get attachments for multiple messages at once
 * More efficient than calling getMessageAttachments for each message
 * @param messageIds - Array of message UUIDs
 * @returns Map of messageId to attachments array
 */
export async function getMessagesAttachments(messageIds: string[]) {
  console.log('[getMessagesAttachments] Fetching attachments for', messageIds.length, 'messages');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { supabase } = userContext;

  if (!messageIds || messageIds.length === 0) {
    return { success: true, attachmentsMap: {} };
  }

  // Query all attachments for the given message IDs
  const { data: attachments, error } = await supabase
    .from('message_attachments')
    .select('*')
    .in('message_id', messageIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMessagesAttachments] Error fetching attachments:', error);
    return { error: 'Failed to fetch attachments' };
  }

  // Group attachments by message_id
  const attachmentsMap: Record<string, any[]> = {};

  // Initialize empty arrays for all message IDs
  messageIds.forEach(id => attachmentsMap[id] = []);

  // Group attachments
  attachments?.forEach((attachment: any) => {
    const messageId = attachment.message_id;
    if (attachmentsMap[messageId]) {
      attachmentsMap[messageId].push(attachment);
    }
  });

  console.log('[getMessagesAttachments] Attachments fetched for', Object.keys(attachmentsMap).length, 'messages');

  return {
    success: true,
    attachmentsMap,
  };
}

// ============================================
// Notification Preferences Functions
// ============================================

/**
 * Mute or unmute a chat room for the current user
 * @param data - Object containing chatRoomId and mutedUntil (ISO string or null to unmute)
 * @returns Success status
 */
export async function muteChatRoom(data: z.infer<typeof muteChatRoomSchema>) {
  console.log('[muteChatRoom] Starting mute operation:', data);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = muteChatRoomSchema.safeParse(data);
  if (!validation.success) {
    console.error('[muteChatRoom] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const validated = validation.data;

  console.log('[muteChatRoom] Validated data:', {
    chatRoomId: validated.chatRoomId,
    mutedUntil: validated.mutedUntil,
    action: validated.mutedUntil ? 'mute' : 'unmute'
  });

  // Verify user is a participant in the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, validated.chatRoomId, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  console.log('[muteChatRoom] Updating muted_until for participant...');

  // Update muted_until for this participant
  const { error: updateError } = await supabase
    .from('chat_participants')
    .update({ muted_until: validated.mutedUntil })
    .eq('chat_room_id', validated.chatRoomId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[muteChatRoom] Error updating muted_until:', updateError);
    return { error: 'Failed to update mute status' };
  }

  console.log('[muteChatRoom] Mute status updated successfully');

  // Revalidate chat paths to update UI
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${validated.chatRoomId}`);

  return {
    success: true,
    mutedUntil: validated.mutedUntil,
  };
}

// ============================================
// Direct Messaging Functions
// ============================================

/**
 * Create or return existing DM room between current user and recipient
 * Task 0020: Direct Messaging
 *
 * @param recipientUserId - UUID of the user to DM with
 * @returns Existing or newly created DM room
 */
export async function createDMRoom(recipientUserId: string) {
  console.log('[chat-actions] Creating/finding DM room with recipient:', recipientUserId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase, companyId } = userContext;

  // SECURITY (H2 Fix): Validate companyId is not null
  if (!companyId) {
    console.error('[chat-actions] No active company found for user');
    return { error: 'You must be in a company to send direct messages' };
  }

  // Validate input
  const validation = createDMRoomSchema.safeParse({ recipientUserId });
  if (!validation.success) {
    console.error('[chat-actions] Validation failed:', validation.error.flatten());
    return {
      error: 'Invalid recipient user ID',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  // Prevent DM with self
  if (userId === recipientUserId) {
    console.error('[chat-actions] Cannot create DM with self');
    return { error: 'Cannot message yourself' };
  }

  // Verify recipient exists and is in the same company
  const { data: recipient, error: recipientError } = await supabase
    .from('user_profiles')
    .select('id, name')
    .eq('id', recipientUserId)
    .single();

  if (recipientError || !recipient) {
    console.error('[chat-actions] Recipient not found:', recipientError);
    return { error: 'User not found' };
  }

  // Verify recipient is in the same company
  const { data: recipientCompany, error: recipientCompanyError } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', recipientUserId)
    .eq('status', 'active')
    .single();

  if (recipientCompanyError || !recipientCompany) {
    console.error('[chat-actions] Recipient company not found:', recipientCompanyError);
    return { error: 'User not found in your company' };
  }

  // SECURITY (H2 Fix): Validate recipient's companyId is not null
  if (!recipientCompany.company_id) {
    console.error('[chat-actions] Recipient has no active company');
    return { error: 'User not in a company' };
  }

  if (recipientCompany.company_id !== companyId) {
    console.error('[chat-actions] Recipient in different company');
    return { error: 'User not in your company' };
  }

  // Check for existing DM room using direct query
  // (RPC functions require JWT token which isn't available in server actions)
  console.log('[chat-actions] Checking for existing DM room...');

  // Find chat room where both users are participants and it's a DM type
  const { data: existingRooms, error: findError } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      chat_participants!inner (user_id)
    `)
    .eq('type', 'dm')
    .is('project_id', null);

  if (findError) {
    console.error('[chat-actions] Error finding existing DM rooms:', findError);
    return { error: 'Failed to check for existing DM' };
  }

  // Find a room where both users are participants
  let existingRoomId: string | null = null;

  if (existingRooms && existingRooms.length > 0) {
    // For each potential DM room, check if both users are participants
    for (const room of existingRooms) {
      const participantIds = (room.chat_participants as Array<{ user_id: string }>).map(p => p.user_id);
      if (participantIds.includes(userId) && participantIds.includes(recipientUserId)) {
        existingRoomId = room.id;
        break;
      }
    }
  }

  console.log('[chat-actions] Existing room check result:', existingRoomId);

  // If DM room exists, return it
  if (existingRoomId) {
    console.log('[chat-actions] Found existing DM room:', existingRoomId);

    // Fetch room data
    const { data: room, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', existingRoomId)
      .single();

    if (fetchError || !room) {
      console.error('[chat-actions] Error fetching existing room:', fetchError);
      return { error: 'Failed to fetch DM room' };
    }

    // Fetch participants separately
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('id, user_id, role')
      .eq('chat_room_id', existingRoomId);

    if (participantsError) {
      console.error('[chat-actions] Error fetching participants:', participantsError);
      return { error: 'Failed to fetch DM participants' };
    }

    // Fetch user profiles for participants
    const userIds = participants?.map(p => p.user_id) || [];
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('[chat-actions] Error fetching user profiles:', profilesError);
      return { error: 'Failed to fetch user profiles' };
    }

    // Combine participants with their profiles
    const participantsWithProfiles = participants?.map(p => ({
      ...p,
      user_profiles: userProfiles?.find(up => up.id === p.user_id),
    }));

    return {
      success: true,
      room: {
        ...room,
        participants: participantsWithProfiles,
      }
    };
  }

  // Create new DM room
  console.log('[chat-actions] Creating new DM room...');

  const { data: newRoom, error: createError } = (await (supabase
    .from('chat_rooms') as any)
    .insert({
      name: `DM: ${recipient.name}`, // DM room name (not displayed in UI)
      type: 'dm',
      company_id: companyId,
      project_id: null, // DMs are not project-specific
    })
    .select()
    .single()) as { data: any; error: any };

  if (createError || !newRoom) {
    console.error('[chat-actions] Error creating DM room:', createError);
    return { error: 'Failed to create DM room' };
  }

  console.log('[chat-actions] Created new DM room:', newRoom.id);

  // Add both users as participants with 'member' role
  const { error: participantsError } = await (supabase
    .from('chat_participants') as any)
    .insert([
      {
        chat_room_id: newRoom.id,
        user_id: userId,
        role: 'member',
      },
      {
        chat_room_id: newRoom.id,
        user_id: recipientUserId,
        role: 'member',
      },
    ]);

  if (participantsError) {
    console.error('[chat-actions] Error adding participants:', participantsError);

    // SECURITY (H1 Fix): Rollback with error handling
    const { error: deleteError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', newRoom.id);

    if (deleteError) {
      console.error('[chat-actions] CRITICAL: Failed to rollback room creation:', deleteError);
      console.error('[chat-actions] Orphaned room ID:', newRoom.id);
      // TODO: Log to monitoring system (e.g., Sentry)
    } else {
      console.log('[chat-actions] Successfully rolled back room creation');
    }

    return { error: 'Failed to add participants' };
  }

  console.log('[chat-actions] Added participants to DM room');

  // Fetch full room data
  const { data: fullRoom, error: fetchError } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', newRoom.id)
    .single();

  if (fetchError || !fullRoom) {
    console.error('[chat-actions] Error fetching new room:', fetchError);
    return { error: 'Failed to fetch DM room' };
  }

  // Fetch participants
  const { data: participants, error: fetchParticipantsError } = await supabase
    .from('chat_participants')
    .select('id, user_id, role')
    .eq('chat_room_id', newRoom.id);

  if (fetchParticipantsError) {
    console.error('[chat-actions] Error fetching participants:', fetchParticipantsError);
    return { error: 'Failed to fetch DM participants' };
  }

  // Fetch user profiles for participants
  const userIds = participants?.map(p => p.user_id) || [];
  const { data: userProfiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    console.error('[chat-actions] Error fetching user profiles:', profilesError);
    return { error: 'Failed to fetch user profiles' };
  }

  // Combine participants with their profiles
  const participantsWithProfiles = participants?.map(p => ({
    ...p,
    user_profiles: userProfiles?.find(up => up.id === p.user_id),
  }));

  console.log('[chat-actions] Successfully created DM room');

  // Revalidate chat paths
  revalidatePath('/app/chat');

  return {
    success: true,
    room: {
      ...fullRoom,
      participants: participantsWithProfiles,
    }
  };
}

// ============================================
// Message Editing & Deletion Functions
// Task 0022: Message Editing & Deletion
// ============================================

/**
 * Edit a message
 * Only the sender can edit their own messages
 * Sets edited_at timestamp
 *
 * @param messageId - UUID of the message to edit
 * @param newContent - New content for the message
 * @returns Updated message
 */
export async function editMessage(messageId: string, newContent: string) {
  console.log('[editMessage] Editing message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = editMessageSchema.safeParse({ messageId, newContent });
  if (!validation.success) {
    console.error('[editMessage] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const data = validation.data;

  console.log('[editMessage] Updating message content...');

  // SECURITY FIX (H2): Atomic update with ownership check to prevent race condition
  // This eliminates TOCTOU (Time-of-Check-Time-of-Use) vulnerability by checking
  // ownership in the same query as the update operation
  const { data: updatedMessage, error: updateError } = await supabase
    .from('messages')
    .update({
      content: data.newContent,
      edited_at: new Date().toISOString(),
    })
    .eq('id', data.messageId)
    .eq('sender_id', userId) // ATOMIC ownership check - only updates if sender matches
    .is('deleted_at', null) // Cannot edit deleted messages
    .select(`
      *,
      sender:user_profiles (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (updateError || !updatedMessage) {
    console.error('[editMessage] Error updating message:', updateError);
    // If no rows updated, either message doesn't exist, not owned by user, or deleted
    return { error: 'Message not found or you do not have permission to edit it' };
  }

  console.log('[editMessage] Message updated successfully');

  // Revalidate chat paths
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${updatedMessage.chat_room_id}`);

  return {
    success: true,
    message: updatedMessage,
  };
}

/**
 * Delete a message (soft delete)
 * Only the sender can delete their own messages
 * Sets deleted_at timestamp, keeps attachments
 *
 * @param messageId - UUID of the message to delete
 * @returns Success status
 */
export async function deleteMessage(messageId: string) {
  console.log('[deleteMessage] Deleting message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = deleteMessageSchema.safeParse({ messageId });
  if (!validation.success) {
    console.error('[deleteMessage] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const data = validation.data;

  console.log('[deleteMessage] Soft deleting message...');

  // SECURITY FIX (H2): Atomic update with ownership check to prevent race condition
  // This eliminates TOCTOU vulnerability by checking ownership in the same query
  const { data: deletedMessage, error: deleteError } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', data.messageId)
    .eq('sender_id', userId) // ATOMIC ownership check - only deletes if sender matches
    .is('deleted_at', null) // Cannot delete already deleted messages
    .select('id, chat_room_id')
    .single();

  if (deleteError || !deletedMessage) {
    console.error('[deleteMessage] Error deleting message:', deleteError);
    // If no rows updated, either message doesn't exist, not owned by user, or already deleted
    return { error: 'Message not found or you do not have permission to delete it' };
  }

  console.log('[deleteMessage] Message soft deleted successfully');

  // Debug: Attachments are kept (they have the message_id FK)
  // They can be accessed via the attachments table if needed

  // Revalidate chat paths
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${deletedMessage.chat_room_id}`);

  return {
    success: true,
  };
}

// ============================================
// Chat Room Settings Functions
// Task 0023: Chat Room Settings
// ============================================

/**
 * Update chat room name and/or description
 * Only Admin or PM can update project chat rooms
 *
 * @param roomId - UUID of the chat room
 * @param data - Object containing name and/or description
 * @returns Updated room
 */
export async function updateChatRoom(
  roomId: string,
  data: { name?: string; description?: string }
) {
  console.log('[updateChatRoom] Updating room:', roomId, data);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // SECURITY FIX (M2): Validate input with Zod schema
  const validation = updateChatRoomSchema.safeParse({ roomId, ...data });
  if (!validation.success) {
    console.error('[updateChatRoom] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const validatedData = validation.data;

  // Validate at least one field is provided
  if (!validatedData.name && !validatedData.description) {
    return { error: 'At least one field (name or description) must be provided' };
  }

  // Get chat room to verify type and ownership
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .select('id, type, company_id, project_id')
    .eq('id', validatedData.roomId)
    .single();

  if (roomError || !room) {
    console.error('[updateChatRoom] Room not found:', roomError);
    return { error: 'Chat room not found' };
  }

  // Debug: Only allow for project chat rooms (not DMs)
  if (room.type !== 'project') {
    console.error('[updateChatRoom] Cannot update non-project rooms');
    return { error: 'Only project chat rooms can be renamed' };
  }

  // Debug: Validate user is Admin or PM via RPC
  const { data: isGcAdmin, error: gcAdminError } = await supabase
    .rpc('is_user_admin', { p_user_id: userId });

  if (gcAdminError) {
    console.error('[updateChatRoom] Error checking Admin status:', gcAdminError);
    return { error: 'Failed to verify permissions' };
  }

  if (!isGcAdmin) {
    console.error('[updateChatRoom] User is not Admin');
    return { error: 'Only Admins can update chat room settings' };
  }

  console.log('[updateChatRoom] User is Admin, updating room...');

  // Build update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;

  // Update chat room
  const { data: updatedRoom, error: updateError } = await supabase
    .from('chat_rooms')
    .update(updateData)
    .eq('id', validatedData.roomId)
    .select()
    .single();

  if (updateError) {
    console.error('[updateChatRoom] Error updating room:', updateError);
    return { error: 'Failed to update chat room' };
  }

  console.log('[updateChatRoom] Room updated successfully');

  // Revalidate chat paths
  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${roomId}`);

  return {
    success: true,
    room: updatedRoom,
  };
}

/**
 * Export transcript of a chat room
 * Only Admin can export transcripts
 * Returns all messages with sender names, timestamps, and attachments
 *
 * @param roomId - UUID of the chat room
 * @returns Transcript data (JSON format)
 */
export async function exportTranscript(roomId: string) {
  console.log('[exportTranscript] Exporting transcript for room:', roomId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // SECURITY FIX (M4): Validate input with Zod schema
  const validation = exportTranscriptSchema.safeParse({ roomId });
  if (!validation.success) {
    console.error('[exportTranscript] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const validatedData = validation.data;

  // Debug: Validate user is Admin via RPC
  const { data: isGcAdmin, error: gcAdminError } = await supabase
    .rpc('is_user_admin', { p_user_id: userId });

  if (gcAdminError) {
    console.error('[exportTranscript] Error checking Admin status:', gcAdminError);
    return { error: 'Failed to verify permissions' };
  }

  if (!isGcAdmin) {
    console.error('[exportTranscript] User is not Admin');
    return { error: 'Only Admins can export transcripts' };
  }

  console.log('[exportTranscript] User is Admin, fetching messages...');

  // Verify user has access to the chat room
  const accessCheck = await verifyChatRoomAccess(supabase, validatedData.roomId, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  // Get chat room details
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .select('id, name, type, description, created_at, project_id')
    .eq('id', validatedData.roomId)
    .single();

  if (roomError || !room) {
    console.error('[exportTranscript] Room not found:', roomError);
    return { error: 'Chat room not found' };
  }

  // Get all messages (including deleted ones for audit trail)
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      edited_at,
      deleted_at,
      reply_to_id,
      entity_references,
      sender:user_profiles (
        id,
        name,
        email
      )
    `)
    .eq('chat_room_id', validatedData.roomId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('[exportTranscript] Error fetching messages:', messagesError);
    return { error: 'Failed to fetch messages' };
  }

  console.log('[exportTranscript] Fetched', messages?.length || 0, 'messages');

  // Get all message IDs for fetching attachments
  const messageIds = messages?.map(m => m.id) || [];

  // Get attachments for all messages
  const { data: attachments, error: attachmentsError } = await supabase
    .from('message_attachments')
    .select('*')
    .in('message_id', messageIds);

  if (attachmentsError) {
    console.error('[exportTranscript] Error fetching attachments:', attachmentsError);
    // Don't fail if attachments fail, just log
  }

  console.log('[exportTranscript] Fetched', attachments?.length || 0, 'attachments');

  // Group attachments by message_id
  const attachmentsByMessage: Record<string, any[]> = {};
  attachments?.forEach(attachment => {
    if (!attachmentsByMessage[attachment.message_id]) {
      attachmentsByMessage[attachment.message_id] = [];
    }
    attachmentsByMessage[attachment.message_id].push(attachment);
  });

  // Debug: Format transcript data
  const transcript = {
    room: {
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
      created_at: room.created_at,
      project_id: room.project_id,
    },
    exported_at: new Date().toISOString(),
    exported_by: userId,
    message_count: messages?.length || 0,
    messages: (messages || []).map((message: any) => ({
      id: message.id,
      sender: {
        id: message.sender?.id || null,
        name: message.sender?.name || 'Unknown User',
        email: message.sender?.email || null,
      },
      content: message.content,
      created_at: message.created_at,
      edited_at: message.edited_at,
      deleted_at: message.deleted_at,
      reply_to_id: message.reply_to_id,
      entity_references: message.entity_references || [],
      attachments: attachmentsByMessage[message.id] || [],
    })),
  };

  console.log('[exportTranscript] Transcript generated successfully');

  return {
    success: true,
    transcript,
  };
}

/**
 * Get chat room participants with user profile info
 * Task 0023: Chat Room Settings - Member List
 *
 * @param roomId - Chat room ID
 * @returns List of participants with user profile data
 */
export async function getChatRoomParticipants(roomId: string) {
  console.log('[getChatRoomParticipants] Fetching participants for room:', roomId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // SECURITY FIX (M4): Validate input with Zod schema
  const validation = getChatRoomParticipantsSchema.safeParse({ roomId });
  if (!validation.success) {
    console.error('[getChatRoomParticipants] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const validatedData = validation.data;

  // Verify user is participant in this room
  const { data: participant, error: participantError } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('chat_room_id', validatedData.roomId)
    .eq('user_id', userId)
    .single();

  if (participantError || !participant) {
    console.error('[getChatRoomParticipants] User is not a participant:', participantError);
    return { error: 'You do not have access to this chat room' };
  }

  // Fetch all participants with user profile data
  const { data: participants, error: fetchError } = await supabase
    .from('chat_participants')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      user_profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('chat_room_id', validatedData.roomId)
    .order('joined_at', { ascending: true });

  if (fetchError) {
    console.error('[getChatRoomParticipants] Error fetching participants:', fetchError);
    return { error: 'Failed to fetch participants' };
  }

  console.log('[getChatRoomParticipants] Found', participants?.length || 0, 'participants');

  // Transform to expected format
  const formattedParticipants = (participants || [])
    .filter((p: any) => p.user_profiles)
    .map((p: any) => ({
      id: p.id,
      user_id: p.user_profiles.id,
      name: p.user_profiles.name,
      email: p.user_profiles.email,
      avatar_url: p.user_profiles.avatar_url,
      role: p.role,
      joined_at: p.joined_at,
    }));

  return {
    success: true,
    participants: formattedParticipants,
  };
}

/**
 * Check if current user is Admin or PM
 * Task 0023: Chat Room Settings - Permission Check
 *
 * @returns Boolean flags for isGcAdmin and isPm
 */
export async function isUserGcAdmin() {
  console.log('[isUserGcAdmin] Checking user role...');

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error, isGcAdmin: false, isPm: false };
  }

  const { role } = userContext;

  console.log('[isUserGcAdmin] User role:', role);

  return {
    success: true,
    isGcAdmin: role === 'admin',
    isPm: role === 'pm',
  };
}
