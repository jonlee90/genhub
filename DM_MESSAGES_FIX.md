# DM Messages Loading Fix

## Problem
When clicking on a user to start a DM, the DM room is created successfully but loading messages fails with error:
```
[MessageList] Error loading messages: "Failed to load messages"
```

## Root Cause
The issue was caused by **invalid foreign key hint syntax** in Supabase queries. The queries were using PostgREST foreign key hints like:

```typescript
sender:user_profiles!messages_sender_id_fkey (...)
```

However, when using the Supabase service role client (which bypasses RLS), this syntax may not work correctly or requires exact foreign key constraint names.

## Secondary Issue
The `types/database.types.ts` file was corrupted/empty (only contained an error message), causing TypeScript type mismatches throughout the codebase.

## Solution

### 1. Removed Foreign Key Hints
Changed all Supabase queries to use simpler syntax without explicit foreign key hints:

**Before:**
```typescript
.select(`
  *,
  sender:user_profiles!messages_sender_id_fkey (id, name, email, avatar_url)
`)
```

**After:**
```typescript
.select(`
  *,
  sender:user_profiles (id, name, email, avatar_url)
`)
```

Supabase PostgREST can infer the correct foreign key relationship automatically based on column names (sender_id → user_profiles.id).

### 2. Regenerated Database Types
Created minimal database types in `types/database.types.ts` for:
- messages
- chat_rooms
- chat_participants
- user_profiles
- company_users

### 3. Added Better Error Logging
Enhanced error messages in `getMessages()` to include actual database error details for easier debugging.

## Files Modified

1. `app/actions/chat-queries.ts`
   - Removed all foreign key hints from queries
   - Enhanced error logging
   
2. `app/actions/chat.ts`
   - Removed all foreign key hints from queries

3. `types/database.types.ts`
   - Regenerated minimal type definitions

## Testing

After these changes, the DM functionality should work:

1. Go to `/app/chat`
2. Click "New Message" button
3. Select a user
4. The DM room should be created AND messages should load (empty list)
5. Send a message - it should appear in the list

## Next Steps

- Fully regenerate `types/database.types.ts` from Supabase using CLI with proper authentication
- Run TypeScript check to ensure all types are correct
- Test all chat functionality (project rooms, DMs, threads, reactions)

## Prevention

When writing Supabase queries:
- ✅ Use simple foreign key syntax: `sender:user_profiles (...)`
- ❌ Avoid explicit foreign key hints: `sender:user_profiles!fkey_name (...)`
- ✅ Let PostgREST infer relationships automatically
- ✅ Always test queries with the service role client
