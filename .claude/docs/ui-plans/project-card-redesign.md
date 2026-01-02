# ProjectCard Component UI/UX Redesign Plan - V2 (Hero Image Design)

> **Updated**: 2024-12-30 - New design based on reference image with hero image and colored headers

## Overview
Complete redesign of the ProjectCard component featuring:
- **Colored header** with project type name and icon (color varies by project type)
- **Hero image** showing the actual project site (auto-fetched from address)
- **Clean stats layout** with client info, budget, progress, and team data
- **Automatic image acquisition** from Google Street View → Mapillary → Placeholder

---

## 1. Visual Design Analysis (From Reference Image)

### Card Structure (Top to Bottom)
```
┌─────────────────────────────────────────┐
│  [COLORED HEADER - varies by type]      │
│  PROJECT TYPE          [TYPE ICON]      │
│  Project Name                           │
├─────────────────────────────────────────┤
│                                         │
│           [HERO IMAGE]                  │
│    (Street View / Mapillary / Placeholder) │
│                                         │
├─────────────────────────────────────────┤
│  Client                      Budget     │
│  {client_name}              ${amount}   │
├─────────────────────────────────────────┤
│  Status     Progress    Schedule        │
│  {status}   {xx%}       {x days}        │
│                                         │
│  Members                  Health        │
│  {count}                  {score}%      │
├─────────────────────────────────────────┤
│  Project ID: #{id}       ${actual_cost} │
└─────────────────────────────────────────┘
```

### Color Themes by Project Type
| Project Type | Header BG | Header Text | Icon BG | Accent |
|--------------|-----------|-------------|---------|--------|
| `residential` | `#001B51` (Navy) | White | White/10 | Blue-200 |
| `industrial` | `#3C3C3C` (Dark Gray) | White | Yellow/20 | Yellow-400 + Hazard Border |
| `restaurant_cafe` | `#0D7377` (Teal) | White | White/10 | Teal-200 |
| `commercial_office` | `#1A1A2E` (Dark Navy) | White | Cyan/20 | Cyan-400 (Tech aesthetic) |

---

## 2. Database Schema Changes Required

### Add `image_url` column to projects table
```sql
-- Migration: add_project_image_columns
ALTER TABLE public.projects
ADD COLUMN image_url text,
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric;

COMMENT ON COLUMN public.projects.image_url IS 'Project site image URL (from Street View, Mapillary, or placeholder)';
COMMENT ON COLUMN public.projects.latitude IS 'Geocoded latitude for project address';
COMMENT ON COLUMN public.projects.longitude IS 'Geocoded longitude for project address';
```

---

## 3. Automatic Image Acquisition Flow

### Flow Diagram
```
[User enters address]
        ↓
[Geocode address → lat/lng]
        ↓
[Try Google Street View Static API]
        ↓ (if fails or no imagery available)
[Try Mapillary API]
        ↓ (if fails)
[Use placeholder image based on project_type]
        ↓
[Save image_url in project record]
```

### Implementation: Server Action
Create `app/actions/project-image.ts`:
```typescript
'use server';

import { createClient } from '@/utils/supabase/server';

interface GeocodingResult {
  lat: number;
  lng: number;
}

// Placeholder images by project type
const PLACEHOLDER_IMAGES: Record<string, string> = {
  residential: '/images/placeholders/residential.jpg',
  industrial: '/images/placeholders/industrial.jpg',
  restaurant_cafe: '/images/placeholders/restaurant.jpg',
  commercial_office: '/images/placeholders/commercial.jpg',
};

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[geocodeAddress] GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error('[geocodeAddress] Error:', error);
    return null;
  }
}

/**
 * Get Google Street View image URL
 */
async function getStreetViewImage(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  // Check if Street View imagery exists at this location
  const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await fetch(metadataUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      // Return the static image URL
      return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=90&key=${apiKey}`;
    }
    return null;
  } catch (error) {
    console.error('[getStreetViewImage] Error:', error);
    return null;
  }
}

/**
 * Get Mapillary image URL as fallback
 */
async function getMapillaryImage(lat: number, lng: number): Promise<string | null> {
  const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;
  if (!accessToken) return null;

  try {
    // Search for images near the location
    const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,thumb_1024_url&bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0].thumb_1024_url;
    }
    return null;
  } catch (error) {
    console.error('[getMapillaryImage] Error:', error);
    return null;
  }
}

/**
 * Fetch and save project image based on address
 */
