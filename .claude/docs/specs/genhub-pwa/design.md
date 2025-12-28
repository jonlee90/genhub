# GenHub PWA - Technical Design Document

## Executive Summary

### Overview
GenHub is a Progressive Web Application designed for small-to-midsize General Contractors, providing construction management tools without enterprise complexity. This document outlines the complete technical architecture, database design, API structure, and implementation strategy for the MVP release.

### Business Value
- **Instant Deployment**: PWA enables immediate updates without app store approvals
- **Universal Access**: Works on iOS, Android, and desktop from a single codebase
- **Offline Capability**: Field workers can operate without reliable connectivity
- **Cost Efficiency**: Single development team, no separate mobile apps
- **Native Experience**: Installable, fast, and optimized for low-end devices

### Key Architectural Decisions

1. **Next.js 15 App Router**: Leverages React Server Components, Server Actions, and Turbopack for optimal performance
2. **Supabase Multi-Tenant Architecture**: Row-Level Security (RLS) ensures complete data isolation between companies
3. **Offline-First PWA**: IndexedDB + Service Worker strategy enables seamless offline/online transitions
4. **Server Actions over API Routes**: Reduces boilerplate, improves type safety, and simplifies error handling
5. **Stripe Integration**: Pre-built subscription management with webhook handlers

### MVP Scope

**Phase 1 (Core MVP)**:
- Core: Auth, Dashboard, Multi-tenant Company Profiles
- Team: Member Management, Subcontractor Directory
- Projects: Creation, Listing, Metro Journey View
- Tasks: Creation, Kanban/List Views, Task Detail

**Phase 2 (Deferred)**:
- AI Features: Bid generation, OCR, Daily report summaries
- Advanced Features: Home Depot integration, KakaoTalk sync, Change orders
- Client Portal and Analytics Dashboard

### Implementation Timeline

- **Week 1-2**: Database schema, authentication, core layout
- **Week 3-4**: Projects and Metro Journey View
- **Week 5-6**: Task management (Kanban, List, Detail)
- **Week 7-8**: Team management, PWA setup, testing
- **Week 9-10**: Performance optimization, deployment, documentation

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │  iOS PWA     │  │ Android PWA  │          │
│  │  (Desktop)   │  │  (iPhone)    │  │   (Phone)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │ Service Worker │ (Offline Cache)           │
│                    └───────┬────────┘                           │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    Next.js 15 Application Layer                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              App Router (React Server Components)        │  │
│  │  /app/app/projects  /app/app/tasks  /app/app/team      │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │              Server Actions (app/actions/)               │  │
│  │  projects.ts  tasks.ts  team.ts  auth.ts                │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │         API Routes (app/api/) - Webhooks Only            │  │
│  │  /api/webhook/stripe  /api/webhook/[future]             │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                        Data & Services Layer                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Supabase   │  │    Stripe    │  │  Vercel Blob │         │
│  │  (Postgres) │  │ Subscriptions│  │ File Storage │         │
│  │     +RLS    │  │   Webhooks   │  │   (Images)   │         │
│  └─────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Future: AI Services (Phase 2)             │         │
│  │  OpenAI GPT-4  Home Depot API  KakaoTalk API     │         │
│  └──────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### 1. **User Interaction Flow (Server Components)**
```
User Action → Server Component → Server Action → Supabase (RLS) → Revalidate → Re-render
```

#### 2. **Offline-First Flow**
```
User Action → IndexedDB Write → Service Worker Queue → Background Sync → Supabase
                    ↓
              Optimistic UI Update
```

#### 3. **Real-time Updates (Chat/Notifications)**
```
User A sends message → Supabase Insert → Supabase Realtime → WebSocket → User B receives
                            ↓
                    RLS enforces permissions
```

#### 4. **File Upload Flow**
```
User selects file → Next.js API Route → Vercel Blob Upload → URL returned → Supabase metadata
```

### PWA Strategy

#### Service Worker Architecture
- **Cache Strategy**: Network-first for API calls, cache-first for static assets
- **Offline Fallback**: Custom `/~offline` page when network unavailable
- **Background Sync**: Queue mutations during offline, replay on reconnection
- **Push Notifications**: Web Push API for task assignments and updates

