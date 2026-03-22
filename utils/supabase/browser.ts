/**
 * Browser-safe Supabase client for client-side realtime subscriptions
 *
 * IMPORTANT: This client is for CLIENT COMPONENTS ONLY
 * - Used for Supabase Realtime (websocket) connections
 * - Does NOT import any server-only dependencies (auth, nodemailer, etc.)
 * - Uses anon key - RLS policies will be enforced
 *
 * For data mutations, use Server Actions instead
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Debug: Browser client singleton
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Get browser-safe Supabase client for realtime subscriptions
 *
 * This is a singleton - the same client is returned on subsequent calls.
 * The client uses the anon key and respects RLS policies.
 *
 * Use this ONLY for:
 * - Supabase Realtime subscriptions (postgres_changes, broadcast, presence)
 * - Client-side reads where RLS is properly configured
 *
 * DO NOT use for:
 * - Data mutations (use Server Actions instead)
 * - Admin operations (use server.ts createAdminClient)
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10, // Rate limiting for realtime events
        },
      },
    },
  );

  return browserClient;
}

/**
 * Helper to check if we're in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}
