-- Apply once to the Life Planner project. All changes commit together.
-- Fails safely if a tasks table already exists; do not replace existing data.
begin;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200 and title ~ '[^[:space:]]'),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_created_idx on public.tasks (user_id, created_at desc, id);

alter table public.tasks enable row level security;
alter table public.tasks force row level security;

-- Remove inherited client grants; only the operations used in this increment remain.
revoke all on public.tasks from public, anon, authenticated;
grant select on public.tasks to authenticated;
grant insert (id, user_id, title) on public.tasks to authenticated;
grant update (title, completed) on public.tasks to authenticated;

create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.set_task_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_task_updated_at() from public, anon, authenticated;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_task_updated_at();

commit;

