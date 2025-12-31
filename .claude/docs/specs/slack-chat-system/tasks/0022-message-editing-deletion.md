# Task 0022: Message Editing & Deletion - COMPLETED ✅

**Epic:** Slack Chat System
**Status:** Completed
**Completed:** 2025-12-30
**Priority:** P1

---

## Overview

Implement message editing and soft deletion functionality, allowing users to edit their own messages within a time limit and delete messages with proper authorization checks.

---

## Acceptance Criteria

### Backend Implementation ✅

- [x] **Server actions implemented**
  - File: `app/actions/chat.ts` (modified)
  - Function: `editMessage(messageId: string, newContent: string)`
  - Function: `deleteMessage(messageId: string)`
  - Both use Zod validation
  - **SECURITY FIX (H2):** Atomic UPDATE with ownership check (prevents race condition)

- [x] **Authorization checks**
  - Only message sender can edit/delete their own messages
  - Verifies user is authenticated via `next_auth.uid()`
  - Atomic ownership check prevents TOCTOU vulnerability

- [x] **Soft delete implementation**
  - Sets `deleted_at` timestamp instead of hard delete
  - Deleted messages excluded from queries (`deleted_at IS NULL`)
  - Preserves message history for audit trails

- [x] **Edit tracking**
  - Sets `edited_at` timestamp on edit
  - Frontend displays "(edited)" indicator
  - Original message content not preserved (future enhancement)

### Frontend Implementation ✅

- [x] **Edit UI component created**
  - File: `components/chat/EditMessageForm.tsx`
  - Inline editing with blueprint form design
  - Keyboard shortcuts: Cmd+Enter (save), Esc (cancel)
  - Character count display
  - Construction-themed textarea with grid overlay

- [x] **Delete confirmation dialog created**
  - File: `components/chat/DeleteConfirmDialog.tsx`
  - Warning modal with construction zone aesthetic
  - Diagonal warning stripes (construction orange/white)
  - Animated alert triangle icon
  - Confirm/Cancel buttons with distinct styling

- [x] **Integration with MessageItem**
  - File: `components/chat/MessageItem.tsx` (modified)
  - Edit and Delete buttons in hover menu (sender only)
  - "(edited)" indicator for edited messages
  - Inline edit mode replaces message display
  - Smooth transitions between view/edit states

- [x] **User experience**
  - Only sender sees Edit/Delete buttons
  - Hover to reveal action buttons
  - Inline editing with autofocus
  - Confirmation dialog prevents accidental deletion
  - Optimistic UI updates with revalidation

---

## Implementation Details

### Server Actions

**File:** `app/actions/chat.ts`

#### editMessage Function

**Key Features:**
- Zod validation for `messageId` (UUID) and `newContent` (min 1 char)
- Atomic UPDATE with ownership check in same query
- Sets `edited_at` timestamp
- Cannot edit deleted messages (`deleted_at IS NULL` check)
- Returns updated message with sender profile

**Security Fix (H2 - Critical):**
- **Issue:** Original implementation used separate SELECT (ownership check) followed by UPDATE, creating TOCTOU (Time-of-Check-Time-of-Use) race condition
- **Fix:** Combined ownership check and update into single atomic operation
- **Result:** Eliminated race condition vulnerability

