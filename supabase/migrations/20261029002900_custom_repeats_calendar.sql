begin;
-- Extend the applied repeat foundation; never rerun/edit migration 028.
alter table public.tasks drop constraint tasks_repeat_frequency_check;
alter table public.tasks add constraint tasks_repeat_frequency_check check(repeat_frequency in('none','daily','weekdays','weekly','monthly','yearly','custom'));
alter table public.tasks
 add column repeat_rule jsonb,
 add column repeat_anchor_date date,
 add column repeat_index integer not null default 1 check(repeat_index between 1 and 1000000),
 add column repeat_finished boolean not null default false;
update public.tasks set repeat_anchor_date=due_date where due_date is not null;
grant update(repeat_rule) on public.tasks to authenticated;

create function public.planner_valid_repeat_rule(r jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
 if r is null or jsonb_typeof(r)<>'object' or (select count(*) from jsonb_object_keys(r))<>8 or exists(select 1 from jsonb_object_keys(r) as keys(key) where key not in('interval','unit','weekdays','monthly_mode','ends','end_date','count')) then return false;end if;
 if jsonb_typeof(r->'interval')<>'number' or (r->>'interval')!~'^[1-9][0-9]?$' or jsonb_typeof(r->'unit') is distinct from 'string' or jsonb_typeof(r->'monthly_mode') is distinct from 'string' or jsonb_typeof(r->'ends') is distinct from 'string' or r->>'unit' not in('day','week','month','year') or r->>'monthly_mode' not in('date','weekday','last_weekday') or r->>'ends' not in('never','on','after') then return false;end if;
 if jsonb_typeof(r->'weekdays')<>'array' then return false;end if;
 if exists(select 1 from jsonb_array_elements(r->'weekdays') as days(day) where jsonb_typeof(day)<>'number' or day::text!~'^[0-6]$') or (select count(*)<>count(distinct day) from jsonb_array_elements(r->'weekdays') as days(day)) then return false;end if;
 if r->>'unit'='week' then if jsonb_array_length(r->'weekdays') not between 1 and 7 then return false;end if;
 else if jsonb_array_length(r->'weekdays')<>0 then return false;end if;end if;
 if r->>'unit'<>'month' and r->>'monthly_mode'<>'date' then return false;end if;
 if r->>'ends'='on' then
  if jsonb_typeof(r->'end_date')<>'string' or (r->>'end_date')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (r->>'end_date')::date not between date '1900-01-01' and date '2100-12-31' or r->'count'<>'null'::jsonb then return false;end if;
 else if r->'end_date'<>'null'::jsonb then return false;end if;end if;
 if r->>'ends'='after' then
  if jsonb_typeof(r->'count')<>'number' or (r->>'count')!~'^[1-9][0-9]{0,2}$' then return false;end if;
 else if r->'count'<>'null'::jsonb then return false;end if;end if;
 return true;
exception when others then return false;
end;$$;
alter table public.tasks add constraint tasks_custom_repeat_rule check(
 (repeat_frequency='custom' and public.planner_valid_repeat_rule(repeat_rule) and repeat_anchor_date is not null
  and (repeat_rule->>'ends'<>'on' or (repeat_rule->>'end_date')::date>=due_date)
  and (repeat_rule->>'unit'<>'week' or repeat_rule->'weekdays' @> to_jsonb(array[extract(dow from due_date)::integer])))
 or (repeat_frequency<>'custom' and repeat_rule is null));

create function public.planner_task_repeat_next(t public.tasks) returns date
language plpgsql immutable security invoker set search_path='' as $$
declare r jsonb=t.repeat_rule;step integer;unit text;candidate date;origin date=coalesce(t.repeat_anchor_date,t.due_date);first_day date;last_day date;months integer;ordinal integer;dow integer;i integer;
begin
 if t.repeat_frequency='none' then return null;end if;
 if t.due_date is null then raise exception 'Repeat needs date' using errcode='22023';end if;
 if t.repeat_frequency not in('custom','yearly') then return public.planner_next_task_date(t.due_date,t.repeat_frequency,t.repeat_anchor_day);end if;
 if t.repeat_frequency='yearly' then step=1;unit='year';
 else
  if not public.planner_valid_repeat_rule(r) then raise exception 'Invalid custom repeat' using errcode='22023';end if;
  if r->>'ends'='after' and t.repeat_index>=(r->>'count')::integer then return null;end if;
  step=(r->>'interval')::integer;unit=r->>'unit';
 end if;
 case unit
 when 'day' then candidate=t.due_date+step;
 when 'week' then
  for i in 1..(7*(step+1)) loop
   candidate=t.due_date+i;
   exit when r->'weekdays' @> to_jsonb(array[extract(dow from candidate)::integer])
    and ((date_trunc('week',candidate::timestamp)::date-date_trunc('week',origin::timestamp)::date)/7)%step=0;
  end loop;
 when 'month' then
  months=((extract(year from t.due_date)::integer-extract(year from origin)::integer)*12+extract(month from t.due_date)::integer-extract(month from origin)::integer)/step*step+step;
  loop
   first_day=(date_trunc('month',origin::timestamp)+make_interval(months=>months))::date;
   if r->>'ends'='on' and first_day>(r->>'end_date')::date then return null;end if;
   if first_day>date '2100-12-31' then raise exception 'Repeat range exceeded' using errcode='22023';end if;
   last_day=(first_day+interval '1 month - 1 day')::date;dow=extract(dow from origin)::integer;
   if r->>'monthly_mode'='date' then candidate=first_day+least(t.repeat_anchor_day,extract(day from last_day)::integer)-1;
   elsif r->>'monthly_mode'='last_weekday' then candidate=last_day-((extract(dow from last_day)::integer-dow+7)%7);
   else
    ordinal=(extract(day from origin)::integer-1)/7;
    candidate=first_day+((dow-extract(dow from first_day)::integer+7)%7)+ordinal*7;
   end if;
   exit when candidate<=last_day;
   months=months+step;
  end loop;
 when 'year' then
  first_day=make_date(extract(year from t.due_date)::integer+step,extract(month from origin)::integer,1);
  last_day=(first_day+interval '1 month - 1 day')::date;
  candidate=first_day+least(extract(day from origin)::integer,extract(day from last_day)::integer)-1;
 end case;
 if r->>'ends'='on' and candidate>(r->>'end_date')::date then return null;end if;
 if candidate is null or candidate<=t.due_date or candidate>date '2100-12-31' then raise exception 'Repeat range exceeded' using errcode='22023';end if;
 return candidate;
end;$$;

create or replace function public.planner_prepare_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.tasks%rowtype;
begin
 if tg_op='INSERT' then
  select * into parent from public.tasks where repeat_next_id=new.id and user_id=new.user_id;
  if found then
   if not parent.completed or parent.repeat_frequency='none' or parent.repeat_finished or auth.uid() is distinct from new.user_id then raise exception 'Repeat parent unavailable' using errcode='42501';end if;
   new.repeat_parent_id=parent.id;
  end if;
 else
  if new.repeat_frequency is distinct from old.repeat_frequency or new.due_date is distinct from old.due_date or new.repeat_rule is distinct from old.repeat_rule then
   if (old.completed and (old.repeat_frequency<>'none' or new.repeat_frequency<>'none')) or (old.repeat_frequency<>'none' and exists(select 1 from public.tasks where repeat_parent_id=old.id and user_id=old.user_id)) then raise exception 'Edit next occurrence instead' using errcode='23514';end if;
   new.repeat_anchor_day=extract(day from new.due_date)::integer;new.repeat_anchor_date=new.due_date;new.repeat_index=1;new.repeat_finished=false;
   if old.due_date is null and old.repeat_parent_id is not null then
    select * into parent from public.tasks where id=old.repeat_parent_id and user_id=new.user_id;
    if found then new.repeat_anchor_day=parent.repeat_anchor_day;new.repeat_anchor_date=parent.repeat_anchor_date;new.repeat_index=parent.repeat_index+1;end if;
   end if;
  end if;
  if not old.completed and new.completed and new.repeat_frequency<>'none' then new.repeat_finished=public.planner_task_repeat_next(new) is null;end if;
 end if;
 return new;
end;$$;
create or replace function public.bump_task_planning_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.due_date is distinct from old.due_date or new.priority is distinct from old.priority or new.repeat_frequency is distinct from old.repeat_frequency or new.repeat_rule is distinct from old.repeat_rule then new.planning_revision=old.planning_revision+1;end if;
 return new;
end;$$;
create or replace function public.planner_complete_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare next_date date;existing_parent uuid;
begin
 if old.completed or not new.completed or new.repeat_frequency='none' or new.repeat_finished then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Repeat owner unavailable' using errcode='42501';end if;
 select repeat_parent_id into existing_parent from public.tasks where id=new.repeat_next_id and user_id=new.user_id;
 if found then
  if existing_parent is distinct from new.id then raise exception 'Repeat identity conflict' using errcode='23505';end if;
  return new;
 end if;
 next_date=public.planner_task_repeat_next(new);
 if next_date is null then return new;end if;
 insert into public.tasks(id,user_id,title,space_id) values(new.repeat_next_id,new.user_id,new.title,new.space_id);
 update public.tasks set due_date=next_date,priority=new.priority,repeat_frequency=new.repeat_frequency,repeat_rule=new.repeat_rule where id=new.repeat_next_id and user_id=new.user_id;
 insert into public.project_items(project_id,user_id,kind,target_id,task_id)
 select project_id,new.user_id,'task',new.repeat_next_id,new.repeat_next_id from public.project_items where user_id=new.user_id and kind='task' and task_id=new.id and active;
 return new;
end;$$;
revoke all on function public.planner_valid_repeat_rule(jsonb),public.planner_task_repeat_next(public.tasks) from public,anon;
grant execute on function public.planner_valid_repeat_rule(jsonb),public.planner_task_repeat_next(public.tasks) to authenticated;
create or replace function public.planner_today(p_day date,p_tasks_offset integer default 0,p_habits_offset integer default 0,p_events_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_tasks_offset is null or p_habits_offset is null or p_events_offset is null or p_tasks_offset not between 0 and 999980 or p_habits_offset not between 0 and 999980 or p_events_offset not between 0 and 999980 or p_tasks_offset%5<>0 or p_habits_offset%5<>0 or p_events_offset%5<>0 then raise exception 'Invalid day/page' using errcode='22023';end if;
 return (with tasks as (
 select t.id,t.title,t.completed,t.created_at,t.due_date,t.priority,t.planning_revision,t.repeat_frequency,t.repeat_anchor_day,t.repeat_next_id,t.repeat_parent_id,t.repeat_rule,t.repeat_anchor_date,t.repeat_index,t.repeat_finished,t.space_id,case when s.id is not null then jsonb_build_object('title',s.title) else null end as space,
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
 ('tasks','id,title,completed,created_at,updated_at,due_date,priority,planning_revision,space_id,repeat_frequency,repeat_anchor_day,repeat_next_id,repeat_parent_id,repeat_rule,repeat_anchor_date,repeat_index,repeat_finished','id'),
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
 result=jsonb_build_object('format','life-planner-export','format_version',3,'exported_at',to_char(transaction_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'total_records',total_rows,'counts',counts,'data',data);
 if total_rows>50000 or octet_length(result::text)>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
 return result;
end;$$;
revoke all on function public.planner_export_data() from public,anon;
grant execute on function public.planner_export_data() to authenticated;



commit;