#### Manifest Configuration
```json
{
  "name": "GenHub - Construction Management",
  "short_name": "GenHub",
  "start_url": "/app",
  "display": "standalone",
  "theme_color": "#001b51",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### Offline Storage Strategy
- **IndexedDB**: Projects, tasks, team members (read-heavy data)
- **Cache Storage**: Static assets, API responses
- **LocalStorage**: User preferences, UI state (small data only)

**Storage Limits**:
- Chrome: Up to 60% of total disk space
- Safari: ~1GB (request persistence with `navigator.storage.persist()`)
- Firefox: Up to 50% of free disk space

---

## Database Schema

### Multi-Tenant Data Isolation Strategy

All tables include `company_id` (except user-level tables). Row-Level Security (RLS) policies enforce:
1. Users can only access data from their company
2. Role-based permissions (GC Admin, PM, Subcontractor, Client)
3. Complete isolation between companies (multi-tenancy)

### Core Schema

#### 1. Companies Table
```sql
-- Company (tenant) table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Multi-tenant company profiles. Each company is completely isolated.';

-- No RLS needed - users access via company_users join
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
```

#### 2. Users Table (Extended from next-auth)
```sql
-- User profiles (extends next-auth users table)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data beyond next-auth schema';

-- RLS: Users can read/update their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (next_auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (next_auth.uid() = id);
```

#### 3. Company Users (Roles & Permissions)
```sql
-- Join table for users and companies with roles
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('gc_admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
  invited_by UUID REFERENCES public.user_profiles(id),
  invited_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

COMMENT ON TABLE public.company_users IS 'User-Company relationship with role-based access control';

-- Index for performance
CREATE INDEX idx_company_users_company ON public.company_users(company_id);
CREATE INDEX idx_company_users_user ON public.company_users(user_id);

-- RLS: Users can see members of their company
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company members"
  ON public.company_users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
    )
  );

CREATE POLICY "GC Admins can manage company members"
  ON public.company_users FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid() AND role = 'gc_admin'
    )
  );
```

#### 4. Subcontractors Directory
```sql
-- Subcontractor profiles (company-specific directory)
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade_specialization TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  license_expiry DATE,
  insurance_expiry DATE,
  insurance_doc_url TEXT,
  license_doc_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  performance_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  total_projects_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subcontractors IS 'Company-specific subcontractor directory with credentials tracking';

CREATE INDEX idx_subcontractors_company ON public.subcontractors(company_id);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade_specialization);

-- RLS: Users can see subcontractors from their company
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company subcontractors"
  ON public.subcontractors FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
    )
  );

CREATE POLICY "GC/PM can manage subcontractors"
  ON public.subcontractors FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND role IN ('gc_admin', 'project_manager')
    )
  );
```

### Projects Schema

#### 5. Projects Table
```sql
-- Project types enum
CREATE TYPE project_type AS ENUM ('residential', 'restaurant_cafe', 'commercial_office', 'industrial');
CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  project_type project_type NOT NULL,
  status project_status DEFAULT 'active',
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(12,2),
  health_score INT DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  current_phase TEXT DEFAULT 'Initiation',
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Construction projects with type-specific templates and health tracking';

CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_type ON public.projects(project_type);

-- RLS: Users can see projects from their company
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company projects"
  ON public.projects FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
    )
  );

CREATE POLICY "GC/PM can manage projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND role IN ('gc_admin', 'project_manager')
    )
  );

CREATE POLICY "GC/PM can update projects"
  ON public.projects FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = next_auth.uid()
      AND role IN ('gc_admin', 'project_manager')
    )
  );
```

#### 6. Project Phases (Metro Journey)
```sql
-- Project phases for Metro Journey visualization
CREATE TABLE public.project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

COMMENT ON TABLE public.project_phases IS 'Metro Journey phases (Initiation, Pre-Construction, Procurement, Construction, Post-Construction)';

CREATE INDEX idx_project_phases_project ON public.project_phases(project_id);

-- RLS: Inherit from project
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view phases of their company projects"
  ON public.project_phases FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
      )
    )
  );

CREATE POLICY "GC/PM can manage phases"
  ON public.project_phases FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager')
      )
    )
  );
