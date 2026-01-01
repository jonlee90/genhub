---
description: Use this when implement frontend related pages
globs: .tsx
---

Create detailed components with these requirements:

## CRITICAL: Standard Page Layout

**All `/app/*` pages MUST follow the established layout pattern from UI_RULES.md:**

1. **Blueprint Grid Background** - Fixed, 0.03 opacity, 40px grid
2. **Industrial Header** - h-1 construction-blue border + UPPERCASE font-black title
3. **Page Container** - `flex-1 space-y-4 md:space-y-6 p-4 md:p-8`
4. **Section Headers** - Use `SectionHeader` component pattern (icon + title + description)
5. **Card Styling** - `border-2 border-gray-200 shadow-construction`

**DO NOT use:** Riveted borders, diagonal hazard stripes, heavy gradient decorations, custom fonts (Work Sans, IBM Plex Mono)

## Component Requirements

1. MUST Use 'use client' directive for client-side components
2. Use Aceternity UI components and effects for modern UI patterns
3. Apply construction-themed design: Primary color #001B51 (blue), construction icons (hard hats, blueprints, tools), professional industrial aesthetic
4. MUST adding debugging log & comment for every single feature we implement
5. Make sure to concatenate strings correctly using backslash
6. Style with Tailwind CSS utility classes for responsive design with construction-themed color palette
7. Use Lucide React for icons (from lucide-react package) with construction context. Do NOT use other UI libraries unless requested
8. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
9. Don't update Aceternity UI base components unless otherwise specified
10. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
11. Create root layout.tsx page that wraps necessary navigation items to all pages
12. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
13. Accurately implement necessary grid layouts
14. Follow proper import practices:
    - Use @/ path aliases
    - Keep component imports organized
    - Update current src/app/page.tsx with new comprehensive code
    - Don't forget root route (page.tsx) handling
    - You MUST complete the entire prompt before stopping

## Reference Documentation

Before building UI, always check:
- **UI_RULES.md** → `.claude/docs/law/UI_RULES.md` for complete design system
- **Standard Page Layout** → Required patterns for all app pages
- **Section Header Pattern** → Reusable component for section headers
- **Standard Card Pattern** → Consistent card styling
