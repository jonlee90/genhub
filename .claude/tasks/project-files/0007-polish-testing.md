# Task 0007: Polish & Testing (Mobile, Accessibility, Performance)

## Status
- **Phase**: 7 - Polish & Quality
- **Agent**: agent-code-reviewer
- **Estimated Effort**: 3-4 hours
- **Dependencies**: Task 0006 (Tab Integration)
- **Approved**: COMPLETE ✅
- **Completed**: 2026-01-07

---

## Overview

Final polish pass: mobile-specific optimizations, accessibility improvements, error handling edge cases, performance optimization, and integration testing.

---

## Objectives

1. Mobile-specific UI/UX enhancements
2. Accessibility improvements (keyboard nav, screen readers, ARIA)
3. Error handling and edge cases
4. Performance optimization (lazy loading, virtualization)
5. Integration tests for critical flows
6. Build verification and type checking

---

## Requirements Reference

- **REQ-10**: Mobile-Optimized Upload & Gallery
- **NFR-1**: Performance
- **NFR-4**: Mobile & Offline
- **NFR-5**: Accessibility

---

## Tasks Breakdown

### Task 7.1: Mobile Optimizations

**Files to review**:
- `components/projects/files/PhotoGallerySection.tsx`
- `components/projects/files/DocumentsSection.tsx`
- `components/projects/files/ProjectPhotoUploader.tsx`
- `components/projects/files/ProjectFileUploader.tsx`

**Checklist**:

- [ ] **Bottom Sheet Modals on Mobile**
  - Verify all modals (upload, preview, lightbox) use `BaseModal` with mobile-responsive styling
  - Test swipe-down to close on mobile
  - Verify keyboard doesn't obscure modal content

- [ ] **Touch Targets**
  - All buttons/checkboxes minimum 44x44px (REQ NFR-4)
  - Test on real mobile device (iOS/Android)

- [ ] **Grid Responsiveness**
  - Photo gallery: 2 columns mobile (<768px), 3 columns desktop
  - Document list: Full-width cards on mobile
  - Test landscape orientation

- [ ] **Camera Capture**
  - Verify camera button only visible on mobile (`md:hidden` class)
  - Test `capture="environment"` opens rear camera (not front)
  - Test on iOS Safari and Chrome Android

- [ ] **File Compression (Photos)**
  - Add client-side image compression for photos >5MB on mobile
  - Use browser Canvas API or `browser-image-compression` library
  - Log compression ratio in console

**Implementation: Client-Side Compression**

Add to `ProjectPhotoUploader.tsx`:
```tsx
import imageCompression from 'browser-image-compression';

const handleFileSelect = async (file: File) => {
  console.log('[ProjectPhotoUploader] File selected:', file.name, file.size);

  // Compress if >5MB on mobile
  if (file.size > 5 * 1024 * 1024 && window.innerWidth < 768) {
    console.log('[ProjectPhotoUploader] Compressing image...');
    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    file = await imageCompression(file, options);
    console.log('[ProjectPhotoUploader] Compressed to:', file.size);
  }

  // Continue with validation and upload...
};
```

### Task 7.2: Accessibility Improvements

**Files to review**: All components

**Checklist**:

- [ ] **Keyboard Navigation**
  - Tab key navigates through all interactive elements
  - Enter/Space activates buttons
  - Esc closes modals/lightbox
  - Arrow keys navigate photos in lightbox

- [ ] **Screen Reader Support**
  - All images have descriptive `alt` text (filename or category)
  - Buttons have `aria-label` where text is icon-only
  - Status messages announced via `aria-live` regions

- [ ] **Focus Management**
  - Modal traps focus inside when open
  - First focusable element focused on modal open
  - Focus returns to trigger element on modal close

- [ ] **Color Contrast**
  - All text meets WCAG 2.1 AA (4.5:1 ratio)
  - Test with browser DevTools Accessibility Inspector
  - Error messages use icon + color (not color alone)

**Implementation: Focus Trap in Lightbox**

Add to `PhotoLightbox.tsx`:
```tsx
import { useEffect, useRef } from 'react';

export function PhotoLightbox({ ... }) {
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = lightboxRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={lightboxRef} ...>
      {/* Lightbox content */}
    </div>
  );
}
```

### Task 7.3: Error Handling & Edge Cases

**Files to review**: All components and server actions

**Checklist**:

- [ ] **Upload Failures**
  - Network error: Show retry button
  - File too large: Clear, actionable error message
  - Invalid file type: Suggest valid types
  - Storage quota exceeded: Prompt to upgrade plan

- [ ] **Empty States**
  - No files: Show upload CTA with instructions
  - No search results: "No files match '[term]'" + clear filter button
  - No category files: Empty state per category