```

#### 7. Project Team Members
```sql
-- Project team assignments
CREATE TABLE public.project_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'foreman', 'field_worker')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.user_profiles(id),
  UNIQUE(project_id, user_id)
);

COMMENT ON TABLE public.project_team IS 'Team member assignments to projects';

CREATE INDEX idx_project_team_project ON public.project_team(project_id);
CREATE INDEX idx_project_team_user ON public.project_team(user_id);

-- RLS: Inherit from project
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team of their company projects"
  ON public.project_team FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
      )
    )
  );

CREATE POLICY "GC/PM can manage project team"
  ON public.project_team FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager')
      )
    )
  );
```

### Tasks Schema

#### 8. Tasks Table
```sql
-- Task status and priority enums
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'blocked', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date DATE,
  planned_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  blocker_reason TEXT,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tasks IS 'Project tasks with Kanban workflow and cost tracking';

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_phase ON public.tasks(phase_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- RLS: Inherit from project
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of their company projects"
  ON public.tasks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
      )
    )
  );

CREATE POLICY "GC/PM can manage tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager', 'foreman')
      )
    )
  );

CREATE POLICY "Assigned users can update their tasks"
  ON public.tasks FOR UPDATE
  USING (
    assignee_id = next_auth.uid() OR
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = next_auth.uid()
        AND role IN ('gc_admin', 'project_manager', 'foreman')
      )
    )
  );
```

#### 9. Task Dependencies
```sql
-- Task dependencies for blocking logic
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

COMMENT ON TABLE public.task_dependencies IS 'Task dependencies for auto-blocking workflow';

CREATE INDEX idx_task_dependencies_task ON public.task_dependencies(task_id);

-- RLS: Inherit from task
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task dependencies"
  ON public.task_dependencies FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
        )
      )
    )
  );
```

#### 10. Task Activity Log
```sql
-- Task activity history
CREATE TABLE public.task_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  action TEXT NOT NULL, -- e.g. 'created', 'status_changed', 'assigned', 'commented'
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.task_activity IS 'Audit log for all task changes and comments';

CREATE INDEX idx_task_activity_task ON public.task_activity(task_id);
CREATE INDEX idx_task_activity_created ON public.task_activity(created_at DESC);

-- RLS: Inherit from task
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity of their company tasks"
  ON public.task_activity FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add activity to tasks they can access"
  ON public.task_activity FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
        )
      )
    ) AND user_id = next_auth.uid()
  );
```

### Notifications Schema

#### 11. Notifications Table
```sql
-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_overdue',
  'task_blocked',
  'project_update',
  'team_invited',
  'mention'
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Deep link to relevant page
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- RLS: Users can only see their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = next_auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = next_auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE); -- Insert handled by server-side logic
```

### File Attachments Schema

#### 12. Attachments Table
```sql
-- File attachments (linked to tasks, projects, etc.)
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project', 'phase', 'profile')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- bytes
  uploaded_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.attachments IS 'File attachments for tasks, projects, and other entities';

CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);

-- RLS: Users can see attachments from their company's entities
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments from their company"
  ON public.attachments FOR SELECT
  USING (
    (entity_type = 'task' AND entity_id IN (
      SELECT id FROM public.tasks
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
        )
      )
    )) OR
    (entity_type = 'project' AND entity_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = next_auth.uid()
      )
    )) OR
    (entity_type = 'profile' AND uploaded_by = next_auth.uid())
  );
```

### Stripe Integration Schema

#### 13. Stripe Customers (Already Exists)
```sql
-- Stripe customer mapping (already in template)
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  plan_active BOOLEAN DEFAULT FALSE,
  plan_expires BIGINT,
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe data"
  ON public.stripe_customers FOR SELECT
  USING (user_id = next_auth.uid());
