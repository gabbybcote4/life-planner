begin;
alter table public.tasks add column repeat_series_id uuid,add column repeat_scheduled_date date;
-- Existing pending heads seed their future lineage; completed history stays unchanged.
update public.tasks set repeat_series_id=id,repeat_scheduled_date=due_date where repeat_frequency<>'none';
create table public.task_repeat_changes(
 user_id uuid not null references auth.users(id) on delete cascade,
 series_id uuid not null,occurrence_index integer not null check(occurrence_index between 1 and 1000000),
 kind text not null check(kind in('one','future')),source_id uuid not null,target_id uuid not null,
 scheduled_date date not null check(scheduled_date between date '1900-01-01' and date '2100-12-31'),
 scheduled_time time,scheduled_timezone text,created_at timestamptz not null default now(),
 primary key(user_id,series_id,occurrence_index),
 foreign key(source_id,user_id) references public.tasks(id,user_id) on delete cascade,
 foreign key(target_id,user_id) references public.tasks(id,user_id) on delete cascade,
 check((scheduled_time is null and scheduled_timezone is null) or (scheduled_time is not null and public.planner_valid_task_zone(scheduled_timezone)))
);
create table public.task_reschedule_receipts(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,target_id uuid not null,created_at timestamptz not null default now(),
 foreign key(target_id,user_id) references public.tasks(id,user_id) on delete cascade
);
alter table public.task_repeat_changes enable row level security;
alter table public.task_repeat_changes force row level security;
alter table public.task_reschedule_receipts enable row level security;
alter table public.task_reschedule_receipts force row level security;
revoke all on public.task_repeat_changes,public.task_reschedule_receipts from public,anon,authenticated;
grant select on public.task_repeat_changes,public.task_reschedule_receipts to authenticated;
create policy repeat_changes_read_own on public.task_repeat_changes for select to authenticated using(user_id=(select auth.uid()));
create policy reschedule_receipts_read_own on public.task_reschedule_receipts for select to authenticated using(user_id=(select auth.uid()));

-- Central next-occurrence resolver shared by completion and read-only projections.
create function public.planner_repeat_step(t public.tasks) returns public.tasks
language plpgsql stable security invoker set search_path='' as $$
declare next_task public.tasks%rowtype=t;original public.task_repeat_changes%rowtype;next_date date;i integer;
begin
 if auth.uid() is null or t.user_id is distinct from auth.uid() then raise exception 'Unavailable repeat' using errcode='42501';end if;
 if t.repeat_frequency='none' then return null;end if;
 next_task.due_date=coalesce(t.repeat_scheduled_date,t.due_date);
 select * into original from public.task_repeat_changes where user_id=auth.uid() and series_id=t.repeat_series_id and occurrence_index=t.repeat_index and kind='one' and target_id=t.id;
 if found then next_task.due_time=original.scheduled_time;next_task.due_timezone=original.scheduled_timezone;end if;
 for i in 1..1001 loop
  next_date=public.planner_task_repeat_next(next_task);
  if next_date is null then return null;end if;
  next_task.due_date=next_date;next_task.repeat_scheduled_date=next_date;next_task.repeat_index=next_task.repeat_index+1;
  if exists(select 1 from public.task_repeat_changes where user_id=auth.uid() and series_id=t.repeat_series_id and kind='future' and occurrence_index<=next_task.repeat_index) then return null;end if;
  if not exists(select 1 from public.task_repeat_changes where user_id=auth.uid() and series_id=t.repeat_series_id and kind='one' and occurrence_index=next_task.repeat_index) then return next_task;end if;
 end loop;
 raise exception 'Too many moved occurrences' using errcode='54000';
end;$$;
revoke all on function public.planner_repeat_step(public.tasks) from public,anon;
grant execute on function public.planner_repeat_step(public.tasks) to authenticated;