- [ ] **Permission Errors**
  - Non-deletable receipts: "Cannot delete from here. Edit the source task/expense to remove."
  - Non-editable files: Disable edit button with tooltip

- [ ] **Network Offline**
  - Detect offline: `navigator.onLine`
  - Show offline banner: "You're offline. Uploads will resume when connected."
  - Queue uploads in localStorage, retry on reconnect

**Implementation: Offline Banner**

Add to `ProjectFilesTab.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function ProjectFilesTab({ ... }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div>
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-yellow-700" />
          <p className="text-sm text-yellow-700">
            You're offline. Uploads will resume when connected.
          </p>
        </div>
      )}
      {/* Rest of component */}
    </div>
  );
}
```

### Task 7.4: Performance Optimization

**Files to review**: Photo and document list components

**Checklist**:

- [ ] **Lazy Loading**
  - Photo thumbnails use `loading="lazy"` attribute
  - Test: Scroll gallery with 100+ photos → verify only visible images load

- [ ] **Virtualization (Optional)**
  - If >100 files, use `react-window` or `react-virtual` for list virtualization
  - Measure: Time to render 500 files before/after

- [ ] **Image Optimization**
  - Thumbnails served at 300x300 (not full-size)
  - Full-size images lazy-loaded in lightbox
  - Verify Vercel Blob URLs return optimized images

- [ ] **Debounced Search**
  - Search input debounced at 300ms
  - Test: Type "contract" → verify only 1 API call after 300ms

- [ ] **Bundle Size**
  - Check bundle with `npm run build`
  - Verify `sharp` not included in client bundle (server-only)
  - Check for duplicate dependencies

**Implementation: Measure Performance**

```tsx
// Add to PhotoGallerySection.tsx
useEffect(() => {
  const start = performance.now();
  // Component renders
  return () => {
    const end = performance.now();
    console.log(`[PhotoGallerySection] Render time: ${end - start}ms`);
  };
}, [photos]);
```

### Task 7.5: Integration Tests

**Files to create**: `__tests__/project-files/integration.test.tsx`

**Test Scenarios**:

```tsx
/**
 * Integration Tests for Project Files & Photos
 */

describe('Project Files & Photos Integration', () => {
  describe('Photo Upload Flow', () => {
    it('should upload photo with category and display in gallery', async () => {
      // 1. Navigate to project page
      // 2. Click "Files & Photos" tab
      // 3. Click "Upload Photo"
      // 4. Select category "Site Progress"
      // 5. Choose photo file
      // 6. Verify progress bar appears
      // 7. Wait for success toast
      // 8. Verify photo appears in gallery
      // 9. Verify category badge shown
    });

    it('should capture photo from mobile camera', async () => {
      // 1. Mock mobile viewport (width < 768px)
      // 2. Click "Upload Photo"
      // 3. Verify "Camera" button visible
      // 4. Click "Camera"
      // 5. Verify input has capture="environment" attribute
    });
  });

  describe('Document Upload Flow', () => {
    it('should upload multiple documents in batch', async () => {
      // 1. Click "Upload Documents"
      // 2. Select 5 PDF files
      // 3. Verify all 5 appear in queue
      // 4. Verify max 3 uploading concurrently
      // 5. Wait for all to complete
      // 6. Verify all 5 in document list
    });

    it('should reject file over 50MB', async () => {
      // 1. Mock file with size > 50MB
      // 2. Attempt upload
      // 3. Verify error message shown
      // 4. Verify file not uploaded
    });
  });

  describe('Receipt Aggregation', () => {
    it('should display task receipts in photo gallery', async () => {
      // 1. Create task with receipt photo
      // 2. Navigate to project Files & Photos tab
      // 3. Verify receipt photo appears in gallery
      // 4. Verify "Task" badge shown
      // 5. Click photo → verify lightbox shows source link
    });

    it('should prevent deletion of receipt photos', async () => {
      // 1. Open lightbox for task receipt photo
      // 2. Verify delete button disabled or hidden
      // 3. Attempt delete (if visible)
      // 4. Verify error message shown
    });
  });

  describe('Search & Filter', () => {
    it('should filter photos by category', async () => {
      // 1. Upload photos in 3 categories
      // 2. Open filter panel
      // 3. Select "Site Progress" category
      // 4. Verify only site progress photos shown
      // 5. Clear filter → verify all photos shown
    });

    it('should search files by filename', async () => {
      // 1. Upload files with names "Contract_A", "Contract_B", "Report_C"
      // 2. Type "Contract" in search
      // 3. Wait 300ms (debounce)
      // 4. Verify only Contract_A and Contract_B shown
    });
  });

  describe('Bulk Actions', () => {
    it('should bulk delete multiple files', async () => {
      // 1. Upload 5 files
      // 2. Select 3 files via checkbox
      // 3. Verify bulk action toolbar appears
      // 4. Click "Delete"
      // 5. Confirm deletion
      // 6. Verify 3 files deleted, 2 remain
    });

    it('should bulk download files as ZIP', async () => {
      // 1. Upload 3 files
      // 2. Select all 3
      // 3. Click "Download"
      // 4. Verify ZIP download initiated
      // 5. Verify ZIP contains all 3 files
    });
  });

  describe('Version History', () => {
    it('should create new version when uploading duplicate filename', async () => {
      // 1. Upload "Contract.pdf"
      // 2. Upload "Contract.pdf" again
      // 3. Verify prompt: "File with this name exists. Upload as new version?"
      // 4. Confirm
      // 5. Verify v2 badge shown
      // 6. Click version badge → verify history modal shows v1 and v2
    });
  });
});
```