```

### Database Triggers & Functions

#### Auto-update timestamps
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Auto-create project phases on project creation
```sql
-- Function to create default phases for new projects
CREATE OR REPLACE FUNCTION create_default_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_phases (project_id, name, display_order, status)
  VALUES
    (NEW.id, 'Initiation', 1, 'in_progress'),
    (NEW.id, 'Pre-Construction', 2, 'pending'),
    (NEW.id, 'Procurement', 3, 'pending'),
    (NEW.id, 'Construction', 4, 'pending'),
    (NEW.id, 'Post-Construction', 5, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_phases_on_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION create_default_project_phases();
```

#### Auto-update project completion percentage
```sql
-- Function to update project completion based on tasks
CREATE OR REPLACE FUNCTION update_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INT;
  completed_tasks INT;
  completion_pct INT;
BEGIN
  SELECT COUNT(*) INTO total_tasks FROM public.tasks WHERE project_id = NEW.project_id;
  SELECT COUNT(*) INTO completed_tasks FROM public.tasks
    WHERE project_id = NEW.project_id AND status = 'completed';

  IF total_tasks > 0 THEN
    completion_pct := (completed_tasks * 100) / total_tasks;
    UPDATE public.projects SET completion_percentage = completion_pct WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_completion_on_task_update
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_completion();
```

---

## API Design

### Server Actions Architecture

Server Actions are the primary method for data mutations in GenHub. They provide:
- Type safety with TypeScript
- Built-in error handling with `useActionState`
- Automatic revalidation with `revalidatePath`
- No need for separate API route boilerplate

#### File Structure
```
app/actions/
├── auth.ts              # Authentication actions
├── projects.ts          # Project CRUD
├── tasks.ts             # Task CRUD
├── team.ts              # Team management
├── subcontractors.ts    # Subcontractor directory
├── notifications.ts     # Notification actions
├── attachments.ts       # File upload actions
└── stripe.ts            # Subscription management
```

### Core Server Actions

#### `app/actions/projects.ts`
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@/lib/auth'

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client_name: z.string().min(1, 'Client name is required'),
  address: z.string().min(1, 'Address is required'),
  project_type: z.enum(['residential', 'restaurant_cafe', 'commercial_office', 'industrial']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget: z.number().positive().optional(),
  description: z.string().optional(),
})

export type CreateProjectState = {
  error?: string
  success?: boolean
  projectId?: string
}

export async function createProject(
  prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // 2. Validate input
    const validatedFields = createProjectSchema.safeParse({
      name: formData.get('name'),
      client_name: formData.get('client_name'),
      address: formData.get('address'),
      project_type: formData.get('project_type'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : undefined,
      description: formData.get('description'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    // 3. Get user's company
    const supabase = await getSupabaseClient()
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (companyError || !companyUser) {
      return { error: 'No active company found for user' }
    }

    // 4. Check permissions (GC Admin or PM can create projects)
    if (!['gc_admin', 'project_manager'].includes(companyUser.role)) {
      return { error: 'Insufficient permissions to create projects' }
    }

    // 5. Insert project (RLS will enforce company isolation)
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        ...validatedFields.data,
        company_id: companyUser.company_id,
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Project creation error:', insertError)
      return { error: 'Failed to create project' }
    }

    // 6. Revalidate projects page
    revalidatePath('/app/projects')

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error('Unexpected error in createProject:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateProjectStatus(
  projectId: string,
  status: 'active' | 'on_hold' | 'completed' | 'archived'
): Promise<{ error?: string; success?: boolean }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = await getSupabaseClient()
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)

    if (error) {
      return { error: 'Failed to update project status' }
    }

    revalidatePath('/app/projects')
    revalidatePath(`/app/projects/${projectId}`)

    return { success: true }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}
```

#### `app/actions/tasks.ts`
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@/lib/auth'

const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  phase_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  planned_cost: z.number().positive().optional(),
})

export type CreateTaskState = {
  error?: string
  success?: boolean
  taskId?: string
}

export async function createTask(
  prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validatedFields = createTaskSchema.safeParse({
      project_id: formData.get('project_id'),
      phase_id: formData.get('phase_id') || undefined,
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      assignee_id: formData.get('assignee_id') || undefined,
      due_date: formData.get('due_date') || undefined,
      planned_cost: formData.get('planned_cost') ? parseFloat(formData.get('planned_cost') as string) : undefined,
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    const supabase = await getSupabaseClient()
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...validatedFields.data,
        created_by: session.user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { error: 'Failed to create task' }
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: task.id,
      user_id: session.user.id,
      action: 'created',
      new_value: validatedFields.data.title,
    })

    revalidatePath('/app/tasks')
    revalidatePath(`/app/projects/${validatedFields.data.project_id}`)

    return { success: true, taskId: task.id }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed',
  blockerReason?: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = await getSupabaseClient()

    // Get old status for activity log
    const { data: oldTask } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', taskId)
      .single()

    // Update task
    const { error } = await supabase
      .from('tasks')
      .update({
        status,
        blocker_reason: status === 'blocked' ? blockerReason : null
      })
      .eq('id', taskId)

    if (error) {
      return { error: 'Failed to update task status' }
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: taskId,
      user_id: session.user.id,
      action: 'status_changed',
      old_value: oldTask?.status,
      new_value: status,
      comment: blockerReason,
    })

    revalidatePath('/app/tasks')

    return { success: true }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}
