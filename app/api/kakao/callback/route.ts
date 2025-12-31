// API Route: Handle KakaoTalk OAuth callback from Sendbird
// GET /api/kakao/callback?code=xxx&state=xxx

import { NextRequest, NextResponse } from 'next/server';
import { KakaoService } from '@/lib/services/kakao';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('[kakao-callback] Handling KakaoTalk OAuth callback...');

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('[kakao-callback] OAuth error:', error);
      const errorDescription = searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/app/settings?kakao_error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[kakao-callback] Missing code or state parameter');
      return NextResponse.redirect(
        new URL('/app/settings?kakao_error=invalid_callback', request.url)
      );
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (e) {
      console.error('[kakao-callback] Invalid state parameter:', e);
      return NextResponse.redirect(
        new URL('/app/settings?kakao_error=invalid_state', request.url)
      );
    }

    // SECURITY: Verify state userId matches authenticated session (CSRF protection)
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[kakao-callback] No authenticated session');
      return NextResponse.redirect(
        new URL('/app/settings?kakao_error=not_authenticated', request.url)
      );
    }

    if (session.user.id !== userId) {
      console.error('[kakao-callback] State userId mismatch - possible CSRF attack');
      console.error('[kakao-callback] Session user:', session.user.id, 'State user:', userId);
      return NextResponse.redirect(
        new URL('/app/settings?kakao_error=csrf_detected', request.url)
      );
    }

    console.log('[kakao-callback] State verified, exchanging auth code for tokens...');

    // Exchange auth code for access/refresh tokens via KakaoService
    const result = await KakaoService.connectKakaoAccount(userId, code);

    if (!result.success) {
      console.error('[kakao-callback] Failed to connect account:', result.error);
      return NextResponse.redirect(
        new URL(`/app/settings?kakao_error=${encodeURIComponent(result.error || 'connection_failed')}`, request.url)
      );
    }

    console.log('[kakao-callback] KakaoTalk account connected successfully');

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/app/settings?kakao_success=true', request.url)
    );
  } catch (error) {
    console.error('[kakao-callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/app/settings?kakao_error=unexpected_error', request.url)
    );
  }
}
