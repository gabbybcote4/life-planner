begin;
create or replace function public.is_valid_dashboard_layout(candidate jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
seen text[] := '{}';
widget_id text;
begin
  if jsonb_typeof(candidate) is distinct from 'array' then return false; end if;
  if jsonb_array_length(candidate) > 7 then return false; end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(item)) <> 2 then return false; end if;
    widget_id = item->>'id';
    if widget_id is null or widget_id not in ('overview', 'capture', 'progress', 'recent', 'spaces', 'calendar', 'connections') then return false; end if;
    if item->>'width' is null or item->>'width' not in ('half', 'full') then return false; end if;
    if widget_id = any(seen) then return false; end if;
    seen = array_append(seen, widget_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_dashboard_layout(jsonb) from public, anon;
grant execute on function public.is_valid_dashboard_layout(jsonb) to authenticated;


-- Change only the default for future rows. Existing layouts/revisions are untouched.
alter table public.dashboard_layouts alter column layout set default '[{"id":"spaces","width":"full"},{"id":"overview","width":"full"},{"id":"capture","width":"half"},{"id":"progress","width":"half"},{"id":"recent","width":"full"},{"id":"calendar","width":"half"},{"id":"connections","width":"full"}]'::jsonb;
commit;