```

#### `app/actions/team.ts`
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['gc_admin', 'project_manager', 'foreman', 'field_worker']),
})

export type InviteTeamMemberState = {
  error?: string
  success?: boolean
}

export async function inviteTeamMember(
  prevState: InviteTeamMemberState,
  formData: FormData
): Promise<InviteTeamMemberState> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validatedFields = inviteTeamMemberSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    const supabase = await getSupabaseClient()

    // Get user's company (must be GC Admin)
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (companyError || companyUser?.role !== 'gc_admin') {
      return { error: 'Only GC Admins can invite team members' }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', validatedFields.data.email)
      .single()

    let userId: string

    if (existingUser) {
      // Check if already in company
      const { data: existingMember } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', companyUser.company_id)
        .eq('user_id', existingUser.id)
        .single()

      if (existingMember) {
        return { error: 'User is already a member of this company' }
      }

      userId = existingUser.id
    } else {
      // Create placeholder user profile
      const { data: newUser, error: userError } = await supabase
        .from('user_profiles')
        .insert({
          email: validatedFields.data.email,
          name: validatedFields.data.name,
        })
        .select('id')
        .single()

      if (userError) {
        return { error: 'Failed to create user profile' }
      }

      userId = newUser.id
    }

    // Create company_users entry with 'invited' status
    const { error: inviteError } = await supabase
      .from('company_users')
      .insert({
        company_id: companyUser.company_id,
        user_id: userId,
        role: validatedFields.data.role,
        status: 'invited',
        invited_by: session.user.id,
        invited_at: new Date().toISOString(),
      })

    if (inviteError) {
      return { error: 'Failed to send invitation' }
    }

    // Send invitation email
    await sendEmail({
      to: validatedFields.data.email,
      subject: 'You\'re invited to join GenHub',
      text: `You've been invited to join a team on GenHub. Click the link to accept: ${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=...`,
    })

    revalidatePath('/app/team')

    return { success: true }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}
```

### API Routes (Webhooks Only)

API routes are reserved for webhooks and external integrations.

#### `app/api/webhook/stripe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseAdminClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabaseAdmin = await createSupabaseAdminClient()

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await supabaseAdmin.from('stripe_customers').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
        plan_active: true,
        plan_expires: subscription.current_period_end * 1000,
      })

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      await supabaseAdmin
        .from('stripe_customers')
        .update({
          plan_active: subscription.status === 'active',
          plan_expires: subscription.current_period_end * 1000,
        })
        .eq('subscription_id', subscription.id)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabaseAdmin
        .from('stripe_customers')
        .update({
          plan_active: false,
          subscription_id: null,
        })
        .eq('subscription_id', subscription.id)

      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice

      await supabaseAdmin
        .from('stripe_customers')
        .update({
          plan_active: true,
        })
        .eq('stripe_customer_id', invoice.customer as string)

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

---

## Component Architecture

### Page Structure

```
app/
├── app/                          # Authenticated app shell
│   ├── layout.tsx                # App layout with sidebar, header
│   ├── page.tsx                  # Dashboard home
│   ├── projects/
│   │   ├── page.tsx              # Projects list
│   │   ├── new/page.tsx          # Create project
│   │   └── [id]/page.tsx         # Project detail (Metro Journey)
│   ├── tasks/
│   │   ├── page.tsx              # Task board (Kanban/List toggle)
│   │   └── [id]/page.tsx         # Task detail
│   ├── team/
│   │   └── page.tsx              # Team management
│   └── settings/
│       └── page.tsx              # User/company settings
├── (auth)/
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
└── page.tsx                      # Public landing page
```

