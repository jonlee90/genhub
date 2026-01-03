# Task 0009: File & Photo Sharing - Implementation Guide

## Overview

Backend implementation for file and photo sharing in the GenHub chat system. Users can upload files (images, documents, archives) up to 10MB, with automatic validation and Vercel Blob storage integration.

## What Was Implemented ✅

### 1. Database Schema
- **Table**: `message_attachments`
- **File Size Limit**: 10MB (10,485,760 bytes)
- **Supported File Types**:
  - **Images**: JPG, JPEG, PNG, GIF, WEBP
  - **Documents**: PDF, DOC, DOCX, XLS, XLSX
  - **Archives**: ZIP

### 2. Server Actions
All actions in `/app/actions/chat.ts`:

| Action | Purpose |
|--------|---------|
| `uploadAttachment(formData)` | Upload file to Vercel Blob, create DB record |
| `getMessageAttachments(messageId)` | Fetch attachments for a message |
| `deleteAttachment(attachmentId)` | Delete attachment (user must own it) |
| `getMessagesAttachments(messageIds)` | Batch fetch for multiple messages |

### 3. Security
- RLS policies enforce chat room access
- File type whitelist validation
- File size validation (client + server)
- User can only delete their own attachments

## Setup Instructions

### Step 1: Apply Database Migration

**Option A: Manual (Recommended if MCP is timing out)**
```bash
# Copy SQL from supabase/migrations/20251230_message_attachments.sql
# Go to Supabase Studio → SQL Editor
# Paste and execute
```

**Option B: Using Helper Script**
```bash
node scripts/apply-message-attachments-migration.mjs
```

**Option C: Using MCP Supabase (when connection is stable)**
```bash
mcp__supabase__apply_migration name:"message_attachments_table" query:"<paste SQL>"
```

### Step 2: Set Up Vercel Blob Storage

1. **Create Blob Store** (if not exists):
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Storage** → **Blob**
   - Click **Create Database**

2. **Get Access Token**:
   - In the Blob store settings, copy `BLOB_READ_WRITE_TOKEN`

3. **Add to Environment Variables**:
   ```bash
   # .env.local
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
   ```

4. **Add to Vercel (for production)**:
   - Go to Project Settings → Environment Variables
   - Add `BLOB_READ_WRITE_TOKEN`

### Step 3: Regenerate TypeScript Types

```bash
# Get your project ID from NEXT_PUBLIC_SUPABASE_URL
# URL format: https://<PROJECT_ID>.supabase.co
# Then run:

npx supabase gen types typescript \
  --project-id <YOUR_PROJECT_ID> \
  --schema public > types/database.types.ts
```

Or use MCP:
```
mcp__supabase__generate_typescript_types
```

### Step 4: Verify Installation

```bash
# Check migration was applied
node scripts/db-diagnose.mjs

# Look for message_attachments table in output
```

## Usage Examples

### Upload Attachment

```typescript
// In a client component
'use client';

import { uploadAttachment } from '@/app/actions/chat';

async function handleFileUpload(messageId: string, file: File) {
  const formData = new FormData();
  formData.append('messageId', messageId);
  formData.append('file', file);

  const result = await uploadAttachment(formData);

  if (result.error) {
    console.error('Upload failed:', result.error);
    return;
  }

  console.log('Upload success:', result.attachment);
  // {
  //   id: 'uuid',
  //   file_name: 'example.pdf',
  //   file_url: 'https://blob.vercel-storage.com/...',
  //   file_type: 'application/pdf',
  //   file_size: 1234567,
  //   thumbnail_url: null,
  //   created_at: '2025-12-30T...'
  // }
}
```

### Get Message Attachments

```typescript
// In a server component
import { getMessageAttachments } from '@/app/actions/chat';

const result = await getMessageAttachments(messageId);

if (result.success) {
  const attachments = result.attachments; // Array of attachment objects
}
```

### Delete Attachment

```typescript
import { deleteAttachment } from '@/app/actions/chat';

async function handleDelete(attachmentId: string) {
  const result = await deleteAttachment(attachmentId);

  if (result.error) {
    // User doesn't own attachment or other error
    console.error(result.error);
  }
}
```

### Batch Fetch Attachments

