begin;
-- Occurrences remain normal tasks. Internal IDs cannot be supplied/changed by clients.
alter table public.tasks
 add column repeat_frequency text not null default 'none' check(repeat_frequency in('none','daily','weekdays','weekly','monthly')),
 add column repeat_anchor_day integer check(repeat_anchor_day between 1 and 31),
 add column repeat_next_id uuid not null default gen_random_uuid() unique,
 add column repeat_parent_id uuid unique,
 add constraint tasks_repeat_parent_owner foreign key(repeat_parent_id,user_id) references public.tasks(id,user_id),
 add constraint tasks_repeat_date check(repeat_frequency='none' or (due_date is not null and repeat_anchor_day is not null));
grant update(repeat_frequency) on public.tasks to authenticated;

-- Pure date-only arithmetic: no server clock, time-zone inference or missed-date skipping.
create function public.planner_next_task_date(p_date date,p_frequency text,p_anchor integer) returns date
language plpgsql immutable security invoker set search_path='' as $$
declare result date;first_day date;
begin
 if p_date is null or p_date not between date '1900-01-01' and date '2100-12-31' or p_frequency is null or p_frequency not in('daily','weekdays','weekly','monthly') or p_anchor is null or p_anchor not between 1 and 31 then raise exception 'Invalid repeat date' using errcode='22023';end if;
 case p_frequency
 when 'daily' then result=p_date+1;
 when 'weekdays' then
  result=p_date+1;
  while extract(isodow from result)>5 loop result=result+1;end loop;
 when 'weekly' then result=p_date+7;
 when 'monthly' then
  first_day=(date_trunc('month',p_date::timestamp)+interval '1 month')::date;
  result=first_day+least(p_anchor,extract(day from (first_day+interval '1 month - 1 day'))::integer)-1;
 end case;
 if result>date '2100-12-31' then raise exception 'Next repeat is outside the supported date range' using errcode='22023';end if;
 return result;
end;$$;

create function public.planner_prepare_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.tasks%rowtype;
begin
 if tg_op='INSERT' then
  select * into parent from public.tasks where repeat_next_id=new.id and user_id=new.user_id;
  if found then
   if not parent.completed or parent.repeat_frequency='none' or auth.uid() is distinct from new.user_id then raise exception 'Repeat parent unavailable' using errcode='42501';end if;
   new.repeat_parent_id=parent.id;
  end if;
 else
  if new.repeat_frequency is distinct from old.repeat_frequency or new.due_date is distinct from old.due_date then
   if (old.completed and (old.repeat_frequency<>'none' or new.repeat_frequency<>'none')) or (old.repeat_frequency<>'none' and exists(select 1 from public.tasks where repeat_parent_id=old.id and user_id=old.user_id)) then raise exception 'Reopen a one-off task or edit the next occurrence instead' using errcode='23514';end if;
   new.repeat_anchor_day=extract(day from new.due_date)::integer;
   -- A fresh successor inherits the original monthly anchor (Jan 31 → Feb 28 → Mar 31).
   if old.due_date is null and old.repeat_parent_id is not null then
    select * into parent from public.tasks where id=old.repeat_parent_id and user_id=new.user_id;
    if found then new.repeat_anchor_day=parent.repeat_anchor_day;end if;
   end if;
  end if;
 end if;
 return new;
end;$$;
create trigger tasks_00_repeat_prepare before insert or update on public.tasks for each row execute function public.planner_prepare_task_repeat();

create or replace function public.bump_task_planning_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.due_date is distinct from old.due_date or new.priority is distinct from old.priority or new.repeat_frequency is distinct from old.repeat_frequency then new.planning_revision=old.planning_revision+1;end if;
 return new;
end;$$;

create function public.planner_complete_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare next_date date;existing_parent uuid;
begin
 if old.completed or not new.completed or new.repeat_frequency='none' then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Repeat owner unavailable' using errcode='42501';end if;
 select repeat_parent_id into existing_parent from public.tasks where id=new.repeat_next_id and user_id=new.user_id;
 if found then
  if existing_parent is distinct from new.id then raise exception 'Repeat identity conflict' using errcode='23505';end if;
  return new;
 end if;
 next_date=public.planner_next_task_date(new.due_date,new.repeat_frequency,new.repeat_anchor_day);
 insert into public.tasks(id,user_id,title,space_id) values(new.repeat_next_id,new.user_id,new.title,new.space_id);
 update public.tasks set due_date=next_date,priority=new.priority,repeat_frequency=new.repeat_frequency where id=new.repeat_next_id and user_id=new.user_id;
 insert into public.project_items(project_id,user_id,kind,target_id,task_id)
 select project_id,new.user_id,'task',new.repeat_next_id,new.repeat_next_id from public.project_items
 where user_id=new.user_id and kind='task' and task_id=new.id and active;
 return new;
end;$$;
create trigger tasks_repeat_complete after update of completed on public.tasks for each row execute function public.planner_complete_task_repeat();

