'use server';

import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { ChatRoomWithUnread, MessageWithSender } from '@/types/db/chat';

// ============================================
// Helper Functions
// ============================================

type UserContextSuccess = {
  userId: string;
  userName: string;
  companyId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

type UserContextError = {
  error: string;
};

async function getUserContext(): Promise<UserContextSuccess | UserContextError> {
  console.log('[chat-queries] Getting user session...');

  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    console.error('[chat-queries] No authenticated user found');
    return { error: 'Not authenticated' };
  }

  console.log('[chat-queries] User authenticated:', session.user.id);

  // Create Supabase client
  const supabase = await createClient();

  // Get user's company and profile in parallel
  const [companyUserResult, profileResult] = await Promise.all([
    (supabase
      .from('company_users') as any)
      .select('company_id, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single(),
    (supabase
      .from('user_profiles') as any)
      .select('name')
      .eq('id', session.user.id)
      .single(),
  ]);

  if (companyUserResult.error || !companyUserResult.data) {
    console.error('[chat-queries] No active company found:', companyUserResult.error);
    return { error: 'No active company found for user' };
  }

  const userName = (profileResult.data as any)?.name || session.user.name || 'User';

  console.log('[chat-queries] User context loaded:', {
    userId: session.user.id,
    userName,
    companyId: (companyUserResult.data as any).company_id,
  });

  return {
    userId: session.user.id,
    userName,
    companyId: (companyUserResult.data as any).company_id,
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
  const { data: participant, error } = await supabase
    .from('chat_participants')
    .select('id, role, last_read_at')
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId)
    .single();

  if (error || !participant) {
    console.error('[verifyChatRoomAccess] Access denied:', error);
    return { error: 'You do not have access to this chat room' };
  }

  console.log('[verifyChatRoomAccess] Access granted');
  return { participant };
}

// ============================================
// Query Actions
// ============================================

/**
 * Get current user context (userId, userName, and companyId)
 * Used by client-side hooks for real-time subscriptions
 */
export async function getCurrentUserContext(): Promise<{
  success?: boolean;
  userId?: string;
  userName?: string;
  companyId?: string;
  error?: string;
}> {
  console.log('[getCurrentUserContext] Getting user context...');

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  return {
    success: true,
    userId: userContext.userId,
    userName: userContext.userName,
    companyId: userContext.companyId,
  };
}

/**
 * Get all chat rooms that the current user participates in
 * Includes unread count and last message preview
 * Ordered by most recent activity first
 */
export async function getChatRooms(): Promise<{
  success?: boolean;
  rooms?: ChatRoomWithUnread[];
  error?: string;
}> {
  console.log('[getChatRooms] Fetching chat rooms (optimized with get_chat_rooms_with_metadata)...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Use optimized database function (1 query instead of 1 + N*4!)
  const { data: rooms, error: roomsError } = await (supabase.rpc as any)('get_chat_rooms_with_metadata', {
    p_company_id: companyId,
    p_user_id: userId,
  });

  if (roomsError) {
    console.error('[getChatRooms] Error fetching rooms:', roomsError);
    return { error: 'Failed to load chat rooms' };
  }

  console.log('[getChatRooms] Found', rooms?.length || 0, 'rooms with metadata (single query)');

  // Transform the data to match expected interface
  const roomsWithUnread: ChatRoomWithUnread[] = (rooms || []).map((room: any) => {
    // Parse last_message JSONB if it exists
    let lastMessage: MessageWithSender | undefined = undefined;
    if (room.last_message) {
      lastMessage = {
        id: room.last_message.id,
        chat_room_id: room.id,
        sender_id: room.last_message.sender_id,
        content: room.last_message.content,
        reply_to_id: room.last_message.reply_to_id || null,
        entity_references: null,
        edited_at: room.last_message.edited_at || null,
        deleted_at: null,
        created_at: room.last_message.created_at,
        updated_at: room.last_message.created_at,
        sender: room.last_message.sender ? {
          id: room.last_message.sender.id,
          name: room.last_message.sender.name,
          email: room.last_message.sender.email,
          avatar_url: room.last_message.sender.avatar_url,
        } : null,
      } as MessageWithSender;
    }

    return {
      id: room.id,
      name: room.name,
      type: room.type,
      company_id: room.company_id,
      project_id: room.project_id,
      created_at: room.created_at,
      updated_at: room.updated_at,
      unread_count: room.unread_count,
      last_message: lastMessage,
      participant_count: room.participant_count,
      muted_until: room.muted_until,
    };
  });

  // Already sorted by updated_at DESC in the database function
  console.log('[getChatRooms] Returning', roomsWithUnread.length, 'rooms with metadata (optimized)');

  return { success: true, rooms: roomsWithUnread };
}

/**
 * Get messages for a specific chat room with pagination
 * Supports cursor-based pagination (50 messages default)
 * Includes sender info, reaction counts, attachment counts, reply counts
 * Ordered by created_at DESC (newest first)
 */
export async function getMessages(
  chatRoomId: string,
  cursor?: string,
  limit: number = 50
): Promise<{
  success?: boolean;
  messages?: MessageWithSender[];
  nextCursor?: string | null;
  error?: string;
}> {
  console.log('[getMessages] Fetching messages for room:', chatRoomId, 'cursor:', cursor, 'limit:', limit);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Verify user is participant before returning messages
  const accessCheck = await verifyChatRoomAccess(supabase, chatRoomId, userId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  // Fetch messages with reply counts in a single query
  // Using PostgREST subquery aggregation to count replies
  let query = supabase
    .from('messages')
    .select(`
      *,
      reply_count:messages!reply_to_id(count)
    `)
    .eq('chat_room_id', chatRoomId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to determine if there are more

  // Apply cursor for pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: messagesData, error: messagesError } = await query as { data: any[] | null; error: any };

  if (messagesError) {
    const errorDetail = messagesError.message || JSON.stringify(messagesError);
    console.error('[getMessages] Error fetching messages:', errorDetail);
    return { error: `Failed to load messages: ${errorDetail}` };
  }

  console.log('[getMessages] Fetched', messagesData?.length || 0, 'messages (including extra for cursor)');

  // Check if there are more messages
  const hasMore = messagesData && messagesData.length > limit;
  const messages = hasMore ? messagesData.slice(0, limit) : messagesData || [];

  // Determine next cursor (created_at of last message)
  const nextCursor = hasMore && messages.length > 0
    ? messages[messages.length - 1].created_at
    : null;

  // Collect all unique sender IDs and reply message IDs
  const senderIds = new Set<string>();
  const replyToIds = new Set<string>();

  messages.forEach((msg: any) => {
    if (msg.sender_id) senderIds.add(msg.sender_id);
    if (msg.reply_to_id) replyToIds.add(msg.reply_to_id);
  });

  // Fetch user profiles for all senders
  const { data: userProfiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, name, email, avatar_url')
    .in('id', Array.from(senderIds)) as { data: any[] | null; error: any };

  if (profilesError) {
    console.error('[getMessages] Error fetching user profiles:', profilesError);
    // Don't fail if profiles fail, just continue without them
  }

  // Fetch reply-to messages if any
  let replyToMessages: any[] = [];
  if (replyToIds.size > 0) {
    const { data: replies, error: repliesError } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id')
      .in('id', Array.from(replyToIds)) as { data: any[] | null; error: any };

    if (repliesError) {
      console.error('[getMessages] Error fetching reply messages:', repliesError);
    } else {
      replyToMessages = replies || [];

      // Add reply senders to profiles if not already fetched
      const replySenderIds = replyToMessages
        .map((r: any) => r.sender_id)
        .filter(id => id && !senderIds.has(id));

      if (replySenderIds.length > 0) {
        const { data: replyProfiles } = await supabase
          .from('user_profiles')
          .select('id, name, avatar_url')
          .in('id', replySenderIds) as { data: any[] | null; error: any };

        if (replyProfiles) {
          userProfiles?.push(...replyProfiles);
        }
      }
    }
  }

  // Create lookup maps
  const profilesMap = new Map(userProfiles?.map((p: any) => [p.id, p]) || []);
  const repliesMap = new Map(replyToMessages.map((r: any) => [r.id, r]));

  // Combine data - reply_count already included from subquery
  const messagesWithData = messages.map((message: any) => {
    // Build message with sender profile
    const sender = profilesMap.get(message.sender_id);

    // Build reply_to with sender profile if exists
    let reply_to = null;
    if (message.reply_to_id) {
      const replyMsg = repliesMap.get(message.reply_to_id);
      if (replyMsg) {
        const replySender = profilesMap.get(replyMsg.sender_id);
        reply_to = {
          id: replyMsg.id,
          content: replyMsg.content,
          created_at: replyMsg.created_at,
          sender: replySender || null,
        };
      }
    }

    // Extract reply count from subquery result (PostgREST returns as array)
    const replyCount = Array.isArray(message.reply_count)
      ? (message.reply_count[0]?.count || 0)
      : (message.reply_count || 0);

    return {
      ...message,
      sender,
      reply_to,
      reply_count: replyCount,
      reaction_count: 0,
      attachment_count: 0,
    };
  });

  console.log('[getMessages] Returning', messagesWithData.length, 'messages, nextCursor:', nextCursor);

  return {
    success: true,
    messages: messagesWithData as unknown as MessageWithSender[],
    nextCursor,
  };
}

/**
 * Get all users in the same company as the current user
 * Used for New DM modal to select users to start conversations with
 * Excludes the current user from the list
 */
export async function getCompanyUsers(): Promise<{
  success?: boolean;
  users?: Array<{
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  }>;
  error?: string;
}> {
  console.log('[getCompanyUsers] Fetching company users...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Get all active users in the company with their profiles
  const { data: companyUsers, error: usersError } = await supabase
    .from('company_users')
    .select(`
      user_id,
      role,
      user_profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'active')
    .neq('user_id', userId) as { data: any[] | null; error: any }; // Exclude current user

  if (usersError) {
    console.error('[getCompanyUsers] Error fetching users:', usersError);
    return { error: 'Failed to load company users' };
  }

  console.log('[getCompanyUsers] Found', companyUsers?.length || 0, 'users');

  // Map to expected format
  const users = (companyUsers || []).map((cu: any) => {
    const profile = cu.user_profiles as unknown as {
      id: string;
      name: string;
      email?: string;
      avatar_url?: string;
    };
    return {
      id: profile?.id || cu.user_id,
      name: profile?.name || 'Unknown User',
      email: profile?.email,
      avatar_url: profile?.avatar_url,
      role: cu.role,
    };
  });

  return { success: true, users };
}

/**
 * Get a single message by ID with full sender info
 * Used by real-time hook to fetch complete message data after INSERT event
 */
export async function getMessageById(
  messageId: string
): Promise<{
  success?: boolean;
  message?: MessageWithSender;
  error?: string;
}> {
  console.log('[getMessageById] Fetching message:', messageId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { supabase } = userContext;

  // Fetch message without nested relationships
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single() as { data: any | null; error: any };

  if (messageError || !messageData) {
    console.error('[getMessageById] Error fetching message:', messageError);
    return { error: 'Failed to load message' };
  }

  // Fetch sender profile
  const { data: senderProfile, error: senderError } = await supabase
    .from('user_profiles')
    .select('id, name, email, avatar_url')
    .eq('id', (messageData as any).sender_id)
    .single() as { data: any | null; error: any };

  if (senderError) {
    console.error('[getMessageById] Error fetching sender profile:', senderError);
    // Don't fail if profile fetch fails, just continue without it
  }

  // Fetch reply-to message if exists
  let reply_to = null;
  if ((messageData as any).reply_to_id) {
    const { data: replyMessage, error: replyError } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id')
      .eq('id', (messageData as any).reply_to_id)
      .single() as { data: any | null; error: any };

    if (replyError) {
      console.error('[getMessageById] Error fetching reply message:', replyError);
    } else if (replyMessage) {
      // Fetch reply sender profile
      const { data: replySenderProfile } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('id', (replyMessage as any).sender_id)
        .single() as { data: any | null; error: any };

      reply_to = {
        id: (replyMessage as any).id,
        content: (replyMessage as any).content,
        created_at: (replyMessage as any).created_at,
        sender: replySenderProfile || null,
      };
    }
  }

  // Count replies to this message
  const { count: replyCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('reply_to_id', messageId)
    .is('deleted_at', null);

  console.log('[getMessageById] Message fetched successfully');

  return {
    success: true,
    message: {
      ...(messageData as any),
      sender: senderProfile || null,
      reply_to,
      reply_count: replyCount || 0,
      reaction_count: 0,
      attachment_count: 0,
    } as unknown as MessageWithSender,
  };
}
