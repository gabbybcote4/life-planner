begin;
alter table public.tasks add column space_id uuid;
alter table public.tasks add constraint tasks_space_owner_fkey foreign key(space_id,user_id) references public.spaces(id,user_id);
create index tasks_owner_space_created_idx on public.tasks(user_id,space_id,created_at desc,id);
grant insert(space_id) on public.tasks to authenticated;
grant update(space_id) on public.tasks to authenticated;
-- Caller privileges/RLS remain in force; no owner argument is accepted.
create or replace function public.planner_search(p_query text,p_kind text default 'all',p_offset integer default 0)
returns table(kind text,id uuid,title text,space_id uuid,space_title text,event_date date,completed boolean)
language sql stable security invoker set search_path='' as $$
 with q as (select lower(trim(left(coalesce(p_query,''),100))) as term),
 matches as (
  select 'task'::text as kind,t.id,t.title,t.space_id,s.title as space_title,null::date as event_date,t.completed
  from public.tasks t left join public.spaces s on s.id=t.space_id and s.user_id=t.user_id cross join q where t.user_id=(select auth.uid()) and q.term<>'' and (strpos(lower(t.title),q.term)>0 or strpos(lower(coalesce(s.title,'')),q.term)>0)
  union all
  select 'event',e.id,e.title,null::uuid,null::text,e.event_date,null::boolean
  from public.calendar_events e cross join q where e.user_id=(select auth.uid()) and q.term<>'' and strpos(lower(e.title||' '||e.event_date::text),q.term)>0
  union all
  select 'note',n.id,n.title,null::uuid,null::text,null::date,null::boolean
  from public.notes n cross join q where n.user_id=(select auth.uid()) and q.term<>'' and (strpos(lower(n.title),q.term)>0 or strpos(lower(n.body),q.term)>0)
  union all
  select 'space',s.id,s.title,null::uuid,null::text,null::date,null::boolean
  from public.spaces s cross join q where s.user_id=(select auth.uid()) and q.term<>'' and strpos(lower(s.title),q.term)>0
  union all
  select 'page',p.id,p.title,p.space_id,s.title,null::date,null::boolean
  from public.space_pages p join public.spaces s on s.id=p.space_id and s.user_id=p.user_id cross join q
  where p.user_id=(select auth.uid()) and s.user_id=(select auth.uid()) and q.term<>''
   and (strpos(lower(p.title),q.term)>0 or strpos(lower(p.body),q.term)>0 or strpos(lower(s.title),q.term)>0)
 )
 select m.kind,m.id,m.title,m.space_id,m.space_title,m.event_date,m.completed from matches m
 where p_kind='all' or m.kind=p_kind
 order by m.title,m.kind,m.id
 limit 21 offset greatest(0,least(coalesce(p_offset,0),999980));
$$;
revoke all on function public.planner_search(text,text,integer) from public,anon,authenticated;
grant execute on function public.planner_search(text,text,integer) to authenticated;

commit;
