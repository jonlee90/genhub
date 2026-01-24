'use server';

import { revalidatePath } from 'next/cache';
import { getUserContext } from '@/lib/auth-context';
import type { KakaoConnection } from '@/types/kakao.types';
import { KakaoService } from '@/lib/services/kakao';
import { z } from 'zod';

// ============================================
// Helper Functions
// ============================================
// HIGH-2 FIX: Using shared cached getUserContext from @/lib/auth-context

// ============================================
// Validation Schemas
// ============================================

const getKakaoConnectionSchema = z.object({
  userId: z.string().uuid().optional(),
});

const updateTwoWaySyncSchema = z.object({
  enabled: z.boolean(),
});

// ============================================
// Server Actions
// ============================================

/**
 * Get user's KakaoTalk connection status
 */
export async function getKakaoConnection(
  input?: unknown
): Promise<{ success: boolean; connection?: KakaoConnection; error?: string }> {
  console.log('[kakao-actions] Getting KakaoTalk connection...');

  try {
    // Validate input if provided
    let userId: string | undefined;
    if (input !== undefined) {
      const validation = getKakaoConnectionSchema.safeParse(input);
      if (!validation.success) {
        console.error('[kakao-actions] Validation failed:', validation.error);
        return { success: false, error: 'Invalid input parameters' };
      }
      userId = validation.data.userId;
    }

    const userContext = await getUserContext();
    if ('error' in userContext) {
      return { success: false, error: userContext.error };
    }

    const { userId: contextUserId, supabase } = userContext;
    const targetUserId = userId || contextUserId;

    const { data: connection, error } = await supabase
      .from('kakao_connections')
      .select('*')
      .eq('user_id', targetUserId)
      .is('disconnected_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found (not an error)
        console.log('[kakao-actions] No active KakaoTalk connection found');
        return { success: true, connection: undefined };
      }
      console.error('[kakao-actions] Error fetching connection:', error);
      return { success: false, error: 'Failed to fetch connection status' };
    }

    console.log('[kakao-actions] KakaoTalk connection found:', connection.id);
    return { success: true, connection: connection as KakaoConnection };
  } catch (error) {
    console.error('[kakao-actions] Unexpected error:', error);
    return { success: false, error: 'Unexpected error fetching connection' };
  }
}

/**
 * Update two-way sync setting for KakaoTalk connection
 */
export async function updateTwoWaySync(
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  const validation = updateTwoWaySyncSchema.safeParse(input);
  if (!validation.success) {
    console.error('[kakao-actions] Validation failed:', validation.error);
    return { success: false, error: 'Invalid input: enabled must be a boolean' };
  }

  const { enabled } = validation.data;

  console.log('[kakao-actions] Updating two-way sync setting to:', enabled);

  try {
    const userContext = await getUserContext();
    if ('error' in userContext) {
      return { success: false, error: userContext.error };
    }

    const { userId, supabase } = userContext;

    const { error } = await supabase
      .from('kakao_connections')
      .update({ two_way_sync: enabled })
      .eq('user_id', userId)
      .is('disconnected_at', null);

    if (error) {
      console.error('[kakao-actions] Error updating two-way sync:', error);
      return { success: false, error: 'Failed to update sync setting' };
    }

    console.log('[kakao-actions] Two-way sync updated successfully');
    revalidatePath('/app/settings');

    return { success: true };
  } catch (error) {
    console.error('[kakao-actions] Unexpected error:', error);
    return { success: false, error: 'Unexpected error updating sync setting' };
  }
}

/**
 * Disconnect KakaoTalk account
 */
export async function disconnectKakao(): Promise<{ success: boolean; error?: string }> {
  console.log('[kakao-actions] Disconnecting KakaoTalk account...');

  try {
    const userContext = await getUserContext();
    if ('error' in userContext) {
      return { success: false, error: userContext.error };
    }

    const { userId } = userContext;

    const result = await KakaoService.disconnectKakaoAccount(userId);

    if (result.success) {
      revalidatePath('/app/settings');
    }

    return result;
  } catch (error) {
    console.error('[kakao-actions] Unexpected error:', error);
    return { success: false, error: 'Unexpected error disconnecting account' };
  }
}
