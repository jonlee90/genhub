'use server';

import { z } from 'zod';
import { getUserContextWithUserData as getUserContext } from '@/lib/auth-context';

// ============================================
// Helper Functions
// ============================================

// ============================================
// Validation Schemas
// ============================================

const registerPushSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
  platform: z.enum(['web', 'ios', 'android']),
  p256dh_key: z.string().min(1, 'P256DH key is required'),
  auth_key: z.string().min(1, 'Auth key is required'),
  user_agent: z.string().optional().nullable(),
});

const unregisterPushSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
});

// ============================================
// Server Actions
// ============================================

/**
 * Register a push notification subscription for the current user
 * Stores FCM token and platform information for sending push notifications
 * @param data - Push subscription data (endpoint, platform, keys)
 */
export async function registerPushSubscription(
  data: z.infer<typeof registerPushSchema>
) {
  console.log('[registerPushSubscription] Starting registration:', {
    platform: data.platform,
    endpointLength: data.endpoint.length,
  });

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { user, supabase } = userContext;

  // Validate input
  const validation = registerPushSchema.safeParse(data);
  if (!validation.success) {
    console.error('[registerPushSubscription] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const validated = validation.data;

  console.log('[registerPushSubscription] Upserting subscription for user:', user.id);

  // Upsert subscription (update last_used_at if exists, insert if not)
  const { error: upsertError } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: validated.endpoint,
        platform: validated.platform,
        p256dh_key: validated.p256dh_key,
        auth_key: validated.auth_key,
        user_agent: validated.user_agent || null,
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,endpoint',
      }
    );

  if (upsertError) {
    console.error('[registerPushSubscription] Error upserting subscription:', upsertError);
    return { error: 'Failed to register push subscription. Please try again.' };
  }

  console.log('[registerPushSubscription] Subscription registered successfully');

  return { success: true };
}

/**
 * Unregister a push notification subscription
 * Removes the subscription from the database
 * @param data - Object containing endpoint to unregister
 */
export async function unregisterPushSubscription(
  data: z.infer<typeof unregisterPushSchema>
) {
  console.log('[unregisterPushSubscription] Starting unregistration');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { user, supabase } = userContext;

  // Validate input
  const validation = unregisterPushSchema.safeParse(data);
  if (!validation.success) {
    console.error('[unregisterPushSubscription] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const validated = validation.data;

  console.log('[unregisterPushSubscription] Deleting subscription for user:', user.id);

  // Delete subscription
  const { error: deleteError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', validated.endpoint);

  if (deleteError) {
    console.error('[unregisterPushSubscription] Error deleting subscription:', deleteError);
    return { error: 'Failed to unregister push subscription. Please try again.' };
  }

  console.log('[unregisterPushSubscription] Subscription unregistered successfully');

  return { success: true };
}

/**
 * Get all push subscriptions for the current user
 * Returns list of registered devices/platforms
 */
export async function getUserPushSubscriptions() {
  console.log('[getUserPushSubscriptions] Fetching subscriptions');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { user, supabase } = userContext;

  // Fetch subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, platform, user_agent, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false });

  if (error) {
    console.error('[getUserPushSubscriptions] Error fetching subscriptions:', error);
    return { error: 'Failed to fetch push subscriptions' };
  }

  console.log('[getUserPushSubscriptions] Fetched', subscriptions?.length || 0, 'subscriptions');

  return {
    success: true,
    subscriptions: subscriptions || [],
  };
}

/**
 * Export getUserContext for use in other server actions (e.g., chat.ts)
 * This ensures consistent authentication and company context retrieval
 */
export { getUserContext };
