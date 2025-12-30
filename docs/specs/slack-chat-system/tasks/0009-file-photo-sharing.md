# Task 0009: File & Photo Sharing

## Phase
Phase 2: Rich Features

## Overview
Implement file and photo sharing with drag-and-drop upload, thumbnails, and project attachment sync.

## Subtasks

### 9.1 Create `message_attachments` table migration
- Add columns: message_id, file_name, file_url, file_type, file_size, thumbnail_url
- Add CHECK constraint for file_size <= 10MB (10485760 bytes)
- Add RLS policies for viewing attachments in participant rooms

### 9.2 Implement `uploadAttachment(formData)` server action
- Validate file size (max 10MB) and type (jpg, png, gif, webp, pdf, doc, docx, xls, xlsx, zip)
- Upload file to Vercel Blob storage
- Create message_attachments record with file metadata
- Optionally create attachments table record for project chat files

### 9.3 Create `components/chat/FileUploader.tsx` component
- Support file picker button and drag-and-drop
- Show upload progress indicator
- Allow cancellation of in-progress uploads
- Display error for files exceeding 10MB limit
- Support paste image from clipboard

### 9.4 Create `components/chat/FilePreview.tsx` component
- Display image thumbnails with lightbox on click
- Display file icon, name, and size for documents
- Download file with original filename on click
- Show grid layout for multiple attachments (max 4 visible, "+N more")

## Files to Create/Modify
- `supabase/migrations/YYYYMMDDHHMMSS_message_attachments.sql` (new)
- `app/actions/chat.ts` (add uploadAttachment)
- `components/chat/FileUploader.tsx` (new)
- `components/chat/FilePreview.tsx` (new)
- `components/chat/MessageInput.tsx` (modify for file upload)
- `components/chat/MessageItem.tsx` (modify for attachment display)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Users can upload files via button or drag-and-drop
- [ ] Images display as thumbnails with lightbox
- [ ] Documents show file icon and metadata
- [ ] Files over 10MB are rejected with error message
- [ ] Project chat attachments sync to project files

## References
- Requirements: Req 8.1-8.10
- Design: File Storage section
- Technical Constraints: File Storage (Vercel Blob)