### Component Hierarchy

```
components/
├── app/
│   ├── Sidebar.tsx               # Main navigation sidebar
│   ├── Header.tsx                # Top header with search, notifications
│   ├── NotificationBell.tsx      # Notification dropdown
│   └── UserMenu.tsx              # User avatar and menu
├── projects/
│   ├── ProjectCard.tsx           # Project card with health score
│   ├── ProjectFilters.tsx        # Status, type filters
│   ├── MetroJourney.tsx          # Metro line visualization
│   ├── PhaseStation.tsx          # Individual phase station
│   └── CreateProjectModal.tsx   # Project creation form
├── tasks/
│   ├── KanbanBoard.tsx           # Kanban view
│   ├── TaskList.tsx              # List view
│   ├── TaskCard.tsx              # Task card (drag-droppable)
│   ├── TaskDetail.tsx            # Task detail panel
│   ├── TaskActivityLog.tsx       # Activity timeline
│   └── CreateTaskForm.tsx        # Task creation form
├── team/
│   ├── TeamTable.tsx             # Team members table
│   ├── InviteMemberModal.tsx    # Invite form
│   └── SubcontractorCard.tsx    # Subcontractor profile card
├── ui/                           # aceternity/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   └── ...
└── PWA/
    ├── InstallPrompt.tsx         # PWA install banner
    └── OfflineBanner.tsx         # Offline status indicator
```

### Key Component Implementations

#### `components/app/Sidebar.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Projects', href: '/app/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/app/tasks', icon: CheckSquare },
  { name: 'Team', href: '/app/team', icon: Users },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-900">GenHub</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
```

#### `components/projects/MetroJourney.tsx`
```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PhaseStation } from './PhaseStation'

type Phase = {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  completion_percentage: number
  display_order: number
}

type MetroJourneyProps = {
  phases: Phase[]
  projectId: string
}

export function MetroJourney({ phases, projectId }: MetroJourneyProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)

  const sortedPhases = [...phases].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="relative">
      {/* Metro Line */}
      <div className="flex items-center gap-4 overflow-x-auto pb-8">
        {sortedPhases.map((phase, index) => (
          <div key={phase.id} className="flex items-center">
            <PhaseStation
              phase={phase}
              isSelected={selectedPhase === phase.id}
              onClick={() => setSelectedPhase(phase.id)}
            />
            {index < sortedPhases.length - 1 && (
              <div
                className={cn(
                  'h-1 w-24 mx-2',
                  phase.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Phase Details Panel */}
      {selectedPhase && (
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
          {/* Phase tasks, budget, materials would go here */}
          <h3 className="text-lg font-semibold">
            {sortedPhases.find(p => p.id === selectedPhase)?.name}
          </h3>
        </div>
      )}
    </div>
  )
}
```

#### `components/tasks/KanbanBoard.tsx`
```typescript
'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core'
import { TaskCard } from './TaskCard'
import { updateTaskStatus } from '@/app/actions/tasks'

type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed'
  priority: string
  assignee_id?: string
}

type KanbanBoardProps = {
  tasks: Task[]
}

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'completed', title: 'Completed' },
]

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Task['status']

    // Optimistic update
    await updateTaskStatus(taskId, newStatus)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
          >
            <h3 className="font-semibold mb-4">
              {column.title} ({tasks.filter(t => t.status === column.id).length})
            </h3>
            <div className="space-y-3">
              {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  )
}
```

---

## State Management

### Strategy
GenHub uses **server-driven state** with minimal client-side state management:

1. **Server Components**: Fetch data directly in components (no separate state layer needed)
2. **Server Actions**: Mutations trigger revalidation, re-rendering updated data
3. **URL State**: Search params, filters stored in URL for shareable links
4. **Local State**: Only for UI interactions (modals, dropdowns, form inputs)

### No Global State Library Needed
- Server Components eliminate most need for Redux/Zustand
- Use React Context only for truly global UI state (theme, sidebar collapsed)

### Optimistic Updates Pattern
```typescript
'use client'

import { experimental_useOptimistic as useOptimistic } from 'react'
import { updateTaskStatus } from '@/app/actions/tasks'