```typescript
// For displaying attachments in a message list
import { getMessagesAttachments } from '@/app/actions/chat';

const messageIds = ['uuid1', 'uuid2', 'uuid3'];
const result = await getMessagesAttachments(messageIds);

if (result.success) {
  const attachmentsMap = result.attachmentsMap;
  // {
  //   'uuid1': [attachment1, attachment2],
  //   'uuid2': [],
  //   'uuid3': [attachment3]
  // }
}
```

## File Type Validation

### Client-Side (in UI component)
```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

function validateFile(file: File): string | null {
  if (file.size > 10485760) {
    return 'File size exceeds 10MB limit';
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Allowed: images, PDF, DOC, XLS, ZIP';
  }

  return null; // Valid
}
```

### Server-Side
Validation happens automatically in `uploadAttachment()`. Errors are returned in the response:
```typescript
{ error: 'File size exceeds 10MB limit' }
{ error: 'Invalid file type. Allowed: ...' }
```

## Security Best Practices

### 1. File Type Validation
- **Whitelist-based**: Only specific MIME types allowed
- **Server + Client**: Validated on both sides
- **No Executables**: .exe, .sh, .bat, etc. are blocked

### 2. File Size Limits
- **Hard Limit**: 10MB enforced in database CHECK constraint
- **Server Validation**: Before upload to prevent wasted bandwidth
- **Client Validation**: For better UX (immediate feedback)

### 3. Access Control
- **RLS Policies**: Users can only access attachments in their chat rooms
- **Ownership Check**: Users can only delete their own attachments
- **Room Verification**: Every operation verifies chat room access

### 4. Storage Security
- **Vercel Blob**: Files stored securely in Vercel's CDN
- **Public Access**: Files are publicly accessible via URL (no auth required on blob)
- **URL Obfuscation**: URLs are long and hard to guess

### 5. Malware Prevention
- **Type Whitelist**: Prevents executable files
- **Size Limit**: Prevents large malicious uploads
- **TODO**: Consider virus scanning integration (e.g., ClamAV)

## Database Schema Details

### Table: `message_attachments`

```sql
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Indexes
- `idx_message_attachments_message_id` - Fast lookup by message
- `idx_message_attachments_created_at` - Chronological ordering

### RLS Policies
```sql
-- View attachments in accessible rooms
CREATE POLICY "Users can view attachments in their chat rooms"
ON message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN chat_participants cp ON cp.chat_room_id = m.chat_room_id
    WHERE m.id = message_attachments.message_id
    AND cp.user_id = next_auth.uid()
  )
);

-- Upload to accessible rooms
CREATE POLICY "Users can upload attachments to their messages"
ON message_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN chat_participants cp ON cp.chat_room_id = m.chat_room_id
    WHERE m.id = message_attachments.message_id
    AND cp.user_id = next_auth.uid()
  )
);

-- Delete own attachments
CREATE POLICY "Users can delete their own attachments"
ON message_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_attachments.message_id
    AND m.sender_id = next_auth.uid()
  )
);
```

### Triggers
- **update_updated_at_column**: Auto-update `updated_at` on changes
- **on_message_attachment_change**: Update parent `message.updated_at` when attachments change

## Optional Features

### Project Attachment Sync
The migration includes an optional trigger to sync chat attachments to the main `attachments` table for project chats. This is **disabled by default**.

To enable:
```sql
-- Run in Supabase Studio SQL Editor
CREATE TRIGGER sync_project_attachments_on_insert
AFTER INSERT ON public.message_attachments
FOR EACH ROW
EXECUTE FUNCTION sync_project_chat_attachments();
```

This will automatically create an `attachments` record for any file uploaded in a project chat room.

## Troubleshooting

### Error: "File size exceeds 10MB limit"
- **Cause**: File is larger than 10,485,760 bytes
- **Solution**: Compress or resize the file, or increase limit (requires migration change)

### Error: "Invalid file type"
- **Cause**: File MIME type not in allowed list
- **Solution**: Convert to supported format or add type to whitelist

### Error: "Failed to save attachment metadata"
- **Cause**: Database insert failed after blob upload (orphaned file)
- **Solution**: Implement blob cleanup in TODO section

### Error: "You can only delete your own attachments"
- **Cause**: User trying to delete attachment they don't own
- **Solution**: Only allow deletion of own messages

### Error: "Message not found"
- **Cause**: Message was deleted or user doesn't have access
- **Solution**: Verify message exists and user is in chat room

### Vercel Blob Issues
- **Missing Token**: Ensure `BLOB_READ_WRITE_TOKEN` is set
- **Upload Fails**: Check Vercel dashboard for storage quota
- **CORS Errors**: Vercel Blob handles CORS automatically for same domain

## Performance Considerations

### Batch Operations
Use `getMessagesAttachments()` instead of individual `getMessageAttachments()` calls:
```typescript
// ❌ Slow - N queries
for (const messageId of messageIds) {
  await getMessageAttachments(messageId);
}