create or replace function public.planner_prepare_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.tasks%rowtype;derived public.tasks%rowtype;single_move boolean;
begin
 if tg_op='INSERT' then
  select * into parent from public.tasks where repeat_next_id=new.id and user_id=new.user_id;
  if found then
   if not parent.completed or parent.repeat_frequency='none' or parent.repeat_finished or auth.uid() is distinct from new.user_id then raise exception 'Repeat parent unavailable' using errcode='42501';end if;
   new.repeat_parent_id=parent.id;
  end if;
 else
  if (new.due_date,new.due_time,new.due_timezone,new.repeat_rule,new.repeat_frequency,new.repeat_series_id) is distinct from (old.due_date,old.due_time,old.due_timezone,old.repeat_rule,old.repeat_frequency,old.repeat_series_id) then
   if (old.completed and (old.repeat_frequency<>'none' or new.repeat_frequency<>'none')) or (old.repeat_frequency<>'none' and exists(select 1 from public.tasks where repeat_parent_id=old.id and user_id=old.user_id)) then raise exception 'Edit next occurrence instead' using errcode='23514';end if;
  end if;
  if old.due_date is null and old.repeat_parent_id is not null then
   select * into parent from public.tasks where id=old.repeat_parent_id and user_id=new.user_id;
   derived=public.planner_repeat_step(parent);
   if derived.id is null then raise exception 'No next occurrence' using errcode='23514';end if;
   new.repeat_anchor_day=derived.repeat_anchor_day;new.repeat_anchor_date=derived.repeat_anchor_date;new.repeat_index=derived.repeat_index;
   new.repeat_series_id=derived.repeat_series_id;new.repeat_scheduled_date=derived.repeat_scheduled_date;
  elsif (new.repeat_frequency,new.due_date,new.repeat_rule,new.repeat_series_id) is distinct from (old.repeat_frequency,old.due_date,old.repeat_rule,old.repeat_series_id) then
   single_move=new.repeat_series_id is not distinct from old.repeat_series_id and new.repeat_frequency=old.repeat_frequency and new.repeat_rule is not distinct from old.repeat_rule
    and exists(select 1 from public.task_repeat_changes where user_id=new.user_id and series_id=old.repeat_series_id and occurrence_index=old.repeat_index and kind='one' and target_id=old.id);
   if not single_move then
    new.repeat_anchor_day=extract(day from new.due_date)::integer;new.repeat_anchor_date=new.due_date;new.repeat_index=1;new.repeat_finished=false;
    new.repeat_scheduled_date=case when new.repeat_frequency='none' then null else new.due_date end;
    new.repeat_series_id=case when new.repeat_frequency='none' then null when new.repeat_series_id is distinct from old.repeat_series_id then new.repeat_series_id else gen_random_uuid() end;
   end if;
  end if;
  if not old.completed and new.completed and new.repeat_frequency<>'none' then derived=public.planner_repeat_step(new);new.repeat_finished=derived.id is null;end if;
 end if;
 return new;
end;$$;
-- A moved occurrence may leave its original weekly weekday or ending date.
alter table public.tasks drop constraint tasks_custom_repeat_rule;
alter table public.tasks add constraint tasks_custom_repeat_rule check(
 (repeat_frequency='custom' and public.planner_valid_repeat_rule(repeat_rule) and repeat_anchor_date is not null
  and (repeat_rule->>'ends'<>'on' or (repeat_rule->>'end_date')::date>=coalesce(repeat_scheduled_date,due_date))
  and (repeat_rule->>'unit'<>'week' or repeat_rule->'weekdays' @> to_jsonb(array[extract(dow from coalesce(repeat_scheduled_date,due_date))::integer])))
 or (repeat_frequency<>'custom' and repeat_rule is null));
create or replace function public.planner_complete_task_repeat() returns trigger
language plpgsql security invoker set search_path='' as $$
declare next_task public.tasks%rowtype;existing_parent uuid;
begin
 if old.completed or not new.completed or new.repeat_frequency='none' or new.repeat_finished then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Repeat owner unavailable' using errcode='42501';end if;
 select repeat_parent_id into existing_parent from public.tasks where id=new.repeat_next_id and user_id=new.user_id;
 if found then if existing_parent is distinct from new.id then raise exception 'Repeat identity conflict' using errcode='23505';end if;return new;end if;
 next_task=public.planner_repeat_step(new);if next_task.id is null then return new;end if;
 insert into public.tasks(id,user_id,title,space_id) values(new.repeat_next_id,new.user_id,new.title,new.space_id);
 update public.tasks set due_date=next_task.due_date,priority=new.priority,repeat_frequency=next_task.repeat_frequency,repeat_rule=next_task.repeat_rule,due_time=next_task.due_time,due_timezone=next_task.due_timezone where id=new.repeat_next_id and user_id=new.user_id;
 insert into public.project_items(project_id,user_id,kind,target_id,task_id)
 select project_id,new.user_id,'task',new.repeat_next_id,new.repeat_next_id from public.project_items where user_id=new.user_id and kind='task' and task_id=new.id and active;
 return new;
