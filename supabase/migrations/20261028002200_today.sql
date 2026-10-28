begin;
-- Read-only aggregation over original owner-scoped sources. No copies or saved layouts.
create function public.planner_today(p_day date,p_tasks_offset integer default 0,p_habits_offset integer default 0,p_events_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_tasks_offset is null or p_habits_offset is null or p_events_offset is null or p_tasks_offset not between 0 and 999980 or p_habits_offset not between 0 and 999980 or p_events_offset not between 0 and 999980 or p_tasks_offset%5<>0 or p_habits_offset%5<>0 or p_events_offset%5<>0 then raise exception 'Invalid day/page' using errcode='22023';end if;
 return (with tasks as (
 select t.id,t.title,t.completed,t.created_at,t.due_date,t.priority,t.planning_revision,t.space_id,case when s.id is not null then jsonb_build_object('title',s.title) else null end as space,
 case t.priority when 'high' then 0 when 'medium' then 1 when 'low' then 2 else 3 end as priority_rank
 from public.tasks t left join public.spaces s on s.id=t.space_id and s.user_id=t.user_id
 where t.user_id=auth.uid() and not t.completed and t.due_date<=p_day
 ),task_page as(select * from tasks order by due_date,priority_rank,created_at,id limit 5 offset p_tasks_offset),
 events as(select id,title,event_date from public.calendar_events where user_id=auth.uid() and event_date=p_day),
 event_page as(select * from events order by title,id limit 5 offset p_events_offset),
 habit_source as(
 select h.*,s.title as space_title,
 (select count(*)::integer from public.habit_checkins w where w.habit_id=h.id and w.user_id=auth.uid() and w.log_date>=date_trunc('week',p_day::timestamp)::date and w.log_date<date_trunc('week',p_day::timestamp)::date+7 and w.amount>=w.target) as week_done,
 (select jsonb_build_object('amount',c.amount,'target',c.target,'unit',c.unit,'kind',c.kind,'revision',c.revision) from public.habit_checkins c where c.habit_id=h.id and c.user_id=auth.uid() and c.log_date=p_day) as log
 from public.habits h left join public.spaces s on s.id=h.space_id and s.user_id=h.user_id where h.user_id=auth.uid()
 ),habits as(
 select *,coalesce((log->>'amount')::numeric>=(log->>'target')::numeric,false) as checked
 from habit_source where log is not null or (not paused and start_date<=p_day and (schedule='daily' or (schedule='weekdays' and extract(dow from p_day)::smallint=any(weekdays)) or (schedule='weekly' and week_done<weekly_goal)))
 ),habit_page as(select * from habits order by checked,created_at,id limit 5 offset p_habits_offset)
 select jsonb_build_object(
 'counts',jsonb_build_object('tasks',(select count(*) from tasks),'overdue',(select count(*) from tasks where due_date<p_day),'habits',(select count(*) from habits),'habits_done',(select count(*) from habits where checked),'events',(select count(*) from events),'undated',(select count(*) from public.tasks where user_id=auth.uid() and not completed and due_date is null)),
 'tasks',coalesce((select jsonb_agg(to_jsonb(task_page)-'priority_rank' order by due_date,priority_rank,created_at,id) from task_page),'[]'::jsonb),
 'habits',coalesce((select jsonb_agg(to_jsonb(habit_page)-array['user_id','created_at','checked'] order by checked,created_at,id) from habit_page),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(to_jsonb(event_page) order by title,id) from event_page),'[]'::jsonb)));
end;$$;
revoke all on function public.planner_today(date,integer,integer,integer) from public,anon;
grant execute on function public.planner_today(date,integer,integer,integer) to authenticated;
commit;