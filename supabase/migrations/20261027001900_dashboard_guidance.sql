begin;
create function public.planner_dashboard_guidance(p_today date)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if p_today is null or p_today not between date '1900-01-01' and date '2100-12-31' then
  raise exception 'Invalid planner date' using errcode='22023';
 end if;
 return (
 with owned as (
  select t.id,t.title,t.due_date,t.priority,t.created_at,t.space_id,s.title as space_title,
   case when t.due_date<p_today then 0 when t.due_date=p_today then 1
    when t.priority='high' then 2 when t.due_date<=p_today+7 then 3
    when t.due_date is not null or t.priority<>'none' then 4 else 5 end as category,
   case t.priority when 'high' then 0 when 'medium' then 1 when 'low' then 2 else 3 end as priority_rank
  from public.tasks t left join public.spaces s on s.id=t.space_id and s.user_id=(select auth.uid())
  where t.user_id=(select auth.uid()) and not t.completed
 ), ranked as (
  select * from owned order by category,due_date asc nulls last,priority_rank,created_at,id limit 3
 ), upcoming as (
  select id,title,event_date from public.calendar_events
  where user_id=(select auth.uid()) and event_date>=p_today order by event_date,id limit 3
 )
 select jsonb_build_object(
  'open',(select count(*) from owned),
  'overdue',(select count(*) from owned where due_date<p_today),
  'today',(select count(*) from owned where due_date=p_today),
  'unplanned',(select count(*) from owned where due_date is null and priority='none'),
  'events_today',(select count(*) from public.calendar_events where user_id=(select auth.uid()) and event_date=p_today),
  'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'due_date',due_date,'priority',priority,'space_id',space_id,'space_title',space_title) order by category,due_date asc nulls last,priority_rank,created_at,id) from ranked),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'event_date',event_date) order by event_date,id) from upcoming),'[]'::jsonb)
 ));
end;
$$;
revoke all on function public.planner_dashboard_guidance(date) from public,anon;
grant execute on function public.planner_dashboard_guidance(date) to authenticated;
create index tasks_user_updated_idx on public.tasks(user_id,updated_at desc,id);
create index calendar_events_user_updated_idx on public.calendar_events(user_id,updated_at desc,id);
-- The guidance widget is optional; all existing defaults/layouts/revisions remain unchanged.

create or replace function public.is_valid_dashboard_layout(candidate jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
seen text[] := '{}';
widget_id text;
begin
  if jsonb_typeof(candidate) is distinct from 'array' then return false; end if;
  if jsonb_array_length(candidate) > 9 then return false; end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(item)) not between 2 and 3 then return false; end if;
    if exists(select 1 from jsonb_object_keys(item) as keys(key) where key not in('id','width','accent')) then return false; end if;
    if item ? 'accent' then
      if jsonb_typeof(item->'accent') is distinct from 'string' or item->>'accent' not in('pink','mint','blue','yellow','lilac') then return false; end if;
    end if;
    widget_id = item->>'id';
    if widget_id is null or widget_id not in ('overview', 'capture', 'progress', 'recent', 'spaces', 'calendar', 'connections', 'timer', 'guidance') then return false; end if;
    if item->>'width' is null or item->>'width' not in ('half', 'full') then return false; end if;
    if widget_id = any(seen) then return false; end if;
    seen = array_append(seen, widget_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_dashboard_layout(jsonb) from public, anon;
grant execute on function public.is_valid_dashboard_layout(jsonb) to authenticated;





commit;
