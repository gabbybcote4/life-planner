-- VERSION: CALENDAR-PREVIEW-CHECKS-V1. Fictional records roll back.
begin;
insert into auth.users(id,email) values
 ('f932eb33-8222-4b11-8900-000000000001','preview-a@example.invalid'),
 ('f932eb33-8222-4b11-8900-000000000002','preview-b@example.invalid');
insert into public.tasks(id,user_id,title) values
 ('f932eb33-8222-4b11-8900-000000000011','f932eb33-8222-4b11-8900-000000000001','Visible weekly'),
 ('f932eb33-8222-4b11-8900-000000000012','f932eb33-8222-4b11-8900-000000000001','Fifth Saturday'),
 ('f932eb33-8222-4b11-8900-000000000021','f932eb33-8222-4b11-8900-000000000002','FOREIGN PREVIEW');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"f932eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare r jsonb;before_rows jsonb;child uuid;rev integer;n integer;
begin
 update public.tasks set due_date='2026-11-02',due_time='09:00',due_timezone='America/Edmonton',repeat_frequency='custom',repeat_rule='{"interval":2,"unit":"week","weekdays":[1,3],"monthly_mode":"date","ends":"after","end_date":null,"count":3}' where id='f932eb33-8222-4b11-8900-000000000011';
 update public.tasks set due_date='2026-01-31',repeat_frequency='custom',repeat_rule='{"interval":1,"unit":"month","weekdays":[],"monthly_mode":"weekday","ends":"never","end_date":null,"count":null}' where id='f932eb33-8222-4b11-8900-000000000012';
 select jsonb_agg(to_jsonb(t) order by id) into before_rows from public.tasks t;
 r=public.planner_calendar_repeats('2026-11-01');
 if (select count(*) from jsonb_array_elements(r) x where x->>'source_id'='f932eb33-8222-4b11-8900-000000000011')<>2
 or not exists(select 1 from jsonb_array_elements(r) x where x->>'due_date'='2026-11-04' and x->>'due_time'='09:00:00' and x->>'due_timezone'='America/Edmonton')
 or not exists(select 1 from jsonb_array_elements(r) x where x->>'due_date'='2026-11-16') or r::text like '%FOREIGN PREVIEW%' then raise exception 'FAIL upcoming weekly previews';end if;
 if before_rows is distinct from (select jsonb_agg(to_jsonb(t) order by id) from public.tasks t) then raise exception 'FAIL preview mutated tasks';end if;
 r=public.planner_calendar_repeats('2026-05-01');
 if not exists(select 1 from jsonb_array_elements(r) x where x->>'source_id'='f932eb33-8222-4b11-8900-000000000012' and x->>'due_date'='2026-05-30') then raise exception 'FAIL fifth weekday preview';end if;
 r=public.planner_calendar_repeats('2026-12-01');
 if exists(select 1 from jsonb_array_elements(r) x where x->>'source_id'='f932eb33-8222-4b11-8900-000000000011') then raise exception 'FAIL count ending preview';end if;
 select repeat_next_id into child from public.tasks where id='f932eb33-8222-4b11-8900-000000000011';
 update public.tasks set completed=true where id='f932eb33-8222-4b11-8900-000000000011';
 update public.tasks set completed=false where id='f932eb33-8222-4b11-8900-000000000011';
 r=public.planner_calendar_repeats('2026-11-01');
 if exists(select 1 from jsonb_array_elements(r) x where x->>'source_id'='f932eb33-8222-4b11-8900-000000000011' or x->>'due_date'='2026-11-04')
 or not exists(select 1 from jsonb_array_elements(r) x where x->>'source_id'=child::text and x->>'due_date'='2026-11-16') then raise exception 'FAIL saved successor replaces preview or reopened source duplicates';end if;
 update public.tasks set repeat_frequency='none',repeat_rule=null where id=child;
 r=public.planner_calendar_repeats('2026-11-01');
 if exists(select 1 from jsonb_array_elements(r) x where x->>'source_id'=child::text) then raise exception 'FAIL stopped repeat preview';end if;
 begin perform public.planner_calendar_repeats('2026-11-02');raise exception 'FAIL invalid month';exception when invalid_parameter_value then null;end;
 insert into public.planner_preferences(user_id) values(auth.uid());
 select planning_revision into rev from public.planner_preferences where user_id=auth.uid();
 if (select show_task_timezones from public.planner_preferences where user_id=auth.uid()) then raise exception 'FAIL time zones not hidden by default';end if;
 update public.planner_preferences set show_task_timezones=true where user_id=auth.uid() and planning_revision=rev;
 if not exists(select 1 from public.planner_preferences where user_id=auth.uid() and show_task_timezones and planning_revision=rev+1) then raise exception 'FAIL optional time zone save';end if;
 update public.planner_preferences set show_task_timezones=false where user_id=auth.uid() and planning_revision=rev;get diagnostics n=row_count;if n<>0 then raise exception 'FAIL stale zone setting';end if;
 if not exists(select 1 from public.tasks where id='f932eb33-8222-4b11-8900-000000000011' and due_timezone='America/Edmonton') then raise exception 'FAIL setting rewrote task zones';end if;
 r=public.planner_export_data();
 if (r->>'format_version')::integer not in(5,6) or r->'data'->'planner_preferences'->0->>'show_task_timezones' is distinct from 'true' then raise exception 'FAIL optional zone export';end if;
 -- The source bound fails instead of returning a partial calendar.
 insert into public.tasks(id,title) select gen_random_uuid(),'Bound fixture' from generate_series(1,201);
 update public.tasks set due_date='2026-11-01',repeat_frequency='daily' where title='Bound fixture';
 begin perform public.planner_calendar_repeats('2026-11-01');raise exception 'FAIL preview source bound';exception when program_limit_exceeded then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"f932eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$begin
 if public.planner_calendar_repeats('2026-11-01')<>'[]'::jsonb then raise exception 'FAIL account B preview isolation';end if;
 if exists(select 1 from public.planner_preferences) then raise exception 'FAIL account B settings isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform public.planner_calendar_repeats('2026-11-01');raise exception 'FAIL anonymous previews';exception when insufficient_privilege then null;end;
 begin perform 1 from public.planner_preferences;raise exception 'FAIL anonymous settings';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS CALENDAR-PREVIEW-V1: future repeats, times/endings, no mutation, saved replacement, no duplicates, bounds, optional zones, account isolation and v5 export' as result;
