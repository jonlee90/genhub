# GenHub Routes Index

> Quick lookup for app routes. For page patterns, see `.claude/skills/frontend/page-creation.md`

Last updated: 2026-01-10

---

## App Routes (`/app/*`)

All routes require authentication via NextAuth.

### Dashboard
| Route | Page | Data Source |
|-------|------|-------------|
| `/app` | Dashboard home | getDashboardData |

### Projects
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/projects` | Project list | getProjects |
| `/app/projects/new` | Create project | - |
| `/app/projects/[id]` | Project detail (Metro Journey) | getProjectById, getProjectPhases |

### Tasks
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/tasks` | Task board (Kanban/List) | getTasks |
| `/app/tasks/new` | Create task | getProjects, getPhases |
| `/app/tasks/[id]` | Task detail | getTaskById |

### Materials
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/materials` | Materials list | getMaterials |

### Expenses
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/expenses` | Expense list | getExpenses |

### Chat
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/chat` | Chat rooms | getChatRooms |

### Team
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/team` | Team members | getTeamMembers |
| `/app/team/subcontractors` | Subcontractor directory | getSubcontractors |

### Settings
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/settings` | User settings | getUserSettings |
| `/app/settings/default-models` | Default 3D models | getDefaultModels |

### Profile
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/profile` | User profile | getProfile |

### Admin
| Route | Page | Data Source |
|-------|------|-------------|
| `/app/admin/seed-data` | Demo data seeding | - |

---

## Client Portal Routes

Special routes for client access (limited permissions).

| Route | Page | Data Source |
|-------|------|-------------|
| `/app/client/projects/[id]` | Client project view | getProjectForClient |
| `/app/client/[projectId]/spatial` | 3D spatial viewer | getActiveModel, getMarkers |

---

## Public Routes

No authentication required.

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing page | Marketing |
| `/sign-in` | Sign in | NextAuth |
| `/sign-up` | Sign up | NextAuth |
| `/invite/[token]` | Team invite | Accept invitation |

---

## API Routes (`/api/*`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/webhook/stripe` | POST | Stripe webhooks |
| `/api/upload/file` | POST | File upload |
| `/api/upload/photo` | POST | Photo upload |

---

## Route Patterns

### Dynamic Routes
```
/app/projects/[id]     → params.id
/app/tasks/[id]        → params.id
/app/client/[projectId]/spatial → params.projectId
```

### Nested Routes
```
/app/projects/[id]/    (layout wraps detail pages)
/app/settings/         (layout wraps settings pages)
```

### Route Groups
```
(auth)/                → Auth-related routes
(payment)/             → Payment-related routes
```

---

## Page Component Pattern

All pages follow this structure:

```tsx
// app/app/{feature}/page.tsx (Server Component)
export default async function FeaturePage() {
  const { data, error } = await getFeatureData();

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
      {/* Blueprint grid background */}
      {/* Industrial header */}
      {/* Content */}
    </div>
  );
}
```

---

## Navigation Structure

### Sidebar (Desktop)
```
Dashboard
Projects
Tasks
Materials
Expenses
Chat
Team
Settings
```

### Mobile Nav (Bottom)
```
Home | Projects | Tasks | Chat | Menu
```

---

## Route Stats

| Category | Count |
|----------|-------|
| App routes | 18 |
| Client portal | 2 |
| Public routes | 4 |
| API routes | 4 |
| **Total** | 28 |

---

## Adding New Routes

1. Create `app/app/{feature}/page.tsx`
2. Follow standard page layout (see skill)
3. Add data fetching Server Actions
4. Update sidebar navigation
5. Update this index

See: `.claude/skills/frontend/page-creation.md`
