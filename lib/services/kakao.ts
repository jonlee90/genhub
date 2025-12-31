// KakaoTalk Integration Service via Sendbird
// Handles OAuth, AlimTalk notifications, and two-way message sync

import { createClient } from '@/utils/supabase/server';
import type {
  KakaoConnection,
  AlimTalkTemplate,
  SendbirdMessage,
  SendbirdTokenResponse,
  AlimTalkSendResult,
} from '@/types/kakao.types';
import { ALIMTALK_TEMPLATES, ALIMTALK_RETRY_CONFIG, validateTemplateParams } from '@/config/kakao-templates';
import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto';

// ============================================
// Configuration & Constants
// ============================================

const SENDBIRD_APP_ID = process.env.SENDBIRD_APP_ID;
const SENDBIRD_API_TOKEN = process.env.SENDBIRD_API_TOKEN;
const SENDBIRD_WEBHOOK_SECRET = process.env.SENDBIRD_WEBHOOK_SECRET;
const KAKAO_ENCRYPTION_KEY = process.env.KAKAO_ENCRYPTION_KEY;

const SENDBIRD_API_BASE = `https://api-${SENDBIRD_APP_ID}.sendbird.com/v3`;

// ============================================
// Token Encryption/Decryption
// ============================================

/**
 * Encrypt token using AES-256-GCM
 */
