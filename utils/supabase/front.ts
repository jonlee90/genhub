import { createClient } from "@supabase/supabase-js";
import { Database } from '@/types/database.types'

export function createSupabaseClient(supabaseAccessToken?: string) {
	// Use anon key for client-side operations
	// Server-side operations should use the service role key via utils/supabase/server.ts
	return createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)
}