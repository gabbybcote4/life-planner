-- Create private, all-day calendar events. Apply once, without replacing existing data.
begin;

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200 and title ~ '[^[:space:]]'),
  event_date date not null check (event_date between date '1900-01-01' and date '2100-12-31'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_user_date_idx on public.calendar_events (user_id, event_date, created_at);
alter table public.calendar_events enable row level security;
alter table public.calendar_events force row level security;
revoke all on public.calendar_events from public, anon, authenticated;
grant select on public.calendar_events to authenticated;
grant insert (id, user_id, title, event_date) on public.calendar_events to authenticated;
grant update (title, event_date) on public.calendar_events to authenticated;

create policy "calendar_events_select_own" on public.calendar_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "calendar_events_insert_own" on public.calendar_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "calendar_events_update_own" on public.calendar_events
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_calendar_event_updated_at() from public, anon, authenticated;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_calendar_event_updated_at();

commit;
