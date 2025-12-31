// API Route: Receive incoming KakaoTalk messages from Sendbird webhook
// POST /api/kakao/webhook

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { KakaoService } from '@/lib/services/kakao';
import type { SendbirdWebhookPayload } from '@/types/kakao.types';

export async function POST(request: NextRequest) {
  console.log('[kakao-webhook] Received incoming webhook from Sendbird');

  try {
    // Verify webhook signature
    const signature = request.headers.get('x-sendbird-signature');
    const rawBody = await request.text();

    if (!signature) {
      console.error('[kakao-webhook] Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = KakaoService.verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      console.error('[kakao-webhook] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('[kakao-webhook] Webhook signature verified');

    // Parse webhook payload
    const payload: SendbirdWebhookPayload = JSON.parse(rawBody);
    console.log('[kakao-webhook] Webhook event:', payload.category);

    // Only process message:send events
    if (payload.category !== 'group_channel:message_send') {
      console.log('[kakao-webhook] Ignoring non-message event');
      return NextResponse.json({ success: true });
    }

    console.log('[kakao-webhook] Processing incoming message from KakaoTalk...');

    // Get user from Sendbird user ID
    const supabase = createAdminClient();
    const { data: connection } = await supabase
      .from('kakao_connections')
      .select('user_id')
      .eq('sendbird_user_id', payload.sender.user_id)
      .eq('two_way_sync', true)
      .is('disconnected_at', null)
      .single();

    if (!connection) {
      console.log('[kakao-webhook] No two-way sync connection found for Sendbird user:', payload.sender.user_id);
      return NextResponse.json({ success: true }); // Silently ignore
    }

    // Find corresponding chat room in GenHub
    // Map Sendbird channel_url to GenHub chat_room_id (stored in chat_rooms.external_id or similar)
    const { data: chatRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('company_id', connection.user_id) // Adjust based on actual mapping
      .single();

    if (!chatRoom) {
      console.log('[kakao-webhook] No matching GenHub chat room found for channel:', payload.channel.channel_url);
      return NextResponse.json({ success: true });
    }

    console.log('[kakao-webhook] Inserting message into GenHub chat room:', chatRoom.id);

    // Insert message into GenHub messages table
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoom.id,
        sender_id: connection.user_id,
        content: payload.payload.message,
        created_at: new Date(payload.payload.created_at).toISOString(),
        // Mark as external source (from KakaoTalk)
        entity_references: [
          {
            type: 'external',
            source: 'kakaotalk',
            message_id: payload.payload.message_id.toString(),
          },
        ] as any,
      });

    if (insertError) {
      console.error('[kakao-webhook] Error inserting message:', insertError);
      return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
    }

    console.log('[kakao-webhook] Message synced from KakaoTalk to GenHub successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[kakao-webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable body parsing to access raw body for signature verification
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
