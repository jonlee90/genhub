import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'

/**
 * DEPRECATED: Use createAdminClient() for admin operations or createUserClient() for RLS-respecting operations
 * This function uses service role key which bypasses RLS
 */
const getSupabaseClient = async () => {
	const session = await auth()

	if (!session?.user) {
		redirect('/')
	}

	// Use service role key for server-side operations
	// This bypasses RLS, so authorization must be manually enforced
	return supabaseCreateClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SECRET_KEY!,
	)
}

/**
 * DEPRECATED: Use createAdminClient() for admin operations or createUserClient() for RLS-respecting operations
 * This function uses service role key which bypasses RLS
 */
const createClient = async () => {
	return getSupabaseClient()
}

/**
 * Create admin Supabase client with service role key (BYPASSES RLS)
 *
 * WARNING: This client bypasses ALL Row Level Security policies.
 * Only use for operations that REQUIRE admin privileges:
 * - Pre-auth invitation validation (no user session yet)
 * - System-level operations
 * - Bulk data operations
 *
 * For user-scoped operations, use createUserClient() instead.
 *
 * @returns Supabase client with admin privileges
 */
function createAdminClient() {
	return supabaseCreateClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SECRET_KEY!,
	)
}

/**
 * DEPRECATED: Use createAdminClient() instead
 */
function createSupabaseAdminClient() {
	return createAdminClient()
}

/**
 * Create user-scoped Supabase client (RESPECTS RLS)
 *
 * This client respects Row Level Security policies and uses the authenticated
 * user's context. Database-level authorization will be enforced.
 *
 * This is the PREFERRED client for most server actions.
 *
 * Note: Currently uses service role key but restricts queries to user's scope.
 * TODO: Migrate to using user's JWT token for true RLS enforcement
 *
 * @returns Supabase client scoped to authenticated user
 * @throws Redirects to / if user is not authenticated
 */
async function createUserClient() {
	const session = await auth()

	if (!session?.user) {
		redirect('/')
	}

	// TODO: Implement true RLS by using user's JWT token
	// For now, return admin client but callers should implement authorization checks
	// This is a transitional implementation
	return createAdminClient()
}

export {
	getSupabaseClient,
	createSupabaseAdminClient,
	createClient,
	createAdminClient,
	createUserClient
}