**Code Snippet (After Fix):**
```typescript
export async function editMessage(messageId: string, newContent: string) {
  // ... validation and user context ...

  // SECURITY FIX (H2): Atomic update with ownership check
  const { data: updatedMessage, error: updateError } = await supabase
    .from('messages')
    .update({
      content: data.newContent,
      edited_at: new Date().toISOString(),
    })
    .eq('id', data.messageId)
    .eq('sender_id', userId) // ATOMIC ownership check
    .is('deleted_at', null)
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (updateError || !updatedMessage) {
    return { error: 'Message not found or you do not have permission to edit it' };
  }

  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${updatedMessage.chat_room_id}`);

  return {
    success: true,
    message: updatedMessage,
  };
}
```

#### deleteMessage Function

**Key Features:**
- Zod validation for `messageId` (UUID)
- Soft delete: sets `deleted_at` timestamp
- Atomic UPDATE with ownership check
- Cannot delete already deleted messages
- Returns success with room ID for revalidation

**Security Fix (H2 - Critical):**
- Same atomic UPDATE pattern as editMessage
- Eliminated TOCTOU race condition

**Code Snippet (After Fix):**
```typescript
export async function deleteMessage(messageId: string) {
  // ... validation and user context ...

  // SECURITY FIX (H2): Atomic update with ownership check
  const { data: deletedMessage, error: deleteError } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', data.messageId)
    .eq('sender_id', userId) // ATOMIC ownership check
    .is('deleted_at', null)
    .select('id, chat_room_id')
    .single();

  if (deleteError || !deletedMessage) {
    return { error: 'Message not found or you do not have permission to delete it' };
  }

  revalidatePath('/app/chat');
  revalidatePath(`/app/chat/${deletedMessage.chat_room_id}`);

  return {
    success: true,
  };
}
```

### Frontend Components

#### EditMessageForm.tsx

**Design Theme:** "Blueprint Command Center" construction form

**Features:**
- **Blueprint grid overlay:** Industrial aesthetic
- **Stamped metal button style:** Construction-themed buttons
- **Keyboard shortcuts:**
  - `Cmd+Enter` or `Ctrl+Enter`: Save changes
  - `Esc`: Cancel editing
- **Character count:** Displays remaining characters (max 5000)
- **Autofocus:** Textarea auto-focuses on mount
- **Cancel protection:** Keyboard shortcut prevents accidental cancel

**Props:**
```typescript
interface EditMessageFormProps {
  messageId: string;
  initialContent: string;
  onCancel: () => void;
  onSave: () => void;
}
```

#### DeleteConfirmDialog.tsx

**Design Theme:** Construction zone warning modal

**Features:**
- **Diagonal warning stripes:** Orange/white construction pattern
- **Animated alert triangle:** Framer Motion scale animation
- **Distinct button styling:**
  - Delete: Construction red (#FF6B35) with white text
  - Cancel: Navy blue (#001B51) with white text
- **Modal backdrop:** Semi-transparent construction orange overlay
- **Confirmation text:** "This action cannot be undone"

**Props:**
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### MessageItem.tsx (Modified)

**Changes Made:**
1. Added Edit and Delete buttons to hover menu (sender only)
2. Added inline edit mode state
3. Added "(edited)" indicator display
4. Integrated EditMessageForm component
5. Integrated DeleteConfirmDialog component
6. Added keyboard handler for inline edit mode

**Conditional Rendering:**
```typescript
// Only show Edit/Delete for sender
{isSender && (
  <>
    <button onClick={() => setIsEditing(true)}>
      <Edit className="h-4 w-4" />
    </button>
    <button onClick={() => setShowDeleteDialog(true)}>
      <Trash2 className="h-4 w-4" />
    </button>
  </>
)}

// Show "(edited)" indicator
{message.edited_at && (
  <span className="text-xs text-gray-500 italic">(edited)</span>
)}
```

---

## Files Created

1. **`components/chat/EditMessageForm.tsx`** - Inline message editing UI
2. **`components/chat/DeleteConfirmDialog.tsx`** - Delete confirmation modal

---

## Files Modified

1. **`app/actions/chat.ts`** - Added editMessage() and deleteMessage() server actions
2. **`components/chat/MessageItem.tsx`** - Integrated edit/delete functionality

---

## Security Fixes Applied

### H2: Race Condition in editMessage and deleteMessage (CRITICAL)

**Vulnerability:** TOCTOU (Time-of-Check-Time-of-Use) race condition

**Original Code (Vulnerable):**
```typescript
// VULNERABLE CODE (before fix):

