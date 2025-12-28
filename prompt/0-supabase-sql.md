create table public.project (
  id identity primary key,
  name text not null,
  status text not null, -- e.g. 'active', 'completed', 'archived'
  health integer,       -- 0-100 health score
  current_phase text,   -- e.g. 'Initiation', 'Planning', etc.
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);

comment on table public.project is
'Stores projects for GenHub. Each project has a name, status, health score, current phase, and is owned by a user. Used for dashboard and project management features.';

create table public.task (
  id identity primary key,
  title text not null,
  status text not null,     -- e.g. 'todo', 'in_progress', 'done'
  priority text,            -- e.g. 'low', 'medium', 'high'
  due_date date,
  assignee_id uuid,         -- references user.id
  project_id integer not null references public.project(id),
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);

comment on table public.task is
'Stores tasks for GenHub. Each task belongs to a project, has a title, status, priority, due date, assignee, and is owned by a user. Used for dashboard and task management features.';

alter table public.project enable row level security;
alter table public.task enable row level security;

create policy "Users can view their own projects"
  on public.project
  for select
  to authenticated
  using (user_id = next_auth.uid());

create policy "Users can insert their own projects"
  on public.project
  for insert
  to authenticated
  with check (user_id = next_auth.uid());

create policy "Users can update their own projects"
  on public.project
  for update
  to authenticated
  using (user_id = next_auth.uid());

create policy "Users can delete their own projects"
  on public.project
  for delete
  to authenticated
  using (user_id = next_auth.uid());

create policy "Users can view their own tasks"
  on public.task
  for select
  to authenticated
  using (user_id = next_auth.uid());

create policy "Users can insert their own tasks"
  on public.task
  for insert
  to authenticated
  with check (user_id = next_auth.uid());

create policy "Users can update their own tasks"
  on public.task
  for update
  to authenticated
  using (user_id = next_auth.uid());

create policy "Users can delete their own tasks"
  on public.task
  for delete
  to authenticated
  using (user_id = next_auth.uid());