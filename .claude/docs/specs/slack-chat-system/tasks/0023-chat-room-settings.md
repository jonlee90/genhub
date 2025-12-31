# Task 0023: Chat Room Settings - COMPLETED ✅

**Epic:** Slack Chat System
**Status:** Completed
**Completed:** 2025-12-30
**Priority:** P1

---

## Overview

Implement chat room settings UI allowing GC Admins and Project Managers to manage room details, view members, and export transcripts. Includes role-based access control for administrative features.

---

## Acceptance Criteria

### Backend Implementation ✅

- [x] **Server actions implemented**
  - File: `app/actions/chat.ts` (modified)
  - Function: `updateChatRoom(roomId, {name, description})`
  - Function: `exportTranscript(roomId)`
  - Function: `getChatRoomParticipants(roomId)`
  - Function: `isUserGcAdmin()`
  - All use Zod validation

- [x] **Authorization checks**
  - Only GC Admin/PM can update room settings
  - Only GC Admin/PM can export transcripts
  - All users can view members (participant check)
  - Role-based permissions via `user_profiles.role` column

- [x] **Transcript export**
  - Returns all messages with sender names, timestamps
  - JSON format with room metadata
  - Includes non-deleted messages only
  - Ordered by timestamp (oldest first)

- [x] **Member list**
  - Returns all participants with user profiles
  - Includes role, avatar, join/left timestamps
  - Excludes users who have left (`left_at IS NULL`)

### Frontend Implementation ✅

- [x] **Chat Settings modal created**
  - File: `components/chat/ChatSettings.tsx`
  - Construction-themed modal with blueprint grid
  - Three sections: Room Details, Members, Transcript Export
  - Role-based UI (only GC Admin/PM see editable fields)
  - Settings icon button in ChatLayout header

- [x] **Chat Member List component created**
  - File: `components/chat/ChatMemberList.tsx`
  - Displays all participants with avatars
  - Role badges with construction icons:
    - GC Admin: Shield icon (navy blue)
    - Project Manager: Wrench icon (construction orange)
    - Worker: HardHat icon (gray)
  - Read-only display with construction card styling

- [x] **Integration with ChatLayout**
  - File: `components/chat/ChatLayout.tsx` (modified)
  - Settings button added to header (Settings icon from Lucide)
  - Only shown for project rooms (not DM rooms)
  - Modal opens on click

- [x] **User experience**
  - GC Admin/PM can edit room name and description
  - All users can view member list
  - GC Admin/PM can export transcript
  - Construction-themed form inputs with grid overlays
  - Stamped metal button styling
  - Success/error toast notifications

---

## Implementation Details

### Server Actions

**File:** `app/actions/chat.ts`

#### updateChatRoom Function

**Key Features:**
- Zod validation for `roomId` (UUID), `name` (optional), `description` (optional)
- Authorization: only GC Admin or PM can update
- Updates `chat_rooms` table
- Verifies room exists and user is participant
- Returns updated room data

**Code Snippet:**
```typescript
export async function updateChatRoom(
  roomId: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  // ... validation and user context ...

  // Check if user is GC Admin or PM
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || (profile.role !== 'gc_admin' && profile.role !== 'project_manager')) {
    return { error: 'Only GC Admins and Project Managers can update room settings' };
  }

  // Update room
  const { data: updatedRoom, error: updateError } = await supabase
    .from('chat_rooms')
    .update({
      name: data.name,
      description: data.description,
    })
    .eq('id', data.roomId)
    .select()
    .single();

  // ... error handling and revalidation ...
}
```

#### exportTranscript Function

**Key Features:**
- Zod validation for `roomId` (UUID)
- Authorization: only GC Admin or PM can export
- Returns all non-deleted messages with sender names
- JSON format with room metadata
- Ordered by timestamp (oldest first)

**Return Format:**
```typescript
{
  room: {
    id: string;
    name: string;
    type: string;
    created_at: string;
  },
  messages: Array<{
    id: string;
    content: string;
    sender_name: string;
    sender_id: string;
    created_at: string;
    edited_at: string | null;
  }>,
  exported_at: string;
  exported_by: string;
}
```

#### getChatRoomParticipants Function

**Key Features:**
- Zod validation for `roomId` (UUID)
- Verifies user is participant in room
- Returns all participants with user profiles
- Includes role, avatar, timestamps
- Excludes users who have left (`left_at IS NULL`)

**Return Format:**
```typescript
Array<{
  id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: 'gc_admin' | 'project_manager' | 'worker';
  };
}>
```

#### isUserGcAdmin Function

**Key Features:**
- Simple helper to check if current user is GC Admin or PM
- Used to conditionally render UI elements
- Returns boolean

---

### Frontend Components

#### ChatSettings.tsx

**Design Theme:** "Blueprint Command Center" settings modal

**Features:**
- **Three-section layout:**
  1. **Room Details:** Name and description (editable for GC Admin/PM)
  2. **Members:** Member list component with role badges
  3. **Transcript Export:** Export button (GC Admin/PM only)

- **Role-based UI:**
  - GC Admin/PM see editable fields + Export button
  - Workers see read-only view

- **Construction theme:**
  - Blueprint grid overlay on inputs
  - Stamped metal buttons
  - Industrial color palette
  - Settings icon (sliders) in header

**Props:**
```typescript
interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  roomDescription?: string;
}
```

