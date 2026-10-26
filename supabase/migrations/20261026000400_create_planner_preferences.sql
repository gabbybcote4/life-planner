begin;
create table public.planner_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  theme text not null default 'sage' check (theme in ('sage', 'rose', 'midnight')),
  updated_at timestamptz not null default now()
);
alter table public.planner_preferences enable row level security;
alter table public.planner_preferences force row level security;
revoke all on public.planner_preferences from public, anon, authenticated;
grant select on public.planner_preferences to authenticated;
grant insert (user_id, theme) on public.planner_preferences to authenticated;
grant update (theme) on public.planner_preferences to authenticated;
create policy "preferences_select_own" on public.planner_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_insert_own" on public.planner_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.planner_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create function public.set_preference_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_preference_updated_at() from public, anon, authenticated;
create trigger preferences_set_updated_at before update on public.planner_preferences
  for each row execute function public.set_preference_updated_at();
commit;
