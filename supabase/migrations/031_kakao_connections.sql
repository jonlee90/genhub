-- Migration 031: KakaoTalk Connections via Sendbird
-- Creates table for storing KakaoTalk account connections with encrypted tokens

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create kakao_connections table
CREATE TABLE public.kakao_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  kakao_user_id text NOT NULL,
  sendbird_user_id text NOT NULL,
  two_way_sync boolean NOT NULL DEFAULT false,
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  -- Encrypted tokens using pg_crypto
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT kakao_connections_user_id_key UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.kakao_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own KakaoTalk connection
CREATE POLICY "Users can view their own KakaoTalk connection"
  ON public.kakao_connections FOR SELECT
  TO authenticated
  USING (next_auth.uid() = user_id);

-- RLS Policy: Users can insert their own KakaoTalk connection
CREATE POLICY "Users can insert their own KakaoTalk connection"
  ON public.kakao_connections FOR INSERT
  TO authenticated
  WITH CHECK (next_auth.uid() = user_id);

-- RLS Policy: Users can update their own KakaoTalk connection
CREATE POLICY "Users can update their own KakaoTalk connection"
  ON public.kakao_connections FOR UPDATE
  TO authenticated
  USING (next_auth.uid() = user_id);

-- RLS Policy: Users can delete their own KakaoTalk connection
CREATE POLICY "Users can delete their own KakaoTalk connection"
  ON public.kakao_connections FOR DELETE
  TO authenticated
  USING (next_auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_kakao_connections_user_id ON public.kakao_connections(user_id);
CREATE INDEX idx_kakao_connections_sendbird_user_id ON public.kakao_connections(sendbird_user_id);
CREATE INDEX idx_kakao_connections_connected_at ON public.kakao_connections(connected_at);

-- Add updated_at trigger
CREATE TRIGGER update_kakao_connections_updated_at
  BEFORE UPDATE ON public.kakao_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.kakao_connections IS 'Stores KakaoTalk account connections via Sendbird integration with encrypted access tokens for two-way messaging sync';
COMMENT ON COLUMN public.kakao_connections.access_token IS 'Encrypted Sendbird access token for API calls';
COMMENT ON COLUMN public.kakao_connections.refresh_token IS 'Encrypted Sendbird refresh token for token renewal';
COMMENT ON COLUMN public.kakao_connections.two_way_sync IS 'Enable two-way message synchronization (GenHub ↔ KakaoTalk)';
COMMENT ON COLUMN public.kakao_connections.disconnected_at IS 'Timestamp when connection was disconnected (NULL = active connection)';
