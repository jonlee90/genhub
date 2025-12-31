# Task 0021: Message Search - COMPLETED ✅

**Epic:** Slack Chat System
**Status:** Completed
**Completed:** 2025-12-30
**Priority:** P1

---

## Overview

Implement message search functionality across all chat rooms with full-text search capabilities, allowing users to search within a specific room or across all accessible rooms.

---

## Acceptance Criteria

### Backend Implementation ✅

- [x] **Full-text search index created**
  - Created GIN index on `messages.content` using PostgreSQL `to_tsvector()`
  - Migration: `supabase/migrations/034_messages_fts_index.sql`
  - Index name: `idx_messages_content_fts`

- [x] **Server action implemented**
  - File: `app/actions/chat-search.ts`
  - Function: `searchMessages(query: string, chatRoomId?: string)`
  - Returns up to 50 results with message content, sender, room, timestamps
  - Zod validation for input parameters
  - **SECURITY FIX (H1):** Uses `type: 'plain'` for safe tsquery construction

- [x] **Authorization checks**
  - Verifies user is authenticated via `next_auth.uid()`
  - Ensures user has access to rooms (participant check)
  - Only returns non-deleted messages

### Frontend Implementation ✅

- [x] **Search UI component created**
  - File: `components/chat/SearchMessages.tsx`
  - Construction-themed "Blueprint Command Center" design
  - Toggle between "This Room" and "All Rooms" search
  - Real-time search with debouncing
  - Displays results with sender, room, timestamp, highlighted content

- [x] **Integration with ChatLayout**
  - File: `components/chat/ChatLayout.tsx` (modified)
  - Search button added to header (Search icon from Lucide)
  - Modal opens on click
  - Pre-fills current room ID when in room view

- [x] **User experience**
  - Search highlights: construction orange accent color
  - Empty state: "No messages found" with blueprint grid
  - Loading state: "Searching..." with animated effect
  - Results clickable (navigate to message)
  - Search scope toggle: "This Room" vs "All Rooms"

---

## Implementation Details

### Database Migration

**File:** `supabase/migrations/034_messages_fts_index.sql`

```sql
-- Migration 034: Add full-text search index on messages.content
-- Task 0021: Message Search

-- Create GIN index for full-text search on message content
CREATE INDEX IF NOT EXISTS idx_messages_content_fts
ON messages
USING GIN (to_tsvector('english', content));

-- Add comment
COMMENT ON INDEX idx_messages_content_fts IS 'Full-text search index for message content using English text search configuration';
```

**Applied:** 2025-12-30 via MCP Supabase

### Server Action

**File:** `app/actions/chat-search.ts`

**Key Features:**
- PostgreSQL full-text search via `textSearch()` with `type: 'plain'`
- Filters by `chatRoomId` if provided (room-scoped search)
- Returns sender profile, chat room info, entity references
- Limit: 50 results for performance
- Only returns messages where `deleted_at IS NULL`

**Security Fix (H1 - Critical):**
- **Issue:** Original implementation used `type: 'websearch'` with manual tsquery construction via string concatenation, vulnerable to SQL injection via special characters (`:`, `!`, `&`, `|`, `(`, `)`)
- **Fix:** Changed to `type: 'plain'` which automatically escapes special characters
- **Result:** Eliminated SQL injection attack vector

**Code Snippet (After Fix):**
```typescript
// SECURITY FIX (H1): Use 'plain' type to prevent tsquery injection
searchQuery = searchQuery.textSearch('content', data.query, {
  type: 'plain', // Use plain type for safe automatic escaping
  config: 'english',
});
```

### Frontend Component

**File:** `components/chat/SearchMessages.tsx`

**Design Theme:** "Blueprint Command Center" (industrial construction aesthetic)

**Features:**
- **Search input:** Blueprint grid overlay, stamped metal style
- **Scope toggle:** "This Room" / "All Rooms" with construction orange active state
- **Results display:**
  - Sender avatar and name
  - Room name (for "All Rooms" search)
  - Message content with search highlights
  - Timestamp (relative time)
  - Click to navigate to message
- **Empty state:** Blueprint grid background, construction tools icon
- **Animations:** Framer Motion for modal and result list

**Integration:**
- Imported in `ChatLayout.tsx`
- Triggered via Search button in header
- Pre-fills `currentRoomId` when in room view

---

## Files Created

1. **`supabase/migrations/034_messages_fts_index.sql`** - Full-text search GIN index
2. **`app/actions/chat-search.ts`** - Server action for message search
3. **`components/chat/SearchMessages.tsx`** - Search UI component

---

## Files Modified

1. **`components/chat/ChatLayout.tsx`** - Added Search button to header

---

## Security Fixes Applied

### H1: SQL Injection in tsquery Construction (CRITICAL)

**Vulnerability:** Manual string concatenation to build tsquery:
```typescript
// VULNERABLE CODE (before fix):
const tsQuery = data.query
  .trim()
  .split(/\s+/)
  .filter(word => word.length > 0)
  .join(' & ');

searchQuery = searchQuery.textSearch('content', tsQuery, {
  type: 'websearch',
  config: 'english',
});
```

**Risk:** Special characters like `:`, `!`, `&`, `|`, `(`, `)` could break tsquery syntax and inject malicious queries.

**Fix Applied:**
```typescript
// SECURE CODE (after fix):
searchQuery = searchQuery.textSearch('content', data.query, {
  type: 'plain', // Automatically escapes special characters
  config: 'english',
});
```

**Result:** Eliminated SQL injection attack vector by using PostgreSQL's built-in escaping via `type: 'plain'`.

---

## Testing Notes

### Test Cases

1. **Basic search:**
   - ✅ Search for single word
   - ✅ Search for multiple words
   - ✅ Search with special characters (safely escaped)

2. **Search scope:**
   - ✅ "This Room" returns results only from current room
   - ✅ "All Rooms" returns results from all accessible rooms

3. **Authorization:**
   - ✅ Only returns results from rooms user is a participant in
   - ✅ Unauthenticated requests rejected

4. **Result display:**
   - ✅ Shows sender name, avatar, room name
   - ✅ Highlights search query in results
   - ✅ Click navigates to message
   - ✅ Empty state when no results

5. **Security:**
   - ✅ Special characters safely escaped (`:`, `!`, `&`, `|`, `(`, `)`)
   - ✅ No SQL injection via tsquery

---

## Performance Considerations

- GIN index provides fast full-text search (O(log n) lookup)
- Limit of 50 results prevents excessive data transfer
- Debounced search input (300ms) reduces server load
- Uses `.select()` to fetch only required fields

---

## Future Enhancements

- [ ] Advanced search filters (sender, date range, room type)
- [ ] Search result pagination (currently limited to 50)
- [ ] Search within attachments/entity references
- [ ] Search highlighting in the actual message thread (scroll to match)
- [ ] Search analytics (most searched terms)

---

## References

- **Epic Spec:** `.claude/docs/specs/slack-chat-system/epic-spec.md`
- **Database Schema:** `.claude/docs/law/DB_SCHEMA.md`
- **Security Review:** Code Review Report (2025-12-30)
- **Migration Applied:** 2025-12-30 via MCP Supabase