// Step 1: Check ownership
const { data: message } = await supabase
  .from('messages')
  .select('id, sender_id')
  .eq('id', messageId)
  .single();

if (message.sender_id !== userId) {
  return { error: 'Unauthorized' };
}

// Step 2: Update (RACE CONDITION HERE!)
// Between Step 1 and Step 2, another request could:
// - Change the message owner
// - Delete the message
// - Modify the message content
const { error } = await supabase
  .from('messages')
  .update({ content: newContent })
  .eq('id', messageId);
```

**Attack Scenario:**
1. User A sends request to edit message X
2. Check passes: User A owns message X
3. **DURING THIS GAP:** User B (attacker) transfers ownership to themselves
4. Update executes: User A edits message X (now owned by User B)
5. **RESULT:** User A edited someone else's message

**Fix Applied (Both Functions):**
```typescript
// SECURE CODE (after fix):

// Single atomic operation - ownership check + update combined
const { data: updatedMessage, error: updateError } = await supabase
  .from('messages')
  .update({
    content: data.newContent,
    edited_at: new Date().toISOString(),
  })
  .eq('id', data.messageId)
  .eq('sender_id', userId) // ATOMIC ownership check in WHERE clause
  .is('deleted_at', null)
  .select('*')
  .single();

// If no rows updated, ownership check failed
if (updateError || !updatedMessage) {
  return { error: 'Message not found or you do not have permission' };
}
```

**Result:**
- Eliminated race condition completely
- No separate queries = no time gap for attack
- Ownership check happens at database level in same transaction
- If ownership changes between request start and UPDATE, query returns 0 rows

---

## Testing Notes

### Test Cases

#### Edit Message

1. **Authorization:**
   - ✅ Sender can edit their own message
   - ✅ Non-sender cannot edit message (button not shown)
   - ✅ Unauthenticated users rejected

2. **Functionality:**
   - ✅ Content updates correctly
   - ✅ `edited_at` timestamp set
   - ✅ "(edited)" indicator displayed
   - ✅ Cannot edit deleted messages

3. **UI/UX:**
   - ✅ Inline edit mode displays correctly
   - ✅ Cmd+Enter saves changes
   - ✅ Esc cancels editing
   - ✅ Character count updates
   - ✅ Autofocus on textarea

4. **Security:**
   - ✅ Atomic ownership check prevents race condition
   - ✅ No TOCTOU vulnerability

#### Delete Message

1. **Authorization:**
   - ✅ Sender can delete their own message
   - ✅ Non-sender cannot delete message (button not shown)
   - ✅ Unauthenticated users rejected

2. **Functionality:**
   - ✅ Soft delete sets `deleted_at` timestamp
   - ✅ Message excluded from queries
   - ✅ Cannot delete already deleted messages

3. **UI/UX:**
   - ✅ Confirmation dialog displays
   - ✅ Cancel button works
   - ✅ Confirm button deletes message
   - ✅ Construction-themed warning design

4. **Security:**
   - ✅ Atomic ownership check prevents race condition
   - ✅ No TOCTOU vulnerability

---

## Performance Considerations

- Atomic UPDATE operations faster than SELECT + UPDATE
- Soft delete preserves referential integrity
- Path revalidation ensures UI updates after mutations
- Single database query per operation (no N+1)

---

## Future Enhancements

- [ ] Edit time limit (e.g., 15 minutes after sending)
- [ ] Edit history tracking (show all versions)
- [ ] Hard delete for GC Admin/PM roles
- [ ] Bulk delete for room moderators
- [ ] "Message edited" event for real-time sync
- [ ] Undo delete (restore deleted messages within time window)

---

## References

- **Epic Spec:** `.claude/docs/specs/slack-chat-system/epic-spec.md`
- **Database Schema:** `.claude/docs/law/DB_SCHEMA.md`
- **Security Review:** Code Review Report (2025-12-30)
- **Security Fixes:** H2 (Race Condition) - Applied 2025-12-30
