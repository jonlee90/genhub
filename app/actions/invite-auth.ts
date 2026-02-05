"use server";

import { z } from "zod";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/server";
import { validateInvitationToken, acceptInvitation } from "@/app/actions/accept-invite";

// ============================================
// Validation Schemas
// ============================================

const checkEmailExistsSchema = z.object({
  email: z.string().email("Invalid email address").transform((v) => v.toLowerCase().trim()),
});

const signupWithInvitationSchema = z.object({
  token: z.string().uuid("Invalid invitation token format"),
  name: z.string().min(1, "Name is required").max(200).transform((v) => v.trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (password) => /[A-Z]/.test(password),
      "Password must contain at least one uppercase letter"
    )
    .refine(
      (password) => /[a-z]/.test(password),
      "Password must contain at least one lowercase letter"
    )
    .refine(
      (password) => /[0-9]/.test(password),
      "Password must contain at least one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const validatePasswordForInvitationSchema = z.object({
  token: z.string().uuid("Invalid invitation token format"),
  password: z.string().min(1, "Password is required"),
});

// ============================================
// Types
// ============================================

export type CheckEmailExistsResult =
  | { success: true; exists: boolean; hasPassword: boolean }
  | { success: false; error: string };

export type SignupWithInvitationResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type ValidatePasswordForInvitationResult =
  | { success: true; email: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ============================================
// Server Actions
// ============================================

/**
 * Check if an email exists in Supabase Auth and has a password set
 *
 * SECURITY FIXES APPLIED:
 * - Uses admin client to access auth.admin API
 * - No authentication required (pre-signup check)
 * - Validates email format with Zod
 *
 * @param email - Email address to check
 * @returns Object with exists and hasPassword flags
 */
export async function checkEmailExists(
  email: string
): Promise<CheckEmailExistsResult> {
  try {
    // Validate email format
    const validation = checkEmailExistsSchema.safeParse({ email });
    if (!validation.success) {
      return { success: false, error: "Invalid email address" };
    }

    const validatedEmail = validation.data.email;

    // Use admin client to access auth.admin API
    const supabase = createAdminClient();

    // Query Supabase Auth for user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error checking email existence:", authError);
      return { success: false, error: "Failed to check email. Please try again." };
    }

    // Find user by email (case-insensitive)
    const user = authUsers.users.find(
      (u) => u.email?.toLowerCase() === validatedEmail
    );

    if (!user) {
      return { success: true, exists: false, hasPassword: false };
    }

    // Check if user has a password identity (email + password auth)
    // Users with only OAuth (Google) won't have this
    const hasPasswordIdentity = user.identities?.some(
      (identity) => identity.provider === "email"
    ) ?? false;

    return {
      success: true,
      exists: true,
      hasPassword: hasPasswordIdentity,
    };
  } catch (error) {
    console.error("Unexpected error checking email existence:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Sign up a new user with email + password via invitation
 *
 * SECURITY FIXES APPLIED:
 * - Validates invitation token (expiration, single-use)
 * - Strong password validation with Zod
 * - Creates Supabase Auth user with email_confirm: true (invitation email IS verification)
 * - Creates user_profiles entry
 * - Does NOT mark invitation as used (that happens on login via acceptInvitation)
 * - Uses admin client for auth operations
 *
 * @param data - Object with token, name, password, confirmPassword
 * @returns Success message or error
 */
export async function signupWithInvitation(
  data: z.infer<typeof signupWithInvitationSchema>
): Promise<SignupWithInvitationResult> {
  try {
    // Validate input
    const validation = signupWithInvitationSchema.safeParse(data);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: errors,
      };
    }

    const validatedData = validation.data;

    // Validate invitation token
    const tokenValidation = await validateInvitationToken(validatedData.token);
    if (!tokenValidation.success) {
      return { success: false, error: tokenValidation.error };
    }

    const invitation = tokenValidation.invitation;

    // Use admin client for auth operations
    const supabase = createAdminClient();

    // Check if user already exists in Supabase Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("[SIGNUP_WITH_INVITATION] Error listing users:", listError);
      return { success: false, error: "Failed to check existing users. Please try again." };
    }

    const existingAuthUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    if (existingAuthUser) {
      // User already has an auth account
      // Check if they have a password identity
      const hasPasswordIdentity = existingAuthUser.identities?.some(
        (identity) => identity.provider === "email"
      ) ?? false;

      if (hasPasswordIdentity) {
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        };
      } else {
        return {
          success: false,
          error: "This email is associated with a Google account. Please sign in with Google instead.",
        };
      }
    }

    // Create Supabase Auth user with email + password
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: validatedData.password,
      email_confirm: true, // Skip email verification since invitation email IS verification
      user_metadata: {
        name: validatedData.name,
      },
    });

    if (createUserError || !authUser.user) {
      console.error("[SIGNUP_WITH_INVITATION] Error creating auth user:", createUserError);
      return {
        success: false,
        error: `Failed to create account: ${createUserError?.message || "Unknown error"}`,
      };
    }

    console.log("[SIGNUP_WITH_INVITATION] Auth user created:", authUser.user.id);

    // Step 2: Create next_auth.users record for NextAuth CredentialsProvider
    // The CredentialsProvider queries next_auth.users to find users after password validation
    // Note: We use a raw client (untyped) because createAdminClient is typed for public schema only
    console.log("[SIGNUP_WITH_INVITATION] Creating next_auth user record");
    const rawSupabase = createRawClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );
    const { error: nextAuthError } = await rawSupabase
      .schema('next_auth')
      .from('users')
      .insert({
        email: invitation.email.toLowerCase(),
        name: validatedData.name,
        emailVerified: new Date().toISOString(),
        image: null,
      });

    if (nextAuthError) {
      console.error("[SIGNUP_WITH_INVITATION] Error creating next_auth user:", nextAuthError);

      // Rollback: Delete the Supabase Auth user to maintain consistency
      console.log("[SIGNUP_WITH_INVITATION] Rolling back auth user creation");
      await supabase.auth.admin.deleteUser(authUser.user.id);

      return {
        success: false,
        error: "Failed to create user account. Please try again.",
      };
    }

    console.log("[SIGNUP_WITH_INVITATION] next_auth user record created successfully");

    // NOTE: We do NOT create user_profiles here
    // The handle_new_user() trigger will automatically create user_profiles
    // when the next_auth.users record is inserted

    // NOTE: We do NOT mark invitation as used here
    // That happens when user logs in and acceptInvitation() is called

    return {
      success: true,
      message: "Account created successfully! Please sign in to continue.",
    };
  } catch (error) {
    console.error("[SIGNUP_WITH_INVITATION] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Validate password for invitation login (password check only)
 *
 * SECURITY FIXES APPLIED:
 * - Validates invitation token (expiration, single-use)
 * - Validates password against Supabase Auth
 * - Returns email for client to use with NextAuth signIn()
 * - Does NOT create NextAuth session (client does that)
 * - Does NOT call acceptInvitation (client does that AFTER signIn)
 *
 * Flow:
 * 1. Client calls this to validate password
 * 2. Client calls signIn("credentials") to create NextAuth session
 * 3. Client calls acceptInvitation() to mark token used and link to company
 *
 * @param data - Object with token and password
 * @returns Success with email or error
 */
export async function validatePasswordForInvitation(
  data: z.infer<typeof validatePasswordForInvitationSchema>
): Promise<ValidatePasswordForInvitationResult> {
  try {
    // Validate input
    const validation = validatePasswordForInvitationSchema.safeParse(data);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: errors,
      };
    }

    const validatedData = validation.data;

    // Validate invitation token
    const tokenValidation = await validateInvitationToken(validatedData.token);
    if (!tokenValidation.success) {
      return { success: false, error: tokenValidation.error };
    }

    const invitation = tokenValidation.invitation;

    // Use admin client for auth operations
    const supabase = createAdminClient();

    // Verify password with Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: validatedData.password,
    });

    if (signInError || !authData.user) {
      console.error("[VALIDATE_PASSWORD_FOR_INVITATION] Sign-in error:", signInError);
      return {
        success: false,
        error: "Invalid password. Please try again.",
      };
    }

    console.log("[VALIDATE_PASSWORD_FOR_INVITATION] Password validated for user:", authData.user.id);

    // Sign out from Supabase (client will create NextAuth session)
    await supabase.auth.signOut();

    // Return email for client to use with signIn("credentials")
    return {
      success: true,
      email: invitation.email,
    };
  } catch (error) {
    console.error("[VALIDATE_PASSWORD_FOR_INVITATION] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