export async function fetchProjectImage(
  projectId: string,
  address: string,
  projectType: string
): Promise<{ success: boolean; imageUrl: string }> {
  const supabase = await createClient();
  let imageUrl = PLACEHOLDER_IMAGES[projectType] || PLACEHOLDER_IMAGES.residential;
  let latitude: number | null = null;
  let longitude: number | null = null;

  // 1. Geocode address
  const coords = await geocodeAddress(address);

  if (coords) {
    latitude = coords.lat;
    longitude = coords.lng;

    // 2. Try Google Street View
    const streetViewUrl = await getStreetViewImage(coords.lat, coords.lng);
    if (streetViewUrl) {
      imageUrl = streetViewUrl;
    } else {
      // 3. Try Mapillary
      const mapillaryUrl = await getMapillaryImage(coords.lat, coords.lng);
      if (mapillaryUrl) {
        imageUrl = mapillaryUrl;
      }
    }
  }

  // 4. Update project with image URL and coordinates
  const { error } = await supabase
    .from('projects')
    .update({
      image_url: imageUrl,
      latitude,
      longitude,
    })
    .eq('id', projectId);

  if (error) {
    console.error('[fetchProjectImage] Error updating project:', error);
    return { success: false, imageUrl };
  }

  return { success: true, imageUrl };
}
```

### Environment Variables Required
```env
# Google Maps APIs (for Geocoding & Street View)
GOOGLE_MAPS_API_KEY=your_key_here

