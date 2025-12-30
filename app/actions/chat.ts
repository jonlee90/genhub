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

const markAsReadSchema = z.object({
  chatRoomId: z.string().uuid('Invalid chat room ID'),
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
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

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
  const { data: participant, error } = await supabase
    .from('chat_participants')
    .select('id, role')
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId)
    .single();

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

  // Insert message
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      chat_room_id: data.chatRoomId,
      sender_id: userId,
      content: data.content,
      reply_to_id: data.replyToId || null,
      entity_references: data.entityReferences || [],
    })
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .single();

  if (insertError) {
    console.error('[sendMessage] Error inserting message:', insertError);
    return { error: 'Failed to send message. Please try again.' };
  }

  console.log('[sendMessage] Message sent successfully:', message.id);

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
  const { error: updateError } = await supabase
    .from('chat_participants')
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
