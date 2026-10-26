begin;
-- Read-only helpers execute with the caller's existing table permissions and RLS.
create function public.planner_link_documents()
returns table(kind text,id uuid,title text,space_id uuid,space_title text,body text)
language sql stable security invoker set search_path='' as $$
 select 'note'::text,n.id,n.title,null::uuid,null::text,n.body
 from public.notes n where n.user_id=(select auth.uid())
 union all
 select 'page'::text,p.id,p.title,p.space_id,s.title,p.body
 from public.space_pages p join public.spaces s on s.id=p.space_id and s.user_id=p.user_id
 where p.user_id=(select auth.uid()) and s.user_id=(select auth.uid());
$$;
create function public.planner_extract_links(p_body text)
returns table(kind text,id uuid)
language sql immutable security invoker set search_path='' as $$
 select distinct lower(m[2]),lower(m[3])::uuid
 from pg_catalog.regexp_matches(left(coalesce(p_body,''),20000),
 '\[\[([^\[\]\r\n|]{1,200})\|(note|page):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]','gi') as m;
$$;
create function public.planner_link_catalog(p_query text default '',p_offset integer default 0)
returns table(kind text,id uuid,title text,space_id uuid,space_title text)
language sql stable security invoker set search_path='' as $$
 select d.kind,d.id,d.title,d.space_id,d.space_title
 from public.planner_link_documents() d
 where strpos(lower(d.title || ' ' || coalesce(d.space_title,'')),lower(left(trim(coalesce(p_query,'')),100)))>0
 order by d.title,d.kind,d.id
 limit 21 offset greatest(0,least(coalesce(p_offset,0),999999));
$$;
create function public.planner_link_connections(p_kind text,p_id uuid,p_direction text,p_offset integer default 0)
returns table(kind text,id uuid,title text,space_id uuid,space_title text)
language sql stable security invoker set search_path='' as $$
 with docs as materialized (select * from public.planner_link_documents()),
 target as (select * from docs d where d.kind=p_kind and d.id=p_id),
 connected as (
  select distinct d.kind,d.id,d.title,d.space_id,d.space_title
  from target t cross join lateral public.planner_extract_links(t.body) l
  join docs d on d.kind=l.kind and d.id=l.id
  where p_direction='outgoing'
  union
  select d.kind,d.id,d.title,d.space_id,d.space_title from docs d
  where p_direction='backlinks' and exists(select 1 from target)
   and exists(select 1 from public.planner_extract_links(d.body) l where l.kind=p_kind and l.id=p_id)
 )
 select c.kind,c.id,c.title,c.space_id,c.space_title from connected c
 order by c.title,c.kind,c.id
 limit 21 offset greatest(0,least(coalesce(p_offset,0),999999));
$$;
revoke all on function public.planner_link_documents() from public,anon,authenticated;
revoke all on function public.planner_extract_links(text) from public,anon,authenticated;
revoke all on function public.planner_link_catalog(text,integer) from public,anon,authenticated;
revoke all on function public.planner_link_connections(text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.planner_link_documents() to authenticated;
grant execute on function public.planner_extract_links(text) to authenticated;
grant execute on function public.planner_link_catalog(text,integer) to authenticated;
grant execute on function public.planner_link_connections(text,uuid,text,integer) to authenticated;
commit;
