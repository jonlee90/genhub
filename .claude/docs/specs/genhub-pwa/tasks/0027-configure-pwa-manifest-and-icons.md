# E4-T5: Configure PWA Manifest and Icons

**Epic**: Team & PWA (Week 7-8)
**Effort**: Small
**References**: Req 28 (PWA Installation), Design Section 2.4

## Description

Create PWA manifest file, generate app icons in required sizes, and add manifest links to the root layout.

## Subtasks

### 5.1 Create PWA manifest.json
- Create `public/manifest.json`
- Configure: name, short_name, start_url (/app), display (standalone)
- Set theme_color (#001b51) and background_color (#ffffff)
- Define icon sizes: 192x192, 512x512
- **Refs:** Req 28.1-28.3 (PWA Installation), Design Section 2.4
- **Effort:** S
- **Files:** `public/manifest.json`

### 5.2 Create PWA icons
- Create GenHub logo icons at required sizes
- Files: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`
- Ensure icons work on iOS, Android, and desktop
- **Refs:** Req 28.2 (App Icon), Design Section 2.4
- **Effort:** S
- **Files:** `public/icon-*.png`

### 5.3 Add manifest link to root layout
- Update `app/layout.tsx` to include manifest link
- Add apple-touch-icon link for iOS
- Add theme-color meta tag
- **Refs:** Req 28 (PWA Setup), Design Section 2.4
- **Effort:** S
- **Files:** `app/layout.tsx`

## Acceptance Criteria

- [ ] Manifest.json properly configured
- [ ] All required icon sizes created
- [ ] Icons display correctly on all platforms
- [ ] Manifest linked in root layout
- [ ] Theme color applied correctly
- [ ] App is installable on supported browsers

## Files to Create/Modify

- `public/manifest.json`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`
- `app/layout.tsx`
