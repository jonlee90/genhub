/**
 * Test Authentication Route
 *
 * DEVELOPMENT ONLY - Creates test sessions for Playwright and other automated tests
 * This route is disabled in production for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

// Debug: Test auth route
console.log('[TestAuth] Route loaded');

export async function POST(request: NextRequest) {
  console.log('[TestAuth] POST request received');

  // CRITICAL: Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    console.error('[TestAuth] Blocked - production environment');
    return NextResponse.json(
      { error: 'Test authentication not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    console.log('[TestAuth] Creating session for email:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .schema('next_auth')
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('[TestAuth] User not found:', email, userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[TestAuth] Found user:', user.id);

    // Create a test session token
    // Note: This is a simplified approach for testing
    // In production, Next-Auth handles this securely
    const sessionToken = `test-session-${user.id}-${Date.now()}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store session in database
    const { error: sessionError } = await supabase
      .schema('next_auth')
      .from('sessions')
      .insert({
        sessionToken,
        userId: user.id,
        expires: expires.toISOString(),
      });

    if (sessionError) {
      console.error('[TestAuth] Session creation failed:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('[TestAuth] Session created successfully');

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      sessionToken,
    });

    // Set cookie with proper security settings for development
    response.cookies.set({
      name: 'authjs.session-token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    console.log('[TestAuth] Cookie set, returning response');

    return response;
  } catch (error) {
    console.error('[TestAuth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Debug: GET endpoint to check if route is accessible
export async function GET() {
  console.log('[TestAuth] GET request received');

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test authentication not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Test authentication endpoint',
    environment: process.env.NODE_ENV,
    available: true,
  });
}
