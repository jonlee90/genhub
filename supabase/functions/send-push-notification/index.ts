/**
 * Supabase Edge Function: Send Push Notification
 * Sends push notifications via Firebase Cloud Messaging (FCM)
 *
 * Expected input:
 * {
 *   userId: string (UUID),
 *   title: string,
 *   body: string,
 *   data: {
 *     roomId: string,
 *     messageId: string,
 *     url: string
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[send-push-notification] Function invoked');

    // Parse request body
    const { userId, title, body, data } = await req.json();

    console.log('[send-push-notification] Sending push to user:', userId);

    // Validate input
    if (!userId || !title || !body) {
      console.error('[send-push-notification] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[send-push-notification] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's push subscriptions
    console.log('[send-push-notification] Fetching push subscriptions...');
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subscriptionsError) {
      console.error('[send-push-notification] Error fetching subscriptions:', subscriptionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-push-notification] No subscriptions found for user');
      return new Response(
        JSON.stringify({ sent: 0, message: 'No push subscriptions found' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[send-push-notification] Found', subscriptions.length, 'subscription(s)');

    // Get FCM server key
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      console.error('[send-push-notification] FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FCM server key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send push notifications to all subscriptions
    let successCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        console.log('[send-push-notification] Sending to subscription:', subscription.id);

        // Send via FCM API
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: subscription.endpoint, // FCM token
            notification: {
              title,
              body,
            },
            data: data || {},
            priority: 'high',
            content_available: true,
          }),
        });

        const fcmResult = await fcmResponse.json();

        if (fcmResponse.ok && fcmResult.success > 0) {
          console.log('[send-push-notification] Push sent successfully to subscription:', subscription.id);
          successCount++;

          // Update last_used_at timestamp
          await supabaseClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          console.error('[send-push-notification] FCM error for subscription:', subscription.id, fcmResult);
          errors.push(`Subscription ${subscription.id}: ${JSON.stringify(fcmResult)}`);

          // If token is invalid, delete the subscription
          if (fcmResult.results?.[0]?.error === 'InvalidRegistration' || fcmResult.results?.[0]?.error === 'NotRegistered') {
            console.log('[send-push-notification] Deleting invalid subscription:', subscription.id);
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
        }
      } catch (error) {
        console.error('[send-push-notification] Error sending to subscription:', subscription.id, error);
        errors.push(`Subscription ${subscription.id}: ${error.message}`);
      }
    }

    console.log('[send-push-notification] Push notifications sent:', successCount, '/', subscriptions.length);

    return new Response(
      JSON.stringify({
        sent: successCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[send-push-notification] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