// ✅ Fast - 1 query
const result = await getMessagesAttachments(messageIds);
```

### Caching
- Vercel Blob CDN caches files globally
- Browser caches file URLs automatically
- Consider implementing client-side cache for attachment metadata

### Lazy Loading
- Only fetch attachments when message is visible
- Use `IntersectionObserver` for infinite scroll
- Defer thumbnail generation until needed

## TODO Items

### High Priority
1. **Blob Cleanup on DB Failure**
   - If database insert fails, delete uploaded blob
   - Prevents orphaned files in storage

2. **Blob Deletion on Attachment Delete**
   - Currently only deletes DB record
   - Should also call `del()` from `@vercel/blob`

### Medium Priority
3. **Thumbnail Generation**
   - Currently uses original image URL
   - Implement server-side image resizing (e.g., Sharp)
   - Or use Vercel's image optimization

4. **File Type Icons**
   - Return appropriate icon for file type
   - PDF → 📄, DOC → 📝, XLS → 📊, ZIP → 📦

5. **Upload Progress**
   - Track upload progress for large files
   - Use `XMLHttpRequest.upload.onprogress`

### Low Priority
6. **Virus Scanning**
   - Integrate ClamAV or similar
   - Scan files before saving to blob

7. **File Preview**
   - Generate PDF previews (first page)
   - Video thumbnails
   - Document previews

## Testing

### Manual Testing Checklist
- [ ] Upload JPG image < 10MB
- [ ] Upload PNG image < 10MB
- [ ] Upload PDF document
- [ ] Upload DOCX document
- [ ] Upload XLSX spreadsheet
- [ ] Upload ZIP archive
- [ ] Reject file > 10MB
- [ ] Reject .exe file
- [ ] Reject .sh file
- [ ] View uploaded attachments
- [ ] Delete own attachment
- [ ] Cannot delete others' attachment
- [ ] Batch fetch attachments
- [ ] RLS enforces chat room access

### Unit Test Examples
```typescript
// TODO: Add tests to test suite
describe('uploadAttachment', () => {
  it('should reject files over 10MB', async () => {
    const largeFile = new File(['...'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 10485761 });

    const formData = new FormData();
    formData.append('messageId', 'uuid');
    formData.append('file', largeFile);

    const result = await uploadAttachment(formData);
    expect(result.error).toBe('File size exceeds 10MB limit');
  });

  it('should reject invalid file types', async () => {
    const exeFile = new File(['...'], 'malware.exe', { type: 'application/x-msdownload' });

    const formData = new FormData();
    formData.append('messageId', 'uuid');
    formData.append('file', exeFile);

    const result = await uploadAttachment(formData);
    expect(result.error).toContain('Invalid file type');
  });
});
```

## Related Files

- **Migration**: `/supabase/migrations/20251230_message_attachments.sql`
- **Server Actions**: `/app/actions/chat.ts`
- **Task Spec**: `/docs/specs/slack-chat-system/tasks/0009-file-photo-sharing.md`
- **Summary**: `/docs/specs/slack-chat-system/tasks/0009-implementation-summary.md`

## Next Steps

1. **Apply migration** (see Setup Instructions)
2. **Set up Vercel Blob** token
3. **Regenerate TypeScript types**
4. **Implement UI components**:
   - `FileUploader.tsx` - Drag-and-drop, file picker
   - `FilePreview.tsx` - Thumbnails, lightbox, download
   - Modify `MessageInput.tsx` - Add upload button
   - Modify `MessageItem.tsx` - Display attachments
5. **Test end-to-end**
6. **Address TODO items**

## Support

For issues or questions:
1. Check this README
2. Review implementation summary
3. Check Vercel Blob docs: https://vercel.com/docs/storage/vercel-blob
4. Review server action code in `/app/actions/chat.ts`
