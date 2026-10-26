begin;
create function public.is_valid_dashboard_layout(candidate jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
seen text[] := '{}';
widget_id text;
begin
  if jsonb_typeof(candidate) is distinct from 'array' then return false; end if;
  if jsonb_array_length(candidate) > 4 then return false; end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(item)) <> 2 then return false; end if;
    widget_id = item->>'id';
    if widget_id is null or widget_id not in ('overview', 'capture', 'progress', 'recent') then return false; end if;
    if item->>'width' is null or item->>'width' not in ('half', 'full') then return false; end if;
    if widget_id = any(seen) then return false; end if;
    seen = array_append(seen, widget_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_dashboard_layout(jsonb) from public, anon;
grant execute on function public.is_valid_dashboard_layout(jsonb) to authenticated;

create table public.dashboard_layouts (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  layout jsonb not null default '[{"id":"overview","width":"full"},{"id":"capture","width":"half"},{"id":"progress","width":"half"},{"id":"recent","width":"full"}]'::jsonb
    check (public.is_valid_dashboard_layout(layout)),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.dashboard_layouts enable row level security;
alter table public.dashboard_layouts force row level security;
revoke all on public.dashboard_layouts from public, anon, authenticated;
grant select on public.dashboard_layouts to authenticated;
grant insert (user_id, layout) on public.dashboard_layouts to authenticated;
grant update (layout) on public.dashboard_layouts to authenticated;
create policy "dashboard_layouts_select_own" on public.dashboard_layouts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dashboard_layouts_insert_own" on public.dashboard_layouts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dashboard_layouts_update_own" on public.dashboard_layouts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create function public.set_dashboard_layout_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision = old.revision + 1;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_dashboard_layout_revision() from public, anon, authenticated;
create trigger dashboard_layouts_set_revision before update on public.dashboard_layouts
  for each row execute function public.set_dashboard_layout_revision();
commit;