# Mapillary (optional fallback)
MAPILLARY_ACCESS_TOKEN=your_token_here
```

### Next.js Image Configuration
```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/streetview/**',
      },
      {
        protocol: 'https',
        hostname: 'images.mapillary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.mapillary.com',
        pathname: '/**',
      },
    ],
  },
};
```

---

## 4. Component Architecture

### Project Type Theme System
```typescript
// lib/project-card-themes.ts

import { Home, Factory, UtensilsCrossed, Building2 } from 'lucide-react';

export const PROJECT_TYPE_THEMES = {
  residential: {
    icon: Home,
    label: 'Residential',
    labelFull: 'Residential Home',
    headerBg: 'bg-construction-blue',
    headerText: 'text-white',
    iconBg: 'bg-white/10',
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-construction-blue',
  },
  industrial: {
    icon: Factory,
    label: 'Industrial',
    labelFull: 'Industrial Warehouse',
    headerBg: 'bg-construction-accent',
    headerText: 'text-white',
    iconBg: 'bg-yellow-400/20',
    accentColor: 'text-yellow-400',
    borderAccent: 'border-t-construction-accent',
    hasHazardBorder: true, // Special caution stripe decoration
  },
  restaurant_cafe: {
    icon: UtensilsCrossed,
    label: 'Cafe',
    labelFull: 'Cafe Renovation',
    headerBg: 'bg-teal-600',
    headerText: 'text-white',
    iconBg: 'bg-white/10',
    accentColor: 'text-teal-200',
    borderAccent: 'border-t-teal-600',
  },
  commercial_office: {
    icon: Building2,
    label: 'Commercial',
    labelFull: 'Commercial Office',
    headerBg: 'bg-slate-800',
    headerText: 'text-white',
    iconBg: 'bg-cyan-400/20',
    accentColor: 'text-cyan-400',
    borderAccent: 'border-t-slate-800',
  },
} as const;
```

### Placeholder Images
Create placeholder images for each project type:
```
public/images/placeholders/
├── residential.jpg      # Modern house exterior
├── industrial.jpg       # Warehouse/factory
├── restaurant.jpg       # Restaurant interior/exterior
├── commercial.jpg       # Office building
└── default.jpg          # Generic construction site
```

### Component Structure
```tsx
// components/projects/ProjectCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatBudget } from '@/lib/utils';
import { PROJECT_TYPE_THEMES } from '@/lib/project-card-themes';
import type { ProjectWithStats } from '@/app/actions/projects';

interface ProjectCardProps {
  project: ProjectWithStats;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const theme = PROJECT_TYPE_THEMES[project.project_type];
  const TypeIcon = theme.icon;
  const completionPercentage = project.completion_percentage || 0;

  // Image source with fallback
  const imageUrl = project.image_url || `/images/placeholders/${project.project_type}.jpg`;

  return (
    <Link href={`/app/projects/${project.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group rounded-lg overflow-hidden shadow-construction hover:shadow-construction-lg transition-all duration-300 bg-white"
      >
        {/* Header Section - Colored by project type */}
        <div className={cn("px-4 py-3", theme.headerBg, theme.headerText)}>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className={cn("text-xs font-bold uppercase tracking-wider", theme.accentColor)}>
                {theme.labelFull}
              </p>
              <h3 className="text-lg font-bold line-clamp-1">
                {project.name}
              </h3>
            </div>
            <div className={cn("p-2 rounded-lg", theme.iconBg)}>
              <TypeIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Industrial Hazard Border (conditional) */}
        {theme.hasHazardBorder && (
          <div className="h-2 bg-[repeating-linear-gradient(45deg,#FBBF24,#FBBF24_10px,#1A1A2E_10px,#1A1A2E_20px)]" />
        )}

        {/* Hero Image */}
        <div className="relative h-40 bg-gray-100">
          <Image
            src={imageUrl}
            alt={project.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Client & Budget Row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Client</p>
              <p className="font-semibold text-gray-900 line-clamp-1">{project.client_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Budget</p>
              <p className="font-bold text-construction-blue">{formatBudget(project.budget)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Status</p>
              <p className="text-sm font-semibold text-gray-900">
                {project.status === 'active' ? 'Active' : project.status}
              </p>
            </div>
            {/* Progress */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Progress</p>
              <p className="text-sm font-bold text-construction-blue">{completionPercentage}%</p>
            </div>
            {/* Schedule */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Schedule</p>
              <p className="text-sm font-semibold text-gray-900">
                {project.stats?.schedule.daysRemaining || 0}d left
              </p>
            </div>
            {/* Members */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Members</p>
              <p className="text-sm font-semibold text-gray-900">
                {project.stats?.teamSize || 0}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Footer - Project ID & Actual Cost */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Project ID: #{project.id.slice(0, 8)}
            </span>
            <span className="font-bold text-construction-blue">
              {formatBudget(project.stats?.actualSpent || 0)}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
```

---

## 5. Implementation Tasks

### Phase 1: Database (backend-engineer)
- [ ] Create migration to add `image_url`, `latitude`, `longitude` columns
- [ ] Apply migration using MCP Supabase
- [ ] Regenerate TypeScript types

### Phase 2: Image Service (backend-engineer)
- [ ] Create `app/actions/project-image.ts` with:
  - [ ] `geocodeAddress()` function
  - [ ] `getStreetViewImage()` function
  - [ ] `getMapillaryImage()` function
  - [ ] `fetchProjectImage()` server action
- [ ] Update `createProject()` to call `fetchProjectImage()` after insert
- [ ] Add placeholder images to `public/images/placeholders/`
- [ ] Update `next.config.ts` for external image domains

### Phase 3: UI Redesign (frontend-builder with frontend-design plugin)
- [ ] Create `lib/project-card-themes.ts` theme system
- [ ] Redesign `ProjectCard.tsx`:
  - [ ] Colored header section with project type
  - [ ] Hero image with Next.js Image component
  - [ ] Client/Budget row
  - [ ] 2x2 stats grid
  - [ ] Footer with project ID and actual cost
  - [ ] Industrial hazard border variant
- [ ] Keep existing 3D tilt effect (optional)
- [ ] Ensure mobile responsiveness
- [ ] Add hover animations

### Phase 4: Testing & Polish
- [ ] Test with projects that have/don't have images
- [ ] Test placeholder fallback
- [ ] Verify responsive layouts on mobile/tablet/desktop
- [ ] Optimize image loading performance

---

## 6. Questions for User Approval

1. **API Keys**: Do you have Google Maps API key configured? (Required for geocoding & Street View)

2. **Image Storage**: Should we:
   - **Option A**: Store external URLs directly (faster, no storage cost, depends on external service)
   - **Option B**: Download and store in Supabase Storage (more reliable, has storage cost)

3. **Industrial Hazard Border**: The reference shows a yellow/black caution stripe for industrial projects. Should we implement this?

4. **Existing 3D Tilt**: Keep or remove the existing 3D tilt hover effect?

5. **Placeholder Images**: Should I source/create construction-themed placeholder images, or will you provide them?

---

## 7. Risk Considerations

| Risk | Mitigation |
|------|------------|
| Google Street View API costs | Cache images in Supabase Storage; limit API calls |
| Coverage gaps (no imagery) | Fallback chain: Street View → Mapillary → Placeholder |
| API rate limits | Implement retry logic with exponential backoff |
| Privacy (blurred images) | Accept as-is; can manually replace |
| Slow image loading | Use Next.js Image with blur placeholder |

---

## Ready for Approval

**Changes Summary**:
1. Add 3 new DB columns: `image_url`, `latitude`, `longitude`
2. Create automatic image acquisition service
3. Complete visual redesign with hero image and colored headers
4. Support 4 project type themes with distinct colors

**Approval Checklist**:
- [ ] Database schema changes approved
- [ ] Image acquisition flow approved
- [ ] Color theme system approved
- [ ] UI layout approved
- [ ] API key setup confirmed (or will use placeholders only)

## Current Implementation Analysis

### What Exists Now (components/projects/ProjectCard.tsx)
- ✅ 3D tilt effect (Aceternity UI style)
- ✅ Project type icon with color coding
- ✅ Status badge (active, on_hold, completed, archived)
- ✅ Health score with circular progress (0-100)
- ✅ Completion percentage with progress bar
- ✅ Budget display
- ✅ Team member count
- ✅ Client name
- ✅ Start date
- ✅ Current phase indicator
- ✅ Construction-themed colors and icons
- ✅ Animated gradient top border
- ✅ Hover animations

### Strengths
- Clean, professional design
- Good use of construction theme colors
- Health score is prominently displayed
- Nice micro-interactions
- Mobile-responsive

### Opportunities for Enhancement
1. **Budget variance not shown** - Only shows total budget, not actual vs planned
2. **No recent activity** - Can't see what happened recently
3. **No schedule status** - Missing days remaining or behind/ahead indicator
4. **No risk indicators** - Blocked tasks, overdue items not visible
5. **Phase progress** - Only shows which phase, not phase completion
6. **No material/expense status** - Missing procurement insights
7. **Limited team info** - Only shows count, not key roles
8. **No quick actions** - Can't perform actions from card

## Enhanced Information Hierarchy

### Priority 1 (Must See First)
1. **Project Name** - Clear, large
2. **Health Score** - Visual ring with color coding
3. **Status Badge** - Active, on hold, completed
4. **Client Name** - Secondary to project name

### Priority 2 (Critical Metrics)
5. **Budget Performance** - Planned vs Actual with variance indicator
6. **Schedule Status** - Days remaining, on-time/delayed indicator
7. **Overall Progress** - % complete with visual progress bar
8. **Current Phase** - Which phase + phase progress

### Priority 3 (Supporting Information)
9. **Task Summary** - Total, completed, blocked, overdue counts
10. **Team Info** - Count + key roles (PM, Foreman)
11. **Recent Activity** - Last update timestamp or recent change
12. **Quick Metrics** - Materials needed, pending expenses

### Priority 4 (Optional/Hover)
13. **Project Type** - Icon/badge
14. **Start/End Dates** - Timeline
15. **Quick Actions** - Edit, archive, settings (on hover)

## Proposed Layout Design

### Card Structure (Vertical Layout)
```
┌─────────────────────────────────────────────────────────┐
│ [Animated Gradient Top Border - Project Type Color]     │
├─────────────────────────────────────────────────────────┤
│ HEADER (flex row)                                        │
│ [Type Icon] Project Name              [Status Badge]    │
│             Client Name                                  │
├─────────────────────────────────────────────────────────┤
│ HERO METRIC (centered, large)                           │
│ [Health Score Ring - 80pt diameter]                     │
│   80  SCORE                                              │
│   "On Track" label with icon                            │
├─────────────────────────────────────────────────────────┤
│ PROGRESS BAR (full width)                               │
│ "Overall Progress" label    65%                         │
│ [████████████░░░░░░░░░] with gradient                   │
│ Phase 3 of 5: Construction                              │
├─────────────────────────────────────────────────────────┤
│ TWO-COLUMN METRICS (grid 2 cols)                        │
│ ┌─────────────────┬─────────────────┐                  │
│ │ BUDGET          │ SCHEDULE        │                  │
│ │ Planned: $250K  │ 45 days left    │                  │
│ │ Actual:  $220K  │ ⚠ 3 days behind │                  │
│ │ ✓ Under $30K    │                 │                  │
│ └─────────────────┴─────────────────┘                  │
├─────────────────────────────────────────────────────────┤
│ TASKS SUMMARY (4-column grid - icon badges)            │
│ [✓ 24 Done] [⚠ 3 Blocked] [⏰ 2 Overdue] [📦 5 Todo]  │
├─────────────────────────────────────────────────────────┤
│ FOOTER (flex row, space-between)                        │
│ [👤 Team: 8] [🏗️ Materials: 3 needed]  [Updated: 2h]  │
│ [Quick Action Dots ... on hover]                        │
└─────────────────────────────────────────────────────────┘
```

### Responsive Considerations
- **Mobile (< 640px)**: Stack all sections vertically, reduce health ring to 60pt
- **Tablet (640-1024px)**: 2-column grid for cards
- **Desktop (> 1024px)**: 3-column grid, full card features

## Detailed Component Breakdown

### 1. Header Section
```tsx
<div className="flex items-start justify-between gap-3">
  {/* Left: Type Icon + Names */}
  <div className="flex items-start gap-3 flex-1 min-w-0">
    <motion.div className="p-2.5 rounded-xl border-2 [type-colors]">
      <TypeIcon className="h-6 w-6" />
    </motion.div>
    <div>
      <h3 className="font-bold text-lg line-clamp-1">{project.name}</h3>
      <p className="text-sm text-muted-foreground">{project.client_name}</p>
    </div>
  </div>

  {/* Right: Status Badge */}
  <Badge variant="secondary" className={statusConfig.color}>
    <StatusIcon />
    {statusConfig.label}
  </Badge>
</div>
```

### 2. Health Score Hero (Enhanced)
```tsx
<div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50">
  {/* Circular Progress Ring (existing, keep as-is) */}
  <div className="relative w-20 h-20">
    <svg>...</svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-2xl font-black">{healthScore}</span>
      <span className="text-[10px]">SCORE</span>
    </div>
  </div>

  {/* Health Info */}
  <div className="flex-1">
    <p className="text-xs font-semibold uppercase">Project Health</p>
    <div className="flex items-center gap-2">
      <Badge className={healthColors}>
        {getHealthScoreIcon(healthScore)}
        {healthColors.label}
      </Badge>
    </div>
    {/* NEW: Risk Indicators */}
    {hasRisks && (
      <div className="flex items-center gap-1 mt-1">
        <AlertTriangle className="h-3 w-3 text-construction-yellow" />
        <span className="text-xs text-construction-yellow">
          {blockedTasks} blocked, {overdueTasks} overdue
        </span>
      </div>
    )}
  </div>
</div>
```

### 3. Progress Section (Enhanced)
```tsx
<div className="space-y-2">
  {/* Progress Bar */}
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Overall Progress</span>
    <span className="text-sm font-bold">{completionPercentage}%</span>
  </div>
  <Progress value={completionPercentage} className="h-2.5" />

  {/* NEW: Phase Info with Phase Progress */}
  {currentPhase && (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-construction-blue" />
        Phase {currentPhaseIndex + 1} of {totalPhases}: {currentPhase.name}
      </span>
      <span className="font-semibold text-construction-blue">
        {currentPhase.completion_percentage}%
      </span>
    </div>
  )}
</div>
```

### 4. NEW: Budget & Schedule Grid
```tsx
<div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
  {/* Budget Column */}
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <DollarSign className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-bold uppercase text-gray-600">Budget</span>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Planned:</span>
        <span className="font-bold">${plannedBudget}K</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Actual:</span>
        <span className="font-bold">${actualSpent}K</span>
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold pt-1",
        isUnderBudget ? "text-construction-green" : "text-construction-red"
      )}>
        {isUnderBudget ? (
          <><TrendingDown className="h-3 w-3" /> Under ${variance}K</>
        ) : (
          <><TrendingUp className="h-3 w-3" /> Over ${variance}K</>
        )}
      </div>
    </div>
  </div>

  {/* Schedule Column */}
  <div className="border-l-2 border-gray-200 pl-3">
    <div className="flex items-center gap-1.5 mb-2">
      <Calendar className="h-4 w-4 text-construction-accent" />
      <span className="text-xs font-bold uppercase text-gray-600">Schedule</span>
    </div>
    <div className="space-y-1">
      {/* Days Remaining */}
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Remaining:</span>
        <span className="font-bold">{daysRemaining} days</span>
      </div>
      {/* Status Indicator */}
      <div className={cn(
        "flex items-center gap-1 text-xs font-bold pt-2",
        scheduleStatus === 'on-time' && "text-construction-green",
        scheduleStatus === 'at-risk' && "text-construction-yellow",
        scheduleStatus === 'delayed' && "text-construction-red"
      )}>
        {scheduleStatus === 'on-time' && (
          <><CheckCircle2 className="h-3 w-3" /> On Track</>
        )}
        {scheduleStatus === 'at-risk' && (
          <><AlertCircle className="h-3 w-3" /> At Risk</>
        )}
        {scheduleStatus === 'delayed' && (
          <><Clock className="h-3 w-3" /> {daysBehind} days behind</>
        )}
      </div>
    </div>
  </div>
</div>
```

### 5. NEW: Task Summary Badges
```tsx
<div className="flex flex-wrap gap-2">
  {/* Completed Tasks */}
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-construction-green/10 border border-construction-green/20"
  >
    <CheckCircle2 className="h-3.5 w-3.5 text-construction-green" />
    <span className="text-xs font-bold text-construction-green">
      {completedTasks} Done
    </span>
  </motion.div>

  {/* Blocked Tasks (only show if > 0) */}
  {blockedTasks > 0 && (
    <motion.div className="... bg-construction-yellow/10 ...">
      <AlertTriangle className="... text-construction-yellow" />
      <span className="... text-construction-yellow">{blockedTasks} Blocked</span>
    </motion.div>
  )}

  {/* Overdue Tasks */}
  {overdueTasks > 0 && (
    <motion.div className="... bg-construction-red/10 ...">
      <Clock className="... text-construction-red" />
      <span className="... text-construction-red">{overdueTasks} Overdue</span>
    </motion.div>
  )}

  {/* Todo Tasks */}
  <motion.div className="... bg-gray-100 ...">
    <Package className="... text-gray-600" />
    <span className="... text-gray-600">{todoTasks} Todo</span>
  </motion.div>
</div>
```

### 6. Enhanced Footer
```tsx
<div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
  {/* Left: Team & Materials */}
  <div className="flex items-center gap-3 text-xs">
    <div className="flex items-center gap-1.5">
      <Users className="h-3.5 w-3.5 text-gray-500" />
      <span className="font-semibold text-gray-700">
        {teamSize} team
      </span>
    </div>

    {/* NEW: Materials Status */}
    {materialsNeeded > 0 && (
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-construction-yellow" />
        <span className="font-semibold text-construction-yellow">
          {materialsNeeded} needed
        </span>
      </div>
    )}
  </div>

  {/* Right: Last Updated + Quick Actions (on hover) */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500">
      Updated {formatDistanceToNow(project.updated_at)}
    </span>

    {/* Quick Actions (show on hover) */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileHover={{ opacity: 1, scale: 1 }}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-construction-red">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  </div>
</div>
```

## Data Requirements

### Current Data (from DB schema)
- `project.name` ✅
- `project.client_name` ✅
- `project.project_type` ✅
- `project.status` ✅
- `project.health_score` ✅
- `project.completion_percentage` ✅
- `project.budget` ✅
- `project.start_date` ✅
- `project.end_date` ✅
- `project.updated_at` ✅
- `project.project_phases` ✅
- `project.project_team` (count) ✅

### NEW Data Needed
1. **Actual Spending** - Sum of approved expenses + material costs
   - Query: `SUM(tasks.actual_cost) WHERE project_id = ?`
   - Already available via task aggregation

2. **Task Summary Counts**
   - Total tasks: `COUNT(*) FROM tasks WHERE project_id = ?`
   - Completed: `COUNT(*) WHERE status = 'completed'`
   - Blocked: `COUNT(*) WHERE status = 'blocked'`
   - Overdue: `COUNT(*) WHERE due_date < NOW() AND status != 'completed'`
   - Todo: `COUNT(*) WHERE status = 'todo'`

3. **Schedule Status**
   - Days remaining: `DATEDIFF(end_date, NOW())`
   - Schedule variance: Compare health_score + phase progress
   - Days behind/ahead: Calculate from expected vs actual progress

4. **Materials Status**
   - Materials needed: `COUNT(*) FROM material_assignments WHERE procurement_status = 'needed' AND project_id = ?`
   - Materials ordered: `COUNT(*) WHERE procurement_status = 'ordered'`

5. **Current Phase Info**
   - Phase name ✅ (already in project_phases)
   - Phase completion % ✅ (already in project_phases)
   - Phase index (order_index) ✅

### Suggested Server Action Enhancement
```typescript
// app/actions/projects.ts
export async function getProjectsWithStats(companyId: string) {
  // Current query gets basic project data
  // ENHANCE to include:
  return {
    ...project,
    stats: {
      actualSpent: number,
      taskCounts: {
        total: number,
        completed: number,
        blocked: number,
        overdue: number,
        todo: number,
      },
      schedule: {
        daysRemaining: number,
        scheduleStatus: 'on-time' | 'at-risk' | 'delayed',
        daysBehind: number,
      },
      materials: {
        needed: number,
        ordered: number,
        delivered: number,
      },
    },
  };
}
```

## Animation & Micro-interactions

### Existing (Keep)
- ✅ 3D tilt effect on mouse move
- ✅ Scale on hover (1.02)
- ✅ Animated gradient top border
- ✅ Circular health score animation
- ✅ Shadow transitions

### NEW Additions
1. **Staggered Badge Animations** - Task summary badges fade in with delay
2. **Budget/Schedule Pulse** - Pulse animation on warning states
3. **Quick Actions Slide-in** - Slide from right on hover
4. **Risk Indicator Blink** - Subtle blink on critical issues
5. **Progress Bar Fill** - Animate from 0 to value on mount

```tsx
// Staggered badge animation
{taskSummary.map((badge, index) => (
  <motion.div
    key={badge.type}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    {badge}
  </motion.div>
))}

// Warning pulse
<motion.div
  animate={isOverBudget ? {
    scale: [1, 1.05, 1],
    backgroundColor: ['rgba(220, 38, 38, 0.1)', 'rgba(220, 38, 38, 0.2)', 'rgba(220, 38, 38, 0.1)']
  } : {}}
  transition={{ repeat: Infinity, duration: 2 }}
>
```

## Color Coding Strategy

### Health Score
- 80-100: Green (#059669) - "On Track"
- 50-79: Dark Gray (#3C3C3C) - "At Risk"
- 0-49: Red (#DC2626) - "Delayed"

### Budget Status
- Under Budget: Green (#059669)
- On Budget (±5%): Navy Blue (#001B51)
- Over Budget: Red (#DC2626)

### Schedule Status
- On Time: Green (#059669)
- At Risk (1-5 days behind): Yellow (#FBBF24)
- Delayed (>5 days behind): Red (#DC2626)

### Task Status Badges
- Completed: Green background
- Blocked: Yellow background
- Overdue: Red background
- Todo: Gray background

## Responsive Design

### Mobile (< 640px)
- Stack all sections vertically
- Health ring: 60pt diameter
- Budget/Schedule: Stack vertically (not 2-column grid)
- Task badges: 2-row wrap
- Hide quick actions menu (show in detail view)

### Tablet (640-1024px)
- 2-column card grid
- Health ring: 70pt diameter
- Budget/Schedule: Side-by-side
- All features visible

### Desktop (> 1024px)
- 3-column card grid
- Health ring: 80pt diameter
- All features + hover states
- Quick actions visible on hover

## Accessibility Considerations

1. **Semantic HTML** - Use proper heading hierarchy
2. **ARIA Labels** - Label all icons and interactive elements
3. **Color Contrast** - Ensure WCAG AA compliance
4. **Keyboard Navigation** - Tab through all interactive elements
5. **Screen Reader Text** - Hidden labels for icon-only elements
6. **Focus Indicators** - Clear focus states

```tsx
<Badge aria-label={`Project status: ${status}`}>
  <StatusIcon aria-hidden="true" />
  <span>{statusLabel}</span>
</Badge>

<Progress
  value={completionPercentage}
  aria-label={`Project completion: ${completionPercentage}%`}
/>
```

## Performance Optimizations

1. **Memo-ize Calculations** - Use `useMemo` for derived stats
2. **Lazy Load Icons** - Dynamic import for rarely-used icons
3. **Optimize Animations** - Use CSS transforms instead of layout properties
4. **Image Optimization** - Use Next.js Image for type icons if using images
5. **Avoid Re-renders** - React.memo for child components

```tsx
const taskStats = useMemo(() => ({
  completed: tasks.filter(t => t.status === 'completed').length,
  blocked: tasks.filter(t => t.status === 'blocked').length,
  overdue: tasks.filter(t => isOverdue(t)).length,
}), [tasks]);
```

## Implementation Steps

### Phase 1: Foundation (Keep Existing Structure)
1. ✅ Keep existing card structure
2. ✅ Maintain 3D tilt effect
3. ✅ Keep health score circular progress
4. ✅ Keep progress bar

### Phase 2: Add Budget & Schedule Grid
1. Create budget calculation logic
2. Add schedule calculation (days remaining)
3. Build 2-column grid component
4. Add variance indicators
5. Implement color coding

### Phase 3: Add Task Summary Badges
1. Query task counts by status
2. Build badge components
3. Add conditional rendering (only show if > 0)
4. Implement staggered animations

### Phase 4: Enhance Footer
1. Add materials status query
2. Format last updated timestamp
3. Build quick actions dropdown menu
4. Add hover reveal animation

### Phase 5: Data Integration
1. Update server action to fetch task stats
2. Add material counts query
3. Calculate schedule variance
4. Pass stats to ProjectCard component

### Phase 6: Polish & Testing
1. Test responsive layouts
2. Verify accessibility
3. Optimize animations
4. Add loading states
5. Test with real data

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/projects/ProjectCard.tsx` | **Modify** | Add budget/schedule grid, task badges, enhanced footer |
| `app/actions/projects.ts` | **Modify** | Enhance `getProjectsWithStats()` to include task counts, materials, schedule |
| `types/database.types.ts` | **Reference** | Use existing types, no changes needed |
| `lib/utils.ts` | **Add** | Helper functions: `calculateScheduleStatus()`, `formatDistanceToNow()` |

## Dependencies

### Existing (Already Installed)
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icons
- ✅ `tailwind-merge` - Class merging
- ✅ `@radix-ui/*` - UI components

### NEW (Need to Install)
- `date-fns` - For `formatDistanceToNow()` (alternative to moment.js)
  ```bash
  npm add date-fns
  ```

## Construction Theme Integration

### Colors
- Primary: #001B51 (Navy Blue) - Health score, primary accents
- Accent: #3C3C3C (Dark Gray) - Secondary metrics, borders
- Success: #059669 (Green) - On track, under budget
- Warning: #FBBF24 (Yellow) - At risk, blocked
- Error: #DC2626 (Red) - Delayed, over budget, overdue

### Icons (Lucide)
- `Building2` - Project type
- `CheckCircle2` - Completed, on track
- `AlertCircle` - At risk
- `Clock` - Overdue, time-based
- `DollarSign` - Budget
- `Calendar` - Schedule
- `Users` - Team
- `Package` - Materials
- `TrendingUp/Down` - Budget variance
- `AlertTriangle` - Blocked, warnings
- `MoreVertical` - Quick actions menu
- `Edit`, `Settings`, `Archive` - Actions

### Typography
- Bold weights (600-800) for metrics
- UPPERCASE for labels
- Mono font for IDs/codes
- Clear hierarchy: name > metrics > details

## Important Notes

### Data Source Priority
1. **Real-time calculations** - Task counts, actual spending (from queries)
2. **Cached values** - Health score, completion % (from DB)
3. **Derived metrics** - Schedule status, variance (calculated)

### Performance Considerations
- This card appears in lists (potentially 10-50 cards)
- Minimize query complexity - use aggregated stats from server action
- Use skeleton loading for card grids
- Lazy load images/complex calculations

### Future Enhancements (Post-MVP)
- Weather widget (current site weather)
- Photo thumbnail (latest site photo)
- AI insights ("Recommend checking blocked tasks")
- Trend indicators (↑ health improving)
- Comparison to similar projects

### Mobile-Specific Optimizations
- Reduce health ring size
- Stack budget/schedule vertically
- Limit task badges to 4 (show "...+2 more")
- Single-tap to open project (no hover actions)

## Success Metrics

### User Experience
- ✅ GC can identify at-risk projects in < 3 seconds
- ✅ Budget variance visible without clicking into project
- ✅ Task blockers immediately apparent
- ✅ Mobile-friendly for on-site use

### Technical
- ✅ < 200ms render time per card
- ✅ WCAG AA accessibility compliance
- ✅ Smooth animations (60fps)
- ✅ Works offline (shows cached data)

## Handoff Checklist

- [x] Research construction dashboard best practices
- [x] Analyze current implementation
- [x] Define information hierarchy
- [x] Design enhanced layout
- [x] Specify data requirements
- [x] Document animation strategy
- [x] Plan responsive behavior
- [x] List accessibility requirements
- [x] Identify dependencies
- [x] Create implementation phases

---

**Status**: Ready for `frontend-builder` to implement.

**Key Decisions**:
1. **Keep existing 3D tilt and health score** - Users like it, it's working well
2. **Add budget/schedule grid** - Most critical missing information
3. **Task summary badges** - Quick visual scan of blockers/overdues
4. **Progressive disclosure** - Show essentials, hide details until hover
5. **Mobile-first responsive** - Stack vertically on small screens

**Questions/Considerations**:
- Should we show project owner/PM name on card? (Currently not shown)
- Do we want a "favorite" or "pin" feature for important projects?
- Should overdue count include tasks with no due date?
- What's the threshold for "at risk" schedule status? (Currently: 1-5 days behind)