end;$$;

-- Only this narrow, authenticated entry point writes changes/receipts. Clients
-- cannot forge them or update internal task identity/anchor fields directly.
create function public.planner_reschedule_task(p_request uuid,p_source uuid,p_revision integer,p_index integer,p_scheduled date,p_date date,p_time time,p_zone text,p_scope text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid=auth.uid();source public.tasks%rowtype;occurrence public.tasks%rowtype;prior public.task_reschedule_receipts%rowtype;payload jsonb;target uuid;rule jsonb;delta integer;steps integer=0;is_current boolean;
begin
 if owner_id is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_request is null or p_source is null or p_revision is null or p_revision<1 or p_index is null or p_index<0 or p_index>1000000 or p_scheduled is null or p_date is null or p_date not between date '1900-01-01' and date '2100-12-31' or p_scope is null or p_scope not in('one','future')
 or (p_time is null and p_zone is not null) or (p_time is not null and (p_time>=time '24:00' or extract(second from p_time)<>0 or not public.planner_valid_task_zone(p_zone))) then raise exception 'Invalid move' using errcode='22023';end if;
 payload=jsonb_build_object('source',p_source,'revision',p_revision,'index',p_index,'scheduled',p_scheduled,'date',p_date,'time',p_time,'zone',p_zone,'scope',p_scope);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text||p_request::text,0));
 select * into prior from public.task_reschedule_receipts where user_id=owner_id and id=p_request;
 if found then if prior.payload is distinct from payload then raise exception 'Changed move retry' using errcode='23505';end if;return jsonb_build_object('id',prior.target_id);end if;
 select * into source from public.tasks where id=p_source and user_id=owner_id for update;
 if not found or source.completed then raise exception 'Task unavailable' using errcode='42501';end if;
 if source.planning_revision<>p_revision or exists(select 1 from public.tasks where user_id=owner_id and repeat_parent_id=source.id) then raise exception 'Task changed; reload' using errcode='40001';end if;
 occurrence=source;is_current=p_index=case when source.repeat_frequency='none' then 0 else source.repeat_index end;
 if source.repeat_frequency='none' then
  if not is_current or p_scope<>'one' or source.due_date is distinct from p_scheduled then raise exception 'Invalid occurrence' using errcode='22023';end if;
 else
  if p_index<source.repeat_index then raise exception 'Earlier occurrence unavailable' using errcode='22023';end if;
  while occurrence.repeat_index<p_index loop
   steps=steps+1;if steps>10000 then raise exception 'Move calculation limit' using errcode='54000';end if;
   occurrence=public.planner_repeat_step(occurrence);
   if occurrence.id is null or occurrence.repeat_index>p_index then raise exception 'Occurrence already moved or ended' using errcode='40001';end if;
  end loop;
  if occurrence.repeat_scheduled_date is distinct from p_scheduled then raise exception 'Schedule changed' using errcode='40001';end if;
 end if;
 if p_date=occurrence.due_date and p_time is not distinct from occurrence.due_time and p_zone is not distinct from occurrence.due_timezone then raise exception 'Choose a new date or time' using errcode='22023';end if;
 target=case when is_current then source.id else gen_random_uuid() end;
 if source.repeat_frequency<>'none' and p_scope='one' then
  insert into public.task_repeat_changes(user_id,series_id,occurrence_index,kind,source_id,target_id,scheduled_date,scheduled_time,scheduled_timezone)
  select owner_id,source.repeat_series_id,p_index,'one',source.id,target,p_scheduled,occurrence.due_time,occurrence.due_timezone where is_current
  on conflict(user_id,series_id,occurrence_index) do nothing;
 end if;
 rule=source.repeat_rule;
 if source.repeat_frequency='custom' and p_scope='future' then
  if rule->>'ends'='after' then rule=jsonb_set(rule,'{count}',to_jsonb((rule->>'count')::integer-p_index+1));end if;
  if rule->>'ends'='on' and p_date>(rule->>'end_date')::date then raise exception 'New start is after series ending' using errcode='22023';end if;
  if rule->>'unit'='week' then
   delta=p_date-p_scheduled;
   rule=jsonb_set(rule,'{weekdays}',(select jsonb_agg(day order by day) from (select distinct (((value::text)::integer+delta)%7+7)%7 as day from jsonb_array_elements(rule->'weekdays')) shifted));
  end if;
 end if;
 if is_current then
  if source.repeat_frequency='none' or p_scope='one' then update public.tasks set due_date=p_date,due_time=p_time,due_timezone=p_zone where id=source.id and user_id=owner_id;
  else
   update public.tasks set due_date=p_date,due_time=p_time,due_timezone=p_zone,repeat_rule=rule,
    repeat_series_id=gen_random_uuid()
    where id=source.id and user_id=owner_id;
  end if;
 else
  insert into public.tasks(id,user_id,title,space_id) values(target,owner_id,source.title,source.space_id);
  update public.tasks set due_date=p_date,due_time=p_time,due_timezone=p_zone,priority=source.priority,
   repeat_frequency=case when p_scope='future' then source.repeat_frequency else 'none' end,repeat_rule=case when p_scope='future' then rule else null end
   where id=target and user_id=owner_id;
  insert into public.task_repeat_changes(user_id,series_id,occurrence_index,kind,source_id,target_id,scheduled_date,scheduled_time,scheduled_timezone)
   values(owner_id,source.repeat_series_id,p_index,p_scope,source.id,target,p_scheduled,occurrence.due_time,occurrence.due_timezone);
  insert into public.project_items(project_id,user_id,kind,target_id,task_id)
   select project_id,owner_id,'task',target,target from public.project_items where user_id=owner_id and kind='task' and task_id=source.id and active;
  update public.tasks set planning_revision=planning_revision+1 where id=source.id and user_id=owner_id;
 end if;
 insert into public.task_reschedule_receipts(id,user_id,payload,target_id) values(p_request,owner_id,payload,target);
 return jsonb_build_object('id',target);
