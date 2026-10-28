begin;
create function public.planner_task_project_choices(p_task uuid,p_query text default '',p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_task is null or p_query is null or char_length(p_query)>100 or p_offset is null or p_offset not between 0 and 999980 or p_offset%20<>0 then raise exception 'Invalid task/query/page' using errcode='22023';end if;
 perform 1 from public.tasks where id=p_task and user_id=auth.uid();if not found then raise exception 'Task unavailable' using errcode='42501';end if;
 return (with matches as(
 select p.id as project_id,p.title,p.status,coalesce(i.active,false) as active,coalesce(i.revision,0) as revision,case when i.active then 0 when i.revision is not null then 1 else 2 end as link_rank
 from public.projects p left join public.project_items i on i.project_id=p.id and i.user_id=p.user_id and i.kind='task' and i.target_id=p_task
 where p.user_id=auth.uid() and strpos(lower(p.title),lower(trim(p_query)))>0
 ),page as(select * from matches order by link_rank,lower(title),project_id limit 20 offset p_offset)
 select jsonb_build_object('task_id',p_task,'query',trim(p_query),'offset',p_offset,'more',(select count(*)>p_offset+20 from matches),'items',coalesce((select jsonb_agg(to_jsonb(page)-'link_rank' order by link_rank,lower(title),project_id) from page),'[]'::jsonb)));
end;$$;
create function public.planner_task_project_badges(p_tasks uuid[]) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_tasks is null or cardinality(p_tasks)>200 or coalesce(array_ndims(p_tasks),1)<>1 then raise exception 'Invalid task set' using errcode='22023';end if;
 return (with owned as(select id from public.tasks where id=any(p_tasks) and user_id=auth.uid()),badges as(
 select t.id as task_id,
 (select count(*) from public.project_items i where i.task_id=t.id and i.kind='task' and i.user_id=auth.uid() and i.active) as total,
 coalesce((select jsonb_agg(to_jsonb(picked) order by lower(title),id) from (
 select p.id,p.title from public.project_items i join public.projects p on p.id=i.project_id and p.user_id=i.user_id where i.task_id=t.id and i.kind='task' and i.user_id=auth.uid() and i.active order by lower(p.title),p.id limit 3
 ) picked),'[]'::jsonb) as projects from owned t
 ) select coalesce(jsonb_agg(to_jsonb(badges) order by task_id),'[]'::jsonb) from badges);
end;$$;
revoke all on function public.planner_task_project_choices(uuid,text,integer),public.planner_task_project_badges(uuid[]) from public,anon;
grant execute on function public.planner_task_project_choices(uuid,text,integer),public.planner_task_project_badges(uuid[]) to authenticated;
commit;