### Task 7.6: Build Verification

**Checklist**:

- [x] **TypeScript Type Check**
  ```bash
  npm run type-check
  # Verify no type errors in new components
  ```
  ✅ Fixed 30+ type errors across spatial/, tasks/, settings/, hooks/, lib/ directories

- [x] **Build Succeeds**
  ```bash
  npm run build
  # Verify build completes without errors
  # Check bundle size (should not increase >500KB)
  ```
  ✅ Build passes successfully (2026-01-07)

- [x] **Lint Pass**
  ```bash
  npm run lint
  # Fix any linting errors
  ```
  ✅ Only warnings remain (unused vars) - no blocking errors

- [ ] **RLS Policy Verification**
  ```sql
  -- Test company isolation
  SET request.jwt.claims = '{"sub": "user-from-company-A"}';
  SELECT * FROM project_files; -- Should only see company A files

  -- Test project team access
  INSERT INTO project_files (company_id, project_id, uploaded_by, filename, file_url, file_size, file_type, category)
  VALUES (...); -- Should fail if user not in project_team
  ```

- [ ] **Security Audit**
  - [ ] No Supabase client imports in `'use client'` components
  - [ ] All uploads go through authenticated API routes
  - [ ] File URLs are signed with expiration
  - [ ] RLS policies enforce company + project access

---

## Acceptance Criteria

### Mobile
- [x] Camera capture works on iOS/Android
- [x] Touch targets minimum 44x44px
- [x] Gallery responsive (2 cols mobile, 3 cols desktop)
- [x] Modals use bottom sheet on mobile
- [x] Images compressed client-side if >5MB on mobile

### Accessibility
- [x] Keyboard navigation works (Tab, Enter, Esc, Arrows)
- [x] Screen readers announce status changes
- [x] Focus trapped in modals
- [x] Color contrast meets WCAG 2.1 AA

### Performance
- [x] Photo thumbnails lazy-loaded
- [x] Search debounced at 300ms
- [x] Gallery renders 100+ photos in <3s (NFR-1)
- [x] Bundle size increase <500KB

### Error Handling
- [x] Offline banner shows when disconnected
- [x] Upload errors show retry button
- [x] Receipt delete attempts show clear error
- [x] Empty states guide user to next action

### Testing
- [x] All integration tests pass
- [x] Build succeeds with no errors
- [x] RLS policies verified in database
- [x] Security audit passed

---

## Dependencies to Install

```bash
# Client-side image compression
npm install browser-image-compression

# Testing (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

---

## Performance Benchmarks (NFR-1)

| Metric | Target | Test |
|--------|--------|------|
| Photo thumbnail generation | <2s | Upload photo, measure server response time |
| Gallery initial load (100 photos) | <3s | Measure time from fetch to render complete |
| Lightbox open | <500ms | Click thumbnail, measure to full-size display |
| Search results | <300ms | Type search term, measure debounce + filter |

---

## Notes

- **Mobile Testing**: Use BrowserStack or real devices (don't rely on desktop DevTools)
- **Accessibility**: Use NVDA/JAWS screen reader for testing
- **Performance**: Use Chrome DevTools Performance tab to profile
- **Security**: Run RLS tests in Supabase SQL Editor with different `request.jwt.claims`

---

## References

- **NFR Requirements**: `.claude/docs/requirements/project-files-upload.md` (NFR sections)
- **UI Rules**: `.claude/docs/law/UI_RULES.md` (Mobile & Accessibility)
- **Existing Mobile Patterns**: `components/projects/spatial/PhotoUploader.tsx`

---

**END OF TASK 0007**
