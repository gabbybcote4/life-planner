begin;
create table public.spaces (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100 and title ~ '[^[:space:]]'),
 revision integer not null default 1 check(revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.space_pages (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 space_id uuid not null,
 title text not null check(char_length(title) between 1 and 200 and title ~ '[^[:space:]]'),
 body text not null default '' check(char_length(body)<=20000),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(space_id,user_id) references public.spaces(id,user_id) on delete cascade
);
create index spaces_owner_idx on public.spaces(user_id,created_at,id);
create index space_pages_owner_idx on public.space_pages(user_id,space_id,updated_at desc,id);
alter table public.spaces enable row level security;
alter table public.spaces force row level security;
alter table public.space_pages enable row level security;
alter table public.space_pages force row level security;
revoke all on public.spaces,public.space_pages from public,anon,authenticated;
grant select on public.spaces,public.space_pages to authenticated;
grant insert(id,user_id,title) on public.spaces to authenticated;
grant update(title) on public.spaces to authenticated;
grant insert(id,user_id,space_id,title,body) on public.space_pages to authenticated;
grant update(title,body) on public.space_pages to authenticated;
create policy spaces_read on public.spaces for select to authenticated using((select auth.uid())=user_id);
create policy spaces_create on public.spaces for insert to authenticated with check((select auth.uid())=user_id);
create policy spaces_edit on public.spaces for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy space_pages_read on public.space_pages for select to authenticated using((select auth.uid())=user_id);
create policy space_pages_create on public.space_pages for insert to authenticated with check((select auth.uid())=user_id);
create policy space_pages_edit on public.space_pages for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create function public.advance_space_revision() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();new.revision=old.revision+1;return new;end;
$$;
revoke all on function public.advance_space_revision() from public,anon,authenticated;
create trigger spaces_revision before update on public.spaces for each row execute function public.advance_space_revision();
create trigger space_pages_revision before update on public.space_pages for each row execute function public.advance_space_revision();
commit;