end;$$;
revoke all on function public.planner_reschedule_task(uuid,uuid,integer,integer,date,date,time,text,text) from public,anon;
grant execute on function public.planner_reschedule_task(uuid,uuid,integer,integer,date,date,time,text,text) to authenticated;
alter table public.tasks add constraint tasks_repeat_identity check(repeat_frequency='none' or (repeat_series_id is not null and repeat_scheduled_date is not null));
create or replace function public.planner_calendar_repeats(p_start date) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare source public.tasks%rowtype;cursor_task public.tasks%rowtype;next_task public.tasks%rowtype;next_date date;end_date date;steps integer=0;items jsonb='[]';
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_start is null or p_start not between date '1900-01-01' and date '2100-12-01' or extract(day from p_start)<>1 then raise exception 'Invalid calendar month' using errcode='22023';end if;
 end_date=(p_start+interval '1 month')::date;
 if (select count(*) from public.tasks where user_id=auth.uid() and not completed and repeat_frequency<>'none' and least(due_date,coalesce(repeat_scheduled_date,due_date))<end_date)>200 then raise exception 'Too many repeating sources for this view' using errcode='54000';end if;
 for source in select * from public.tasks where user_id=auth.uid() and not completed and repeat_frequency<>'none' and least(due_date,coalesce(repeat_scheduled_date,due_date))<end_date order by id loop
  -- Reopened older occurrences do not project another copy of their saved successor.
  if exists(select 1 from public.tasks where id=source.repeat_next_id and repeat_parent_id=source.id and user_id=auth.uid()) then continue;end if;
  cursor_task=source;
  loop
   steps=steps+1;
   if steps>100000 then raise exception 'Repeat preview calculation limit' using errcode='54000';end if;
   begin next_task=public.planner_repeat_step(cursor_task);next_date=next_task.due_date;
   exception when invalid_parameter_value then exit;end;
   exit when next_date is null or next_date>=end_date;
   cursor_task=next_task;
   if next_date>=p_start then
    items=items||jsonb_build_array(jsonb_build_object('source_id',source.id,'title',source.title,'due_date',next_date,'due_time',next_task.due_time,'due_timezone',next_task.due_timezone,'occurrence_index',next_task.repeat_index,'planning_revision',source.planning_revision,'scheduled_date',next_task.repeat_scheduled_date));
    if jsonb_array_length(items)>5000 then raise exception 'Too many repeat previews for this month' using errcode='54000';end if;
   end if;
  end loop;
 end loop;
 return (select coalesce(jsonb_agg(value order by value->>'due_date',value->>'due_time' nulls first,value->>'source_id'),'[]'::jsonb) from jsonb_array_elements(items));
