begin;
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200 and title ~ '[^[:space:]]'),
  body text not null default '' check (char_length(body) <= 20000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc, id);
alter table public.notes enable row level security;
alter table public.notes force row level security;
revoke all on public.notes from public, anon, authenticated;
grant select on public.notes to authenticated;
grant insert (id, user_id, title, body) on public.notes to authenticated;
grant update (title, body) on public.notes to authenticated;
create policy "notes_select_own" on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.notes
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create function public.set_note_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;
revoke all on function public.set_note_revision() from public, anon, authenticated;
create trigger notes_set_revision before update on public.notes
  for each row execute function public.set_note_revision();
commit;
