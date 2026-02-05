import NextAuth, { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import Resend from "next-auth/providers/resend"
import { sendVerificationRequest } from "@/lib/authSendRequest"
import config from "@/config"
import { createClient } from "@supabase/supabase-js"
//read https://github.com/nextauthjs/next-auth/issues/8357O

const authConfig = {
	secret: process.env.AUTH_SECRET,
	providers: [
		GoogleProvider({
			allowDangerousEmailAccountLinking: true,
			clientId: process.env.AUTH_GOOGLE_ID!,
			clientSecret: process.env.AUTH_GOOGLE_SECRET!,
		}),
		CredentialsProvider({
			id: "credentials",
			name: "Email & Password",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				console.log('[CredentialsProvider] Authorize called with email:', credentials?.email);

				if (!credentials?.email || !credentials?.password) {
					console.log('[CredentialsProvider] Missing email or password');
					return null;
				}

				// Create Supabase client with service role for auth validation
				const supabase = createClient(
					process.env.NEXT_PUBLIC_SUPABASE_URL!,
					process.env.SUPABASE_SECRET_KEY!,
					{ auth: { autoRefreshToken: false, persistSession: false } }
				);

				// Step 1: Validate password with Supabase Auth
				console.log('[CredentialsProvider] Validating password with Supabase Auth');
				const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
					email: credentials.email as string,
					password: credentials.password as string,
				});

				if (authError) {
					console.error('[CredentialsProvider] Supabase Auth error:', authError.message);
					return null;
				}

				if (!authData.user) {
					console.error('[CredentialsProvider] No user returned from Supabase Auth');
					return null;
				}

				// Sign out from Supabase (we only use it for password validation)
				await supabase.auth.signOut();

				console.log('[CredentialsProvider] Password validated, looking up NextAuth user');

				// Step 2: Find the NextAuth user record by querying next_auth schema
				// The Supabase client needs to query the next_auth.users table
				const { data: nextAuthUser, error: userError } = await supabase
					.schema('next_auth')
					.from('users')
					.select('id, email, name, image')
					.eq('email', (credentials.email as string).toLowerCase())
					.maybeSingle();

				if (userError || !nextAuthUser) {
					console.error('[CredentialsProvider] NextAuth user not found:', userError?.message);
					return null;
				}

				console.log('[CredentialsProvider] Sign-in successful, NextAuth user ID:', nextAuthUser.id);
				return {
					id: nextAuthUser.id,
					email: nextAuthUser.email,
					name: nextAuthUser.name || null,
					image: nextAuthUser.image || null,
				};
			},
		}),
		...(config.emailProvider === "resend" ? [
			Resend({
				apiKey: process.env.AUTH_RESEND_KEY,
				from: process.env.EMAIL_FROM,
				sendVerificationRequest: async function ({ identifier: email, url, provider, theme }) {
					//@ts-ignore - Ignoring type check here as sendVerificationRequest expects slightly different parameter structure than what Next-Auth provides
					sendVerificationRequest({ identifier: email, url, provider, theme })
				}
			})
		] : []),
	],
	adapter: SupabaseAdapter({
		url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
		secret: process.env.SUPABASE_SECRET_KEY!,
	}),
	session: {
		strategy: "jwt", // Use JWT sessions - required for CredentialsProvider
	},
	callbacks: {
		async jwt({ token, user }) {
			// On sign in, add user data to the token
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
				token.picture = user.image;
			}
			return token;
		},
		async session({ session, token }) {
			// Add user ID to session from JWT token
			if (token?.id) {
				session.user.id = token.id as string;
			}
			if (token?.email) {
				session.user.email = token.email as string;
			}
			if (token?.name) {
				session.user.name = token.name as string;
			}
			if (token?.picture) {
				session.user.image = token.picture as string;
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			// Allow callback URLs with query parameters (like admin-invite/signup?token=xxx)
			// If url starts with baseUrl, it's a relative redirect - allow it
			if (url.startsWith(baseUrl)) {
				return url;
			}
			// If url is a relative path, prepend baseUrl
			if (url.startsWith('/')) {
				return `${baseUrl}${url}`;
			}
			// Otherwise, redirect to baseUrl (safety fallback)
			return baseUrl;
		},
	},
} satisfies NextAuthConfig

export const { auth } = NextAuth(authConfig)

export default authConfig