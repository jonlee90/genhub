-- NextAuth.js Supabase Adapter Schema
-- Required for authentication to work
-- Run this BEFORE other migrations

-- Create next_auth schema
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Grant usage to postgres roles
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Create users table
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text,
  "emailVerified" timestamptz,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- Create function to get current user id (used by RLS policies)
CREATE OR REPLACE FUNCTION next_auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Create accounts table (for OAuth providers)
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid NOT NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Create sessions table
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expires timestamptz NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Create verification tokens table (for email magic links)
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON next_auth.accounts("userId");
CREATE INDEX IF NOT EXISTS sessions_userId_idx ON next_auth.sessions("userId");