revoke all on function public.planner_next_task_date(date,text,integer),public.planner_prepare_task_repeat(),public.planner_complete_task_repeat() from public,anon,authenticated;
grant execute on function public.planner_next_task_date(date,text,integer) to authenticated;
-- Carry recurrence into Today and export without changing prior applied migrations.

-- Read-only aggregation over original owner-scoped sources. No copies or saved layouts.
create or replace function public.planner_today(p_day date,p_tasks_offset integer default 0,p_habits_offset integer default 0,p_events_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_tasks_offset is null or p_habits_offset is null or p_events_offset is null or p_tasks_offset not between 0 and 999980 or p_habits_offset not between 0 and 999980 or p_events_offset not between 0 and 999980 or p_tasks_offset%5<>0 or p_habits_offset%5<>0 or p_events_offset%5<>0 then raise exception 'Invalid day/page' using errcode='22023';end if;
 return (with tasks as (
 select t.id,t.title,t.completed,t.created_at,t.due_date,t.priority,t.planning_revision,t.repeat_frequency,t.repeat_anchor_day,t.repeat_next_id,t.repeat_parent_id,t.space_id,case when s.id is not null then jsonb_build_object('title',s.title) else null end as space,
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


-- Single stable statement snapshot, caller permissions and existing forced RLS.
-- Only this internal allowlist supplies identifiers/columns; there are no caller arguments.
create or replace function public.planner_export_data() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare owner_id uuid=auth.uid();entry record;n bigint;bytes bigint;total_rows bigint=0;total_bytes bigint=0;rows jsonb;data jsonb='{}';counts jsonb='{}';links jsonb;result jsonb;
begin
 if owner_id is null then raise exception 'Sign in to export' using errcode='42501';end if;
 for entry in select * from (values
 ('tasks','id,title,completed,created_at,updated_at,due_date,priority,planning_revision,space_id,repeat_frequency,repeat_anchor_day,repeat_next_id,repeat_parent_id','id'),
 ('calendar_events','id,title,event_date,created_at,updated_at','id'),
 ('notes','id,title,body,revision,created_at,updated_at','id'),
 ('spaces','id,title,revision,created_at,updated_at,icon,cover,accent','id'),
 ('space_pages','id,space_id,title,body,revision,created_at,updated_at','id'),
 ('habits','id,title,kind,target,unit,schedule,weekdays,weekly_goal,space_id,start_date,paused,revision,created_at','id'),
 ('habit_checkins','habit_id,log_date,amount,target,unit,kind,revision','habit_id,log_date'),
 ('projects','id,title,description,status,space_id,revision,created_at','id'),
 ('project_items','project_id,kind,target_id,task_id,note_id,page_id,active,revision','project_id,kind,target_id'),
 ('inbox_captures','id,kind,title,body,space_id,task_id,note_id,page_id,reviewed,revision,created_at','id'),
 ('space_creation_receipts','space_id,template_key,initial_title,first_page_id,created_at','space_id'),
 ('planner_preferences','theme,updated_at,background_pattern,background_intensity,background_revision,nav_position,nav_revision,font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background,text_revision,zoom_revision,accessibility_revision,week_start,date_format,planning_revision','updated_at'),
 ('dashboard_layouts','layout,revision,updated_at','updated_at')
 ) as catalog(collection,projection,ordering) loop
  execute format('select count(*),coalesce(sum(octet_length(to_jsonb(r)::text)),0) from (select %s from public.%I where user_id=$1) r',entry.projection,entry.collection) into n,bytes using owner_id;
  total_rows=total_rows+n;total_bytes=total_bytes+bytes;
  if total_rows>50000 or total_bytes>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by %s),''[]''::jsonb) from (select %s from public.%I where user_id=$1) r',entry.ordering,entry.projection,entry.collection) into rows using owner_id;
  data=data||jsonb_build_object(entry.collection,rows);counts=counts||jsonb_build_object(entry.collection,n);
 end loop;
 with docs as materialized(select * from public.planner_link_documents()),edges as(
  select d.kind as source_kind,d.id as source_id,l.kind as target_kind,l.id as target_id
  from docs d cross join lateral public.planner_extract_links(d.body) l
  join docs target on target.kind=l.kind and target.id=l.id
 ) select coalesce(jsonb_agg(to_jsonb(e) order by source_kind,source_id,target_kind,target_id),'[]'::jsonb) into links from edges e;
 total_rows=total_rows+jsonb_array_length(links);
 data=data||jsonb_build_object('knowledge_links',links);counts=counts||jsonb_build_object('knowledge_links',jsonb_array_length(links));
 result=jsonb_build_object('format','life-planner-export','format_version',2,'exported_at',to_char(transaction_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'total_records',total_rows,'counts',counts,'data',data);
 if total_rows>50000 or octet_length(result::text)>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
 return result;
end;$$;
revoke all on function public.planner_export_data() from public,anon;
grant execute on function public.planner_export_data() to authenticated;


commit;