function encryptToken(token: string): string {
  console.log('[kakao] Encrypting token...');

  if (!KAKAO_ENCRYPTION_KEY) {
    throw new Error('KAKAO_ENCRYPTION_KEY is not configured');
  }

  // SECURITY: Validate key length (must be at least 32 bytes for AES-256)
  if (KAKAO_ENCRYPTION_KEY.length < 32) {
    throw new Error('KAKAO_ENCRYPTION_KEY must be at least 32 characters long');
  }

  // Use first 32 bytes of key for AES-256
  const key = Buffer.from(KAKAO_ENCRYPTION_KEY.slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt token using AES-256-GCM
 */
function decryptToken(encryptedToken: string): string {
  console.log('[kakao] Decrypting token...');

  if (!KAKAO_ENCRYPTION_KEY) {
    throw new Error('KAKAO_ENCRYPTION_KEY is not configured');
  }

  // SECURITY: Validate key length (must be at least 32 bytes for AES-256)
  if (KAKAO_ENCRYPTION_KEY.length < 32) {
    throw new Error('KAKAO_ENCRYPTION_KEY must be at least 32 characters long');
  }

  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted token format');
  }

  const key = Buffer.from(KAKAO_ENCRYPTION_KEY.slice(0, 32));
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// KakaoService Class
// ============================================

export class KakaoService {
  /**
   * Connect KakaoTalk account via Sendbird OAuth
   * Exchanges auth code for access/refresh tokens and stores in database
   */
  static async connectKakaoAccount(
    userId: string,
    authCode: string
  ): Promise<{ success: boolean; error?: string; connection?: KakaoConnection }> {
    console.log('[kakao] Connecting KakaoTalk account for user:', userId);

    try {
      if (!SENDBIRD_APP_ID || !SENDBIRD_API_TOKEN) {
        return { success: false, error: 'Sendbird configuration missing' };
      }

      // Exchange auth code for tokens via Sendbird OAuth
      const tokenResponse = await fetch(`${SENDBIRD_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': SENDBIRD_API_TOKEN,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: authCode,
          app_id: SENDBIRD_APP_ID,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[kakao] Token exchange failed:', errorText);
        return { success: false, error: 'Failed to exchange authorization code' };
      }

      const tokenData: SendbirdTokenResponse = await tokenResponse.json();
      console.log('[kakao] Token received for Sendbird user:', tokenData.user_id);

      // Encrypt tokens before storing
      const encryptedAccessToken = encryptToken(tokenData.access_token);
      const encryptedRefreshToken = encryptToken(tokenData.refresh_token);

      // Store connection in database
      const supabase = await createClient();
      const { data: connection, error: dbError } = await supabase
        .from('kakao_connections')
        .upsert({
          user_id: userId,
          kakao_user_id: tokenData.user_id, // Sendbird maps this to KakaoTalk ID
          sendbird_user_id: tokenData.user_id,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          two_way_sync: false, // Default to one-way (GenHub → KakaoTalk only)
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (dbError) {
        console.error('[kakao] Database error:', dbError);
        return { success: false, error: 'Failed to save connection' };
      }

      console.log('[kakao] KakaoTalk account connected successfully');
      return { success: true, connection: connection as KakaoConnection };
    } catch (error) {
      console.error('[kakao] Error connecting KakaoTalk account:', error);
      return { success: false, error: 'Unexpected error during connection' };
    }
  }

  /**
   * Disconnect KakaoTalk account
   */
  static async disconnectKakaoAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[kakao] Disconnecting KakaoTalk account for user:', userId);

    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('kakao_connections')
        .update({
          disconnected_at: new Date().toISOString(),
          two_way_sync: false,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[kakao] Error disconnecting:', error);
        return { success: false, error: 'Failed to disconnect account' };
      }

      console.log('[kakao] Account disconnected successfully');
      return { success: true };
    } catch (error) {
      console.error('[kakao] Error disconnecting account:', error);
      return { success: false, error: 'Unexpected error during disconnection' };
    }
  }

  /**
   * Send AlimTalk notification via Sendbird Business Messaging
   * Includes retry logic with exponential backoff
   */
  static async sendAlimTalk(
    userId: string,
    template: AlimTalkTemplate
  ): Promise<AlimTalkSendResult> {
    console.log('[kakao] Sending AlimTalk to user:', userId, 'template:', template.template);

    try {
      // Get user's KakaoTalk connection
      const supabase = await createClient();
      const { data: connection, error: connError } = await supabase
        .from('kakao_connections')
        .select('*')
        .eq('user_id', userId)
        .is('disconnected_at', null)
        .single();

      if (connError || !connection) {
        console.log('[kakao] No active KakaoTalk connection found for user');
        return { success: false, error: 'User has not connected KakaoTalk' };
      }

      // Validate template params
      const templateConfig = ALIMTALK_TEMPLATES[template.template];
      if (!validateTemplateParams(template.template, template.params)) {
        console.error('[kakao] Invalid template params:', template.params);
        return { success: false, error: 'Invalid template parameters' };
      }

      // Decrypt access token
      const accessToken = decryptToken(connection.access_token);

      // Prepare AlimTalk message payload
      const payload = {
        template_code: templateConfig.code,
        receiver_id: connection.sendbird_user_id,
        variables: template.params,
      };

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= ALIMTALK_RETRY_CONFIG.maxAttempts; attempt++) {
        console.log('[kakao] AlimTalk send attempt:', attempt);

        try {
          const response = await fetch(`${SENDBIRD_API_BASE}/business_messaging/alimtalk/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'Api-Token': SENDBIRD_API_TOKEN!,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[kakao] AlimTalk sent successfully, message_id:', result.message_id);
            return {
              success: true,
              message_id: result.message_id,
              retry_count: attempt,
            };
          }

          // Check if token expired (401) and attempt refresh
          if (response.status === 401 && attempt < ALIMTALK_RETRY_CONFIG.maxAttempts) {
            console.log('[kakao] Access token expired, refreshing...');
            const refreshResult = await this.refreshToken(userId);
            if (!refreshResult.success) {
              return { success: false, error: 'Failed to refresh access token' };
            }
            // Retry with new token
            continue;
          }

          const errorText = await response.text();
          lastError = new Error(`AlimTalk send failed: ${errorText}`);
          console.error('[kakao] AlimTalk send error (attempt ' + attempt + '):', errorText);
        } catch (error) {
          lastError = error as Error;
          console.error('[kakao] AlimTalk send exception (attempt ' + attempt + '):', error);
        }

        // Wait before retry (exponential backoff)
        if (attempt < ALIMTALK_RETRY_CONFIG.maxAttempts) {
          const delay = Math.min(
            ALIMTALK_RETRY_CONFIG.initialDelayMs *
              Math.pow(ALIMTALK_RETRY_CONFIG.backoffMultiplier, attempt - 1),
            ALIMTALK_RETRY_CONFIG.maxDelayMs
          );
          console.log('[kakao] Retrying in', delay, 'ms...');
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      console.error('[kakao] AlimTalk send failed after all retries');
      return {
        success: false,
        error: lastError?.message || 'Failed to send AlimTalk after retries',
        retry_count: ALIMTALK_RETRY_CONFIG.maxAttempts,
      };
    } catch (error) {
      console.error('[kakao] Error sending AlimTalk:', error);
      return { success: false, error: 'Unexpected error sending AlimTalk' };
    }
  }

  /**
   * Sync message from GenHub to KakaoTalk (two-way sync)
   * Called when user sends message in GenHub chat
   */
  static async syncMessage(
    userId: string,
    message: { content: string; chatRoomId: string }
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[kakao] Syncing message to KakaoTalk for user:', userId);

    try {
      const supabase = await createClient();
      const { data: connection } = await supabase
        .from('kakao_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('two_way_sync', true)
        .is('disconnected_at', null)
        .single();

      if (!connection) {
        console.log('[kakao] Two-way sync not enabled for user');
        return { success: false, error: 'Two-way sync not enabled' };
      }

      const accessToken = decryptToken(connection.access_token);

      // Send message via Sendbird to KakaoTalk channel
      const response = await fetch(`${SENDBIRD_API_BASE}/group_channels/${message.chatRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Api-Token': SENDBIRD_API_TOKEN!,
        },
        body: JSON.stringify({
          message_type: 'MESG',
          user_id: connection.sendbird_user_id,
          message: message.content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[kakao] Message sync failed:', errorText);
        return { success: false, error: 'Failed to sync message' };
      }

      console.log('[kakao] Message synced to KakaoTalk successfully');
      return { success: true };
    } catch (error) {
      console.error('[kakao] Error syncing message:', error);
      return { success: false, error: 'Unexpected error syncing message' };
    }
  }

  /**
   * Refresh expired access token
   */
  static async refreshToken(userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[kakao] Refreshing access token for user:', userId);

    try {
      const supabase = await createClient();
      const { data: connection } = await supabase
        .from('kakao_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      const refreshToken = decryptToken(connection.refresh_token);

      const response = await fetch(`${SENDBIRD_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': SENDBIRD_API_TOKEN!,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          app_id: SENDBIRD_APP_ID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[kakao] Token refresh failed:', errorText);
        return { success: false, error: 'Failed to refresh token' };
      }

      const tokenData: SendbirdTokenResponse = await response.json();

      // Encrypt and update tokens
      const encryptedAccessToken = encryptToken(tokenData.access_token);
      const encryptedRefreshToken = encryptToken(tokenData.refresh_token);

      await supabase
        .from('kakao_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
        })
        .eq('user_id', userId);

      console.log('[kakao] Access token refreshed successfully');
      return { success: true };
    } catch (error) {
      console.error('[kakao] Error refreshing token:', error);
      return { success: false, error: 'Unexpected error refreshing token' };
    }
  }

  /**
   * Verify webhook signature from Sendbird
   * SECURITY: Uses timing-safe comparison to prevent timing attacks
   */
  static verifyWebhookSignature(signature: string, body: string): boolean {
    if (!SENDBIRD_WEBHOOK_SECRET) {
      console.error('[kakao] SENDBIRD_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = createHmac('sha256', SENDBIRD_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    // SECURITY: Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    // Check length first (constant time for different lengths)
    if (expectedBuffer.length !== actualBuffer.length) {
      console.error('[kakao] Signature length mismatch');
      return false;
    }

    // Timing-safe comparison
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
