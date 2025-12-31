// API Route: Initiate KakaoTalk OAuth connection via Sendbird
// GET /api/kakao/connect - Redirects to Sendbird OAuth authorization URL

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('[kakao-connect] Initiating KakaoTalk OAuth connection...');

  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[kakao-connect] User not authenticated');
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const SENDBIRD_APP_ID = process.env.SENDBIRD_APP_ID;
    const SENDBIRD_OAUTH_CLIENT_ID = process.env.SENDBIRD_OAUTH_CLIENT_ID;

    if (!SENDBIRD_APP_ID || !SENDBIRD_OAUTH_CLIENT_ID) {
      console.error('[kakao-connect] Sendbird OAuth configuration missing');
      return NextResponse.json(
        { error: 'Sendbird configuration is incomplete' },
        { status: 500 }
      );
    }

    // Build OAuth authorization URL
    const callbackUrl = new URL('/api/kakao/callback', request.url).toString();
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    const authUrl = new URL('https://sendbird.com/oauth/authorize');
    authUrl.searchParams.set('client_id', SENDBIRD_OAUTH_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'business_messaging'); // Request AlimTalk permissions

    console.log('[kakao-connect] Redirecting to Sendbird OAuth:', authUrl.toString());

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[kakao-connect] Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate KakaoTalk connection' },
      { status: 500 }
    );
  }
}
