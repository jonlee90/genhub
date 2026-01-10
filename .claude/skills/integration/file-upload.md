# Skill: File Upload

> File upload patterns for GenHub using Supabase Storage

## When to Use

- Receipt uploads (expenses)
- Project photos
- IFC model files
- Document attachments
- Profile images

## Prerequisites

- Supabase Storage buckets configured
- Server Actions for upload handling
- Client components for UI

---

## Quick Reference

### Bucket Setup
```sql
-- Create storage bucket (run once via Supabase dashboard or migration)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('receipts', 'receipts', false),
  ('project-photos', 'project-photos', false),
  ('ifc-models', 'ifc-models', false),
  ('documents', 'documents', false),
  ('avatars', 'avatars', true);
```

### RLS for Storage
```sql
-- Allow authenticated users to upload to their company's folder
CREATE POLICY "company_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = (SELECT get_user_company_id(next_auth.uid()))::text
);

CREATE POLICY "company_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = (SELECT get_user_company_id(next_auth.uid()))::text
);
```

---

## Server Actions

### Upload File
```typescript
// app/actions/upload.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@/lib/auth'

export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string
): Promise<{ url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get company ID for folder isolation
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .single()

  if (!companyUser) return { error: 'Company not found' }

  // Generate unique filename
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = folder
    ? `${companyUser.company_id}/${folder}/${timestamp}-${sanitizedName}`
    : `${companyUser.company_id}/${timestamp}-${sanitizedName}`

  // Upload
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[uploadFile]', error)
    return { error: error.message }
  }

  // Get public URL (for public buckets) or signed URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return { url: urlData.publicUrl }
}
```

### Upload with Signed URL (Private Buckets)
```typescript
export async function uploadPrivateFile(
  bucket: string,
  file: File,
  folder: string
): Promise<{ url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .single()

  const timestamp = Date.now()
  const path = `${companyUser.company_id}/${folder}/${timestamp}-${file.name}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)

  if (error) return { error: error.message }

  // Create signed URL (expires in 1 hour)
  const { data: signedUrl } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 3600)

  return { url: signedUrl?.signedUrl }
}
```

### Get Signed URL
```typescript
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}
```

### Delete File
```typescript
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) return { error: error.message }
  return {}
}
```

---

## Client Components

### File Input Component
```tsx
'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/app/actions/upload'
import { toast } from 'sonner'

interface FileUploadProps {
  bucket: string
  folder?: string
  accept?: string
  maxSize?: number  // in MB
  onUpload: (url: string) => void
}

export function FileUpload({
  bucket,
  folder,
  accept = 'image/*',
  maxSize = 10,
  onUpload,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File must be less than ${maxSize}MB`)
      return
    }

    // Preview for images
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    }

    setIsUploading(true)
    const result = await uploadFile(bucket, file, folder)
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
      setPreview(null)
      return
    }

    if (result.url) {
      onUpload(result.url)
      toast.success('File uploaded')
    }
  }

  const handleClear = () => {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-32 rounded-lg" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#001B51] transition-colors"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Click to upload</p>
              <p className="text-xs text-gray-400">Max {maxSize}MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
```

### Multiple File Upload
```tsx
'use client'

interface MultiFileUploadProps {
  bucket: string
  folder?: string
  maxFiles?: number
  onUpload: (urls: string[]) => void
}

export function MultiFileUpload({
  bucket,
  folder,
  maxFiles = 5,
  onUpload,
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<Array<{ file: File; url?: string; uploading: boolean }>>([])

  const handleAdd = async (newFiles: FileList) => {
    const toAdd = Array.from(newFiles).slice(0, maxFiles - files.length)

    for (const file of toAdd) {
      setFiles(prev => [...prev, { file, uploading: true }])

      const result = await uploadFile(bucket, file, folder)

      setFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, url: result.url, uploading: false }
            : f
        )
      )
    }

    // Notify parent of all URLs
    const urls = files.filter(f => f.url).map(f => f.url!)
    onUpload(urls)
  }

  return (
    <div className="space-y-2">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          {f.uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
          <span className="text-sm">{f.file.name}</span>
        </div>
      ))}

      {files.length < maxFiles && (
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleAdd(e.target.files)}
        />
      )}
    </div>
  )
}
```

---

## Receipt Upload with OCR

```typescript
// Upload receipt and extract data
export async function uploadReceiptWithOCR(
  file: File,
  expenseId: string
): Promise<{ url?: string; extractedData?: any; error?: string }> {
  // Upload file
  const uploadResult = await uploadFile('receipts', file, 'expenses')
  if (uploadResult.error) return uploadResult

  // Call AI to extract data (using AI SDK)
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      vendor: z.string().optional(),
      total: z.number().optional(),
      date: z.string().optional(),
      items: z.array(z.object({
        name: z.string(),
        price: z.number(),
      })).optional(),
    }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract receipt information:' },
          { type: 'image', image: await file.arrayBuffer() },
        ],
      },
    ],
  })

  // Update expense with extracted data
  const supabase = await createClient()
  await supabase
    .from('expenses')
    .update({
      receipt_url: uploadResult.url,
      amount: object.total,
      description: `${object.vendor} - ${object.date}`,
    })
    .eq('id', expenseId)

  return { url: uploadResult.url, extractedData: object }
}
```

---

## Anti-Patterns

```typescript
// WRONG: Upload in client component
'use client'
const supabase = createClient()
await supabase.storage.from('bucket').upload(...)  // Exposes credentials!

// CORRECT: Use Server Action
const result = await uploadFile('bucket', file)

// WRONG: No file validation
await uploadFile(bucket, anyFile)

// CORRECT: Validate type and size
if (!['image/jpeg', 'image/png'].includes(file.type)) {
  return { error: 'Invalid file type' }
}
if (file.size > 10 * 1024 * 1024) {
  return { error: 'File too large' }
}

// WRONG: Using public bucket for sensitive files
// receipts, documents should be private

// CORRECT: Use signed URLs for private access
```

---

## Checklist

- [ ] Bucket created with appropriate access (public/private)
- [ ] RLS policies for storage
- [ ] Company folder isolation
- [ ] File type validation
- [ ] File size validation
- [ ] Unique filenames (prevent overwrites)
- [ ] Error handling and feedback
- [ ] Loading states in UI
- [ ] Signed URLs for private files
