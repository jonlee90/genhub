Certainly! Here is the **Database Schema** and **State Management** for **Task 1: App Core Layout & Navigation** of GenHub PWA, following your requirements for minimalism, clarity, and future extensibility.

---

# 1. App Core Layout & Navigation

## Database Schema

> **Note:** The core layout and navigation itself does not require a dedicated table, as it is UI/UX scaffolding.
> However, the dashboard needs to display user info and quick project/task stats.
> Thus, only the minimal tables required for this are included.

```sql
-- Users table (already provided by next_auth, but shown for reference)
create table user (
  id uuid primary key default next_auth.uid(),
  name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Project table (minimal, for dashboard stats)
create table project (
  id identity primary key,
  name text not null,
  status text not null, -- e.g. 'active', 'completed', 'archived'
  health integer,       -- e.g. 0-100 health score
  current_phase text,   -- e.g. 'Initiation', 'Planning', etc.
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);

-- Task table (minimal, for dashboard stats)
create table task (
  id identity primary key,
  title text not null,
  status text not null,     -- e.g. 'todo', 'in_progress', 'done'
  priority text,            -- e.g. 'low', 'medium', 'high'
  due_date date,
  assignee_id uuid,         -- references user.id
  project_id integer not null references project(id),
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);
```

**No navigation or layout-specific tables are needed.**
All navigation is handled in the frontend, and user session is managed by next_auth.

---

## State Management

> **State is kept minimal, only what is needed for the dashboard and navigation.**

```typescript
// User session (from next-auth)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

// Project summary for dashboard
export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  health: number;
  current_phase: string;
}

// Task summary for dashboard
export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority?: string;
  due_date?: string;
  assignee_id?: string;
  project_id: string;
}

// Navigation section
export type NavSection =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'bids'
  | 'materials'
  | 'expenses'
  | 'reports'
  | 'analytics'
  | 'team'
  | 'client'
  | 'settings';

// App Core State
interface AppCoreState {
  user: User | null;
  navSection: NavSection;
  projects: ProjectSummary[];
  tasks: TaskSummary[];
  // Actions:
  setNavSection: (section: NavSection) => void;
  setProjects: (projects: ProjectSummary[]) => void;
  setTasks: (tasks: TaskSummary[]) => void;
  setUser: (user: User | null) => void;
}
```

---

## **Summary**

- **Database:** Only `user`, `project`, and `task` tables are needed for the dashboard and navigation stats.
- **State:** Holds user session, current navigation section, and minimal project/task summaries for dashboard widgets.

---

**Ready for implementation.**
Let me know if you want the next feature's schema and state!
