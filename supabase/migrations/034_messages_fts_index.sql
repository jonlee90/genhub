-- Migration: Add Full-Text Search to messages
-- Date: 2025-12-30
-- Description: Creates GIN index for full-text search on message content
-- Task: 0021-message-search (Slack Chat System)

-- ============================================
-- Set search_path for security
-- ============================================
SET search_path = public;

-- ============================================
-- Add full-text search index on messages.content
-- ============================================

-- Debug: Creating GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_content_fts 
ON public.messages 
USING gin(to_tsvector('english', content));

-- Debug: Index allows efficient full-text queries with ts_query and ts_rank

-- ============================================
-- Add table comment
-- ============================================

COMMENT ON INDEX idx_messages_content_fts IS 'Full-text search index on message content using PostgreSQL GIN index. Enables fast searching with ts_query and ts_rank for relevance scoring.';
