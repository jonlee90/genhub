# Seed Demo Data

This directory contains scripts and actions to reset and seed the database with realistic demo construction projects.

## Overview

The seed data functionality will:

1. **Delete all existing projects** (cascades to phases, tasks, expenses, spatial markers, etc.)
2. **Create 10 new realistic projects** (2 per project type):
   - 2 Residential projects
   - 2 Restaurant projects
   - 2 Cafe projects
   - 2 Commercial Office projects
   - 2 Industrial projects
3. **Create phases** for each project (from templates)
4. **Create tasks** for each phase (from templates)
5. **Link projects to default 3D models**
6. **Set realistic statuses, health scores, and progress**

## Usage

### Method 1: Web UI (Recommended)

1. Navigate to `/app/admin/seed-data` in your browser
2. Click the "Reset & Seed Demo Data" button
3. Confirm the warning dialog
4. Wait for completion (you'll see a success message)
5. Navigate to `/app/projects` to see the new demo projects

**URL:** http://localhost:3000/app/admin/seed-data

### Method 2: Server Action (Programmatic)

You can call the server action directly from any server component or another action:

```typescript
import { seedDemoData } from '@/app/actions/seed-demo-data';

const result = await seedDemoData();

if (result.success) {
  console.log(result.message);
} else {
  console.error(result.error);
}
```

## What Gets Created

### Projects (10 total)

#### Residential (2)
1. **Sunset Villa Residence** - Los Angeles, CA
   - Luxury 2-story custom home
   - Budget: $850,000 | Actual: $325,000
   - Health: 88 | Progress: 35%
   - Status: Active

2. **Oakwood Family Home** - Portland, OR
   - Traditional 2-story family home
   - Budget: $620,000 | Actual: $480,000
   - Health: 92 | Progress: 65%
   - Status: In Progress

#### Restaurant (2)
1. **Downtown Bistro** - Seattle, WA
   - Upscale French bistro
   - Budget: $720,000 | Actual: $280,000
   - Health: 85 | Progress: 40%
   - Status: Active

2. **Harbor View Seafood** - San Diego, CA
   - Waterfront seafood restaurant
   - Budget: $980,000 | Actual: $720,000
   - Health: 78 | Progress: 72%
   - Status: In Progress

#### Cafe (2)
1. **Artisan Coffee Co** - Austin, TX
   - Boutique coffee shop
   - Budget: $185,000 | Actual: $92,000
   - Health: 90 | Progress: 48%
   - Status: Active

2. **Campus Corner Cafe** - Berkeley, CA
   - Student-focused cafe
   - Budget: $145,000 | Actual: $15,000
   - Health: 95 | Progress: 12%
   - Status: Planning

#### Commercial Office (2)
1. **Tech Hub Office Buildout** - San Francisco, CA
   - Modern 3-floor tech office
   - Budget: $1,250,000 | Actual: $580,000
   - Health: 82 | Progress: 45%
   - Status: Active

2. **Financial District Suite** - New York, NY
   - Executive office suite
   - Budget: $875,000 | Actual: $680,000
   - Health: 88 | Progress: 76%
   - Status: In Progress

#### Industrial (2)
1. **Riverside Distribution Center** - Houston, TX
   - Large warehouse facility
   - Budget: $2,100,000 | Actual: $750,000
   - Health: 80 | Progress: 35%
   - Status: Active

2. **Metro Manufacturing Plant** - Detroit, MI
   - Manufacturing facility
   - Budget: $3,500,000 | Actual: $2,800,000
   - Health: 75 | Progress: 78%
   - Status: In Progress

### Phases (per project)

Each project gets 5 standard phases:
1. **Initiation** - Project kickoff and initial planning
2. **Pre-construction** - Planning and preparation
3. **Procurement** - Material and equipment procurement
4. **Construction** - Active construction phase
5. **Post-construction** - Final inspections and closeout

Phases have varied completion statuses (completed, in_progress, not_started) based on the project's overall progress.

### Tasks (per phase)

Each phase gets tasks from the project type templates:

**Residential Example:**
- Initiation: Site Assessment, Preliminary Estimating, Proposal Submission, etc.
- Pre-construction: Permitting, Utility Setup, Site Logistics, etc.
- Construction: Foundation Inspection, Framing Walkthrough, Insulation & Drywall, etc.
- Post-construction: Blue Tape Walkthrough, Final Cleaning, Certificate of Occupancy

**Task Statuses:** Varied (completed, in_progress, blocked, todo, review)
**Priorities:** Varied (high, medium, low)
**Due Dates:** Staggered (every 3 days)

### 3D Models

Each project is linked to its appropriate default 3D model:
- Residential → Default Residential House
- Restaurant → Default Restaurant Layout
- Cafe → Default Cafe Layout
- Commercial Office → Default Commercial Office
- Industrial → Default Industrial Warehouse

Models are marked as `is_active: true` and `processing_status: ready`.

## Data Relationships

The seed process maintains all foreign key relationships:

```
projects
├── project_phases (CASCADE DELETE)
│   └── tasks (CASCADE DELETE)
├── projects_3d_models (CASCADE DELETE)
│   └── spatial_markers (CASCADE DELETE)
│       └── marker_content (CASCADE DELETE)
├── expenses (CASCADE DELETE)
├── daily_reports (CASCADE DELETE)
├── bid_packages (CASCADE DELETE)
└── project_team (CASCADE DELETE)
```

When a project is deleted, **all related data is automatically deleted** via cascade constraints.

## Security

- Requires authenticated user
- Requires user to belong to an active company
- All projects are created under the user's company
- All projects are assigned to the current user as `created_by`

## Files

- `app/actions/seed-demo-data.ts` - Server Action (main logic)
- `components/admin/SeedDemoDataButton.tsx` - React component (UI)
- `app/app/admin/seed-data/page.tsx` - Admin page
- `scripts/reset-and-seed-projects.sql` - Raw SQL script (alternative)

## Notes

- **Irreversible:** This action deletes ALL existing projects permanently
- **Development Only:** Only use for testing/demo purposes
- **Company Scoped:** Only affects the current user's company
- **Revalidates Cache:** Automatically revalidates `/app/projects` and `/app` routes

## Troubleshooting

### Error: "You must be logged in"
- Ensure you're authenticated
- Check browser cookies/session

### Error: "You must belong to a company"
- Ensure your user account is linked to a company
- Check `company_users` table

### No projects showing after seed
- Check browser console for errors
- Verify RLS policies are enabled
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Tasks not created
- Check that `phase_templates` and `task_templates` exist
- Verify `project_type_configs` are seeded for your company
- Check server logs for errors

## Advanced: Raw SQL Method

If you prefer to run the SQL script directly:

```bash
# Set DATABASE_URL in .env.local
psql $DATABASE_URL -f scripts/reset-and-seed-projects.sql
```

**Note:** This requires the current user to be set via `next_auth.uid()` which only works within an authenticated session. The Server Action method is recommended.