end;$$;
revoke all on function public.planner_calendar_repeats(date) from public,anon;
grant execute on function public.planner_calendar_repeats(date) to authenticated;

create or replace function public.planner_today(p_day date,p_tasks_offset integer default 0,p_habits_offset integer default 0,p_events_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_tasks_offset is null or p_habits_offset is null or p_events_offset is null or p_tasks_offset not between 0 and 999980 or p_habits_offset not between 0 and 999980 or p_events_offset not between 0 and 999980 or p_tasks_offset%5<>0 or p_habits_offset%5<>0 or p_events_offset%5<>0 then raise exception 'Invalid day/page' using errcode='22023';end if;
 return (with tasks as (
 select t.id,t.title,t.completed,t.created_at,t.due_date,t.due_time,t.due_timezone,t.priority,t.planning_revision,t.repeat_frequency,t.repeat_anchor_day,t.repeat_next_id,t.repeat_parent_id,t.repeat_rule,t.repeat_anchor_date,t.repeat_index,t.repeat_finished,t.repeat_series_id,t.repeat_scheduled_date,t.space_id,case when s.id is not null then jsonb_build_object('title',s.title) else null end as space,
 case t.priority when 'high' then 0 when 'medium' then 1 when 'low' then 2 else 3 end as priority_rank
 from public.tasks t left join public.spaces s on s.id=t.space_id and s.user_id=t.user_id
 where t.user_id=auth.uid() and not t.completed and t.due_date<=p_day
 ),task_page as(select * from tasks order by due_date,priority_rank,due_time nulls first,created_at,id limit 5 offset p_tasks_offset),
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
 'tasks',coalesce((select jsonb_agg(to_jsonb(task_page)-'priority_rank' order by due_date,priority_rank,due_time nulls first,created_at,id) from task_page),'[]'::jsonb),
 'habits',coalesce((select jsonb_agg(to_jsonb(habit_page)-array['user_id','created_at','checked'] order by checked,created_at,id) from habit_page),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(to_jsonb(event_page) order by title,id) from event_page),'[]'::jsonb)));
end;$$;
revoke all on function public.planner_today(date,integer,integer,integer) from public,anon;
grant execute on function public.planner_today(date,integer,integer,integer) to authenticated;



create or replace function public.planner_export_data() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare owner_id uuid=auth.uid();entry record;n bigint;bytes bigint;total_rows bigint=0;total_bytes bigint=0;rows jsonb;data jsonb='{}';counts jsonb='{}';links jsonb;result jsonb;
begin
 if owner_id is null then raise exception 'Sign in to export' using errcode='42501';end if;
 for entry in select * from (values
 ('task_repeat_changes','series_id,occurrence_index,kind,source_id,target_id,scheduled_date,scheduled_time,scheduled_timezone,created_at','series_id,occurrence_index'),
 ('task_reschedule_receipts','id,payload,target_id,created_at','id'),
 ('tasks','id,title,completed,created_at,updated_at,due_date,priority,planning_revision,space_id,repeat_frequency,repeat_anchor_day,repeat_next_id,repeat_parent_id,repeat_rule,repeat_anchor_date,repeat_index,repeat_finished,due_time,due_timezone,repeat_series_id,repeat_scheduled_date','id'),
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
 ('planner_preferences','theme,updated_at,background_pattern,background_intensity,background_revision,nav_position,nav_revision,font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background,text_revision,zoom_revision,accessibility_revision,week_start,date_format,planning_revision,show_task_timezones','updated_at'),
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
 result=jsonb_build_object('format','life-planner-export','format_version',6,'exported_at',to_char(transaction_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'total_records',total_rows,'counts',counts,'data',data);
 if total_rows>50000 or octet_length(result::text)>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
 return result;
end;$$;
revoke all on function public.planner_export_data() from public,anon;
grant execute on function public.planner_export_data() to authenticated;






commit;