**State Management:**
- Local state for name/description input
- Fetches member list on mount
- Checks user role on mount
- Handles form submission with server action

**Export Functionality:**
```typescript
const handleExport = async () => {
  const result = await exportTranscript(roomId);
  if (result.success) {
    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(result.transcript, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName}-transcript-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

#### ChatMemberList.tsx

**Design Theme:** Construction role badges

**Features:**
- **Member cards:** Avatar, name, email, role badge
- **Role icons:**
  - **GC Admin:** Shield icon (navy blue #001B51)
  - **Project Manager:** Wrench icon (construction orange #FF6B35)
  - **Worker:** HardHat icon (gray #7A7A7A)
- **Read-only display:** No add/remove functionality (future enhancement)
- **Construction card styling:** Grid background, stamped metal borders

**Props:**
```typescript
interface ChatMemberListProps {
  members: Array<{
    id: string;
    user_id: string;
    joined_at: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
      role: 'gc_admin' | 'project_manager' | 'worker';
    };
  }>;
}
```

**Role Badge Component:**
```typescript
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'gc_admin':
      return <Shield className="h-4 w-4" />;
    case 'project_manager':
      return <Wrench className="h-4 w-4" />;
    case 'worker':
      return <HardHat className="h-4 w-4" />;
    default:
      return <HardHat className="h-4 w-4" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'gc_admin':
      return 'bg-[#001B51] text-white'; // Navy blue
    case 'project_manager':
      return 'bg-[#FF6B35] text-white'; // Construction orange
    case 'worker':
      return 'bg-[#7A7A7A] text-white'; // Gray
    default:
      return 'bg-gray-500 text-white';
  }
};
```

---

## Files Created

1. **`components/chat/ChatSettings.tsx`** - Room settings modal UI
2. **`components/chat/ChatMemberList.tsx`** - Member list display component

---

## Files Modified

1. **`app/actions/chat.ts`** - Added 4 new server actions:
   - `updateChatRoom()`
   - `exportTranscript()`
   - `getChatRoomParticipants()`
   - `isUserGcAdmin()`

2. **`components/chat/ChatLayout.tsx`** - Added Settings button to header (project rooms only)

---

## Testing Notes

### Test Cases

#### Update Room Settings

1. **Authorization:**
   - ✅ GC Admin can update room name and description
   - ✅ Project Manager can update room name and description
   - ✅ Worker cannot update (button not shown)
   - ✅ Unauthenticated users rejected

2. **Functionality:**
   - ✅ Room name updates correctly
   - ✅ Room description updates correctly
   - ✅ Empty name/description handled
   - ✅ UI revalidates after update

3. **UI/UX:**
   - ✅ Settings modal displays correctly
   - ✅ Input fields pre-filled with current values
   - ✅ Save button triggers server action
   - ✅ Success/error toast notifications

#### Export Transcript

1. **Authorization:**
   - ✅ GC Admin can export transcript
   - ✅ Project Manager can export transcript
   - ✅ Worker cannot export (button not shown)

2. **Functionality:**
   - ✅ Transcript includes all non-deleted messages
   - ✅ JSON format with room metadata
   - ✅ Messages ordered by timestamp
   - ✅ Sender names included
   - ✅ File downloads correctly

3. **UI/UX:**
   - ✅ Export button visible only to GC Admin/PM
   - ✅ Click triggers download
   - ✅ Filename includes room name and timestamp

#### Member List

1. **Functionality:**
   - ✅ Displays all participants
   - ✅ Shows user avatars, names, emails
   - ✅ Role badges display correctly
   - ✅ Excludes users who have left

2. **UI/UX:**
   - ✅ Construction-themed role badges
   - ✅ Correct icon for each role
   - ✅ Correct color for each role
   - ✅ Read-only display (no add/remove)

---

## Performance Considerations

- Member list fetched once on modal open (not real-time)
- Transcript export limited to current data (no pagination needed for initial version)
- Role check cached in component state (avoids repeated server calls)
- Settings modal lazy-loaded (only when opened)

---

## Future Enhancements

- [ ] Add/remove participants (GC Admin/PM only)
- [ ] Change user roles within room
- [ ] Room permissions/privacy settings
- [ ] Mute/unmute room notifications
- [ ] Pin important messages
- [ ] Real-time member list updates via Supabase Realtime
- [ ] Export transcript as PDF/CSV (not just JSON)
- [ ] Archive/delete rooms (GC Admin only)
- [ ] Room analytics (message count, activity heatmap)

---

## Role-Based Access Control

### Permissions Matrix

| Action | GC Admin | Project Manager | Worker |
|--------|----------|-----------------|--------|
| View room settings | ✅ | ✅ | ✅ |
| Update room name/description | ✅ | ✅ | ❌ |
| View member list | ✅ | ✅ | ✅ |
| Add/remove members | 🔜 | 🔜 | ❌ |
| Export transcript | ✅ | ✅ | ❌ |
| Delete room | 🔜 | ❌ | ❌ |

**Legend:**
- ✅ Implemented
- ❌ Not allowed
- 🔜 Planned (future enhancement)

---

## References

- **Epic Spec:** `.claude/docs/specs/slack-chat-system/epic-spec.md`
- **Database Schema:** `.claude/docs/law/DB_SCHEMA.md`
- **UI Rules:** `.claude/docs/law/UI_RULES.md`
- **Role System:** See `user_profiles.role` column
- **Construction Theme:** Blueprint grids, stamped metal buttons, role badges