export function TaskStatusToggle({ task }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    task.status,
    (state, newStatus) => newStatus
  )

  async function handleStatusChange(newStatus) {
    // Immediately update UI
    setOptimisticStatus(newStatus)

    // Call server action
    await updateTaskStatus(task.id, newStatus)
  }

  return (
    <select value={optimisticStatus} onChange={(e) => handleStatusChange(e.target.value)}>
      <option value="todo">To Do</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  )
}
```

---

## Error Handling

### Strategy
1. **Expected Errors**: Return as state from Server Actions (use `useActionState`)
2. **Unexpected Errors**: Caught by `error.tsx` boundaries
3. **Validation Errors**: Handled with Zod, returned as field-specific errors
4. **Network Errors**: Handled by service worker, queue for retry

### Error Boundaries
```typescript
// app/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  )
}
```

### Form Error Handling
```typescript
'use client'

import { useActionState } from 'react'
import { createProject } from '@/app/actions/projects'

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, {})

  return (
    <form action={formAction}>
      <input name="name" required />
      {state.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
```

---

## Testing Strategy

### Test Pyramid
1. **Unit Tests**: Utility functions, helpers (Vitest)
2. **Integration Tests**: Server Actions with mocked Supabase (Vitest)
3. **Component Tests**: React components (React Testing Library)
4. **E2E Tests**: Critical user flows (Playwright)

### Example Server Action Test
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createProject } from '@/app/actions/projects'

vi.mock('@/utils/supabase/server')
vi.mock('@/lib/auth')

describe('createProject', () => {
  it('should create project with valid data', async () => {
    const formData = new FormData()
    formData.append('name', 'Test Project')
    formData.append('client_name', 'Test Client')
    formData.append('address', '123 Main St')
    formData.append('project_type', 'residential')
    formData.append('start_date', '2025-01-01')

    const result = await createProject({}, formData)

    expect(result.success).toBe(true)
    expect(result.projectId).toBeDefined()
  })

  it('should return error with missing required fields', async () => {
    const formData = new FormData()
    formData.append('name', 'Test Project')

    const result = await createProject({}, formData)

    expect(result.error).toBeDefined()
  })
})
```

---

## Key UI Flows

### 1. Authentication Flow
```
User visits /app → Middleware checks auth →
  If authenticated: Show app
  If not: Redirect to /sign-in →
    User signs in with next-auth →
      Success: Check company_users →
        Has company: Redirect to /app
        No company: Prompt to create/join company
      Failure: Show error
```

### 2. Project Creation Flow
```
User clicks "New Project" →
  Modal opens with form →
    User fills project details →
      Selects project type (templates loaded) →
        Submits form →
          Server Action validates data →
            Creates project record →
              Trigger creates default phases →
                Revalidates /app/projects →
                  Redirects to project detail page
```

### 3. Task Management Flow (Kanban)
```
User views task board →
  Tasks grouped by status column →
    User drags task to new column →
      Optimistic UI update (instant) →
        Server Action updates status →
          Logs activity →
            Revalidates task list →
              Updates project completion %
```

### 4. Team Invitation Flow
```
GC Admin clicks "Invite Member" →
  Modal opens with form →
    Enters email, name, role →
      Server Action validates →
        Checks if user exists →
          Creates/updates user_profile →
            Creates company_users (status: invited) →
              Sends email invitation →
                User clicks invite link →
                  Sets password, activates account →
                    Status changes to 'active'
```

### 5. Offline Task Update Flow
```
User opens app (offline) →
  Service worker serves cached pages →
    User updates task status →
      Writes to IndexedDB →
        Updates UI optimistically →
          Queues sync request →
            User comes back online →
              Background Sync API triggers →
                Queued updates sent to Supabase →
                  IndexedDB cleared →
                    UI revalidated
```

---

## Performance Optimization

### Next.js 15 Optimizations
1. **Turbopack**: Default bundler, 700x faster than Webpack
2. **React Server Components**: Zero client-side JavaScript for static content
3. **Partial Prerendering**: Static shell, dynamic content
4. **Image Optimization**: Automatic WebP/AVIF conversion, lazy loading

### Database Optimizations
1. **Indexes**: All foreign keys, frequently queried columns
2. **RLS Performance**: Wrap functions in SELECT for caching
3. **Materialized Views**: For complex analytics queries (Phase 2)
4. **Connection Pooling**: Supabase pooler for serverless functions

### PWA Performance
1. **Cache Strategy**: Cache-first for assets, network-first for API
2. **Lazy Loading**: Code-split routes, lazy load heavy components
3. **Prefetching**: Prefetch likely next pages on hover
4. **Service Worker**: Precache critical assets during install

### Loading States
```typescript
// app/app/projects/page.tsx
import { Suspense } from 'react'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectListSkeleton } from '@/components/projects/ProjectListSkeleton'

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectListSkeleton />}>
      <ProjectList />
    </Suspense>
  )
}
```

---

## Security Considerations

### Authentication
- next-auth with Supabase JWT integration
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection built into next-auth

### Authorization
- Row-Level Security (RLS) enforced at database level
- Double-check permissions in Server Actions
- Never trust client-side role checks

### Data Validation
- Zod schemas for all Server Action inputs
- Sanitize user inputs before database insertion
- Validate file uploads (type, size)

### File Uploads
- Scan files for malware (Phase 2)
- Limit file sizes (5MB for images, 10MB for documents)
- Store files in Vercel Blob (not public folder)

### API Security
- Stripe webhook signature verification
- Rate limiting on API routes (Phase 2)
- CORS configuration for external integrations

---

## Deployment Strategy

### Vercel Deployment
1. **Environment Variables**: Set in Vercel dashboard
2. **Build Configuration**: next.config.ts optimized for production
3. **Edge Functions**: Deploy middleware to edge for low latency
4. **Analytics**: Vercel Analytics for performance monitoring

### Database Migrations
1. **Migration Files**: Stored in `/supabase/migrations/`
2. **Apply Migrations**: Run via Supabase CLI before deployment
3. **Rollback Plan**: Keep previous migration files for rollback

### PWA Deployment
1. **Service Worker**: Generated during build
2. **Manifest**: Served from `/public/manifest.json`
3. **HTTPS Required**: Vercel provides automatic HTTPS

### Monitoring
1. **Vercel Analytics**: Page views, performance metrics
2. **Sentry**: Error tracking (Phase 2)
3. **Supabase Dashboard**: Database performance, RLS audit

---

## Future Enhancements (Phase 2)

### AI Features
1. **Bid Package Generation**: GPT-4 generates scope of work from project type
2. **Bid Analysis**: Compare bids, flag anomalies, recommend winners
3. **OCR Receipts**: Extract line items from photos, match to materials
4. **Daily Report Summaries**: Generate internal and client-friendly summaries

### Integrations
1. **Home Depot API**: Live product search, pricing, stock levels
2. **KakaoTalk**: Two-way message sync for project chat
3. **QuickBooks**: Accounting sync for expenses, invoices

### Advanced Features
1. **Change Order Engine**: AI-predicted cost/timeline impact
2. **Client Portal**: Curated project updates, approval workflow
3. **Analytics Dashboard**: Project health, budget variance, subcontractor performance
4. **Real-time Chat**: Supabase Realtime for project and task-level messaging

---

## Appendix

### Technology Stack Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 15 | React framework with App Router |
| Language | TypeScript | 5.x | Type-safe development |
| Database | Supabase (Postgres) | Latest | Multi-tenant database with RLS |
| Auth | next-auth | 5.x | Authentication with Supabase |
| Payments | Stripe | Latest | Subscription management |
| UI Components | aceternity/ui | Latest | Headless UI components |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Icons | Lucide React | Latest | Icon library |
| Validation | Zod | Latest | Schema validation |
| File Storage | Vercel Blob | Latest | Image/document storage |
| Deployment | Vercel | Latest | Hosting and edge functions |

### Research Sources

- [Next.js PWA Offline Support](https://adropincalm.com/blog/nextjs-offline-service-worker/)
- [Supabase Multi-Tenant RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Next.js 15 Server Actions Best Practices](https://nextjs.org/docs/app/getting-started/error-handling)
- [Supabase Realtime for Chat](https://supabase.com/docs/guides/realtime)
- [Stripe Webhook Handling](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [PWA IndexedDB Offline Patterns](https://web.dev/learn/pwa/offline-data/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-04
**Author**: kiro-design agent
**Status**: Ready for Review
