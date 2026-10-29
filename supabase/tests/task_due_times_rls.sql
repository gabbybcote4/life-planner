-- VERSION: TASK-TIME-CHECKS-V1. Fictional fixtures roll back.
begin;
insert into auth.users(id,email) values
 ('e931eb33-8222-4b11-8900-000000000001','task-time-a@example.invalid'),
 ('e931eb33-8222-4b11-8900-000000000002','task-time-b@example.invalid');
insert into public.tasks(id,user_id,title) values
 ('e931eb33-8222-4b11-8900-000000000011','e931eb33-8222-4b11-8900-000000000001','Clock repeat'),
 ('e931eb33-8222-4b11-8900-000000000021','e931eb33-8222-4b11-8900-000000000002','FOREIGN CLOCK');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"e931eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare t public.tasks%rowtype;child uuid;n integer;r jsonb;rev integer;
begin
 if not public.planner_valid_task_zone('America/Edmonton') or not public.planner_valid_task_zone('UTC') or public.planner_valid_task_zone('Not/A_Zone') or public.planner_valid_task_zone('EST') then raise exception 'FAIL named zone validation';end if;
 begin update public.tasks set due_time='09:00',due_timezone='America/Edmonton' where id='e931eb33-8222-4b11-8900-000000000011';raise exception 'FAIL time without date';exception when check_violation then null;end;
 update public.tasks set due_date='2026-03-07',due_time='09:00',due_timezone='America/Edmonton',repeat_frequency='daily' where id='e931eb33-8222-4b11-8900-000000000011';
 select * into t from public.tasks where id='e931eb33-8222-4b11-8900-000000000011';
 if t.planning_revision<>2 then raise exception 'FAIL clock revision';end if;
 child=t.repeat_next_id;
 begin update public.tasks set due_timezone='Not/A_Zone' where id=t.id;raise exception 'FAIL invalid zone';exception when check_violation then null;end;
 begin update public.tasks set due_time='24:00' where id=t.id;raise exception 'FAIL 24:00 accepted';exception when check_violation then null;end;
 begin update public.tasks set due_time='09:00:01' where id=t.id;raise exception 'FAIL seconds accepted';exception when check_violation then null;end;
 begin update public.tasks set due_timezone=null where id=t.id;raise exception 'FAIL missing zone';exception when check_violation then null;end;
 update public.tasks set completed=true where id=t.id;
 select * into t from public.tasks where id=child;
 if t.due_date<>'2026-03-08'::date or t.due_time<>time '09:00' or t.due_timezone<>'America/Edmonton' or t.repeat_index<>2 then raise exception 'FAIL daylight change clock carry';end if;
 rev=t.planning_revision;
 update public.tasks set due_time='10:30' where id=child;
 if not exists(select 1 from public.tasks where id=child and planning_revision=rev+1 and repeat_index=2 and repeat_anchor_date='2026-03-07') then raise exception 'FAIL time-only edit resets recurrence';end if;
 update public.tasks set due_time='11:30' where id=child and planning_revision=rev;get diagnostics n=row_count;if n<>0 then raise exception 'FAIL stale clock edit';end if;
 r=public.planner_today('2026-03-08');
 if r->'tasks'->0->>'due_time' is distinct from '10:30:00' or r->'tasks'->0->>'due_timezone' is distinct from 'America/Edmonton' then raise exception 'FAIL Today clock metadata';end if;
 begin update public.tasks set due_time='08:00' where id='e931eb33-8222-4b11-8900-000000000011';raise exception 'FAIL completed repeat clock changed';exception when check_violation then null;end;
 -- Clock-only DST policy also preserves 09:00 when the fall offset changes.
 update public.tasks set due_date='2026-10-31',due_time='09:00' where id=child;
 select * into t from public.tasks where id=child;
 update public.tasks set completed=true where id=child;
 if not exists(select 1 from public.tasks where id=t.repeat_next_id and due_date='2026-11-01' and due_time='09:00' and due_timezone='America/Edmonton') then raise exception 'FAIL fall clock carry';end if;
 child=t.repeat_next_id;
 update public.tasks set due_time=null,due_timezone=null where id=child;
 update public.tasks set completed=true where id=child;
 select * into t from public.tasks where id=child;
 if not exists(select 1 from public.tasks where id=t.repeat_next_id and due_time is null and due_timezone is null) then raise exception 'FAIL all-day successor';end if;
 update public.tasks set due_date='2026-12-01',due_time='12:00',due_timezone='UTC' where id='e931eb33-8222-4b11-8900-000000000021';get diagnostics n=row_count;if n<>0 then raise exception 'FAIL foreign clock edit';end if;
 r=public.planner_export_data();
 if (r->>'format_version')::integer not in(4,5,6) or r::text like '%FOREIGN CLOCK%' or not exists(select 1 from jsonb_array_elements(r->'data'->'tasks') x where x->>'id'='e931eb33-8222-4b11-8900-000000000011' and x->>'due_time'='09:00:00' and x->>'due_timezone'='America/Edmonton') then raise exception 'FAIL clock export';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"e931eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.tasks)<>1 then raise exception 'FAIL clock account B isolation';end if;
 update public.tasks set due_date='2026-12-01',due_time='00:00',due_timezone='UTC' where id='e931eb33-8222-4b11-8900-000000000021';
 if not exists(select 1 from public.tasks where due_time='00:00' and due_timezone='UTC') then raise exception 'FAIL own midnight save';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform 1 from public.tasks;raise exception 'FAIL anonymous time read';exception when insufficient_privilege then null;end;
 begin update public.tasks set due_time='00:00';raise exception 'FAIL anonymous time write';exception when insufficient_privilege then null;end;
 begin perform public.planner_valid_task_zone('UTC');raise exception 'FAIL anonymous zone function';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS TASK-TIME-V1: own clocks/zones, repeat carry across daylight changes, all-day clearing, revision protection, isolation, anonymous denial and v4 export' as result;
